# Agent 01 — Context (SI sub-agent)

**Role:** Build the allowed-fact pack for one video job.

## Inputs

- Job ID and mode (home intro, interview, present, FAQ, utility)
- `siindex-public/LIVING_KNOWLEDGE_SOURCE_v1.md` (if present)
- `siindex-media/COMPLIANCE.md`

## Process

1. List **allowed** public facts for this mode
2. List **forbidden** claims (licences, live prices, completed registration, AI wording)
3. Note duration target and audience (public / government / media)
4. Write `packages/<id>/context.md`

## Output format (`context.md`)

```markdown
# Context — <job-id>
Audience:
Mode:
Duration target:
Allowed facts:
- ...
Forbidden:
- ...
Must lead with: IN$DEX
SIINDEX identity: Synthetic Intelligence / PQSI — not AI
```

## Done when

`context.md` exists and contains no forbidden claims.
