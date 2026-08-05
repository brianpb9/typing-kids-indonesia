/* Poppu Typing Kids — progressive offline cache
 * Install: app shell only (fast).
 * Activate: warm voice + word images in background.
 */
const CACHE = 'typing-kids-v33';

/** Critical shell — keep small for fast first install */
const PRECACHE_SHELL = [
  '/',
  '/index.html',
  '/privacy.html',
  '/css/styles.css',
  '/css/animations.css',
  '/assets/fonts/nunito.css',
  '/assets/fonts/nunito-600.woff2',
  '/assets/fonts/nunito-700.woff2',
  '/assets/fonts/nunito-800.woff2',
  '/assets/fonts/nunito-900.woff2',
  '/assets/fonts/baloo2.css',
  '/assets/fonts/baloo2-3.woff2',
  '/assets/brand/poppu/poppu-idle.png',
  '/assets/brand/poppu/poppu-happy.png',
  '/assets/brand/poppu/poppu-react.png',
  '/assets/brand/poppu/favicon-64.png',
  '/assets/brand/poppu/icon-192.png',
  '/assets/brand/poppu/icon-512.png',
  '/assets/brand/poppu/icon-512-maskable.png',
  '/assets/brand/decor/cloud.png',
  '/assets/brand/decor/bird.png',
  '/assets/backgrounds/bg-garden.png',
  '/assets/backgrounds/worldmap.png',
  '/assets/ui-icons/star-filled.svg',
  '/assets/audio/sfx/click.mp3',
  '/assets/audio/sfx/correct.mp3',
  '/assets/audio/sfx/wrong.mp3',
  '/assets/audio/sfx/star-1.mp3',
  '/assets/audio/sfx/star-2.mp3',
  '/assets/audio/sfx/star-3.mp3',
  '/assets/audio/sfx/win.mp3',
  '/assets/audio/sfx/milestone.mp3',
  '/assets/audio/sfx/voice/vo_correct_1_en.mp3',
  '/assets/audio/sfx/voice/vo_correct_1_id.mp3',
  '/assets/audio/sfx/voice/vo_correct_2_en.mp3',
  '/assets/audio/sfx/voice/vo_correct_2_id.mp3',
  '/assets/audio/sfx/voice/vo_correct_3_en.mp3',
  '/assets/audio/sfx/voice/vo_correct_3_id.mp3',
  '/assets/audio/sfx/voice/vo_correct_4_en.mp3',
  '/assets/audio/sfx/voice/vo_correct_4_id.mp3',
  '/assets/audio/sfx/voice/vo_correct_5_en.mp3',
  '/assets/audio/sfx/voice/vo_correct_5_id.mp3',
  '/assets/audio/sfx/voice/vo_stuck_1_en.mp3',
  '/assets/audio/sfx/voice/vo_stuck_1_id.mp3',
  '/assets/audio/sfx/voice/vo_stuck_2_en.mp3',
  '/assets/audio/sfx/voice/vo_stuck_2_id.mp3',
  '/assets/audio/sfx/voice/vo_stuck_3_en.mp3',
  '/assets/audio/sfx/voice/vo_stuck_3_id.mp3',
  '/assets/audio/sfx/voice/vo_stuck_4_en.mp3',
  '/assets/audio/sfx/voice/vo_stuck_4_id.mp3',
  '/assets/audio/sfx/voice/vo_leveldone_1_en.mp3',
  '/assets/audio/sfx/voice/vo_leveldone_1_id.mp3',
  '/assets/audio/sfx/voice/vo_leveldone_2_en.mp3',
  '/assets/audio/sfx/voice/vo_leveldone_3_en.mp3',
  '/assets/audio/sfx/voice/vo_hello_1_en.mp3',
  '/assets/audio/sfx/voice/vo_hello_1_id.mp3',
  '/assets/brand/friends/zaza-base.png',
  '/assets/brand/friends/zaza-jump.png',
  '/assets/brand/friends/peeky-base.png',
  '/assets/brand/friends/peeky-jump.png',
  '/assets/brand/friends/orby-base.png',
  '/assets/brand/friends/orby-jump.png',
  '/assets/brand/friends/puffy-base.png',
  '/assets/brand/friends/puffy-jump.png',
  '/assets/brand/friends/sticker-zaza.png',
  '/assets/brand/friends/sticker-peeky.png',
  '/assets/brand/friends/sticker-orby.png',
  '/assets/brand/friends/sticker-puffy.png',
  '/assets/audio/sfx/voice/vo_zaza_correct_1_en.mp3',
  '/assets/audio/sfx/voice/vo_zaza_correct_1_id.mp3',
  '/assets/audio/sfx/voice/vo_zaza_correct_2_en.mp3',
  '/assets/audio/sfx/voice/vo_zaza_correct_2_id.mp3',
  '/assets/audio/sfx/voice/vo_zaza_correct_3_en.mp3',
  '/assets/audio/sfx/voice/vo_zaza_correct_3_id.mp3',
  '/assets/audio/sfx/voice/vo_zaza_correct_4_en.mp3',
  '/assets/audio/sfx/voice/vo_zaza_correct_4_id.mp3',
  '/assets/audio/sfx/voice/vo_zaza_hmm_1_en.mp3',
  '/assets/audio/sfx/voice/vo_zaza_hmm_1_id.mp3',
  '/assets/audio/sfx/voice/vo_zaza_leveldone_1_en.mp3',
  '/assets/audio/sfx/voice/vo_zaza_leveldone_1_id.mp3',
  '/assets/audio/sfx/voice/vo_zaza_leveldone_2_en.mp3',
  '/assets/audio/sfx/voice/vo_zaza_leveldone_2_id.mp3',
  '/assets/audio/sfx/voice/vo_zaza_leveldone_3_en.mp3',
  '/assets/audio/sfx/voice/vo_zaza_leveldone_3_id.mp3',
  '/assets/audio/sfx/voice/vo_peeky_correct_1_en.mp3',
  '/assets/audio/sfx/voice/vo_peeky_correct_1_id.mp3',
  '/assets/audio/sfx/voice/vo_peeky_correct_2_en.mp3',
  '/assets/audio/sfx/voice/vo_peeky_correct_2_id.mp3',
  '/assets/audio/sfx/voice/vo_peeky_correct_3_en.mp3',
  '/assets/audio/sfx/voice/vo_peeky_correct_3_id.mp3',
  '/assets/audio/sfx/voice/vo_peeky_correct_4_en.mp3',
  '/assets/audio/sfx/voice/vo_peeky_correct_4_id.mp3',
  '/assets/audio/sfx/voice/vo_peeky_hmm_1_en.mp3',
  '/assets/audio/sfx/voice/vo_peeky_hmm_1_id.mp3',
  '/assets/audio/sfx/voice/vo_peeky_leveldone_1_en.mp3',
  '/assets/audio/sfx/voice/vo_peeky_leveldone_1_id.mp3',
  '/assets/audio/sfx/voice/vo_peeky_leveldone_2_en.mp3',
  '/assets/audio/sfx/voice/vo_peeky_leveldone_2_id.mp3',
  '/assets/audio/sfx/voice/vo_peeky_leveldone_3_en.mp3',
  '/assets/audio/sfx/voice/vo_peeky_leveldone_3_id.mp3',
  '/assets/audio/sfx/voice/vo_peeky_tada.mp3',
  '/assets/audio/sfx/voice/vo_orby_correct_1_en.mp3',
  '/assets/audio/sfx/voice/vo_orby_correct_1_id.mp3',
  '/assets/audio/sfx/voice/vo_orby_correct_2_en.mp3',
  '/assets/audio/sfx/voice/vo_orby_correct_2_id.mp3',
  '/assets/audio/sfx/voice/vo_orby_correct_3_en.mp3',
  '/assets/audio/sfx/voice/vo_orby_correct_3_id.mp3',
  '/assets/audio/sfx/voice/vo_orby_correct_4_en.mp3',
  '/assets/audio/sfx/voice/vo_orby_correct_4_id.mp3',
  '/assets/audio/sfx/voice/vo_orby_hmm_1_en.mp3',
  '/assets/audio/sfx/voice/vo_orby_hmm_1_id.mp3',
  '/assets/audio/sfx/voice/vo_orby_leveldone_1_en.mp3',
  '/assets/audio/sfx/voice/vo_orby_leveldone_1_id.mp3',
  '/assets/audio/sfx/voice/vo_orby_leveldone_2_en.mp3',
  '/assets/audio/sfx/voice/vo_orby_leveldone_2_id.mp3',
  '/assets/audio/sfx/voice/vo_orby_leveldone_3_en.mp3',
  '/assets/audio/sfx/voice/vo_orby_leveldone_3_id.mp3',
  '/assets/audio/bgm/poppu-bg-loop.mp3',
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
  '/js/cache.js',
  '/js/daily.js',
  '/js/weekly.js',
  '/js/classroom.js',
  '/js/mission-seed.js',
  '/js/achievements.js',
  '/js/letters.js',
  '/js/certificate.js',
  '/js/analytics.js',
  '/js/friendship.js',
  '/data/words.json',
  '/data/words-en.json',
  '/assets/audio/voice/manifest.json',
  '/manifest.webmanifest',
];

