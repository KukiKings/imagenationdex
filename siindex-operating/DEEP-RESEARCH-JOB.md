# Deep-research job template (P1.2)

**Status:** Active  
**Rule:** Every material question from government, citizens, family, unbanked triggers this path  
**Law:** Deep research always · no hallucination · sources first · SIINDEX assigns swarm · AJ if gated output

---

## Chain (default)

```
knowledge → policy_gate → evidence → fact_verifier → verify
  → [optional] script → media  (if video/avatar answer requested)
  → needs-aj if publish / contact / formal gov delivery
```

## Payload fields

| Field | Meaning |
|-------|--------|
| `question` | Exact question asked |
| `askers` | `government` · `citizen` · `family` · `unbanked` · `aj` · `other` |
| `jurisdiction_focus` | e.g. Cook Islands, Pacific, general |
| `must_check` | living knowledge, white paper, second brain, current policy year |
| `forbidden` | invent licences, live prices, live wallets/payments, AUSTRAC path |
| `output` | `answer_draft` · `brief` · `video_package` · `all` |

## Answer quality bar

1. Prefer rank order in `SOURCE_OF_TRUTH.md`.  
2. If unknown → say unknown + what was checked.  
3. Update year/policy context when research finds change.  
4. Public speech must match living knowledge until AJ expands it.  

## Example job

`siindex-m2m/queue/job-deep-research-template-001.json`

## Continuous loop

Research → draft → test claims against sources → SI↔swarm handoff → fix gaps → if external: **needs-aj**.
