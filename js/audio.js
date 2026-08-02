/**
 * Audio — Web Audio SFX + robust Indonesian TTS (SpeechSynthesis)
 * Handles Chrome cancel/speak race, voice loading, Safari unlock.
 */
import { CONFIG } from './config.js';

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = CONFIG.audio.enabled;
    this.masterVolume = CONFIG.audio.masterVolume;
    /** Master mute — SFX + TTS */
    this.muted = false;
    this._speechReady =
      typeof window !== 'undefined' && 'speechSynthesis' in window;
    this._voices = [];
    this._preferredVoice = null;
    this._unlocked = false;
    /** Keep utterance ref so browser GC doesn't kill speech mid-sentence */
    this._currentUtterance = null;
    this._speakToken = 0;

    if (this._speechReady) {
      this._loadVoices();
      window.speechSynthesis.onvoiceschanged = () => this._loadVoices();
      // Some browsers only populate voices after a tick
      setTimeout(() => this._loadVoices(), 250);
      setTimeout(() => this._loadVoices(), 1000);
    }
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
        // Unlock speech pipeline (required on many browsers)
        window.speechSynthesis.cancel();
        const warm = new SpeechSynthesisUtterance(' ');
        warm.volume = 0.01;
        warm.rate = 1;
        warm.lang = CONFIG.speech.lang;
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

  _loadVoices() {
    if (!this._speechReady) return;
    this._voices = window.speechSynthesis.getVoices() || [];
    if (!this._voices.length) return;

    const score = (v) => {
      let s = 0;
      const lang = (v.lang || '').toLowerCase();
      const name = (v.name || '').toLowerCase();
      if (lang === 'id-id' || lang === 'id_id') s += 100;
      if (lang.startsWith('id')) s += 80;
      if (/indonesia|indonesian|bahasa/.test(name)) s += 70;
      if (lang.startsWith('ms')) s += 40; // Malay close enough for kids
      if (v.localService) s += 10;
      if (/google|premium|enhanced|natural/.test(name)) s += 5;
      return s;
    };

    const ranked = [...this._voices].sort((a, b) => score(b) - score(a));
    this._preferredVoice = ranked[0] && score(ranked[0]) > 0 ? ranked[0] : null;

    // Prefer any Indonesian if ranked fell through
    if (!this._preferredVoice) {
      this._preferredVoice =
        this._voices.find((v) => (v.lang || '').toLowerCase().startsWith('id')) ||
        this._voices.find((v) => /indonesia|indonesian|bahasa/i.test(v.name)) ||
        null;
    }
  }

  /**
   * Speak text with TTS (Indonesian preferred).
   * @param {string} text
   * @param {{ rate?: number, pitch?: number, force?: boolean }} [opts]
   * @returns {Promise<void>}
   */
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
          // Chrome bug: cancel() then immediate speak() often drops audio
          window.speechSynthesis.cancel();

          setTimeout(() => {
            if (token !== this._speakToken) {
              resolve();
              return;
            }

            // Chrome sometimes pauses the whole queue — resume
            try {
              window.speechSynthesis.resume();
            } catch {
              /* ignore */
            }

            const u = new SpeechSynthesisUtterance(clean);
            this._currentUtterance = u;

            const voice = this._preferredVoice;
            u.lang = voice?.lang || CONFIG.speech.lang || 'id-ID';
            u.rate = opts.rate ?? CONFIG.speech.rate ?? 0.85;
            u.pitch = opts.pitch ?? CONFIG.speech.pitch ?? 1.1;
            u.volume = CONFIG.speech.volume ?? 1;
            if (voice) u.voice = voice;

            let done = false;
            const finish = () => {
              if (done) return;
              done = true;
              if (this._currentUtterance === u) this._currentUtterance = null;
              resolve();
            };

            u.onend = finish;
            u.onerror = finish;

            window.speechSynthesis.speak(u);

            // Safety timeout (stuck speech on some OS)
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
   * Speak a game word clearly (slightly slower for kids).
   * @param {string} wordDisplay e.g. "Apel"
   */
  speakWord(wordDisplay) {
    return this.speak(wordDisplay, {
      rate: CONFIG.speech.rate ?? 0.85,
      pitch: CONFIG.speech.pitch ?? 1.1,
    });
  }

  /**
   * Speak praise cheerfully.
   * @param {string} text
   */
  speakPraise(text) {
    return this.speak(text, { rate: 1.0, pitch: 1.2 });
  }

  stopSpeech() {
    this._speakToken += 1;
    if (this._speechReady) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
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
