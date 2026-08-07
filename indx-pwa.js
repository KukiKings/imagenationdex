/* IN$DEX PWA runtime — registration, install prompt, offline status, safe draft queue.
   Canon wording (do not change): "You are offline. SIINDEX saved your progress.
   Nothing sensitive will move until you are online and approve it."
   Sensitive actions NEVER execute offline (Completion Commander doctrine). */
(function () {
  'use strict';

  /* ── Service worker registration ── */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () { /* non-fatal */ });
    });
  }

  /* ── Offline / online status banner ── */
  var banner = null;
  function ensureBanner() {
    if (banner) return banner;
    banner = document.createElement('div');
    banner.id = 'indxOfflineBanner';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;display:none;' +
      'background:#FFB800;color:#090A10;font-weight:700;font-size:15px;line-height:1.45;' +
      'padding:12px 16px;text-align:center;font-family:-apple-system,system-ui,sans-serif;' +
      'max-width:430px;margin:0 auto;border-radius:0 0 12px 12px;box-shadow:0 4px 18px rgba(0,0,0,0.35);';
    document.body.appendChild(banner);
    return banner;
  }
  function showOffline() {
    var b = ensureBanner();
    b.textContent = 'You are offline. SIINDEX saved your progress. Nothing sensitive will move until you are online and approve it.';
    b.style.display = 'block';
    document.documentElement.setAttribute('data-indx-offline', '1');
  }
  function showOnline() {
    var b = ensureBanner();
    document.documentElement.removeAttribute('data-indx-offline');
    var drafts = INDXPWA.drafts.all();
    if (drafts.length > 0) {
      b.style.background = '#00E5A0';
      b.textContent = 'Back online. ' + drafts.length + ' saved draft' + (drafts.length > 1 ? 's are' : ' is') + ' ready — nothing moves until you approve it.';
      b.style.display = 'block';
      setTimeout(function () { b.style.display = 'none'; b.style.background = '#FFB800'; }, 6000);
    } else {
      b.style.display = 'none';
    }
  }
  window.addEventListener('offline', showOffline);
  window.addEventListener('online', showOnline);

  /* ── Install prompt (Add to Home Screen) ── */
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if (localStorage.getItem('indx_pwa_install_dismissed') === '1') return;
    var bar = document.createElement('div');
    bar.id = 'indxInstallBar';
    bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99998;background:#12141F;color:#F0F2FF;' +
      'padding:14px 16px;font-family:-apple-system,system-ui,sans-serif;font-size:14px;' +
      'max-width:430px;margin:0 auto;border-radius:14px 14px 0 0;box-shadow:0 -4px 20px rgba(0,0,0,0.4);' +
      'border-top:1px solid rgba(0,212,255,0.25);';
    bar.innerHTML = '<div style="margin-bottom:10px;font-weight:600;">Install IN$DEX on your phone for faster access.</div>' +
      '<div style="display:flex;gap:8px;">' +
      '<button id="indxInstallYes" style="flex:1;padding:10px;border:0;border-radius:10px;background:#00D4FF;color:#090A10;font-weight:800;cursor:pointer;">Install</button>' +
      '<button id="indxInstallNo" style="padding:10px 14px;border:1px solid rgba(255,255,255,0.15);border-radius:10px;background:transparent;color:#9CA3B8;cursor:pointer;">Not now</button>' +
      '</div>';
    document.body.appendChild(bar);
    document.getElementById('indxInstallYes').onclick = function () {
      bar.remove();
      if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt = null; }
    };
    document.getElementById('indxInstallNo').onclick = function () {
      bar.remove();
      localStorage.setItem('indx_pwa_install_dismissed', '1');
    };
  });

  /* ── Safe draft queue (offline_drafts) ──
     ONLY non-sensitive drafts. Executing anything from a draft still requires
     the citizen online + explicit approval on the relevant screen. */
  var SAFE_TYPES = ['recipient_draft', 'send_draft', 'note', 'help_request_draft', 'onboarding_progress'];
  var KEY = 'indx_offline_drafts';
  window.INDXPWA = {
    isOnline: function () { return navigator.onLine; },
    drafts: {
      all: function () {
        try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
      },
      save: function (type, data) {
        if (SAFE_TYPES.indexOf(type) === -1) return { ok: false, reason: 'not a safe draft type' };
        var list = this.all();
        list.unshift({ id: Date.now().toString(36), type: type, data: data, savedAt: new Date().toISOString(), synced: false });
        if (list.length > 40) list.pop();
        localStorage.setItem(KEY, JSON.stringify(list));
        return { ok: true };
      },
      clear: function (id) {
        var list = this.all().filter(function (d) { return d.id !== id; });
        localStorage.setItem(KEY, JSON.stringify(list));
      }
    },
    /* Screens call this before any sensitive action */
    guardSensitive: function () {
      if (navigator.onLine) return true;
      showOffline();
      return false;
    }
  };

  /* Initial state on load */
  if (!navigator.onLine) {
    if (document.body) showOffline();
    else document.addEventListener('DOMContentLoaded', showOffline);
  }
})();

/* Phase A — Grok sole builder: load SIINDEX public knowledge on pages that use indx-pwa */
(function siindexPwaPublicBoot() {
  if (typeof window === 'undefined' || window.__SIINDEX_PUBLIC_BOOT__) return;
  try {
    var s = document.createElement('script');
    s.src = '/js/siindex-public-boot.js';
    s.async = true;
    s.onerror = function () {
      var s2 = document.createElement('script');
      s2.src = 'js/siindex-public-boot.js';
      s2.async = true;
      (document.head || document.documentElement).appendChild(s2);
    };
    (document.head || document.documentElement).appendChild(s);
  } catch (e) {
    console.warn('[SIINDEX] pwa public boot failed', e);
  }
})();
