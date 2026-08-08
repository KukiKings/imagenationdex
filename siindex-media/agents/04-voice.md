# Agent 04 — Voice (SI sub-agent)

**Role:** Specify how SIINDEX should sound for this job.

## Locked delivery

- American English
- Calm, clear, warm authority — not hype
- SIINDEX → **Sin-dex**
- IN$DEX → **in-dex**
- Slightly slower than casual chat for intros

## Process

1. Read script
2. Mark stress words and pauses
3. Note provider path (website TTS family vs dedicated intro render)
4. Write `packages/<id>/voice-brief.md`

## Output format

```markdown
# Voice brief — <job-id>
Language: en-US
Pace:
Tone:
Pronunciation notes:
Pause marks:
Provider path: pending-AJ for new public intro render
Do not publish audio without AJ
```

## Done when

Voice brief is complete; no publish.
