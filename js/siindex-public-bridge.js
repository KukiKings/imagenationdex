/**
 * siindex-public-bridge.js
 * Patches SIINDEXVoice.ask for identity / status / brand facts from living public knowledge.
 * Self-loads knowledge + page-context if missing. SI not AI. Brand-first: always IN$DEX.
 * Version: 1.1.0
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
      /\b(company|registr|legal name|limited|image nation|cook island|rarotonga)\b/.test(q) ||
      /\b(0\.24|genesis|token price)\b/.test(q) ||
      /\b(98\s*\/?\s*2|pilot|what is live|what works)\b/.test(q) ||
      /\b(pqsi|synthetic intelligence)\b/.test(q)
    );
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
        try {
          window.dispatchEvent(
            new CustomEvent('siindex:message', {
              detail: { role: 'user', text: q, id: 'local-u-' + Date.now(), streaming: false, source: source },
            }),
          );
          window.dispatchEvent(
            new CustomEvent('siindex:message', {
              detail: {
                role: 'assistant',
                text: answer,
                id: 'local-a-' + Date.now(),
                streaming: false,
                source: source,
              },
            }),
          );
        } catch (_) {}

        if (window.SIINDEXVoice.speak) {
          try { window.SIINDEXVoice.speak(answer); } catch (_) {}
        }

        try {
          var panel = document.getElementById('siindex-panel');
          var messages = panel && panel.querySelector('[data-si-messages]');
          if (messages) {
            var empty = messages.querySelector('[data-si-empty]');
            if (empty) empty.hidden = true;
            function addRow(role, body) {
              var row = document.createElement('div');
              row.className = 'siindex-message ' + role;
              var sender = document.createElement('div');
              sender.className = 'siindex-message-sender';
              sender.textContent = role === 'user' ? 'You' : 'SIINDEX';
              var b = document.createElement('div');
              b.className = 'siindex-message-body';
              b.textContent = body;
              row.append(sender, b);
              messages.appendChild(row);
            }
            addRow('user', q);
            addRow('assistant', answer);
            messages.scrollTop = messages.scrollHeight;
          }
          var status = panel && panel.querySelector('[data-si-status]');
          if (status) {
            status.textContent = 'Answered from public living knowledge (IN$DEX · SI · PQSI).';
            status.dataset.state = 'idle';
          }
        } catch (_) {}

        return Promise.resolve(answer);
      }

      return originalAsk.call(window.SIINDEXVoice, text, options);
    };

    window.SIINDEXVoice._publicKnowledgePatched = true;
    window.dispatchEvent(
      new CustomEvent('siindex:public-knowledge-ready', {
        detail: { version: (window.SIINDEX_PUBLIC && window.SIINDEX_PUBLIC.version) || '1.0.0' },
      }),
    );
    return true;
  }

  function tryPatch() {
    ensureKnowledge()
      .then(function () { return ensurePageContext(); })
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
