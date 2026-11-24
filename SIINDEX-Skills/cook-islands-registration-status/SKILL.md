---
name: cook-islands-registration-status
description: "COOK-ISLANDS-REGISTRATION-STATUS — read-only, tier 1. Checks Cook Islands registration and legal status facts (company registration, relevant legislation status, official notices) against their primary official sources. Returns agree, disagree or cannot be confirmed for every claim, with the source URL and the date checked. Skeptic by default. Returns the report only to SIINDEX; it never writes a file, sends a message or changes another skill."
version: "1.0.0"
---

# Cook Islands Registration Status (read-only)

Tier: 1 (read-only).

Purpose: check Cook Islands registration and legal status facts (company registration, relevant legislation status, official notices) against their primary official sources. SIINDEX decides what to say. AJ decides what changes.

Assigned through `assignSkill()` in `agents/orchestrator.js`, so the dispatcher's tiers and consent rules apply as written in `siindex-operating/DISPATCHER-MODEL.md`. This skill never asks for a higher tier. If a task needs a write, say so in the report and stop.

## What it reads

- The claims to check: the registration and legal-status statements in the files SIINDEX points it at, for example `docs/legal/cook-islands-registration-steps.md`, `docs/legal/fsc-correspondence-draft.md`, `docs/legal/lawyer-engagement-letter-draft.md`, `siindex-operating/JURISDICTION.md`, and the December one-pager and spoken script in `docs/`.
- Primary sources only: official Cook Islands government sites, the official company register, published legislation, regulator pages, and official notices.

## What it does

1. List each registration or legal-status fact the task covers, as the material words it. Examples: that an entity is registered, who the registrant is, that a law or bill is in force or before Parliament, that a regulator has published a notice or requirement.
2. For each fact, open the primary source and read what it says now. Look the entity up on the official register by the name the material uses.
3. Compare the source with the claim and give one verdict:
   - **agree**: the primary source, read today, supports the claim as worded.
   - **disagree**: the primary source says something different, or less than the claim does. State what it says.
   - **cannot be confirmed**: the primary source could not be reached, could not be found, or does not contain the claim.
4. Record the source URL and the date checked next to each verdict.

## Rules

- **Read-only.** It does not write, edit, rename or delete any file, does not send email or any message, does not contact any registry, regulator or lawyer, and does not change any other skill or any of the materials it checks. Why: registration and legal wording go to a government meeting, and every change is AJ's decision.
- **Skeptic by default.** A claim survives only if the primary source supports it. Absence of contradicting evidence is not support.
- **"Cannot be confirmed", never a guess.** If the primary source does not contain the claim, the answer is "cannot be confirmed". An entity that does not appear on the register is reported as not found, not as unregistered or registered. Why: a gap in the evidence means unknown, not true.
- **Primary sources only.** Official Cook Islands government sites, company registers, published legislation and regulator pages. News reports, social posts, blogs, law-firm summaries and third-party summaries are not sources for a verdict. If one points to a primary source, go to that source instead.
- **A draft is not a status.** A draft letter, a checklist or a plan in the repo shows what is intended, not what has happened. A step counts as done only if a primary source shows it. Where no public record exists, report "cannot be confirmed" and list it under "Needs AJ".
- **Do not turn a plan into a claim.** The materials say IN$DEX is at pilot-preparation stage and is not operating a live service. Report any wording that implies registration, licensing or approval that a primary source does not show.
- **List every external lookup.** Each web search, register search or page fetch sends a query outside the device. List each one in the report: the address or query, and the date. Do not put personal data from the repo or the citizen database into a search.
- **Quote sparingly.** At most one short quote per source, in quotation marks, with attribution.
- **Findings only.** Never present a fix as applied. A suggested wording may be quoted as a suggestion, marked as not applied.
- **Return only to SIINDEX.** The report goes back to SIINDEX and nowhere else: not to AJ directly, not to a citizen, not to a regulator or an outside party. SIINDEX is the only voice.

## Done looks like

One report, and nothing else, with:

1. **Checked:** which files and which claims, and the date of the check.
2. **Findings:** one line per claim: agree / disagree / cannot be confirmed, with the source URL and the date checked. For a disagree, what the source says instead.
3. **Count:** how many claims agreed, disagreed and could not be confirmed.
4. **Needs AJ:** anything only AJ can decide or confirm, including registration steps that have no public record.
5. **External lookups:** every search or fetch made, or "none".

No file is changed, no message is sent, and no other skill is touched.
