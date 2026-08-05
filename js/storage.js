/**
 * Local progress — stars, mute, mode, category, language, tutorial, daily, streak, class, mastery, a11y
 */
import { CONFIG, getMode } from './config.js';

const KEY = CONFIG.storage.key;

/** In-memory mirror — keeps progress alive when localStorage fails (private mode) */
let memFallback = null;

/**
 * @typedef {{
 *   totalStars: number,
 *   missionsWon: number,
 *   muted: boolean,
 *   difficulty: string,
 *   category: string,
 *   language: 'id'|'en',
 *   tutorialDone: boolean,
 *   tutorialDoneEn: boolean,
 *   daily: { key: string, completed: boolean, stars: number },
 *   weekly: { key: string, completed: boolean, stars: number },
 *   streak: { current: number, best: number, lastDay: string },
 *   classCode: string,
 *   bestCombo: number,
 *   achievements: string[],
 *   mastery: Record<string, { count: number, last: number }>,
 *   stats: { keys: number, wrong: number, playMs: number },
 *   a11y: { highContrast: boolean, largeText: boolean },
 *   analyticsOptIn: boolean,
 *   analyticsEvents: Array<{name:string,props:object,t:number}>,
 *   classBoard: Record<string, Array<{name:string,stars:number,at:number}>>,
 *   lettersDone: boolean,
 *   playerName: string,
 *   childName: string,
 * }} SaveData
 */

/** @returns {SaveData} */
function defaults() {
  return {
    totalStars: 0,
    missionsWon: 0,
    muted: false,
    difficulty: CONFIG.gameplay.defaultDifficulty,
    category: CONFIG.gameplay.defaultCategory || 'all',
    language: 'id',
    tutorialDone: false,
    tutorialDoneEn: false,
    daily: { key: '', completed: false, stars: 0 },
    weekly: { key: '', completed: false, stars: 0 },
    streak: { current: 0, best: 0, lastDay: '' },
    classCode: '',
    bestCombo: 0,
    achievements: [],
    mastery: {},
    stats: { keys: 0, wrong: 0, playMs: 0 },
    a11y: { highContrast: false, largeText: false },
    analyticsOptIn: false,
    analyticsEvents: [],
    classBoard: {},
    lettersDone: false,
    playerName: '',
    childName: '',
  };
}

/**
 * Letter warm-up mastery ids (`letter-a`…) are not words —
 * excluded from sticker/word counts but still recorded.
 * @param {string} id
 */
export function isLetterMasteryId(id) {
  return typeof id === 'string' && id.startsWith('letter-');
}

/**
 * Friend character sticker ids (`char-peeky`…) are not words either —
 * excluded from word/mastery counts like letter warm-up ids.
 * @param {string} id
 */
export function isCharMasteryId(id) {
  return typeof id === 'string' && id.startsWith('char-');
}

function normalizeDifficulty(d) {
  if (d === 'medium' || d === 'hard' || d === 'easy' || d === 'letters') return d;
  if (d === 'all') return 'hard';
  return 'easy';
}

function normalizeLang(l) {
  return l === 'en' ? 'en' : 'id';
}

/** @returns {SaveData} */
export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return memFallback || defaults();
    const parsed = JSON.parse(raw);
    const base = { ...defaults(), ...parsed };
    base.difficulty = normalizeDifficulty(base.difficulty);
    base.language = normalizeLang(base.language);
    if (!base.category) base.category = 'all';
    if (!base.daily || typeof base.daily !== 'object') base.daily = defaults().daily;
    if (!base.weekly || typeof base.weekly !== 'object') base.weekly = defaults().weekly;
    if (!base.streak || typeof base.streak !== 'object') base.streak = defaults().streak;
    if (!Array.isArray(base.achievements)) base.achievements = [];
    if (!base.mastery || typeof base.mastery !== 'object') base.mastery = {};
    if (!base.stats || typeof base.stats !== 'object') base.stats = defaults().stats;
    if (!base.a11y || typeof base.a11y !== 'object') base.a11y = defaults().a11y;
    if (!base.classBoard || typeof base.classBoard !== 'object') base.classBoard = {};
    if (!Array.isArray(base.analyticsEvents)) base.analyticsEvents = [];
    if (typeof base.classCode !== 'string') base.classCode = '';
    if (typeof base.bestCombo !== 'number') base.bestCombo = 0;
    if (typeof base.analyticsOptIn !== 'boolean') base.analyticsOptIn = false;
    if (typeof base.lettersDone !== 'boolean') base.lettersDone = false;
    if (typeof base.playerName !== 'string') base.playerName = '';
    if (typeof base.childName !== 'string') base.childName = '';
    return base;
  } catch {
    return memFallback || defaults();
  }
}

