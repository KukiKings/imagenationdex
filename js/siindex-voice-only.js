/**
 * siindex-voice-only.js: voice-first front door for SIINDEX public conversation pages.
 * One large "Tap to speak" button; no typing needed. Information only (same Visitor Mode rules).
 *
 * HOW IT WORKS (reuse, do not duplicate)
 *  - Each page loads this file in <head> with data-si-page="<key>" plus assets/siindex-voice-only.css,
 *    and has an empty <div id="siVoSlot"></div> followed by a <div data-si-privacy></div> pill.
 *    This file sets html.si-vo (the CSS hides chips, text box, guided paths and other secondary
 *    controls) and fills the slot with the mic stage. Without JS the original page is shown.
 *  - The big button does NOT add a second recogniser or listener. It clicks the page's own mic
 *    button (config.mic, e.g. #publicMic, #mic) so siindex-home-ask-form.js / siindex-qa-mode.js keep
 *    working, or calls SIINDEXVoice.listen() where the page has no mic. The core (siindex-speak-core.js),
 *    public bridge, privacy meter and visitor assist are loaded by the page exactly once, as before.
 *  - It never starts the microphone by itself: only a tap does.
 *
 * STATE (read from the core's siindex:status / siindex:message events; nothing is invented)
 *  - html.si-vo-more : set after the first spoken turn is answered; the page's normal controls return.
 *  - html.si-vo-type : set when the mic cannot be used (error, "type" hint from the core, or no
 *    recording support); only the text box comes back, so nobody is locked out.
 *  - The privacy pill ([data-si-privacy], js/siindex-privacy-meter.js) is untouched. This file only
 *    shows the last answer as a caption; it makes no requests and keeps no storage.
 *  - "remember that…" and "visually explain this" (js/siindex-visitor-assist.js) work when spoken
 *    because spoken text reaches the core's ask(), where the assist claims it. They have no buttons.
 */
(function () {
  "use strict";
  if (window.SIINDEX_VOICE_ONLY) return;
  var script = document.currentScript;
  var page = script && script.getAttribute("data-si-page");
  if (!page) return;

  var CFG = {
    "public-home": { mic: "#publicMic", source: "public-home" },
    "speak": { mic: "#mic", source: "speak-guided", out: "#out" },
    "interview": { mic: "#mic", source: "interview", out: "#out" },
    "jarvis": { mic: "#mic", source: "jarvis", out: "#out" },
    "present": { mic: null, source: "present", out: "#out" },
    "faq": { mic: null, source: "faq", out: "#out" },
    "coconut-till": { mic: null, source: "coconut-till", out: null }
  };
  var cfg = CFG[page];
  if (!cfg) return;

  var root = document.documentElement;
  root.classList.add("si-vo");
  root.setAttribute("data-si-vo", page);

  var state = "idle";
  var tapped = false;
  var els = {};

  function V() { return window.SIINDEXVoice || null; }
  function setType(on) { root.classList.toggle("si-vo-type", !!on); }

  var LABEL = {
    idle: "Tap to speak",
    listening: "Listening… tap when done",
    thinking: "Thinking…",
    speaking: "Tap to stop"
  };
  var HINT = "Tap once, then speak. SIINDEX answers out loud.";

  function paint() {
    var key = LABEL[state] ? state : "idle";
    els.mic.setAttribute("data-state", key);
    els.lbl.textContent = LABEL[key];
    els.mic.setAttribute("aria-label", key === "idle" ? "Tap to speak to SIINDEX" : LABEL[key]);
  }

  function say(text) { els.status.textContent = text || HINT; }

  function onTap() {
    var core = V();
    if (state === "thinking") return;
    if (state === "speaking" && core && core.interrupt) { core.interrupt(); return; }
    if (!core) { setType(true); say("Voice is not available on this page right now."); return; }
    tapped = true;
    var own = cfg.mic ? document.querySelector(cfg.mic) : null;
    if (own) own.click();
    else if (core.listen) core.listen({ source: cfg.source });
  }

  function build() {
    var slot = document.getElementById("siVoSlot");
    if (!slot || slot.firstChild) return;
    slot.className = "si-vo-stage";
    slot.setAttribute("role", "region");
    slot.setAttribute("aria-label", "Speak to SIINDEX");

    var title = document.createElement("p");
    title.className = "si-vo-title";
    title.textContent = "Speak with SIINDEX";

    var mic = document.createElement("button");
    mic.type = "button";
    mic.id = "siVoMic";
    mic.className = "si-vo-mic";
    var ico = document.createElement("span");
    ico.className = "si-vo-ico";
    ico.setAttribute("aria-hidden", "true");
    ico.textContent = "🎙";
    var lbl = document.createElement("span");
    lbl.className = "si-vo-lbl";
    mic.appendChild(ico);
    mic.appendChild(lbl);

    var status = document.createElement("p");
    status.className = "si-vo-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    var caption = document.createElement("div");
    caption.className = "si-vo-caption";
    caption.setAttribute("aria-live", "polite");
    caption.hidden = true;
    var you = document.createElement("p");
    you.className = "si-vo-you";
    var si = document.createElement("p");
    si.className = "si-vo-si";
    caption.appendChild(you);
    caption.appendChild(si);

    slot.appendChild(title);
    slot.appendChild(mic);
    slot.appendChild(status);
    slot.appendChild(caption);
    els = { mic: mic, lbl: lbl, status: status, caption: caption, you: you, si: si };
    mic.addEventListener("click", onTap);
    paint();
    say();

    // No way to record at all: bring the text box back instead of leaving a dead button.
    var canRecognise = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    var canRecord = !!(navigator.mediaDevices && window.MediaRecorder);
    if (!canRecognise && !canRecord) { setType(true); say("This browser cannot record your voice. You can type below."); }
  }

  window.addEventListener("siindex:status", function (ev) {
    if (!els.mic) return;
    var d = (ev && ev.detail) || {};
    var s = d.state;
    state = s === "listening" || s === "thinking" || s === "speaking" ? s : "idle";
    paint();
    var text = String(d.text || "");
    say(s === "ready" || s === "idle" && /^ready\.?$/i.test(text) ? "" : text);
    if (s === "error" || /\btype\b/i.test(text)) setType(true);
  });

  window.addEventListener("siindex:message", function (ev) {
    if (!els.mic) return;
    var d = (ev && ev.detail) || {};
    var text = String(d.text || "").replace(/\s+/g, " ").trim();
    if (!text) return;
    if (d.role === "user") {
      els.you.textContent = "You said: " + text.slice(0, 300);
      els.si.textContent = "";
      els.caption.hidden = false;
    } else if (d.role === "si" || d.role === "assistant") {
      els.si.textContent = "SIINDEX: " + text.slice(0, 700);
      els.caption.hidden = false;
      if (cfg.out) {
        var out = document.querySelector(cfg.out);
        if (out) out.textContent = text;
      }
      if (tapped) root.classList.add("si-vo-more");
    }
  });

  function boot() { build(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();

  window.SIINDEX_VOICE_ONLY = { version: "1.0.0", page: page, state: function () { return state; } };
})();
