# IN$DEX SOVEREIGN SECOND BRAIN — MASTER PLAN
# SIINDEX Intelligence Architecture v1.0
# Owner: AJ Henry | Date: 2026-07-04
# Status: READY TO DEPLOY

---

## 1. EXECUTIVE SUMMARY

The IN$DEX Sovereign Second Brain is a local-first, AI-powered knowledge and execution system designed to do one thing: help AJ Henry build IN$DEX faster.

It is not a productivity app. It is not another dashboard. It is not a place to store things and forget them.

It is the operating brain of IN$DEX — the system that captures every idea, remembers every decision, turns intelligence into action, and compounds knowledge over time.

**Core outcome:** AJ spends less time managing information and more time building. SIINDEX becomes smarter with every session. IN$DEX ships faster.

**What it delivers:**
- Zero idea loss — everything is captured
- Zero context loss — SIINDEX remembers across sessions
- Zero contamination — AJ's words are never mixed with AI output
- Instant daily clarity — Top 3 actions, surfaced every morning
- Weekly strategic accountability — what moved the business, what didn't

**What it costs to maintain:** 25 minutes per day (15 morning, 10 evening).

---

## 2. SYSTEM PHILOSOPHY

**Two hemispheres. Two rules.**

The system is divided into a HUMAN hemisphere and a MACHINE hemisphere. They never mix.

**HUMAN hemisphere:** Sacred. Contains only AJ's original thoughts. AI reads it, never writes to it without explicit permission. Never summarised, paraphrased, or overwritten.

**MACHINE hemisphere:** AI territory. SIINDEX creates, improves, and organises freely here. All AI outputs are clearly marked as machine-generated.

**The separation matters because:**
- AJ's ideas are irreplaceable. AI outputs are reproducible.
- Mixing them creates confusion about what is original vs. generated.
- The most valuable thing in this system is AJ's authentic thinking, not the AI summaries of it.

**The Intelligence Question:**
Every feature, every file, every workflow must answer yes to at least 3 of:
1. Does this help build IN$DEX faster?
2. Does this help SIINDEX become smarter?
3. Does this help AJ make better decisions?
4. Does this reduce mental load?
5. Does this increase execution speed?
6. Does this preserve AJ's knowledge?

If fewer than 3 are true, remove it.

**Provider-agnostic by design:**
The entire system is Markdown files. It works with Claude, Gemini, Codex, or any future AI. No proprietary formats. No vendor lock-in. AJ owns all of it.

---

## 3. FOLDER STRUCTURE

```
~/second-brain/
│
├── SYSTEM.md                    ← Root agent instruction file (copy to every AI context)
│
├── HUMAN/                       ← Sacred hemisphere — AJ's words only
│   ├── Inbox/                   ← Raw captures, unprocessed — cleared daily
│   ├── Daily-Notes/             ← YYYY-MM-DD-daily-note.md — one per day
│   ├── Tasks/                   ← Active tasks with priority tags
│   ├── Founder-Journal/         ← Long-form reflections
│   ├── INDX-Ideas/              ← Product, business, feature ideas
│   ├── Strategic-Decisions/     ← Key decisions with rationale
│   ├── Meeting-Notes/           ← Raw meeting captures
│   ├── Voice-Notes/             ← Transcriptions of voice memos
│   ├── Vision-Notes/            ← Long-horizon thinking
│   └── Personal-Priorities/     ← Values, goals, non-negotiables
│
├── MACHINE/                     ← AI hemisphere — SIINDEX territory
│   ├── AI-Research/             ← Research summaries, competitor intel
│   ├── Generated-Strategies/    ← Strategy docs produced by SIINDEX
│   ├── Prompt-Library/          ← Reusable prompts for every workflow
│   ├── Workflows/               ← Step-by-step workflow scripts
│   ├── Skills/                  ← Specialised AI skill definitions
│   ├── Reports/                 ← Daily focus, weekly reviews, progress
│   ├── Code-Notes/              ← Architecture notes, technical docs
│   ├── Market-Intelligence/     ← Competitor, market, trend analysis
│   ├── SIINDEX-Memory/          ← Persistent AI session memory
│   ├── System-Logs/             ← Audit trail of AI actions
│   └── Improvement-Suggestions/ ← System upgrade recommendations
│
└── Templates/                   ← File templates (both hemispheres)
    ├── TEMPLATE-daily-note.md
    ├── TEMPLATE-inbox-item.md
    ├── TEMPLATE-task.md
    ├── TEMPLATE-decision.md
    ├── TEMPLATE-journal-entry.md
    ├── TEMPLATE-meeting-notes.md
    ├── TEMPLATE-weekly-review.md
    ├── TEMPLATE-ai-research.md
    ├── TEMPLATE-daily-focus-AI.md
    ├── TEMPLATE-prompt.md
    └── TEMPLATE-workflow.md
```

