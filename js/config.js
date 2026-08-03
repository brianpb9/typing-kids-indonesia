/**
 * Typing Kids Indonesia — Global configuration
 * Modes: easy | medium | hard | letters
 */
export const CONFIG = {
  app: {
    name: 'Poppu Typing Kids',
    subtitle: 'Belajar Mengetik Sambil Bermain',
    version: '1.9.0',
    language: 'id',
    brand: {
      line: 'Poppu World',
      url: 'https://www.poppu.world',
      mascotIdle: 'assets/brand/poppu/poppu-idle.png',
      mascotHappy: 'assets/brand/poppu/poppu-happy.png',
      icon192: 'assets/brand/poppu/icon-192.png',
      icon512: 'assets/brand/poppu/icon-512.png',
    },
  },

  speech: {
    lang: 'id-ID',
    rate: 0.8,
    pitch: 1.15,
    volume: 1,
    fallbackLangs: ['id-ID', 'id', 'ms-MY', 'en-US'],
  },

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
    hardTimerSeconds: 35,
  },

  /**
   * easy    — full word + big letter + slots + dim typed + letter TTS
   * medium  — full word + slots (no big letter)
   * hard    — image + voice + timer
   * letters — A–Z warm-up (single letter, no image)
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
      showFullWord: true,
      dimTypedLetters: true,
      showImage: true,
      speakLetterOnCorrect: true,
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
      showBigLetter: false,
      showSlots: true,
      showKbHint: false,
      showLetterProgress: true,
      showFullWord: true,
      dimTypedLetters: false,
      showImage: true,
      speakLetterOnCorrect: false,
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
      dimTypedLetters: false,
      showImage: true,
      speakLetterOnCorrect: false,
      showLabelAfterWrongs: 0,
      hintLetterAfterWrongs: 0,
      timerSeconds: 35,
    },
    letters: {
      id: 'letters',
      label: 'Huruf A–Z',
      emoji: '🔤',
      desc: 'Latihan huruf satu-satu',
      minLetters: 1,
      maxLetters: 1,
      showBigLetter: true,
      showSlots: false,
      showKbHint: true,
      showLetterProgress: false,
      showFullWord: false,
      dimTypedLetters: false,
      showImage: false,
      speakLetterOnCorrect: true,
      showLabelAfterWrongs: 0,
      hintLetterAfterWrongs: 2,
      timerSeconds: 0,
    },
  },

  categoryOptions: [
    { id: 'all', label: 'Campur', emoji: '🎲' },
    { id: 'buah', label: 'Buah', emoji: '🍎' },
    { id: 'hewan', label: 'Hewan', emoji: '🐱' },
    { id: 'sehari-hari', label: 'Sehari-hari', emoji: '🏠' },
    { id: 'kendaraan', label: 'Kendaraan', emoji: '🚗' },
    { id: 'warna', label: 'Warna', emoji: '🎨' },
    { id: 'makanan', label: 'Makanan', emoji: '🍚' },
    { id: 'tubuh', label: 'Tubuh', emoji: '👀' },
    { id: 'huruf-susah', label: 'Huruf susah', emoji: '🧩' },
  ],

  gameplay: {
    shuffleWords: true,
    avoidImmediateRepeat: true,
    minLetters: 3,
    maxLetters: 10,
    defaultDifficulty: 'easy',
    defaultCategory: 'all',
    minPoolSize: 5,
    hardBonusSeconds: 10,
    hardBonusTriggerAt: 5,
    progressiveDifficulty: true,
    /** Letters mode mission length (follows mission length pick) */
    lettersTarget: 10,
    /** Preload next N voice clips */
    preloadVoiceCount: 5,
    /** Mini mission (quick win for ages 5–6) */
    miniTarget: 5,
    fullTarget: 10,
    defaultMissionLength: 'full',
    /** Rare lucky star after combo ≥ this */
    luckyComboMin: 3,
    luckyChance: 0.18,
  },

  goals: {
    sessionTarget: 10,
    miniTarget: 5,
    milestoneAts: [3, 5, 8, 10],
    miniMilestoneAts: [2, 4, 5],
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
    categorySelect: true,
    parentDashboard: true,
    progressTracking: true,
    achievements: true,
    dailyChallenge: true,
    weeklyChallenge: true,
    englishMode: true,
    multiplayer: true,
    voicePacks: true,
    pwa: true,
    combo: true,
    parentShare: true,
    onScreenKeyboard: true,
    letterMode: true,
    certificate: true,
    analytics: true,
    journey: true,
    stickers: true,
    poppuTalk: true,
    miniMission: true,
  },
};

/**
 * @param {'easy'|'medium'|'hard'|'letters'|string} id
 */
export function getMode(id) {
  const modes = CONFIG.modes;
  if (id === 'all') return modes.hard;
  return modes[id] || modes.easy;
}

export default CONFIG;
