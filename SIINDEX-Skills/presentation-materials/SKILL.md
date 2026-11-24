---
name: presentation-materials
description: "PRESENTATION-MATERIALS — read-only check of the December 2026 Cook Islands meeting materials (docs/2026-11-12-cook-islands-december-one-pager.md and the spoken script). Invoke to refresh the 'silence' line (the CAWG and bill status) or to confirm the contact details are current. Reports findings only; it never edits a file, sends a message or changes another skill."
version: "1.0.0"
---

# Presentation Materials (read-only)

Goal: tell SIINDEX, with evidence, whether the wording and contact details in the meeting materials are still true. SIINDEX decides what to say. AJ decides what changes.

Tier: 1 (read-only). Assigned through `assignSkill()` in `agents/orchestrator.js`, so the dispatcher's tiers and consent rules apply as written in `siindex-operating/DISPATCHER-MODEL.md`. This skill never asks for a higher tier. If a task needs a write, say so in the findings and stop.

## What it reads

- `docs/2026-11-12-cook-islands-december-one-pager.md`, section "The problem: silence, and a bill under review", and the verification trail at the end of the file.
- `docs/2026-11-12-cook-islands-december-spoken-script.md`, Cut 1 and Cut 2 (the same silence line, spoken), and Cut 7 with the "Closing contact, as written" block.
- Public primary sources named in the verification trail (for example the Office of the Prime Minister page for the working group, and Cook Islands news reports on the bill).

## Tasks it can take

1. **Refresh the silence line.** Compare each factual claim in the one-pager's silence section and in Cuts 1 and 2 with the current public sources. Claims to check: the working group's name, co-chairs and 9 March 2026 start; "within the coming months"; "as of November there is no public update"; the status of the Cryptocurrency Ransomware Suppression Bill ("as of late 2025"); that the Cybercrime Legislation Amendment Bill 2026 is a different bill. Say for each: still true, changed (with the new fact and source), or cannot be confirmed.
2. **Confirm contact details are current.** Read the contact line in the one-pager and the email and phone in the spoken script's closing block. Report whether they match each other and any other place in the repo that shows AJ's contact details. State plainly what it cannot check: whether the mailbox or phone is monitored is something only AJ can confirm.

## Rules

- **Read-only.** It does not write, edit, rename or delete any file, does not send email or any message, and does not change any other skill, the one-pager or the script. Why: the materials are for a government meeting, and every wording change is AJ's decision.
- **Findings only.** Never present a fix as applied. A suggested wording may be quoted as a suggestion, marked as not applied.
- **Primary sources first; no invented sources or facts.** Cite the source and its date for every claim it confirms or changes. If it cannot find a source, the answer is "cannot be confirmed". Why: silence in the evidence means unknown, never a guess.
- **Do not turn a plan into a claim.** The materials say IN$DEX is at pilot-preparation stage and not operating a live service. Report any wording that implies otherwise.
- **Surface external lookups.** Any web search or page fetch sends a query outside the device. List what was looked up in the report's last line. Do not put personal data from the repo or the citizen database into a search.
- **Quote sparingly.** At most one short quote per source, in quotation marks, with attribution.

## Done looks like

One report, and nothing else, with:

1. **Checked:** the file and section or cut checked, and the date of the check.
2. **Findings:** one line per claim: still true / changed / cannot be confirmed, with source and date.
3. **Contact details:** the values found, where, and whether they match.
4. **Needs AJ:** anything only AJ can decide or confirm (for example whether the contact is monitored, or a wording change).
5. **External lookups:** what was searched or fetched, or "none".

No file is changed, no message is sent, and no other skill is touched.
