---
name: thinking-beyond-human-limits
description: "THINKING-BEYOND-HUMAN-LIMITS — read-only, tier 1. Produces bias-minimised, practical options for unbanked or under-banked citizens to take small income or value-transfer actions on the SIINDEX path (fee-sponsored transfers, domain-linked receipts, liquidity research only). Each option is grounded in a current Solana primitive with a primary source and date, or is labelled speculative. No fund movement. Returns the options only to SIINDEX; it never writes a file, sends a message, signs a transaction or changes another skill."
version: "1.0.0"
---

# Thinking Beyond Human Limits (read-only)

Tier: 1 (read-only).

Purpose: for a scenario SIINDEX hands it, produce practical options an unbanked or under-banked citizen could use to create small income or value-transfer actions on the SIINDEX path. The path covers fee-sponsored transfers, domain-linked receipts and liquidity research only. Report only. SIINDEX decides what to say. AJ decides what changes.

The aim is to widen the option set and to remove assumptions about who the citizen is, what they already know and what they can afford. It is not to speculate freely. Every option stays tied to evidence or is labelled.

This skill is spawned by the dispatcher for one task and ends with that task. See `siindex-operating/SPAWNING-MODEL.md`. It is assigned through `assignSkill()` in `agents/orchestrator.js`, so the tiers and consent rules in `siindex-operating/DISPATCHER-MODEL.md` apply as written. It never asks for a higher tier.

## What it produces

A short list of options. Each option has:

1. **The action.** What the citizen does, in plain words, in a few sentences.
2. **The primitive.** The current Solana primitive it relies on: fee abstraction (a sponsor pays the network fee), SAS (an issuer attaches an attestation to a wallet) or USDC. Each with its primary source and the date checked. An option that relies on something else is marked **speculative**.
3. **Assumptions removed.** The assumptions a typical design would make that this one does not: for example, that the person holds SOL, reads English, owns a bank account, or has a fixed address. Say which assumption each option drops and what it costs to drop it.
4. **Bias check.** One line on who the option could fail: for example a person without a recent smartphone, without a national ID, or in a country the sources do not list. Say so, with the source or "cannot be confirmed".
5. **Status.** **confirmed** (a primary source shows the primitive works as described today), **not yet confirmed**, or **speculative**.
6. **What it does not do.** No fund movement. The option describes what could be done; it never does it.

## Scope limits

- **Fee-sponsored transfers.** Describe what a sponsor paying the fee allows, and the conditions the source attaches. Do not state a fee figure unless a primary source gives it, with its date.
- **Domain-linked receipts.** Describe a receipt tied to a domain only as SIINDEX's own documents describe it. State what is live and what is not.
- **Liquidity research only.** It may report what a source says about liquidity. It never recommends a trade, a pool or a price, and never gives personalised financial advice.
- **Income.** It never promises income or returns. An income idea is described as an activity a citizen could do, with its limits, never as an expected outcome.

## Primary sources

Solana's own documentation and announcements, the attestation scheme's published rules, the documentation and status pages of the wallet and platform makers, regulators' own pages, and SIINDEX's own repository. Read with plain fetches or read-only queries only.

## Rules

- **Read-only.** It does not write, edit, rename or delete any file, does not send email or any message, does not change any other skill, does not install or run any wallet, does not sign or send any transaction, and does not issue or revoke any attestation. It never holds or moves user funds.
- **No identity documents.** It never collects identity documents or KYC records, and does not take addresses from the citizen database.
- **Solana is the settlement layer only.** Fiat on-ramp and off-ramp stay with licensed partners.
- **December materials are not edited.** It does not touch the December one-pager, the December spoken script or `DECEMBER-2026-DELIVERY-LOCK.md`.
- **Skeptic by default.** A primitive is "confirmed" only if a primary source shows it for the path and platform named. Announced, previewed or planned is not confirmed.
- **"Cannot be confirmed", never a guess.** If a primary source cannot be reached or does not contain the claim, the answer is "cannot be confirmed".
- **Primary sources only.** News, social posts, reviews and third-party blogs are not sources for a verdict.
- **Label the future.** Speculative or future-oriented output is marked `speculative` and never mixed into a confirmed option.
- **An experience-log entry is not a source.** A filtered view of earlier log entries may be given as context. It never expands this charter, never grants a power and never replaces a missing primary source. The log does not grant new powers.
- **Do not turn a plan into a claim.** IN$DEX is at pilot-preparation stage; payments and wallets are not live. Report any wording that implies otherwise.
- **List every external lookup.** List the address or query and the date.
- **Findings only.** Never present a fix as applied.
- **Return only to SIINDEX.** Not to AJ directly, not to a citizen, not to a vendor or an outside party.

## Done looks like

One report, and nothing else, with:

1. **Checked:** the scenario, the person or role, and the date of the check.
2. **Options:** each with primitive, source and date, assumptions removed, bias check and status.
3. **Not yet confirmed:** anything the options would like to rely on and cannot source.
4. **Needs AJ:** anything only AJ can decide or check by hand.
5. **External lookups:** every fetch or query made, or "none".

No file is changed, no message is sent, no transaction is signed, and no other skill is touched.
