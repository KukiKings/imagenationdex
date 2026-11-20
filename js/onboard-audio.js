/* IN$DEX /onboard -- "Listen" (read this aloud) control.
 *
 * AUDIO SOURCE
 *   English: the visitor's own device voice (window.speechSynthesis, en-AU preferred).
 *     This page makes NO network request for it: the text below is handed straight to the
 *     browser. It does not use the siindex-website-voice-tts endpoint. Some browsers use an
 *     online voice for speechSynthesis; that is the browser's choice and outside this page.
 *   Cook Islands Maori: NOT LIVE. Pre-recorded files only (no device voice speaks Cook Islands
 *     Maori correctly, and no wording or recording has been checked by a native speaker).
 *     To switch it on: put the recorded files at the paths in LANGS.mi.files, put the exact
 *     checked wording in LANGS.mi.text, set LANGS.mi.ready = true. Files are same-origin, so
 *     media-src 'self' already allows them. Until then the language chooser stays hidden.
 *
 * EXACT ENGLISH SPOKEN TEXT (change it here and in the page comment together; no silent edits)
 *   s1: "Pick your name and add your phone. Type the name you want. Then type your phone number with the country code, like plus six eight two, one two three four five. Then tap I'm in."
 *   s2: "Enter your code. We sent a text message to your phone. Type the six numbers from that message. Then tap Check code."
 *   s3: "Add your email. Your name is saved. If you have an email, type it and tap Finish. If you do not have an email, tap I do not have an email."
 *   s4: "Your name is reserved. It is reserved, not issued. Payments and wallets are not live yet. Tap Go to Home."
 *
 * No auto-play: speech or audio starts only when the Listen button is tapped.
 * No inline script, no inline handler. Does not touch the captcha, auth or sign-up code.
 */
(function () {
  'use strict';
  var LANGS = {
    en: {
      label: 'English', ready: true, lang: 'en-AU',
      text: {
        s1: "Pick your name and add your phone. Type the name you want. Then type your phone number with the country code, like plus six eight two, one two three four five. Then tap I'm in.",
        s2: "Enter your code. We sent a text message to your phone. Type the six numbers from that message. Then tap Check code.",
        s3: "Add your email. Your name is saved. If you have an email, type it and tap Finish. If you do not have an email, tap I do not have an email.",
        s4: "Your name is reserved. It is reserved, not issued. Payments and wallets are not live yet. Tap Go to Home."
      }
    },
    mi: {
      label: 'Reo Māori Kūki ʻĀirani', ready: false, text: null,
      files: { s1: '/assets/audio/onboard/mi-s1.mp3', s2: '/assets/audio/onboard/mi-s2.mp3', s3: '/assets/audio/onboard/mi-s3.mp3', s4: '/assets/audio/onboard/mi-s4.mp3' }
    }
  };
  var cur = 'en', player = null, activeBtn = null;
  var synth = window.speechSynthesis;
  var btns = Array.prototype.slice.call(document.querySelectorAll('.say'));
  if (!btns.length) return;

  function stop() {
    try { if (synth) synth.cancel(); } catch (e) {}
    if (player) { try { player.pause(); } catch (e) {} player = null; }
    if (activeBtn) { activeBtn.classList.remove('on'); activeBtn.setAttribute('aria-pressed', 'false'); setLabel(activeBtn, false); activeBtn = null; }
  }
  function setLabel(b, playing) {
    var t = b.querySelector('.say-t');
    if (t) t.textContent = playing ? 'Stop' : 'Listen';
  }
  function begin(b) { activeBtn = b; b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); setLabel(b, true); }
  function msg(b, s) { var m = b.parentNode.querySelector('.say-msg'); if (m) m.textContent = s || ''; }

  function pickVoice(lang) {
    var vs = []; try { vs = synth.getVoices() || []; } catch (e) {}
    for (var i = 0; i < vs.length; i++) if (vs[i].lang && vs[i].lang.replace('_', '-').toLowerCase() === lang.toLowerCase()) return vs[i];
    for (var j = 0; j < vs.length; j++) if (/^en[-_]/i.test(vs[j].lang || '')) return vs[j];
    return null;
  }

  function play(b) {
    var step = b.getAttribute('data-say'), L = LANGS[cur];
    msg(b, '');
    if (activeBtn === b) { stop(); return; }
    stop();
    if (!L.ready) { msg(b, 'This language is not ready yet.'); return; }
    if (L.files) {
      var a = new Audio(L.files[step]);
      player = a; begin(b);
      a.onended = function () { if (activeBtn === b) stop(); };
      a.onerror = function () { stop(); msg(b, 'The audio did not play. Read the words on the screen.'); };
      var p = a.play(); if (p && p.catch) p.catch(function () { stop(); msg(b, 'The audio did not play. Read the words on the screen.'); });
      return;
    }
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') { msg(b, 'Your device cannot read aloud. Read the words on the screen.'); return; }
    var u = new SpeechSynthesisUtterance(L.text[step]);
    var v = pickVoice(L.lang); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = L.lang;
    u.rate = 0.9;
    u.onend = function () { if (activeBtn === b) stop(); };
    u.onerror = function (ev) { if (activeBtn === b) stop(); if (ev && ev.error && ev.error !== 'canceled' && ev.error !== 'interrupted') msg(b, 'Your device could not read this aloud. Read the words on the screen.'); };
    begin(b);
    try { window.dispatchEvent(new CustomEvent('siindex:browser-speech', { detail: { kind: 'synthesis', local: !!(v && v.localService === true) } })); } catch (e) {}
    try { synth.cancel(); synth.resume(); synth.speak(u); } catch (e) { stop(); msg(b, 'Your device could not read this aloud. Read the words on the screen.'); }
  }

  btns.forEach(function (b) { b.addEventListener('click', function () { play(b); }); });

  // Language chooser: only shown when a second language is ready.
  var chooser = document.getElementById('sayLang');
  var ready = Object.keys(LANGS).filter(function (k) { return LANGS[k].ready; });
  if (chooser && ready.length > 1) {
    chooser.hidden = false;
    ready.forEach(function (k) {
      var c = document.createElement('button'); c.type = 'button'; c.className = 'say-lang'; c.textContent = LANGS[k].label;
      c.setAttribute('aria-pressed', k === cur ? 'true' : 'false');
      c.addEventListener('click', function () {
        stop(); cur = k;
        Array.prototype.forEach.call(chooser.children, function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
      });
      chooser.appendChild(c);
    });
  }

  // Stop speaking when the step changes (panels are hidden/shown by onboard.js).
  if (window.MutationObserver) {
    var mo = new MutationObserver(function () { stop(); });
    ['s1', 's2', 's3', 's4'].forEach(function (id) { var el = document.getElementById(id); if (el) mo.observe(el, { attributes: true, attributeFilter: ['hidden'] }); });
  }
  window.addEventListener('pagehide', stop);
})();
