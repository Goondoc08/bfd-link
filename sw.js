/* BFDLink — service worker
   BUMP THIS VERSION EVERY TIME YOU DEPLOY, or phones will keep the old links. */
const CACHE = 'bfdlink-v9';

const SHELL = [
  './',
  './index.html',
  './links.js',
  './shift.js',
  './manning.js',
  './manifest.json',
  './icon-64.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './icon-180.png',
  './favicon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Network-first so a pushed link fix shows up immediately; cache is only the
   offline safety net. `cache: 'no-store'` is the part that actually makes
   that true — a plain fetch(e.request) is still subject to the browser's
   ordinary HTTP cache, and GitHub Pages sends Cache-Control: max-age=600 on
   these files. Without this override, "network-first" could still be
   silently satisfied from the browser's disk cache for up to 10 minutes
   after any deploy, surviving even a full close-and-reopen of the tab.
   (Learned the hard way on Pearland Fire Link, Aug 2026.) */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request, { cache: 'no-store' })
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
