/**
 * Shared deterministic seed helpers — daily, weekly and classroom missions
 * derive category/mode/target from a string seed. Extracted so all three
 * stay byte-identical (determinism is covered by unit tests).
 */
import { CONFIG } from './config.js';

/**
 * Simple stable hash
 * @param {string} s
 */
export function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Category ids eligible for seeded missions ('all' is always excluded).
 * @param {string[]} [exclude] additional specialty ids to drop
 *  (daily/weekly also drop 'huruf-susah' and 'huruf')
 */
export function missionCategories(exclude = []) {
  const skip = new Set(['all', ...exclude]);
  return (CONFIG.categoryOptions || [])
    .map((c) => c.id)
    .filter((id) => !skip.has(id));
}

export default { hash, missionCategories };
