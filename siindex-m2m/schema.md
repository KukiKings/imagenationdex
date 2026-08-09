# M2M job + result schema

## Job

```json
{
  "id": "job-voice-match-001",
  "directed_by": "SIINDEX",
  "type": "voice-match-path-a",
  "priority": 1,
  "status": "queued",
  "chain": ["context", "voice", "ops", "verify"],
  "step_index": 0,
  "payload": {},
  "requires_aj_for": ["ops.deploy", "ops.secret_write", "publish"],
  "created_at": "ISO-8601"
}
```

## Status values

- `queued` — waiting for first agent  
- `running` — agent in progress  
- `awaiting_next` — step done, pickup pending  
- `needs-aj` — production gate  
- `blocked` — infrastructure gap (document reason)  
- `done` — chain complete  
- `failed` — agent error

## Result (bus)

```json
{
  "job_id": "job-voice-match-001",
  "agent": "voice",
  "ok": true,
  "summary": "IVC sample prepared; setup function ready",
  "artifacts": [],
  "next_hint": "ops",
  "blocked_reason": null,
  "needs_aj": false,
  "at": "ISO-8601"
}
```
