/**
 * Lightweight classroom — shared mission seed via short code (no server).
 * Code hashes to mode + category + target so whole class plays the same mission.
 */
import { CONFIG } from './config.js';

const CATS = (CONFIG.categoryOptions || [])
  .map((c) => c.id)
  .filter((id) => id !== 'all');

const MODES = /** @type {const} */ (['easy', 'medium', 'hard']);
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

/**
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
 * Generate a random 4-char class code
 * @returns {string}
 */
export function generateClassCode() {
  let out = '';
  const buf = new Uint8Array(4);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < 4; i++) buf[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < 4; i++) {
    out += ALPHABET[buf[i] % ALPHABET.length];
  }
  return out;
}

/**
 * Normalize user input to class code
 * @param {string} raw
 * @returns {string}
 */
export function normalizeCode(raw) {
  return String(raw || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
}

/**
 * @param {string} code
 * @returns {{ code: string, category: string, mode: 'easy'|'medium'|'hard', target: number }|null}
 */
export function resolveClassroom(code) {
  const c = normalizeCode(code);
  if (c.length < 3) return null;
  const h = hash(`class|${c}|typing-kids`);
  const category = CATS[h % CATS.length] || 'buah';
  const mode = MODES[h % MODES.length];
  const target = 6 + (h % 5); // 6–10
  return { code: c, category, mode, target };
}

/**
 * Build share URL with class code (same origin)
 * @param {string} code
 */
export function classShareUrl(code) {
  const c = normalizeCode(code);
  if (typeof window === 'undefined') return `?class=${c}`;
  const u = new URL(window.location.href);
  u.searchParams.set('class', c);
  u.hash = '';
  return u.toString();
}

/**
 * Read class code from URL if present
 * @returns {string|null}
 */
export function classCodeFromUrl() {
  if (typeof window === 'undefined') return null;
  try {
    const u = new URL(window.location.href);
    const c = normalizeCode(u.searchParams.get('class') || '');
    return c.length >= 3 ? c : null;
  } catch {
    return null;
  }
}

export default {
  generateClassCode,
  normalizeCode,
  resolveClassroom,
  classShareUrl,
  classCodeFromUrl,
};
