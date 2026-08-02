/**
 * Typing Kids Indonesia — Global configuration
 * Modes: easy | medium | hard
 */
export const CONFIG = {
  app: {
    name: 'Typing Kids Indonesia',
    subtitle: 'Belajar Mengetik Sambil Bermain',
    version: '1.2.0',
    language: 'id',
  },

  speech: {
    lang: 'id-ID',
    rate: 0.8,
    pitch: 1.15,
    volume: 1,
    fallbackLangs: ['id-ID', 'id', 'ms-MY', 'en-US'],
  },

  timing: {
    celebrationMs: 2000,
    nextWordDelayMs: 350,
    letterPopMs: 280,
    shakeMs: 320,
    speakDelayAfterLoadMs: 350,
    milestoneMs: 1800,
    victoryHoldMs: 0,
  },

  /**
   * Three play modes (UI + word length)
   *
   * easy   — big letter hint + slots + label after wrongs (kids 5–6)
   * medium — slots only, NO big single-letter cheat
   * hard   — image + TTS only (no slots, no letter hints)
   */
  modes: {
    easy: {
      id: 'easy',
      label: 'Mudah',
      emoji: '🌱',
      desc: 'Huruf besar + kotak',
      minLetters: 3,
      maxLetters: 6,
      showBigLetter: true,
      showSlots: true,
      showKbHint: true,
      showLetterProgress: true,
      /** Reveal word name after N wrongs (0 = never in this mode helper) */
      showLabelAfterWrongs: 4,
      /** Tell child which letter to find after wrongs */
      hintLetterAfterWrongs: 3,
    },
    medium: {
      id: 'medium',
      label: 'Sedang',
      emoji: '⚡',
      desc: 'Tanpa huruf besar',
      minLetters: 4,
      maxLetters: 8,
      showBigLetter: false,
      showSlots: true,
      showKbHint: false,
      showLetterProgress: true,
      showLabelAfterWrongs: 6,
      hintLetterAfterWrongs: 0, // never name the letter
    },
    hard: {
      id: 'hard',
      label: 'Sulit',
      emoji: '🔥',
      desc: 'Gambar + suara saja',
      minLetters: 3,
      maxLetters: 10,
      showBigLetter: false,
      showSlots: false,
      showKbHint: false,
      showLetterProgress: false,
      showLabelAfterWrongs: 0, // never show word name
      hintLetterAfterWrongs: 0,
    },
  },

  gameplay: {
    shuffleWords: true,
    avoidImmediateRepeat: true,
    minLetters: 3,
    maxLetters: 10,
    defaultDifficulty: 'easy',
    activeCategories: null,
  },

  goals: {
    sessionTarget: 10,
    milestones: [
      { at: 3, title: 'Bagus!', subtitle: '3 bintang! Terus kejar~', trophy: '🥉' },
      { at: 5, title: 'Setengah jalan!', subtitle: '5 bintang! 5 lagi juara!', trophy: '🥈' },
      { at: 8, title: 'Hampir juara!', subtitle: '2 bintang lagi!', trophy: '⭐' },
      { at: 10, title: 'JUARA!', subtitle: 'Misi selesai! Hebat sekali!', trophy: '🏆' },
    ],
    ranks: [
      { min: 0, id: 'pemula', label: 'Pemula', emoji: '🌱' },
      { min: 10, id: 'petarung', label: 'Petarung', emoji: '💪' },
      { min: 30, id: 'juara', label: 'Juara', emoji: '🏆' },
      { min: 60, id: 'superstar', label: 'Superstar', emoji: '🌟' },
      { min: 100, id: 'legenda', label: 'Legenda', emoji: '👑' },
    ],
  },

  audio: {
    masterVolume: 0.55,
    enabled: true,
  },

  ui: {
    confettiCount: 80,
    starCount: 12,
    sparkleCount: 18,
    victoryConfetti: 120,
  },

  paths: {
    wordsData: 'data/words.json',
  },

  storage: {
    key: 'typingKidsID_v1',
  },

  features: {
    difficultyLevels: true,
    categorySelect: false,
    parentDashboard: false,
    progressTracking: true,
    achievements: true,
    dailyChallenge: false,
    englishMode: false,
    multiplayer: false,
    voicePacks: false,
    pwa: false,
  },
};

/**
 * @param {'easy'|'medium'|'hard'|string} id
 */
export function getMode(id) {
  const modes = CONFIG.modes;
  if (id === 'all') return modes.hard; // migrate old save
  return modes[id] || modes.easy;
}

export default CONFIG;
