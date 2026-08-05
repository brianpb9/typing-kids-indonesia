/**
 * Adaptive difficulty — pure nextMaxLetters decision logic + pool safety
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { nextMaxLetters, WordBank } from '../js/words.js';
import { getMode } from '../js/config.js';

const easy = getMode('easy'); // minLetters 3, maxLetters 6
const medium = getMode('medium'); // minLetters 4, maxLetters 8

describe('nextMaxLetters — struggling steps down', () => {
  it('≥3 wrong on the completed word steps the cap down by 1', () => {
    assert.equal(nextMaxLetters(5, 3, 0, easy), 4);
    assert.equal(nextMaxLetters(6, 7, 0, easy), 5);
  });

  it('floors at mode minLetters + 1 (never below the ramp start)', () => {
    assert.equal(nextMaxLetters(easy.minLetters + 1, 3, 0, easy), 4);
    assert.equal(nextMaxLetters(medium.minLetters + 1, 9, 0, medium), 5);
  });

  it('1–2 wrongs leaves the ramp unchanged and is not fluent', () => {
    assert.equal(nextMaxLetters(5, 1, 0, easy), 5);
    assert.equal(nextMaxLetters(5, 2, 5, easy), 5);
  });
});

describe('nextMaxLetters — fluent streak steps up', () => {
  it('a single 0-wrong word is not enough', () => {
    assert.equal(nextMaxLetters(4, 0, 1, easy), 4);
  });

  it('2 consecutive 0-wrong words run the ramp 1 letter ahead', () => {
    assert.equal(nextMaxLetters(4, 0, 2, easy), 5);
    assert.equal(nextMaxLetters(4, 0, 6, easy), 5);
  });

  it('caps at mode maxLetters', () => {
    assert.equal(nextMaxLetters(easy.maxLetters, 0, 3, easy), easy.maxLetters);
    assert.equal(
      nextMaxLetters(medium.maxLetters, 0, 10, medium),
      medium.maxLetters
    );
  });

  it('struggling wins over any fluent streak', () => {
    assert.equal(nextMaxLetters(5, 3, 9, easy), 4);
  });
});

describe('adaptive pool safety', () => {
  function bank(modeId) {
    const wb = new WordBank();
    let n = 0;
    wb.words = [];
    for (let len = 1; len <= 10; len++) {
      for (let i = 0; i < 3; i++) {
        const word = 'a'.repeat(len - 1) + String.fromCharCode(98 + i);
        wb.words.push({
          id: `w${n++}`,
          word,
          display: word,
          category: 'buah',
          image: '',
          audio: null,
          letters: len,
        });
      }
    }
    wb.loaded = true;
    wb.setDifficulty(modeId);
    wb.setCategory('all');
    return wb;
  }

  it('stepped-down cap still yields a non-empty pool', () => {
    const wb = bank('easy');
    const cap = nextMaxLetters(easy.minLetters + 1, 5, 0, easy); // floor
    const pool = wb.getPool({ preferMaxLetters: cap });
    assert.ok(pool.length >= 5, `pool ${pool.length}`);
    for (const w of pool) {
      assert.ok(w.letters >= easy.minLetters);
      assert.ok(w.letters <= Math.max(cap, easy.maxLetters));
    }
  });

  it('tiny category + stepped-down cap expands instead of emptying', () => {
    const wb = bank('easy');
    wb.setCategory('hewan'); // no words in this category at all
    const pool = wb.getPool({ preferMaxLetters: easy.minLetters + 1 });
    assert.ok(pool.length >= 5, 'category fallback keeps the pool filled');
    assert.equal(wb.lastPoolUsedFallback(), true);
  });
});