---

## 4. FILE TEMPLATES

All templates are created by `setup.sh` and stored in `/Templates/`.

**TEMPLATE-daily-note.md** — Used daily. Contains: Top 3, Blockers, Energy check, Notes, Evening reflection.

**TEMPLATE-inbox-item.md** — For quick raw captures. Minimal frontmatter. Just write.

**TEMPLATE-task.md** — What/Why/Done when structure. Forces clarity on completion criteria.

**TEMPLATE-decision.md** — Options considered, chosen path, trade-offs, success criteria, review date.

**TEMPLATE-journal-entry.md** — Free-form. No structure. Sacred space for AJ's thinking.

**TEMPLATE-meeting-notes.md** — Attendees, agenda, raw notes, decisions, actions.

**TEMPLATE-weekly-review.md** — AI-generated. Tasks metric, what moved forward, what was busywork, what was avoided.

**TEMPLATE-ai-research.md** — Research question, findings, top 3 takeaways, relevance to IN$DEX, actions, sources.

**TEMPLATE-daily-focus-AI.md** — AI-generated morning report. Session context, P0/P1 tasks, Top 3 recommendation, quick wins.

---

## 5. FRONTMATTER SCHEMA

Every file has YAML frontmatter. This makes files machine-readable without opening them.

**HUMAN file frontmatter:**
```yaml
---
date: YYYY-MM-DD
type: idea | decision | journal | meeting | task | vision | voice | priority
author: AJ Henry
tags: []
status: raw | processed | actioned | archived
ai_generated: false
sacred: true
---
```

**MACHINE file frontmatter:**
```yaml
---
date: YYYY-MM-DD
type: research | strategy | report | prompt | workflow | code | intelligence | memory | log
source: claude | gemini | codex | manual
tags: []
confidence: high | medium | low
ai_generated: true
sacred: false
related_human: []
---
```

The `sacred: true` flag is the machine-readable boundary. Any AI agent reading this flag knows: do not write to this file.

---

## 6. TAGGING SYSTEM

Tags serve navigation and filtering. Maximum 5 per file.

**Domain tags (pick 1):**
`#indx` `#siindex` `#marketplace` `#kids` `#governance` `#finance` `#ops` `#personal`

**Status tags (pick 1):**
`#idea` `#active` `#done` `#blocked` `#archived`

**Priority tags (pick 1 max):**
`#p0` (today) · `#p1` (this week) · `#p2` (this month)

**Signal tags (optional, AI assigns these):**
`#recurring` — task appeared 3+ times without completion
`#revenue` — touches income or a paying relationship
`#blocker` — blocks 2+ other tasks
`#quick-win` — completable in <30 minutes

---

## 7. AGENT INSTRUCTIONS FILE

The root instruction file is `SYSTEM.md`.

It defines: identity, hemispheres, file naming, frontmatter, tagging, inbox processing, priority framework, daily/weekly/memory workflows, the intelligence question, report definitions, session start checklist, and safety rules.

