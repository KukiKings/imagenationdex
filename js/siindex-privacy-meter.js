/**
 * siindex-privacy-meter.js: visible "what left this device" line for SIINDEX visitor surfaces.
 *
 * HOW THE SIGNAL STAYS HONEST (read before changing anything on a SIINDEX answer path):
 *  - It counts real network requests. window.fetch is wrapped once; while an answer is being
 *    handled every fetch() is counted, whatever file made it. No call site reports itself,
 *    so a new fetch() cannot hide. Requests made with no answer in progress are ignored,
 *    except SIINDEX function calls, which always open a count.
 *  - "Local only · 0 external calls" is shown ONLY when an answer arrived and zero requests
 *    were made for it. A local answer that is then spoken through the voice endpoint shows
 *    that call (voice is on by default).
 *  - Browser speech services (mic recognition, and non-local browser voices) are not fetch()
 *    calls and cannot be measured here. They are noted in the text and never shown as local.
 *  - Every answer path must announce itself, or the line will not update:
 *      siindex:message with role "si" or "assistant" (siindex-speak-core.js, public bridge),
 *      or SIINDEX_PRIVACY.answered("local") for answers a page renders directly
 *      (siindex-qa-mode.js, speak-to-siindex.html).
 *  - Reads only. No new requests, no storage, no model calls, no timers beyond the settle timer.
 */
(function () {
  "use strict";
  if (window.SIINDEX_PRIVACY) return;

  var VOICE_KEY = "siindex_website_voice_enabled";
  var SETTLE_VOICE_ON_MS = 3200; // the voice request can start up to ~2.5 s after the answer
  var SETTLE_VOICE_OFF_MS = 700;

  var KIND_BY_URL = [
    ["siindex-website-runtime", "runtime", "question sent to SIINDEX server"],
    ["siindex-website-voice-tts", "voice", "reply text sent for voice"],
    ["siindex-website-transcribe", "transcribe", "recording sent for transcription"],
    ["siindex-mission-ledger", "ledger", "mission note sent"],
    ["siindex-visitor-feedback", "feedback", "answer flag sent"]
  ];
  var LABEL = { other: "other request" };
  KIND_BY_URL.forEach(function (k) { LABEL[k[1]] = k[2]; });

  var TEXT_IDLE = "No question yet · 0 external calls";
  var NOTE_MIC = "mic heard by your browser's speech service";
  var NOTE_VOICE = "browser voice may be online";
  var TITLE = "Counts network requests this page made while answering your last question. " +
    "Browser speech services run outside this page: they are noted here, not counted.";

  var bucket = null;   // answer in progress
  var last = null;     // last finished answer
  var inflight = 0;
  var timer = null;

  function voiceOn() {
    try {
      if (window.SIINDEXVoice && typeof window.SIINDEXVoice.isVoiceOn === "function") return !!window.SIINDEXVoice.isVoiceOn();
      return localStorage.getItem(VOICE_KEY) !== "false";
    } catch (_) { return true; }
  }

  function classify(url) {
    for (var i = 0; i < KIND_BY_URL.length; i++) if (url.indexOf(KIND_BY_URL[i][0]) !== -1) return KIND_BY_URL[i][1];
    return "other";
  }

  function open() { if (!bucket) bucket = { calls: [], answered: false, mic: false, voice: false }; return bucket; }

  function touch() {
    clearTimeout(timer);
    timer = setTimeout(settle, voiceOn() ? SETTLE_VOICE_ON_MS : SETTLE_VOICE_OFF_MS);
    render();
  }

  function settle() {
    if (inflight > 0) { touch(); return; }
    var b = bucket;
    bucket = null;
    if (b && (b.answered || b.calls.length || b.mic || b.voice)) last = b;
    render();
  }

  function plural(n) { return n + " external call" + (n === 1 ? "" : "s"); }

  function describe(b) {
    var n = b.calls.length;
    var notes = [];
    if (b.mic) notes.push(NOTE_MIC);
    if (b.voice) notes.push(NOTE_VOICE);
    if (n === 0 && !notes.length) return "Local only · 0 external calls";
    var seen = {}, kinds = [];
    b.calls.forEach(function (k) { if (!seen[k]) { seen[k] = 1; kinds.push(LABEL[k]); } });
    var parts = [n === 0 ? "0 external calls counted" : plural(n)];
    if (kinds.length) parts.push(kinds.join(", "));
    return parts.concat(notes).join(" · ");
  }

  function currentText() {
    if (bucket) return "Checking… · " + plural(bucket.calls.length) + " so far";
    if (last) return describe(last);
    return TEXT_IDLE;
  }

  function render() {
    var text = currentText();
    var calls = bucket ? bucket.calls.length : (last ? last.calls.length : 0);
    var nodes = document.querySelectorAll("[data-si-privacy]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      el.classList.add("si-privacy");
      if (!el.getAttribute("role")) el.setAttribute("role", "status");
      el.setAttribute("title", TITLE);
      el.classList.toggle("si-privacy--calls", calls > 0 || (!bucket && last && (last.mic || last.voice)));
      if (el.textContent !== text) el.textContent = text;
    }
  }

  function injectStyles() {
    if (document.getElementById("si-privacy-css")) return;
    var s = document.createElement("style");
    s.id = "si-privacy-css";
    s.textContent =
      ".si-privacy{display:block;width:fit-content;max-width:100%;margin:.5rem 0;padding:.3rem .75rem;border-radius:999px;" +
      "border:1px solid rgba(0,229,160,.45);background:rgba(0,229,160,.08);color:#8ff0cf;font-size:.78rem;font-weight:700;line-height:1.4}" +
      ".si-privacy.si-privacy--calls{border-color:rgba(255,191,63,.55);background:rgba(255,191,63,.08);color:#ffd56a}";
    (document.head || document.documentElement).appendChild(s);
  }

  // Count every fetch() while an answer is in progress (see header comment).
  var realFetch = window.fetch;
  if (typeof realFetch === "function") {
    window.fetch = function (input) {
      var tracked = false;
      try {
        var url = typeof input === "string" ? input : (input && input.url) || String(input);
        var kind = classify(url);
        if (bucket || kind !== "other") {
          open().calls.push(kind);
          inflight += 1;
          tracked = true;
          touch();
        }
      } catch (_) {}
      var p = realFetch.apply(this, arguments);
      if (tracked) {
        var done = function () { inflight = Math.max(0, inflight - 1); touch(); };
        p.then(done, done);
      }
      return p;
    };
  }

  window.addEventListener("siindex:message", function (ev) {
    var role = ev && ev.detail && ev.detail.role;
    if (role === "si" || role === "assistant") { open().answered = true; touch(); }
  });
  window.addEventListener("siindex:browser-speech", function (ev) {
    var d = (ev && ev.detail) || {};
    var b = open();
    if (d.kind === "recognition") b.mic = true;
    if (d.kind === "synthesis" && d.local !== true) b.voice = true;
    touch();
  });

  window.SIINDEX_PRIVACY = {
    version: "1.0.0",
    answered: function () { open().answered = true; touch(); },
    text: currentText,
    state: function () {
      var b = bucket || last;
      return { phase: bucket ? "checking" : (last ? "done" : "idle"), calls: b ? b.calls.slice() : [], mic: !!(b && b.mic), voice: !!(b && b.voice), text: currentText() };
    }
  };

  function boot() { injectStyles(); render(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
