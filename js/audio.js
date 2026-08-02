/**
 * Audio — Web Audio SFX + voice pack MP3 (preferred) + SpeechSynthesis fallback
 * Handles Chrome cancel/speak race, voice loading, Safari unlock.
 */
import { CONFIG } from './config.js';

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
    this._speakToken = 0;

    /** @type {'id'|'en'} */
    this._langCode = 'id';
    /** @type {{ id?: Record<string,string>, en?: Record<string,string>, meta?: object }|null} */
    this._voiceManifest = null;
    this._voicePackReady = false;
    /** @type {HTMLAudioElement|null} */
    this._packAudio = null;
    this._packToken = 0;
    /** @type {((playing:boolean)=>void)|null} */
    this.onSpeakingChange = null;

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
      return this._voicePackReady;
    } catch {
      this._voiceManifest = null;
      this._voicePackReady = false;
      return false;
    }
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
    if (this.muted) this.stopSpeech();
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
  playPacked(key) {
    if (this.muted) return Promise.resolve(false);
    const src = this._packPath(key);
    if (!src) return Promise.resolve(false);

    const token = ++this._packToken;
    // Stop TTS so they don't overlap
    if (this._speechReady) {
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
        const finish = (ok) => {
          if (token !== this._packToken) {
            resolve(false);
            return;
          }
          if (this._packAudio === a) this._packAudio = null;
          this._setSpeaking(false);
          resolve(ok);
        };
        a.onended = () => finish(true);
        a.onerror = () => finish(false);
        const p = a.play();
        if (p && typeof p.then === 'function') {
          p.catch(() => finish(false));
        }
        setTimeout(() => finish(true), 8000);
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
  speak(text, opts = {}) {
    if (this.muted && !opts.force) return Promise.resolve();
    if (!this._speechReady || !text) return Promise.resolve();

    this._loadVoices();
    const token = ++this._speakToken;
    const clean = String(text).trim();
    if (!clean) return Promise.resolve();

    return new Promise((resolve) => {
      const run = () => {
        if (token !== this._speakToken) {
          resolve();
          return;
        }

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
              this._setSpeaking(false);
              resolve();
            };

            u.onend = finish;
            u.onerror = finish;

            window.speechSynthesis.speak(u);
            setTimeout(finish, Math.max(4000, clean.length * 500));
          }, 60);
        } catch {
          resolve();
        }
      };

      run();
    });
  }

  /**
   * Speak a game word — pack first, then TTS.
   * @param {string} wordDisplay e.g. "Apel"
   * @param {string} [wordId] e.g. "apel"
   */
  async speakWord(wordDisplay, wordId = '') {
    if (this.muted) return;
    const id = wordId || String(wordDisplay || '').toLowerCase().replace(/\s+/g, '');
    const played = await this.playPacked(id);
    if (played) return;
    return this.speak(wordDisplay, {
      rate: CONFIG.speech.rate ?? 0.85,
      pitch: CONFIG.speech.pitch ?? 1.1,
    });
  }

  /**
   * Speak a single letter name (for Easy letter feedback / letters mode)
   * @param {string} spokenName e.g. "be" or "B"
   */
  speakLetter(spokenName) {
    if (this.muted || !spokenName) return Promise.resolve();
    return this.speak(spokenName, { rate: 1.05, pitch: 1.15 });
  }

  /**
   * Speak praise cheerfully — try common pack phrases when text matches.
   * @param {string} text
   */
  async speakPraise(text) {
    if (this.muted) return;
    const t = String(text || '').toLowerCase();
    let key = null;
    if (/juara|champion|hebat sekali|amazing/.test(t)) key = '_praise_win';
    else if (/hebat|great|bagus|awesome|nice|keren/.test(t)) key = '_praise_great';
    else if (/mantap|yes|good|wow|super/.test(t)) key = '_praise_good';

    if (key) {
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
    this._packToken += 1;
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
  }

  /** Soft click for UI */
  playClick() {
    if (this.muted) return;
    this._tone({ freq: 520, duration: 0.06, type: 'sine', vol: 0.15, attack: 0.005, decay: 0.05 });
  }

  playCorrect() {
    if (this.muted) return;
    this._tone({ freq: 660, duration: 0.1, type: 'sine', vol: 0.22, attack: 0.005, decay: 0.09 });
    setTimeout(() => {
      if (this.muted) return;
      this._tone({ freq: 880, duration: 0.12, type: 'sine', vol: 0.18, attack: 0.005, decay: 0.1 });
    }, 40);
  }

  playWrong() {
    if (this.muted) return;
    this._tone({ freq: 280, duration: 0.12, type: 'triangle', vol: 0.12, attack: 0.01, decay: 0.1 });
  }

  playSparkle() {
    if (this.muted) return;
    const notes = [880, 1100, 1320, 1760];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (this.muted) return;
        this._tone({ freq, duration: 0.15, type: 'sine', vol: 0.1, attack: 0.005, decay: 0.12 });
      }, i * 45);
    });
  }

  playCelebration() {
    if (this.muted) return;
    const melody = [523, 659, 784, 1047];
    melody.forEach((freq, i) => {
      setTimeout(() => {
        if (this.muted) return;
        this._tone({ freq, duration: 0.2, type: 'sine', vol: 0.2, attack: 0.01, decay: 0.18 });
      }, i * 90);
    });
  }

  /** Rising combo chime */
  playCombo(level = 1) {
    if (this.muted) return;
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
