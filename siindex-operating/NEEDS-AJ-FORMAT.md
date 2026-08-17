# needs-aj — Approval packet (P1.1)

**Status:** Active format for SIINDEX → AJ  
**Law:** Automated swarm prepares; **AJ must approve** before gated actions run

Aligns with `siindex-m2m/policy.mjs` ALWAYS_AJ and `OPERATING_CHARTER.md`.

---

## Channel priority (AJ 2026-08-18 — quick response)

| Order | Channel | Role |
|-------|---------|------|
| **1** | **Email** | Primary — full packet |
| **2** | **SMS** | Fast alert — short summary + request id + reply codes |
| 3 | Phone | Escalate if no reply on time-critical gates (optional) |
| 4 | In-app | When operator/console is open |

**Default `channel_preference`:** `["email", "sms"]`

SMS body stays short; full detail stays in email.

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
| `action` | Exact gated action |
| `summary` | One plain sentence — Mama Noe clear |
| `why` | Why this advances IN$DEX / Cook Islands path |
| `sources` | second brain / white paper / memory / living knowledge refs |
| `artifacts` | Paths or links to drafts |
| `risks` | What could go wrong |
| `not_claiming` | Not inventing live wallets/payments/licences |
| `channel_preference` | Default **email then SMS** |
| `proceed_window` | e.g. `once` · `24h` · `until 2026-12-06` |

### Reply codes (AJ)

| Code | Meaning |
|------|--------|
| `PROCEED` | Authorize this action once |
| `PROCEED_UNTIL <ISO-date>` | Authorize until date |
| `PROCEED_WINDOW <hours>` | Authorize for N hours |
| `HOLD` | Pause — do not execute |
| `REJECT` | Do not execute |
| `REVISE` | Swarm must change package and re-request |

---

## Email body (full)

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

## SMS body (short)

```
SIINDEX needs-aj {request_id}: {action}. {summary} Reply PROCEED/HOLD/REJECT/REVISE. Full detail in email.
```

---

## Machine JSON

See `siindex-m2m/templates/needs-aj-request.json`.

*She runs · AJ authorizes · email first · SMS second*
