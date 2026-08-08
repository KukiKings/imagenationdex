/**
 * siindex-home-ask-fix.js
 * Ensures public-home Talk panel always shows SIINDEX_PUBLIC answers on-screen.
 * Knowledge first, then optional speak(). Avoids silent early-return into voice-only path.
 */
(function () {
  'use strict';
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }
  ready(function () {
    var input = document.getElementById('publicInput');
    var messages = document.getElementById('publicMessages');
    if (!input || !messages) return;

    var messageNodes = new Map();
    function appendMessage(role, text, id) {
      var node = id ? messageNodes.get(id) : null;
      if (!node) {
        node = document.createElement('div');
        node.className = 'message ' + (role === 'user' ? 'user' : 'si');
        messages.appendChild(node);
        if (id) messageNodes.set(id, node);
      }
      node.textContent = text;
      messages.scrollTop = messages.scrollHeight;
    }

    function askFixed(text) {
      if (!text) return;
      appendMessage('user', text);
      var local = window.SIINDEX_PUBLIC && typeof SIINDEX_PUBLIC.answer === 'function' ? SIINDEX_PUBLIC.answer(text) : null;
      if (local) {
        appendMessage('si', local);
        if (window.SIINDEXVoice && typeof SIINDEXVoice.speak === 'function') {
          try { SIINDEXVoice.speak(local); } catch (e) {}
        }
        return;
      }
      if (window.SIINDEXVoice && typeof SIINDEXVoice.ask === 'function') {
        try { SIINDEXVoice.ask(text, { source: 'public-home' }); return; } catch (e) {}
      }
      appendMessage('si', 'SIINDEX public knowledge is still loading. Refresh once, then ask again.');
    }

    window.__SIINDEX_HOME_ASK__ = askFixed;

    var send = document.getElementById('publicSend');
    if (send) {
      send.replaceWith(send.cloneNode(true));
      document.getElementById('publicSend').addEventListener('click', function () {
        var t = input.value.trim();
        if (t) { input.value = ''; askFixed(t); }
      });
    }
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        var btn = document.getElementById('publicSend');
        if (btn) btn.click();
      }
    });
    document.querySelectorAll('[data-question]').forEach(function (button) {
      button.addEventListener('click', function (e) {
        e.stopImmediatePropagation();
        askFixed(button.getAttribute('data-question') || button.dataset.question);
      }, true);
    });
  });
})();
