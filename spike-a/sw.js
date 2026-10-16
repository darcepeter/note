// Spike A service worker: caches its own shell (for the offline test), and can run a
// delayed notification itself so we can compare it against a plain page timer.
var CACHE = "spike-A-v2";
var ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }));
  self.skipWaiting();
});
self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});
self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(function () { return caches.match("./index.html"); }));
    return;
  }
  event.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req); }));
});

function fmt(t) { return new Date(t).toLocaleTimeString([], { hour12: false }); }

// Service-worker timer: hold the worker open with waitUntil, then post the notification from here.
self.addEventListener("message", function (event) {
  var d = event.data;
  if (!d || d.type !== "timer") return;
  event.waitUntil(
    new Promise(function (r) { setTimeout(r, d.delayMs); }).then(function () {
      var firedAt = Date.now();
      var late = ((firedAt - d.due) / 1000).toFixed(1);
      return self.registration.showNotification("Spike " + d.role + " · service worker", {
        body: "Due " + fmt(d.due) + " · fired " + fmt(firedAt) + " · " + late + "s late",
        silent: true, tag: "spike-sw-" + firedAt, icon: "icon-192.png"
      }).then(function () { return true; }, function () { return false; }).then(function (shown) {
        return self.clients.matchAll({ includeUncontrolled: true }).then(function (cs) {
          cs.forEach(function (c) { c.postMessage({ type: "swtimer", due: d.due, firedAt: firedAt, shown: shown }); });
        });
      });
    })
  );
});

self.addEventListener("notificationclick", function (event) { event.notification.close(); });
