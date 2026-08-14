# M2M job + result schema (Stage 1)

## Local file job (`siindex-m2m/queue/*.json`)

```json
{
  "id": "job-stage1-demo-001",
  "directed_by": "SIINDEX",
  "type": "stage1-demo-draft-chain",
  "priority": 1,
  "status": "queued",
  "chain": ["knowledge", "policy_gate", "evidence", "verify"],
  "step_index": 0,
  "payload": {},
  "envelope": {
    "allowed_actions": ["read_knowledge", "check_policy", "write_evidence", "verify_draft"],
    "prohibited_actions": ["publish", "contact_citizens", "move_funds", "issue_identity", "legal_commit"]
  },
  "requires_aj_for": ["ops.deploy", "ops.secret_write", "publish"],
  "aj_authorized": false,
  "created_at": "ISO-8601"
}
```

## Status values

- `queued` — waiting for first agent
- `running` — agent in progress
- `awaiting_next` — step done, pickup pending
- `needs-aj` / `needs_aj` — production gate
- `blocked` — infrastructure gap
- `done` — chain complete
- `failed` — agent error
- `expired` — past expires_at

## Result (bus)

```json
{
  "job_id": "job-stage1-demo-001",
  "agent": "knowledge",
  "ok": true,
  "summary": "…",
  "artifacts": [],
  "payload_update": {},
  "next_hint": "policy_gate",
  "blocked_reason": null,
  "needs_aj": false,
  "at": "ISO-8601"
}
```

## Supabase tables (after migration)

- `campaign_mandates`
- `agent_tasks`
- `agent_messages`
- `agent_evidence`
- `agent_audit`

## Policy

See `policy.mjs`. Always-AJ actions cannot run without `aj_authorized` or active mandate.