/** @param {Partial<SaveData>} patch */
export function patchSave(patch) {
  const prev = loadSave();
  const next = { ...prev, ...patch };
  if (patch.difficulty) next.difficulty = normalizeDifficulty(patch.difficulty);
  if (patch.language) next.language = normalizeLang(patch.language);
  if (patch.daily) next.daily = { ...prev.daily, ...patch.daily };
  if (patch.weekly) next.weekly = { ...prev.weekly, ...patch.weekly };
  if (patch.streak) next.streak = { ...prev.streak, ...patch.streak };
  if (patch.stats) next.stats = { ...prev.stats, ...patch.stats };
  if (patch.a11y) next.a11y = { ...prev.a11y, ...patch.a11y };
  if (patch.mastery) next.mastery = { ...prev.mastery, ...patch.mastery };
  if (patch.achievements) next.achievements = patch.achievements;
  if (patch.classBoard) next.classBoard = { ...prev.classBoard, ...patch.classBoard };
  memFallback = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota */
  }
  return next;
}

/**
 * @param {string} dayKey YYYY-MM-DD
 */
export function recordPlayDay(dayKey) {
  const save = loadSave();
  const streak = { ...(save.streak || defaults().streak) };
  if (streak.lastDay === dayKey) return save;
  const prev = streak.lastDay;
  let nextCurrent = 1;
  if (prev) {
    const dPrev = new Date(prev + 'T12:00:00');
    const dNow = new Date(dayKey + 'T12:00:00');
    const diff = Math.round((dNow - dPrev) / 86400000);
    if (diff === 1) nextCurrent = (streak.current || 0) + 1;
    else if (diff === 0) nextCurrent = streak.current || 1;
  }
  streak.current = nextCurrent;
  streak.best = Math.max(streak.best || 0, nextCurrent);
  streak.lastDay = dayKey;
  return patchSave({ streak });
}

/**
 * Mark word as practiced / mastered
 * @param {string} wordId
 * @param {boolean} success
 */
export function recordMastery(wordId, success = true) {
  if (!wordId || !success) return loadSave();
  const save = loadSave();
  const mastery = { ...(save.mastery || {}) };
  const prev = mastery[wordId] || { count: 0, last: 0 };
  mastery[wordId] = {
    count: (prev.count || 0) + 1,
    last: Date.now(),
  };
  return patchSave({ mastery });
}

/**
 * @param {number} keys
 * @param {number} wrong
 * @param {number} playMs
 */
export function addSessionStats(keys, wrong, playMs) {
  const save = loadSave();
  const stats = {
    keys: (save.stats?.keys || 0) + keys,
    wrong: (save.stats?.wrong || 0) + wrong,
    playMs: (save.stats?.playMs || 0) + playMs,
  };
  return patchSave({ stats });
}

/**
 * Accuracy 0–100 from lifetime stats
 * @param {{ keys?: number, wrong?: number }} [stats]
 */
export function accuracyPct(stats) {
  const keys = stats?.keys || 0;
  const wrong = stats?.wrong || 0;
  if (keys <= 0) return 100;
  const correct = Math.max(0, keys - wrong);
  return Math.round((correct / keys) * 100);
}

/**
 * Mastery counts
 * @param {Record<string,{count:number}>} [mastery]
 */
export function masteryStats(mastery = {}) {
  // Letter warm-up (letter-a…) and friend sticker (char-…) ids aren't words
  const ids = Object.keys(mastery).filter(
    (id) => !isLetterMasteryId(id) && !isCharMasteryId(id)
  );
  const seen = ids.length;
  const mastered = ids.filter((id) => (mastery[id]?.count || 0) >= 2).length;
  return { seen, mastered };
}