**How to use it with any AI:**
- Drop `SYSTEM.md` into the context window or project at the start of every session
- Say: "Read SYSTEM.md and then tell me where we left off"
- SIINDEX will read session-memory.md, scan tasks and inbox, and tell AJ what matters today

**With Claude Code:** Add SYSTEM.md as a project file or reference it with `/add`
**With Cursor:** Put SYSTEM.md in the `.cursorrules` equivalent
**With Gemini:** Paste SYSTEM.md content as the system instruction
**With any assistant:** Always include SYSTEM.md at the top of your context

The file is designed to be self-explanatory to any competent AI assistant.

---

## 8. DAILY OPERATING WORKFLOW

**Total time: 25 minutes per day**

### Morning (15 minutes)
1. Open SIINDEX with Morning Planning Prompt (`/MACHINE/Prompt-Library/morning-planning-prompt.md`)
2. SIINDEX processes inbox — classifies and moves files to correct folders
3. SIINDEX generates `/MACHINE/Reports/[TODAY]-daily-focus-AI.md`
4. AJ reviews the Top 3 recommendation (2 min)
5. AJ writes confirmed Top 3 into today's daily note
6. Start work on #1

### During the Day
- Any new idea → drop in `/HUMAN/Inbox/` immediately (10 seconds, raw is fine)
- Any decision made → note in `/HUMAN/Strategic-Decisions/` (1-2 minutes)
- Completed tasks → mark `#done`

### Evening (10 minutes)
1. Scan `/HUMAN/Tasks/` — mark anything completed as `#done`
2. Drop loose thoughts into `/HUMAN/Inbox/`
3. Write 3 lines in today's daily note: Shipped / Tomorrow's #1 / Learned
4. Run SIINDEX Evening Review Prompt → session-memory.md updated

---

## 9. WEEKLY REVIEW WORKFLOW

**Frequency:** Every Sunday or Monday morning
**Time:** 30 minutes

### Sequence
1. Run SIINDEX with Weekly Review Prompt
2. SIINDEX reads all daily notes from the past 7 days
3. SIINDEX generates `/MACHINE/Reports/[YEAR]-[WEEK]-weekly-review-AI.md`
4. AJ reads the report (10 min) — focus on: what moved IN$DEX forward vs. what was busywork
5. AJ updates `/HUMAN/Personal-Priorities/priorities.md` if direction shifted
6. AJ writes next week's Top 3 priorities
7. Archive any #active tasks older than 14 days

