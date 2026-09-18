# SIINDEX Media Swarm

**Purpose:** Produce SIINDEX videos (intros, interview opens, presentations, explainers) through controlled SI sub-agents.

**Rules:**
- SIINDEX is **Synthetic Intelligence (SI / PQSI)** — never AI
- Always lead with brand **IN$DEX**
- Legal names only when the visitor asks
- No auto-publish — AJ must approve every publish
- Do not claim lip-sync until the approved file is live
- Do not invent licences, live prices, partnerships, or completed registration

## Pipeline

```
Brief → Context → Script → Visual prompt → Voice brief → Captions → Compliance → needs-aj → AJ approve → Publish
```

## Agents (SI sub-agents)

| Agent | Folder |
|-------|--------|
| Context | `agents/01-context.md` |
| Script | `agents/02-script.md` |
| Prompt | `agents/03-prompt.md` |
| Voice | `agents/04-voice.md` |
| Edit / lip-sync brief | `agents/05-edit.md` |
| Compliance | `agents/06-compliance.md` |
| Publish | `agents/07-publish.md` |

## Queue

See `queue/QUEUE.md`. Status values: `draft` · `in-progress` · `needs-aj` · `approved` · `published` · `blocked`

## First job

`packages/intro-home-15s/` — home introduction with voice + lip-sync **target** (not claimed live until published).

## Who picks work

Codex / Claude / Grok: read `queue/QUEUE.md`, take the top `draft` or `in-progress` job, update status, leave notes in the package `status.txt`.
