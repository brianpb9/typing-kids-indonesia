/**
 * Typing Kids Indonesia — Global configuration
 * Modes: easy | medium | hard
 */
export const CONFIG = {
  app: {
    name: 'Typing Kids Indonesia',
    subtitle: 'Belajar Mengetik Sambil Bermain',
    version: '1.4.0',
    language: 'id',
  },

  speech: {
    lang: 'id-ID',
    rate: 0.8,
    pitch: 1.15,
    volume: 1,
    fallbackLangs: ['id-ID', 'id', 'ms-MY', 'en-US'],
  },

  /** Word data paths per language */
  languages: {
    id: { wordsPath: 'data/words.json', speechLang: 'id-ID' },
    en: { wordsPath: 'data/words-en.json', speechLang: 'en-US' },
  },

  timing: {
    celebrationMs: 2000,
    nextWordDelayMs: 350,
    letterPopMs: 280,
    shakeMs: 320,
    speakDelayAfterLoadMs: 350,
    milestoneMs: 1800,
    victoryHoldMs: 0,
    /** Hard mode: seconds per word (no-fail: timeout → soft skip, no star) */
    hardTimerSeconds: 35,
  },

  /**
   * Three play modes
   *
   * easy   — full word + big letter + slots
   * medium — full word + slots (no big letter cheat)
   * hard   — image + TTS only + timer (no full word, no slots)
   */
  modes: {
    easy: {
      id: 'easy',
      label: 'Mudah',
      emoji: '🌱',
      desc: 'Kata full + huruf besar',
      minLetters: 3,
      maxLetters: 6,
      showBigLetter: true,
      showSlots: true,
      showKbHint: true,
      showLetterProgress: true,
      /** Always show full word (Apel, Kucing, …) */
      showFullWord: true,
      showLabelAfterWrongs: 0,
      hintLetterAfterWrongs: 3,
      timerSeconds: 0,
    },
    medium: {
      id: 'medium',
      label: 'Sedang',
      emoji: '⚡',
      desc: 'Kata full · tanpa huruf satuan',
      minLetters: 4,
      maxLetters: 8,
      /** No big single-letter cheat tile */
      showBigLetter: false,
      showSlots: true,
      showKbHint: false,
      showLetterProgress: true,
      /** Full word always visible (e.g. APEL) */
      showFullWord: true,
      showLabelAfterWrongs: 0,
      hintLetterAfterWrongs: 0,
      timerSeconds: 0,
    },
    hard: {
      id: 'hard',
      label: 'Sulit',
      emoji: '🔥',
      desc: 'Gambar + suara + waktu',
      minLetters: 3,
      maxLetters: 10,
      showBigLetter: false,
      showSlots: false,
      showKbHint: false,
      showLetterProgress: false,
      showFullWord: false,
      showLabelAfterWrongs: 0,
      hintLetterAfterWrongs: 0,
      /** Per-word countdown; 0 = off */
      timerSeconds: 35,
    },
  },

  /** Category chips on start screen */
  categoryOptions: [
    { id: 'all', label: 'Campur', emoji: '🎲' },
    { id: 'buah', label: 'Buah', emoji: '🍎' },
    { id: 'hewan', label: 'Hewan', emoji: '🐱' },
    { id: 'sehari-hari', label: 'Sehari-hari', emoji: '🏠' },
    { id: 'kendaraan', label: 'Kendaraan', emoji: '🚗' },
    { id: 'warna', label: 'Warna', emoji: '🎨' },
    { id: 'makanan', label: 'Makanan', emoji: '🍚' },
    { id: 'tubuh', label: 'Tubuh', emoji: '👀' },
  ],

  gameplay: {
    shuffleWords: true,
    avoidImmediateRepeat: true,
    minLetters: 3,
    maxLetters: 10,
    defaultDifficulty: 'easy',
    defaultCategory: 'all',
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
