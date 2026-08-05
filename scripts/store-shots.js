// Store listing screenshots — Play Store phone screenshots (hi-res via deviceScaleFactor).
// Output: test-results/store-*.png (1170×2532 effective). Review, then copy keepers to play-store/screenshots/.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 4175;
const BASE = `http://127.0.0.1:${PORT}`;

const seed = {
  totalStars: 23,
  missionsWon: 3,
  muted: true,
  difficulty: 'easy',
  category: 'all',
  language: 'id',
  tutorialDone: true,
  tutorialDoneEn: true,
  // some word mastery so sticker book & stats look alive
  mastery: { apel: { count: 3 }, kucing: { count: 2 }, bola: { count: 2 }, susu: { count: 1 }, 'char-puffy': { count: 1 } },
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

async function newGamePage(browser, lang) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  await page.goto(BASE + '/');
  await page.evaluate((data) => localStorage.setItem('typingKidsID_v1', JSON.stringify(data)), { ...seed, language: lang });
  await page.reload();
  await page.waitForFunction(() => window.__typingKids?.game);
  await page.waitForTimeout(900);
  return page;
}

async function typeWord(page) {
  const word = await page.evaluate(() => window.__typingKids.game.current?.word);
  for (const ch of word) {
    await page.keyboard.press(ch);
    await page.waitForTimeout(60);
  }
}

async function shootSet(browser, lang, tag) {
  // 1. Home / map-first start screen
  let page = await newGamePage(browser, lang);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `test-results/store-${tag}-1-home.png` });

  // 2. Easy gameplay with companion (Padang Ketik → Puffy)
  await page.locator('#station-meadow').click();
  await page.waitForSelector('#game-screen:not(.hidden)', { timeout: 10_000 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `test-results/store-${tag}-2-game.png` });

  // 3. Victory with friend jump (shrink mission to 1 star)
  await page.evaluate(() => {
    const g = window.__typingKids.game;
    g._sessionTarget = 1;
    g.ui.setSessionTarget(1);
    g.ui.setSessionStars(0, 1);
  });
  await typeWord(page);
  await page.waitForSelector('#victory-screen:not(.hidden)', { timeout: 12_000 });
  await page.waitForTimeout(1300);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `test-results/store-${tag}-3-victory.png` });
  await page.close();

  // 4. Letters mode (Pantai ABC → Peeky)
  page = await newGamePage(browser, lang);
  await page.locator('#station-abc').click();
  await page.waitForSelector('#game-screen:not(.hidden)', { timeout: 10_000 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `test-results/store-${tag}-4-letters.png` });
  await page.close();

  // 5. Hard mode with timer (Istana Bintang → Orby)
  page = await newGamePage(browser, lang);
  await page.locator('#station-castle').click();
  await page.waitForSelector('#game-screen:not(.hidden)', { timeout: 10_000 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `test-results/store-${tag}-5-hard.png` });

  // 6. Sticker book (via Lainnya panel, back on start)
  await page.evaluate(() => window.__typingKids.game.goHome());
  await page.waitForSelector('#start-screen:not(.hidden)', { timeout: 5_000 });
  const more = page.locator('#more-title');
  if (await more.count()) await more.click();
  await page.waitForTimeout(400);
  const stickerBtn = page.locator('#sticker-book-btn, [data-i18n*="sticker" i], #sticker-book button').first();
  await stickerBtn.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(400);
  await page.screenshot({ path: `test-results/store-${tag}-6-more.png`, fullPage: false });
  await page.close();
}

const server = spawn('npx', ['--yes', 'serve', '.', '-l', String(PORT)], { stdio: 'ignore' });
try {
  await waitForServer(BASE);
  const browser = await chromium.launch();
  await shootSet(browser, 'id', 'id');
  await shootSet(browser, 'en', 'en');
  await browser.close();
  console.log('store screenshots saved to test-results/store-*.png');
} finally {
  server.kill();
}
