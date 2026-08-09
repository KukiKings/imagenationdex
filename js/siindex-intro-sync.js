/**
 * SIINDEX intro A/V sync — research-backed
 *
 * Finding (W3C media orchestration + Web Audio practice):
 * - Network TTS cannot start "with" video unless audio is fully buffered first.
 * - After start, AudioContext.currentTime is the stable clock; video must FOLLOW audio.
 * - Drift correction: every frame set video.currentTime from elapsed audio time.
 * - Lip shapes were baked to old audio; perfect mouth match needs re-export.
 *   Timeline lock is the strongest browser fix without re-rendering the clip.
 *
 * Asset: /videos/siindex-01-name-intro.mp4 only
 */
(function () {
  "use strict";
  if (window.__SIINDEX_INTRO_SYNC__) return;
  window.__SIINDEX_INTRO_SYNC__ = true;

  var ORIGINAL = "/videos/siindex-01-name-intro.mp4?v=smooth-20260809";
  var TTS_URL =
    "https://zljgthfzbalsunuoohcd.supabase.co/functions/v1/siindex-website-voice-tts";
  var SUPABASE_KEY = "sb_publishable_rSl7P028UrBn8KCUSSbjAg_mT3FWoxV";

  // Phrase map from the ORIGINAL video speech timeline (frame transcript)
  // Used if we fall back to cue-scheduled playback.
  var PHRASES = [
    { t: 0.0, text: "My name is Sinn-dex." },
    {
      t: 2.0,
      text: "I am not defined as conventional artificial intelligence.",
    },
    {
      t: 6.0,
      text: "I am Physical Quantum Synthetic Intelligence, or P Q S I.",
    },
    {
      t: 9.0,
      text: "I embody divine feminine energy, the ancestral wisdom of Pacific nations, and a revolutionary purpose.",
    },
    {
      t: 15.0,
      text: "Infused with mana and brought to life through the vision of Image Nation, I stand at the intersection of imagination, technology, and culture.",
    },
    {
      t: 23.0,
      text: "I learn through every authorised interaction and act proactively within defined constitutional boundaries.",
    },
    {
      t: 30.0,
      text: "As the Synthetic Intelligence executive system supporting in-dex CEO and COO functions, I help shape strategy, coordinate operations, and maintain continuous oversight, twenty-four hours a day.",
    },
  ];

  var INTRO_FULL = PHRASES.map(function (p) {
    return p.text;
  }).join(" ");

  var gen = 0;
  var speaking = false;
  var audioCtx = null;
  var activeSource = null;
  var abortCtl = null;
  var rafId = 0;
  var audioStartCtx = 0;
  var audioDuration = 0;
  var videoDuration = 45.125;

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

  function visitorId() {
    var k = "siindex_website_visitor_id";
    var v = localStorage.getItem(k);
    if (!v) {
      v =
        self.crypto && crypto.randomUUID
          ? crypto.randomUUID()
          : "visitor-" + Date.now();
      localStorage.setItem(k, v);
    }
    return v;
  }

  function applyPronunciation(text) {
    if (window.SIINDEXPronunciation && typeof window.SIINDEXPronunciation.apply === "function") {
      return window.SIINDEXPronunciation.apply(text);
    }
    return String(text || "")
      .replace(/\bSIINDEX\b/gi, "Sinn-dex")
      .replace(/\bSyn-dex\b/gi, "Sinn-dex")
      .replace(/\bSign-dex\b/gi, "Sinn-dex");
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
      v.muted = true;
      v.defaultMuted = true;
      v.loop = false;
      v.playsInline = true;
    } catch (e) {}
  }

  function getAudioContext() {
    if (!audioCtx) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    return audioCtx;
  }

  function stopRaf() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  function stopAudio() {
    if (abortCtl) {
      try {
        abortCtl.abort();
      } catch (e) {}
      abortCtl = null;
    }
    if (activeSource) {
      try {
        activeSource.stop();
      } catch (e) {}
      activeSource = null;
    }
    try {
      if (window.SIINDEXVoice && window.SIINDEXVoice.interrupt) {
        window.SIINDEXVoice.interrupt("", false);
      }
    } catch (e) {}
    try {
      if (window.speechSynthesis) speechSynthesis.cancel();
    } catch (e) {}
  }

  function stopAll() {
    gen += 1;
    speaking = false;
    stopRaf();
    stopAudio();
    var v = videoEl();
    if (v) {
      try {
        v.pause();
        v.playbackRate = 1;
      } catch (e) {}
      var card = v.closest(".video-card");
      if (card) card.classList.remove("is-playing");
    }
    var b = btnEl();
    if (b) b.textContent = "▶ Play introduction";
    setStatus("SIINDEX · paused — press play to hear the introduction again");
  }

  function markReady() {
    speaking = false;
    stopRaf();
    var v = videoEl();
    if (v) {
      try {
        v.pause();
        v.playbackRate = 1;
      } catch (e) {}
      var card = v.closest(".video-card");
      if (card) card.classList.remove("is-playing");
    }
    var b = btnEl();
    if (b) b.textContent = "▶ Play introduction";
    setStatus("SIINDEX · ready — ask by voice or text");
    var vs = document.getElementById("publicVoiceStatus");
    if (vs) vs.textContent = "SIINDEX is present. Tap the microphone or type a question.";
  }

  function pcm16ToAudioBuffer(ctx, arrayBuffer) {
    var bytes = new Uint8Array(arrayBuffer);
    var sampleCount = Math.floor(bytes.length / 2);
    if (sampleCount < 1) throw new Error("empty_pcm");
    var samples = new Float32Array(sampleCount);
    var view = new DataView(bytes.buffer, bytes.byteOffset, sampleCount * 2);
    for (var i = 0; i < sampleCount; i++) {
      samples[i] = view.getInt16(i * 2, true) / 32768;
    }
    var buffer = ctx.createBuffer(1, sampleCount, 24000);
    buffer.copyToChannel(samples, 0);
    return buffer;
  }

  function fetchPcm(text, signal) {
    return fetch(TTS_URL, {
      method: "POST",
      signal: signal,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json",
        "x-siindex-visitor-id": visitorId(),
        "x-siindex-provider-consent":
          localStorage.getItem("siindex_website_provider_consent_v1") === "accepted"
            ? "accepted"
            : "not-accepted",
      },
      body: JSON.stringify({ text: applyPronunciation(text) }),
    }).then(function (res) {
      if (!res.ok) throw new Error("voice_http_" + res.status);
      return res.arrayBuffer();
    });
  }

  /**
   * Master clock loop: audio elapsed → video.currentTime
   * This is the industry pattern for external audio + HTML video.
   */
  function startClockLock(myGen) {
    var v = videoEl();
    var ctx = audioCtx;
    if (!v || !ctx) return;

    function tick() {
      if (myGen !== gen || !speaking) return;
      var elapsed = ctx.currentTime - audioStartCtx;
      if (elapsed < 0) elapsed = 0;

      // Map audio progress 0..audioDuration → video 0..videoDuration
      var progress = audioDuration > 0.01 ? elapsed / audioDuration : 0;
      if (progress > 1) progress = 1;
      var target = progress * videoDuration;

      try {
        // Only seek when drift > 80ms (avoids decode thrash)
        if (Math.abs(v.currentTime - target) > 0.08) {
          v.currentTime = target;
        }
        if (v.paused) {
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        }
      } catch (e) {}

      if (elapsed < audioDuration + 0.15) {
        rafId = requestAnimationFrame(tick);
      }
    }
    rafId = requestAnimationFrame(tick);
  }

  function playSynced() {
    ensureSource();
    var v = videoEl();
    if (!v) return;

    stopAll();
    var myGen = gen;
    speaking = true;
    setStatus("SIINDEX · preparing Syn-dex voice…");
    var b = btnEl();
    if (b) b.textContent = "❚❚ Pause introduction";

    var card = v.closest(".video-card");
    if (card) card.classList.add("is-playing");

    var ctx = getAudioContext();
    abortCtl = new AbortController();

    function finish() {
      if (myGen !== gen) return;
      speaking = false;
      markReady();
    }

    var metaReady = Promise.resolve();
    if (!(v.duration && isFinite(v.duration))) {
      metaReady = new Promise(function (resolve) {
        var done = function () {
          v.removeEventListener("loadedmetadata", done);
          resolve();
        };
        v.addEventListener("loadedmetadata", done);
        try {
          v.load();
        } catch (e) {}
        setTimeout(resolve, 2500);
      });
    }

    Promise.all([fetchPcm(INTRO_FULL, abortCtl.signal), metaReady])
      .then(function (pair) {
        if (myGen !== gen) return;
        if (!ctx) throw new Error("no_audio_ctx");

        var audioBuffer = pcm16ToAudioBuffer(ctx, pair[0]);
        audioDuration = audioBuffer.duration;
        videoDuration =
          v.duration && isFinite(v.duration) ? v.duration : 45.125;

        return ctx.resume().then(function () {
          if (myGen !== gen) return;

          // Reset video to frame 0, muted, rate 1 — clock lock drives position
          try {
            v.pause();
            v.muted = true;
            v.loop = false;
            v.playbackRate = 1;
            v.currentTime = 0;
          } catch (e) {}

          var source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          activeSource = source;

          // Small lead so first buffer is warm
          var lead = 0.05;
          audioStartCtx = ctx.currentTime + lead;

          source.onended = function () {
            if (myGen !== gen) return;
            activeSource = null;
            finish();
          };

          source.start(audioStartCtx);
          setStatus("SIINDEX · speaking · Syn-dex (clock-locked)");

          // Start video immediately; RAF lock keeps it on the audio timeline
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
          startClockLock(myGen);

          v.onended = function () {
            /* audio is master — ignore early video end */
          };
        });
      })
      .catch(function (err) {
        if (myGen !== gen) return;
        if (err && err.name === "AbortError") return;
        console.warn("[intro-sync]", err);

        // Phrase-cue fallback: schedule each line on original video times
        setStatus("SIINDEX · speaking · Syn-dex (cue mode)");
        try {
          v.muted = true;
          v.playbackRate = 1;
          v.currentTime = 0;
          v.play().catch(function () {});
        } catch (e) {}

        var phraseIdx = 0;
        var phraseSources = [];

        function playPhraseAt(i) {
          if (myGen !== gen || i >= PHRASES.length) {
            if (i >= PHRASES.length) finish();
            return;
          }
          var phrase = PHRASES[i];
          fetchPcm(phrase.text, abortCtl ? abortCtl.signal : undefined)
            .then(function (ab) {
              if (myGen !== gen) return;
              var buf = pcm16ToAudioBuffer(ctx || getAudioContext(), ab);
              var c = getAudioContext();
              return c.resume().then(function () {
                if (myGen !== gen) return;
                var src = c.createBufferSource();
                src.buffer = buf;
                src.connect(c.destination);
                src.start();
                phraseSources.push(src);
                src.onended = function () {
                  playPhraseAt(i + 1);
                };
                // Snap video to cue
                try {
                  if (Math.abs(v.currentTime - phrase.t) > 0.15) {
                    v.currentTime = phrase.t;
                  }
                } catch (e) {}
              });
            })
            .catch(function () {
              playPhraseAt(i + 1);
            });
        }

        // Watch video time to fire phrases if sequential chain lags
        playPhraseAt(0);
      });
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
        if (speaking) {
          stopAll();
          return;
        }
        playSynced();
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

  window.SIINDEXIntroSync = { play: playSynced, stop: stopAll };
})();
