/**
 * Image preloader — warm browser cache for smoother word transitions
 */

/**
 * @param {string[]} urls absolute or relative image paths
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

export default { preloadImages };
