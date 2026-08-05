// @ts-check
import { test, expect } from '@playwright/test';

// Resilience regressions from the review-board backlog:
// 360×640 fit, scroll-persistence (BUG-1), landscape, rapid-tap.
function seedDone(extra = {}) {
  return {
    totalStars: 0,
    missionsWon: 0,
    muted: true,
    difficulty: 'easy',
    category: 'all',
    language: 'id',
    tutorialDone: true,
    tutorialDoneEn: true,
    ...extra,
  };
}

async function boot(page, save) {
  await page.goto('/');
  await page.evaluate((data) => {
    localStorage.setItem('typingKidsID_v1', JSON.stringify(data));
  }, save);
  await page.reload();
  await page.waitForFunction(() => window.__typingKids?.game);
}

/** Track uncaught page errors; assert none at the end of a test */
function watchErrors(page) {
  /** @type {string[]} */
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  return errors;
}

test.describe('Small phone 360×640', () => {
  test.use({
    viewport: { width: 360, height: 640 },
    isMobile: true,
    hasTouch: true,
  });

  test('game screen shows image + OSK without scroll or overflow', async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await boot(page, seedDone());
    await page.locator('#start-btn').click();
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#word-image, #target-letter').first()).toBeVisible();
    await expect(page.locator('#osk')).toBeVisible();
    await expect(page.locator('#game-home-btn')).toBeVisible();

    const metrics = await page.evaluate(() => {
      const keys = [...document.querySelectorAll('.osk-key')];
      const last = keys[keys.length - 1]?.getBoundingClientRect();
      return {
        overflowX:
          document.documentElement.scrollWidth > window.innerWidth + 2,
        lastKeyBottom: last ? last.bottom : Infinity,
        vh: window.innerHeight,
      };
    });
    expect(metrics.overflowX).toBeFalsy();
    // Semua tombol OSK terlihat tanpa scroll (padding bawah app boleh di bawah fold)
    expect(metrics.lastKeyBottom).toBeLessThanOrEqual(metrics.vh + 4);
    expect(errors).toEqual([]);
  });

  test('victory fits one screen with CTA visible at 360×640', async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await boot(page, seedDone());
    await page.locator('#start-btn').click();
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });

    await page.evaluate(() => {
      const g = window.__typingKids.game;
      g._sessionTarget = 1;
      g.ui.setSessionTarget(1);
      g.ui.setSessionStars(0, 1);
    });
    const word = await page.evaluate(
      () => window.__typingKids.game.current?.word
    );
    for (const ch of word) {
      await page.keyboard.press(ch);
      await page.waitForTimeout(40);
    }
    await expect(page.locator('#victory-screen')).toBeVisible({
      timeout: 12_000,
    });
    // Journey bar celebration is present
    await expect(page.locator('.victory-journey')).toBeVisible();
    await expect(page.locator('.vj-poppu')).toBeVisible();

    const fits = await page.evaluate(() => {
      window.scrollTo(0, 0);
      const r = document.getElementById('replay-btn')?.getBoundingClientRect();
      return r ? r.bottom <= window.innerHeight && r.top >= 0 : false;
    });
    expect(fits).toBeTruthy();
    expect(errors).toEqual([]);
  });
});

test.describe('Scroll persistence (BUG-1 regression)', () => {
  test.use({
    viewport: { width: 360, height: 640 },
    isMobile: true,
    hasTouch: true,
  });

  test('scroll on home does not leak into the game screen', async ({
    page,
  }) => {
    await boot(page, seedDone());
    // Home is long on a small phone — scroll it to the bottom first
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const scrolled = await page.evaluate(() => window.scrollY);
    expect(scrolled).toBeGreaterThan(0);

    await page.locator('#start-btn').click();
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBe(0);
    // Banner + tombol Kembali tetap di viewport
    await expect(page.locator('#game-home-btn')).toBeInViewport();
  });

  test('scroll resets when leaving victory back to home', async ({ page }) => {
    await boot(page, seedDone());
    await page.locator('#start-btn').click();
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });

    await page.evaluate(() => {
      const g = window.__typingKids.game;
      g._sessionTarget = 1;
      g.ui.setSessionTarget(1);
      g.ui.setSessionStars(0, 1);
    });
    const word = await page.evaluate(
      () => window.__typingKids.game.current?.word
    );
    for (const ch of word) {
      await page.keyboard.press(ch);
      await page.waitForTimeout(40);
    }
    await expect(page.locator('#victory-screen')).toBeVisible({
      timeout: 12_000,
    });

    // Victory scrolls a little at 360×640 — scroll down, then go home
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.locator('#home-btn').click({ force: true });
    await expect(page.locator('#start-screen')).toBeVisible({
      timeout: 5_000,
    });
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBe(0);
  });
});

