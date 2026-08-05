// @ts-check
/**
 * Lightweight performance smoke (not full Lighthouse CI).
 * Checks critical assets are small enough / load quickly.
 */
import { test, expect } from '@playwright/test';

test.describe('Perf smoke', () => {
  test('home paint essentials under budget', async ({ page }) => {
    const started = Date.now();
    await page.goto('/');
    await expect(page.locator('#start-screen')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#app-title')).toBeVisible();
    const ms = Date.now() - started;
    // Static serve should be well under 5s locally
    expect(ms).toBeLessThan(8000);
  });

  test('critical payloads are present and not huge', async ({ page }) => {
    const checks = [
      { path: '/js/game.js', max: 120_000 },
      { path: '/js/ui.js', max: 120_000 },
      { path: '/css/styles.css', max: 80_000 },
      { path: '/assets/brand/poppu/poppu-idle.png', max: 200_000 },
      { path: '/assets/brand/poppu/icon-192.png', max: 80_000 },
    ];
    for (const c of checks) {
      const res = await page.request.get(c.path);
      expect(res.ok(), c.path).toBeTruthy();
      const buf = await res.body();
      expect(buf.byteLength, `${c.path} size`).toBeLessThan(c.max);
    }
  });

  test('SW script is progressive (shell first)', async ({ page }) => {
    const res = await page.request.get('/sw.js');
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    expect(text).toMatch(/PRECACHE_SHELL/);
    expect(text).toMatch(/typing-kids-v33/);
    expect(text).toMatch(/WARM_MEDIA|warmMedia/);
  });
});
