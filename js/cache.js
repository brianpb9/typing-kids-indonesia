/**
 * Offline cache helpers — talk to service worker + warm browser cache
 */

/**
 * Ask controlling SW to cache URLs (if available)
 * @param {string[]} urls
 */
export function swCacheUrls(urls) {
  const list = [...new Set((urls || []).filter(Boolean))];
  if (!list.length) return;
  try {
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_URLS',
        urls: list,
      });
    }
  } catch {
    /* ignore */
  }
}

/**
 * Fetch URLs to fill HTTP + SW cache (bounded concurrency)
 * @param {string[]} urls
 * @param {{ concurrency?: number }} [opts]
 * @returns {Promise<void>}
 */
export async function warmFetch(urls, opts = {}) {
  const list = [...new Set((urls || []).filter(Boolean))];
  if (!list.length) return;
  swCacheUrls(list);

  const CONC = opts.concurrency ?? 6;
  let i = 0;
  const worker = async () => {
    while (i < list.length) {
      const src = list[i++];
      try {
        await fetch(src, { cache: 'force-cache', mode: 'same-origin' });
      } catch {
        /* ignore */
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(CONC, list.length) }, () => worker())
  );
}

/**
 * Run when browser is idle (or after timeout fallback)
 * @param {() => void} fn
 * @param {number} [timeoutMs]
 */
export function whenIdle(fn, timeoutMs = 2000) {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => fn(), { timeout: timeoutMs });
  } else {
    setTimeout(fn, Math.min(timeoutMs, 800));
  }
}

/**
 * Collect image paths from loaded word banks
 * @param {Array<{ image?: string }>} words
 * @returns {string[]}
 */
export function imagePathsFromWords(words) {
  const out = [];
  const seen = new Set();
  for (const w of words || []) {
    if (!w?.image) continue;
    const p = w.image.split('?')[0];
    if (seen.has(p)) continue;
    seen.add(p);
    out.push(p);
  }
  return out;
}

export default { swCacheUrls, warmFetch, whenIdle, imagePathsFromWords };
