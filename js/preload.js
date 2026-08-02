/**
 * Image + audio preloader — warm browser cache
 */

/**
 * @param {string[]} urls
 * @param {number} [concurrency]
 * @returns {Promise<void>}
 */
export function preloadImages(urls, concurrency = 6) {
  if (!urls?.length) return Promise.resolve();

  const list = [...new Set(urls.filter(Boolean))];
  let i = 0;

  const worker = () =>
    new Promise((resolve) => {
      const next = () => {
        if (i >= list.length) {
          resolve();
          return;
        }
        const url = list[i++];
        const img = new Image();
        img.decoding = 'async';
        const done = () => next();
        img.onload = done;
        img.onerror = done;
        img.src = url;
      };
      next();
    });

  const n = Math.min(concurrency, list.length);
  return Promise.all(Array.from({ length: n }, () => worker())).then(() => {});
}

/** Reuse a small pool of Audio elements to avoid leaks */
const _audioPool = [];
const POOL_MAX = 4;

/**
 * Warm audio URLs (does not wait for full decode)
 * @param {string[]} urls
 * @returns {Promise<void>}
 */
export function preloadAudio(urls) {
  if (!urls?.length) return Promise.resolve();
  const list = [...new Set(urls.filter(Boolean))].slice(0, 8);
  return Promise.all(
    list.map(
      (src, idx) =>
        new Promise((resolve) => {
          try {
            let a = _audioPool[idx % POOL_MAX];
            if (!a) {
              a = new Audio();
              a.preload = 'auto';
              _audioPool[idx % POOL_MAX] = a;
            }
            const done = () => resolve();
            a.addEventListener('canplaythrough', done, { once: true });
            a.addEventListener('error', done, { once: true });
            a.src = src;
            try {
              a.load();
            } catch {
              /* ignore */
            }
            setTimeout(done, 2000);
          } catch {
            resolve();
          }
        })
    )
  ).then(() => {});
}

export default { preloadImages, preloadAudio };
