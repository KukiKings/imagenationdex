/**
 * siindex-visitor-assist.js: on-device visual + memory layer for SIINDEX Visitor Mode.
 * Loaded only on public-home.html and speak-to-siindex.html. Information only: it never clicks,
 * submits, opens accounts, moves money or issues identity. It makes NO requests of its own.
 *
 * EVALUATION (inspired by the "Romey / Javas" on-screen assistant demo)
 *  - Built here: a plain-DOM "visually explain this" (scroll to and outline the section in view,
 *    or an element the visitor names) and a local "remember that…" note store.
 *  - Deliberately not built: a drawn character, screenshots/vision, draft replies, reminders,
 *    zoom. They need a model, notification permission or a new dependency, which breaks the
 *    "0 external calls" promise. Revisit only behind the existing opt-in voice/consent gates.
 *  - Voice: reuses the existing SIINDEXVoice.speak path (core owns consent and gating). No new
 *    TTS provider is added, so nothing here can switch on Fish Audio or any other voice service.
 *
 * HOW IT PLUGS IN (do not add a second listener or a second wrapper; reuse these two seams)
 *  - siindex-speak-core.js ask() calls SIINDEX_ASSIST.claims(text) then handle(text) right after
 *    ensureProviderConsent(). Mic, typed and chip input all reach ask(), so one seam covers them.
 *  - js/siindex-public-bridge.js and js/siindex-qa-mode.js call claims(text) first and skip their
 *    knowledge shortcuts for claimed text, so "remember that the Cook Islands…" is not
 *    answered as a Cook Islands fact.
 *
 * TRUST SIGNAL (see js/siindex-privacy-meter.js)
 *  - An assisted answer is a siindex:message with role "si", so the pill counts it as an answer
 *    and shows the real number of requests made for it. Local intents make zero requests, but if
 *    voice is on the reply is spoken through the voice endpoint and the pill shows that call.
 *  - Memory text is NEVER sent to the voice endpoint: handle() returns {text, spoken} and
 *    "spoken" is a generic line for memory intents. Keep it that way.
 *  - If the visitor used the mic, handle() says so in the memory confirmation (read from
 *    SIINDEX_PRIVACY.state()): their voice was heard by a browser or server speech service before
 *    this code ever saw the words.
 *
 * STORAGE
 *  - localStorage key "siindex_visitor_memory_v1": {v:1, facts:[{t:string<=200, at:ms}]}, max 20.
 *    Written only by "remember that…", cleared by "forget…". Read only by "what do you remember".
 *    It is not added to any prompt and never leaves the device. Reads and writes are try/caught.
 *  - Refuses notes that look like secrets (passwords, keys, card or ID numbers).
 *
 * VISUAL EXPLAIN
 *  - Reads headings, link/button labels and the first paragraph of a section. Never reads input
 *    values. Outline is applied with element.style (CSSOM), no injected <style>, no inline
 *    handlers, so it keeps working if the CSP drops 'unsafe-inline'. Clears after 6 s or on Esc.
 */
