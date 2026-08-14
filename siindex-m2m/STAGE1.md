# SIINDEX Agent Bus — Stage 1

**Status:** Scaffold in repo. Apply migration + deploy Edge Functions before production use.  
**Coordinator:** SIINDEX  
**Public voice:** SIINDEX only  
**External actions:** needs AJ or active `campaign_mandates` row

## What Stage 1 includes

| Piece | Path |
|-------|------|
| Postgres bus | `supabase/migrations/20260814_siindex_agent_bus_v1.sql` |
| Policy gate | `siindex-m2m/policy.mjs` |
| Envelope | `siindex-m2m/envelope.mjs` |
| Agents | `knowledge`, `policy_gate`, `evidence` (+ existing voice/ops/verify/media/context) |
| Dispatch | `supabase/functions/siindex-agent-dispatch` |
| Claim | `supabase/functions/siindex-agent-claim` |
| Complete | `supabase/functions/siindex-agent-complete` |
| Local demo job | `siindex-m2m/queue/job-stage1-demo-001.json` |

## Local demo (file queue — no Supabase required)

```bash
cd siindex-m2m
node runner.mjs status
# ensure job-stage1-demo-001.json is in queue/
node runner.mjs tick   # knowledge
node runner.mjs tick   # policy_gate
node runner.mjs tick   # evidence
node runner.mjs tick   # verify
node runner.mjs status
```

## Supabase apply (AJ / ops)

1. Run migration `20260814_siindex_agent_bus_v1.sql` on project `zljgthfzbalsunuoohcd`.
2. Deploy three Edge Functions (service role only).
3. Optional secret: `SIINDEX_AGENT_WORKER_SECRET` for non-service workers.
4. Dispatch internal tasks via `siindex-agent-dispatch` with service role — never from the public website.

## Hard bans (always AJ unless authorized)

- publish  
- contact_citizens  
- move_funds  
- issue_identity  
- legal_commit  
- ops.deploy  
- ops.secret_write  

## Not in Stage 1

- Media publication fleet  
- Email send  
- Partnership bind  
- Fifty autonomous loops  
- Public website calling the agent bus  

## Next (Stage 2)

Media Director → Script → Fact Verifier → draft assets → Media QA → stop before Publication.
