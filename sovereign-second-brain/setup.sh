#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# SOVEREIGN SECOND BRAIN — Setup Script
# IN$DEX | SIINDEX Intelligence Architecture v1.0
# Owner: AJ Henry
#
# Usage:
#   bash setup.sh                    → installs at ~/second-brain
#   bash setup.sh /path/to/folder   → installs at custom path
#
# What this does:
#   1. Creates the full two-hemisphere folder structure
#   2. Writes all template files with frontmatter
#   3. Initialises SIINDEX session memory
#   4. Creates today's first daily note
#   5. Copies SYSTEM.md into the root
# ═══════════════════════════════════════════════════════════════

set -e

BASE="${1:-$HOME/second-brain}"
TODAY=$(date +%Y-%m-%d)
WEEK=$(date +%Y-%V)

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   IN\$DEX SOVEREIGN SECOND BRAIN — SETUP      ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "→ Installing at: $BASE"
echo ""

# ── 1. CREATE DIRECTORY STRUCTURE ─────────────────────────────
mkdir -p "$BASE"/{HUMAN/{Inbox,Daily-Notes,Tasks,Founder-Journal,INDX-Ideas,Strategic-Decisions,Meeting-Notes,Voice-Notes,Vision-Notes,Personal-Priorities},MACHINE/{AI-Research,Generated-Strategies,Prompt-Library,Workflows,Skills,Reports,Code-Notes,Market-Intelligence,SIINDEX-Memory,System-Logs,Improvement-Suggestions},Templates}

echo "✓ Folder structure created"

# ── 2. COPY SYSTEM.md (root agent instruction file) ───────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/SYSTEM.md" ]; then
  cp "$SCRIPT_DIR/SYSTEM.md" "$BASE/SYSTEM.md"
  echo "✓ SYSTEM.md installed"
else
  echo "⚠ SYSTEM.md not found next to setup.sh — skipping copy"
fi

# ── 3. TEMPLATE: DAILY NOTE ───────────────────────────────────
cat > "$BASE/Templates/TEMPLATE-daily-note.md" << 'TEMPLATE'
---
date: YYYY-MM-DD
type: daily-note
author: AJ Henry
tags: []
status: raw
ai_generated: false
sacred: true
---

# Daily Note — YYYY-MM-DD

## Top 3 Today
<!-- What are the 3 highest-ROI actions for today? -->
1.
2.
3.

## Blockers
<!-- What is stopping me from executing? -->
-

## Energy Check (1–10)
<!-- How am I feeling? What's my focus capacity? -->
Energy:
Focus:
Mood:

## Notes
<!-- Anything else captured during the day -->

---

## Evening Reflection
<!-- Complete at end of day — 3 lines only -->
**Shipped:**
**Tomorrow's #1:**
**Learned:**
TEMPLATE
echo "✓ Template: daily-note"

