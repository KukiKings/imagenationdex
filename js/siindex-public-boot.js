/**
 * siindex-public-boot.js
 * Knowledge → context → bridge → home/presence/intro honesty fixes.
 */
(function () {
  'use strict';
  if (window.__SIINDEX_PUBLIC_BOOT__) return;
  window.__SIINDEX_PUBLIC_BOOT__ = true;

  function load(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) {
        resolve();
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('failed ' + src)); };
      document.head.appendChild(s);
    });
  }

  function tryLoad(primary, fallback) {
    return load(primary).catch(function () {
      return load(fallback);
    });
  }

  tryLoad('/js/siindex-public-knowledge.js', 'js/siindex-public-knowledge.js')
    .then(function () {
      return tryLoad('/js/siindex-page-context.js', 'js/siindex-page-context.js');
    })
    .then(function () {
      return tryLoad('/js/siindex-public-bridge.js', 'js/siindex-public-bridge.js');
    })
    .then(function () {
      var chain = Promise.resolve();
      if (document.getElementById('publicMessages') || document.getElementById('publicInput')) {
        chain = chain.then(function () {
          return tryLoad('/js/siindex-home-ask-fix.js', 'js/siindex-home-ask-fix.js');
        });
      }
      if (document.getElementById('introVideo') || document.querySelector('.video-copy')) {
        chain = chain.then(function () {
          return tryLoad('/js/siindex-intro-player-honesty.js', 'js/siindex-intro-player-honesty.js');
        });
      }
      if (document.querySelector('.portrait-ring') || /siindex\.html/i.test(location.pathname)) {
        chain = chain.then(function () {
          return tryLoad('/js/siindex-presence-fix.js', 'js/siindex-presence-fix.js');
        });
      }
      return chain;
    })
    .then(function () {
      window.dispatchEvent(new CustomEvent('siindex:public-boot-ready'));
    })
    .catch(function (err) {
      console.warn('[SIINDEX public boot]', err);
    });
})();
