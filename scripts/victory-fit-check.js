// Quick check: victory CTA fits one screen at small viewports.
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

async function check(browser, viewport) {
  const page = await browser.newPage({ viewport });
  await page.goto(BASE + '/');
  await page.evaluate((data) => {
    localStorage.setItem('typingKidsID_v1', JSON.stringify(data));
  }, seed);
  await page.reload();
  await page.waitForFunction(() => window.__typingKids?.game);
  await page.locator('#start-btn').click();
  await page.waitForSelector('#game-screen:not(.hidden)', { timeout: 10_000 });
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
  await page.waitForTimeout(1800);
  const res = await page.evaluate(() => {
    window.scrollTo(0, 0);
    const btn = document.getElementById('replay-btn');
    const r = btn.getBoundingClientRect();
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      ctaBottom: Math.round(r.bottom),
      fits: r.bottom <= window.innerHeight && r.top >= 0,
      scrollHeight: document.documentElement.scrollHeight,
    };
  });
  await page.screenshot({
    path: `test-results/victory-fit-${viewport.width}x${viewport.height}.png`,
  });
  await page.close();
  console.log(JSON.stringify(res));
}

const server = spawn('npx', ['--yes', 'serve', '.', '-l', String(PORT)], {
  stdio: 'ignore',
});
try {
  await waitForServer(BASE);
  const browser = await chromium.launch();
  await check(browser, { width: 360, height: 640 });
  await check(browser, { width: 390, height: 844 });
  await check(browser, { width: 430, height: 932 });
  await browser.close();
} finally {
  server.kill();
}
