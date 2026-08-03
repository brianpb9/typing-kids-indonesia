/* Typing Kids — offline shell + full voice pack precache + runtime cache */
const CACHE = 'typing-kids-v19';
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

/** Cache each URL independently (one 404 must not fail the rest) */
async function precacheAll(cache, urls) {
  const list = [...new Set(urls.filter(Boolean))];
  // Bound concurrency to avoid hammering install
  const CONC = 8;
  let i = 0;
  async function worker() {
    while (i < list.length) {
      const url = list[i++];
      try {
        const abs = url.startsWith('http')
          ? url
          : new URL(url.startsWith('/') ? url : `/${url}`, self.location.origin).pathname;
        const res = await fetch(abs, { cache: 'reload' });
        if (res && res.ok) await cache.put(abs, res);
      } catch {
        /* skip */
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONC, list.length) }, () => worker()));
}

/** Pull every voice pack path from manifest (~0.8MB total) */
async function precacheVoicePack(cache) {
  try {
    const res = await fetch('/assets/audio/voice/manifest.json', { cache: 'reload' });
    if (!res.ok) return;
    await cache.put('/assets/audio/voice/manifest.json', res.clone());
    const m = await res.json();
    const paths = [];
    for (const bag of [m.id, m.en]) {
      if (!bag || typeof bag !== 'object') continue;
      for (const p of Object.values(bag)) {
        if (typeof p === 'string') paths.push(p);
      }
    }
    await precacheAll(cache, paths);
  } catch {
    /* voice optional on install */
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await precacheAll(cache, PRECACHE);
      await precacheVoicePack(cache);
      await self.skipWaiting();
    })()
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

/** Client can ask SW to warm additional URLs (images / late voice) */
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'CACHE_URLS' && Array.isArray(data.urls)) {
    event.waitUntil(
      caches.open(CACHE).then((cache) => precacheAll(cache, data.urls))
    );
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = req.url;
  const isVoice = url.includes('/assets/audio/voice/');
  const isImage = url.includes('/assets/images/');
  const isStatic =
    isVoice ||
    isImage ||
    url.includes('/assets/') ||
    url.includes('/data/') ||
    url.includes('/js/') ||
    url.includes('/css/');

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.ok && isStatic) {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);

      // Cache-first for voice + images (offline-friendly)
      if (isVoice || isImage) {
        return cached || fetchPromise;
      }
      return cached || fetchPromise;
    })
  );
});
