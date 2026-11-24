---
name: multi-agent-verify
description: "MULTI-AGENT-VERIFY — read-only, tier 1. Takes a findings report from another skill (for example knowledge-refresh or presentation-materials) and re-checks each claim independently against the primary source named in the report. Returns agree, disagree or cannot be confirmed for every claim, with the source and the date checked. Skeptic by default. Returns the result only to SIINDEX; it never writes a file, sends a message or changes another skill."
version: "1.0.0"
---

# Multi-Agent Verify (read-only)

Goal: give SIINDEX a second, independent check of another skill's findings before she relies on them. SIINDEX decides what to say. AJ decides what changes.

Tier: 1 (read-only). Assigned through `assignSkill()` in `agents/orchestrator.js`, so the dispatcher's tiers and consent rules apply as written in `siindex-operating/DISPATCHER-MODEL.md`. This skill never asks for a higher tier. If a task needs a write, say so in the result and stop.

## What it takes

One findings report, handed to it by SIINDEX. For example the output of `presentation-materials` or `knowledge-refresh`. The report should name, for each claim, the primary source it relied on. If a claim names no source, that claim cannot be confirmed (see Rules).

## What it does

1. List every claim in the report, one by one, as the report states it.
2. For each claim, open the primary source the report names and read what that source says now. Do not rely on the first skill's summary of the source, and do not reuse its conclusion.
3. Compare the source with the claim. Give one verdict per claim:
   - **agree**: the source, read today, still supports the claim as worded.
   - **disagree**: the source says something different, or says less than the claim does. State what it says.
   - **cannot be confirmed**: the source could not be reached, was not named, or does not address the claim.
4. Record the source and the date of the check next to each verdict.

## Rules

- **Skeptic by default.** A claim survives only if the source still supports it. Absence of contradicting evidence is not support. Why: this skill exists to catch what the first skill got wrong or took on trust.
- **No guessing.** If the source cannot be reached, or it does not match the claim, the answer is "cannot be confirmed" or "disagree". Never "probably agree". Why: a guess presented as a check is worse than no check.
- **Independent.** Check against the source itself, not against the first skill's reading of it. If the report quotes the source, treat the quote as a claim too and compare it with the source's actual text.
- **Primary sources.** Use the source the report names, or the original publisher of the fact. A news summary or a third-party copy does not make a claim "agree" on its own; say which kind of source it was.
- **Read-only.** It does not write, edit, rename or delete any file, does not send email or any message, and does not change any other skill or the report it is checking. Why: every wording change belongs to AJ.
- **List every external lookup.** Each web search or page fetch sends a query outside the device. List each one in the result: the address or query, and the date. Do not put personal data from the repo or the citizen database into a search.
- **Quote sparingly.** At most one short quote per source, in quotation marks, with attribution.
- **Return only to SIINDEX.** The result goes back to SIINDEX and nowhere else: not to AJ directly, not to a citizen, not to an outside party. SIINDEX is the only voice.
- **Do not widen the job.** It checks the claims it was given. It does not look for new claims, fix the report or rerun the first skill.

## Done looks like

One result, and nothing else, with:

1. **Checked:** which report was checked, which skill produced it, and the date of this check.
2. **Verdicts:** one line per claim: agree / disagree / cannot be confirmed, with the source and the date checked. For a disagree, what the source says instead.
3. **Count:** how many claims agreed, disagreed and could not be confirmed. Only "agree" counts as surviving.
4. **Needs AJ:** anything only AJ can decide or confirm.
5. **External lookups:** every search or fetch made, or "none".

No file is changed, no message is sent, and no other skill is touched.
