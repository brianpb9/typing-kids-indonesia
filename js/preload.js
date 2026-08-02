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

/**
 * Warm audio URLs (does not wait for full decode)
 * @param {string[]} urls
 * @returns {Promise<void>}
 */
export function preloadAudio(urls) {
  if (!urls?.length) return Promise.resolve();
  const list = [...new Set(urls.filter(Boolean))].slice(0, 12);
  return Promise.all(
    list.map(
      (src) =>
        new Promise((resolve) => {
          try {
            const a = new Audio();
            a.preload = 'auto';
            const done = () => resolve();
            a.addEventListener('canplaythrough', done, { once: true });
            a.addEventListener('error', done, { once: true });
            a.src = src;
            // Safari sometimes needs load()
            try {
              a.load();
            } catch {
              /* ignore */
            }
            setTimeout(done, 2500);
          } catch {
            resolve();
          }
        })
    )
  ).then(() => {});
}

export default { preloadImages, preloadAudio };
