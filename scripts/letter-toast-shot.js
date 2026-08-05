import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const BASE = 'http://127.0.0.1:4177';
const server = spawn('npx', ['--yes', 'serve', '.', '-l', '4177'], { stdio: 'ignore' });
const wait = async () => { for (let i=0;i<80;i++){ try{ const r=await fetch(BASE); if(r.ok) return; }catch{} await new Promise(r=>setTimeout(r,250)); } throw new Error('timeout'); };
try {
  await wait();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.goto(BASE + '/');
  await page.evaluate(() => localStorage.setItem('typingKidsID_v1', JSON.stringify({ muted: true, difficulty: 'letters', language: 'id', tutorialDone: true })));
  await page.reload();
  await page.waitForFunction(() => window.__typingKids?.game);
  await page.locator('#mode-letters').click();
  await page.locator('#start-btn').click();
  await page.waitForSelector('#game-screen:not(.hidden)', { timeout: 10000 });
  const ch = await page.evaluate(() => window.__typingKids.game.current?.word?.[0]);
  await page.keyboard.press(ch);
  await page.waitForSelector('#sticker-toast:not(.hidden)', { timeout: 8000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/letter-sticker-toast.png' });
  await browser.close();
  console.log('ok');
} finally { server.kill(); }
