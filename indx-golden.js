/* IN$DEX Golden Path Hardening Layer — Completion Commander task 3
   Applies to the 5 golden screens. Adds: Safe-to-Proceed status, SIINDEX help,
   voice command (prepare only — never executes), a11y (focus/reduced-motion/labels),
   offline sensitive-action guards. Voice prepares. The citizen approves. */
(function () {
  'use strict';
  var PAGE = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var IS_SPEAK = PAGE === 'speak-to-siindex.html';
  var IS_HELP = PAGE === 'help.html';

  /* ── 1. Injected CSS: focus, reduced motion, strip, FABs ── */
  var css = document.createElement('style');
  css.textContent =
    /* visible focus for keyboard + switch access */
    'a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,[tabindex]:focus-visible{outline:3px solid #00D4FF !important;outline-offset:2px !important;border-radius:6px;}' +
    /* reduced motion: kill all animation/transitions when requested */
    '@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:0.01ms !important;animation-iteration-count:1 !important;transition-duration:0.01ms !important;scroll-behavior:auto !important;}}' +
    /* Safe-to-Proceed strip */
    '.indx-safe-strip{display:flex;align-items:center;gap:10px;background:rgba(0,229,160,0.08);border:1px solid rgba(0,229,160,0.35);border-radius:12px;padding:10px 14px;margin:10px 16px;font-family:-apple-system,system-ui,sans-serif;}' +
    '.indx-safe-strip.offline{background:rgba(255,184,0,0.08);border-color:rgba(255,184,0,0.4);}' +
    '.indx-safe-ic{font-size:20px;flex-shrink:0;}' +
    '.indx-safe-tx{flex:1;font-size:14px;line-height:1.45;color:#F0F2FF;font-weight:600;}' +
    '.indx-safe-tx a{color:#00D4FF;text-decoration:underline;font-weight:700;}' +
    /* FABs: 56px targets, always icon + text label */
    '.indx-fab{position:fixed;bottom:96px;z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:center;width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;font-family:-apple-system,system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.45);}' +
    '.indx-fab-help{right:14px;background:#12141F;border:1.5px solid rgba(0,212,255,0.5);color:#F0F2FF;}' +
    '.indx-fab-voice{left:14px;background:linear-gradient(135deg,#2B35D8,#8B3FE8);color:#fff;}' +
    '.indx-fab .fic{font-size:20px;line-height:1;}' +
    '.indx-fab .flb{font-size:10px;font-weight:800;margin-top:2px;letter-spacing:.3px;}' +
    /* Voice sheet */
    '.indx-voice-sheet{position:fixed;bottom:0;left:0;right:0;max-width:430px;margin:0 auto;z-index:9500;background:#12141F;border-top:2px solid rgba(0,212,255,0.4);border-radius:18px 18px 0 0;padding:18px 16px 22px;font-family:-apple-system,system-ui,sans-serif;display:none;}' +
    '.indx-voice-sheet.open{display:block;}' +
    '.indx-vs-title{font-size:17px;font-weight:800;color:#F0F2FF;margin-bottom:4px;}' +
    '.indx-vs-sub{font-size:13px;color:#B0B8D8;margin-bottom:12px;}' +
    '.indx-vs-listen{font-size:15px;font-weight:700;color:#00D4FF;min-height:22px;margin-bottom:10px;}' +
    '.indx-vs-row{display:flex;gap:8px;}' +
    '.indx-vs-inp{flex:1;background:#1A1D2E;border:1.5px solid rgba(255,255,255,0.15);border-radius:10px;padding:12px;font-size:16px;color:#F0F2FF;outline:none;}' +
    '.indx-vs-btn{background:linear-gradient(135deg,#00D4FF,#2B35D8);color:#fff;border:none;border-radius:10px;padding:12px 16px;font-size:14px;font-weight:800;cursor:pointer;}' +
    '.indx-vs-confirm{display:none;margin-top:12px;background:rgba(255,184,0,0.1);border:1px solid rgba(255,184,0,0.4);border-radius:12px;padding:12px;}' +
    '.indx-vs-confirm.show{display:block;}' +
    '.indx-vs-cq{font-size:15px;font-weight:700;color:#F0F2FF;margin-bottom:10px;}' +
    '.indx-vs-cbtns{display:flex;gap:8px;}' +
    '.indx-vs-yes{flex:1;background:#00E5A0;color:#090A10;border:none;border-radius:10px;padding:12px;font-size:15px;font-weight:800;cursor:pointer;}' +
    '.indx-vs-no{flex:1;background:none;border:1.5px solid rgba(255,255,255,0.25);color:#F0F2FF;border-radius:10px;padding:12px;font-size:15px;font-weight:700;cursor:pointer;}';
  document.head.appendChild(css);

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  onReady(function () {
    /* ── 2. Safe-to-Proceed status strip (answers: Is this safe? What needs approval?) ── */
    var strip = document.createElement('div');
    strip.className = 'indx-safe-strip';
    strip.setAttribute('role', 'status');
    strip.setAttribute('aria-live', 'polite');
    function setStrip() {
      if (navigator.onLine) {
        strip.classList.remove('offline');
        strip.innerHTML = '<span class="indx-safe-ic" aria-hidden="true">🛡️</span>' +
          '<span class="indx-safe-tx">Safe to proceed. Nothing moves without your approval — every sensitive action creates a <a href="/siindex-trust-compliance.html">consent receipt</a>.</span>';
      } else {
        strip.classList.add('offline');
        strip.innerHTML = '<span class="indx-safe-ic" aria-hidden="true">📡</span>' +
          '<span class="indx-safe-tx">Offline — viewing and drafts only. Nothing sensitive will move until you are online and approve it.</span>';
      }
    }
    setStrip();
    window.addEventListener('online', setStrip);
    window.addEventListener('offline', setStrip);
    var topbar = document.querySelector('.topbar,.header,.banner');
    if (topbar && topbar.parentNode) topbar.parentNode.insertBefore(strip, topbar.nextSibling);
    else document.body.insertBefore(strip, document.body.firstChild);

    /* ── 3. Help FAB (answers: How do I ask SIINDEX for help?) ── */
    var help = document.createElement('a');
    help.className = 'indx-fab indx-fab-help';
    help.href = IS_HELP ? '/speak-to-siindex.html' : '/help.html';
    help.setAttribute('aria-label', IS_HELP ? 'Ask SIINDEX' : 'Get help from SIINDEX');
    help.innerHTML = '<span class="fic" aria-hidden="true">🛟</span><span class="flb">' + (IS_HELP ? 'ASK' : 'HELP') + '</span>';
    document.body.appendChild(help);

    /* ── 4. Voice command (voice prepares, tap confirms — never executes sensitive actions) ── */
    if (!IS_SPEAK) {
      var vfab = document.createElement('button');
      vfab.className = 'indx-fab indx-fab-voice';
      vfab.setAttribute('aria-label', 'Speak to SIINDEX — voice command');
      vfab.innerHTML = '<span class="fic" aria-hidden="true">🎙️</span><span class="flb">SPEAK</span>';
      document.body.appendChild(vfab);

      var sheet = document.createElement('div');
      sheet.className = 'indx-voice-sheet';
      sheet.setAttribute('role', 'dialog');
      sheet.setAttribute('aria-label', 'Speak to SIINDEX');
      sheet.innerHTML =
        '<div class="indx-vs-title">Speak to SIINDEX</div>' +
        '<div class="indx-vs-sub">Try: "send money" · "show my receive details" · "cash out" · "I need help" · "stop"</div>' +
        '<div class="indx-vs-listen" id="indxVsListen" aria-live="polite"></div>' +
        '<div class="indx-vs-row">' +
          '<input class="indx-vs-inp" id="indxVsInp" type="text" placeholder="Or type it here…" aria-label="Type your command">' +
          '<button class="indx-vs-btn" id="indxVsGo">Go</button>' +
        '</div>' +
        '<div class="indx-vs-confirm" id="indxVsConfirm">' +
          '<div class="indx-vs-cq" id="indxVsCq"></div>' +
          '<div class="indx-vs-cbtns">' +
            '<button class="indx-vs-yes" id="indxVsYes">Yes</button>' +
            '<button class="indx-vs-no" id="indxVsNo">No</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(sheet);

      var ROUTES = [
        { re: /(send|pay|transfer)/i, label: 'Go to Send?', url: '/send.html' },
        { re: /(receive|get paid|my details|qr)/i, label: 'Show your Receive details?', url: '/receive.html' },
        { re: /(cash|withdraw|bank)/i, label: 'Go to Cash Out?', url: '/withdraw-fiat.html' },
        { re: /(help|stuck|confus|support)/i, label: 'Open Help?', url: '/help.html' },
        { re: /(grid|account|sign ?up|join|start)/i, label: 'Create your Grid Account?', url: '/grid-account-onboarding.html' },
        { re: /(home|siindex|speak)/i, label: 'Open Speak to SIINDEX?', url: '/speak-to-siindex.html' }
      ];
      var pendingUrl = null, rec = null;

      function interpret(text) {
        var listen = document.getElementById('indxVsListen');
        if (/stop/i.test(text)) { closeSheet(); return; }
        for (var i = 0; i < ROUTES.length; i++) {
          if (ROUTES[i].re.test(text)) {
            pendingUrl = ROUTES[i].url;
            document.getElementById('indxVsCq').textContent = ROUTES[i].label;
            document.getElementById('indxVsConfirm').classList.add('show');
            return;
          }
        }
        listen.textContent = 'I heard: "' + text + '" — try one of the examples above.';
      }
      function closeSheet() {
        sheet.classList.remove('open');
        document.getElementById('indxVsConfirm').classList.remove('show');
        document.getElementById('indxVsListen').textContent = '';
        pendingUrl = null;
        if (rec) { try { rec.stop(); } catch (e) {} }
      }
      vfab.onclick = function () {
        sheet.classList.add('open');
        var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        var listen = document.getElementById('indxVsListen');
        if (SR) {
          try {
            rec = new SR();
            rec.lang = 'en-AU';
            rec.interimResults = false;
            rec.onresult = function (e) {
              var t = e.results[0][0].transcript;
              listen.textContent = 'I heard: "' + t + '"';
              interpret(t);
            };
            rec.onerror = function () { listen.textContent = 'Mic unavailable — type instead. That works just as well.'; };
            rec.start();
            listen.textContent = 'Listening…';
          } catch (e) { listen.textContent = 'Type your command below.'; }
        } else {
          listen.textContent = 'Voice not supported on this phone — type below. Same power.';
        }
        setTimeout(function () { document.getElementById('indxVsInp').focus(); }, 100);
      };
      document.getElementById('indxVsGo').onclick = function () {
        var v = document.getElementById('indxVsInp').value.trim();
        if (v) interpret(v);
      };
      document.getElementById('indxVsInp').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { var v = this.value.trim(); if (v) interpret(v); }
      });
      document.getElementById('indxVsYes').onclick = function () { if (pendingUrl) location.href = pendingUrl; };
      document.getElementById('indxVsNo').onclick = closeSheet;
    }

    /* ── 5. Screen reader labels for common icon-only controls ── */
    document.querySelectorAll('.banner-back,.topbar-back,.header-back,.back-btn').forEach(function (el) {
      if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', 'Go back');
      if (el.tagName !== 'BUTTON' && el.tagName !== 'A') { el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0'); }
    });
    document.querySelectorAll('.nav-item').forEach(function (el) {
      var t = (el.textContent || '').trim();
      if (t && !el.getAttribute('aria-label')) el.setAttribute('aria-label', t);
    });

    /* ── 6. Offline guard on sensitive executions (money movement waits for signal) ── */
    ['executeSend', 'confirmWithdraw', 'confirmSend', 'submitWithdraw'].forEach(function (fn) {
      if (typeof window[fn] === 'function') {
        var orig = window[fn];
        window[fn] = function () {
          if (window.INDXPWA && !window.INDXPWA.guardSensitive()) return;
          if (!navigator.onLine) return;
          return orig.apply(this, arguments);
        };
      }
    });
  });
})();
