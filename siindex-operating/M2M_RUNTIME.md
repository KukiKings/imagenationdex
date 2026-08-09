# Machine-to-machine runtime

**Path:** `siindex-m2m/`  
**Version:** 1  
**Directed by:** SIINDEX

## Integrated?

| Loop | v1 |
|------|----|
| 1 Dispatch | Yes — `runner.mjs seed` writes jobs |
| 2 Execute | Yes — agents under `siindex-m2m/agents/` |
| 3 Result bus | Yes — `siindex-m2m/bus/` |
| 4 Auto-pickup | Yes — `runner.mjs tick|run` advances chain |
| 5 AJ production gate | Yes — `needs-aj` until `authorize` |

## Not yet

- Continuous always-on daemon in production hosting  
- Live Supabase/ElevenLabs calls from agents without secrets  
- Autonomous publish / treasury / identity  

## First job on the bus

`job-voice-match-001` — Path A exact intro = chat voice  
Chain: context → voice → ops → verify  
Ops correctly **needs-aj / blocked** until deploy credentials exist.
