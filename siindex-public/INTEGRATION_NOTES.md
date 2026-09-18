# Integration notes — public knowledge → Visitor Mode

**Branch:** `siindex/pre-launch-phase-a`  
**Updated:** 2026-08-08

## Preferred script order

```html
<script src="/js/siindex-public-knowledge.js"></script>
<script src="/siindex-speak-core.js"></script>
<script src="/js/siindex-public-bridge.js"></script>
```

## Drop-in boot (any page that already has speak-core)

```html
<script src="/js/siindex-public-boot.js"></script>
```

Loads knowledge + bridge automatically. Speak-core should still be present on the page.

## Behaviour

1. `SIINDEX_PUBLIC.answer(q)` holds living public facts (SI not AI, brand, legal registrant in progress, status, Cook Islands, $0.24 reference, 98/2 doctrine).
2. Bridge patches `SIINDEXVoice.ask` so matching identity/status questions answer **locally** from that knowledge.
3. Other questions still go to the existing website runtime (Anthropic + ElevenLabs with consent).
4. Sub-agents = SI sub-agents — never described as AI.

## Pages already wired on this branch

- `public-home.html` — full three-script order + utility directory link + “Are you AI?” chip
- `speak-to-siindex.html` — pre-launch banner + local public Q&A
- `siindex-public/utility-directory.html` — status board

## Pages to add boot line (Codex / next pass)

- `index.html`
- `home-v3.html`
- `siindex.html`
- `siindex-chat.html`

One line: `<script src="/js/siindex-public-boot.js"></script>` near existing speak-core.

## Accept tests

1. Ask “Are you AI?” → SI / PQSI, not AI.
2. Ask “What is IN$DEX?” → pre-launch honest summary.
3. Ask “Company name?” → Imagination Index Limited, registration in progress.
4. Ask “$0.24?” → genesis reference only.
5. Non-matching questions still use remote runtime when consent + network allow.
6. Utility directory shows Live / Testing / Planned / Paused badges.
