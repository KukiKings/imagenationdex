# IN$DEX Launch Runway Plan
> Created: 2026-07-16 | Rebuilt: 2026-07-19 (launch moved from 24 Sep 2026 to 24 Jan 2027 — AJ) | Status: ACTIVE — canonical execution plan for the runway to L99
> Anchors: Launch = **24 January 2027** (L99). Today = 22 July 2026. ~27 weeks remaining.
> Reconciles with: roadmap-v2.md (phase dates), phase5-spec.md (Workstream 3 technical steps), cook-islands-establishment-reality-ledger.md (Rarotonga trip + registration)

---

## How to read this document

This is a rebuild, not a date find-and-replace. The original plan had 10 weeks of runway and compressed backend-finish → parameter-lock → mint/LP → test → launch into that window. The runway is now ~27 weeks, and the extra time isn't padding — it's the Cook Islands establishment track (see `cook-islands-establishment-reality-ledger.md`), which genuinely needs months (trustee company engagement, BTIB/FSC/CAWG process, the December Rarotonga trip) and shouldn't be rushed to fit an old date.

The plan below keeps the same work, in the same order, at the same pace, and simply doesn't invent busywork to fill the gap. Backend finishes on roughly its original schedule. Everything downstream of that — parameter lock, mint, LP seeding, the 7-day test, bug-fix buffer, launch readiness — gets moved to sit immediately before the new 24 January 2027 date, where it actually belongs. Token mint and LP seeding specifically should not happen four-plus months before public launch — seeding the pool is effectively the trading-launch moment, so it stays close to L99, not on the old accelerated clock.

**Resolved 2026-07-22 (was an open item):** the mint already happened — 12 July 2026, mint `9p9VMkgTEVdAeohk1zEuepvwBYUkzjnovMwwazyxsSEZ`, 100,000,000 INDX, mint/freeze authority revoked, confirmed directly on Solscan. It is a **plain SPL Token (original Token Program), not Token-2022** — corrected from the earlier assumption below; see whitepaper Appendix A. This means the mint/LP stage (5) shrinks to "seed the Raydium pool" only — no mint step needed.

---

## Stage 1 — Jul 22 to Aug 19, 2026 (4 weeks): Finish the backend

**Done bar:** Vercel deployment live at imagenationdex.com, Supabase backend fully wired (citizens, transactions, waitlist, Wisdom Score), remaining fake-data screens closed out, marketing/community motion visibly underway.

- AJ runs the 5 Terminal commands in phase5-spec.md Workstream 1 to force-push and connect Vercel — the one step only AJ can do.
- Close out the remaining screens in the fake-data sweep.
- Confirm Supabase Workstream 2 tables are fully wired end to end (citizens/transactions/waitlist).
- SIINDEX daily audit confirms the deployment stays clean (no A$, no seed phrase text, no $0.35).
- Start the content cadence (coconut-girl/Mama Noe story, real problem first), open/re-energize the community space, and begin the partner target list (Pacific remittance orgs, community organizations, the embedded-connectivity candidates already identified).

---

## Stage 2 — Aug 20 to Dec 5, 2026 (~15 weeks): Extended runway — marketing, community, and Cook Islands groundwork

This is the stage that didn't exist in the original plan. Three tracks run in parallel, none of them rushed:

