# needs-aj — Approval packet (P1.1)

**Status:** Active format for SIINDEX → AJ  
**Law:** Automated swarm prepares; **AJ must approve** before work proceeds

Aligns with `siindex-m2m/policy.mjs` and `OPERATING_CHARTER.md`.

---

## Auto-approve window (AJ 2026-08-18)

| Rule | Value |
|------|--------|
| Silent auto-approve classes | **None** |
| Internal drafts only | **Still ask** |
| Default | **Yes — ask. AJ approves.** |

Every task path **asks** AJ. There is **no** class of work that runs without a per-task ask. Swarm may prepare continuously; **proceed only after AJ approval** (email / SMS primary).

---

## Channel priority (AJ — quick response)

| Order | Channel | Role |
|-------|---------|------|
| **1** | **Email** | Primary — full packet |
| **2** | **SMS** | Fast alert — short summary + request id + reply codes |
| 3 | Phone | Optional escalate |
| 4 | In-app | When operator/console is open |

**Default `channel_preference`:** `["email", "sms"]`

---

## When status becomes `needs-aj`

**All tasks** that advance the operation request approval. Hard gates always include: `publish`, `contact_citizens`, `move_funds`, `issue_identity`, `legal_commit`, `ops.deploy`, `ops.secret_write`, free domain issuance, official outreach — and **any other task** under the every-task-asks rule.

---

## Packet fields (required)

| Field | Meaning |
|-------|--------|
| `request_id` | Unique id |
| `job_id` | M2M job id if any |
| `from` | `SIINDEX` (or sub-agent under her) |
| `to` | `AJ_Henry` |
| `action` | What needs proceed |
| `summary` | One plain sentence |
| `why` | Why this advances IN$DEX / Cook Islands path |
| `sources` | second brain / white paper / memory / living knowledge |
| `artifacts` | Draft paths |
| `risks` | What could go wrong |
| `not_claiming` | No invented live wallets/payments/licences |
| `channel_preference` | **email then SMS** |
| `proceed_window` | only after AJ sets it via reply |

### Reply codes (AJ)

| Code | Meaning |
|------|--------|
| `PROCEED` | Authorize this action once |
| `PROCEED_UNTIL <ISO-date>` | Authorize until date |
| `PROCEED_WINDOW <hours>` | Authorize for N hours |
| `HOLD` | Pause — do not execute |
| `REJECT` | Do not execute |
| `REVISE` | Swarm changes package and asks again |

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

*She runs · every task asks · AJ approves · email first · SMS second*
