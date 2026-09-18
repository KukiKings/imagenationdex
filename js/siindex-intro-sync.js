/**
 * SIINDEX intro — SYNC/TTS OVERLAY OFF (AJ request)
 * Play original video with its own audio. No clock-lock, no TTS replace.
 */
(function () {
  "use strict";
  if (window.__SIINDEX_INTRO_SYNC__) return;
  window.__SIINDEX_INTRO_SYNC__ = true;

  var ORIGINAL = "/videos/siindex-01-name-intro.mp4?v=smooth-20260809";
  var gen = 0;
  var playing = false;

  function videoEl() {
    return document.getElementById("introVideo");
  }
  function sourceEl() {
    return document.getElementById("introSpeakSource");
  }
  function btnEl() {
    return document.getElementById("videoButton");
  }
  function statusLine() {
    return document.getElementById("introStatusLine");
  }
  function setStatus(t) {
    var el = statusLine();
    if (el) el.textContent = t;
  }

  function ensureSource() {
    var v = videoEl();
    var s = sourceEl();
    if (!v) return;
    try {
      if (s) {
        var cur = s.getAttribute("src") || "";
        if (cur.indexOf("siindex-01-name-intro") === -1) {
          s.setAttribute("src", ORIGINAL);
          v.load();
        }
      }
      // Native audio ON
      v.muted = false;
      v.defaultMuted = false;
      v.removeAttribute("muted");
      v.loop = false;
      v.playsInline = true;
    } catch (e) {}
  }

  function stop() {
    gen += 1;
    playing = false;
    var v = videoEl();
    if (v) {
      try {
        v.pause();
      } catch (e) {}
      var card = v.closest(".video-card");
      if (card) card.classList.remove("is-playing");
    }
    try {
      if (window.SIINDEXVoice && window.SIINDEXVoice.interrupt) {
        window.SIINDEXVoice.interrupt("", false);
      }
    } catch (e) {}
    try {
      if (window.speechSynthesis) speechSynthesis.cancel();
    } catch (e) {}
    var b = btnEl();
    if (b) b.textContent = "▶ Play introduction";
    setStatus("SIINDEX · paused");
  }

  function playNative() {
    ensureSource();
    var v = videoEl();
    if (!v) return;
    stop();
    var myGen = gen;
    playing = true;
    setStatus("SIINDEX · playing introduction");
    var b = btnEl();
    if (b) b.textContent = "❚❚ Pause introduction";
    var card = v.closest(".video-card");
    if (card) card.classList.add("is-playing");

    try {
      v.muted = false;
      v.defaultMuted = false;
      v.removeAttribute("muted");
      if (v.currentTime > 0.05) v.currentTime = 0;
      var p = v.play();
      if (p && p.catch) {
        p.catch(function () {
          // Autoplay with sound blocked — retry muted then unmute on gesture already happened
          try {
            v.muted = true;
            v.play().then(function () {
              v.muted = false;
            }).catch(function () {});
          } catch (e) {}
        });
      }
    } catch (e) {}

    v.onended = function () {
      if (myGen !== gen) return;
      playing = false;
      if (card) card.classList.remove("is-playing");
      if (b) b.textContent = "▶ Play introduction";
      setStatus("SIINDEX · ready — ask by voice or text");
    };
  }

  function wireButton() {
    var btn = btnEl();
    if (!btn || btn.getAttribute("data-sync-wired") === "1") return false;
    btn.setAttribute("data-sync-wired", "1");
    btn.addEventListener(
      "click",
      function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        if (playing) {
          stop();
          return;
        }
        playNative();
      },
      true,
    );
    return true;
  }

  function boot() {
    ensureSource();
    var n = 0;
    var t = setInterval(function () {
      n += 1;
      if (wireButton() || n > 40) clearInterval(t);
    }, 100);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.SIINDEXIntroSync = { play: playNative, stop: stop, overlay: false };
})();
