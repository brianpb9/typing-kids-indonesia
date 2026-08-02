/**
 * Local progress — stars, mute, mode, category, language, tutorial
 */
import { CONFIG, getMode } from './config.js';

const KEY = CONFIG.storage.key;

/**
 * @typedef {{
 *   totalStars: number,
 *   missionsWon: number,
 *   muted: boolean,
 *   difficulty: 'easy'|'medium'|'hard',
 *   category: string,
 *   language: 'id'|'en',
 *   tutorialDone: boolean,
 *   tutorialDoneEn: boolean,
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
  };
}

/**
 * @param {string} d
 * @returns {'easy'|'medium'|'hard'}
 */
function normalizeDifficulty(d) {
  if (d === 'medium' || d === 'hard' || d === 'easy') return d;
  if (d === 'all') return 'hard';
  return 'easy';
}

/**
 * @param {string} l
 * @returns {'id'|'en'}
 */
function normalizeLang(l) {
  return l === 'en' ? 'en' : 'id';
}

/** @returns {SaveData} */
export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw);
    const base = { ...defaults(), ...parsed };
    base.difficulty = normalizeDifficulty(base.difficulty);
    base.language = normalizeLang(base.language);
    if (!base.category) base.category = 'all';
    return base;
  } catch {
    return defaults();
  }
}

/** @param {Partial<SaveData>} patch */
export function patchSave(patch) {
  const next = { ...loadSave(), ...patch };
  if (patch.difficulty) next.difficulty = normalizeDifficulty(patch.difficulty);
  if (patch.language) next.language = normalizeLang(patch.language);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota */
  }
  return next;
}

/**
 * @param {number} totalStars
 * @param {Record<string, string>} [rankLabels] from i18n
 */
export function getRank(totalStars, rankLabels = null) {
  const ranks = CONFIG.goals.ranks;
  let current = ranks[0];
  for (const r of ranks) {
    if (totalStars >= r.min) current = r;
  }
  const idx = ranks.indexOf(current);
  const next = ranks[idx + 1] || null;
  const label =
    (rankLabels && rankLabels[current.id]) || current.label;
  const nextLabel =
    next && rankLabels && rankLabels[next.id]
      ? rankLabels[next.id]
      : next?.label;
  return {
    ...current,
    label,
    next: next
      ? { ...next, label: nextLabel || next.label }
      : null,
    starsToNext: next ? Math.max(0, next.min - totalStars) : 0,
  };
}

/**
 * @param {number} have
 * @param {number} target
 * @param {{ chaseStars?: (n:number)=>string, oneStarLeft?: string, nStarsLeft?: (n:number)=>string, done?: string }} [t]
 */
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

export { getMode };

export default { loadSave, patchSave, getRank, remainingCopy, getMode };
