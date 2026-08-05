/**
 * Words — load, filter by mode + category, shuffle, letter mode, hard letters
 */
import { CONFIG, getMode } from './config.js';
import { buildLetterBank, filterHardLetterWords } from './letters.js';

/**
 * Adaptive difficulty — adjust the next word's max length from the base
 * star ramp. Struggling (≥ struggleWrongs wrong letters on the completed
 * word) steps the cap DOWN by 1, floored at minLetters+1 so the pool keeps
 * at least two length bands (getPool's upward expansion still guarantees
 * minPoolSize, so the pool can never go empty). A fluent streak
 * (≥ fluentNeeded consecutive 0-wrong words) lets the ramp run 1 letter
 * ahead of schedule, capped at maxLetters.
 * @param {number} ramp base ramp value from the star schedule
 * @param {number} lastWrongCount wrong letters on the completed word
 * @param {number} fluentStreak consecutive 0-wrong completions so far
 * @param {{ minLetters?: number, maxLetters?: number, struggleWrongs?: number, fluentNeeded?: number }} [cfg]
 * @returns {number} max letters for the next refill
 */
export function nextMaxLetters(ramp, lastWrongCount, fluentStreak, cfg = {}) {
  const min = (cfg.minLetters ?? 1) + 1;
  const max = cfg.maxLetters ?? 10;
  const struggleAt = cfg.struggleWrongs ?? 3;
  const fluentNeeded = cfg.fluentNeeded ?? 2;
  let next = ramp;
  if (lastWrongCount >= struggleAt) next = ramp - 1;
  else if (lastWrongCount === 0 && fluentStreak >= fluentNeeded) next = ramp + 1;
  return Math.min(Math.max(next, min), max);
}

export class WordBank {
  constructor() {
    /** @type {Array<{id:string,word:string,display:string,category:string,image:string,audio:string|null,letters:number,isLetter?:boolean}>} */
    this.words = [];
    this.categories = {};
    this.praise = [];
    this.encouragements = [];
    this._queue = [];
    this._lastId = null;
    this.loaded = false;
    /** @type {'easy'|'medium'|'hard'|'letters'} */
    this.difficulty = CONFIG.gameplay.defaultDifficulty;
    /** @type {string} 'all' or category id */
    this.category = CONFIG.gameplay.defaultCategory || 'all';
    /** @type {'id'|'en'} */
    this.language = 'id';
    /** Synthetic A–Z bank */
    this._letterBank = buildLetterBank('id');
  }

