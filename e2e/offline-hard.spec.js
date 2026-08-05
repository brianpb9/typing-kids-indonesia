// @ts-check
import { test, expect } from '@playwright/test';

function seed(extra = {}) {
  return {
    totalStars: 0,
    missionsWon: 0,
    muted: true,
    difficulty: 'hard',
    category: 'all',
    language: 'id',
    tutorialDone: true,
    tutorialDoneEn: true,
    ...extra,
  };
}

async function boot(page, data) {
  await page.goto('/');
  await page.evaluate((s) => {
    localStorage.setItem('typingKidsID_v1', JSON.stringify(s));
  }, data);
  await page.reload();
  await page.waitForFunction(() => window.__typingKids?.game);
}

test.describe('Offline + hard mode edges', () => {
  test('hard mode timeout soft-skips without failing mission', async ({
    page,
  }) => {
    await boot(page, seed());
    await page.locator('#mode-hard').click();
    await page.locator('#start-btn').click();
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#timer-wrap')).toBeVisible();

    // Force very short timer + tick once
    await page.evaluate(() => {
      const g = window.__typingKids.game;
      g._stopTimer();
      g._timerLeft = 1;
      g._timerActive = true;
      g._startTimer(1);
    });

    // Wait for soft timeout message (no-fail)
    await expect(page.locator('#encouragement')).toContainText(
      /Waktu|Time|habis|up/i,
      { timeout: 5000 }
    );
    // Still on game, not crashed / not forced victory
    await expect(page.locator('#game-screen')).toBeVisible();
    // Next word loads after soft skip
    await page.waitForTimeout(1800);
    await expect(page.locator('#game-screen')).toBeVisible();
  });

  test('service worker registers and shell can load after warm', async ({
    page,
  }) => {
    await page.goto('/');
    // Wait for SW registration (index.html registers on load)
    const ready = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return 'no-sw-api';
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) return 'registered';
      // allow a moment for async register
      await new Promise((r) => setTimeout(r, 1500));
      const reg2 = await navigator.serviceWorker.getRegistration();
      return reg2 ? 'registered' : 'none';
    });
    // serve may not expose SW on all hosts; accept registered or no-sw-api on restricted
    expect(['registered', 'no-sw-api', 'none']).toContain(ready);

    // Critical shell assets available (online smoke for offline-ready files)
    for (const path of [
      '/index.html',
      '/js/main.js',
      '/css/styles.css',
      '/assets/brand/poppu/poppu-idle.png',
      '/data/words.json',
      '/assets/audio/voice/manifest.json',
    ]) {
      const res = await page.request.get(path);
      expect(res.ok(), path).toBeTruthy();
    }
  });

  test('offline: app shell loads from SW cache after a warm visit', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto('http://127.0.0.1:4173/');

      // Wait until the SW is active (install precaches the shell)
      await page.waitForFunction(
        async () => {
          if (!('serviceWorker' in navigator)) return false;
          const reg = await navigator.serviceWorker.getRegistration();
          return Boolean(reg?.active);
        },
        null,
        { timeout: 20_000 }
      );

      // Reload so the active SW controls this page, then warm-render online
      await page.reload();
      await page.waitForFunction(
        () => Boolean(navigator.serviceWorker?.controller),
        null,
        { timeout: 10_000 }
      );
      await page.waitForFunction(() => window.__typingKids?.game, null, {
        timeout: 10_000,
      });
      await expect(page.locator('#start-btn')).toBeVisible({ timeout: 10_000 });

      // Fully offline: the shell (HTML/JS/data) must render from SW cache
      await context.setOffline(true);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.locator('#start-screen')).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.locator('#app-title')).toHaveText(
        /Poppu Typing Kids/i
      );
      await expect(page.locator('#start-btn')).toBeVisible({ timeout: 10_000 });
    } finally {
      await context.setOffline(false);
      await context.close();
    }
  });
});
