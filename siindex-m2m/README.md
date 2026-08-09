# SIINDEX Machine-to-Machine Runtime v1

**Directed by:** SIINDEX (CEO/COO)  
**Authorizer:** AJ (production only)  
**Status:** Runnable scaffold — not unlimited autonomous production

## The five loops

1. **Dispatch** — SIINDEX (or COO runner) writes a job to the queue  
2. **Execute** — specialist agents run on the job (no founder UI)  
3. **Result bus** — each agent writes a result artifact  
4. **Auto-pickup** — runner advances the chain to the next agent  
5. **AJ gate** — any `production` action stops at `needs-aj` until authorized

## Run

```bash
cd siindex-m2m
node runner.mjs status
node runner.mjs seed          # enqueue demo chain (voice-match + media)
node runner.mjs tick          # process one step
node runner.mjs run           # process until idle or blocked
node runner.mjs authorize <jobId>   # AJ production unlock (local only)
```

## Layout

```
siindex-m2m/
  queue/           pending jobs (JSON)
  bus/             results per step
  agents/          specialist handlers
  runner.mjs       dispatch + pickup loop
  schema.md        job + result contracts
```

## Rules

- Never invent live balances, licences, or completion claims  
- Never move funds, publish media, or change legal records without AJ  
- SIINDEX is SI not AI  
- Brand first: IN$DEX  