# ── 4. TEMPLATE: INBOX ITEM ───────────────────────────────────
cat > "$BASE/Templates/TEMPLATE-inbox-item.md" << 'TEMPLATE'
---
date: YYYY-MM-DD
type: idea
author: AJ Henry
tags: [#idea]
status: raw
ai_generated: false
sacred: true
---

# [Title]

<!-- Raw capture — write whatever came to mind. Do not filter. -->

TEMPLATE
echo "✓ Template: inbox-item"

# ── 5. TEMPLATE: TASK ─────────────────────────────────────────
cat > "$BASE/Templates/TEMPLATE-task.md" << 'TEMPLATE'
---
date: YYYY-MM-DD
type: task
author: AJ Henry
tags: [#active, #p1]
status: raw
ai_generated: false
sacred: true
due:
area: indx | siindex | marketplace | kids | finance | ops | personal
---

# Task: [Title]

## What
<!-- What exactly needs to be done? -->

## Why
<!-- Why does this matter? What does it unblock? -->

## Done When
<!-- How do I know this is complete? -->

## Notes
TEMPLATE
echo "✓ Template: task"

# ── 6. TEMPLATE: STRATEGIC DECISION ──────────────────────────
cat > "$BASE/Templates/TEMPLATE-decision.md" << 'TEMPLATE'
---
date: YYYY-MM-DD
type: decision
author: AJ Henry
tags: []
status: raw
ai_generated: false
sacred: true
decision_made: true
reversible: true | false
---

# Decision: [Title]

## The Decision
<!-- State the decision in one sentence -->

## Context
<!-- Why did this decision need to be made? -->

## Options Considered
1.
2.
3.

## Chosen Path
<!-- What was decided, and why -->

## Trade-offs Accepted
<!-- What am I giving up? What risk am I taking? -->

## Success Looks Like
<!-- How will I know this was the right call in 90 days? -->

## Review Date
TEMPLATE
echo "✓ Template: decision"

# ── 7. TEMPLATE: FOUNDER JOURNAL ─────────────────────────────
cat > "$BASE/Templates/TEMPLATE-journal-entry.md" << 'TEMPLATE'
---
date: YYYY-MM-DD
type: journal
author: AJ Henry
tags: []
status: raw
ai_generated: false
sacred: true
---

# Journal — YYYY-MM-DD

<!-- Write without editing. Stream of consciousness. No polish required. -->
<!-- This space belongs to you. SIINDEX does not touch this content. -->

TEMPLATE
echo "✓ Template: journal-entry"

# ── 8. TEMPLATE: MEETING NOTES ────────────────────────────────
cat > "$BASE/Templates/TEMPLATE-meeting-notes.md" << 'TEMPLATE'
---
date: YYYY-MM-DD
type: meeting
author: AJ Henry
tags: []
status: raw
ai_generated: false
sacred: true
attendees: []
meeting_type: 1:1 | team | investor | partner | solo-planning
---

# Meeting: [Title] — YYYY-MM-DD

## Attendees

## Agenda

## Raw Notes
<!-- Capture everything. Messy is fine. -->

## Decisions Made

## Actions (with owner)
- [ ] [Who]: [What] by [When]

## Follow Up
TEMPLATE
echo "✓ Template: meeting-notes"

# ── 9. TEMPLATE: AI RESEARCH ──────────────────────────────────
cat > "$BASE/Templates/TEMPLATE-ai-research.md" << 'TEMPLATE'
---
date: YYYY-MM-DD
type: research
source: claude | gemini | codex | tavily | manual
tags: []
confidence: high | medium | low
ai_generated: true
sacred: false
related_human: []
query: ""
---

# Research: [Topic] — YYYY-MM-DD

## Research Question

## Findings

## Key Takeaways (Top 3)
1.
2.
3.

## Relevance to IN$DEX

## Recommended Actions

## Sources
TEMPLATE
echo "✓ Template: ai-research"

# ── 10. TEMPLATE: WEEKLY REVIEW ───────────────────────────────
cat > "$BASE/Templates/TEMPLATE-weekly-review.md" << 'TEMPLATE'
---
date: YYYY-MM-DD
type: report
source: siindex
tags: []
confidence: high
ai_generated: true
sacred: false
week:
---

# Weekly Review — Week [WW], YYYY

## Tasks
- Created:
- Completed:
- Carried over:
- Abandoned:

## What Moved IN$DEX Forward
<!-- Only the things that actually mattered -->

## What Was Busywork
<!-- Honest accounting of low-ROI activity -->

## What Was Avoided
<!-- The uncomfortable task that kept getting pushed -->

## Biggest Win

## Biggest Lesson

## Bottleneck This Week

## Revenue Activities
<!-- Anything that touched money or relationships with payers -->

## Next Week — Top 3 Priorities
1.
2.
3.

## Strategic Drift Check
<!-- Is the work this week aligned with the mission? Y/N + why -->

## Founder Energy
State:
Recommendation:
TEMPLATE
echo "✓ Template: weekly-review"

# ── 11. TEMPLATE: DAILY FOCUS REPORT (AI) ─────────────────────
cat > "$BASE/Templates/TEMPLATE-daily-focus-AI.md" << 'TEMPLATE'
---
date: YYYY-MM-DD
type: report
source: siindex
tags: []
confidence: high
ai_generated: true
sacred: false
---

# Daily Focus — YYYY-MM-DD

## Session Context
<!-- What SIINDEX knows from last session -->

## Unprocessed Inbox Items
<!-- List any items sitting in /HUMAN/Inbox/ -->

## Active P0 Tasks
<!-- Tasks tagged #p0 -->

## Active P1 Tasks
<!-- Tasks tagged #p1 -->

## Flagged Items
<!-- Tasks appearing 3+ times without completion -->
<!-- Decisions blocking 2+ other tasks -->

## Recommended Top 3 for Today
1. [Task] — [Why it's highest ROI today]
2.
3.

## Quick Wins Available (<30 min)

## Revenue Opportunities
<!-- Any open revenue activities that need a nudge -->

## SIINDEX Intelligence Note
<!-- One thing SIINDEX noticed from recent patterns -->
TEMPLATE
echo "✓ Template: daily-focus-AI"

# ── 12. TEMPLATE: REUSABLE PROMPT ─────────────────────────────
cat > "$BASE/Templates/TEMPLATE-prompt.md" << 'TEMPLATE'
---
date: YYYY-MM-DD
type: prompt
source: manual
tags: []
ai_generated: false
sacred: false
purpose: ""
works_with: claude | gemini | codex | all
tested: true | false
---

# Prompt: [Name]

## Purpose
<!-- One sentence: what does this prompt produce? -->

## When to Use

## The Prompt
```
[Paste prompt here]
```

## Variables to Replace
- `[VARIABLE]` — description of what to insert

## Example Output

## Notes
TEMPLATE
echo "✓ Template: prompt"

# ── 13. TEMPLATE: WORKFLOW ────────────────────────────────────
cat > "$BASE/Templates/TEMPLATE-workflow.md" << 'TEMPLATE'
---
date: YYYY-MM-DD
type: workflow
source: siindex
tags: []
ai_generated: true
sacred: false
trigger: ""
frequency: daily | weekly | monthly | on-demand
estimated_time: ""
---

# Workflow: [Name]

## Trigger
<!-- When does this workflow run? What starts it? -->

## Purpose
<!-- What does this workflow produce? -->

## Steps
1.
2.
3.

## Output
<!-- What file/action/decision does this produce? -->

## Success Criteria
<!-- How do I know the workflow completed correctly? -->

## Failure Mode
<!-- What goes wrong? How to recover? -->
TEMPLATE
echo "✓ Template: workflow"

# ── 14. INITIALISE SIINDEX MEMORY ─────────────────────────────
cat > "$BASE/MACHINE/SIINDEX-Memory/session-memory.md" << TEMPLATE
---
type: memory
source: siindex
ai_generated: true
sacred: false
---

# SIINDEX Session Memory

This file is the persistent intelligence layer between AI sessions.
SIINDEX appends to this file at the end of every working session.
Never overwrite previous entries. Always append.

---

## Session: $TODAY — SETUP
Source: setup.sh
Files changed: Full system scaffold
Decisions made: Sovereign Second Brain initialised at $BASE
Context gained: System installed. SYSTEM.md is the root instruction file. Two hemispheres: /HUMAN/ (sacred) and /MACHINE/ (AI territory). All templates created. Ready to operate.
Next session priority: Process any items in /HUMAN/Inbox/ and create first daily note.
---
TEMPLATE
echo "✓ SIINDEX memory initialised"

# ── 15. CREATE TODAY'S DAILY NOTE ─────────────────────────────
DAILY_NOTE="$BASE/HUMAN/Daily-Notes/$TODAY-daily-note.md"
cat > "$DAILY_NOTE" << TEMPLATE
---
date: $TODAY
type: daily-note
author: AJ Henry
tags: []
status: raw
ai_generated: false
sacred: true
---

# Daily Note — $TODAY

## Top 3 Today
1.
2.
3.

## Blockers
-

## Energy Check (1–10)
Energy:
Focus:
Mood:

## Notes

---

## Evening Reflection
**Shipped:**
**Tomorrow's #1:**
**Learned:**
TEMPLATE
echo "✓ Today's daily note created"

# ── 16. CREATE PERSONAL PRIORITIES SEED ──────────────────────
cat > "$BASE/HUMAN/Personal-Priorities/priorities.md" << 'TEMPLATE'
---
date: YYYY-MM-DD
type: priority
author: AJ Henry
tags: []
status: raw
ai_generated: false
sacred: true
---

# Personal Priorities — AJ Henry

## Mission
<!-- One sentence: what is IN$DEX here to do? -->

## Non-Negotiables
<!-- Values that don't bend regardless of pressure -->
-

## Current Focus (90 days)
<!-- The 1-3 things that matter most right now -->
1.
2.
3.

## What I'm Building Toward (1 year)

## What I'm Protecting
<!-- Time, energy, relationships, health — what gets protected first -->

## What Success Looks Like
<!-- Not metrics. What does a great outcome feel like? -->

## Last Updated
TEMPLATE
echo "✓ Personal priorities file created"

# ── 17. CREATE CORE PROMPTS ───────────────────────────────────
cat > "$BASE/MACHINE/Prompt-Library/morning-planning-prompt.md" << 'TEMPLATE'
---
date: YYYY-MM-DD
type: prompt
source: siindex
tags: [#indx, #ops]
ai_generated: true
sacred: false
purpose: Generate daily focus report from daily notes and task list
works_with: all
tested: true
---

# Prompt: Morning Planning

## The Prompt
```
You are SIINDEX, operating within the IN$DEX Sovereign Second Brain.

Read SYSTEM.md to understand your operating rules.
Read the last 3 entries in /MACHINE/SIINDEX-Memory/session-memory.md.
Read all files in /HUMAN/Inbox/.
Read all files in /HUMAN/Tasks/ tagged #p0 or #p1.
Read today's daily note in /HUMAN/Daily-Notes/.

Then:
1. Process any unprocessed inbox items (move to correct HUMAN folder, log it)
2. Identify the Top 3 highest-ROI actions for today
3. Flag any tasks that have appeared 3+ times without completion
4. Identify any revenue activities that could be completed in <30 minutes
5. Generate /MACHINE/Reports/[TODAY]-daily-focus-AI.md

Do not overwrite anything in /HUMAN/.
Do not summarise AJ's notes without permission.
Report: "Here's where we are and what matters most today."
```
TEMPLATE

cat > "$BASE/MACHINE/Prompt-Library/evening-review-prompt.md" << 'TEMPLATE'
---
date: YYYY-MM-DD
type: prompt
source: siindex
tags: [#indx, #ops]
ai_generated: true
sacred: false
purpose: End-of-day debrief and SIINDEX memory update
works_with: all
tested: true
---

# Prompt: Evening Review

## The Prompt
```
You are SIINDEX, operating within the IN$DEX Sovereign Second Brain.

Read SYSTEM.md to understand your operating rules.
Read today's daily note in /HUMAN/Daily-Notes/.
Read the task files modified today in /HUMAN/Tasks/.

Then:
1. Summarise what was completed today (tasks marked #done)
2. Identify what was carried over and why
3. Identify any patterns (repeated avoidance, recurring blockers)
4. Update /MACHINE/SIINDEX-Memory/session-memory.md with today's session entry
5. Set a clear "Next session priority" in the memory entry

Format the memory entry per the SYSTEM.md SIINDEX Memory Update Workflow.
Do not overwrite any HUMAN content.
```
TEMPLATE

cat > "$BASE/MACHINE/Prompt-Library/inbox-processing-prompt.md" << 'TEMPLATE'
---
date: YYYY-MM-DD
type: prompt
source: siindex
tags: [#ops]
ai_generated: true
sacred: false
purpose: Process raw inbox items into the correct HUMAN folder
works_with: all
tested: true
---

# Prompt: Inbox Processing

## The Prompt
```
You are SIINDEX, operating within the IN$DEX Sovereign Second Brain.

Read SYSTEM.md first.
Open every file in /HUMAN/Inbox/.

For each file, classify it as one of:
- idea → /HUMAN/INDX-Ideas/
- task → /HUMAN/Tasks/
- decision → /HUMAN/Strategic-Decisions/
- reflection → /HUMAN/Founder-Journal/
- meeting → /HUMAN/Meeting-Notes/
- research needed → create a request file in /MACHINE/AI-Research/

Move the file to the correct folder.
Update its frontmatter: status: processed.
Log each move in /MACHINE/System-Logs/[TODAY]-inbox-log-AI.md.

NEVER delete inbox files. NEVER edit the content. NEVER summarise.
If classification is unclear, ask AJ before moving.
```
TEMPLATE

cat > "$BASE/MACHINE/Prompt-Library/weekly-review-prompt.md" << 'TEMPLATE'
---
date: YYYY-MM-DD
type: prompt
source: siindex
tags: [#ops]
ai_generated: true
sacred: false
purpose: Generate comprehensive weekly review report
works_with: all
tested: true
---

# Prompt: Weekly Review

## The Prompt
```
You are SIINDEX, operating within the IN$DEX Sovereign Second Brain.

Read SYSTEM.md first.
Read all /HUMAN/Daily-Notes/ files from the past 7 days.
Read all /HUMAN/Tasks/ files.
Read last week's weekly review in /MACHINE/Reports/ if it exists.

Generate /MACHINE/Reports/[YEAR]-[WEEK]-weekly-review-AI.md using TEMPLATE-weekly-review.md.

Answer these questions honestly:
- What moved IN$DEX forward?
- What was busywork?
- What was avoided?
- What patterns are emerging?
- Is there strategic drift?

Then: identify next week's Top 3 priorities.

Do not overwrite any HUMAN content.
Do not pad the report with filler. Be direct and specific.
```
TEMPLATE

cat > "$BASE/MACHINE/Prompt-Library/siindex-memory-update-prompt.md" << 'TEMPLATE'
---
date: YYYY-MM-DD
type: prompt
source: siindex
tags: [#siindex]
ai_generated: true
sacred: false
purpose: Update SIINDEX session memory at end of every AI session
works_with: all
tested: true
---

# Prompt: SIINDEX Memory Update

## The Prompt
```
You are SIINDEX, operating within the IN$DEX Sovereign Second Brain.

At the end of this session, append the following to:
/MACHINE/SIINDEX-Memory/session-memory.md

Format:
## Session: [YYYY-MM-DD HH:MM]
Source: [claude | gemini | codex]
Files changed: [list all files created or modified this session]
Decisions made: [brief summary of any decisions AJ made]
Context gained: [what you learned that will be useful next session]
Next session priority: [the single most important thing to continue]
---

Rules:
- Never overwrite previous entries
- Always append below the last entry
- Be specific, not generic
- If nothing significant happened, still log it
```
TEMPLATE
echo "✓ Core prompt library created"

# ── 18. CREATE CORE WORKFLOWS ─────────────────────────────────
cat > "$BASE/MACHINE/Workflows/morning-planning.md" << 'TEMPLATE'
---
date: YYYY-MM-DD
type: workflow
source: siindex
tags: [#ops]
ai_generated: true
sacred: false
trigger: Start of each working day
frequency: daily
estimated_time: 15 minutes
---

# Workflow: Morning Planning

## Steps
1. Open SIINDEX with the Morning Planning Prompt (see /MACHINE/Prompt-Library/)
2. SIINDEX reads: SYSTEM.md + session-memory.md + Inbox + Tasks
3. SIINDEX processes Inbox (classifies and moves files)
4. SIINDEX generates daily focus report in /MACHINE/Reports/
5. AJ reviews Top 3 and confirms or adjusts
6. AJ writes Top 3 into today's daily note in /HUMAN/Daily-Notes/
7. Begin work on #1

## Output
- Inbox cleared
- /MACHINE/Reports/YYYY-MM-DD-daily-focus-AI.md created
- Today's daily note has Top 3 populated

## Time: 15 minutes maximum
TEMPLATE

cat > "$BASE/MACHINE/Workflows/evening-review.md" << 'TEMPLATE'
---
date: YYYY-MM-DD
type: workflow
source: siindex
tags: [#ops]
ai_generated: true
sacred: false
trigger: End of each working day
frequency: daily
estimated_time: 10 minutes
---

# Workflow: Evening Review

## Steps
1. Mark completed tasks as #done in /HUMAN/Tasks/
2. Drop any loose ideas into /HUMAN/Inbox/ (raw is fine)
3. Open today's daily note, complete the Evening Reflection section (3 lines)
4. Run SIINDEX with Evening Review Prompt
5. SIINDEX updates session-memory.md
6. Close for the day

## Output
- Tasks updated
- Inbox has new captures
- Daily note complete
- session-memory.md updated with today's entry

## Time: 10 minutes maximum
TEMPLATE

cat > "$BASE/MACHINE/Workflows/weekly-indx-brief.md" << 'TEMPLATE'
---
date: YYYY-MM-DD
type: workflow
source: siindex
tags: [#indx, #ops]
ai_generated: true
sacred: false
trigger: Every Sunday or Monday morning
frequency: weekly
estimated_time: 30 minutes
---

# Workflow: Weekly IN$DEX Brief

## Steps
1. Run SIINDEX with Weekly Review Prompt
2. SIINDEX generates weekly review report in /MACHINE/Reports/
3. AJ reads the report (10 min)
4. AJ updates /HUMAN/Personal-Priorities/ if direction shifted
5. AJ writes next week's Top 3 in a new daily note
6. Archive any #active tasks older than 14 days

## Output
- /MACHINE/Reports/YYYY-WW-weekly-review-AI.md
- /HUMAN/Personal-Priorities/ updated if needed
- Clear direction for the coming week

## Time: 30 minutes
TEMPLATE

cat > "$BASE/MACHINE/Workflows/idea-expansion.md" << 'TEMPLATE'
---
date: YYYY-MM-DD
type: workflow
source: siindex
tags: [#indx]
ai_generated: true
sacred: false
trigger: When AJ has a raw idea worth developing
frequency: on-demand
estimated_time: 20 minutes
---

# Workflow: Idea Expansion

## Steps
1. AJ drops raw idea in /HUMAN/Inbox/ or /HUMAN/INDX-Ideas/ (raw, unfiltered)
2. SIINDEX reads the idea (HUMAN file — read only)
3. SIINDEX creates /MACHINE/Generated-Strategies/YYYY-MM-DD-[idea-slug]-expanded-AI.md
4. Expansion includes: Problem statement, Opportunity size, How it fits IN$DEX, Risks, First 3 steps
5. AJ reviews expansion and adds own thoughts back to HUMAN file if desired

## Rules
- SIINDEX does NOT edit the original idea file
- SIINDEX does NOT summarise AJ's words in the expansion — only adds new thinking
- The expanded version is clearly marked ai_generated: true

## Output
- Original idea preserved in /HUMAN/
- Expanded strategy in /MACHINE/Generated-Strategies/
TEMPLATE
echo "✓ Core workflows created"

# ── 19. CREATE INITIAL INTELLIGENCE REPORT ────────────────────
cat > "$BASE/MACHINE/Reports/$TODAY-daily-focus-AI.md" << TEMPLATE
---
date: $TODAY
type: report
source: siindex
tags: []
confidence: high
ai_generated: true
sacred: false
---

# Daily Focus — $TODAY — SYSTEM INITIALISED

## Session Context
First session. Sovereign Second Brain has just been installed.
SYSTEM.md is live. All templates and workflows are ready.

## Recommended First Actions
1. Open /HUMAN/Personal-Priorities/priorities.md and fill it in — this is the strategic foundation
2. Drop any ideas or tasks from your head into /HUMAN/Inbox/ right now
3. Run Morning Planning workflow tomorrow to begin the operating rhythm

## Quick Win Available
Spend 10 minutes filling in Personal Priorities. This anchors every future decision SIINDEX makes.

## SIINDEX Intelligence Note
System is live. The intelligence compounds from here.
Every note you write, every decision you log, every task you complete teaches SIINDEX what matters.
Start simple. Build the habit. The system will grow with you.
TEMPLATE
echo "✓ Initial daily focus report created"

# ── 20. CREATE SYSTEM LOG ─────────────────────────────────────
cat > "$BASE/MACHINE/System-Logs/$TODAY-setup-log-AI.md" << TEMPLATE
---
date: $TODAY
type: log
source: setup.sh
tags: []
ai_generated: true
sacred: false
---

# System Log — $TODAY — Initial Setup

## Action
Sovereign Second Brain scaffolded via setup.sh

## Files Created
- SYSTEM.md (root agent instruction file)
- HUMAN hemisphere: 10 folders
- MACHINE hemisphere: 11 folders
- Templates: 9 template files
- Prompt Library: 5 core prompts
- Workflows: 4 core workflows
- Initial daily note: $TODAY
- Initial daily focus report
- SIINDEX session memory initialised

## Base Path
$BASE

## Status
COMPLETE — system ready for first session
TEMPLATE
echo "✓ System log created"

# ── FINAL OUTPUT ───────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   ✅  SOVEREIGN SECOND BRAIN — INSTALLATION COMPLETE     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Installed at:  $BASE"
echo ""
echo "NEXT STEPS:"
echo "  1. Open $BASE/HUMAN/Personal-Priorities/priorities.md"
echo "     → Fill in your mission, non-negotiables, and 90-day focus"
echo ""
echo "  2. Drop any ideas floating in your head into:"
echo "     $BASE/HUMAN/Inbox/"
echo ""
echo "  3. Tomorrow morning: open SIINDEX with the Morning Planning prompt"
echo "     → $BASE/MACHINE/Prompt-Library/morning-planning-prompt.md"
echo ""
echo "  4. Put $BASE/SYSTEM.md at the top of every AI context"
echo "     → This is how SIINDEX knows how to operate"
echo ""
echo "  5. Open $BASE in Obsidian for the full graph view experience"
echo ""
echo "The intelligence compounds from today. Build the habit."
echo ""
