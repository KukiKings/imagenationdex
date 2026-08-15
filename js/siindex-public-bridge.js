/**
 * siindex-public-bridge.js
 * Patches SIINDEXVoice.ask for identity / status / brand facts from living public knowledge.
 * Self-loads knowledge + page-context if missing. SI not AI. Brand-first: always IN$DEX.
 * Version: 1.3.0 | Task-3 harness guard + audit 2026-08-15
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
    return loadScript('/js/siindex-public-knowledge.js?v=1.5.0').catch(function () {
      return loadScript('/js/siindex-public-knowledge.js').catch(function () {
        return loadScript('js/siindex-public-knowledge.js');
      });
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
      /\b(mission|founder|aj henry|origin|problem|interview|reporter|media|collaborat|partner|autonom)\b/.test(q) ||
      /\b(voice|sound like|spoken|tts|text.?to.?speech|pronounc|sinn-?dex|sign-?dex)\b/.test(q) ||
      /\b(wallet|payment|account|trading|remittance|private keys?)\b/.test(q)
    );
  }

  function applyGuard(text) {
    var K = window.SIINDEX_PUBLIC;
    if (!K) return text;
    if (typeof K.guard === 'function') return K.guard(text);
    if (typeof K.enforceBannedClaims === 'function') return K.enforceBannedClaims(text);
    return text;
  }

  function auditLog(detail) {
    try {
      var entry = {
        ts: new Date().toISOString(),
        version: detail.version || (window.SIINDEX_PUBLIC && window.SIINDEX_PUBLIC.version) || 'unknown',
        fact_id: detail.fact_id || 'unknown',
        live_status_version: detail.live_status_version || null,
        authority: detail.authority || 'Trusted',
        source: detail.source || 'public-knowledge',
        q_len: detail.q_len || 0
      };
      window.dispatchEvent(new CustomEvent('siindex:knowledge-audit', { detail: entry }));
      var store = window.__SIINDEX_KNOWLEDGE_AUDIT__;
      if (!Array.isArray(store)) {
        store = [];
        window.__SIINDEX_KNOWLEDGE_AUDIT__ = store;
      }
      store.push(entry);
      if (store.length > 50) store.shift();
    } catch (_) {}
  }

  function showLocalAnswer(answer, source, audit) {
    try {
      var id = 'spk-' + Date.now();
      window.dispatchEvent(
        new CustomEvent('siindex:message', {
          detail: {
            role: 'assistant',
            text: answer,
            id: id,
            streaming: false,
            source: source || 'public-knowledge',
            fact_id: audit && audit.fact_id,
            version: audit && audit.version
          },
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
          if (audit && audit.fact_id) row.dataset.factId = audit.fact_id;
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
        var audit = null;
        var answer;
        if (typeof window.SIINDEX_PUBLIC.answerWithAudit === 'function') {
          audit = window.SIINDEX_PUBLIC.answerWithAudit(q);
          answer = audit.text;
        } else {
          answer = window.SIINDEX_PUBLIC.answer(q);
          audit = {
            text: answer,
            fact_id: window.SIINDEX_PUBLIC._lastFactId || 'unknown',
            version: window.SIINDEX_PUBLIC.version,
            authority: 'Trusted',
            source: 'public-knowledge'
          };
        }
        answer = applyGuard(answer);
        audit.q_len = q.length;
        auditLog(audit);
        showLocalAnswer(answer, source, audit);
        if (window.SIINDEXVoice.speak && window.SIINDEXVoice.voiceEnabled) {
          try {
            window.SIINDEXVoice.speak(answer);
          } catch (_) {}
        }
        return Promise.resolve(answer);
      }

      return Promise.resolve(originalAsk.call(window.SIINDEXVoice, text, options)).then(function (result) {
        if (typeof result === 'string') {
          var guarded = applyGuard(result);
          if (guarded !== result) {
            auditLog({
              fact_id: 'model-fallback-guarded',
              version: window.SIINDEX_PUBLIC && window.SIINDEX_PUBLIC.version,
              authority: 'Trusted-guard',
              source: 'bridge-guard',
              q_len: q.length
            });
          }
          return guarded;
        }
        return result;
      });
    };

    window.SIINDEXVoice._publicKnowledgePatched = true;
    window.dispatchEvent(
      new CustomEvent('siindex:public-knowledge-ready', {
        detail: { version: (window.SIINDEX_PUBLIC && window.SIINDEX_PUBLIC.version) || '1.5.0' },
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