**Marketing/community (ongoing):** keep the 2–3 posts/week cadence, grow the Discord/Telegram community, move partner conversations from first-touch toward real terms, draft (don't publish) the press kit.

**Cook Islands groundwork (new — see `cook-islands-establishment-reality-ledger.md`):** engage a licensed Cook Islands trustee company, begin the company name reservation with the Ministry of Justice registry, prepare CAWG submission materials (framed around financial inclusion and compliance-by-design, not a generic crypto pitch — see Part 3 of the reality ledger), and prepare meeting materials for Tayla Jayne Beddoes / Pacific Group AI. None of this requires being physically in Rarotonga yet — that's Stage 3.

**Security hardening (ongoing):** continue the application-layer security review (Supabase RLS/RPC surface, Grid Account MPC flow) in the background rather than compressing it into one week right before mint, as the original plan had it.

**Open decision for AJ:** whether Workstream 3 parameters (initial liquidity size, fee tier) get locked early in this stage or held until closer to Stage 5 below — either works since nothing executes until Stage 6. (Mint authority itself is no longer an open item — resolved 2026-07-22, see above.)

---

## Stage 3 — Dec 6 to Dec 17, 2026: Rarotonga trip

Per `cook-islands-establishment-reality-ledger.md` Part 3/4. Register the Cook Islands entity (citizen rate, confirmed applicable — AJ holds Cook Islands/NZ citizenship), meet Tayla Jayne Beddoes, engage FSC, submit to the CAWG consultation, open a business bank account. **Note:** FSC and FIU close 24 December to 5 January — all regulatory engagement needs to land inside this window or wait until the government reopens in January.

---

## Stage 4 — Jan 5 to Jan 10, 2027 (1 week): Lock Workstream 3 parameters (decision week, no execution)

**Done bar:** every open decision in phase5-spec.md's Workstream 3 table has an answer from AJ in writing, and the mint/seed execution runbook is drafted and ready to run without improvisation.

- Mint authority already confirmed revoked on-chain (see resolved item above) — no sign-off needed for this specific step, only for the LP seeding transaction itself.
- Confirm initial liquidity size (research suggests $15K–$150K real depth is typical), fee tier (0.25%), price range (full range first).
- ~~Resolve the 100M-already-minted question via Solscan~~ — resolved 2026-07-22: already minted, plain SPL Token, confirmed on-chain. Next stage is seed-only.
- Confirm the funding wallet holds sufficient SOL for CLMM pool rent (~0.06 SOL) plus seeding capital plus buffer.
- Write the execution runbook (Raydium CLMM pools are created empty, then liquidity deposited as a separate step).

---

## Stage 5 — Jan 11 to Jan 13, 2027 (3 days): Raydium LP seeding (mint already done)

**Done bar:** INDX already confirmed live on Solana mainnet with correct supply/decimals on Solscan (done 12 Jul 2026), the Raydium CLMM INDX/SOL pool exists and is seeded, LP placed under SIINDEX-managed continuous custody per whitepaper Section 11.6 (no lock, no burn — decided 2026-07-22), and liquidity-pool-setup.html / l99-launch-command.html show the real pool address instead of preview-mode placeholders.

- Mint already done — skip straight to pool creation.
- Create the Raydium CLMM pool (INDX/SOL, 0.25% fee, full range) — Human Validation Zone, AJ signs in Phantom.
- Seed liquidity at the amount locked in Stage 4.
- Place LP under SIINDEX-managed continuous custody (treasury multisig; Flywheel Automation Engine circuit breakers; no burn, no fixed-term lock — see whitepaper 11.6, decided 2026-07-22).
- Verify on Solscan/Raydium; confirm a real swap both ways applies the 98/2 split at the application layer.
- Replace "preview mode" disclosures on liquidity-pool-setup.html and l99-launch-command.html with the real, live data — this is the one moment those disclosures should change, and only once the real thing underneath is actually live.

---

## Stage 6 — Jan 14 to Jan 17, 2027 (4 days): Full-system test (the Mama Noe test)

**Done bar:** a real cohort of real citizens has used the real, fully-wired platform end to end, and every bug found is logged and triaged. Compressed from the original 7 days to fit the new schedule — if more time is needed, it should come out of Stage 2's runway, not by cutting this stage short.

- Recruit a closed beta cohort from the waitlist.
- Test every core flow for real: onboarding → Grid Account → receive → send → swap (against the live pool) → withdraw → P2P marketplace → staking.
- Run PQSI security scans daily through the window.
- Apply the Mama Noe test literally — log friction, not just bugs.
- Keep a single running punch list, triaged by severity.

---

## Stage 7 — Jan 18 to Jan 21, 2027 (4 days): Bug-fix buffer + final security scan

**Done bar:** every critical/high item from Stage 6's punch list is fixed and retested, and a final full PQSI 7-point scan comes back clear platform-wide.

- Fix and retest critical/high bugs.
- Run the final full PQSI security scan across every money-movement screen.
- Re-confirm Transaction Protection coverage ($10,000/month per Grid Account) is active.
- Partner announcements prepared for Stage 8; press embargo timing confirmed.

---

## Stage 8 — Jan 22 to Jan 23, 2027 (2 days): Launch readiness

**Done bar:** formal go/no-go from AJ, partner announcements live, comms countdown running, infra confirmed holding under expected load.

- Formal go/no-go review against a single checklist: backend, token/LP, security scan, beta results, marketing readiness.
- Partner announcements go live.
- Final comms countdown across all channels.
- Re-verify Vercel uptime and Supabase capacity/RLS under simulated load if possible.
- Confirm launch-day monitoring rotation (tighter scan cadence for the first 24–48 hours post-launch).

---

## 24 January 2027 — L99 Launch

Public launch. QR onboarding, DEX/swap, P2P marketplace, and INDX token all live for real. Every "preview mode" or "not connected yet" disclosure added during this build gets removed only once — and exactly when — the real thing underneath it goes live in Stage 5–8. Nothing flips to "real" before the infrastructure behind it actually is.

---

## What this changes in existing docs

- **roadmap-v2.md**: Phase 2/3 date ranges need to be replaced with these eight re-timed stages — not yet done, flagged as open.
- **phase5-spec.md**: Workstream 3's step list needs the Stage 4/5 detail (parameter-lock week separated from execution week, the mint-may-already-be-done branch) re-timed to January — not yet done, flagged as open.
- **indx-launch-strategy-sep24.md**: filename and content are now stale by definition (built entirely around the September 24 date) — needs its own review rather than a mechanical edit, since it likely has strategy content, not just dates.
- **master-plan-v12.5.md**: not yet checked against this new timeline — flagged as open.
