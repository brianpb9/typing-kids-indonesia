/* Typing Kids — offline shell + resilient precache + runtime voice cache */
const CACHE = 'typing-kids-v18';
const PRECACHE = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/css/animations.css',
  '/assets/fonts/nunito.css',
  '/assets/fonts/nunito-600.woff2',
  '/assets/fonts/nunito-700.woff2',
  '/assets/fonts/nunito-800.woff2',
  '/assets/fonts/nunito-900.woff2',
  '/js/main.js',
  '/js/config.js',
  '/js/game.js',
  '/js/ui.js',
  '/js/words.js',
  '/js/audio.js',
  '/js/input.js',
  '/js/animation.js',
  '/js/storage.js',
  '/js/i18n.js',
  '/js/preload.js',
  '/js/daily.js',
  '/js/weekly.js',
  '/js/classroom.js',
  '/js/achievements.js',
  '/js/letters.js',
  '/js/certificate.js',
  '/js/analytics.js',
  '/data/words.json',
  '/data/words-en.json',
  '/assets/audio/voice/manifest.json',
  '/manifest.webmanifest',
];

/** addAll fails entirely on one 404 — cache individually instead */
async function precacheAll(cache, urls) {
  await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'reload' });
        if (res && res.ok) await cache.put(url, res);
      } catch {
        /* skip missing */
      }
    })
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => precacheAll(cache, PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (
            res &&
            res.ok &&
            (req.url.includes('/assets/') ||
              req.url.includes('/data/') ||
              req.url.includes('/js/') ||
              req.url.includes('/css/'))
          ) {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
      if (
        req.url.includes('/assets/audio/voice/') ||
        req.url.includes('/assets/images/')
      ) {
        return cached || fetchPromise;
      }
      return cached || fetchPromise;
    })
  );
});
