/**
 * siindex-public-boot.js
 * Drop-in: load this once per page.
 * Ensures public living knowledge + bridge for SIINDEX Visitor Mode.
 * SI = Synthetic Intelligence (not AI). PQSI = Physical Quantum Synthetic Intelligence.
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
      return tryLoad('/js/siindex-public-bridge.js', 'js/siindex-public-bridge.js');
    })
    .then(function () {
      window.dispatchEvent(new CustomEvent('siindex:public-boot-ready'));
    })
    .catch(function (err) {
      console.warn('[SIINDEX public boot]', err);
    });
})();
