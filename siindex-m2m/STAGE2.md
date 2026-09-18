# SIINDEX Media Draft Fleet — Stage 2

**Status:** Scaffold runnable on local file queue  
**Publication:** **Not included** — chain stops after Media QA + evidence + verify  
**Coordinator:** SIINDEX  

## Chain

```
media_director
  → policy_gate
  → knowledge
  → script
  → fact_verifier
  → content_atomizer
  → media_qa
  → evidence
  → verify
```

No `publication` agent in this chain.

## Agents added

| Agent | Role |
|-------|------|
| `media_director` | Plan formats, audience, must-include / must-exclude |
| `script` | 60s Sinn-dex honest intro draft |
| `fact_verifier` | Ban invented live claims; require key markers |
| `content_atomizer` | FAQ, social, email, KB atoms from one script |
| `media_qa` | Package QA; `publication_allowed: false` |

## Local run

```bash
cd siindex-m2m
node runner.mjs run   # with job-stage2-media-draft-001 in queue/
node runner.mjs status
```

## Hard rules

- Classification always `internal_draft`
- Pronunciation: **Sinn-dex** only
- Live boundaries: Visitor Mode yes; wallets/payments/onboarding no
- Genesis **$0.24** reference only
- Pilot date = target not guarantee
- No publish without AJ or campaign mandate

## Next (Stage 3 — not started)

Outreach drafts + reply triage only. Send still needs AJ/mandate.
