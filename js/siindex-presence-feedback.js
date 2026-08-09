/**
 * SIINDEX presence + feedback (AJ production 2026-08-10)
 * - Plays web-safe CDN loop for living visual (not the 16MB talk MP4)
 * - Thumbs feedback on SI replies → localStorage siindex_feedback_v1
 */
(function () {
  "use strict";
  if (window.__SIINDEX_PRESENCE_FB__) return;
  window.__SIINDEX_PRESENCE_FB__ = true;

  var PRESENCE_SRC = "/videos/siindex-04-meditation-loop.mp4?v=presence-20260810";

  function wireVideo() {
    var video = document.getElementById("introVideo");
    var source = document.getElementById("introSpeakSource");
    if (!video) return;
    try {
      if (source) source.setAttribute("src", PRESENCE_SRC);
      video.setAttribute("preload", "metadata");
      video.muted = true;
      video.defaultMuted = true;
      video.loop = true;
      video.playsInline = true;
      video.load();
    } catch (e) {}

    // Hook presence: when speaking status, try play; on pause status, pause video
    window.addEventListener("siindex:status", function (ev) {
      var st = (ev.detail && ev.detail.state) || "";
      if (st === "speaking") {
        try {
          video.muted = true;
          video.loop = true;
          var card = video.closest(".video-card");
          if (card) card.classList.add("is-playing");
          var p = video.play();
          if (p && p.catch) p.catch(function () {});
        } catch (e) {}
      }
      if (st === "idle" || st === "ready" || st === "Paused.") {
        try {
          video.pause();
          var card2 = video.closest(".video-card");
          if (card2 && !document.getElementById("introStatusLine")?.textContent?.includes("speaking"))
            card2.classList.remove("is-playing");
        } catch (e) {}
      }
    });

    // Also patch startPresenceVisual if homepage defines it later
    var tries = 0;
    var t = setInterval(function () {
      tries += 1;
      if (tries > 20) {
        clearInterval(t);
        return;
      }
      // Force intro button path to play presence video
      var btn = document.getElementById("videoButton");
      if (!btn || btn.getAttribute("data-presence-wired") === "1") return;
      btn.setAttribute("data-presence-wired", "1");
      btn.addEventListener(
        "click",
        function () {
          setTimeout(function () {
            try {
              video.muted = true;
              video.loop = true;
              var card = video.closest(".video-card");
              if (card) card.classList.add("is-playing");
              video.play().catch(function () {});
            } catch (e) {}
          }, 50);
        },
        true,
      );
      clearInterval(t);
    }, 200);
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
