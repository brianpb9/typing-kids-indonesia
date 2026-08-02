/**
 * Words — load, filter by mode + category, shuffle
 */
import { CONFIG, getMode } from './config.js';

export class WordBank {
  constructor() {
    /** @type {Array<{id:string,word:string,display:string,category:string,image:string,audio:string|null,letters:number}>} */
    this.words = [];
    this.categories = {};
    this.praise = [];
    this.encouragements = [];
    this._queue = [];
    this._lastId = null;
    this.loaded = false;
    /** @type {'easy'|'medium'|'hard'} */
    this.difficulty = CONFIG.gameplay.defaultDifficulty;
    /** @type {string} 'all' or category id */
    this.category = CONFIG.gameplay.defaultCategory || 'all';
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
   * @param {'easy'|'medium'|'hard'|string} mode
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
    let pool = [...this.words];
    const mode = getMode(this.difficulty);
    const minPool = opts.minPool ?? CONFIG.gameplay.minPoolSize ?? 5;
    let usedFallback = false;

    if (this.category && this.category !== 'all') {
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

    // Progressive: if too few at preferred max, widen up to mode max
    while (filtered.length < minPool && maxL < mode.maxLetters) {
      maxL += 1;
      filtered = byLen(pool, maxL);
    }

    // Category too thin → fall back to all categories
    if (filtered.length < minPool && this.category && this.category !== 'all') {
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
