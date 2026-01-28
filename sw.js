/* ButeBreath Service Worker
   SPDX-License-Identifier: GPL-3.0
   Cache strategy:
   - Precache core app shell (index, manifest, worker)
   - Runtime cache same-origin GETs
   - Offline fallback for navigation to cached index.html

   Update strategy (user-controlled):
   - New SW installs and stays in 'waiting' until the page sends {type:'SKIP_WAITING'}
   - After activate/claim, SW posts {type:'SW_ACTIVATED'} to open windows (reliable completion signal)
   - Page listens for waiting SW and shows an overlay to let user refresh
*/

const CACHE_VERSION = 3; // Increment this manually on each deploy
const CACHE = `butebreath_cache_v${CACHE_VERSION}`;
// Core assets required for the app shell to boot offline.
const PRECACHE_CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./timer.worker.js",
  "./sw.js",
];

// Optional assets (cached if present).
const PRECACHE_OPTIONAL = [
  "./pouchdb.min.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

async function precacheOptional(cache, urls) {
  await Promise.allSettled(
    urls.map(async (u) => {
      try {
        const req = new Request(u, { cache: "reload" });
        const res = await fetch(req);
        if (res && res.ok) await cache.put(u, res.clone());
      } catch (e) { console.error(e); }
    })
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      try { await cache.addAll(PRECACHE_CORE); } catch (e) { console.error(e); }
      await precacheOptional(cache, PRECACHE_OPTIONAL);
      // Do NOT skipWaiting here. We want the client UI to decide when to activate updates.
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      } catch (e) { console.error(e); }

      await self.clients.claim();

      // Notify open tabs that the new worker is active.
      // This provides a reliable "update completed" signal in browsers where controllerchange is flaky (notably Safari/WebKit).
      try {
        const tabs = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        for (const c of tabs) {
          try { c.postMessage({ type: "SW_ACTIVATED", cache: CACHE }); } catch (e) { console.error(e); }
        }
      } catch (e) { console.error(e); }
    })()
  );
});

// Allow the page to activate the waiting SW.
self.addEventListener("message", (event) => {
  const msg = event && event.data ? event.data : null;
  if (msg && msg.type === "SKIP_WAITING") {
    // Use waitUntil for better reliability on some browsers.
    try { 
      event.waitUntil(
        self.skipWaiting().then(() => {
          // Force immediate activation
          return self.clients.claim();
        })
      ); 
    } catch (e) {
      // Fallback if waitUntil fails
      try { 
        self.skipWaiting().then(() => self.clients.claim()); 
      } catch (e2) {}
    }
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Stale-While-Revalidate for navigations (fast load from cache, update in background)
  if (req.mode === "navigate" || url.pathname.endsWith("index.html")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const cached =
          (await cache.match(req)) ||
          (await cache.match("./index.html")) ||
          (await cache.match("./"));

        const fetchPromise = fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              cache.put(req, networkResponse.clone()).catch(() => {});
              cache.put("./index.html", networkResponse.clone()).catch(() => {});
            }
            return networkResponse;
          })
          .catch(() => null);

        event.waitUntil(fetchPromise);
        return cached || (await fetchPromise) || Response.error();
      })()
    );
    return;
  }

  // Other assets: cache-first, then network; runtime cache same-origin GETs
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;

      try {
        const res = await fetch(req);
        const isSameOrigin = url.origin === self.location.origin;
        if (isSameOrigin && res && res.status === 200) cache.put(req, res.clone()).catch(() => {});
        return res;
      } catch (e) {
        return (await cache.match("./index.html")) || Response.error();
      }
    })()
  );
});
