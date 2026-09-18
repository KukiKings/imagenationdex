/**
 * Intro player honesty — ORIGINAL siindex-01 only.
 * Does not replace source. Homepage owns play; this is a no-op when homepage patched.
 */
(function () {
  "use strict";
  if (window.__SIINDEX_INTRO_HONESTY__) return;
  window.__SIINDEX_INTRO_HONESTY__ = true;

  // Homepage public-home already binds the intro button with TTS + original video.
  // Do not swap media. Do not clone buttons if homepage already set data-orig-presence / inline handlers.
  var video = document.getElementById("introVideo");
  var source = document.getElementById("introSpeakSource");
  if (video && source) {
    try {
      var src = source.getAttribute("src") || "";
      if (src.indexOf("siindex-01-name-intro") === -1) {
        source.setAttribute("src", "/videos/siindex-01-name-intro.mp4?v=smooth-20260809");
        video.load();
      }
      video.muted = true;
      video.loop = false;
    } catch (e) {}
  }
})();
