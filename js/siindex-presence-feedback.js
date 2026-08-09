/**
 * SIINDEX presence + feedback
 * ORIGINAL intro only: /videos/siindex-01-name-intro.mp4
 * Never swap to meditation/other clips.
 * Freeze-safe: muted, no loop, no seeks, hold last frame if decode stalls.
 * Audio = website TTS (Syn-dex / Sinn-dex), not baked track.
 */
(function () {
  "use strict";
  if (window.__SIINDEX_PRESENCE_FB__) return;
  window.__SIINDEX_PRESENCE_FB__ = true;

  var ORIGINAL_SRC = "/videos/siindex-01-name-intro.mp4?v=smooth-20260809";

  function ensureOriginalSource(video, source) {
    try {
      var cur = (source && source.getAttribute("src")) || (video && video.currentSrc) || "";
      if (cur.indexOf("siindex-01-name-intro") === -1) {
        if (source) source.setAttribute("src", ORIGINAL_SRC);
        else if (video) video.setAttribute("src", ORIGINAL_SRC);
        video.load();
      }
    } catch (e) {}
  }

  function playOriginalMuted(video) {
    if (!video) return;
    try {
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute("muted", "");
      video.loop = false; // loop on 16MB causes freeze on many devices
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      // Do not seek repeatedly — that stalls H.264
      if (video.readyState >= 2 && video.currentTime > 1 && video.paused) {
        // resume from where we are if already partially played
      } else if (video.currentTime > 0.5 && video.paused && video.ended) {
        try {
          video.currentTime = 0;
        } catch (e) {}
      }
      var card = video.closest(".video-card");
      if (card) card.classList.add("is-playing");
      var p = video.play();
      if (p && p.catch) {
        p.catch(function () {
          // Autoplay blocked or decode fail — keep poster/frame, TTS still runs
        });
      }
    } catch (e) {}
  }

  function wireStallGuard(video) {
    if (!video || video.getAttribute("data-stall-guard") === "1") return;
    video.setAttribute("data-stall-guard", "1");
    var stallTimer = null;
    function onStall() {
      // Hold frame instead of spinning forever
      try {
        video.pause();
      } catch (e) {}
    }
    video.addEventListener("waiting", function () {
      if (stallTimer) clearTimeout(stallTimer);
      stallTimer = setTimeout(onStall, 2500);
    });
    video.addEventListener("playing", function () {
      if (stallTimer) clearTimeout(stallTimer);
    });
    video.addEventListener("stalled", function () {
      if (stallTimer) clearTimeout(stallTimer);
      stallTimer = setTimeout(onStall, 1500);
    });
    // When video ends before TTS finishes, freeze last frame (expected)
    video.addEventListener("ended", function () {
      try {
        video.pause();
      } catch (e) {}
    });
  }

  function wireVideo() {
    var video = document.getElementById("introVideo");
    var source = document.getElementById("introSpeakSource");
    if (!video) return;

    ensureOriginalSource(video, source);
    try {
      video.setAttribute("preload", "metadata");
      video.muted = true;
      video.defaultMuted = true;
      video.loop = false;
      video.playsInline = true;
    } catch (e) {}

    wireStallGuard(video);

    // Intro button: play ORIGINAL muted under TTS
    var tries = 0;
    var t = setInterval(function () {
      tries += 1;
      if (tries > 25) {
        clearInterval(t);
        return;
      }
      var btn = document.getElementById("videoButton");
      if (!btn || btn.getAttribute("data-orig-presence") === "1") return;
      btn.setAttribute("data-orig-presence", "1");
      btn.addEventListener(
        "click",
        function () {
          ensureOriginalSource(video, source);
          setTimeout(function () {
            playOriginalMuted(video);
          }, 30);
        },
        true,
      );
      clearInterval(t);
    }, 150);

    // Optional: if homepage already playing TTS, keep video in sync
    window.addEventListener("siindex:status", function (ev) {
      var st = (ev.detail && ev.detail.state) || "";
      if (st === "speaking") {
        ensureOriginalSource(video, source);
        playOriginalMuted(video);
      }
    });
  }

  function wireFeedback() {
    var box = document.getElementById("publicMessages");
    if (!box || box.getAttribute("data-fb-wired") === "1") return;
    box.setAttribute("data-fb-wired", "1");

    var style = document.createElement("style");
    style.textContent =
      ".siindex-fb{display:flex;gap:6px;margin-top:6px;align-items:center}" +
      ".siindex-fb button{border:1px solid rgba(148,163,255,.18);background:transparent;color:#aab2d4;border-radius:8px;padding:2px 8px;cursor:pointer;font-size:12px}" +
      ".siindex-fb button:hover{color:#00d4ff}" +
      ".siindex-fb[data-done=\"1\"]{opacity:.55;pointer-events:none}";
    document.head.appendChild(style);

    var obs = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (!n || n.nodeType !== 1) return;
          if (!n.classList || !n.classList.contains("message") || !n.classList.contains("si")) return;
          if (n.querySelector(".siindex-fb")) return;
          var text = (n.textContent || "").slice(0, 280);
          var fb = document.createElement("div");
          fb.className = "siindex-fb";
          fb.innerHTML =
            '<span style="font-size:11px;color:#aab2d4">Helpful?</span>' +
            '<button type="button" data-v="up" aria-label="Thumbs up">👍</button>' +
            '<button type="button" data-v="down" aria-label="Thumbs down">👎</button>';
          fb.addEventListener("click", function (ev) {
            var b = ev.target.closest("button");
            if (!b || fb.getAttribute("data-done") === "1") return;
            var vote = b.getAttribute("data-v");
            try {
              var key = "siindex_feedback_v1";
              var arr = JSON.parse(localStorage.getItem(key) || "[]");
              arr.push({ t: Date.now(), vote: vote, text: text });
              localStorage.setItem(key, JSON.stringify(arr.slice(-100)));
            } catch (e) {}
            fb.setAttribute("data-done", "1");
            fb.querySelector("span").textContent =
              vote === "up" ? "Thanks — noted." : "Thanks — we will improve.";
          });
          n.appendChild(fb);
        });
      });
    });
    obs.observe(box, { childList: true });
  }

  function run() {
    wireVideo();
    wireFeedback();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
