const CACHE = 'regards-eau-v1';
const ASSETS = ['/', '/index.html', '/css/app.css', '/js/config.js', '/js/db.js', '/js/auth.js', '/js/utils.js', '/js/modules1.js', '/js/modules2.js', '/js/modules3.js', '/js/app.js', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match('/index.html'))));
});