  /**
   * @param {string} [url]
   */
  async load(url = CONFIG.paths.wordsData) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load words: ${res.status}`);
    const data = await res.json();

    this.categories = data.categories || {};
    this.praise = data.praise || ['Great!', 'Awesome!', 'Super!'];
    this.encouragements =
      data.encouragements || ['You can do it!', 'Keep going!'];
    this.words = (data.words || []).map((w) => ({
      ...w,
      word: String(w.word).toLowerCase().replace(/[^a-z]/g, ''),
      display: w.display || this._capitalize(w.word),
      letters: w.letters || String(w.word).replace(/[^a-z]/gi, '').length,
    }));

    this.loaded = true;
    this._queue = [];
    this._lastId = null;
    this._refillQueue();
    return this;
  }

  /**
   * @param {'id'|'en'} lang
   */
  setLanguage(lang) {
    this.language = lang === 'en' ? 'en' : 'id';
    this._letterBank = buildLetterBank(this.language);
  }

  /**
   * @param {'easy'|'medium'|'hard'|'letters'|string} mode
   */
  setDifficulty(mode) {
    this.difficulty = getMode(mode).id;
    this._queue = [];
    this._refillQueue();
  }

  /**
   * @param {string} categoryId 'all' or category key
   */
  setCategory(categoryId) {
    this.category = categoryId || 'all';
    this._queue = [];
    this._refillQueue();
  }

  /**
   * @param {{ preferMaxLetters?: number, minPool?: number }} [opts]
   * preferMaxLetters: progressive ramp — prefer words up to this length
   */
  getPool(opts = {}) {
    const mode = getMode(this.difficulty);
    const minPool = opts.minPool ?? CONFIG.gameplay.minPoolSize ?? 5;
    let usedFallback = false;

    // A–Z warm-up: synthetic letters only
    if (mode.id === 'letters') {
      this._lastPoolFallback = false;
      this._lastPoolSize = this._letterBank.length;
      return [...this._letterBank];
    }

    let pool = [...this.words];

    if (this.category === 'huruf-susah') {
      pool = filterHardLetterWords(pool);
      if (pool.length < minPool) {
        usedFallback = true;
        pool = filterHardLetterWords([...this.words]);
        if (pool.length < minPool) pool = [...this.words];
      }
    } else if (this.category && this.category !== 'all') {
      pool = pool.filter((w) => w.category === this.category);
    }

    const byLen = (list, maxL) =>
      list.filter(
        (w) =>
          w.letters >= mode.minLetters &&
          w.letters <= Math.min(maxL ?? mode.maxLetters, mode.maxLetters)
      );

    let maxL = opts.preferMaxLetters ?? mode.maxLetters;
    let filtered = byLen(pool, maxL);

    while (filtered.length < minPool && maxL < mode.maxLetters) {
      maxL += 1;
      filtered = byLen(pool, maxL);
    }

    if (
      filtered.length < minPool &&
      this.category &&
      this.category !== 'all' &&
      this.category !== 'huruf-susah'
    ) {
      usedFallback = true;
      filtered = byLen([...this.words], mode.maxLetters);
    }

    if (!filtered.length) {
      filtered = byLen([...this.words], mode.maxLetters);
      usedFallback = true;
    }

    this._lastPoolFallback = usedFallback;
    this._lastPoolSize = filtered.length;
    return filtered;
  }

  /**
   * Peek next N word ids (for voice preload) without consuming queue
   * @param {number} n
   */
  peekIds(n = 5) {
    if (!this._queue.length) this._refillQueue();
    return this._queue.slice(0, n).map((w) => w.id).filter(Boolean);
  }

  lastPoolUsedFallback() {
    return Boolean(this._lastPoolFallback);
  }

  poolSize() {
    return this.getPool().length;
  }

  /**
   * Image URLs for preloading (current pool, shuffled sample)
   * @param {number} [limit]
   */
  imageUrls(limit = 40) {
    const pool = this.getPool();
    const urls = [];
    const seen = new Set();
    for (const w of pool) {
      if (!w.image || seen.has(w.image)) continue;
      seen.add(w.image);
      urls.push(w.image.split('?')[0]);
      if (urls.length >= limit) break;
    }
    return urls;
  }

  next() {
    if (!this._queue.length) this._refillQueue();

    let word = this._queue.shift();
    if (
      CONFIG.gameplay.avoidImmediateRepeat &&
      this._lastId &&
      word?.id === this._lastId &&
      this._queue.length
    ) {
      this._queue.push(word);
      word = this._queue.shift();
    }

    this._lastId = word?.id ?? null;
    return word;
  }

  randomPraise() {
    return this.praise[Math.floor(Math.random() * this.praise.length)];
  }

  randomEncouragement() {
    return this.encouragements[
      Math.floor(Math.random() * this.encouragements.length)
    ];
  }

  /**
   * @param {{ preferMaxLetters?: number }} [opts]
   */
  _refillQueue(opts = {}) {
    const pool = this.getPool(opts);
    this._queue = CONFIG.gameplay.shuffleWords ? this._shuffle(pool) : [...pool];
  }

  /**
   * Refill with progressive max letter preference
   * @param {number} preferMaxLetters
   */
  refillProgressive(preferMaxLetters) {
    this._queue = [];
    this._refillQueue({ preferMaxLetters });
  }

  _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  _capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

export default WordBank;
