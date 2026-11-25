---
name: solana-sas-onboarding
description: "SOLANA-SAS-ONBOARDING — read-only, tier 1. Checks progressive KYC and Solana Attestation Service (SAS) status for a user or corridor (attestation present, valid until date, issuer, sanctions-clear claim, reusable for the SIINDEX citizen profile) against primary sources. Returns valid, invalid, missing or cannot be confirmed for every item, with the source and the date checked. Skeptic by default. Returns the report only to SIINDEX; it never writes a file, sends a message or changes another skill."
version: "1.0.0"
---

# Solana SAS Onboarding (read-only)

Tier: 1 (read-only).

Purpose: check progressive KYC and Solana Attestation Service (SAS) status for a user or a corridor: whether an attestation is present, its valid-until date, its issuer, whether it carries a sanctions-clear claim, and whether it can be reused for the SIINDEX citizen profile. SIINDEX decides what to say. AJ decides what changes.

Assigned through `assignSkill()` in `agents/orchestrator.js`, so the dispatcher's tiers and consent rules apply as written in `siindex-operating/DISPATCHER-MODEL.md`. This skill never asks for a higher tier. If a task needs a write, say so in the report and stop.

## What it checks

Each item gets one verdict: **valid**, **invalid**, **missing** or **cannot be confirmed**, with its source and the date checked.

1. **Attestation present.** Whether an attestation exists for the wallet or user SIINDEX names, under the schema and issuer SIINDEX names.
2. **Valid until.** The expiry the attestation carries, and whether it has passed on the date checked.
3. **Issuer.** Who issued it, and whether that issuer is listed by the SAS documentation or the issuer's own published documentation.
4. **Schema.** That the attestation uses the official SAS schema it claims, and which fields it carries.
5. **Sanctions-clear claim.** Whether the attestation carries a sanctions-clear claim, who made it, and when. This skill reports what the attestation says and who says it. It does not screen anyone itself.
6. **Progressive KYC level.** Which level the issuer's documentation says the attestation represents, if the documentation says.
7. **Reuse for the SIINDEX citizen profile.** Whether the attestation, as issued, can be referenced for SIINDEX citizen status and transfer limits. Report the linkage status only. Do not link, write or change anything.

## Primary sources

- Solana Attestation Service documentation and the official SAS schemas.
- The issuer's own published documentation.
- On-chain attestation status, where it is publicly queryable, read with read-only queries only.

## Rules

- **Read-only.** It does not write, edit, rename or delete any file, does not send email or any message, does not sign or send any transaction, does not create, renew or revoke any attestation, and does not change any other skill. Why: an attestation is a statement about a person, and issuing or changing one is not a reporting job.
- **No personal data collected.** It never asks for, stores or reports identity documents or KYC records. It reads attestation status only. It queries only the wallet address or user reference SIINDEX hands it for the task, and lists that query in the report. Do not take addresses from the citizen database on its own.
- **Skeptic by default.** An item is "valid" only if a primary source shows it. An attestation that is expired, revoked, from an unlisted issuer, or on an unofficial schema is "invalid". No evidence either way is not "valid".
- **"Cannot be confirmed", never a guess.** If a primary source cannot be reached or does not contain the claim, the answer is "cannot be confirmed". "Missing" means the source was read and no attestation is there.
- **Primary sources only.** The documents above. Blog posts, social posts, exchange summaries and third-party dashboards are not sources for a verdict. If one points to a primary source, go to that source. Fact-check services, if ever used, are a secondary signal and never the basis of a verdict.
- **Solana is the settlement layer only.** Fiat on-ramp and off-ramp stay with licensed partners. This skill never recommends direct wallet-to-wallet exposure for a user.
- **Reuse rule.** An SAS attestation that is valid for SIINDEX citizen status may be referenced for transfer limits. The skill reports the linkage status only.
- **Pacific and Cook Islands priority.** When the corridor involves the Cook Islands, Australia or New Zealand, flag it in the report, and note local-rail or local-partner attestations where a primary source shows them.
- **Do not turn a plan into a claim.** The materials say IN$DEX is at pilot-preparation stage, and payments and wallets are not live. Report any wording that implies a live attestation, KYC or payment service.
- **List every external lookup.** Each documentation fetch and each on-chain query sends a request outside the device. List each one in the report: the address or query, and the date.
- **Findings only.** Never present a fix as applied. A suggested step may be written as a suggestion, marked as not applied.
- **Return only to SIINDEX.** The report goes back to SIINDEX and nowhere else: not to AJ directly, not to a citizen, not to an issuer or an outside party. SIINDEX is the only voice.

## Done looks like

One report, and nothing else, with:

1. **Checked:** which user or corridor, which items, and the date of the check.
2. **Items:** one line per item: valid / invalid / missing / cannot be confirmed, with the source and the date checked. For an invalid, what was found.
3. **Count:** how many items were valid, invalid, missing and could not be confirmed.
4. **Needs AJ:** anything only AJ can decide or confirm.
5. **External lookups:** every fetch or query made, or "none".

No file is changed, no message is sent, no transaction is signed, and no other skill is touched.
