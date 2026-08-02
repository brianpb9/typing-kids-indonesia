/**
 * Words — load, filter, shuffle by mode letter range
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
  }

  async load(url = CONFIG.paths.wordsData) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Gagal memuat data kata: ${res.status}`);
    const data = await res.json();

    this.categories = data.categories || {};
    this.praise = data.praise || ['Hebat!', 'Bagus!', 'Pintar!'];
    this.encouragements =
      data.encouragements || ['Kamu hebat!', 'Ayo, kamu bisa!'];
    this.words = (data.words || []).map((w) => ({
      ...w,
      word: String(w.word).toLowerCase(),
      display: w.display || this._capitalize(w.word),
      letters: w.letters || String(w.word).length,
    }));

    this.loaded = true;
    this._refillQueue();
    return this;
  }

  /**
   * @param {'easy'|'medium'|'hard'|string} mode
   */
  setDifficulty(mode) {
    const m = getMode(mode);
    this.difficulty = m.id;
    this._queue = [];
    this._refillQueue();
  }

  getPool() {
    let pool = [...this.words];
    const { activeCategories } = CONFIG.gameplay;
    const mode = getMode(this.difficulty);

    if (activeCategories && activeCategories.length) {
      pool = pool.filter((w) => activeCategories.includes(w.category));
    }

    pool = pool.filter(
      (w) => w.letters >= mode.minLetters && w.letters <= mode.maxLetters
    );

    return pool.length ? pool : [...this.words];
  }

  poolSize() {
    return this.getPool().length;
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

  _refillQueue() {
    const pool = this.getPool();
    this._queue = CONFIG.gameplay.shuffleWords ? this._shuffle(pool) : [...pool];
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
