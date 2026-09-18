/**
 * Feedback thumbs — local buffer + optional remote aggregate.
 * Video play owned by siindex-intro-sync.js. Does NOT change intro source.
 * Version: 1.1.1 | Task-4 dual-write harden 2026-08-16
 *
 * localStorage key: siindex_feedback_v1 (device buffer, last 100)
 * Remote: POST /functions/v1/siindex-visitor-feedback (best-effort)
 * Requires Authorization Bearer + apikey (Supabase gateway JWT check).
 */
(function () {
  "use strict";
  if (window.__SIINDEX_PRESENCE_FB__) return;
  window.__SIINDEX_PRESENCE_FB__ = true;

  var LOCAL_KEY = "siindex_feedback_v1";
  // Public anon key (same as indx-db.js). Safe to expose; RLS blocks anon read/write.
  var FALLBACK_ANON =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA";

  function anonKey() {
    return (
      window.SIINDEX_SUPABASE_ANON_KEY ||
      window.__SIINDEX_SUPABASE_ANON_KEY ||
      FALLBACK_ANON
    );
  }

  function supabaseFunctionsBase() {
    if (window.SIINDEX_SUPABASE_URL) {
      return String(window.SIINDEX_SUPABASE_URL).replace(/\/$/, "") + "/functions/v1/siindex-visitor-feedback";
    }
    if (window.__SIINDEX_SUPABASE_URL) {
      return String(window.__SIINDEX_SUPABASE_URL).replace(/\/$/, "") + "/functions/v1/siindex-visitor-feedback";
    }
    return "https://zljgthfzbalsunuoohcd.supabase.co/functions/v1/siindex-visitor-feedback";
  }

  function knowledgeVersion() {
    try {
      if (window.SIINDEX_PUBLIC && window.SIINDEX_PUBLIC.version) {
        return String(window.SIINDEX_PUBLIC.version);
      }
    } catch (_) {}
    return null;
  }

  function saveLocal(vote, text) {
    try {
      var arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
      arr.push({
        t: Date.now(),
        vote: vote,
        text: text,
        page: location.pathname,
        knowledge_version: knowledgeVersion(),
        synced: false,
      });
      localStorage.setItem(LOCAL_KEY, JSON.stringify(arr.slice(-100)));
      return arr[arr.length - 1];
    } catch (e) {
      return { t: Date.now(), vote: vote, text: text, synced: false };
    }
  }

  function markSynced(ts) {
    try {
      var arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
      for (var i = 0; i < arr.length; i++) {
        if (arr[i].t === ts) arr[i].synced = true;
      }
      localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
    } catch (_) {}
  }

  function postRemote(entry) {
    var url = supabaseFunctionsBase();
    var key = anonKey();
    var payload = {
      vote: entry.vote,
      text: entry.text || "",
      page: entry.page || location.pathname,
      knowledge_version: entry.knowledge_version || knowledgeVersion(),
      source: "presence-thumbs",
    };
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: "Bearer " + key,
      },
      body: JSON.stringify(payload),
      mode: "cors",
      credentials: "omit",
      keepalive: true,
    })
      .then(function (res) {
        if (res.ok) markSynced(entry.t);
        return res.ok;
      })
      .catch(function () {
        return false;
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
            var entry = saveLocal(vote, text);
            postRemote(entry);
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
