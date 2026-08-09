/**
 * Feedback thumbs only — video play owned by siindex-intro-sync.js
 * Does NOT change intro source.
 */
(function () {
  "use strict";
  if (window.__SIINDEX_PRESENCE_FB__) return;
  window.__SIINDEX_PRESENCE_FB__ = true;

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

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wireFeedback);
  else wireFeedback();
})();
