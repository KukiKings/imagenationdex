/* IN$DEX /onboard -- "Listen" (read this aloud) control.
 *
 * AUDIO SOURCE (changed 2026-11: was the device's speechSynthesis voice)
 *   English: the SIINDEX voice. It POSTs the step's text to the same endpoint that
 *     SIINDEXVoice.speak() uses on the public pages (siindex-website-voice-tts), with the same
 *     headers. That function always speaks with APPROVED_INTRO_VOICE_ID (the public introduction
 *     voice), so every SIINDEX spoken line is one voice. Whether it matches the intro video BY EAR
 *     is AJ's check (siindex-operating/VOICE_IDENTITY.md); this file cannot test that.
 *     Why not load siindex-speak-core.js here: it adds the mic/conversation engine and its silent
 *     data: audio unlock, which this page's CSP (media-src 'self') blocks and logs as an error.
 *     Playback uses Web Audio (decodeAudioData), not an <audio> element, because media-src
 *     'self' would block a blob: URL.
 *   EXTERNAL CALL: yes. One POST per step the first time Listen is tapped; the step's words only
 *     (the four lines below) go to the SIINDEX voice endpoint, which sends them to its voice
 *     provider. Nothing the visitor types is sent. The audio is kept in memory, so tapping the
 *     same step again makes no request. js/siindex-privacy-meter.js counts the request and the
 *     pill (data-si-privacy, shown after the first tap) reads "1 external call · reply text sent
 *     for voice". The endpoint allows 6 requests a minute per visitor.
 *   FALLBACK: if the voice endpoint fails (rate limit, offline, timeout), the device voice
 *     (window.speechSynthesis) reads the same text and the page says so. Some browsers use an
 *     online voice for that; the meter notes it as "browser voice may be online".
 *   Cook Islands Maori: NOT LIVE. Pre-recorded files only (no voice here speaks Cook Islands
 *     Maori correctly, and no wording or recording has been checked by a native speaker).
 *     To switch it on: put the recorded files at the paths in LANGS.mi.files, put the exact
 *     checked wording in LANGS.mi.text, set LANGS.mi.ready = true. Until then the language
 *     chooser stays hidden.
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
  var cur = 'en', player = null, activeBtn = null, ctrl = null, ctx = null, src = null, gen = 0;
  var cache = {};
  var VOICE_URL = 'https://zljgthfzbalsunuoohcd.supabase.co/functions/v1/siindex-website-voice-tts';
  var VOICE_KEY = 'sb_publishable_rSl7P028UrBn8KCUSSbjAg_mT3FWoxV'; // public key, same as siindex-speak-core.js
  var VISITOR_KEY = 'siindex_website_visitor_id';
  var synth = window.speechSynthesis;
  var btns = Array.prototype.slice.call(document.querySelectorAll('.say'));
  if (!btns.length) return;

  function stop() {
    gen++;
    if (ctrl) { try { ctrl.abort(); } catch (e) {} ctrl = null; }
    if (src) { try { src.onended = null; src.stop(); } catch (e) {} src = null; }
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

  function deviceSay(b, L, step, note) {
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') { stop(); msg(b, 'Your device cannot read aloud. Read the words on the screen.'); return; }
    var u = new SpeechSynthesisUtterance(L.text[step]);
    var v = pickVoice(L.lang); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = L.lang;
    u.rate = 0.9;
    u.onend = function () { if (activeBtn === b) stop(); };
    u.onerror = function (ev) { if (activeBtn === b) stop(); if (ev && ev.error && ev.error !== 'canceled' && ev.error !== 'interrupted') msg(b, 'Your device could not read this aloud. Read the words on the screen.'); };
    if (activeBtn !== b) begin(b);
    msg(b, note || '');
    try { window.dispatchEvent(new CustomEvent('siindex:browser-speech', { detail: { kind: 'synthesis', local: !!(v && v.localService === true) } })); } catch (e) {}
    try { synth.cancel(); synth.resume(); synth.speak(u); } catch (e) { stop(); msg(b, 'Your device could not read this aloud. Read the words on the screen.'); }
  }

  function visitorId() {
    try { var v = localStorage.getItem(VISITOR_KEY); if (!v) { v = (self.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'visitor-' + Date.now(); localStorage.setItem(VISITOR_KEY, v); } return v; }
    catch (e) { return 'visitor-' + Date.now(); }
  }

  function playBuffer(b, buf, myGen) {
    return ctx.decodeAudioData(buf.slice(0)).then(function (decoded) {
      if (myGen !== gen) return;
      src = ctx.createBufferSource(); src.buffer = decoded; src.connect(ctx.destination);
      src.onended = function () { if (activeBtn === b) stop(); };
      src.start();
    });
  }

  // SIINDEX voice: same endpoint and headers as SIINDEXVoice.speak() in siindex-speak-core.js.
  function voiceSay(b, L, step) {
    var myGen = ++gen;
    begin(b);
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC || !window.fetch) { deviceSay(b, L, step, "Used your device's voice."); return; }
    if (!ctx) { try { ctx = new AC(); } catch (e) { ctx = null; } }
    if (!ctx) { deviceSay(b, L, step, "Used your device's voice."); return; }
    try { if (ctx.state === 'suspended') ctx.resume(); } catch (e) {}
    var pill = b.parentNode.querySelector('.say-pill'); if (pill) pill.hidden = false;
    function fallback(why) { if (myGen !== gen) return; deviceSay(b, L, step, "The SIINDEX voice was not available (" + why + "), so your device's voice is reading this."); }
    if (cache[step]) { playBuffer(b, cache[step], myGen).catch(function () { fallback('audio'); }); return; }
    ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 25000);
    fetch(VOICE_URL, {
      method: 'POST', signal: ctrl ? ctrl.signal : undefined,
      headers: { apikey: VOICE_KEY, Authorization: 'Bearer ' + VOICE_KEY, 'Content-Type': 'application/json', 'x-siindex-visitor-id': visitorId(), 'x-siindex-provider-consent': 'accepted' },
      body: JSON.stringify({ text: L.text[step] })
    }).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) { var e = new Error('http ' + r.status); e.status = r.status; throw e; }
      return r.arrayBuffer();
    }).then(function (buf) {
      if (myGen !== gen) return;
      cache[step] = buf;
      return playBuffer(b, buf, myGen);
    }).catch(function (e) {
      clearTimeout(timer);
      if (myGen !== gen) return; // stopped on purpose
      fallback(e && e.status === 429 ? 'busy, wait a minute' : 'offline or slow');
    });
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
    voiceSay(b, L, step);
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
