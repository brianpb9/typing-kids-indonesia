/**
 * Local progress — lifetime stars, mute, difficulty preference
 */
import { CONFIG, getMode } from './config.js';

const KEY = CONFIG.storage.key;

/**
 * @typedef {{ totalStars: number, missionsWon: number, muted: boolean, difficulty: 'easy'|'medium'|'hard' }} SaveData
 */

/** @returns {SaveData} */
function defaults() {
  return {
    totalStars: 0,
    missionsWon: 0,
    muted: false,
    difficulty: CONFIG.gameplay.defaultDifficulty,
  };
}

/**
 * Migrate old 'all' → 'hard'
 * @param {string} d
 * @returns {'easy'|'medium'|'hard'}
 */
function normalizeDifficulty(d) {
  if (d === 'medium' || d === 'hard' || d === 'easy') return d;
  if (d === 'all') return 'hard';
  return 'easy';
}

/** @returns {SaveData} */
export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw);
    const base = { ...defaults(), ...parsed };
    base.difficulty = normalizeDifficulty(base.difficulty);
    return base;
  } catch {
    return defaults();
  }
}

/** @param {Partial<SaveData>} patch */
export function patchSave(patch) {
  const next = { ...loadSave(), ...patch };
  if (patch.difficulty) next.difficulty = normalizeDifficulty(patch.difficulty);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota */
  }
  return next;
}

/**
 * @param {number} totalStars
 */
export function getRank(totalStars) {
  const ranks = CONFIG.goals.ranks;
  let current = ranks[0];
  for (const r of ranks) {
    if (totalStars >= r.min) current = r;
  }
  const idx = ranks.indexOf(current);
  const next = ranks[idx + 1] || null;
  return {
    ...current,
    next,
    starsToNext: next ? Math.max(0, next.min - totalStars) : 0,
  };
}

/**
 * @param {number} have
 * @param {number} target
 */
export function remainingCopy(have, target) {
  const left = Math.max(0, target - have);
  if (left === 0) return 'Misi selesai!';
  if (left === 1) return '1 bintang lagi juara!';
  if (left <= 3) return `${left} bintang lagi! Ayo!`;
  if (have === 0) return `Kejar ${target} bintang ya!`;
  return `${left} lagi sampai juara~`;
}

export { getMode };

export default { loadSave, patchSave, getRank, remainingCopy, getMode };