test.describe('Landscape phone', () => {
  test.use({
    viewport: { width: 640, height: 360 },
    isMobile: true,
    hasTouch: true,
  });

  test('game stays usable in landscape: OSK taps work, no overflow', async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await boot(page, seedDone());
    await page.locator('#start-btn').click();
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#osk')).toBeVisible();

    const overflowX = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 2
    );
    expect(overflowX).toBeFalsy();

    const first = await page.evaluate(
      () => window.__typingKids.game.current?.word?.[0]
    );
    await page.locator(`.osk-key[data-key="${first}"]`).click();
    const cursor = await page.evaluate(
      () => window.__typingKids.game.cursor
    );
    expect(cursor).toBe(1);
    expect(errors).toEqual([]);
  });
});

test.describe('Rapid taps', () => {
  test.use({
    viewport: { width: 360, height: 640 },
    isMobile: true,
    hasTouch: true,
  });

  test('hammering the correct key never skips letters or crashes', async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await boot(page, seedDone());
    await page.locator('#start-btn').click();
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });

    const word = await page.evaluate(
      () => window.__typingKids.game.current?.word
    );
    const key = page.locator(`.osk-key[data-key="${word[0]}"]`);
    for (let i = 0; i < 10; i++) {
      await key.click({ delay: 0, noWaitAfter: true });
    }
    // Extra taps are either deduped or gentle wrong letters — cursor may
    // only advance past letters that genuinely repeat at the word start
    const cursor = await page.evaluate(
      () => window.__typingKids.game.cursor
    );
    const leadRepeats = word.split('').findIndex((ch) => ch !== word[0]);
    const maxCursor = leadRepeats === -1 ? word.length : leadRepeats;
    expect(cursor).toBeGreaterThanOrEqual(1);
    expect(cursor).toBeLessThanOrEqual(maxCursor);

    // Game still works: finish the word via physical keyboard
    const rest = await page.evaluate(() => {
      const g = window.__typingKids.game;
      return g.current.word.slice(g.cursor);
    });
    for (const ch of rest) {
      await page.keyboard.press(ch);
      await page.waitForTimeout(40);
    }
    const done = await page.evaluate(() => {
      const g = window.__typingKids.game;
      return g.cursor >= g.current.word.length || g.state !== 'playing';
    });
    expect(done).toBeTruthy();
    expect(errors).toEqual([]);
  });

  test('hammering wrong keys advances nothing and stays gentle', async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await boot(page, seedDone());
    await page.locator('#start-btn').click();
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });

    // Find a key that is definitely wrong for the current letter
    const first = await page.evaluate(
      () => window.__typingKids.game.current?.word?.[0]
    );
    const wrongKey = first === 'z' ? 'q' : 'z';
    const key = page.locator(`.osk-key[data-key="${wrongKey}"]`);
    for (let i = 0; i < 12; i++) {
      await key.click({ delay: 0, noWaitAfter: true });
    }
    const cursor = await page.evaluate(
      () => window.__typingKids.game.cursor
    );
    expect(cursor).toBe(0);
    // No fail state, no dead end — correct key still advances
    await expect(page.locator('#game-screen')).toBeVisible();
    await page.locator(`.osk-key[data-key="${first}"]`).click();
    const after = await page.evaluate(
      () => window.__typingKids.game.cursor
    );
    expect(after).toBe(1);
    expect(errors).toEqual([]);
  });

  test('double-tap on start does not double-launch the mission', async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await boot(page, seedDone());
    await page.locator('#start-btn').click();
    await page.locator('#start-btn').click({ force: true }).catch(() => {});
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });
    const state = await page.evaluate(
      () => window.__typingKids.game.state
    );
    expect(['playing', 'celebrating', 'milestone', 'tutorial']).toContain(
      state
    );
    expect(errors).toEqual([]);
  });
});