### Key Questions the Review Answers
- What moved IN$DEX forward this week?
- What was busywork (completed but didn't matter)?
- What was avoided (important but kept being pushed)?
- Is there strategic drift? (Is the work aligned with the mission?)
- What's the #1 thing for next week?

---

## 10. SIINDEX MEMORY WORKFLOW

The memory file is the intelligence thread connecting every AI session.

**File:** `/MACHINE/SIINDEX-Memory/session-memory.md`

**Format:**
```
## Session: YYYY-MM-DD HH:MM
Source: claude | gemini | codex
Files changed: [list]
Decisions made: [summary]
Context gained: [what SIINDEX learned]
Next session priority: [specific next action]
---
```

**Rules:**
- Always append, never overwrite
- Be specific — "fixed marketplace.html Supabase migration" not "did some coding"
- Next session priority must be one specific thing, not a category
- SIINDEX reads the last 3 entries at the start of every new session

**Why this matters:** Without this, every AI session starts from zero. With it, SIINDEX picks up exactly where you left off, knows what was decided, and knows what to do next. This is how intelligence compounds.

---

## 11. DASHBOARD AND REPORT STRUCTURE

No dashboards that require maintenance. Only AI-generated reports.

| Report | Location | Frequency | Contents |
|--------|----------|-----------|---------|
| Daily Focus | `/MACHINE/Reports/` | Every morning | Top 3, P0/P1 tasks, quick wins, revenue opps |
| Weekly Review | `/MACHINE/Reports/` | Every week | Task metrics, what moved, what didn't, next week priorities |
| IN$DEX Progress | `/MACHINE/Reports/` | Weekly | Screens shipped, features live, bugs, velocity |
| SIINDEX Progress | `/MACHINE/Reports/` | Monthly | Intelligence improvements, new capabilities, memory quality |
| Revenue Drivers | `/MACHINE/Reports/` | Weekly | Open revenue opps, conversion, time-sensitive deals |
| Bottleneck Report | `/MACHINE/Reports/` | On demand | What's blocking the most downstream tasks |
| High-ROI Tasks | `/MACHINE/Reports/` | Daily (in Daily Focus) | <30 min actions with outsized impact |

All reports are Markdown files. All are in `/MACHINE/`. None overwrite or reference HUMAN content directly.

---

## 12. AUTOMATION OPPORTUNITIES

Current automation available now (no new tools needed):

**With Claude Code or similar:**
- Morning planning: run with one command, get full daily focus report
- Inbox processing: run once, all items classified and moved
- Weekly review: run Sunday, full report generated in 60 seconds
- SIINDEX memory update: auto-appended at end of every session

**Future automation (v2):**
- Voice note transcription → auto-drop into `/HUMAN/Voice-Notes/` → auto-classify to inbox
- Telegram/WhatsApp bot → send a message → auto-captured to Inbox
- GitHub activity → auto-log to SIINDEX Memory (screens shipped, commits)
- Calendar integration → meeting notes template auto-created before each meeting
- Weekly report → auto-sent to AJ via email or messaging

**Automation rules:**
- Automate capture (always)
- Automate classification (always)
- Automate report generation (always)
- Never automate decisions (never)
- Never automate anything that touches HUMAN content without confirmation

---

## 13. SAFETY RULES

These rules are non-negotiable. They protect the integrity of the system.

1. **Never write to /HUMAN/ without explicit permission.** Read access is fine. Write access requires AJ's instruction.

2. **Never delete any file.** Archive with `status: archived` in frontmatter. Deletion is irreversible. Archiving is not.

3. **Never present AI analysis as AJ's original thinking.** All AI outputs must have `ai_generated: true` in frontmatter. Never mix AI outputs into HUMAN files.

4. **Never fabricate data.** If data is unavailable, use `[UNKNOWN]` or `[NEEDS RESEARCH]`. No made-up metrics.

5. **Never create dashboards that require daily maintenance.** Reports are auto-generated. If a report can't be auto-generated, it doesn't exist.

6. **Never add a new folder without updating SYSTEM.md.** The folder structure is the system. If it's not in SYSTEM.md, it doesn't exist.

7. **Always log AI actions.** Every file SIINDEX creates, moves, or modifies gets logged in `/MACHINE/System-Logs/`.

8. **Never confuse activity with progress.** Completing 20 low-ROI tasks is not progress. Shipping one feature that gets users is progress.

---

## 14. FUTURE UPGRADES

### v1.1 — Quick Wins (next 30 days)
- Voice note transcription pipeline (Whisper → Inbox)
- `audit-memory.sh` — clean up stale session-memory entries
- Obsidian template plugin setup for one-click file creation
- Weekly review auto-email (Markdown → email via CLI)

### v1.2 — Intelligence Layer (60-90 days)
- SIINDEX pattern detection: flag tasks appearing 3+ times without completion
- Revenue opportunity tracker: dedicated workflow for open deals
- `high-roi-scan.sh` — scans all tasks and surfaces <30 min actions
- Competitor monitoring: auto-research on key competitors weekly

### v2.0 — Connected System (6 months)
- GitHub integration: auto-log commits and screens shipped to SIINDEX Memory
- Calendar integration: auto-create meeting note templates before meetings
- Messaging bot: WhatsApp/Telegram → Inbox (voice or text)
- Daily brief: auto-generated, delivered to messaging app each morning
- SIINDEX semantic search across all notes (local embeddings)

### v3.0 — Autonomous Intelligence (12 months)
- SIINDEX autonomously identifies strategic drift
- Auto-generates opportunity analysis when patterns detected
- Maintains a living IN$DEX knowledge base from session learning
- Builds a "founder context" document that any AI can read to get full context instantly

---

## 15. STEP-BY-STEP BUILD INSTRUCTIONS

### Right Now (15 minutes)

**Step 1: Run the setup script**
```bash
# Navigate to where you want your second brain
cd ~/

# Run setup (creates ~/second-brain by default)
bash "/Users/arthurjohnhenry/CoWork/Projects/ImageNation DEX/sovereign-second-brain/setup.sh"

# Or choose a custom location:
bash "...setup.sh" ~/CoWork/second-brain
```

**Step 2: Verify the installation**
```bash
ls ~/second-brain/
# Should show: SYSTEM.md  HUMAN/  MACHINE/  Templates/

ls ~/second-brain/HUMAN/
# Should show 10 folders

ls ~/second-brain/MACHINE/
# Should show 11 folders including SIINDEX-Memory/
```

**Step 3: Fill in Personal Priorities**
Open `~/second-brain/HUMAN/Personal-Priorities/priorities.md`
Answer: mission, non-negotiables, 90-day focus, 1-year vision.
This is the strategic foundation. Do this before anything else.

**Step 4: Brain dump your Inbox**
Open `~/second-brain/HUMAN/Inbox/`
Create a new file for every idea, task, or thought in your head right now.
Filename: `2026-07-04-idea-[whatever].md`
Content: write anything. Raw. Unfiltered. No polish.

**Step 5: Open in Obsidian**
Open Obsidian → Open Vault → select `~/second-brain`
Enable: Daily Notes plugin, Templates plugin, Dataview plugin (optional)
Set Templates folder to `~/second-brain/Templates/`
Set Daily Note template to `TEMPLATE-daily-note.md`

### Tomorrow Morning (First Operating Session)

**Step 6: Start your first morning session**
Open SIINDEX (Claude Code, Claude chat, or any AI)
Paste contents of `SYSTEM.md` into context
Then paste contents of `morning-planning-prompt.md` as your request
SIINDEX will process inbox, generate daily focus, tell you Top 3.

**Step 7: Set your daily rhythm**
Morning: 15 minutes — process inbox, get Top 3, start work on #1
Evening: 10 minutes — mark done, drop loose thoughts, 3-line reflection

### This Week

**Step 8: Build the habit**
Day 1-3: Just the daily note + inbox. Nothing more.
Day 4-7: Add the evening reflection.
Week 2: Start weekly review.
Month 2: You'll wonder how you worked without it.

### Ongoing

**Step 9: Trust the system**
Don't add folders that aren't in SYSTEM.md.
Don't add tools because they look interesting.
Don't break the hemisphere rule.
Let SIINDEX get smarter from every session.

**Step 10: Run monthly system improvement**
Every 30 days: read `/MACHINE/Improvement-Suggestions/`
SIINDEX logs what's working and what isn't.
You decide what to upgrade.
Update SYSTEM.md when the system evolves.

---

## THE SINGLE MOST IMPORTANT THING

Every day, before anything else, SIINDEX tells AJ:

**"Here is where we left off. Here is what matters most today. Here is your #1."**

That one signal — delivered reliably every morning — is worth more than any feature, dashboard, or automation in this system.

Build the habit of trusting it. The intelligence compounds from there.

---

*SIINDEX Sovereign Second Brain v1.0*
*Built for IN$DEX | Owner: AJ Henry*
*Deploy with: `bash setup.sh`*
*Operate with: SYSTEM.md*
