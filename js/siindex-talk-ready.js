/**
 * siindex-talk-ready.js
 * Crucial Talk + presence UX: welcome message, honest status, voice tips.
 * Does not claim lip-sync or live wallets/payments.
 */
(function () {
  'use strict';
  if (window.__SIINDEX_TALK_READY__) return;
  window.__SIINDEX_TALK_READY__ = true;

  function appendWelcome() {
    var messages = document.getElementById('publicMessages');
    if (!messages || messages.childElementCount > 0) return;
    var node = document.createElement('div');
    node.className = 'message si';
    node.setAttribute('data-siindex-welcome', '1');
    node.textContent =
      'Kia orana. I am SIINDEX (spoken Sin-dex) — Synthetic Intelligence for IN$DEX, not AI. ' +
      'Visitor Mode is information only: no accounts, wallets, or payments from this chat. ' +
      'Tap a chip below, type a question, or use the mic (speak clearly for 2–3 seconds).';
    messages.appendChild(node);
  }

  function ensurePresenceHonesty() {
    var card = document.querySelector('.video-card');
    if (!card || card.querySelector('[data-siindex-presence-note]')) return;
    var note = document.createElement('p');
    note.setAttribute('data-siindex-presence-note', '1');
    note.style.cssText =
      'position:absolute;left:12px;top:12px;z-index:3;margin:0;padding:6px 10px;' +
      'border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.02em;' +
      'background:rgba(3,7,16,.78);border:1px solid rgba(255,191,63,.45);color:#ffd56a;';
    note.textContent = 'Presence: native play · visual may be near-still until AJ speaking take';
    card.style.position = card.style.position || 'relative';
    card.appendChild(note);
  }

  function ensureVoiceTip() {
    var status = document.getElementById('publicVoiceStatus');
    if (!status || status.dataset.siindexTip === '1') return;
    status.dataset.siindexTip = '1';
    if (!status.textContent || /tap the microphone/i.test(status.textContent)) {
      status.textContent =
        'Chips & typing work offline · Mic: allow access, speak 2–3 seconds clearly';
    }
  }

  function highlightChips() {
    var prompts = document.querySelector('.prompts');
    if (!prompts) return;
    prompts.setAttribute('aria-label', 'Suggested questions for SIINDEX');
    prompts.querySelectorAll('button').forEach(function (btn) {
      btn.type = 'button';
      if (!btn.getAttribute('title')) {
        btn.title = 'Ask: ' + (btn.getAttribute('data-question') || btn.textContent);
      }
    });
  }

  function run() {
    appendWelcome();
    ensurePresenceHonesty();
    ensureVoiceTip();
    highlightChips();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  window.addEventListener('siindex:public-boot-ready', run);
})();
