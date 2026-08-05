// OSK key-popup screenshot — press-and-hold an OSK key at 390×844 and capture
// the popup bubble. Output: test-results/osk-popup-mobile.png
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 4176;
const BASE = `http://127.0.0.1:${PORT}`;

const seed = {
  totalStars: 23,
  missionsWon: 3,
  muted: true,
  difficulty: 'easy',
  category: 'all',
  language: 'id',
  tutorialDone: true,
};

function waitForServer(url, timeoutMs = 30_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) return resolve();
      } catch { /* not up yet */ }
      if (Date.now() - start > timeoutMs) return reject(new Error('server timeout'));
      setTimeout(tick, 250);
    };
    tick();
  });
}

const server = spawn('npx', ['--yes', 'serve', '.', '-l', String(PORT)], { stdio: 'ignore' });
try {
  await waitForServer(BASE);
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
  });
  await page.goto(BASE + '/');
  await page.evaluate((data) => localStorage.setItem('typingKidsID_v1', JSON.stringify(data)), seed);
  await page.reload();
  await page.waitForFunction(() => window.__typingKids?.game);
  await page.waitForTimeout(600);

  await page.locator('#station-meadow').click();
  await page.waitForSelector('#game-screen:not(.hidden)', { timeout: 10_000 });
  await page.waitForTimeout(800);

  // Press-and-hold a mid-row key, then an edge key to check viewport clamping
  const key = page.locator('.osk-key[data-key="k"]');
  await key.dispatchEvent('pointerdown', { pointerType: 'touch' });
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'test-results/osk-popup-mobile.png' });
  await key.dispatchEvent('pointerup', { pointerType: 'touch' });

  const edge = page.locator('.osk-key[data-key="q"]');
  await edge.dispatchEvent('pointerdown', { pointerType: 'touch' });
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'test-results/osk-popup-mobile-edge.png' });
  await edge.dispatchEvent('pointerup', { pointerType: 'touch' });

  await browser.close();
  console.log('saved test-results/osk-popup-mobile.png and -edge.png');
} finally {
  server.kill();
}
