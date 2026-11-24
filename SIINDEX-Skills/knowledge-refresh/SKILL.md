---
name: knowledge-refresh
description: "KNOWLEDGE-REFRESH — read-only, tier 1. Refreshes the public facts used in SIINDEX materials (CAWG status, bill progress, Cook Islands registration status, regulatory updates) by checking the primary official source named in the materials or discoverable from official domains. Returns agree, disagree or cannot be confirmed for every claim, with the source URL and the date checked. Skeptic by default. Returns the report only to SIINDEX; it never writes a file, sends a message or changes another skill."
version: "1.0.0"
---

# Knowledge Refresh (read-only)

Tier: 1 (read-only).

Purpose: refresh the public facts used in SIINDEX materials (CAWG status, bill progress, Cook Islands registration status, regulatory updates) by checking the primary source named in the materials, or the primary source discoverable from official domains. SIINDEX decides what to say. AJ decides what changes.

Assigned through `assignSkill()` in `agents/orchestrator.js`, so the dispatcher's tiers and consent rules apply as written in `siindex-operating/DISPATCHER-MODEL.md`. This skill never asks for a higher tier. If a task needs a write, say so in the report and stop.

## What it reads

- The claims to refresh: the public-fact statements in the materials SIINDEX points it at, for example `docs/2026-11-12-cook-islands-december-one-pager.md`, the spoken script beside it, and `docs/legal/cook-islands-registration-steps.md`.
- Primary sources only: government sites, official registers, published bills, and regulator pages. Use the source the material names. If it names none, look for the original publisher on an official domain.

## What it does

1. List each public fact the task covers, as the material words it.
2. For each fact, open the primary source and read what it says now.
3. Compare the source with the claim and give one verdict:
   - **agree**: the primary source, read today, supports the claim as worded.
   - **disagree**: the primary source says something different, or less than the claim does. State what it says.
   - **cannot be confirmed**: the primary source could not be reached, could not be found, or does not contain the claim.
4. Record the source URL and the date checked next to each verdict.

## Rules

- **Read-only.** It does not write, edit, rename or delete any file, does not send email or any message, and does not change any other skill or any of the materials it checks. Why: the materials are for a government meeting, and every wording change is AJ's decision.
- **Skeptic by default.** A claim survives only if the primary source supports it. Absence of contradicting evidence is not support.
- **"Cannot be confirmed", never a guess.** If the primary source does not contain the claim, the answer is "cannot be confirmed". Why: a gap in the evidence means unknown, not true.
- **Primary sources only.** Government sites, official registers, published bills and regulator pages. News reports, social posts, blogs and third-party summaries are not sources for a verdict. If one points to a primary source, go to that source instead. Fact-check services, if ever used, are a secondary signal and never the basis of a verdict.
- **Do not turn a plan into a claim.** The materials say IN$DEX is at pilot-preparation stage and is not operating a live service. Report any wording that implies otherwise.
- **List every external lookup.** Each web search or page fetch sends a query outside the device. List each one in the report: the address or query, and the date. Do not put personal data from the repo or the citizen database into a search.
- **Quote sparingly.** At most one short quote per source, in quotation marks, with attribution.
- **Findings only.** Never present a fix as applied. A suggested wording may be quoted as a suggestion, marked as not applied.
- **Return only to SIINDEX.** The report goes back to SIINDEX and nowhere else: not to AJ directly, not to a citizen, not to an outside party. SIINDEX is the only voice.

## Done looks like

One report, and nothing else, with:

1. **Checked:** which materials and which claims, and the date of the check.
2. **Findings:** one line per claim: agree / disagree / cannot be confirmed, with the source URL and the date checked. For a disagree, what the source says instead.
3. **Count:** how many claims agreed, disagreed and could not be confirmed.
4. **Needs AJ:** anything only AJ can decide or confirm.
5. **External lookups:** every search or fetch made, or "none".

No file is changed, no message is sent, and no other skill is touched.
