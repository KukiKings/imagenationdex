/**
 * SIINDEX pronunciation canon: Syn-dex (not Sign-dex / Sin-dex / Sighn-dex).
 * Loads after siindex-speak-core.js and wraps speak() without regressing Path A.
 */
(function () {
  "use strict";
  function fix(text) {
    return String(text || "")
      .replace(/SIINDEX/gi, "Syn-dex")
      .replace(/\bSin-dex\b/gi, "Syn-dex")
      .replace(/\bSign-dex\b/gi, "Syn-dex")
      .replace(/\bSighn-dex\b/gi, "Syn-dex");
  }
  function patch() {
    const v = window.SIINDEXVoice;
    if (!v || v.__pronunciationCanon === "Syn-dex") return;
    const original = v.speak && v.speak.bind(v);
    if (!original) return;
    v.speak = function (text) {
      return original(fix(text));
    };
    v.__pronunciationCanon = "Syn-dex";
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", patch);
  } else {
    patch();
  }
  window.addEventListener("siindex:ready", patch);
  setTimeout(patch, 0);
  setTimeout(patch, 500);
})();
