// @ts-check
import { test, expect } from '@playwright/test';

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

/** Type the current word fully via keyboard */
async function typeCurrentWord(page) {
  const word = await page.evaluate(() => window.__typingKids.game.current?.word);
  expect(word).toBeTruthy();
  for (const ch of word) {
    await page.keyboard.press(ch);
    await page.waitForTimeout(40);
  }
  return word;
}

test.describe('Deep flows', () => {
  test('type full word earns a star and can reach victory', async ({ page }) => {
    await boot(page, seedDone({ difficulty: 'easy' }));
    await page.locator('#start-btn').click();
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });

    // Short mission for e2e
    await page.evaluate(() => {
      const g = window.__typingKids.game;
      g._sessionTarget = 1;
      g.ui.setSessionTarget(1);
      g.ui.setSessionStars(0, 1);
    });

    await typeCurrentWord(page);

    // Celebration → victory (target 1)
    await expect(page.locator('#victory-screen')).toBeVisible({
      timeout: 12_000,
    });
    await expect(page.locator('#share-btn')).toBeVisible();
    await expect(page.locator('#cert-btn')).toBeVisible();
    await expect(page.locator('#parent-list')).toBeVisible();
    // Accuracy row present after hotfix
    await expect(page.locator('#parent-list')).toContainText(/Akurasi|Accuracy/i);
  });

  test('letters mode: one key completes a letter star path', async ({ page }) => {
    await boot(page, seedDone({ difficulty: 'letters' }));
    await page.locator('#mode-letters').click();
    await page.locator('#start-btn').click();
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#game-screen')).toHaveClass(/mode-letters/);

    await page.evaluate(() => {
      const g = window.__typingKids.game;
      g._sessionTarget = 1;
      g.ui.setSessionTarget(1);
      g.ui.setSessionStars(0, 1);
    });

    const ch = await page.evaluate(
      () => window.__typingKids.game.current?.word?.[0]
    );
    await page.keyboard.press(ch);
    await expect(page.locator('#victory-screen')).toBeVisible({
      timeout: 12_000,
    });
  });

  test('daily mission starts game', async ({ page }) => {
    await boot(page, seedDone());
    await page.locator('#daily-btn').click();
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#word-image, #target-letter').first()).toBeVisible();
  });

  test('mute toggles aria-pressed', async ({ page }) => {
    await boot(page, seedDone({ muted: false }));
    const btn = page.locator('#mute-btn');
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  test('wrong then correct still progresses (no-fail)', async ({ page }) => {
    await boot(page, seedDone());
    await page.locator('#start-btn').click();
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });

    const first = await page.evaluate(
      () => window.__typingKids.game.current?.word?.[0]
    );
    // Wrong keys
    await page.keyboard.press('z');
    await page.keyboard.press('x');
    await expect(page.locator('#game-screen')).toBeVisible();
    // Correct first letter
    await page.keyboard.press(first);
    const cursor = await page.evaluate(
      () => window.__typingKids.game.cursor
    );
    expect(cursor).toBe(1);
  });

  test('OSK key press advances letter', async ({ page }) => {
    await boot(page, seedDone());
    await page.locator('#start-btn').click();
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });
    const first = await page.evaluate(
      () => window.__typingKids.game.current?.word?.[0]
    );
    await page.locator(`.osk-key[data-key="${first}"]`).click();
    const cursor = await page.evaluate(
      () => window.__typingKids.game.cursor
    );
    expect(cursor).toBe(1);
  });

  test('English mission loads English UI in game', async ({ page }) => {
    await boot(page, seedDone({ language: 'en', tutorialDoneEn: true }));
    await page.locator('#lang-en').click();
    await page.locator('#start-btn').click();
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#goal-label')).toHaveText(/Mission target/i);
  });
});
