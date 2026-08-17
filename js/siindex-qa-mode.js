/**
 * siindex-qa-mode.js
 * Shared Interview / FAQ / Present answer surface.
 * Brand-first IN$DEX · SI not AI · Sin-dex · no invented licences or live prices.
 */
(function () {
  'use strict';
  if (window.SIINDEX_QA) return;

  function waitKnowledge(cb, tries) {
    tries = tries || 0;
    if (window.SIINDEX_PUBLIC && typeof SIINDEX_PUBLIC.answer === 'function') {
      cb();
      return;
    }
    if (tries < 50) setTimeout(function () { waitKnowledge(cb, tries + 1); }, 100);
  }

  function answerText(q) {
    if (!window.SIINDEX_PUBLIC || typeof SIINDEX_PUBLIC.answer !== 'function') {
      return 'Public knowledge is still loading. Wait a moment and try again.';
    }
    return SIINDEX_PUBLIC.answer(q);
  }

  function speakOptional(q, source) {
    if (!window.SIINDEXVoice || typeof SIINDEXVoice.ask !== 'function') return;
    try {
      // Prefer speak-only of knowledge text to avoid double network runtime when possible
      var text = answerText(q);
      if (typeof SIINDEXVoice.speak === 'function') {
        SIINDEXVoice.speak(text);
      } else {
        SIINDEXVoice.ask(q, { source: source || 'qa-mode' });
      }
    } catch (_) {}
  }

  function bindChips(root, outEl, inputEl, source, speak) {
    root = root || document;
    root.querySelectorAll('[data-q]').forEach(function (btn) {
      if (btn.dataset.siindexQaBound) return;
      btn.dataset.siindexQaBound = '1';
      btn.addEventListener('click', function () {
        var q = btn.getAttribute('data-q') || '';
        if (inputEl) inputEl.value = q;
        if (outEl) outEl.textContent = answerText(q);
        if (speak) speakOptional(q, source);
      });
    });
  }

  function bindAsk(askBtn, inputEl, outEl, source, speak) {
    if (!askBtn || askBtn.dataset.siindexQaBound) return;
    askBtn.dataset.siindexQaBound = '1';
    function go() {
      var q = (inputEl && inputEl.value || '').trim();
      if (!q) return;
      if (outEl) outEl.textContent = answerText(q);
      if (speak) speakOptional(q, source);
    }
    askBtn.addEventListener('click', go);
    if (inputEl) {
      inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          go();
        }
      });
    }
  }

  function bindMic(micBtn, inputEl, outEl, source) {
    if (!micBtn || micBtn.dataset.siindexQaBound) return;
    micBtn.dataset.siindexQaBound = '1';
    micBtn.addEventListener('click', function () {
      if (!window.SIINDEXVoice || typeof SIINDEXVoice.listen !== 'function') {
        if (outEl) {
          outEl.textContent =
            'Voice input needs the public voice core. Type your question, or use a chip.';
        }
        return;
      }
      // listen → transcribe → ask; also mirror text answers into out when message events fire
      var onMsg = function (ev) {
        var d = (ev && ev.detail) || {};
        if (d.role === 'si' || d.role === 'assistant') {
          if (outEl && d.text) outEl.textContent = d.text;
          if (inputEl && d.text && d.role === 'user') inputEl.value = d.text;
        }
        if (d.role === 'user' && inputEl && d.text) inputEl.value = d.text;
      };
      window.addEventListener('siindex:message', onMsg);
      setTimeout(function () {
        window.removeEventListener('siindex:message', onMsg);
      }, 20000);
      SIINDEXVoice.listen({ source: source || 'qa-mode' });
    });
  }

  function fillFaqDetails() {
    document.querySelectorAll('details p[data-q]').forEach(function (el) {
      el.textContent = answerText(el.getAttribute('data-q'));
    });
  }

  window.SIINDEX_QA = {
    waitKnowledge: waitKnowledge,
    answerText: answerText,
    bindChips: bindChips,
    bindAsk: bindAsk,
    bindMic: bindMic,
    fillFaqDetails: fillFaqDetails,
    speakOptional: speakOptional,
  };
})();
