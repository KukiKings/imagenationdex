# Codex / next agent

**Branch:** `siindex/pre-launch-phase-a`  
**Do not merge to production without AJ.**

## Highest priority: speak-core auto-boot

Append to the end of `siindex-speak-core.js` (after the final `})();`):

```js

/* Phase A — auto-load public knowledge stack (brand-first IN$DEX, SI not AI). */
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

This wires every page that already loads speak-core.

## Already on branch

- Living knowledge + brand-first rules
- `js/siindex-public-knowledge.js` / bridge (self-load) / boot / page-context
- `speak-to-siindex.html`, `siindex-interview.html`
- Utility directory (30 sections)
- Cook Islands Q&A seeds

## Speech rules

- Always **IN$DEX** first
- Legal stack only when asked: Image Nation DEX → Decentralized Exchange → Image Nation DEx Limited
- SI / PQSI — never AI
