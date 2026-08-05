# Launchpad Research — Which Venue Can Actually List INDX

**Created:** 2026-07-29
**Question:** which launchpad should INDX launch on?
**Answer:** none of them. The decision was made on 12 July 2026 and nobody recorded why.

---

## The finding that ends the comparison

**INDX already exists.** Mint `9p9VMkgTEVdAeohk1zEuepvwBYUkzjnovMwwazyxsSEZ`, 100,000,000 fixed supply, deployed on Solana mainnet, with **both mint authority and freeze authority revoked on 12 July 2026** — independently verified against mainnet on 22 July.

Every bonding-curve launchpad **mints its own token as part of the launch**. That is not a configuration option; it is how the mechanism works. The curve has to control issuance to price it.

| Venue | Mints its own token? | Usable for INDX |
|---|---|---|
| **Meteora DBC** | Yes — Meteora's own docs state you **cannot create a DBC pool with an existing token** | ❌ Impossible |
| **Raydium LaunchLab** | Yes — a new SPL/Token-2022 mint is created with the specified supply as part of the launch | ❌ Impossible |
| **Pump.fun** | Yes — creates the token on its curve | ❌ Impossible |
| **Raydium CPMM** | **No** — permissionless pool for two existing mints | ✅ **The only viable route** |

To use any launchpad, IN$DEX would have to **abandon the existing INDX mint and issue a second token**. That would mean:

- discarding a verified mainnet deployment with burned authorities — the single strongest trust artefact the project owns;
- reopening the mint-standard question the founder closed on 27 July;
- invalidating the allocation reconciliation currently in progress;
- and explaining to the Financial Supervisory Commission in December why there are two INDX tokens.

**Canon was already right.** Whitepaper Section 11.6, founder decision 2026-07-22: core liquidity is a **Raydium CPMM pool**, treasury-custodied, Flywheel-managed, no lock, no burn. That decision is now confirmed to be not merely a preference but the only architecturally available option. A prior session already spent a full pass correcting Meteora→Raydium drift across three files; this is the reason that correction was right.

---

## What a Raydium CPMM listing actually requires

| Item | Detail |
|---|---|
| Token requirement | Two existing mints — INDX and a quote asset (USDC or SOL) |
| Pool creation cost | ~**0.2 SOL** for rent, token-account creation and priority fees |
| Fee tier | 0.25% default suits most volatile pairs |
| Token-2022 support | Yes (not needed — INDX is plain SPL) |
| Seed liquidity | Whatever the treasury provides. No protocol minimum. |

There is **no minimum liquidity gate**. That is the good news and the trap: nothing stops a pool being created too thin, and Raydium's own documentation warns that very small pools produce severe price impact and a poor user experience.

---

## The $2,000 reality — stated, not advised

The project's own backend already encodes this. The `siindex-website-runtime` system prompt says:

> "Maximum founder self-funded pilot liquidity is approximately USD $2,000. Any such pool would be small, meaning price could move sharply and liquidity could be insufficient."

That is already the honest position and it should not be softened. Mechanically, in a constant-product pool, depth determines slippage: a shallow pool means a single modest sell can move the displayed price a long way, and the first citizens to transact bear that.

**I am not a financial adviser and this document does not recommend a liquidity size, a launch date, or whether to launch at all.** Pool sizing interacts with treasury solvency, the Citizen Protection Reserve, and Cook Islands regulatory obligations. It needs professional input before any capital moves.

---

## 🔴 Sequencing conflict that outranks the venue question

The pasted plan schedules a token launch for **August–October 2026**. Canon says the opposite.

CLAUDE.md, INDX Mint Standard doctrine (AJ, 2026-07-27):

> "**Final release status — still paused**, pending the verification, reconciliation, multisig handover, and legal/tax review named above, plus AJ's final founder acceptance."

So the live position is: **the mint decision is paused, and liquidity actions are paused with it.** Launching a public pool before that pause is lifted would contradict a founder decision made two days ago, and would do it in public, on-chain, irreversibly.

Additional sequencing facts, not opinions:

- The **Cook Islands entity is not yet registered**. A public token sale conducted before the operating entity exists is conducted by AJ personally.
- The **FSC meeting is 10 December**. The CAWG framework is unwritten. Arriving as the person who launched a token into an unformed regulatory framework is a materially different conversation from arriving as the person who waited for it.
- The **Genesis recognition ledger is unreconciled** — and there are currently **two separate 50 INDX rows** for AJ in the database, which nobody had noticed.

---

## Recommendation

**Venue: Raydium CPMM.** Not because it is better, but because it is the only thing that can list an already-minted token. No further launchpad comparison is needed — the category is closed to INDX by its own mint.

**Timing: not a technical decision.** It is gated on the founder pause being lifted, the entity existing, and legal review — none of which are engineering work.

**What can be built now, safely:** the CPMM pool creation path can be written and tested on **devnet** end to end, with real transaction construction and real verification, without a single mainnet action or a dollar of capital. That way the day the pause lifts, the path is proven rather than improvised.

---

## Where "$2.50 · 10.4×" actually came from

Found in the second brain, not invented by a screen: `second-brain/decisions/grand-synchronicity-plan.md`, authored 27 June 2026, marked **"Status: LOCKED"**.

- **Target date: 24 January 2027** — the launch date that was **superseded on 2026-07-19** when AJ moved L99 to 24 January 2027. Appendix B x96 explicitly listed this file as "deliberately left untouched as legitimate historical record" during the site-wide date purge.
- **Price target: INDX $2.50 (10.4x genesis)** `[SUPERSEDED 2026-07-29 — retained as historical record of what this document claimed]` — and the doc's own *Price Catalyst Map* section states plainly: *"INDX reaching $2.50 (10.4×) **requires stacked catalysts**."*

So the figure is not fabricated. It is an **internal, explicitly conditional, catalyst-dependent aspiration, anchored to a launch date that no longer exists.**

That changes the nature of the fix. The problem was never the number — it is that a conditional internal target from a superseded plan propagated into **48 instances of citizen-facing copy as settled fact**, including SIINDEX saying *"I have already calculated the path"* and a deposit screen promising *"10.4× value if held."*

**Correct handling:** `$2.50` stays where it belongs — in the internal planning record, clearly marked conditional and re-dated or retired. It does not belong on any citizen-facing screen, in any form, as any kind of expectation.

---

## Corrections to the pasted plan

| Plan says | Reality |
|---|---|
| "Meteora DBC main launch, $500" | Impossible — DBC cannot use an existing token |
| "Pump.fun test launch, ~$102" | Impossible for INDX, and separately inadvisable (see below) |
| "Launchpad minimum liquidity: Meteora DLMM $5,000" | Moot — none of these can list INDX |
| "August–October 2026 launch" | Contradicts the founder pause of 2026-07-27 |
| "Meteora is the brand fit" | Canon is Raydium CPMM; Meteora drift was corrected 2026-07-23 |

**On the Pump.fun "test launch":** the plan proposes marketing a throwaway token to the IN$DEX community, then taking profits to fund the real launch — while itself citing a **0.198% graduation rate**. Beyond being technically impossible for INDX, this asks the project's earliest believers, explicitly described elsewhere in canon as the unbanked, to fund the founder through a near-certain loss. It contradicts the 98/2 doctrine and the standing ban on FOMO and rug-pull mechanics, and it would be discoverable by the FSC in December. **Not built, not recommended, and not something an agent should execute on a founder's behalf.**
