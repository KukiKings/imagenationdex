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
    if (localStorage.getItem('indx_pwa_install_dismissed')) return;
    var bar = document.createElement('div');
    bar.id = 'indxInstallBar';
    bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99998;background:#12141F;' +
      'border-top:1px solid rgba(0,212,255,0.3);padding:14px 16px;display:flex;align-items:center;gap:12px;' +
      'max-width:430px;margin:0 auto;font-family:-apple-system,system-ui,sans-serif;';
    bar.innerHTML =
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:15px;font-weight:800;color:#F0F2FF;">Add IN$DEX to your phone</div>' +
        '<div style="font-size:13px;color:#B0B8D8;">Works like an app. Opens even with weak signal.</div>' +
      '</div>' +
      '<button id="indxInstallGo" style="background:linear-gradient(135deg,#00D4FF,#2B35D8);color:#fff;border:none;border-radius:10px;padding:12px 18px;font-size:14px;font-weight:800;cursor:pointer;">Add</button>' +
      '<button id="indxInstallNo" aria-label="Dismiss install prompt" style="background:none;border:none;color:#B0B8D8;font-size:20px;cursor:pointer;padding:8px;">✕</button>';
    document.body.appendChild(bar);
    document.getElementById('indxInstallGo').onclick = function () {
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
