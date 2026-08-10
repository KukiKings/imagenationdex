# SIINDEX agent filesystem (EVE / OpenClaw-style)

```
siindex/
├── SOUL.md                 # PRODUCTION identity doctrine
├── AGENTS.md               # God agent + swarm map
├── instructions.md         # load order
├── agent.ts                # config entry
├── skills/                 # what she knows
├── tools/                  # what she can do (scaffold)
├── subagents/              # specialists
├── channels/               # web-chat, voice
├── schedules/              # proactive targets
└── evals/                  # canon checks + feedback
```

**Runtime companions**
- Website: https://imagenationdex.com
- M2M: `../siindex-m2m/`
- Heartbeat: GitHub Action `siindex-m2m-heartbeat.yml`

**Not required for doctrine:** `npx eve init` — EVE is the pattern; files above are the source of truth.
