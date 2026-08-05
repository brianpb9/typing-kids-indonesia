/**
 * Mode matrix + data integrity smoke tests (Node built-in test runner)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getMode, CONFIG } from '../js/config.js';
import { getStrings } from '../js/i18n.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('mode matrix', () => {
  it('easy shows full word and big letter, no timer', () => {
    const m = getMode('easy');
    assert.equal(m.showFullWord, true);
    assert.equal(m.showBigLetter, true);
    assert.equal(m.showSlots, true);
    assert.equal(m.timerSeconds || 0, 0);
  });

  it('medium shows full word, no big letter, no timer', () => {
    const m = getMode('medium');
    assert.equal(m.showFullWord, true);
    assert.equal(m.showBigLetter, false);
    assert.equal(m.showSlots, true);
    assert.equal(m.timerSeconds || 0, 0);
  });

  it('hard hides word, has timer', () => {
    const m = getMode('hard');
    assert.equal(m.showFullWord, false);
    assert.equal(m.showBigLetter, false);
    assert.equal(m.showSlots, false);
    assert.ok((m.timerSeconds || 0) > 0);
  });

  it('letters mode is single-letter warm-up', () => {
    const m = getMode('letters');
    assert.equal(m.minLetters, 1);
    assert.equal(m.maxLetters, 1);
    assert.equal(m.showBigLetter, true);
    assert.equal(m.showImage, false);
    assert.equal(m.speakLetterOnCorrect, true);
  });
});

describe('word data', () => {
  const expected = { 'data/words.json': 100, 'data/words-en.json': 99 };
  for (const file of ['data/words.json', 'data/words-en.json']) {
    it(`${file} has ${expected[file]} valid words and images`, () => {
      const data = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
      assert.equal(data.words.length, expected[file]);
      const ids = new Set();
      for (const w of data.words) {
        assert.match(w.word, /^[a-z]+$/);
        assert.equal(w.letters, w.word.length);
        assert.ok(!ids.has(w.id), `dup id ${w.id}`);
        ids.add(w.id);
        const img = path.join(root, w.image.split('?')[0]);
        assert.ok(fs.existsSync(img), `missing ${img}`);
      }
    });
  }

  it('EN has a single "orange" entry (fruit only)', () => {
    const data = JSON.parse(
      fs.readFileSync(path.join(root, 'data/words-en.json'), 'utf8')
    );
    const oranges = data.words.filter((w) => w.word === 'orange');
    assert.equal(oranges.length, 1);
    assert.equal(oranges[0].id, 'orange');
    assert.equal(oranges[0].category, 'buah');
    assert.ok(!data.words.some((w) => w.id === 'orange-color'));
  });
});

describe('i18n parity', () => {
  it('id and en share top-level keys', () => {
    const id = getStrings('id');
    const en = getStrings('en');
    for (const k of Object.keys(id)) {
      assert.ok(k in en, `missing en.${k}`);
    }
    assert.ok(id.milestones?.length >= 3);
    assert.ok(en.milestones?.length >= 3);
    assert.equal(id.tutorial.length, en.tutorial.length);
  });
});

describe('config', () => {
  it('has languages and min pool', () => {
    assert.ok(CONFIG.languages.id.wordsPath);
    assert.ok(CONFIG.languages.en.wordsPath);
    assert.ok(CONFIG.gameplay.minPoolSize >= 3);
    assert.ok(CONFIG.gameplay.progressiveDifficulty);
  });
});
