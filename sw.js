/* Service worker: makes the app open offline.
   Change CACHE_VERSION whenever you upload a new version of the files. */
var CACHE_VERSION = 'school-gps-v1';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(function (cache) { return cache.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) {
          if (k !== CACHE_VERSION) { return caches.delete(k); }
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

/* Serve from cache first (works offline), refresh the cache in the background. */
self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') { return; }
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) { return; }

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (cached) {
      var network = fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function () {
        if (cached) { return cached; }
        if (req.mode === 'navigate') { return caches.match('./index.html'); }
        return new Response('', { status: 504, statusText: 'Offline' });
      });
      return cached || network;
    })
  );
});
