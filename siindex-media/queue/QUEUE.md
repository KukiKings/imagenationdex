# SIINDEX Media Queue

**How to pick a job (Codex / Claude / Grok):**

1. Read this file
2. Take the highest-priority row with status `draft` or `in-progress` that is not assigned
3. Set status to `in-progress` and put your agent name in `packages/<id>/status.txt`
4. Work only inside that package + shared `agents/` + `COMPLIANCE.md`
5. When package is complete and compliance checked → status `needs-aj`
6. **Stop.** Do not publish. AJ moves `needs-aj` → `approved` → `published`

## Priority order

| Priority | Job ID | Title | Status | Owner |
|----------|--------|-------|--------|-------|
| 1 | `intro-home-15s` | Home introduction 15s (voice + lip-sync target) | approved | Grok (AJ approved production) |
| 2 | `interview-open-15s` | Interview Mode open | draft | — |
| 3 | `present-open-20s` | Presentation Mode open | draft | — |
| 4 | `status-live-30s` | What is live today explainer | draft | — |

## Status meanings

| Status | Meaning |
|--------|---------|
| `draft` | Package shell exists or is empty; work not started |
| `in-progress` | An agent is filling context/script/prompts |
| `needs-aj` | Compliance passed; waiting for AJ |
| `approved` | AJ approved production/publish |
| `published` | Live on site paths listed in package |
| `blocked` | Missing asset, decision, or compliance fail |

## Assignment rule

One job, one owner at a time. Note blockers in `packages/<id>/status.txt`.
