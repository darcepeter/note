// Calculator service worker: caches the app so it opens offline, and lets notifications be tapped.
// Bump CACHE_NAME whenever any app file changes so phones pick up the new version.
var CACHE_NAME = "forcecalc-cache-v3";
var ASSETS = ["./", "./index.html", "./engine.js", "./data.js", "./settings.js", "./manifest.json",
  "./icon-192.png", "./icon-512.png", "./icon-512-maskable.png"];

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (c) { return c.addAll(ASSETS); }));
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
// Network-first for the page (so updates arrive when online), cache fallback when offline.
self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE_NAME).then(function (c) { c.put("./index.html", copy); });
      return res;
    }).catch(function () { return caches.match("./index.html"); }));
    return;
  }
  event.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req); }));
});
