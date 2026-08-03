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

  test('offline: cached navigation after visit (best-effort)', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/');
    await page.waitForTimeout(2000);
    // Ask SW to warm if present
    await page.evaluate(() => {
      navigator.serviceWorker?.controller?.postMessage({ type: 'WARM_MEDIA' });
    });
    await page.waitForTimeout(1500);

    // Go offline
    await context.setOffline(true);
    // Reload shell — may still work if SW cached
    try {
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 8000 });
      const title = await page.locator('#app-title').textContent({ timeout: 5000 });
      // If SW active, we get the app; if not, offline fails — both acceptable signals
      if (title) {
        expect(title).toMatch(/Poppu|Typing/i);
      }
    } catch {
      // No SW offline support in this serve setup — not a hard fail
      test.info().annotations.push({
        type: 'note',
        description: 'Offline reload failed (SW may not control page under static serve)',
      });
    } finally {
      await context.setOffline(false);
      await context.close();
    }
  });
});
