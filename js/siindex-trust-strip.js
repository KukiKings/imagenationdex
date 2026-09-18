/**
 * siindex-trust-strip.js
 * Phase 1 trust UX: onboarding, live/not-live status, denial list,
 * copy-answer and optional feedback helpers for Q&A surfaces.
 */
(function () {
  'use strict';
  if (window.SIINDEX_TRUST) return;

  var LIVE =
    'Live: website · SIINDEX Visitor Mode (typed + spoken) · Interview · Present · FAQ.';
  var NOT_LIVE =
    'Not live: accounts · wallets · payments · remittance · token distribution · public trading · government digital residency.';
  var REF =
    'Reference only: USD $0.24 genesis · 98/2 doctrine until verified deployed code · pilot target 24 Feb 2027 (target, not a guarantee).';
  var DENY =
    'SIINDEX will never invent: completed Cook Islands registration or licences; a live market token price; wallets or payments from this chat; full autonomous CEO control without founder oversight.';

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function injectStyles() {
    if (document.getElementById('siindex-trust-css')) return;
    var s = document.createElement('style');
    s.id = 'siindex-trust-css';
    s.textContent =
      '.si-onboard{background:rgba(0,212,255,.1);border:1px solid rgba(0,212,255,.28);border-radius:12px;padding:.75rem 1rem;font-size:.85rem;color:#8ceaff;margin:0 0 .75rem}' +
      '.si-onboard ol{margin:.4rem 0 0;padding-left:1.2rem}' +
      '.si-onboard a{color:#fff;font-weight:700}' +
      '.si-status{background:rgba(139,63,232,.1);border:1px solid rgba(139,63,232,.28);border-radius:12px;padding:.75rem 1rem;font-size:.8rem;color:#d8def5;margin:0 0 .75rem}' +
      '.si-status strong{color:#00d4ff}' +
      '.si-deny{background:rgba(255,107,125,.08);border:1px solid rgba(255,107,125,.28);border-radius:12px;padding:.65rem 1rem;font-size:.78rem;color:#ffb0ba;margin:0 0 1rem}' +
      '.si-tools{display:flex;flex-wrap:wrap;gap:.4rem;margin:.55rem 0 0}' +
      '.si-tools button{border:1px solid rgba(0,212,255,.3);background:rgba(0,212,255,.08);color:#8ceaff;border-radius:999px;padding:.35rem .75rem;font-size:.72rem;font-weight:700;cursor:pointer}' +
      '.si-tools button:focus-visible{outline:3px solid #ffbf3f;outline-offset:2px}' +
      '.si-feedback-note{font-size:.75rem;color:#aab2d4;margin-top:.35rem;min-height:1em}';
    document.head.appendChild(s);
  }

  function mountOnboarding(target) {
    if (!target || target.querySelector('.si-onboard')) return;
    var box = el('div', 'si-onboard');
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', 'How SIINDEX works');
    box.innerHTML =
      '<strong>Before you ask</strong>' +
      '<ol>' +
      '<li><strong>Purpose:</strong> public information about IN$DEX only.</li>' +
      '<li><strong>Scope:</strong> no money movement, no accounts, no invented approvals.</li>' +
      '<li><strong>Double-check:</strong> confirm critical facts via <a href="mailto:imagenationdex@gmail.com">email</a> or <a href="/siindex-system-card.html">SI System Card</a>.</li>' +
      '</ol>';
    target.insertBefore(box, target.firstChild);
  }

  function mountStatus(target) {
    if (!target || target.querySelector('.si-status')) return;
    var box = el('div', 'si-status');
    box.innerHTML =
      '<strong>Live:</strong> ' + LIVE.replace(/^Live:\s*/, '') + '<br>' +
      '<strong>Not live:</strong> ' + NOT_LIVE.replace(/^Not live:\s*/, '') + '<br>' +
      '<strong>References:</strong> ' + REF.replace(/^Reference only:\s*/, '');
    var after = target.querySelector('.si-onboard');
    if (after && after.nextSibling) target.insertBefore(box, after.nextSibling);
    else if (after) after.after(box);
    else target.insertBefore(box, target.firstChild);
  }

  function mountDeny(target) {
    if (!target || target.querySelector('.si-deny')) return;
    var box = el('div', 'si-deny');
    box.textContent = DENY;
    var status = target.querySelector('.si-status');
    if (status) status.after(box);
    else {
      var on = target.querySelector('.si-onboard');
      if (on) on.after(box);
      else target.insertBefore(box, target.firstChild);
    }
  }

  function attachAnswerTools(answerEl, source) {
    if (!answerEl || answerEl.dataset.siTools === '1') return;
    answerEl.dataset.siTools = '1';
    if (!answerEl.getAttribute('aria-live')) answerEl.setAttribute('aria-live', 'polite');
    answerEl.setAttribute('role', 'status');

    var tools = el('div', 'si-tools');
    var note = el('div', 'si-feedback-note');

    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.textContent = 'Copy answer';
    copyBtn.setAttribute('aria-label', 'Copy SIINDEX answer to clipboard');
    copyBtn.addEventListener('click', function () {
      var text = answerEl.textContent || '';
      var stamp =
        '\n\n— SIINDEX public knowledge · ' +
        new Date().toISOString().slice(0, 10) +
        ' · source: ' +
        (source || 'qa') +
        ' · imagenationdex.com';
      var payload = text + stamp;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(payload).then(
          function () {
            note.textContent = 'Copied with source stamp.';
          },
          function () {
            note.textContent = 'Copy failed — select the answer text manually.';
          }
        );
      } else {
        note.textContent = 'Clipboard unavailable — select the answer text manually.';
      }
    });

    var wrongBtn = document.createElement('button');
    wrongBtn.type = 'button';
    wrongBtn.textContent = 'Flag answer';
    wrongBtn.setAttribute('aria-label', 'Flag this answer as possibly wrong');
    wrongBtn.addEventListener('click', function () {
      note.textContent =
        'Thanks — for a correction, email imagenationdex@gmail.com with the question and what looked wrong. Visitor Mode does not invent facts.';
      try {
        if (window.fetch) {
          fetch('https://zljgthfzbalsunuoohcd.supabase.co/functions/v1/siindex-visitor-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              kind: 'answer_flag',
              source: source || 'qa',
              snippet: (answerEl.textContent || '').slice(0, 400),
              path: location.pathname,
            }),
          }).catch(function () {});
        }
      } catch (_) {}
    });

    tools.appendChild(copyBtn);
    tools.appendChild(wrongBtn);
    answerEl.after(tools);
    tools.after(note);
  }

  function boot(opts) {
    opts = opts || {};
    injectStyles();
    var root =
      opts.root ||
      document.querySelector('.wrap') ||
      document.querySelector('main') ||
      document.body;
    if (opts.onboarding !== false) mountOnboarding(root);
    if (opts.status !== false) mountStatus(root);
    if (opts.deny !== false) mountDeny(root);
    var answer =
      opts.answerEl ||
      document.getElementById('out') ||
      document.querySelector('.answer');
    if (answer) attachAnswerTools(answer, opts.source || 'qa');
  }

  window.SIINDEX_TRUST = {
    LIVE: LIVE,
    NOT_LIVE: NOT_LIVE,
    REF: REF,
    DENY: DENY,
    boot: boot,
    mountOnboarding: mountOnboarding,
    mountStatus: mountStatus,
    mountDeny: mountDeny,
    attachAnswerTools: attachAnswerTools,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      /* pages call boot() explicitly with source */
    });
  }
})();
