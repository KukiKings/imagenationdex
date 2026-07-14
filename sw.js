/* IN$DEX Service Worker — Golden Path offline shell
   Canon: offline is read + draft only. No sensitive execution offline.
   Update strategy: bump VERSION → old caches deleted on activate. */
const VERSION = 'indx-v1';
const SHELL = 'indx-shell-' + VERSION;
const PAGES = 'indx-pages-' + VERSION;

/* Precache: golden path + shell only (low-data strategy — small, essential set) */
const PRECACHE = [
  '/speak-to-siindex.html',
  '/grid-account-onboarding.html',
  '/onboarding-flow.html',
  '/receive.html',
  '/send.html',
  '/withdraw-fiat.html',
  '/help.html',
  '/index.html',
  '/offline-fallback.html',
  '/manifest.json',
  '/indx-pwa.js',
  '/siindex-speak-core.js',
  '/assets/icon-192.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Strategy:
   - Golden path + shell: cache-first (instant, works offline)
   - Other same-origin pages: network-first, cache fallback, offline.html last resort
   - Cross-origin (Supabase, CDNs): network only — NEVER cache live data or execute stale state
   - Low-data: only successful, basic, same-origin GET responses are cached */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return; // never intercept writes — sensitive actions need the network
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase/CDN: network only

  const path = url.pathname === '/' ? '/index.html' : url.pathname;

  if (PRECACHE.includes(path)) {
    e.respondWith(
      caches.match(path).then((hit) => hit ||
        fetch(req).then((res) => {
          if (res && res.ok) { const copy = res.clone(); caches.open(SHELL).then((c) => c.put(path, copy)); }
          return res;
        })
      )
    );
    return;
  }

  if (req.mode === 'navigate' || path.endsWith('.html')) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(PAGES).then((c) => c.put(path, copy)); }
        return res;
      }).catch(() =>
        caches.match(path).then((hit) => hit || caches.match('/offline-fallback.html'))
      )
    );
    return;
  }

  /* Static assets: stale-while-revalidate */
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(PAGES).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});

/* Draft sync signal: when connectivity returns, tell open pages to sync safe drafts */
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
