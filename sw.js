/* IN$DEX Service Worker — verified public information shell.
   Phase A: inject SIINDEX public knowledge boot into HTML navigations.
   Transactional prototypes are intentionally excluded from public caching. */
const VERSION = 'indx-v5-phase-a';
const SHELL = 'indx-shell-' + VERSION;
const PAGES = 'indx-pages-' + VERSION;

const PRECACHE = [
  '/',
  '/public-home.html',
  '/planned.html',
  '/privacy-policy.html',
  '/terms-of-service.html',
  '/manifest.json',
  '/siindex-speak-core.js',
  '/js/siindex-public-boot.js',
  '/js/siindex-public-knowledge.js',
  '/js/siindex-public-bridge.js',
  '/js/siindex-page-context.js',
  '/siindex-interview.html',
  '/siindex-present.html',
  '/speak-to-siindex.html',
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
    return new Response(next, {
      status: response.status,
      statusText: response.statusText,
      headers: headers
    });
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
      return Promise.all(keys.filter(function (k) { return !k.endsWith(VERSION); }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  var path = url.pathname;

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

  if (req.mode === 'navigate' || path.endsWith('.html')) {
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

  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(PAGES).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});

self.addEventListener('message', function (e) {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
