// @ts-check
import { test, expect } from '@playwright/test';

// iPhone-like viewport without forcing browser type (works with workers: 1)
test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
});

test.describe('Mobile friendly', () => {
  test('home fits phone viewport without horizontal scroll', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('#start-screen')).toBeVisible();
    await expect(page.locator('#app-title')).toBeVisible();
    await expect(page.locator('#world-map')).toBeVisible();
    await expect(page.locator('#start-btn')).toBeVisible();

    const overflowX = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 2;
    });
    expect(overflowX).toBeFalsy();
  });

  test('game shows OSK with tappable keys on phone', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem(
        'typingKidsID_v1',
        JSON.stringify({
          totalStars: 0,
          missionsWon: 0,
          muted: true,
          difficulty: 'easy',
          category: 'all',
          language: 'id',
          tutorialDone: true,
          tutorialDoneEn: true,
        })
      );
    });
    await page.reload();
    await page.locator('#start-btn').click();
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#osk')).toBeVisible();
    await expect(page.locator('#game-home-btn')).toBeVisible();

    const key = page.locator('.osk-key').first();
    await expect(key).toBeVisible();
    const box = await key.boundingBox();
    expect(box).toBeTruthy();
    // Approx touch target height
    expect(box.height).toBeGreaterThanOrEqual(36);

    await key.click();
    await expect(page.locator('#game-screen')).toBeVisible();
  });

  test('back works on phone warm-up', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem(
        'typingKidsID_v1',
        JSON.stringify({
          totalStars: 0,
          missionsWon: 0,
          muted: true,
          difficulty: 'letters',
          category: 'all',
          language: 'id',
          tutorialDone: true,
          tutorialDoneEn: true,
        })
      );
    });
    await page.reload();
    await page.locator('#mode-letters').click();
    await page.locator('#start-btn').click();
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });
    await page.locator('#game-home-btn').click();
    await expect(page.locator('#start-screen')).toBeVisible();
  });
});
