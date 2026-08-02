/**
 * Weekly challenge — ISO week seed (Mon–Sun)
 */
import { CONFIG } from './config.js';

const CATS = (CONFIG.categoryOptions || [])
  .map((c) => c.id)
  .filter((id) => id !== 'all' && id !== 'huruf-susah' && id !== 'huruf');

/**
 * @param {Date} [date]
 * @returns {string} YYYY-Www
 */
export function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * @param {Date} [date]
 * @returns {{ key: string, category: string, mode: 'easy'|'medium'|'hard', target: number }}
 */
export function getWeeklyMission(date = new Date()) {
  const key = weekKey(date);
  const h = hash(key + '|typing-kids-weekly');
  const category = CATS[h % CATS.length] || 'buah';
  // Age 5–6: weekly stays easy/medium only (no hard timer)
  const modes = /** @type {const} */ (['easy', 'medium']);
  const mode = modes[h % 2];
  const target = 8 + (h % 3); // 8–10
  return { key, category, mode, target };
}

/**
 * @param {object} save
 * @param {string} key
 * @param {{ completed?: boolean, stars?: number }} patch
 */
export function applyWeeklyToSave(save, key, patch) {
  const weekly = { ...(save.weekly || {}) };
  if (weekly.key !== key) {
    weekly.key = key;
    weekly.completed = false;
    weekly.stars = 0;
  }
  Object.assign(weekly, patch);
  return weekly;
}

export default { weekKey, getWeeklyMission, applyWeeklyToSave };
