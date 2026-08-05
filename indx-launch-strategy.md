# INDX Grand Synchronicity Launch Strategy
**Launch: 24 January 2027, 00:00 UTC — L 99**
**Status:** research and reasoning CURRENT · **Phase B architecture BLOCKED — see §0**

> ## ⚠️ Provenance — read this first
> **This document is a reconstruction, dated 2026-07-30.** The original `indx-launch-strategy-sep24.md` (346 lines) was deleted in error: AJ asked to remove the stale September date and the whole file was removed instead. `Projects/` is gitignored, so there was no version history and no backup.
>
> **Rebuilt from three surviving sources**, none of them invented:
> 1. `whitepaper-v1.md` Appendix B, entry for Task #20 — a detailed paragraph naming every recommendation, parameter and risk.
> 2. `memory.md` lines 1333–1360 — the research findings, the two-phase recommendation, and the key numbers.
> 3. The "never say / say instead" table and the Doctrine section, captured verbatim before deletion and preserved at `second-brain/canon/never-say.md`.
>
> **What is faithfully recovered:** research findings, venue comparison reasoning, the two-phase architecture, configuration parameters, vesting terms, the risk map, and the key numbers.
> **What is lost and has NOT been reinvented:** the original prose of the "why INDX is different" section, the full venue comparison table layout, and the literal SDK code block. Those are marked below. **Nothing has been fabricated to fill a gap.**

---

## §0 — The blocker the original document never flagged

**Phase B as designed cannot be executed, and this is the most important thing in the file.**

Raydium LaunchLab is a **bonding-curve launchpad for a token that does not yet exist** — it mints into the curve. But **INDX was already minted on Solana mainnet on 12 July 2026**: 100,000,000 fixed supply, 6 decimals, mint and freeze authority revoked, full supply transferred to the protocol wallet.

You cannot put an already-minted, authority-revoked token through a LaunchLab curve. The entire two-phase architecture below assumes a pre-mint launch. That assumption expired on 12 July.

This is why canon §11.6 now specifies **Raydium CPMM** — a standard constant-product pool, seeded with existing tokens, which is the only Raydium venue that can list a token that already exists. `indx-liquidity-strategy.html` and `indx-grand-synchronicity-countdown.html` both already record the Alpha Vault plan as superseded, and both note honestly that **no replacement TGE bootstrapping mechanism has been decided.**

**So the open question is not "which launchpad" — it is "how do citizens get their first INDX at launch, now that a bonding curve is off the table?"** That is a founder decision and it is unresolved. Candidate answers: direct CPMM seeding with a fixed opening price; a whitelist distribution before the pool opens; or an Alpha-Vault-style pre-allocation feeding a CPMM rather than a curve. All three need pricing and fairness decisions only AJ can make.

**Everything below is preserved because the research, the reasoning and the calendar discipline remain genuinely useful.** Read the mechanism sections as *why we chose what we chose and why it no longer applies*, not as an executable plan.

---

## §1 — The one-sentence strategy

Open the civilisation on a date that means something, with liquidity deep enough to be real and a distribution fair enough that no citizen is front-run by a bot.

---

## §2 — Why INDX is different from other launches

*(Original prose lost. The substance, recovered from `memory.md`:)*

LaunchLab's overall graduation rate is **0.62–1.12%** — but that population is meme tokens with no product, no narrative and no community. INDX has a built platform, a stated date, a named audience, and a purpose. The base rate does not describe this case.

**Do not read that as "we will graduate."** It means the base rate is not the right comparison, not that the outcome is secured. The same caution applies to any successor mechanism.

---

## §3 — Research findings

| Finding | Source of the reasoning |
|---|---|
| LaunchLab overtook pump.fun in volume Jul–Aug 2025; became the credible venue | Venue research, Jul 2026 |
| **Virtual-CPMM curve (`curve_type=1`)** gives smoother price continuity at graduation than quadratic | Curve-type comparison — chosen for continuity |
| **LP Burn** is the highest trust signal — irreversible, aggregators flag it as credible | LP disposal policy research (Burn vs Lock vs ToCreator) |
| **Meteora Alpha Vault** is anti-bot and anti-sniper; every participant gets the same average price | Pre-allocation research — the fairness property is the point |
| **Streamflow vesting** with a 12-month founder cliff is now the baseline expectation at any credible 2026 launch, not a differentiator | Vesting research |
| **Jupiter LFG** requires weeks of DAO voting — apply in parallel, never depend on approval | Distribution research |

**The one property worth carrying into any replacement mechanism:** *all participants get the same average price.* That is what makes a launch fair to a citizen who is new to crypto and cannot compete with a sniper bot. Whatever replaces Phase B must preserve it.

---

## §4 — Two-phase architecture *(superseded — see §0)*

**Phase A — Citizen pre-allocation.** Meteora Alpha Vault. Whitelist the IN$DEX community. Anti-bot by construction. Target: 40–50% of the graduation threshold pre-committed before the public curve opens.

