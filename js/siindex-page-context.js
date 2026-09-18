/**
 * siindex-page-context.js
 * Loads page-context-map.json so SIINDEX can state Live/Testing/Planned/Paused per route.
 * Brand-first: always IN$DEX.
 */
(function (global) {
  'use strict';
  var SIINDEX_PAGE = {
    version: '1.0.0',
    map: null,
    brand: 'IN$DEX',
    load: function () {
      var self = this;
      return fetch('/siindex-public/page-context-map.json')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          self.map = data;
          return data;
        })
        .catch(function () { return null; });
    },
    forPath: function (path) {
      path = path || (typeof location !== 'undefined' ? location.pathname : '/');
      if (!this.map || !this.map.pages) {
        return { title: 'IN$DEX', status: 'Pre-launch', note: 'Lead with IN$DEX' };
      }
      return this.map.pages[path] || this.map.pages[path.replace(/\/$/, '')] || {
        title: 'IN$DEX',
        status: this.map.default_status || 'Pre-launch',
        note: 'Lead with IN$DEX'
      };
    },
    statusLine: function (path) {
      var p = this.forPath(path);
      return 'IN$DEX — ' + (p.title || 'page') + ' is labelled ' + (p.status || 'Pre-launch') + '.';
    }
  };
  global.SIINDEX_PAGE = SIINDEX_PAGE;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { SIINDEX_PAGE.load(); });
    } else {
      SIINDEX_PAGE.load();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
