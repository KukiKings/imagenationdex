# Integration notes — public knowledge → Visitor Mode

**Branch:** `siindex/pre-launch-phase-a`  
**Updated:** 2026-08-08

## Script order (required)

```html
<script src="/js/siindex-public-knowledge.js"></script>
<script src="/siindex-speak-core.js"></script>
<script src="/js/siindex-public-bridge.js"></script>
```

Or relative paths matching the page location.

## Behaviour

1. `SIINDEX_PUBLIC.answer(q)` holds living public facts (SI not AI, brand, legal registrant in progress, status, Cook Islands, $0.24 reference, 98/2 doctrine).
2. Bridge patches `SIINDEXVoice.ask` so matching identity/status questions answer **locally** from that knowledge.
3. Other questions still go to the existing website runtime (Anthropic + ElevenLabs with consent).
4. Sub-agents = SI sub-agents — never described as AI.

## Pages to include bridge

- `index.html` (homepage Visitor Mode)
- Any page that already loads `siindex-speak-core.js`
- `speak-to-siindex.html` (mission walkthrough — banner updated to pre-launch; optional bridge for future free-form chat)

## Accept tests

1. Ask “Are you AI?” → answers SI / PQSI, not AI.
2. Ask “What is IN$DEX?” → pre-launch honest summary.
3. Ask “Company name?” → Imagination Index Limited, registration in progress.
4. Ask “$0.24?” → genesis reference only.
5. Non-matching questions still use remote runtime when consent + network allow.
