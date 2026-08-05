// QC keeper screenshots for the 4 backlog items:
// parental gate numpad, storybook word icon, festive victory (journey bar).
// Run AFTER the e2e suite — Playwright wipes test-results/ on every run.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 4176;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = 'test-results/keepers';

const seed = {
  totalStars: 0,
  missionsWon: 0,
  muted: true,
  difficulty: 'easy',
  category: 'all',
  language: 'id',
  tutorialDone: true,
  tutorialDoneEn: true,
};

function waitForServer(url, timeoutMs = 30_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) return resolve();
      } catch {
        /* not up yet */
      }
      if (Date.now() - start > timeoutMs) return reject(new Error('server timeout'));
      setTimeout(tick, 250);
    };
    tick();
  });
}

async function boot(page) {
  await page.goto(BASE + '/');
  await page.evaluate((data) => {
    localStorage.setItem('typingKidsID_v1', JSON.stringify(data));
  }, seed);
  await page.reload();
  await page.waitForFunction(() => window.__typingKids?.game);
}

const server = spawn('npx', ['--yes', 'serve', '.', '-l', String(PORT)], {
  stdio: 'ignore',
});
try {
  await waitForServer(BASE);
  const browser = await chromium.launch();

  // 1) Parental gate — typed-answer numpad
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await boot(page);
    await page.locator('#parent-dash').locator('summary').click();
    await page.waitForSelector('#gate-overlay:not(.hidden)');
    // Type a couple of digits so the readout state is visible
    await page.locator('.gate-key[data-key="5"]').click();
    await page.locator('.gate-key[data-key="6"]').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/gate-numpad-390x844.png` });
    await page.close();
  }

  // 2) Word icon — storybook style at 360×640
  {
    const page = await browser.newPage({
      viewport: { width: 360, height: 640 },
      isMobile: true,
      hasTouch: true,
    });
    await boot(page);
    await page.locator('#start-btn').click();
    await page.waitForSelector('#game-screen:not(.hidden)', { timeout: 10_000 });
    // Show a real picture icon (not a solid color swatch) for the style check
    await page.evaluate(() => {
      const g = window.__typingKids.game;
      g.ui.setWord(
        { image: 'assets/images/kucing.png', display: 'Kucing', word: 'kucing' },
        0
      );
      g.ui.showPoppuSay('Ayo ketik: Kucing!', 3000);
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${OUT}/game-icon-360x640.png` });
    await page.close();
  }

  // 3) Victory — festive with journey bar, after the animation settles
  for (const [vp, name] of [
    [{ width: 360, height: 640 }, '360x640'],
    [{ width: 390, height: 844 }, '390x844'],
  ]) {
    const page = await browser.newPage({
      viewport: vp,
      isMobile: true,
      hasTouch: true,
    });
    await boot(page);
    await page.locator('#start-btn').click();
    await page.waitForSelector('#game-screen:not(.hidden)', { timeout: 10_000 });
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
      await page.waitForTimeout(50);
    }
    await page.waitForSelector('#victory-screen:not(.hidden)', {
      timeout: 12_000,
    });
    await page.waitForTimeout(1400); // journey bar mid-walk + confetti
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${OUT}/victory-${name}.png` });
    await page.close();
  }

  await browser.close();
  console.log(`keeper screenshots saved to ${OUT}/`);
} finally {
  server.kill();
}