/**
 * Local class leaderboard entry
 * @param {string} code
 * @param {{ name: string, stars: number }} entry
 */
export function pushClassScore(code, entry) {
  if (!code) return loadSave();
  const save = loadSave();
  const board = { ...(save.classBoard || {}) };
  const list = [...(board[code] || [])];
  list.push({
    name: (entry.name || 'Siswa').slice(0, 20),
    stars: entry.stars || 0,
    at: Date.now(),
  });
  list.sort((a, b) => b.stars - a.stars || a.at - b.at);
  board[code] = list.slice(0, 20);
  return patchSave({ classBoard: board });
}

/**
 * @param {string[]} ids
 */
export function unlockAchievements(ids) {
  if (!ids?.length) return loadSave();
  const save = loadSave();
  const set = new Set(save.achievements || []);
  ids.forEach((id) => set.add(id));
  return patchSave({ achievements: [...set] });
}

/**
 * @param {number} totalStars
 * @param {Record<string, string>} [rankLabels]
 */
export function getRank(totalStars, rankLabels = null) {
  const ranks = CONFIG.goals.ranks;
  let current = ranks[0];
  for (const r of ranks) {
    if (totalStars >= r.min) current = r;
  }
  const idx = ranks.indexOf(current);
  const next = ranks[idx + 1] || null;
  const label = (rankLabels && rankLabels[current.id]) || current.label;
  const nextLabel =
    next && rankLabels && rankLabels[next.id]
      ? rankLabels[next.id]
      : next?.label;
  return {
    ...current,
    label,
    next: next ? { ...next, label: nextLabel || next.label } : null,
    starsToNext: next ? Math.max(0, next.min - totalStars) : 0,
  };
}

export function remainingCopy(have, target, t = null) {
  const left = Math.max(0, target - have);
  if (t) {
    if (left === 0) return t.done || 'Done!';
    if (left === 1) return t.oneStarLeft || '1 star left!';
    if (left <= 3) return t.nStarsLeft ? t.nStarsLeft(left) : `${left} left!`;
    if (have === 0) return t.chaseStars ? t.chaseStars(target) : `Chase ${target}!`;
    return t.nStarsLeft ? t.nStarsLeft(left) : `${left} left!`;
  }
  if (left === 0) return 'Misi selesai!';
  if (left === 1) return '1 bintang lagi juara!';
  if (left <= 3) return `${left} bintang lagi! Ayo!`;
  if (have === 0) return `Kejar ${target} bintang ya!`;
  return `${left} lagi sampai juara~`;
}

export function buildShareText(data, t) {
  const lines = [
    t.shareTitle || 'Typing Kids',
    `${t.parentWords}: ${data.sessionStars}`,
    `${t.parentMode}: ${data.mode}`,
    `${t.parentTheme}: ${data.theme}`,
    `${t.parentLang}: ${data.lang}`,
    `${t.parentRank}: ${data.rank}`,
    `${t.parentTotal}: ${data.totalStars}`,
  ];
  if (data.accuracy != null) {
    lines.push(`${t.parentAccuracy || 'Akurasi'}: ${data.accuracy}%`);
  }
  if (data.combo && data.combo > 1) {
    lines.push(`${t.comboBest || 'Combo'}: x${data.combo}`);
  }
  if (data.daily) lines.push(t.dailyDoneShare || 'Daily done!');
  if (typeof window !== 'undefined') {
    lines.push(window.location.origin + window.location.pathname);
  }
  return lines.join('\n');
}

/**
 * CSV export for classroom board
 * @param {string} code
 */
export function classBoardCsv(code) {
  const save = loadSave();
  const list = save.classBoard?.[code] || [];
  const rows = [['name', 'stars', 'timestamp']];
  for (const r of list) {
    rows.push([r.name, String(r.stars), new Date(r.at).toISOString()]);
  }
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}

export { getMode };

export default {
  loadSave,
  patchSave,
  getRank,
  remainingCopy,
  recordPlayDay,
  recordMastery,
  addSessionStats,
  accuracyPct,
  masteryStats,
  isLetterMasteryId,
  isCharMasteryId,
  pushClassScore,
  unlockAchievements,
  buildShareText,
  classBoardCsv,
  getMode,
};