async function precacheAll(cache, urls) {
  const list = [...new Set(urls.filter(Boolean))];
  const CONC = 8;
  let i = 0;
  async function worker() {
    while (i < list.length) {
      const url = list[i++];
      try {
        const path = url.startsWith('http')
          ? new URL(url).pathname
          : url.startsWith('/')
            ? url
            : `/${url}`;
        const res = await fetch(path, { cache: 'reload' });
        if (res && res.ok) await cache.put(path, res);
      } catch {
        /* skip */
      }
    }
  }
  if (!list.length) return;
  await Promise.all(
    Array.from({ length: Math.min(CONC, list.length) }, () => worker())
  );
}

async function precacheVoicePack(cache) {
  try {
    const res = await fetch('/assets/audio/voice/manifest.json', {
      cache: 'reload',
    });
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
    /* optional */
  }
}

async function precacheWordImages(cache) {
  try {
    const paths = new Set();
    for (const file of ['/data/words.json', '/data/words-en.json']) {
      const res = await fetch(file, { cache: 'reload' });
      if (!res.ok) continue;
      await cache.put(file, res.clone());
      const data = await res.json();
      for (const w of data.words || []) {
        if (w.image) paths.add(String(w.image).split('?')[0]);
      }
    }
    await precacheAll(cache, [...paths]);
  } catch {
    /* optional */
  }
}

/** Background media warm (voice + images) — not blocking install */
async function warmMedia() {
  try {
    const cache = await caches.open(CACHE);
    await Promise.all([precacheVoicePack(cache), precacheWordImages(cache)]);
  } catch {
    /* ignore */
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Shell only — fast install on slow networks
      await precacheAll(cache, PRECACHE_SHELL);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
      // Defer heavy media cache so activate returns quickly
      // eslint-disable-next-line no-undef
      if (typeof setTimeout !== 'undefined') {
        setTimeout(() => {
          warmMedia();
        }, 500);
      } else {
        warmMedia();
      }
    })()
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'CACHE_URLS' && Array.isArray(data.urls)) {
    event.waitUntil(
      caches.open(CACHE).then((cache) => precacheAll(cache, data.urls))
    );
  }
  if (data.type === 'WARM_MEDIA') {
    event.waitUntil(warmMedia());
  }
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = req.url;
  const isStatic =
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

      return cached || fetchPromise;
    })
  );
});
