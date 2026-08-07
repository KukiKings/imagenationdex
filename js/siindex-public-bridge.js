/**
 * siindex-public-bridge.js
 * Loads after siindex-speak-core.js and siindex-public-knowledge.js.
 * Answers identity / status / Cook Islands facts from living public knowledge (SI, not AI)
 * without waiting for the remote runtime — then falls through for other questions.
 */
(function () {
  'use strict';

  function matchesPublicFact(text) {
    var q = String(text || '').toLowerCase();
    if (!q.trim()) return false;
    return (
      /\b(who are you|what are you|are you (an )?ai|artificial intelligence)\b/.test(q) ||
      /\bsiindex\b/.test(q) && /\b(who|what|are you|ai|si)\b/.test(q) ||
      /what is (in\$dex|index|indx)\b/.test(q) ||
      /\b(company|registr|legal name|limited|cook island|rarotonga)\b/.test(q) ||
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

        // Prefer core path when available so UI + history stay consistent
        if (typeof originalAsk === 'function') {
          // Inject as a short-circuit by temporarily answering via speak only if panel open
          // Full UI render stays on originalAsk for non-local; for local we still call original
          // with a tagged prefix the server may not need — safer: display via speak + status
          if (window.SIINDEXVoice.speak) {
            window.SIINDEXVoice.speak(answer);
          }
          // Also run original for server consistency is optional — skip remote for these facts
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
              status.textContent = 'Answered from public living knowledge (SI · PQSI).';
              status.dataset.state = 'idle';
            }
          } catch (_) {}
          return Promise.resolve(answer);
        }
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
    if (patchAsk()) return;
    var tries = 0;
    var timer = setInterval(function () {
      tries += 1;
      if (patchAsk() || tries > 40) clearInterval(timer);
    }, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryPatch, { once: true });
  } else {
    tryPatch();
  }
  window.addEventListener('siindex:ready', tryPatch);
})();
