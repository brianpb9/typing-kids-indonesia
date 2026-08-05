/**
 * Daily mission — deterministic challenge from calendar date
 */
import { hash, missionCategories } from './mission-seed.js';

/** Exclude specialty filters that thin the pool (huruf-susah, synthetic huruf) */
const CATS = missionCategories(['huruf-susah', 'huruf']);

/**
 * @param {Date} [date]
 * @returns {string} YYYY-MM-DD local
 */
export function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * @param {Date} [date]
 * @returns {{ key: string, category: string, target: number, mode: 'easy'|'medium' }}
 */
export function getDailyMission(date = new Date()) {
  const key = dateKey(date);
  const h = hash(key + '|typing-kids-daily');
  const category = CATS[h % CATS.length] || 'buah';
  // 5–8 stars for daily (shorter than full 10)
  const target = 5 + (h % 4);
  const mode = h % 3 === 0 ? 'medium' : 'easy';
  return { key, category, target, mode };
}

/**
 * @param {string} dayKey
 * @param {{ completed?: boolean, stars?: number }} patch
 * @param {object} save existing save blob fields
 */
export function applyDailyToSave(save, dayKey, patch) {
  const daily = { ...(save.daily || {}) };
  if (daily.key !== dayKey) {
    daily.key = dayKey;
    daily.completed = false;
    daily.stars = 0;
  }
  Object.assign(daily, patch);
  return daily;
}

export default { dateKey, getDailyMission, applyDailyToSave };
