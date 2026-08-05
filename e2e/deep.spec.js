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

  test('warm-up has back button to home', async ({ page }) => {
    await boot(page, seedDone({ difficulty: 'letters' }));
    await page.locator('#mode-letters').click();
    await page.locator('#start-btn').click();
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#game-home-btn')).toBeVisible();
    await expect(page.locator('#back-btn')).toBeVisible();
    await page.locator('#game-home-btn').click();
    await expect(page.locator('#start-screen')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('#game-screen')).toBeHidden();
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

  test('mini mission 5 stars and journey path exist in game', async ({
    page,
  }) => {
    await boot(page, seedDone());
    await page.locator('#length-mini').click();
    await page.locator('#start-btn').click();
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#session-target')).toHaveText('5');
    await expect(page.locator('#journey')).toBeVisible();
    await expect(page.locator('#journey-poppu')).toBeVisible();
    await expect(page.locator('#poppu-bubble, #poppu-bubble-text').first()).toBeAttached();
  });

  test('world map ABC station starts letters mode', async ({ page }) => {
    await boot(page, seedDone());
    await page.locator('#station-abc').click();
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#game-screen')).toHaveClass(/mode-letters/);
  });

  test('station friends show on map and as in-game companion', async ({
    page,
  }) => {
    await boot(page, seedDone());
    await expect(page.locator('#station-abc .station-friend')).toBeVisible();
    await expect(page.locator('#station-meadow .station-friend')).toBeVisible();
    await expect(page.locator('#station-castle .station-friend')).toBeVisible();
    // ABC station → Peeky companion in-game
    await page.locator('#station-abc').click();
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10_000 });
    const companion = page.locator('#game-companion');
    await expect(companion).toBeVisible();
    await expect(companion).toHaveAttribute('src', /peeky-base/);
  });

  test('word images and voice manifest are fetchable offline-ready', async ({
    page,
  }) => {
    const man = await page.request.get('/assets/audio/voice/manifest.json');
    expect(man.ok()).toBeTruthy();
    const json = await man.json();
    const sampleId = Object.values(json.id || {})[0];
    const sampleEn = Object.values(json.en || {})[0];
    expect(sampleId).toBeTruthy();
    const a = await page.request.get('/' + String(sampleId).replace(/^\//, ''));
    expect(a.ok()).toBeTruthy();
    if (sampleEn) {
      const b = await page.request.get(
        '/' + String(sampleEn).replace(/^\//, '')
      );
      expect(b.ok()).toBeTruthy();
    }
    const words = await page.request.get('/data/words.json');
    expect(words.ok()).toBeTruthy();
    const data = await words.json();
    const img = data.words[0].image.split('?')[0];
    const imgRes = await page.request.get('/' + img.replace(/^\//, ''));
    expect(imgRes.ok()).toBeTruthy();
  });
});
