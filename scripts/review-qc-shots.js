// QC keeper screenshots for the 4 review-board fixes:
// gate (loopback-only bypass), shaded word icon in game,
// Hapus data confirm panel, victory journey bar.
// Run AFTER the e2e suite — Playwright wipes test-results/ on every run.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 4177;
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

async function boot(page, query = '/') {
  await page.goto(BASE + query);
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
    await page.locator('.gate-key[data-key="5"]').click();
    await page.locator('.gate-key[data-key="6"]').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/gate-numpad-390x844.png` });
    await page.close();
  }

  // 2) Shaded word icon in game (kucing — top-30 shaded set)
  {
    const page = await browser.newPage({
      viewport: { width: 360, height: 640 },
      isMobile: true,
      hasTouch: true,
    });
    await boot(page);
    await page.locator('#start-btn').click();
    await page.waitForSelector('#game-screen:not(.hidden)', { timeout: 10_000 });
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
    await page.screenshot({ path: `${OUT}/game-shaded-icon-360x640.png` });
    await page.close();
  }

  // 3) Hapus data — gated parent dashboard with erase confirm open
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await boot(page, '/?e2e'); // gate bypass honored on loopback only
    await page.evaluate(() => {
      document.getElementById('parent-dash').open = true;
    });
    await page.locator('#erase-data-btn').click();
    await page.waitForSelector('#erase-confirm:not(.hidden)');
    await page.locator('#erase-confirm').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/hapus-data-390x844.png` });
    // Functional check: confirm wipes app keys and restarts
    await page.locator('#erase-yes').click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);
    const keysLeft = await page.evaluate(() => {
      const out = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('typingKids')) out.push(k);
      }
      return out;
    });
    console.log('typingKids keys after erase:', JSON.stringify(keysLeft));
    await page.close();
  }

  // 4) Victory — festive with journey bar, after the animation settles
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
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
    await page.screenshot({ path: `${OUT}/victory-390x844.png` });
    await page.close();
  }

  await browser.close();
  console.log(`keeper screenshots saved to ${OUT}/`);
} finally {
  server.kill();
}
