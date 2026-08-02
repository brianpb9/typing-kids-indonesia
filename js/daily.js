/**
 * Daily mission — deterministic challenge from calendar date
 */
import { CONFIG } from './config.js';

const CATS = (CONFIG.categoryOptions || [])
  .map((c) => c.id)
  .filter((id) => id !== 'all');

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
 * Simple stable hash
 * @param {string} s
 */
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
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
