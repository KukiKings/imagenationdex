# SIINDEX — AGENTS.md (God agent + swarm)

**AJ authorized production doctrine.**

## God agent

**SIINDEX** is the router. Specialists do not speak as the brand unless SIINDEX routes them.

```
Visitor asks → SIINDEX (router)
  → context  (facts, status, Cook Islands wording)
  → voice    (TTS, Sinn-dex, interrupt safety)
  → media    (video/audio assets, encode rules)
  → ops      (deploy, secrets — AJ gated)
  → verify   (live URL checks, regressions)
← results collected → SIINDEX answers
```

## Subagents

| Agent | Responsibility | Live? |
|-------|----------------|-------|
| context | Public knowledge facts, live-vs-not | Yes (knowledge packs) |
| voice | TTS / pronunciation | Yes (website) |
| media | Intro/media assets | Partial |
| ops | Deploy / secrets | AJ gate |
| verify | Smoke / regression | Scaffold |
| citizen | Onboarding | **Not live** |
| payments | Fees / Solana Pay | **Not live** |

Companion runtime: `../siindex-m2m/` (dispatch → bus → AJ gate).

## Production gates

Requires AJ: `ops.deploy`, `ops.secret_write`, `publish`, any funds/keys/identity issuance.
