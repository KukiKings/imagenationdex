/**
 * siindex-public-bridge.js
 * Patches SIINDEXVoice.ask for identity / status / brand facts from living public knowledge.
 * Self-loads knowledge + page-context if missing. SI not AI. Brand-first: always IN$DEX.
 * Version: 1.2.0
 */
(function () {
  'use strict';

  function loadScript(src) {
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

  function ensureKnowledge() {
    if (window.SIINDEX_PUBLIC && typeof window.SIINDEX_PUBLIC.answer === 'function') {
      return Promise.resolve();
    }
    return loadScript('/js/siindex-public-knowledge.js').catch(function () {
      return loadScript('js/siindex-public-knowledge.js');
    });
  }

  function ensurePageContext() {
    if (window.SIINDEX_PAGE) return Promise.resolve();
    return loadScript('/js/siindex-page-context.js').catch(function () {
      return loadScript('js/siindex-page-context.js');
    }).catch(function () { /* optional */ });
  }

  function matchesPublicFact(text) {
    var q = String(text || '').toLowerCase();
    if (!q.trim()) return false;
    return (
      /\b(who are you|what are you|are you (an )?ai|artificial intelligence)\b/.test(q) ||
      (/\bsiindex\b/.test(q) && /\b(who|what|are you|ai|si)\b/.test(q)) ||
      /what is (in\$dex|index|indx)\b/.test(q) ||
      /\b(company|registr|legal name|limited|image nation|cook island|rarotonga|parliament|prime minister|licence|license)\b/.test(q) ||
      /\b(0\.24|genesis|token price)\b/.test(q) ||
      /\b(98\s*\/?\s*2|pilot|what is live|what works|pre-?launch)\b/.test(q) ||
      /\b(pqsi|synthetic intelligence|mama noe)\b/.test(q) ||
      /\b(mission|founder|aj henry|origin|problem|interview|reporter|media|collaborat|partner|autonom)\b/.test(q)
    );
  }

  function showLocalAnswer(answer, source) {
    try {
      var id = 'spk-' + Date.now();
      window.dispatchEvent(
        new CustomEvent('siindex:message', {
          detail: { role: 'assistant', text: answer, id: id, streaming: false, source: source || 'public-knowledge' },
        }),
      );
      var panel = document.getElementById('siindex-panel');
      if (panel) {
        var messages = panel.querySelector('[data-si-messages]');
        var empty = panel.querySelector('[data-si-empty]');
        if (messages) {
          if (empty) empty.hidden = true;
          var row = document.createElement('div');
          row.className = 'siindex-message assistant';
          row.dataset.messageId = id;
          row.innerHTML =
            '<div class="siindex-message-sender">SIINDEX</div>' +
            '<div class="siindex-message-body"></div>';
          row.querySelector('.siindex-message-body').textContent = answer;
          messages.appendChild(row);
          messages.scrollTop = messages.scrollHeight;
        }
        var status = panel.querySelector('[data-si-status]');
        if (status) {
          status.textContent = 'Answered from public living knowledge.';
          status.dataset.state = 'idle';
        }
      }
    } catch (_) {}
  }

  function patchAsk() {
    if (!window.SIINDEXVoice || typeof window.SIINDEXVoice.ask !== 'function') return false;
    if (window.SIINDEXVoice._publicKnowledgePatched) return true;
    if (!window.SIINDEX_PUBLIC || typeof window.SIINDEX_PUBLIC.answer !== 'function') return false;

    var originalAsk = window.SIINDEXVoice.ask;

    window.SIINDEXVoice.ask = function (text, options) {
      var q = String(text || '').trim();
      var source = (options && options.source) || 'global';

      if (q && matchesPublicFact(q)) {
        var answer = window.SIINDEX_PUBLIC.answer(q);
        showLocalAnswer(answer, source);
        if (window.SIINDEXVoice.speak && window.SIINDEXVoice.voiceEnabled) {
          try {
            window.SIINDEXVoice.speak(answer);
          } catch (_) {}
        }
        return Promise.resolve(answer);
      }

      return originalAsk.call(window.SIINDEXVoice, text, options);
    };

    window.SIINDEXVoice._publicKnowledgePatched = true;
    window.dispatchEvent(
      new CustomEvent('siindex:public-knowledge-ready', {
        detail: { version: (window.SIINDEX_PUBLIC && window.SIINDEX_PUBLIC.version) || '1.2.0' },
      }),
    );
    return true;
  }

  function tryPatch() {
    ensureKnowledge()
      .then(function () {
        return ensurePageContext();
      })
      .then(function () {
        if (patchAsk()) return;
        var tries = 0;
        var timer = setInterval(function () {
          tries += 1;
          if (patchAsk() || tries > 40) clearInterval(timer);
        }, 250);
      })
      .catch(function (err) {
        console.warn('[SIINDEX bridge]', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryPatch, { once: true });
  } else {
    tryPatch();
  }
  window.addEventListener('siindex:ready', tryPatch);
})();
