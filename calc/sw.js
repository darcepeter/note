// Calculator service worker: caches the app so it opens offline, and lets notifications be tapped.
// Bump CACHE_NAME whenever any app file changes so phones pick up the new version.
var CACHE_NAME = "forcecalc-cache-v9";
var ASSETS = ["./", "./index.html", "./engine.js", "./data.js", "./settings.js", "./manifest.json",
  "./icon-192.png", "./icon-512.png", "./icon-512-maskable.png"];

self.addEventListener("install", function (event) {
  // fetch fresh copies (skip the browser's own HTTP cache) so a new version can never be built from stale files
  event.waitUntil(caches.open(CACHE_NAME).then(function (c) {
    return Promise.all(ASSETS.map(function (a) { return fetch(a, { cache: "reload" }).then(function (r) { return c.put(a, r); }); }));
  }));
  self.skipWaiting();
});
self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (names) {
    return Promise.all(names.filter(function (n) { return n !== CACHE_NAME; }).map(function (n) { return caches.delete(n); }));
  }));
  self.clients.claim();
});
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
    if (list.length && list[0].focus) return list[0].focus();
    return self.clients.openWindow("./index.html");
  }));
});
// Network-first for everything (so updates always arrive when online); cache only when offline.
self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(fetch(req).then(function (res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(CACHE_NAME).then(function (c) { c.put(req.mode === "navigate" ? "./index.html" : req, copy); }); }
    return res;
  }).catch(function () { return caches.match(req.mode === "navigate" ? "./index.html" : req); }));
});
