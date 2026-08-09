/**
 * SIINDEX pronunciation canon for TTS.
 * "Syn-dex" and "Sin-dex" are often read as "Sign-dex" by ElevenLabs.
 * "Sinn-dex" targets /sɪn/ as in synthetic.
 */
(function () {
  "use strict";
  function fix(text) {
    return String(text || "")
      .replace(/SIINDEX/gi, "Sinn-dex")
      .replace(/\bSyn-dex\b/gi, "Sinn-dex")
      .replace(/\bSin-dex\b/gi, "Sinn-dex")
      .replace(/\bSign-dex\b/gi, "Sinn-dex")
      .replace(/\bSighn-dex\b/gi, "Sinn-dex");
  }
  function patch() {
    const v = window.SIINDEXVoice;
    if (!v || v.__pronunciationCanon === "Sinn-dex") return;
    const original = v.speak && v.speak.bind(v);
    if (!original) return;
    v.speak = function (text) {
      return original(fix(text));
    };
    v.__pronunciationCanon = "Sinn-dex";
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", patch);
  } else {
    patch();
  }
  window.addEventListener("siindex:ready", patch);
  window.addEventListener("siindex:public-boot-ready", patch);
  setTimeout(patch, 0);
  setTimeout(patch, 500);
  setTimeout(patch, 1500);
})();
