// Minimal service worker: caches the app shell so it installs as a PWA and
// still opens offline. Bump CACHE_NAME whenever index.html changes so the
// new version gets picked up instead of a stale cached copy.
var CACHE_NAME = "notary-cache-v16";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) { return cache.addAll(ASSETS); })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.filter(function (n) { return n !== CACHE_NAME; }).map(function (n) { return caches.delete(n); }));
    })
  );
  self.clients.claim();
});

// Network-first for navigations (so you get the latest version when online),
// falling back to the cached copy when offline; cache-first for everything else.
self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
        return res;
      }).catch(function () { return caches.match("./index.html"); })
    );
    return;
  }
  event.respondWith(
    caches.match(req).then(function (cached) { return cached || fetch(req); })
  );
});
