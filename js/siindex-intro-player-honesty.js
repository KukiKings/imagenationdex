/**
 * SIINDEX intro honesty — only for pages that do NOT already own the Syn-dex player.
 * Homepage public-home.html embeds the full muted + TTS intro; do not double-bind.
 */
(function () {
  "use strict";
  if (window.__SIINDEX_INTRO_SYNDEX__) return;

  // Homepage already ships clearStaleWorkers + INTRO_SPOKEN — skip to avoid freeze/fights
  function homepageOwnsPlayer() {
    try {
      var scripts = document.getElementsByTagName("script");
      for (var i = 0; i < scripts.length; i++) {
        var txt = scripts[i].textContent || "";
        if (txt.indexOf("INTRO_SPOKEN") !== -1 || txt.indexOf("clearStaleWorkers") !== -1) {
          return true;
        }
      }
    } catch (_) {}
    return false;
  }

  if (homepageOwnsPlayer()) {
    window.__SIINDEX_INTRO_SYNDEX__ = true;
    return;
  }

  window.__SIINDEX_INTRO_SYNDEX__ = true;

  function fixTranscriptDom() {
    var p = document.querySelector("#introTranscript p");
    if (p) {
      p.textContent = p.textContent
        .replace(/My name is SIINDEX/gi, "My name is Syn-dex")
        .replace(/\bSIINDEX\b/g, "Syn-dex");
    }
    var tr = document.querySelector("#introTranscript summary");
    if (tr) tr.textContent = "Introduction transcript (spoken as Syn-dex)";
  }

  function run() {
    fixTranscriptDom();
    var video = document.getElementById("introVideo");
    if (video) {
      try {
        video.muted = true;
        video.defaultMuted = true;
        video.setAttribute("muted", "");
      } catch (_) {}
    }
    var status = document.getElementById("introStatusLine");
    if (status && /JARVIS|lip-synced/i.test(status.textContent || "")) {
      status.textContent = "SIINDEX · present · spoken as Syn-dex";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
  window.addEventListener("siindex:public-boot-ready", run);
})();
