/**
 * siindex-home-ask-form.js
 * Ensures prompt chips + composer work if inline handlers are absent.
 * Safe no-op when public-home already bound the same IDs.
 */
(function () {
  'use strict';
  if (window.__SIINDEX_HOME_ASK_FORM__) return;
  window.__SIINDEX_HOME_ASK_FORM__ = true;

  function ask(text) {
    text = String(text || '').trim();
    if (!text) return;
    if (window.SIINDEXVoice && typeof window.SIINDEXVoice.ask === 'function') {
      window.SIINDEXVoice.ask(text, { source: 'public-home' });
      return;
    }
    if (window.SIINDEX_PUBLIC && typeof window.SIINDEX_PUBLIC.answer === 'function') {
      try {
        window.dispatchEvent(
          new CustomEvent('siindex:message', {
            detail: { role: 'user', text: text, source: 'public-home', id: 'u-' + Date.now() },
          }),
        );
        window.dispatchEvent(
          new CustomEvent('siindex:message', {
            detail: {
              role: 'si',
              text: window.SIINDEX_PUBLIC.answer(text),
              source: 'public-home',
              id: 's-' + Date.now(),
            },
          }),
        );
      } catch (_) {}
    }
  }

  function bind() {
    var input = document.getElementById('publicInput');
    var send = document.getElementById('publicSend');
    var mic = document.getElementById('publicMic');
    if (send && !send.dataset.siindexBound) {
      send.dataset.siindexBound = '1';
      send.addEventListener('click', function () {
        if (!input) return;
        var t = input.value.trim();
        if (t) {
          input.value = '';
          ask(t);
        }
      });
    }
    if (input && !input.dataset.siindexBound) {
      input.dataset.siindexBound = '1';
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (send) send.click();
        }
      });
    }
    if (mic && !mic.dataset.siindexBound) {
      mic.dataset.siindexBound = '1';
      mic.addEventListener('click', function () {
        if (window.SIINDEXVoice && typeof window.SIINDEXVoice.listen === 'function') {
          window.SIINDEXVoice.listen({ source: 'public-home' });
        }
      });
    }
    document.querySelectorAll('[data-question]').forEach(function (btn) {
      if (btn.dataset.siindexBound) return;
      btn.dataset.siindexBound = '1';
      btn.addEventListener('click', function () {
        ask(btn.getAttribute('data-question') || btn.dataset.question);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
