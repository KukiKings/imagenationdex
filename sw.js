/* IN$DEX Service Worker — verified public information shell.
   v8: network-first for /js and media so pronunciation/intro fixes are not stuck. */
const VERSION = 'indx-v8-syndex-pronunciation';
const SHELL = 'indx-shell-' + VERSION;
const PAGES = 'indx-pages-' + VERSION;

/* Precache static non-code assets only — JS must not be pinned across deploys. */
const PRECACHE = [
  '/manifest.json',
  '/assets/icon-192.png',
  '/assets/siindex-hero.png'
];

function injectPublicBoot(html) {
  if (!html || html.indexOf('siindex-public-boot.js') !== -1) return html;
  var tag = '<script src="/js/siindex-public-boot.js" defer></script>';
  if (html.indexOf('</body>') !== -1) return html.replace('</body>', tag + '\n</body>');
  return html + tag;
}

function htmlWithBoot(response) {
  return response.text().then(function (text) {
    var next = injectPublicBoot(text);
    var headers = new Headers(response.headers);
    headers.set('Content-Type', 'text/html; charset=utf-8');
    headers.set('Cache-Control', 'no-store');
    return new Response(next, {
      status: response.status,
      statusText: response.statusText,
      headers: headers
    });
  });
}

function networkFirst(req) {
  return fetch(req).then(function (res) {
    if (res && res.ok) {
      var copy = res.clone();
      caches.open(PAGES).then(function (c) { c.put(req, copy); });
    }
    return res;
  }).catch(function () {
    return caches.match(req);
  });
}

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(SHELL)
      .then(function (c) { return c.addAll(PRECACHE); })
      .then(function () { return self.skipWaiting(); })
      .catch(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  var path = url.pathname;

  /* HTML and navigations: always network-first */
  if (req.mode === 'navigate' || path.endsWith('.html') || path === '/') {
    e.respondWith(
      fetch(req).then(function (res) {
        if (!res || !res.ok) return res;
        var ct = res.headers.get('content-type') || '';
        if (ct.indexOf('text/html') === -1) return res;
        return htmlWithBoot(res);
      }).catch(function () {
        return caches.match(path).then(function (hit) {
          return hit || caches.match('/planned.html');
        });
      })
    );
    return;
  }

  /* JS + intro media: network-first so voice/pronunciation deploys apply immediately */
  if (
    path.indexOf('/js/') === 0 ||
    path.indexOf('/videos/') === 0 ||
    path.endsWith('.js') ||
    path === '/siindex-speak-core.js' ||
    path === '/sw.js'
  ) {
    e.respondWith(networkFirst(req));
    return;
  }

  if (PRECACHE.indexOf(path) !== -1) {
    e.respondWith(
      caches.match(path).then(function (hit) {
        return hit || fetch(req).then(function (res) {
          if (res && res.ok) {
            var copy = res.clone();
            caches.open(SHELL).then(function (c) { c.put(path, copy); });
          }
          return res;
        });
      })
    );
    return;
  }

  e.respondWith(networkFirst(req));
});

self.addEventListener('message', function (e) {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
  if (e.data === 'CLEAR_CACHES') {
    e.waitUntil(caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return caches.delete(k); }));
    }));
  }
});
