/**
 * Storage — streaks, patchSave merge, memFallback, accuracy, class board
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

let seq = 0;

/**
 * Fresh storage module instance (cache-busted import) + localStorage stub.
 * @param {{ throwing?: boolean }} [opts] throwing simulates private mode
 */
async function freshStorage(opts = {}) {
  const store = new Map();
  globalThis.localStorage = opts.throwing
    ? {
        getItem() {
          throw new Error('denied');
        },
        setItem() {
          throw new Error('denied');
        },
        removeItem() {
          throw new Error('denied');
        },
      }
    : {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k),
      };
  seq += 1;
  return import(`../js/storage.js?t=${seq}`);
}

describe('recordPlayDay streaks', () => {
  it('same day (diff 0) does not double count', async () => {
    const s = await freshStorage();
    s.recordPlayDay('2026-01-10');
    const save = s.recordPlayDay('2026-01-10');
    assert.equal(save.streak.current, 1);
    assert.equal(save.streak.best, 1);
    assert.equal(save.streak.lastDay, '2026-01-10');
  });

  it('next day (diff 1) increments the streak', async () => {
    const s = await freshStorage();
    s.recordPlayDay('2026-01-10');
    const save = s.recordPlayDay('2026-01-11');
    assert.equal(save.streak.current, 2);
    assert.equal(save.streak.best, 2);
  });

  it('gap (diff > 1) resets current but keeps best', async () => {
    const s = await freshStorage();
    s.recordPlayDay('2026-01-10');
    s.recordPlayDay('2026-01-11');
    const save = s.recordPlayDay('2026-01-20');
    assert.equal(save.streak.current, 1);
    assert.equal(save.streak.best, 2);
    assert.equal(save.streak.lastDay, '2026-01-20');
  });
});

describe('patchSave', () => {
  it('merges nested objects and keeps other fields', async () => {
    const s = await freshStorage();
    s.patchSave({
      totalStars: 7,
      stats: { keys: 10, wrong: 2, playMs: 500 },
    });
    const next = s.patchSave({ stats: { keys: 4 }, muted: true });
    assert.equal(next.stats.keys, 4);
    assert.equal(next.stats.wrong, 2); // merged, not replaced
    assert.equal(next.stats.playMs, 500);
    assert.equal(next.totalStars, 7);
    assert.equal(next.muted, true);
  });

  it('memFallback keeps progress when localStorage throws', async () => {
    const s = await freshStorage({ throwing: true });
    assert.equal(s.loadSave().totalStars, 0);
    s.patchSave({ totalStars: 5 });
    const save = s.loadSave();
    assert.equal(save.totalStars, 5);
    assert.equal(save.difficulty, 'easy');
  });
});

describe('accuracyPct', () => {
  it('handles empty stats and divide-by-zero', async () => {
    const s = await freshStorage();
    assert.equal(s.accuracyPct(undefined), 100);
    assert.equal(s.accuracyPct({}), 100);
    assert.equal(s.accuracyPct({ keys: 0, wrong: 0 }), 100);
    assert.equal(s.accuracyPct({ keys: 10, wrong: 3 }), 70);
    // more wrong than keys clamps to 0, never negative
    assert.equal(s.accuracyPct({ keys: 5, wrong: 9 }), 0);
  });
});

describe('pushClassScore', () => {
  it('sorts by stars desc and caps the board at 20', async () => {
    const s = await freshStorage();
    for (let i = 0; i < 25; i++) {
      s.pushClassScore('ABCD', { name: `S${i}`, stars: i });
    }
    const board = s.loadSave().classBoard['ABCD'];
    assert.equal(board.length, 20);
    assert.equal(board[0].stars, 24);
    assert.equal(board[19].stars, 5);
    for (let i = 1; i < board.length; i++) {
      assert.ok(board[i - 1].stars >= board[i].stars, 'sorted desc');
    }
  });

  it('defaults the player name to Siswa', async () => {
    const s = await freshStorage();
    s.pushClassScore('WXYZ', { stars: 3 });
    assert.equal(s.loadSave().classBoard['WXYZ'][0].name, 'Siswa');
  });

  it('ignores empty class codes', async () => {
    const s = await freshStorage();
    s.pushClassScore('', { name: 'A', stars: 9 });
    assert.deepEqual(s.loadSave().classBoard, {});
  });
});

describe('masteryStats letter exclusion', () => {
  it('letter-* ids are not counted as words', async () => {
    const s = await freshStorage();
    const m = s.masteryStats({
      apple: { count: 2, last: 1 },
      ball: { count: 1, last: 1 },
      'letter-a': { count: 5, last: 1 },
      'letter-z': { count: 3, last: 1 },
    });
    assert.deepEqual(m, { seen: 2, mastered: 1 });
    assert.equal(s.isLetterMasteryId('letter-q'), true);
    assert.equal(s.isLetterMasteryId('apple'), false);
  });
});
