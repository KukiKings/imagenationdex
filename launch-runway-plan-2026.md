# IN$DEX Launch Runway Plan
> Created: 2026-07-16 | Status: ACTIVE — canonical execution plan for the 70 days to L99
> Anchors: Launch = 24 September 2026 (L99). Today = 16 July 2026. 70 days / 10 weeks remaining.
> Reconciles with: roadmap-v2.md (phase dates), phase5-spec.md (Workstream 3 technical steps)

---

## How to read this document

Seven stages, each with a fixed date range, a single "done" bar, and the concrete steps to hit it. Stages 1–4 are build/decision work. Stage 5 is the live test. Stages 6–7 are stabilize-and-launch. Marketing and partnerships run underneath the whole runway, not as a separate final stage — starting them late is the single most common mistake in comparable launches, and we don't have the slack to make it.

**Open item to resolve before Stage 4:** AJ has said 100,000,000 INDX already exists in the IN$DEX wallet. If the SPL Token-2022 mint already happened, Stage 4 shrinks to "seed the Raydium pool" only — a smaller, lower-risk operation than a full mint+seed. This needs a Solscan confirmation from AJ before Stage 2 locks final parameters, since this sandbox has no way to independently verify on-chain state (no POST-capable Solana RPC access — logged gotcha #3b). Until confirmed, this plan carries both paths.

---

## Stage 1 — Jul 16 to Aug 13 (4 weeks): Finish the backend, start the runway clock

**Done bar:** Vercel deployment live at imagenationdex.com, Supabase backend fully wired (citizens, transactions, waitlist, Wisdom Score), remaining fake-data screens closed out, and marketing/partnership motion visibly underway — not launched, but moving.

Build side:
- AJ runs the 5 Terminal commands in phase5-spec.md Workstream 1 to force-push and connect Vercel — this is the one step only AJ can do (git push blocked in-sandbox).
- Close out the remaining screens in the x13 fake-data sweep (liquidity-pools.html and liquidity-pool-setup.html are mid-fix now; microloan.html, bridge.html, and the rest of the confirmed 37 follow the same pattern).
- Confirm Supabase Workstream 2 tables are fully wired to the real screens (citizens/transactions/waitlist — largely done this session; verify waitlist.html and onboarding-flow.html insert correctly end to end).
- SIINDEX daily audit confirms the Vercel deployment stays live and clean (no A$, no seed phrase text, no $0.35).

Marketing/partnerships side (start now — this is the top of the recommended 8–12 week pre-launch window):
- Stand up a content cadence: 2–3 posts/week across whatever channels IN$DEX already has a presence on, built around the coconut-girl/Mama Noe story — real problem first, product second.
- Open or re-energize the Discord/Telegram community space; recruit 1–2 trusted early citizens as community moderators.
- Build the partner target list: Pacific Island remittance orgs, community organizations in Vanuatu/Cook Islands/Fiji/Samoa, and — separately — the embedded-connectivity candidates already identified in the Sovereign Embedded Connectivity charter (1GLOBAL, Mobilise, Gigs), since those RFIs are already a 2026 to-do.
- Send first-touch outreach to that list. Nothing needs to close yet — Stage 3 is when LOIs get finalized.
- Draft (don't publish) the press kit and founder-story angle so it's ready to hand to journalists in Stage 5–7.

---

## Stage 2 — Aug 14 to Aug 20: Lock Workstream 3 parameters (decision week, no execution)

**Done bar:** every open decision in phase5-spec.md's Workstream 3 table has an answer from AJ, in writing, and the mint/seed execution runbook is drafted and ready to run without improvisation in Stage 4.

- Confirm mint authority: multisig (Grid Account / Squads v4, 2-of-3) per the existing recommendation — this is a Human Validation Zone, AJ signs off explicitly.
- Confirm initial liquidity size for the Raydium pool. Research suggests $15K–$150K of real depth is typical for a launch of this kind; AJ decides based on available capital, informed by the wallet's actual real balance (verify via Solscan, not assumed).
- Confirm fee tier (0.25% is the existing recommendation, standard for a new pair), price range (full range first, per spec), and freeze authority (disabled post-mint — sovereignty principle, already agreed).
- Get the Solscan confirmation on the 100M INDX question resolved here — this determines whether Stage 4 is "mint + seed" or "seed only."
- Confirm the Phantom wallet that will fund the LP seeding actually holds sufficient SOL for CLMM pool rent (~0.06 SOL) plus the seeding capital plus a buffer.
- Write the execution runbook: exact sequence of actions for Stage 4, so that day is "run the checklist" rather than "figure it out live." Raydium CLMM pools are created empty, then liquidity is deposited as a separate step — the runbook should reflect that two-step shape.
- Partnership track: move from first-touch to real conversations; start drafting LOI terms for whichever partners are responding.

---

## Stage 3 — Aug 21 to Aug 27: Security pass + partnerships finalized

**Done bar:** the platform has had a real security review pass (not just the standing PQSI scan cadence), and partnership agreements are signed and embargoed for announcement.

- Run a focused security review of everything that touches real money movement: the Supabase RLS/RPC layer (the whole surface fixed this session — bill-pay, ATM, withdraw, etc.), the Grid Account MPC flow, and the mint/seed runbook from Stage 2. This project doesn't have a custom on-chain program (SPL Token-2022 is the standard program), so the audit scope is the application layer and the execution runbook, not a smart-contract audit in the traditional sense.
- Confirm all Seven Security Laws from security-canon.md are holding: no 98/2 bypass path exists anywhere in the code fixed this session, Grid Account recovery still requires 2-of-3, T4 halt logic still has no auto-resume.
- Finalize and sign partnership LOIs. Aug 24 is exactly one month before launch — the research-recommended window for having partnerships locked ahead of announcement.
- Prepare (don't publish) partner announcement content, timed to go live in Stage 7.
- Continue the content/community cadence from Stage 1.

---

## Stage 4 — Aug 28 to Sep 3: Token mint (if needed) + Raydium LP seeding

**Done bar:** INDX is confirmed live on Solana mainnet with correct supply (100M) and decimals on Solscan, the Raydium CLMM INDX/SOL pool exists and is seeded, LP is locked per the existing 12-month Streamflow policy, and liquidity-pool-setup.html / l99-launch-command.html are updated with the real pool address instead of preview-mode placeholders.

- If the mint hasn't happened yet: mint INDX on mainnet via SPL Token-2022 using the parameters locked in Stage 2. Technically this is fast — most tokens are live within 30–60 seconds of signing — so the runbook, not the mint itself, is what takes care.
- If the 100M is already minted (per AJ, likely): skip straight to pool creation, using the runbook from Stage 2.
- Create the Raydium CLMM pool (INDX/SOL, 0.25% fee, full range) — this is a Human Validation Zone, AJ signs in Phantom.
- Seed liquidity from AJ's Phantom wallet at the amount locked in Stage 2.
- Lock LP per the standing 12-month Streamflow policy (already a security constant, not a new decision).
- Verify: token visible on Solscan with correct supply/decimals; pool visible on Raydium with correct pair and fee tier; a real 1 SOL → INDX swap and back confirms the 98/2 split is applied at the application layer (on-chain enforcement isn't in scope for this launch, per phase5-spec.md — documented, not hidden).
- Update liquidity-pool-setup.html's success screen and l99-launch-command.html's pool-stats display to point at the real, now-live pool — this is the moment the "preview mode" disclosures added this session get replaced with real data.

---

## Stage 5 — Sep 4 to Sep 10: 7-day full-system test (the Mama Noe test)

**Done bar:** a real cohort of real citizens has used the real, fully-wired platform end to end — real onboarding, real Supabase balance, real swap against the real live pool, real withdraw, real P2P marketplace — and every bug found is logged and triaged.

- Recruit a closed beta cohort from the waitlist — real people, weighted toward the actual target demographic where possible, not just internal testers.
- Test every core flow for real: onboarding → Grid Account setup → receive → send → swap (against the now-live pool) → withdraw → P2P marketplace → staking. Every one of these was touched this session; this is where the fixes get proven under real use rather than test-citizen SQL.
- Run PQSI security scans daily through the window (this matches the standing "security every 6h" cadence, just watched more closely during the test).
- Apply the Mama Noe test literally: does someone with no crypto background understand what's happening at every step? Log friction, not just bugs.
- Keep a single running punch list, triaged by severity, so Stage 6 starts with a clear queue instead of a scramble.

---

## Stage 6 — Sep 11 to Sep 17: Bug-fix buffer + final security scan

**Done bar:** every critical and high-severity item from Stage 5's punch list is fixed and retested, and a final full PQSI 7-point scan comes back clear across the whole platform.

- Fix critical/high bugs from the Stage 5 punch list; retest each fixed flow specifically (not just a full regression pass).
- Run the final full PQSI security scan — all 7 pre-flight checks, across every money-movement screen.
- Re-confirm Transaction Protection coverage ($10,000/month per Grid Account) is active and correctly wired.
- Marketing: this is inside the ideal 6–8-week public-announcement window (Sep 17 is exactly one week before launch) — press embargo lifts, KOL activation begins in earnest.

---

## Stage 7 — Sep 18 to Sep 23: Launch readiness week

**Done bar:** a formal go/no-go from AJ, partner announcements live, comms countdown running, and infra confirmed holding under expected load.

- Formal go/no-go review with AJ against a single checklist: backend, token/LP, security scan, beta results, marketing readiness.
- Partner announcements go live (the embargo prepared in Stage 3).
- Final comms countdown across all channels.
- Re-verify Vercel uptime and Supabase capacity/RLS one more time under simulated load if possible.
- Confirm launch-day monitoring rotation — likely a tighter scan cadence than the standing 6-hourly default for the first 24–48 hours post-launch.

---

## Sep 24 — L99 Launch

Public launch. QR onboarding, DEX/swap, P2P marketplace, and INDX token all live for real. Everything built and disclosed as "preview mode" or "not connected yet" across this session's fixes gets its honest disclosure removed only once — and exactly when — the real thing underneath it goes live in Stage 4–7. Nothing flips to "real" before the infrastructure behind it actually is.

---

## What this changes in existing docs

- **roadmap-v2.md**: Phase 2/3 date ranges get replaced with these seven concrete weekly stages.
- **phase5-spec.md**: Workstream 3's step list gets the Stage 2/4 detail (parameter-lock week separated from execution week, the mint-may-already-be-done branch noted).
