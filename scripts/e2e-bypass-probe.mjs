// Probe: ?e2e bypass must work on loopback but NOT on a public hostname.
// Serves the repo locally, maps public-poppu.test -> 127.0.0.1 via
// chromium host-resolver-rules, then checks both debug handle and gate.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const PORT = 4178;
const BASE = `http://127.0.0.1:${PORT}`;

const server = spawn('npx', ['--yes', 'serve', '.', '-l', String(PORT)], {
  stdio: 'ignore',
});
await new Promise((r) => setTimeout(r, 2500));

async function check(browser, url) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const el = document.getElementById('start-btn');
    return el && !el.classList.contains('hidden');
  }, null, { timeout: 20_000 }).catch(() => {});
  const result = await page.evaluate(() => ({
    debugHandle: typeof window.__typingKids !== 'undefined',
    // The gate UI object is not exported on public hosts, so probe via the
    // parent dashboard: open it and see whether the gate overlay appears.
  }));
  // Gate probe: click the parent dashboard summary, see if gate opens
  await page.evaluate(() => {
    const sum = document.querySelector('#parent-dash summary');
    sum?.click();
  });
  await page.waitForTimeout(400);
  result.gateShown = await page.evaluate(() => {
    const g = document.getElementById('gate-overlay');
    return g ? !g.classList.contains('hidden') : null;
  });
  result.dashOpen = await page.evaluate(
    () => document.getElementById('parent-dash')?.open ?? null
  );
  await page.close();
  return result;
}

const browser = await chromium.launch({
  headless: true,
  args: ['--host-resolver-rules=MAP public-poppu.test 127.0.0.1'],
});

try {
  const local = await check(browser, `${BASE}/?e2e`);
  const pub = await check(browser, `http://public-poppu.test:${PORT}/?e2e`);

  console.log('loopback  :', JSON.stringify(local));
  console.log('publicHost:', JSON.stringify(pub));

  let ok = true;
  if (!local.debugHandle) { console.error('FAIL: debug handle missing on loopback'); ok = false; }
  if (pub.debugHandle) { console.error('FAIL: debug handle EXPOSED on public host'); ok = false; }
  // With ?e2e on loopback the gate is bypassed (dashboard opens directly);
  // on a public host the gate overlay must appear instead.
  if (!local.dashOpen) { console.error('FAIL: loopback ?e2e did not bypass gate'); ok = false; }
  if (pub.gateShown !== true || pub.dashOpen !== false) {
    console.error('FAIL: gate NOT enforced on public host'); ok = false;
  }
  console.log(ok ? 'PROBE PASS' : 'PROBE FAIL');
  process.exitCode = ok ? 0 : 1;
} finally {
  await browser.close();
  server.kill();
}
