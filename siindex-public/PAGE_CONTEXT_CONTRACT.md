# Page-Context Contract (Pre-launch)

**Purpose:** Every public section tells SIINDEX what is true on that page.  
**Status:** Living · Phase A  
**Updated:** 2026-08-08

---

## Contract shape (inject per page)

```json
{
  "page_id": "string-kebab-case",
  "title": "Human title",
  "status": "Live | Testing | Planned | Paused | Pre-launch",
  "summary": "One plain sentence what this section is",
  "what_works_today": ["..."],
  "what_is_locked": ["..."],
  "siindex_can": ["explain", "guide", "answer-from-living-knowledge"],
  "siindex_cannot": ["move-funds", "open-account", "issue-identity", "publish"],
  "interview_hooks": ["short prompts a visitor or official might ask"],
  "last_reviewed": "YYYY-MM-DD"
}
```

---

## Status meanings (no “demo” label)

| status | Citizen meaning |
|--------|------------------|
| Live | Usable today |
| Testing | In build / private test — not finished public service |
| Planned | On the roadmap — not usable yet |
| Paused | Held for approval or reconciliation |
| Pre-launch | Section exists for orientation while the programme is pre-launch |

---

## Minimum pages to wire in Phase A

1. Home / welcome  
2. What is IN$DEX  
3. SIINDEX presence  
4. Status board (Live / Testing / Planned / Paused)  
5. Cook Islands / founder story  
6. Utility directory (index of major sections with badges)  
7. Onboarding (Tier 0) — status Testing/Planned until complete  
8. Token / INDX status — honest pause wording  

Each utility in the directory gets the same contract fields even if status is Planned.

---

## SIINDEX behaviour

1. Read page context first.  
2. Answer from Living Knowledge Source v1.  
3. Never upgrade a Planned/Testing item to Live in speech.  
4. If page context and knowledge source conflict — flag conflict; do not invent a third story.
