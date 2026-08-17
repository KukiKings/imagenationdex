/**
 * SIINDEX intro — native video first, voice fallback.
 * Pronunciation: Sin-dex. Does not claim lip-sync.
 * Video: /videos/siindex-01-name-intro.mp4 (multi-frame + audio; play on user gesture).
 */
(function () {
  "use strict";
  if (window.__SIINDEX_INTRO_NATIVE__) return;
  window.__SIINDEX_INTRO_NATIVE__ = true;

  var video = document.getElementById("introVideo");
  var introStatusLine = document.getElementById("introStatusLine");
  var INTRO_SPOKEN =
    "Kia orana. I am Sin-dex — Synthetic Intelligence for in-dex. " +
    "I am your guide to what is live, what is planned, and what stays paused. " +
    "Ask me anything about in-dex. I speak clearly. I do not invent approvals or live prices.";

  var introSpeaking = false;
  var introGeneration = 0;

  function setIntroStatus(text) {
    if (introStatusLine) introStatusLine.textContent = text;
  }

  function stopIntroSpeech() {
    introGeneration += 1;
    introSpeaking = false;
    try {
      if (window.SIINDEXVoice && typeof window.SIINDEXVoice.interrupt === "function") {
        window.SIINDEXVoice.interrupt("Introduction paused.", false);
      }
    } catch (e) {}
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } catch (e) {}
    if (video) {
      try {
        video.pause();
      } catch (e) {}
      var card = video.closest(".video-card");
      if (card) card.classList.remove("is-playing");
    }
  }

  function markReadyForConversation() {
    introSpeaking = false;
    setIntroStatus("SIINDEX · ready — ask by voice or text");
    var status = document.getElementById("publicVoiceStatus");
    if (status) status.textContent = "SIINDEX is present. Tap the microphone or type a question.";
    var videoButton = document.getElementById("videoButton");
    if (videoButton) videoButton.textContent = "▶ Play introduction";
    if (video) {
      var card = video.closest(".video-card");
      if (card) card.classList.remove("is-playing");
    }
  }

  function playVoiceFallback() {
    var gen = introGeneration;
    introSpeaking = true;
    setIntroStatus("SIINDEX · speaking · Sin-dex (voice)");
    var videoButton = document.getElementById("videoButton");
    if (videoButton) videoButton.textContent = "❚❚ Pause introduction";
    var card = video && video.closest(".video-card");
    if (card) card.classList.add("is-playing");

    var finish = function () {
      if (gen !== introGeneration) return;
      introSpeaking = false;
      markReadyForConversation();
    };

    if (window.SIINDEXVoice && typeof window.SIINDEXVoice.speak === "function") {
      Promise.resolve(window.SIINDEXVoice.speak(INTRO_SPOKEN))
        .catch(function () {})
        .then(finish);
      return true;
    }
    if (window.speechSynthesis) {
      var u = new SpeechSynthesisUtterance(INTRO_SPOKEN);
      u.lang = "en-US";
      u.rate = 0.94;
      u.pitch = 1.03;
      u.onend = finish;
      u.onerror = finish;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
      return true;
    }
    finish();
    return false;
  }

  function playNativeIntro() {
    stopIntroSpeech();
    if (!video) {
      playVoiceFallback();
      return;
    }
    var gen = introGeneration;
    introSpeaking = true;
    setIntroStatus("SIINDEX · introduction · Sin-dex");
    var videoButton = document.getElementById("videoButton");
    if (videoButton) videoButton.textContent = "❚❚ Pause introduction";
    var card = video.closest(".video-card");
    if (card) card.classList.add("is-playing");

    try {
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.playsInline = true;
      video.muted = false;
      video.defaultMuted = false;
      video.removeAttribute("muted");
      if (typeof video.load === "function") {
        /* keep current source; seek to start */
      }
      video.currentTime = 0;
    } catch (e) {}

    var onEnded = function () {
      if (gen !== introGeneration) return;
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
      markReadyForConversation();
    };
    var onError = function () {
      if (gen !== introGeneration) return;
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
      setIntroStatus("SIINDEX · video error — using voice");
      playVoiceFallback();
    };
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);

    var p = video.play();
    if (p && typeof p.then === "function") {
      p.then(function () {
        setIntroStatus("SIINDEX · playing introduction · Sin-dex");
      }).catch(function () {
        video.removeEventListener("ended", onEnded);
        video.removeEventListener("error", onError);
        /* Unmuted autoplay blocked — try muted then unmute, else voice */
        try {
          video.muted = true;
          var p2 = video.play();
          if (p2 && p2.then) {
            p2.then(function () {
              setIntroStatus("SIINDEX · playing (tap for sound if muted) · Sin-dex");
              try {
                video.muted = false;
              } catch (e2) {}
            }).catch(function () {
              playVoiceFallback();
            });
            return;
          }
        } catch (e3) {}
        playVoiceFallback();
      });
    }
  }

  function bindIntroButton() {
    var videoButton = document.getElementById("videoButton");
    if (!videoButton) return;
    var clean = videoButton.cloneNode(true);
    videoButton.parentNode.replaceChild(clean, videoButton);
    var btn = document.getElementById("videoButton");
    btn.setAttribute("aria-label", "Play or pause SIINDEX introduction");
    btn.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      if (introSpeaking) {
        stopIntroSpeech();
        markReadyForConversation();
        setIntroStatus("SIINDEX · paused — press play to hear the introduction again");
        return;
      }
      playNativeIntro();
    });
  }

  if (video) {
    try {
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.playsInline = true;
      video.preload = "metadata";
    } catch (e) {}
  }

  bindIntroButton();
  setIntroStatus("SIINDEX · present · spoken as Sin-dex · press Play for introduction");
})();
