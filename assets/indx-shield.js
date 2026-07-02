/**
 * SIINDEX Global Error Shield v1.0
 * Canonical error boundary for all IN$DEX screens.
 * Catches uncaught JS errors + promise rejections before they crash the UI.
 * Include as FIRST script on every screen: <script src="assets/indx-shield.js"></script>
 */

// ── 1. GLOBAL ERROR CATCHER ──
window.onerror = function(msg, src, line, col, err) {
  console.error('[SIINDEX SHIELD]', msg, src ? src.split('/').pop() + ':' + line : '');
  // Show toast if available, otherwise silent
  if (typeof showToast === 'function') {
    showToast('⚠️ Something went wrong — tap to refresh.');
  } else {
    // Fallback banner if toast not yet defined
    var banner = document.getElementById('_siindex_err_banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = '_siindex_err_banner';
      banner.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1A1D25;border:1px solid #FF4D6D;color:#EAEAEA;padding:10px 20px;border-radius:12px;font-size:13px;z-index:9999;cursor:pointer;white-space:nowrap;';
      banner.onclick = function() { window.location.reload(); };
      document.body.appendChild(banner);
    }
    banner.textContent = '⚠️ Error detected — tap to refresh';
    banner.style.display = 'block';
    setTimeout(function() { if (banner) banner.style.display = 'none'; }, 4000);
  }
  return true; // Prevent browser default error display
};

// ── 2. UNHANDLED PROMISE REJECTION CATCHER ──
window.addEventListener('unhandledrejection', function(e) {
  console.error('[SIINDEX SHIELD] Unhandled promise rejection:', e.reason);
  e.preventDefault(); // Prevent uncaught in console
});

// ── 3. NULL-SAFE HELPERS ──
// Use $id() instead of document.getElementById() for safe access
window.$id = function(id) {
  return document.getElementById(id);
};

// Run a function on an element only if it exists
window.$safe = function(id, fn) {
  var el = document.getElementById(id);
  if (el) { try { fn(el); } catch(e) { console.warn('[SIINDEX SHIELD] $safe error on #' + id, e); } }
};

// Set text content safely
window.$setText = function(id, text) {
  var el = document.getElementById(id);
  if (el) el.textContent = text;
};

// Set inner HTML safely
window.$setHTML = function(id, html) {
  var el = document.getElementById(id);
  if (el) el.innerHTML = html;
};

// Set style safely
window.$setStyle = function(id, prop, val) {
  var el = document.getElementById(id);
  if (el) el.style[prop] = val;
};

// ── 4. SESSIONSTORE SAFE ACCESS ──
window.$session = {
  get: function(key, fallback) {
    try { return sessionStorage.getItem(key) || fallback || null; }
    catch(e) { return fallback || null; }
  },
  set: function(key, val) {
    try { sessionStorage.setItem(key, val); } catch(e) {}
  }
};

window.$local = {
  get: function(key, fallback) {
    try { return localStorage.getItem(key) || fallback || null; }
    catch(e) { return fallback || null; }
  },
  set: function(key, val) {
    try { localStorage.setItem(key, val); } catch(e) {}
  },
  getJSON: function(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; }
    catch(e) { return fallback; }
  }
};

// ── 5. NETWORK ERROR GUARD ──
// Wrap fetch to prevent uncaught network errors crashing screens
var _origFetch = window.fetch;
if (_origFetch) {
  window.fetch = function() {
    return _origFetch.apply(this, arguments).catch(function(err) {
      console.warn('[SIINDEX SHIELD] Network error:', err.message);
      return Promise.resolve({ ok: false, status: 0, json: function() { return Promise.resolve({}); }, text: function() { return Promise.resolve(''); } });
    });
  };
}

console.log('[SIINDEX SHIELD] v1.0 — error boundary active');
