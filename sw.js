/* IN$DEX Service Worker — verified public information shell.
   v9: never intercept video/media or Range requests — SW cache breaks progressive video. */
const VERSION = 'indx-v9-video-bypass';
const SHELL = 'indx-shell-' + VERSION;
const PAGES = 'indx-pages-' + VERSION;

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
    if (res && res.ok && res.status === 200) {
      var copy = res.clone();
      caches.open(PAGES).then(function (c) { c.put(req, copy); }).catch(function () {});
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

  /* CRITICAL: never intercept video/audio or byte-range requests.
     Caching full MP4 responses breaks Range streaming → decoder freeze. */
  if (
    path.indexOf('/videos/') === 0 ||
    path.indexOf('/media/') === 0 ||
    /\.(mp4|webm|mov|m4v|mp3|wav|ogg|m4a)$/i.test(path) ||
    req.headers.get('range')
  ) {
    return; // browser native network — supports 206 Range
  }

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

  if (path.indexOf('/js/') === 0 || path.endsWith('.js') || path === '/siindex-speak-core.js' || path === '/sw.js') {
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
