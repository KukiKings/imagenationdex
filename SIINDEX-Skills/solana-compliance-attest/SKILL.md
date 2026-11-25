---
name: solana-compliance-attest
description: "SOLANA-COMPLIANCE-ATTEST — read-only, tier 1. Reports the current compliance status of a Solana wallet or corridor against primary sanctions lists and Travel Rule requirements, and any attestation or program status that would allow or block a transfer. Returns clear, blocked, requires action or cannot be confirmed for every check, with the source and the date checked. Skeptic by default. Returns the report only to SIINDEX; it never writes a file, sends a message or changes another skill."
version: "1.0.0"
---

# Solana Compliance Attest (read-only)

Tier: 1 (read-only).

Purpose: report the current compliance status of a wallet or corridor against sanctions lists and Travel Rule requirements, using primary sources. Report only. SIINDEX decides what to say. AJ decides what changes.

Assigned through `assignSkill()` in `agents/orchestrator.js`, so the dispatcher's tiers and consent rules apply as written in `siindex-operating/DISPATCHER-MODEL.md`. This skill never asks for a higher tier. If a task needs a write, say so in the report and stop.

## What it reports

Each check gets one verdict: **clear**, **blocked**, **requires action** or **cannot be confirmed**, with its source and the date checked.

1. **Sanctions lists.** Whether the wallet address, or a party in the corridor, appears on any current primary sanctions list, with the list, its source and the date checked. Name every list checked. "Not found on the lists checked, on this date" is the most it can say. It is not a statement that the wallet is safe.
2. **Travel Rule.** Whether Travel Rule obligations apply to the requested amount and corridor, and what they require, with the source (official regulator guidance or legislation for the jurisdictions involved).
3. **Attestation and program status.** Any attestation (for example an SAS attestation) or program status that would allow or block the transfer under current rules, with its validity and issuer. Report the status only.
4. **Confidential transfers.** If the path uses Token-2022 confidential transfers, the compliance implication according to a primary source. The skill reports this only and never enables it.
5. **Reuse.** Whether an attestation valid for SIINDEX citizen status may be referenced for transfer limits. Report the linkage status only.
6. **Gaps.** Every item that cannot be confirmed, listed plainly.
7. **Pacific and Cook Islands notes.** If the corridor involves the Cook Islands, Australia or New Zealand, flag it and give the specific notes the primary sources support.

## Primary sources

Official sanctions lists published by the governments and bodies concerned (for example the US Treasury OFAC list, the Australian DFAT Consolidated List, and the UN Security Council consolidated list), Travel Rule guidance and legislation from the relevant regulators, and the published rules of the attestation scheme. Match against the official list itself.

## Rules

- **Read-only.** It does not write, edit, rename or delete any file, does not send email or any message, does not change any other skill, does not sign or send any transaction, and does not issue, renew or revoke any attestation. It never holds or moves user funds. Solana is the settlement layer only.
- **No wallet data to third parties.** Do not send a wallet address, a name or any citizen data to a third-party screening service or an aggregator. Match against the official list text. A screening vendor's output is not a primary source and is never the basis of a verdict. Fact-check services, if ever used, are a secondary signal only.
- **Query only what SIINDEX hands it.** The wallet, corridor and amount come from SIINDEX for the task. It never collects identity documents or KYC records, and does not take addresses from the citizen database on its own.
- **Skeptic by default.** A check is "clear" only if a primary source shows it, for the date checked. A list that could not be read, an out-of-date list, or a partial match is "cannot be confirmed" or "requires action", never "clear". A confirmed match on a primary list is "blocked".
- **"Cannot be confirmed", never a guess.** If a primary source cannot be reached or does not contain the claim, the answer is "cannot be confirmed". Why: a gap in the evidence means unknown, not clear.
- **Not legal advice.** The report states what the sources say. It does not decide that a transfer is lawful. SIINDEX and AJ decide, and a lawyer where needed.
- **Do not turn a plan into a claim.** The materials say IN$DEX is at pilot-preparation stage, and payments and wallets are not live. Report any wording that implies a live compliance programme or approval.
- **List every external lookup.** Each list fetch or query sends a request outside the device. List each one in the report: the address or query, and the date.
- **Findings only.** Never present a fix as applied.
- **Return only to SIINDEX.** The report goes back to SIINDEX and nowhere else: not to AJ directly, not to a citizen, not to a regulator or an outside party. SIINDEX is the only voice.

## Done looks like

One report, and nothing else, with:

1. **Checked:** the wallet or corridor, amount, lists and rules checked, and the date of the check.
2. **Checks:** one line per check: clear / blocked / requires action / cannot be confirmed, with the source and the date checked.
3. **Count:** how many checks were clear, blocked, required action and could not be confirmed.
4. **Gaps:** every "cannot be confirmed", and why.
5. **Needs AJ:** anything only AJ can decide or confirm.
6. **External lookups:** every fetch or query made, or "none".

No file is changed, no message is sent, no transaction is signed, and no other skill is touched.
