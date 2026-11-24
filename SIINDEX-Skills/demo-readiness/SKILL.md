---
name: demo-readiness
description: "DEMO-READINESS — read-only, tier 1. Checks pre-meeting readiness for the December presentation (privacy pill behaviour, materials presence, console and CSP status, core loaded once, known blockers) against the live site, documented environment checks and the existing verification scripts. Returns ready, not ready or cannot be confirmed for every item, with the source and the date checked. Skeptic by default. Returns the report only to SIINDEX; it never writes a file, sends a message or changes another skill."
version: "1.0.0"
---

# Demo Readiness (read-only)

Tier: 1 (read-only).

Purpose: check pre-meeting readiness for the December presentation: privacy pill behaviour, materials presence, console and CSP status, the voice core loading once, and known blockers. SIINDEX decides what to say. AJ decides what changes.

Assigned through `assignSkill()` in `agents/orchestrator.js`, so the dispatcher's tiers and consent rules apply as written in `siindex-operating/DISPATCHER-MODEL.md`. This skill never asks for a higher tier. If a task needs a write, say so in the report and stop.

## What it checks

Each item gets one verdict, with its source and the date checked.

1. **Privacy pill behaviour.** The pill's states and wording in `js/siindex-privacy-meter.js`, and that the public pages carry the pill element and load the meter script before the voice core.
2. **Materials presence.** The December materials exist at their paths: `docs/2026-11-12-cook-islands-december-one-pager.md` and `docs/2026-11-12-cook-islands-december-spoken-script.md`. Presence only; checking the facts inside them belongs to other skills.
3. **Console and CSP status.** What the live public pages load and whether the policy they are served with allows what they need (scripts, media, connections). Report errors found, and say which were already known.
4. **Core loaded once.** That the voice core is included once per public page and that its load-once guard is present in `siindex-speak-core.js`.
5. **Known blockers.** Items recorded in the repo as blocking or open that touch the demo, for example in `siindex-operating/AJ-BLOCKERS-RUNBOOK.md` and `siindex-operating/SWARM_BLOCKERS.md`. Report whether each still applies, from the record, not from memory.

## Sources it may use

- The live public site, read with plain page requests only.
- Documented environment checks in the repo.
- The existing verification scripts: `scripts/verify-public-surface.mjs`, `scripts/verify-siindex-voice.mjs` and `scripts/verify-siindex-public-phase-a.mjs`. These read files in a checkout and print pass or fail. Run them only in a scratch copy of the repo, never in a place the report would write into.

## Rules

- **Read-only.** It does not write, edit, rename or delete any file in the repo, does not send email or any message, does not deploy, and does not change any other skill or any page it checks. Why: a demo check must not change the thing being demoed.
- **No live side effects.** It does not type a question into the live site, submit a form, or call the voice endpoint or any other service endpoint. Why: those calls reach the SIINDEX server, use the visitor rate limit, and a check must not leave traces.
- **Skeptic by default.** An item is "ready" only if a source shows it. No evidence of a problem is not evidence of readiness.
- **"Cannot be confirmed", never a guess.** If a source cannot be reached, or the check needs something this skill may not do, the answer is "cannot be confirmed". That includes anything that needs a real phone, a real browser such as Safari, or a real microphone, and anything that needs a question sent to the live site. List those under "Needs AJ". Why: a gap in the evidence means unknown, not ready.
- **Sources only.** The live site, documented environment checks and the existing verification scripts. Memory of how the demo went before is not a source.
- **Do not turn a plan into a claim.** The materials say IN$DEX is at pilot-preparation stage and is not operating a live service. Report any page wording that implies otherwise.
- **List every external lookup.** Each page fetch sends a request outside the device. List each one in the report: the address, and the date. Do not put personal data from the repo or the citizen database into a request.
- **Findings only.** Never present a fix as applied. A suggested fix may be written as a suggestion, marked as not applied.
- **Return only to SIINDEX.** The report goes back to SIINDEX and nowhere else: not to AJ directly, not to a citizen, not to an outside party. SIINDEX is the only voice.

## Done looks like

One report, and nothing else, with:

1. **Checked:** which items, which pages and scripts, and the date of the check.
2. **Items:** one line per item: ready / not ready / cannot be confirmed, with the source and the date checked. For a not ready, what was found.
3. **Count:** how many items were ready, not ready and could not be confirmed.
4. **Needs AJ:** anything only AJ can decide or check by hand, including everything that needs a real device or a live question.
5. **External lookups:** every page fetch made, or "none".

No file is changed, no message is sent, and no other skill is touched.
