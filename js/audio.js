/**
 * Audio — Web Audio SFX + voice pack MP3 (preferred) + SpeechSynthesis fallback
 * Handles Chrome cancel/speak race, voice loading, Safari unlock.
 */
import { CONFIG } from './config.js';
import { warmFetch, swCacheUrls } from './cache.js';

const VOICE_MANIFEST = 'assets/audio/voice/manifest.json';

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = CONFIG.audio.enabled;
    this.masterVolume = CONFIG.audio.masterVolume;
    /** Master mute — SFX + TTS + pack */
    this.muted = false;
    this._speechReady =
      typeof window !== 'undefined' && 'speechSynthesis' in window;
    this._voices = [];
    this._preferredVoice = null;
    this._speechLang = CONFIG.speech.lang;
    this._fallbackLangs = CONFIG.speech.fallbackLangs;
    this._unlocked = false;
    /** Keep utterance ref so browser GC doesn't kill speech mid-sentence */
    this._currentUtterance = null;
    /** Main TTS token (words / praise) — soft letters never touch this */
    this._speakToken = 0;
    /** Soft letter TTS token — isolated from main speech */
    this._softToken = 0;
    this._mainSpeaking = false;

    /** @type {'id'|'en'} */
    this._langCode = 'id';
    /** @type {string|null} active friend companion (voice pool) */
    this._activeFriend = null;
    /** @type {{ id?: Record<string,string>, en?: Record<string,string>, meta?: object }|null} */
    this._voiceManifest = null;
    this._voicePackReady = false;
    /** @type {HTMLAudioElement|null} */
    this._packAudio = null;
    this._packToken = 0;
    /** @type {((playing:boolean)=>void)|null} */
    this.onSpeakingChange = null;
    /** Guard: don't cut word pack with letter TTS mid-play */
    this._wordPlayUntil = 0;
    this._letterQueue = Promise.resolve();

    /** SFX file pool (one element per src, reused) */
    this._sfxEls = new Map();
    /** Sources that failed to load (404/decode) — skip retry, use synth */
    this._sfxBroken = new Set();
    /** @type {HTMLAudioElement|null} background music loop */
    this._bgm = null;

    if (this._speechReady) {
      this._loadVoices();
      window.speechSynthesis.onvoiceschanged = () => this._loadVoices();
      setTimeout(() => this._loadVoices(), 250);
      setTimeout(() => this._loadVoices(), 1000);
    }
  }

  /**
   * Load offline voice pack manifest (non-blocking if missing).
   * @returns {Promise<boolean>}
   */
  async loadVoicePack() {
    if (!CONFIG.features?.voicePacks) {
      this._voicePackReady = false;
      return false;
    }
    try {
      const res = await fetch(VOICE_MANIFEST, { cache: 'force-cache' });
      if (!res.ok) throw new Error(`voice pack ${res.status}`);
      this._voiceManifest = await res.json();
      this._voicePackReady = Boolean(
        this._voiceManifest?.id || this._voiceManifest?.en
      );
      // Warm SW/browser cache for current language clips (non-blocking)
      if (this._voicePackReady) {
        this.warmVoiceCache().catch(() => {});
      }
      return this._voicePackReady;
    } catch {
      this._voiceManifest = null;
      this._voicePackReady = false;
      return false;
    }
  }

  /**
   * Fetch voice MP3s so SW + HTTP cache hold them for offline.
   * @param {number} [limit] 0 = all for current lang
   */
  async warmVoiceCache(limit = 0) {
    if (!this._voiceManifest) return;
    const bag = this._voiceManifest[this._langCode] || {};
    let paths = Object.values(bag).filter((p) => typeof p === 'string');
    if (limit > 0) paths = paths.slice(0, limit);
    swCacheUrls(paths);
    await warmFetch(paths, { concurrency: 6 });
  }

  /**
   * @param {'id'|'en'|string} code
   */
  setLangCode(code) {
    this._langCode = code === 'en' ? 'en' : 'id';
  }

  /** Call on first user gesture to unlock audio + speech */
  unlock() {
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.01);
      this._unlocked = true;
    } catch {
      this.enabled = false;
    }

    if (this._speechReady) {
      try {
        window.speechSynthesis.cancel();
        const warm = new SpeechSynthesisUtterance(' ');
        warm.volume = 0.01;
        warm.rate = 1;
        warm.lang = this._speechLang || CONFIG.speech.lang;
        window.speechSynthesis.speak(warm);
        window.speechSynthesis.cancel();
        this._loadVoices();
      } catch {
        /* ignore */
      }
    }

    // BGM loop starts with the first user gesture (autoplay policy)
    this.startBgm();
  }

  /**
   * Play an SFX/voice file once. Resolves false when the file is missing
   * or playback is blocked so callers can fall back to WebAudio synth.
   * @param {string} src
   * @param {{ volume?: number }} [opts]
   * @returns {Promise<boolean>}
   */
  playFile(src, opts = {}) {
    if (this.muted || !src) return Promise.resolve(false);
    if (this._sfxBroken.has(src)) return Promise.resolve(false);
    return new Promise((resolve) => {
      try {
        let a = this._sfxEls.get(src);
        if (!a) {
          a = new Audio(src);
          a.preload = 'auto';
          a.addEventListener('error', () => this._sfxBroken.add(src));
          this._sfxEls.set(src, a);
        }
        a.volume = Math.min(1, (opts.volume ?? 1) * this.masterVolume * 1.6);
        let done = false;
        const finish = (ok) => {
          if (done) return;
          done = true;
          clearTimeout(watchdog);
          resolve(ok);
        };
        // Watchdog: a play() promise that never settles must not hang the
        // caller — fall back to synth after ~3s (mirrors playPacked).
        const watchdog = setTimeout(() => finish(false), 3000);
        a.currentTime = 0;
        const p = a.play();
        if (p && typeof p.then === 'function') {
          p.then(() => finish(true)).catch((err) => {
            // AbortError here means our own currentTime reset (rapid re-click)
            // or mute pause superseded this play — the element is (re)playing,
            // so don't fire the synth fallback on top of the file.
            finish(Boolean(err && err.name === 'AbortError'));
          });
        } else {
          finish(true);
        }
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Try an SFX file from CONFIG.assets.sfx; run synth fallback when it fails.
   * @param {string} name key in CONFIG.assets.sfx
   * @param {() => void} fallback synth path
   */
  _sfx(name, fallback) {
    const src = CONFIG.assets?.sfx?.[name];
    if (!src) {
      fallback();
      return;
    }
    this.playFile(src).then((ok) => {
      if (!ok) fallback();
    });
  }

  /**
   * Active friend companion ('zaza'|'peeky'|'orby'|'puffy'|null) — its voice
   * pool plays first in playVoiceReaction; Poppu stays the fallback.
   * @param {string|null} id
   */
  setActiveFriend(id) {
    this._activeFriend = typeof id === 'string' && id ? id : null;
  }

  /**
   * Random Poppu voice reaction clip for the current language.
   * @param {'correct'|'stuck'|'leveldone'|'hello'} kind
   * @param {string|null} [friendId] override active friend (default: active)
   * @returns {Promise<boolean>} true when a clip actually played
   */
  playVoiceReaction(kind, friendId = this._activeFriend) {
    if (this.muted) return Promise.resolve(false);
    const v = CONFIG.assets?.voice;
    if (!v) return Promise.resolve(false);
    // Active friend pool first (Puffy has none → falls through to Poppu)
    const fp = v.friends?.[friendId];
    if (fp) {
      const nums = fp[kind];
      if (Array.isArray(nums) && nums.length) {
        const n = nums[Math.floor(Math.random() * nums.length)];
        const fileKind = kind === 'stuck' ? 'hmm' : kind;
        return this.playFile(
          `${v.dir}/vo_${friendId}_${fileKind}_${n}_${this._langCode}.mp3`,
          { volume: 1.2 }
        );
      }
    }
    let nums = v[kind];
    if (kind === 'leveldone') {
      nums = v.leveldone?.[this._langCode] || v.leveldone?.en;
    }
    if (!Array.isArray(nums) || !nums.length) return Promise.resolve(false);
    const n = nums[Math.floor(Math.random() * nums.length)];
    return this.playFile(`${v.dir}/vo_${kind}_${n}_${this._langCode}.mp3`, {
      volume: 1.2,
    });
  }

  /** Friend one-off celebration clip (e.g. Peeky's ta-da) if the pool has one */
  playFriendTada() {
    if (this.muted) return Promise.resolve(false);
    const src = CONFIG.assets?.voice?.friends?.[this._activeFriend]?.tada;
    if (!src) return Promise.resolve(false);
    return this.playFile(src, { volume: 1.2 });
  }

  /**
   * Background music loop — starts after first gesture (autoplay policy),
   * respects the master mute toggle.
   */
  startBgm() {
    if (this.muted) return;
    const src = CONFIG.assets?.bgm;
    if (!src) return;
    try {
      if (!this._bgm) {
        const a = new Audio(src);
        a.loop = true;
        // Master-volume-scaled like SFX/voice (0.45 × 0.55 ≈ the old 0.25)
        a.volume = Math.min(1, 0.45 * this.masterVolume);
        a.preload = 'auto';
        this._bgm = a;
      }
      if (this._bgm.paused) {
        this._bgm.play().catch(() => {});
      }
    } catch {
      /* ignore */
    }
  }

  stopBgm() {
    if (!this._bgm) return;
    try {
      this._bgm.pause();
    } catch {
      /* ignore */
    }
  }

  _ensureCtx() {
    if (!this.enabled) return null;
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Switch TTS language (id-ID / en-US)
   * @param {string} langBcp47
   * @param {string[]} [fallbackLangs]
   */
  setSpeechLang(langBcp47, fallbackLangs = null) {
    this._speechLang = langBcp47 || CONFIG.speech.lang;
    this._fallbackLangs = fallbackLangs || CONFIG.speech.fallbackLangs;
    this._loadVoices();
  }

  _loadVoices() {
    if (!this._speechReady) return;
    this._voices = window.speechSynthesis.getVoices() || [];
    if (!this._voices.length) return;

    const prefer = (this._speechLang || CONFIG.speech.lang || 'id-ID').toLowerCase();
    const preferRoot = prefer.slice(0, 2);
    const fallbacks = (this._fallbackLangs || CONFIG.speech.fallbackLangs || []).map(
      (l) => l.toLowerCase()
    );

    const score = (v) => {
      let s = 0;
      const lang = (v.lang || '').toLowerCase();
      const name = (v.name || '').toLowerCase();
      if (lang === prefer) s += 120;
      if (lang.startsWith(preferRoot)) s += 90;
      if (fallbacks.some((f) => lang === f || lang.startsWith(f.slice(0, 2)))) s += 40;
      if (preferRoot === 'id') {
        if (/indonesia|indonesian|bahasa/.test(name)) s += 70;
        if (lang.startsWith('ms')) s += 30;
      }
      if (preferRoot === 'en') {
        if (/english|us english|uk english|samantha|daniel|karen/.test(name)) s += 20;
      }
      if (v.localService) s += 10;
      if (/google|premium|enhanced|natural/.test(name)) s += 5;
      return s;
    };

    const ranked = [...this._voices].sort((a, b) => score(b) - score(a));
    this._preferredVoice = ranked[0] && score(ranked[0]) > 0 ? ranked[0] : null;
  }

  /**
   * @param {boolean} muted
   */
  setMuted(muted) {
    this.muted = Boolean(muted);
    if (this.muted) {
      this.stopSpeech();
      this.stopBgm();
      // Pause in-flight pooled SFX too (elements stay pooled for reuse)
      for (const a of this._sfxEls.values()) {
        try {
          a.pause();
        } catch {
          /* ignore */
        }
      }
    } else {
      this.startBgm();
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * Resolve packed clip path by key (word id or phrase key like _praise_great)
   * @param {string} key
   * @returns {string|null}
   */
  _packPath(key) {
    if (!this._voicePackReady || !this._voiceManifest || !key) return null;
    const bag = this._voiceManifest[this._langCode] || {};
    return bag[key] || null;
  }

  /**
   * Paths for preloading upcoming words
   * @param {string[]} ids
   * @returns {string[]}
   */
  packPathsForIds(ids) {
    return (ids || []).map((id) => this._packPath(id)).filter(Boolean);
  }

  _setSpeaking(playing) {
    try {
      this.onSpeakingChange?.(Boolean(playing));
    } catch {
      /* ignore */
    }
  }

  /**
   * Play a packed MP3 if present.
   * @param {string} key word id or _phrase
   * @returns {Promise<boolean>} true if played from pack
   */
  /**
   * True while a word (pack or main TTS) should not be interrupted by letter TTS
   */
  isWordPlaying() {
    return (
      performance.now() < this._wordPlayUntil ||
      this._mainSpeaking ||
      Boolean(this._packAudio && !this._packAudio.paused)
    );
  }

  playPacked(key, opts = {}) {
    if (this.muted) return Promise.resolve(false);
    const src = this._packPath(key);
    if (!src) return Promise.resolve(false);

    const token = ++this._packToken;
    // Stop TTS so they don't overlap pack (unless soft letter mode)
    if (this._speechReady && !opts.keepTts) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    }

    return new Promise((resolve) => {
      try {
        if (this._packAudio) {
          try {
            this._packAudio.pause();
          } catch {
            /* ignore */
          }
        }
        const a = new Audio(src);
        a.volume = Math.min(1, this.masterVolume * 1.35);
        this._packAudio = a;
        this._setSpeaking(true);
        if (opts.protectWord) {
          this._wordPlayUntil = performance.now() + 3500;
        }
        const finish = (ok) => {
          if (token !== this._packToken) {
            resolve(false);
            return;
          }
          if (this._packAudio === a) this._packAudio = null;
          if (opts.protectWord) {
            this._wordPlayUntil = Math.min(this._wordPlayUntil, performance.now());
          }
          this._setSpeaking(false);
          resolve(ok);
        };
        a.onended = () => finish(true);
        a.onerror = () => finish(false);
        const p = a.play();
        if (p && typeof p.then === 'function') {
          p.catch(() => finish(false));
        }
        setTimeout(() => finish(false), 8000);
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Speak text with TTS.
   * @param {string} text
   * @param {{ rate?: number, pitch?: number, force?: boolean }} [opts]
   * @returns {Promise<void>}
   */
  /**
   * Main TTS (words / praise). Soft letters never use this path.
   * @param {string} text
   * @param {{ rate?: number, pitch?: number, force?: boolean }} [opts]
   */
  speak(text, opts = {}) {
    if (this.muted && !opts.force) return Promise.resolve();
    if (!this._speechReady || !text) return Promise.resolve();

    this._loadVoices();
    const token = ++this._speakToken;
    // Bump soft token so pending soft letters abort quietly
    this._softToken += 1;
    const clean = String(text).trim();
    if (!clean) return Promise.resolve();

    return new Promise((resolve) => {
      try {
        window.speechSynthesis.cancel();

        setTimeout(() => {
          if (token !== this._speakToken) {
            resolve();
            return;
          }

          try {
            window.speechSynthesis.resume();
          } catch {
            /* ignore */
          }

          const u = new SpeechSynthesisUtterance(clean);
          this._currentUtterance = u;
          this._mainSpeaking = true;
          this._wordPlayUntil = Math.max(
            this._wordPlayUntil,
            performance.now() + Math.max(1200, clean.length * 280)
          );
          this._setSpeaking(true);

          const voice = this._preferredVoice;
          u.lang =
            voice?.lang || this._speechLang || CONFIG.speech.lang || 'id-ID';
          u.rate = opts.rate ?? CONFIG.speech.rate ?? 0.85;
          u.pitch = opts.pitch ?? CONFIG.speech.pitch ?? 1.1;
          u.volume = CONFIG.speech.volume ?? 1;
          if (voice) u.voice = voice;

          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            if (this._currentUtterance === u) this._currentUtterance = null;
            this._mainSpeaking = false;
            this._setSpeaking(false);
            resolve();
          };

          u.onend = finish;
          u.onerror = finish;

          window.speechSynthesis.speak(u);
          setTimeout(finish, Math.max(2500, clean.length * 400));
        }, 60);
      } catch {
        this._mainSpeaking = false;
        resolve();
      }
    });
  }

  /**
   * Soft letter TTS — isolated token; never cancels main speak/pack.
   * @param {string} text
   */
  _speakSoft(text) {
    if (this.muted || !this._speechReady || !text) return Promise.resolve();
    if (this.isWordPlaying()) return Promise.resolve();

    this._loadVoices();
    const token = ++this._softToken;
    const clean = String(text).trim();

    return new Promise((resolve) => {
      try {
        // Do NOT cancel — would kill main word TTS. Soft utterances queue.
        const u = new SpeechSynthesisUtterance(clean);
        const voice = this._preferredVoice;
        u.lang =
          voice?.lang || this._speechLang || CONFIG.speech.lang || 'id-ID';
        u.rate = 1.05;
        u.pitch = 1.15;
        u.volume = Math.min(1, (CONFIG.speech.volume ?? 1) * 0.8);
        if (voice) u.voice = voice;

        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          resolve();
        };

        u.onend = finish;
        u.onerror = finish;

        // Abort if superseded by newer soft letter or main speech started
        const poll = setInterval(() => {
          if (token !== this._softToken || this._mainSpeaking) {
            clearInterval(poll);
            finish();
          }
        }, 80);

        window.speechSynthesis.speak(u);
        setTimeout(() => {
          clearInterval(poll);
          finish();
        }, 1800);
      } catch {
        resolve();
      }
    });
  }

  /**
   * Speak a game word — pack first, then TTS. Protects from letter TTS cut-off.
   * @param {string} wordDisplay e.g. "Apel"
   * @param {string} [wordId] e.g. "apel"
   */
  async speakWord(wordDisplay, wordId = '') {
    if (this.muted) return;
    const id =
      wordId ||
      String(wordDisplay || '')
        .toLowerCase()
        .replace(/\s+/g, '');
    this._wordPlayUntil = performance.now() + 4500;
    this._softToken += 1; // drop pending soft letters
    const played = await this.playPacked(id, { protectWord: true });
    if (played) return;
    return this.speak(wordDisplay, {
      rate: CONFIG.speech.rate ?? 0.85,
      pitch: CONFIG.speech.pitch ?? 1.1,
    });
  }

  /**
   * Soft letter name — skipped while word is playing; isolated from main TTS token.
   * @param {string} spokenName e.g. "be" or "B"
   */
  speakLetter(spokenName) {
    if (this.muted || !spokenName) return Promise.resolve();
    if (this.isWordPlaying()) return Promise.resolve();
    this._letterQueue = this._letterQueue
      .then(() => this._speakSoft(spokenName))
      .catch(() => {});
    return this._letterQueue;
  }

  /**
   * Praise after a short delay so last letter TTS can finish.
   * @param {string} text
   * @param {{ delayMs?: number }} [opts]
   */
  async speakPraise(text, opts = {}) {
    if (this.muted) return;
    const delay = opts.delayMs ?? 280;
    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay));
    }
    if (this.muted) return;
    const t = String(text || '').toLowerCase();
    let key = null;
    if (/juara|champion|hebat sekali|amazing/.test(t)) key = '_praise_win';
    else if (/hebat|great|bagus|awesome|nice|keren/.test(t)) key = '_praise_great';
    else if (/mantap|yes|good|wow|super/.test(t)) key = '_praise_good';

    if (key) {
      // Poppu voice reaction first (win → level-done clips), then pack, then TTS
      const voKind = key === '_praise_win' ? 'leveldone' : 'correct';
      if (await this.playVoiceReaction(voKind)) return;
      const played = await this.playPacked(key);
      if (played) return;
    }
    return this.speak(text, { rate: 1.0, pitch: 1.2 });
  }

  /**
   * Optional phrase keys: _bonus, _timeout
   * @param {'bonus'|'timeout'} kind
   * @param {string} fallbackText
   */
  async speakPhrase(kind, fallbackText) {
    if (this.muted) return;
    const key = kind === 'bonus' ? '_bonus' : kind === 'timeout' ? '_timeout' : null;
    if (key) {
      const played = await this.playPacked(key);
      if (played) return;
    }
    if (fallbackText) return this.speak(fallbackText);
  }

  stopSpeech() {
    this._speakToken += 1;
    this._softToken += 1;
    this._packToken += 1;
    this._mainSpeaking = false;
    this._wordPlayUntil = 0;
    if (this._speechReady) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    }
    if (this._packAudio) {
      try {
        this._packAudio.pause();
      } catch {
        /* ignore */
      }
      this._packAudio = null;
    }
    this._currentUtterance = null;
    this._setSpeaking(false);
  }

  /** Soft click for UI */
  playClick() {
    if (this.muted) return;
    this._sfx('click', () => {
      this._tone({ freq: 520, duration: 0.06, type: 'sine', vol: 0.15, attack: 0.005, decay: 0.05 });
    });
  }

  playCorrect() {
    if (this.muted) return;
    this._sfx('correct', () => {
      this._tone({ freq: 660, duration: 0.1, type: 'sine', vol: 0.22, attack: 0.005, decay: 0.09 });
      setTimeout(() => {
        if (this.muted) return;
        this._tone({ freq: 880, duration: 0.12, type: 'sine', vol: 0.18, attack: 0.005, decay: 0.1 });
      }, 40);
    });
  }

  playWrong() {
    if (this.muted) return;
    this._sfx('wrong', () => {
      this._tone({ freq: 280, duration: 0.12, type: 'triangle', vol: 0.12, attack: 0.01, decay: 0.1 });
    });
  }

  playSparkle() {
    if (this.muted) return;
    this._sfx('milestone', () => {
      const notes = [880, 1100, 1320, 1760];
      notes.forEach((freq, i) => {
        setTimeout(() => {
          if (this.muted) return;
          this._tone({ freq, duration: 0.15, type: 'sine', vol: 0.1, attack: 0.005, decay: 0.12 });
        }, i * 45);
      });
    });
  }

  playCelebration() {
    if (this.muted) return;
    this._sfx('win', () => {
      const melody = [523, 659, 784, 1047];
      melody.forEach((freq, i) => {
        setTimeout(() => {
          if (this.muted) return;
          this._tone({ freq, duration: 0.2, type: 'sine', vol: 0.2, attack: 0.01, decay: 0.18 });
        }, i * 90);
      });
    });
  }

  /** Rising combo chime — star 1/2/3 clips by combo level */
  playCombo(level = 1) {
    if (this.muted) return;
    const star = Math.max(1, Math.min(3, Math.round(level)));
    this._sfx(`star${star}`, () => {
      const base = 660 + Math.min(level, 8) * 40;
      this._tone({ freq: base, duration: 0.08, type: 'sine', vol: 0.16, attack: 0.005, decay: 0.07 });
      setTimeout(() => {
        if (this.muted) return;
        this._tone({
          freq: base * 1.25,
          duration: 0.1,
          type: 'sine',
          vol: 0.14,
          attack: 0.005,
          decay: 0.09,
        });
      }, 50);
    });
  }

  /**
   * @param {{ freq: number, duration: number, type?: OscillatorType, vol?: number, attack?: number, decay?: number }} p
   */
  _tone({ freq, duration, type = 'sine', vol = 0.2, attack = 0.01, decay = 0.1 }) {
    if (this.muted) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    const peak = vol * this.masterVolume;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }
}

export default AudioManager;
