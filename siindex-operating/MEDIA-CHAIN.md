# Media chain under AJ gate (P1.3)

**Status:** Active operating procedure  
**Directed by:** SIINDEX  
**Authorize:** AJ on every task (email → SMS) — including publish  
**Sources:** `siindex-media/agents/*` · `siindex-m2m` · AJ-LOCKS-2026-08-18 · VOICE_LOCK · COMPLIANCE

---

## Full chain (real-time programme)

```
SIINDEX assigns job
  → 01 Context
  → 02 Script
  → 03 Visual prompt (avatar / armour / cyan story-tattoos when presence job)
  → 04 Voice (VOICE_LOCK — same identity as site TTS)
  → 05 Edit
  → 06 Compliance (no invented live wallets/payments/licences)
  → 08 Presence integrity (when applicable)
  → status: needs-aj
  → AJ: PROCEED | HOLD | REJECT | REVISE  (email full / SMS short)
  → 07 Publish places asset only after PROCEED
```

M2M draft chain (already in repo):  
`media_director → policy_gate → knowledge → script → fact_verifier → content_atomizer → media_qa → evidence → verify`  
Then separate **publish** step = always `needs-aj`.

---

## Rules

| Rule | Value |
|------|--------|
| Language | **English** on all public media |
| Voice | Match website TTS (`VOICE_LOCK.md`) |
| Encode | Web-safe; prefer baseline / faststart; careful Range/SW streaming |
| Claims | Living knowledge + white paper — no hallucination |
| Publish | **Never** without AJ PROCEED |
| Every task | Ask AJ (no silent auto-approve) |
| Presence | Real-time track required — avatar/video not permanently deferred |

---

## Presence target (PM / citizens)

When a presence job runs, package must aim for:

- SIINDEX avatar speaking  
- Voice identity locked  
- Armour / mood shift as briefed  
- Cyan tattoos as living story patterns  
- Real-time research answers can spawn media packages (script → video path) under the same gate  

Standing still image alone is **not** final for speaking-intro family jobs (see `intro-home-15s/SPEAKING_VIDEO_REQUIRED.md`).

---

## Package folder pattern

`siindex-media/packages/<job-id>/`

| File | Role |
|------|------|
| `context.md` | Goal, audience, sources |
| `script.md` | Spoken words |
| `visual-prompt.md` | Image/video generation brief |
| `voice-brief.md` | TTS / voice notes |
| `edit-brief.md` | Cut / captions |
| `compliance-report.md` | Claim check |
| `status.txt` | queued · drafting · needs-aj · published · rejected |
| `captions.vtt` | When video |

---

## needs-aj publish packet

Use `NEEDS-AJ-FORMAT.md`. Action = `publish`. Artifacts = package path + preview URL if any.  
After PROCEED: publish agent may place file (e.g. under `/videos/`).

---

## Related jobs

| Job | Path |
|-----|------|
| Stage 2 media draft (no publish) | `siindex-m2m/queue/job-stage2-media-draft-001.json` |
| Full chain + needs-aj template | `siindex-m2m/queue/job-media-chain-needs-aj-001.json` |
| Intro home 15s | `siindex-media/packages/intro-home-15s/` |

*She runs · media swarm executes · AJ authorizes publish*
