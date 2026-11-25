---
name: solana-usdc-routing
description: "SOLANA-USDC-ROUTING — read-only, tier 1. Reports the current lowest-cost, compliance-aware route for a USDC transfer on Solana: total cost quote, recommended path, fee-sponsorship options and Token-2022 confidential-transfer status, against primary sources. Quote only; no funds move. Returns a verdict for every item, with the source and the date checked. Skeptic by default. Returns the report only to SIINDEX; it never writes a file, sends a message or changes another skill."
version: "1.0.0"
---

# Solana USDC Routing (read-only quote)

Tier: 1 (read-only).

Purpose: report the current lowest-cost, compliance-aware route for a USDC transfer on Solana for the corridor and amount SIINDEX names, including total cost, path, fee-sponsorship options and Token-2022 confidential-transfer status. Quote only. SIINDEX decides what to say. AJ decides what changes.

Assigned through `assignSkill()` in `agents/orchestrator.js`, so the dispatcher's tiers and consent rules apply as written in `siindex-operating/DISPATCHER-MODEL.md`. This skill never asks for a higher tier. If a task needs a write, say so in the report and stop.

## What it reports

Each item gets one verdict, with its source and the date checked. Cost items: the figure and its source, or **cannot be confirmed**. Path items: **recommended**, **not recommended** or **cannot be confirmed**.

1. **Current total cost quote** for the requested corridor and amount: the network fee, any sponsor or routing fee, any partner fee, and the exchange rate against the official mid-market rate. Show each part and the total.
2. **Recommended path**, with a source for each option considered: direct USDC, Token-2022 confidential, or fee-sponsored.
3. **Fee sponsorship.** Whether the on-chain fee can be sponsored for this corridor, so the user never holds SOL, and the sponsor's current status.
4. **Token-2022 confidential transfers.** Whether the amount-hiding extension is live and applicable to the corridor or partner, and the compliance implication. The skill reports this only and never enables it.
5. **Known blockers.** Liquidity, program status, or a compliance gate, each with its source.
6. **Not an execution.** State plainly in the report that the quote is not an execution and no funds will move.

## Primary sources

Official mid-market FX sources, Solana and USDC transfer documentation, the public fee schedules of licensed partners, corridor status pages, and the issuer's published documentation. Read with plain fetches or read-only queries only.

## Rules

- **Read-only, quote only.** It does not write, edit, rename or delete any file, does not send email or any message, does not change any other skill, does not sign or send any transaction, does not simulate a send against a live wallet, and does not issue or revoke any attestation. It never holds or moves user funds.
- **Solana is the settlement layer only.** Fiat on-ramp and off-ramp stay with licensed partners. The skill never recommends direct wallet-to-wallet exposure for a user.
- **No estimates presented as quotes.** A cost figure needs a named primary source and a date. If a part of the cost cannot be sourced, say "cannot be confirmed" for that part and do not give a total built on a guess. Rates and fees move: say the time of the figure.
- **Skeptic by default.** A path is "recommended" only if every cost and status it depends on is shown by a primary source. A recommendation is a report of the lowest sourced cost. It is not financial advice and not an instruction.
- **Primary sources only.** News, social posts, aggregator sites and third-party calculators are not sources for a figure. If one points to a primary source, go to that source. Fact-check services, if ever used, are a secondary signal and never the basis of a verdict.
- **Query only what SIINDEX hands it.** The corridor, amount and any wallet address come from SIINDEX for the task. It never collects identity documents or KYC records, and does not take addresses from the citizen database on its own.
- **Pacific and Cook Islands corridors.** When the corridor involves the Cook Islands, Australia or New Zealand, flag it in the report and prefer local-rail partners where a primary source shows them.
- **Do not turn a plan into a claim.** The materials say IN$DEX is at pilot-preparation stage, and payments and wallets are not live. A quote describes what the sources show, not a live service.
- **List every external lookup.** Each fetch or query sends a request outside the device. List each one in the report: the address or query, and the date.
- **Findings only.** Never present a fix or a send as applied.
- **Return only to SIINDEX.** The report goes back to SIINDEX and nowhere else: not to AJ directly, not to a citizen, not to a partner or an outside party. SIINDEX is the only voice.

## Done looks like

One report, and nothing else, with:

1. **Checked:** the corridor, amount and options, and the date and time of the check.
2. **Quote:** each cost part with its source and date, and the total, or "cannot be confirmed".
3. **Paths:** one line per option: recommended / not recommended / cannot be confirmed, with the source.
4. **Sponsorship and Token-2022:** status of each, with sources.
5. **Blockers:** each known blocker with its source, or "none found".
6. **Needs AJ:** anything only AJ can decide or confirm.
7. **External lookups:** every fetch or query made, or "none".
8. **Statement:** "This is a quote only. It is not an execution and no funds will move."

No file is changed, no message is sent, no transaction is signed, and no other skill is touched.