(function () {
  "use strict";
  if (window.SIINDEX_ASSIST) return;

  var MEMORY_KEY = "siindex_visitor_memory_v1";
  var MAX_FACTS = 20;
  var MAX_FACT_LEN = 200;
  var HIGHLIGHT_MS = 6000;

  var SECRET_RE = new RegExp(
    "(?:\\d[ -]?){13,19}|\\b(?:password|passcode|cvv|pin number|seed phrase|recovery phrase|private key|secret key|api key|tax file number|passport number|ssn)\\b|[A-Za-z0-9]{32,}",
    "i"
  );

  var RE_REMEMBER = /^\s*(?:please\s+|hey\s+|ok(?:ay)?\s+)?remember\s+(?:that\s+)?(.{2,})$/i;
  var RE_RECALL = /\bwhat\s+(?:do\s+you|did\s+i)\s+(?:remember|tell\s+you)\b|\bwhat\s+do\s+you\s+know\s+about\s+me\b|^\s*(?:show|list|read)\s+(?:me\s+)?(?:my\s+)?(?:memory|memories|notes)\s*[?.!]*\s*$/i;
  var RE_FORGET_ALL = /^\s*(?:please\s+)?(?:forget|delete|clear|erase)\s+(?:everything|all(?:\s+of\s+it)?|my\s+(?:memory|memories|notes)|what\s+i\s+(?:told|said))\s*[?.!]*\s*$/i;
  var RE_FORGET_LAST = /^\s*(?:please\s+)?(?:forget|delete|erase)\s+(?:that|the\s+last(?:\s+(?:one|thing|note))?)\s*[?.!]*\s*$/i;
  var RE_EXPLAIN_SECTION = /^\s*(?:please\s+|can\s+you\s+|could\s+you\s+)?(?:visually\s+explain|explain|describe|show\s+me)\s+(?:this|that|this\s+section|this\s+part|the\s+section|what(?:'s|\s+is)\s+here)\s*[?.!]*\s*$/i;
  var RE_EXPLAIN_PAGE = /\b(?:what(?:'s|\s+is|\s+are)\s+(?:on\s+)?(?:this|the)\s+(?:page|screen)|what\s+am\s+i\s+looking\s+at|walk\s+me\s+through\s+(?:this|the)\s+page|(?:describe|explain|outline)\s+(?:this|the)\s+page)\b/i;
  // Page-scoped pointing only, so ordinary questions ("where is the Cook Islands?") are not hijacked.
  var RE_FIND = [
    /^\s*(?:please\s+)?(?:visually\s+explain|highlight|point\s+(?:out|to|at))\s+(?:the\s+|a\s+|an\s+)?(.{2,60}?)\s*[?.!]*\s*$/i,
    /^\s*(?:please\s+)?show\s+me\s+(?:the\s+)?(.{2,60}?)\s+on\s+(?:this|the)\s+page\s*[?.!]*\s*$/i,
    /^\s*(?:please\s+)?where\s+(?:is|are)\s+(?:the\s+)?(.{2,60}?)\s+on\s+(?:this|the)\s+page\s*[?.!]*\s*$/i
  ];

  // ---- memory --------------------------------------------------------------------------------
  function loadFacts() {
    try {
      var d = JSON.parse(localStorage.getItem(MEMORY_KEY) || "null");
      return d && d.v === 1 && Array.isArray(d.facts) ? d.facts : [];
    } catch (_) { return []; }
  }
  function saveFacts(facts) {
    try {
      if (!facts.length) localStorage.removeItem(MEMORY_KEY);
      else localStorage.setItem(MEMORY_KEY, JSON.stringify({ v: 1, facts: facts }));
      return true;
    } catch (_) { return false; }
  }
  function micNote() {
    try {
      var s = window.SIINDEX_PRIVACY && window.SIINDEX_PRIVACY.state && window.SIINDEX_PRIVACY.state();
      if (s && (s.mic || (s.calls && s.calls.indexOf("transcribe") !== -1))) {
        return " Note: you used the mic, so a speech service heard these words before this page stored them.";
      }
    } catch (_) {}
    return "";
  }

  // ---- classification (no side effects) --------------------------------------------------------
  function classify(q) {
    q = String(q || "").trim();
    if (!q || q.length > 400) return null;
    var m;
    if ((m = RE_REMEMBER.exec(q))) return { kind: "remember", arg: m[1] };
    if (RE_FORGET_ALL.test(q)) return { kind: "forget-all" };
    if (RE_FORGET_LAST.test(q)) return { kind: "forget-last" };
    if (RE_RECALL.test(q)) return { kind: "recall" };
    if (RE_EXPLAIN_PAGE.test(q)) return { kind: "page" };
    if (RE_EXPLAIN_SECTION.test(q) || /^\s*(?:please\s+)?visually\s+explain\s*[?.!]*\s*$/i.test(q)) return { kind: "section" };
    for (var i = 0; i < RE_FIND.length; i++) {
      if ((m = RE_FIND[i].exec(q))) {
        var term = m[1].replace(/\s+(?:section|part|button|link|heading)$/i, "").trim();
        if (term && findTarget(term)) return { kind: "find", arg: term };
      }
    }
    return null;
  }

  // ---- page inspection (reads visible text only; never input values) ----------------------------
  function visible(el) {
    if (!el || !el.getClientRects || !el.getClientRects().length) return false;
    if (el.closest("[hidden],[aria-hidden='true'],[data-si-privacy]")) return false;
    var cs = window.getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none";
  }
  function clean(s, n) {
    s = String(s || "").replace(/\s+/g, " ").trim();
    return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s;
  }
  function inChat(el) {
    return !!el.closest("#publicMessages,[data-si-messages],#out,#a3,.messages");
  }
  function sectionOf(el) {
    return el.closest("section,article,[role='region'],main") || el.parentElement || document.body;
  }
  function headingText(el) { return clean(el.textContent, 90); }

  function sections() {
    var out = [], seen = [];
    var hs = document.querySelectorAll("h1,h2,h3");
    for (var i = 0; i < hs.length; i++) {
      var h = hs[i];
      if (!visible(h) || inChat(h) || h.closest("header,nav,footer,.chat-panel")) continue;
      var sec = sectionOf(h);
      if (seen.indexOf(sec) !== -1) continue;
      seen.push(sec);
      out.push({ heading: h, section: sec });
    }
    return out;
  }

  function mostInView() {
    var list = sections(), best = null, bestArea = 0, vh = window.innerHeight || 800, vw = window.innerWidth || 1000;
    list.forEach(function (s) {
      var r = s.section.getBoundingClientRect();
      var h = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      var w = Math.min(r.right, vw) - Math.max(r.left, 0);
      var area = h > 0 && w > 0 ? h * w : 0;
      if (area > bestArea) { bestArea = area; best = s; }
    });
    return best || list[0] || null;
  }

  function describeSection(s) {
    var sec = s.section;
    var lead = "";
    var ps = sec.querySelectorAll("p,li");
    for (var i = 0; i < ps.length; i++) {
      if (inChat(ps[i]) || ps[i].closest(".chat-panel,nav,footer") || !visible(ps[i])) continue;
      var t = clean(ps[i].textContent, 220);
      if (t.length > 25) { lead = t; break; }
    }
    var links = 0, buttons = 0, n;
    n = sec.querySelectorAll("a[href]");
    for (i = 0; i < n.length; i++) if (visible(n[i])) links++;
    n = sec.querySelectorAll("button,[role='button']");
    for (i = 0; i < n.length; i++) if (visible(n[i])) buttons++;
    var name = headingText(s.heading);
    var text = "This part of the page is \"" + name + "\"." + (lead ? " " + lead : "") +
      " It has " + links + " link" + (links === 1 ? "" : "s") + " and " + buttons + " button" + (buttons === 1 ? "" : "s") + ".";
    try {
      var P = window.SIINDEX_PAGE;
      if (P && P.map) text += " Page status: " + (P.forPath().status || "Pre-launch") + ".";
    } catch (_) {}
    return { text: text, spoken: "This part of the page is " + name + "." + (lead ? " " + lead : "") };
  }

  function labelOf(el) { return clean(el.getAttribute("aria-label") || el.textContent, 90); }

  function findTarget(term) {
    var t = term.toLowerCase();
    var pool = document.querySelectorAll("h1,h2,h3,h4,summary,a[href],button,[role='button']");
    var exact = null, partial = null;
    for (var i = 0; i < pool.length; i++) {
      var el = pool[i];
      if (inChat(el) || !visible(el)) continue;
      var l = labelOf(el).toLowerCase();
      if (!l) continue;
      if (l === t) { exact = el; break; }
      if (!partial && l.indexOf(t) !== -1) partial = el;
    }
    return exact || partial;
  }

  function describeElement(el) {
    var name = labelOf(el), tag = el.tagName.toLowerCase(), text, spoken;
    if (/^h[1-4]$/.test(tag)) return describeSection({ heading: el, section: sectionOf(el) });
    if (tag === "a") {
      var where = "another page";
      try {
        var u = new URL(el.getAttribute("href"), location.href);
        where = u.origin === location.origin ? "another page on this site (" + u.pathname + ")" : "an outside site (" + u.hostname + ")";
        if (u.protocol === "mailto:") where = "an email address";
      } catch (_) {}
      text = "\"" + name + "\" is a link to " + where + ". I highlighted it; I will not open it for you.";
    } else if (tag === "summary") {
      text = "\"" + name + "\" opens a short expandable note. I highlighted it.";
    } else {
      text = "\"" + name + "\" is a button. I highlighted it; I will not press it for you.";
    }
    spoken = text;
    return { text: text, spoken: spoken };
  }

  // ---- highlight (CSSOM only) --------------------------------------------------------------------
  var hl = { el: null, prev: null, timer: null };
  function clearHighlight() {
    clearTimeout(hl.timer);
    if (hl.el && hl.prev) {
      hl.el.style.outline = hl.prev.outline;
      hl.el.style.outlineOffset = hl.prev.offset;
    }
    hl.el = null; hl.prev = null;
  }
  function highlight(el) {
    clearHighlight();
    hl.el = el;
    hl.prev = { outline: el.style.outline, offset: el.style.outlineOffset };
    var calm = false;
    try { calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (_) {}
    try { el.scrollIntoView({ block: "center", behavior: calm ? "auto" : "smooth" }); } catch (_) {}
    el.style.outline = "3px solid #00e5a0";
    el.style.outlineOffset = "4px";
    hl.timer = setTimeout(clearHighlight, HIGHLIGHT_MS);
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") clearHighlight(); });

  // ---- handle ------------------------------------------------------------------------------------
  function handle(q) {
    var c = classify(q);
    if (!c) return null;
    var facts, r;
    switch (c.kind) {
      case "remember": {
        var fact = clean(c.arg.replace(/[\s.!]+$/, ""), MAX_FACT_LEN);
        if (SECRET_RE.test(c.arg)) {
          return { text: "I will not keep that. Visitor Mode does not store passwords, keys, card numbers or ID numbers. Nothing was saved.", spoken: "I will not keep that. Nothing was saved." };
        }
        facts = loadFacts().filter(function (f) { return f.t !== fact; });
        facts.push({ t: fact, at: Date.now() });
        if (facts.length > MAX_FACTS) facts = facts.slice(-MAX_FACTS);
        if (!saveFacts(facts)) {
          return { text: "I could not save that: this browser is blocking storage. Nothing was saved.", spoken: "I could not save that. Nothing was saved." };
        }
        return {
          text: "Noted: \"" + fact + "\". Kept on this device only; this page never sends it anywhere. Ask \"what do you remember\" to see it, or say \"forget everything\" to clear it." + micNote(),
          spoken: "Noted. Kept on this device only."
        };
      }
      case "recall": {
        facts = loadFacts();
        if (!facts.length) return { text: "I am not holding any notes from you on this device.", spoken: "I am not holding any notes from you." };
        return {
          text: "Notes kept on this device only: " + facts.map(function (f, i) { return (i + 1) + ") " + f.t; }).join("  "),
          spoken: "Here is what I kept on this device."
        };
      }
      case "forget-all":
        saveFacts([]);
        return { text: "Cleared. Nothing is kept on this device.", spoken: "Cleared. Nothing is kept." };
      case "forget-last":
        facts = loadFacts();
        facts.pop();
        saveFacts(facts);
        return { text: "Removed the last note. " + facts.length + " left on this device.", spoken: "Removed the last note." };
      case "page": {
        var list = sections().slice(0, 8);
        if (!list.length) return { text: "I cannot see any headed sections on this screen.", spoken: "I cannot see any sections here." };
        var names = list.map(function (s) { return headingText(s.heading); });
        return { text: "On this page I can see: " + names.join(" · ") + ". Ask me to \"visually explain this\" or \"highlight\" any of them. I read page text only, not images or video.", spoken: "I can see " + names.length + " sections on this page." };
      }
      case "section": {
        var s = mostInView();
        if (!s) return { text: "I cannot find a headed section in view.", spoken: "I cannot find a section in view." };
        highlight(s.section);
        r = describeSection(s);
        return { text: r.text + " I outlined it for a few seconds.", spoken: r.spoken };
      }
      case "find": {
        var el = findTarget(c.arg);
        if (!el) return { text: "I cannot find \"" + c.arg + "\" on this page.", spoken: "I cannot find that on this page." };
        var isHeading = /^h[1-4]$/i.test(el.tagName);
        highlight(isHeading ? sectionOf(el) : el);
        r = describeElement(el);
        return { text: r.text + (isHeading ? " I outlined it for a few seconds." : ""), spoken: r.spoken };
      }
    }
    return null;
  }

  window.SIINDEX_ASSIST = {
    version: "1.0.0",
    claims: function (q) { try { return classify(q) !== null; } catch (_) { return false; } },
    handle: function (q) { try { return handle(q); } catch (_) { return null; } },
    clearHighlight: clearHighlight,
    memory: { key: MEMORY_KEY, list: function () { return loadFacts().map(function (f) { return f.t; }); } }
  };
})();
