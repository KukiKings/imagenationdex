/**
 * SIINDEX pronunciation lock for TTS.
 * Display may say Syn-dex; spoken path must be Sinn-dex (/sɪn/ as in synthetic).
 * ElevenLabs often reads Syn-dex / Sin-dex as Sign-dex — block that.
 */
(function () {
  "use strict";

  function apply(text) {
    var t = String(text || "");
    // Phrase-level first (greeting / intro lines)
    t = t.replace(/pronounced\s+Syn-?dex\s+or\s+Sin-?dex/gi, "pronounced Sinn-dex");
    t = t.replace(/pronounced\s+Syn-?dex/gi, "pronounced Sinn-dex");
    t = t.replace(/pronounced\s+Sin-?dex/gi, "pronounced Sinn-dex");
    t = t.replace(/I['']?m\s+SIINDEX/gi, "I'm Sinn-dex");
    t = t.replace(/I\s+am\s+SIINDEX/gi, "I am Sinn-dex");
    t = t.replace(/My\s+name\s+is\s+SIINDEX/gi, "My name is Sinn-dex");
    // Token-level
    t = t.replace(/SIINDEX/gi, "Sinn-dex");
    t = t.replace(/\bSyn[\s-]?dex\b/gi, "Sinn-dex");
    t = t.replace(/\bSin[\s-]?dex\b/gi, "Sinn-dex");
    t = t.replace(/\bSign[\s-]?dex\b/gi, "Sinn-dex");
    t = t.replace(/\bSighn[\s-]?dex\b/gi, "Sinn-dex");
    t = t.replace(/\bSynn?[\s-]?dex\b/gi, "Sinn-dex");
    // Collapse accidental doubles
    t = t.replace(/(Sinn-dex)(\s+\1)+/gi, "$1");
    return t;
  }

  window.SIINDEXPronunciation = {
    phonetic: "Sinn-dex",
    display: "Syn-dex",
    apply: apply,
  };

  function patch() {
    var v = window.SIINDEXVoice;
    if (!v || v.__pronunciationLock === "Sinn-dex") return;
    if (typeof v.speak !== "function") return;
    var original = v.speak.bind(v);
    v.speak = function (text) {
      return original(apply(text));
    };
    v.__pronunciationLock = "Sinn-dex";
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
  setTimeout(patch, 3000);
})();
