# needs-aj — Approval packet (P1.1)

**Status:** Active format for SIINDEX → AJ  
**Channels:** email · phone · text · in-app  
**Law:** Automated swarm prepares; **AJ must approve** before gated actions run

Aligns with `siindex-m2m/policy.mjs` ALWAYS_AJ and `OPERATING_CHARTER.md`.

---

## When status becomes `needs-aj`

Any of: `publish`, `contact_citizens`, `move_funds`, `issue_identity`, `legal_commit`, `ops.deploy`, `ops.secret_write`, plus any action AJ adds later (e.g. free domain live issuance, official gov outreach).

---

## Packet fields (required)

| Field | Meaning |
|-------|--------|
| `request_id` | Unique id (e.g. `aj-req-20260818-001`) |
| `job_id` | M2M job id if any |
| `from` | Always `SIINDEX` (or named sub-agent under her) |
| `to` | `AJ_Henry` |
| `action` | Exact gated action (from ALWAYS_AJ or stated) |
| `summary` | One plain sentence — Mama Noe clear |
| `why` | Why this advances IN$DEX / Cook Islands path |
| `sources` | second brain / white paper / memory / living knowledge refs |
| `artifacts` | Paths or links to drafts (script, video, research) |
| `risks` | What could go wrong if approved or denied |
| `not_claiming` | Explicit: not inventing live wallets/payments/licences |
| `channel_preference` | email / sms / phone / in_app |
| `proceed_window` | e.g. `once` · `24h` · `until 2026-12-06` |
| `reply_codes` | What AJ can answer |

### Reply codes (AJ)

| Code | Meaning |
|------|--------|
| `PROCEED` | Authorize this action once |
| `PROCEED_UNTIL <ISO-date>` | Authorize until date |
| `PROCEED_WINDOW <hours>` | Authorize for N hours |
| `HOLD` | Pause — swarm keeps package, does not execute |
| `REJECT` | Do not execute; log reason if given |
| `REVISE` | Swarm must change package and re-request |

---

## Notification body (copy template)

```
SIINDEX → AJ — needs approval
ID: {request_id}
Action: {action}
Summary: {summary}
Why: {why}
Sources: {sources}
Artifacts: {artifacts}
Risks: {risks}
Not claiming: {not_claiming}
Window requested: {proceed_window}

Reply: PROCEED | PROCEED_UNTIL <date> | PROCEED_WINDOW <hours> | HOLD | REJECT | REVISE
```

---

## Machine JSON

See `siindex-m2m/templates/needs-aj-request.json`.

After AJ replies, set job `aj_authorized: true` (or mandate) only for the scoped action and window — then swarm continues continuous loop.
