# IN$DEX BUILD_LOG

Audit trail for the Nov 30, 2026 completion push (private pilot target: December 2026,
public launch target: 24 February 2027). One entry per completed task, in the priority
order set by the god-mode build plan. This log is the source of truth for what's
actually done vs. still open — cross-reference `memory.md` for the fuller session-by-
session narrative; this file is the flat, scannable checklist.

Format per entry: `[date] TASK — outcome. Evidence.`

---

## Baseline — 4 Sep 2026 (start of this build plan)

Full honest inventory delivered to AJ this date (see chat history / memory.md for the
complete version). Summary of what's real vs. not, as verified directly against the
live codebase and Supabase project (zljgthfzbalsunuoohcd):

**Built and live:** Tier 0 KYC (phone/email signup, `create_onboarding_citizen`),
remittance as a Postgres ledger (`transfer_indx` — real fraud/risk checks, real
Approval Gateway integration, no on-chain settlement), Approval Gateway (14 risk-class
≥3 actions gated, verified), transaction history UI (`history.html`, real `transactions`
table), citizen dashboard (`citizen-dashboard.html`, real RPC calls), SIINDEX Q&A and
Voice (both fixed and CI-verified this cycle), Supabase infra (82 tables, RLS enabled
on all of them), Vercel deploy (CI-driven, confirmed live).

**Not built / simulated only:** INDX SPL token (placeholder mint address in
`js/indx-wallet.js`), on-chain lending/AMM/LP (all Postgres simulations, no Solana
program calls), Tier 1 KYC (no government-ID verification exists — the only
tier-advancing function, `verify_payid_tier2`, is misnamed and only reaches tier 1),
Tier 2 KYC (not built at all, 0 citizens have ever reached it), Metaplex/NFT identity
(none — `token-detail.html` claims Metaplex Bubblegum receipts that don't exist in
code), the 7-agent SI2SI swarm (only Remittance Agent is real and deployed; an "Agent
Bus" exists — `siindex-agent-dispatch`/`-claim`/`-complete` — but has processed exactly
1 task ever; the rest are an illustrative, explicitly-non-live roster UI in
`siindex-agents.html`).

**Legal/regulatory (outside code, tracked here for visibility):** Cook Islands
registration in progress, not filed (registry account application submitted
2026-07-29, Form A-1 not yet filed). No legal counsel retained. No FSC correspondence
sent (a Dec 10 meeting is referenced but not sourced to a booking record).

**Known live bugs / false claims at baseline** (see Priority 1 below):
`token-detail.html` (false Metaplex claim), `app-lock.html` (undisclosed fake
biometric + shared demo PIN), `limit-orders.html` (fake order-book depth chart,
undisclosed), `l99-launch-command.html` (fake citizen injection, undisclosed but
founder-only), `siindex-sovereign-embodiment.html` (undisclosed Math.random() ticker),
`verify_payid_tier2` (misnamed Postgres function — name says tier 2, sets tier 1).

Screen census: 286 `.html` files total (not 264). 104 have verified real Supabase
calls. 26 individually confirmed partial/broken. 2 confirmed stubs. ~248 not
individually read line-by-line — flagged as an honest gap, not silently assumed clean.

---

## Priority 1 — Critical Fixes — DONE, all 7 items, 4 Sep 2026

**Correction to the baseline inventory above, found while doing this work**: 3 of
the "top 5 most broken screens" the earlier audit sub-agent flagged as *undisclosed*
fake data actually already had on-screen disclosure that the agent missed —
`app-lock.html` (a visible "🚧 Prototype re-entry check" line above the biometric
button), `limit-orders.html` (a "(illustrative — no live order book)" label on the
depth-chart section title), and `l99-launch-command.html` (three separate honest
labels: "Simulated preview", an explicit 🚧 disclosure line, and "(simulated)" on
the counter itself). I verified each by reading the actual file rather than trusting
the sub-agent's report — worth recording so this log doesn't repeat an inaccurate
claim about the codebase. Real work still done on all three below; only the "was it
disclosed at all" framing was wrong.

1. **token-detail.html — false Metaplex Bubblegum / mainnet claim.** The About text
   claimed "Built on Solana... verified via mainnet" with "compressed NFT receipts
   via Metaplex Bubblegum" — neither is true (no INDX mint exists, no Metaplex code
   exists anywhere in the repo). Rewrote the paragraph to state the real current
   status: balances live in the app's ledger today, the SPL token is planned but not
   deployed, no NFT receipts exist.