**Phase B — Public launch.** Raydium LaunchLab, Virtual-CPMM curve, LP Burn on graduation, 150 SOL graduation threshold, timed to graduate the same day.

**Both phases are blocked by §0.** Phase A's *fairness mechanism* is worth rebuilding on top of a CPMM pool. Phase B is not rebuildable as written.

---

## §5 — Configuration parameters

*(The original SDK code block is lost and has NOT been reconstructed — writing launch parameters from memory would be exactly the kind of fabrication this project has spent two days removing. Recover from Raydium's current documentation at execution time.)*

Recorded values that survive:

| Parameter | Value |
|---|---|
| Curve type | Virtual-CPMM (`curve_type=1`) |
| Graduation threshold | 150 SOL (~$30K USD at the time of writing) |
| LP disposal | Burn — irreversible after graduation |
| Alpha Vault contribution | 60–75 SOL from citizens, pre-committed |
| Public curve requirement | ~75–90 SOL on launch day |

---

## §6 — Team & treasury vesting (Streamflow)

**Founder/team: 12-month cliff, then 24-month linear release, on-chain.** This part is unaffected by §0 and should proceed regardless of the launch mechanism — it is baseline expectation, and the on-chain address is publishable evidence rather than a promise.

See `second-brain/companies/streamflow.md`.

---

## §7 — Pre-launch calendar

The original calendar was paced for a much shorter runway, so its day counts do not transfer.

**Do not re-time this by arithmetic.** `launch-runway-plan-2026.md` is the canonical 8-stage execution plan and already carries the correct dates, including the Rarotonga window (6–17 December 2026) and the FSC/FIU closure 24 December – 5 January. Use that; this section is retained only to record the phase *shape*:

Foundation → narrative and campaign → community build and whitelist → pre-allocation closes and vesting created on-chain → countdown, press and devnet testing → final week → go-live.

**Open scheduling decision (U7):** the marketing cadence was paced for an 89-day sprint and now has roughly 25 weeks. Steady low-key posting from now, or hold most of it and compress closer to January — a real choice, not a find-and-replace.

---

## §8 — Risk map

| Risk | Note |
|---|---|
| SOL price drop | Threshold is denominated in SOL; the USD figure moves under you |
| Pre-allocation underfill | Fewer citizens commit than modelled |
| Mechanism misses the date | Original risk was "curve misses graduation day" — now generalises to any bootstrapping mechanism not being ready |
| Sniper bots | The reason the same-average-price property matters |
| Competing launch | A larger launch the same week takes the attention |
| Post-launch price drop | **Expected and must be said out loud.** See `never-say.md` |
| **Mechanism blocked by prior mint** | **New, and the live one — §0. Was not in the original risk map.** |

---

## §9 — The numbers

| | |
|---|---|
| Graduation threshold | 150 SOL (~$30K USD) |
| Pre-allocation target | 60–75 SOL |
| Public requirement on the day | ~75–90 SOL |
| INDX genesis planning reference | **$0.24 USD** |
| Price target | **None. No price target or return multiple is published or promised.** |

> The original document carried "$0.24 → $2.50 (10.4×)" here and in three other places. **That target was withdrawn by AJ on 2026-07-29** and is registered at `second-brain/canon/retired.json` R002. It is not restored. Grand Synchronicity is a launch event, not a price event.

---

## §10 — What INDX must never say at launch

**Moved to `second-brain/canon/never-say.md`** so it applies to all copy, not just launch copy, and is enforced by `canon-check.py` rather than sitting in one document. Captured verbatim before deletion.

---

## §11 — Doctrine

> The launch is not a fundraise.
> It is proof of civilisation.
>
> Every citizen who joins before the world is watching says: "I believe this is real."
>
> 24 January 2027 is not arbitrary. The 24th carries meaning that is personal to AJ. January was chosen on purpose — when people are back and paying attention, not buried in holiday noise. The world's first Sovereign Digital Civilisation opens on a date that means something, at a moment built for people to actually notice.

*(This replaced the original "on AJ's birthday… because it was always meant to be" framing, which was true of 24 September and is not true of 24 January. Corrected 2026-07-19.)*

**On numerology:** AJ's founder pattern is 5/8/6/9/2 with a missing 4 — liberation, power, protection, humanity, partnership, requiring structure. Fair game for doctrine and campaign copy. **Never a basis for setting a graduation threshold, vesting cliff, price or any other real financial parameter.** Those stay grounded in market reasoning.

---

## §12 — Next decision

**§0 is the blocker.** Until AJ rules on how citizens acquire their first INDX at launch — given the token already exists with authorities revoked — the launch mechanism is undecided. Everything else in this document is preparation for a mechanism that has not been chosen.

---
*IN$DEX · reconstructed 2026-07-30 · supersedes `indx-launch-strategy-sep24.md` (deleted)*
