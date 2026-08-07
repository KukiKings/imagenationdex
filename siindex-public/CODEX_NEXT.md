# Codex / next agent — one-line boot

**Branch:** `siindex/pre-launch-phase-a`  
**Do not merge to production without AJ.**

## Add this line once on each page that already loads `siindex-speak-core.js`

```html
<script src="/js/siindex-public-boot.js"></script>
```

Place **after** the speak-core script tag.

### Pages still needing the line

- `index.html`
- `home-v3.html`
- `siindex.html`
- `siindex-chat.html`

### Already done

- `public-home.html` (knowledge + speak-core + bridge)
- `speak-to-siindex.html` (knowledge + boot)

### What boot loads

1. `js/siindex-public-knowledge.js` — brand-first IN$DEX answers, SI not AI  
2. `js/siindex-page-context.js` — Live/Testing/Planned/Paused per route  
3. `js/siindex-public-bridge.js` — local answer for identity/status questions  

### Speech rules (do not break)

- Always lead with **IN$DEX**
- Legal stack only when asked: Image Nation DEX → Image Nation Decentralized Exchange → Image Nation DEx Limited
- SI / PQSI — never AI
- Pre-launch labels — not “demo” product framing
