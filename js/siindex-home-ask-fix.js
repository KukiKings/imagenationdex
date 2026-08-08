/**
 * siindex-home-ask-fix.js
 * D1: knowledge-first Talk answers on public home
 * D2: mobile nav keep primary links
 * D3: Cook Islands meeting brief mode link
 * D5: full intro transcript
 */
(function () {
  'use strict';
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  ready(function () {
    /* D2 mobile nav */
    try {
      var style = document.createElement('style');
      style.textContent = '@media(max-width:900px){.navlinks a{display:inline-flex!important}.navlinks a.nav-hide-sm{display:none!important}}';
      document.head.appendChild(style);
    } catch (e) {}

    /* D3 meeting brief button in modes strip */
    try {
      var modes = document.getElementById('siindex-modes');
      if (modes && !modes.querySelector('a[href="/cook-islands-meeting.html"]')) {
        var wrap = modes.querySelector('.wrap') || modes;
        var a = document.createElement('a');
        a.className = 'button secondary';
        a.href = '/cook-islands-meeting.html';
        a.textContent = 'Cook Islands brief';
        wrap.appendChild(a);
      }
    } catch (e) {}

    /* D5 transcript */
    try {
      var tr = document.querySelector('#introTranscript p');
      if (tr && tr.textContent.indexOf('I do not invent approvals') === -1) {
        tr.textContent = 'Kia orana. I am SIINDEX — Synthetic Intelligence for IN$DEX. I am your guide to what is live, what is planned, and what stays paused. Ask me anything about IN$DEX. I speak clearly. I do not invent approvals or live prices.';
      }
    } catch (e) {}

    /* D1 knowledge-first ask */
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
      var neo = send.cloneNode(true);
      send.parentNode.replaceChild(neo, send);
      neo.addEventListener('click', function () {
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
        e.preventDefault();
        e.stopImmediatePropagation();
        askFixed(button.getAttribute('data-question') || button.dataset.question);
      }, true);
    });
  });
})();
