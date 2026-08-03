// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Typing Kids smoke', () => {
  test('home loads with modes and language toggle', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#start-screen')).toBeVisible();
    await expect(page.locator('#start-btn')).toBeVisible();
    await expect(page.locator('#mode-easy')).toBeVisible();
    await expect(page.locator('#mode-medium')).toBeVisible();
    await expect(page.locator('#mode-hard')).toBeVisible();
    await expect(page.locator('#lang-id')).toBeVisible();
    await expect(page.locator('#lang-en')).toBeVisible();
    await expect(page.locator('#daily-card')).toBeVisible();
    await expect(page.locator('#app-title')).toHaveText(/Poppu Typing Kids/i);
    await expect(page.locator('#brand-mascot-start')).toBeVisible();
    await expect(page.locator('#length-mini')).toBeVisible();
    await expect(page.locator('#length-full')).toBeVisible();
    await expect(page.locator('#sticker-book')).toBeVisible();
  });

  test('switch to English updates UI', async ({ page }) => {
    await page.goto('/');
    await page.locator('#lang-en').click();
    await expect(page.locator('#start-btn')).toHaveText(/Start Mission/i);
    await expect(page.locator('#mode-easy-name')).toHaveText(/Easy/i);
  });

  test('can start mission after skipping tutorial and type a letter', async ({
    page,
  }) => {
    await page.goto('/');
    // Seed tutorial done so we land in game immediately
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
    await expect(page.locator('#word-image')).toBeVisible();

    // Type wrong letter — no crash, still playing
    await page.keyboard.press('z');
    await expect(page.locator('#game-screen')).toBeVisible();

    // Type first correct letter from data-word via key-catcher focus
    const first = await page.evaluate(() => {
      const g = window.__typingKids?.game;
      return g?.current?.word?.[0] || null;
    });
    if (first) {
      await page.keyboard.press(first);
      // progress should advance or still be on game
      await expect(page.locator('#game-screen')).toBeVisible();
    }
  });

  test('medium mode hides big letter tile', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem(
        'typingKidsID_v1',
        JSON.stringify({
          totalStars: 0,
          missionsWon: 0,
          muted: true,
          difficulty: 'medium',
          category: 'all',
          language: 'id',
          tutorialDone: true,
          tutorialDoneEn: true,
        })
      );
    });
    await page.reload();
    await page.locator('#mode-medium').click();
    await page.locator('#start-btn').click();
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#game-screen')).toHaveClass(/mode-medium/);
    await expect(page.locator('#target-block')).toBeHidden();
    await expect(page.locator('#word-full')).toBeVisible();
  });

  test('voice pack manifest is available', async ({ page }) => {
    const res = await page.request.get('/assets/audio/voice/manifest.json');
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.id).toBeTruthy();
    expect(json.en).toBeTruthy();
    expect(Object.keys(json.id).length).toBeGreaterThan(50);
  });

  test('on-screen keyboard and letters mode exist', async ({ page }) => {
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
    await expect(page.locator('#mode-letters')).toBeVisible();
    await expect(page.locator('#parent-dash')).toBeVisible();
    await expect(page.locator('#weekly-card')).toBeVisible();
    await page.locator('#mode-letters').click();
    await page.locator('#start-btn').click();
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#osk')).toBeVisible();
    await expect(page.locator('.osk-key').first()).toBeVisible();
    await expect(page.locator('#game-screen')).toHaveClass(/mode-letters/);
  });

  test('class code does not override free start; play class is separate', async ({
    page,
  }) => {
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
          classCode: 'ABCD',
        })
      );
    });
    await page.reload();
    await page.locator('#mode-letters').click();
    await page.locator('#start-btn').click();
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });
    // Free start keeps letters mode, not class-forced mode
    await expect(page.locator('#game-screen')).toHaveClass(/mode-letters/);
  });

  test('hard mode shows timer', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem(
        'typingKidsID_v1',
        JSON.stringify({
          totalStars: 0,
          missionsWon: 0,
          muted: true,
          difficulty: 'hard',
          category: 'all',
          language: 'id',
          tutorialDone: true,
          tutorialDoneEn: true,
        })
      );
    });
    await page.reload();
    await page.locator('#mode-hard').click();
    await page.locator('#start-btn').click();
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#timer-wrap')).toBeVisible();
    await expect(page.locator('#word-full')).toBeHidden();
  });

  test('parent dash a11y toggles apply classes', async ({ page }) => {
    await page.goto('/');
    await page.locator('#parent-dash').locator('summary').click();
    await page.locator('#a11y-contrast').check();
    await expect(page.locator('html')).toHaveClass(/a11y-contrast/);
    await page.locator('#a11y-large').check();
    await expect(page.locator('html')).toHaveClass(/a11y-large/);
  });
});
