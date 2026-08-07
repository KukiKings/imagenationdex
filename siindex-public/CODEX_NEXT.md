# Codex / next agent — universal public knowledge

**Branch:** `siindex/pre-launch-phase-a`  
**Do not merge to production without AJ.**

## Preferred: append to `siindex-speak-core.js`

After the final line `emit("ready", { mode: "website", version: "3.0.0" });` and the closing `})();`, append:

```js

/* Phase A — auto-load public knowledge stack (brand-first IN$DEX, SI not AI).
 * Runs on every page that includes siindex-speak-core.js.
 */
(function siindexPublicAutoBoot() {
  if (typeof window === "undefined" || window.__SIINDEX_PUBLIC_BOOT__) return;
  try {
    var s = document.createElement("script");
    s.src = "/js/siindex-public-boot.js";
    s.async = true;
    s.onerror = function () {
      var s2 = document.createElement("script");
      s2.src = "js/siindex-public-boot.js";
      s2.async = true;
      document.head.appendChild(s2);
    };
    document.head.appendChild(s);
  } catch (e) {
    console.warn("[SIINDEX] public boot inject failed", e);
  }
})();
```

That wires **all** pages that already load speak-core (index, home-v3, siindex, siindex-chat, etc.).

## Alternative: one line on each HTML page

```html
<script src="/js/siindex-public-boot.js"></script>
```

After `siindex-speak-core.js`.

## Already live on branch

- `js/siindex-public-knowledge.js` — brand-first answers
- `js/siindex-public-bridge.js` — **self-loads** knowledge + page-context if missing, then patches `ask`
- `js/siindex-public-boot.js` — loads knowledge → context → bridge
- `js/siindex-page-context.js` + `page-context-map.json`
- `speak-to-siindex.html` + compact `public-home.html`

## Speech rules

- Always **IN$DEX** first
- Legal stack only when asked: Image Nation DEX → Image Nation Decentralized Exchange → Image Nation DEx Limited
- SI / PQSI — never AI
