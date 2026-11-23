// Service worker: keeps a copy of the app on the phone so it opens with no internet.
//
// WHEN YOU CHANGE ANY FILE AND PUBLISH: bump VERSION below (e.g. 'v1.0.1').
// That is how phones find out there's a new version to download.
// When you ADD a file, also add it to FILES.

const VERSION = 'v1.0.0';
const CACHE_PREFIX = 'habit-tracker-';
const CACHE = `${CACHE_PREFIX}${VERSION}`;

const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/app.js',
  './js/router.js',
  './js/dates.js',
  './js/units.js',
  './js/storage.js',
  './js/stats.js',
  './js/ui.js',
  './js/habits/index.js',
  './js/habits/water.js',
  './js/habits/sleep.js',
  './js/habits/exercise.js',
  './js/habits/steps.js',
  './js/screens/day-editor.js',
  './js/screens/today.js',
  './js/screens/week.js',
  './js/screens/history.js',
  './js/screens/settings.js',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // 'reload' skips the browser's HTTP cache so we always store the fresh files.
      .then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      // Only delete OUR old caches — other projects on the same github.io site have their own.
      .then((keys) => Promise.all(keys
        .filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE)
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Cache first: answer from the saved copy, fall back to the network.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      return await fetch(req);
    } catch (err) {
      if (req.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
      throw err;
    }
  })());
});
