/**
 * 🔄 Service Worker — RMS Academy ERP
 *
 * Strategy:
 *   Static assets (JS, CSS, images) → Cache-first
 *   API calls (/api/*)              → Network-first, fallback to cache
 *   Navigation (HTML)               → Network-first, fallback to offline.html
 */

const CACHE_NAME = "rms-erp-v1";
const OFFLINE_URL = "/offline.html";

// Assets to pre-cache on install
const PRE_CACHE = [OFFLINE_URL];

// ── Install ──────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRE_CACHE))
  );
  self.skipWaiting();
});

// ── Activate — clean old caches ──────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, chrome-extension, etc.
  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  // ─ API calls → network-first ─────────────────────────────
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful GET responses for short offline use
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // ─ Static assets → cache-first ───────────────────────────
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|eot|svg|png|jpe?g|gif|webp|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // ─ Navigation (HTML pages) → network-first, offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }
});