2. **app-lock.html — biometric button copy overclaimed beyond its own disclosure.**
   The page-level disclosure was already honest, but the button itself still said
   "Use Face ID" / "Tap to scan your face" / "Scanning… Hold still" — language that
   implies real camera hardware regardless of the disclosure above it. Renamed to
   "Quick unlock" / "confirm it's you (prototype check)" throughout. Separately,
   replaced the single hardcoded `DEMO_PIN = '123456'` shared by every citizen with
   a real per-device PIN the citizen sets on first use (stored in localStorage) —
   not a server-verified secret (same non-security-boundary caveat as before, this
   screen sits in front of an already-authenticated session), but no longer a
   password every citizen and device has in common.
3. **limit-orders.html — depth chart disclosure was present but easy to miss.**
   Added a second, plainer caption directly under the chart itself ("These prices
   and sizes are a mockup, not real market data") so the disclosure survives even
   if the small section-title label above is skipped.
4. **l99-launch-command.html — already adequately disclosed.** No code change
   needed; confirmed the existing three-layer disclosure ("Simulated preview" badge,
   an explicit 🚧 line, "(simulated)" on the counter) already meets the bar. Logged
   here so the correction is on record.
5. **siindex-sovereign-embodiment.html — real violation, fixed.** A 10-node
   "pattern ticker" invented a 0–100 value per concept word (Voice, Presence, Trust,
   etc.) via `Math.random()` and animated it up/down every ~950ms like a live
   crypto tape, with genuinely zero on-page disclosure anywhere in the file. Since
   none of these ten labels have any real underlying metric, added no disclosure
   banner (there'd be nothing true to disclose) — removed the fabricated
   value/arrow/percentage entirely. The ticker is now a static, honest symbol+label
   scroll with no invented numbers.
6. **verify_payid_tier2 — real naming/logic mismatch, fixed on the live DB.** The
   deployed Postgres function was named "tier2" but only ever set
   `citizens.kyc_tier = 1`. Renamed to **`verify_payid`** (not `upgrade_tier1` as
   the build plan literally suggested — see reasoning below), tested via a
   rollback-safe transaction first, then applied as a tracked migration
   (`rename_verify_payid_tier2_to_verify_payid`), old function dropped, the one
   real call site (`sovereign-verify.html`) migrated and verified.
   **Deliberate deviation from the literal instruction, and why**: the build plan
   said to rename it to `upgrade_tier1`, but that plan's own Week 2 section defines
   "Tier 1 KYC" as real government-ID verification — a separate, more rigorous,
   not-yet-built feature. Naming this lightweight PayID-confirmation function
   `upgrade_tier1` would have collided with that upcoming feature's name. Used
   `verify_payid` instead (no tier number in the name) and flagged below that
   `kyc_tier`'s integer ladder itself may need real redefinition once Tier 1
   (gov ID) and Tier 2 (address/SOF) actually exist — not decided here, this was a
   naming fix only, not a schema redesign.
7. **js/indx-wallet.js — INDX_MINT_ADDRESS comment strengthened.** The placeholder
   was already safely guarded (getINDXBalance() never queries it pre-TGE), so no
   behavior changed. Expanded the comment to spell out exactly what breaks (every
   citizen's on-chain balance silently reads 0) if this isn't replaced with a real
   mint address before 2027-02-24.

**Verification for all 7**: `node --check` clean on every touched file's inline
scripts. The two DB-level changes (verify_payid rename) were tested in a
rolled-back transaction before being applied as a real tracked migration, then
re-verified live (`select proname from pg_proc where proname in (...)` confirms
old name gone, new name present). No other call sites reference the old RPC name
anywhere in the repo (repo-wide grep, confirmed clean except one historical
fix-log comment describing a past bug, correctly left untouched since it's
documenting history, not a live call).

**Open decision flagged, not resolved**: `citizens.kyc_tier`'s integer meaning
(0 = signup, 1 = PayID today) will need a real decision once government-ID
verification (Tier 1 per AJ's framework) is built next — does gov-ID verification
become tier 2, or does PayID confirmation get folded into tier 0/1 differently?
Proceeding to Week 2 (Tier 1/2 KYC) will surface this concretely; noting it here
rather than guessing a schema now.

---
