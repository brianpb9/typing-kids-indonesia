/**
 * Typing Kids Indonesia — Global configuration
 * Future-ready: difficulty, categories, language, features flags
 */
export const CONFIG = {
  app: {
    name: 'Typing Kids Indonesia',
    subtitle: 'Belajar Mengetik Sambil Bermain',
    version: '1.0.0',
    language: 'id',
  },

  /** Speech synthesis (TTS) */
  speech: {
    lang: 'id-ID',
    /** Slightly slow so kids hear every syllable */
    rate: 0.8,
    pitch: 1.15,
    volume: 1,
    /** Fallback langs if id-ID unavailable */
    fallbackLangs: ['id-ID', 'id', 'ms-MY', 'en-US'],
  },

  /** Timing (ms) */
  timing: {
    celebrationMs: 2200,
    nextWordDelayMs: 400,
    letterPopMs: 280,
    shakeMs: 320,
    speakDelayAfterLoadMs: 350,
  },

  /** Gameplay — future: difficulty filters letter length */
  gameplay: {
    shuffleWords: true,
    avoidImmediateRepeat: true,
    minLetters: 3,
    maxLetters: 10,
    /** null = all categories; future category select */
    activeCategories: null,
  },

  /** Audio SFX */
  audio: {
    masterVolume: 0.55,
    enabled: true,
  },

  /** UI */
  ui: {
    confettiCount: 80,
    starCount: 12,
    sparkleCount: 18,
  },

  /** Paths */
  paths: {
    wordsData: 'data/words.json',
  },

  /** Feature flags for future expansion (do not enable yet) */
  features: {
    difficultyLevels: false,
    categorySelect: false,
    parentDashboard: false,
    progressTracking: false,
    achievements: false,
    dailyChallenge: false,
    englishMode: false,
    multiplayer: false,
    voicePacks: false,
    pwa: false,
  },
};

export default CONFIG;
