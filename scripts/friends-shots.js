// Friends QC screenshots — home (station friends) / in-game companion / victory
// friend, desktop 1280×800 + mobile 390×844 → test-results/friends-*.png.
// Starts a static server on 4174, seeds localStorage like e2e/deep.spec.js.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 4174;
const BASE = `http://127.0.0.1:${PORT}`;

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

async function shoot(browser, viewport, suffix) {
  const page = await browser.newPage({ viewport });
  await page.goto(BASE + '/');
  await page.evaluate((data) => {
    localStorage.setItem('typingKidsID_v1', JSON.stringify(data));
  }, seed);
  await page.reload();
  await page.waitForFunction(() => window.__typingKids?.game);
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `test-results/friends-home-${suffix}.png` });

  // In-game easy mode via Padang Ketik station (Puffy companion)
  await page.locator('#station-meadow').click();
  await page.waitForSelector('#game-screen:not(.hidden)', { timeout: 10_000 });
  await page.waitForSelector('#game-companion:not(.hidden)', { timeout: 5_000 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `test-results/friends-game-${suffix}.png` });

  // Victory: shrink mission to 1 star and type the word
  await page.evaluate(() => {
    const g = window.__typingKids.game;
    g._sessionTarget = 1;
    g.ui.setSessionTarget(1);
    g.ui.setSessionStars(0, 1);
  });
  const word = await page.evaluate(() => window.__typingKids.game.current?.word);
  for (const ch of word) {
    await page.keyboard.press(ch);
    await page.waitForTimeout(50);
  }
  await page.waitForSelector('#victory-screen:not(.hidden)', { timeout: 12_000 });
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `test-results/friends-victory-${suffix}.png` });
  await page.close();
}

const server = spawn('npx', ['--yes', 'serve', '.', '-l', String(PORT)], {
  stdio: 'ignore',
});
try {
  await waitForServer(BASE);
  const browser = await chromium.launch();
  await shoot(browser, { width: 1280, height: 800 }, 'desktop');
  await shoot(browser, { width: 390, height: 844 }, 'mobile');
  await browser.close();
  console.log('screenshots saved to test-results/friends-*.png');
} finally {
  server.kill();
}
