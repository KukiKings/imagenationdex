# IN$DEX Private Pilot Plan — December 2026

**Status:** Draft, not yet executed. Written against the real codebase and the live
Supabase project (`zljgthfzbalsunuoohcd`) as of 5 Sep 2026, cross-referenced with
`BUILD_LOG.md`. Where this plan proposes something that does not exist yet, it says
so explicitly. Nothing in Sections 1–4 assumes a capability BUILD_LOG.md does not
confirm is real.

**Context this plan assumes:** single founder (AJ), very limited capital, no legal
counsel retained, Cook Islands registration in progress but not filed, no support
team, no on-chain INDX token. Public launch target is 24 Feb 2027 — this pilot is
explicitly a pre-launch, invite-only rehearsal, not a soft launch.

---

## 0. What "real" means in this document

Verified live during this session, not assumed from prior docs:

| Check | Result |
|---|---|
| `public.waitlist` row count | **3** (confirmed via `select count(*)`, not the cached estimate) |
| `public.citizens` row count | **16** |
| `citizens.kyc_tier` distribution | 14 at tier 0, 2 at tier 1, **0 at tier 2** |
| `public.transactions` row count | **19** |
| Waitlist RLS policies | `anyone can join waitlist` (INSERT, public), `citizens can view own waitlist row` (SELECT), `founder_reads_waitlist` (SELECT) — all live |
| Referral/invite RPCs on the DB | `join_founding_waitlist`, `join_waitlist`, `link_waitlist_to_session`, `create_instant_invite`, `fulfill_instant_invite`, `get_instant_invite_status`, `get_waitlist_count`, `waitlist_stats`, `create_onboarding_citizen` — all present as real Postgres functions |

The waitlist is not empty (BUILD_LOG's "0 real signups at last check" is now stale by
3 rows), but it is still tiny — one of the 3 real rows is AJ's own founder-account
entry. **This plan treats the pilot cohort as founder-sourced outreach, not
waitlist-scale demand**, because 3 signups cannot responsibly be read as pilot-ready
demand on their own. See Section 2.

---

## 1. Pilot goals and success criteria

**Goal:** Prove that a real stranger — not AJ, not a test account — can go from zero
to a completed remittance inside the actual production app, using only what's
genuinely live today, with no critical bug and no moment where the app claims a
capability it doesn't have.

This is a **functional and trust** pilot, not a growth or revenue pilot. Success is
defined as a checklist, not a vibe:

**Primary success criteria (all must be true by pilot close):**
1. **≥10 distinct real citizens** (new `auth_user_id`s, not AJ's own test accounts)
   complete Tier 0 signup (`create_onboarding_citizen`) end-to-end on their own
   device, unassisted after the first walkthrough.
2. **≥8 of those 10** complete Tier 1 (PayID, `verify_payid`) — this is the tier
   that actually exists and does something (unlocks the transfer-limit exemption
   in `transfer_indx`), so it's the honest bar, not Tier 2 (which BUILD_LOG confirms
   is a document-type mock with no real ID check — fine to offer, wrong to treat as
   the success bar for "real" verification).
3. **≥5 real peer-to-peer transfers** move through `transfer_indx` between pilot
   citizens (not founder-seeded test transactions), each passing the real fraud/risk
   checks and, where risk-class ≥3, the real Approval Gateway — and each visible
   correctly in the citizen's own `history.html`.
4. **Zero unresolved Sev-1 bugs** at pilot close, where Sev-1 = data loss, a citizen
   able to see or move another citizen's funds/data, or the app stating something
   false about money moving (e.g., implying an on-chain transfer occurred). A Sev-1
   found mid-pilot is fixed or the affected flow is pulled before the pilot ends —
   not carried forward as a known issue.
5. **Zero citizen-reported instances** of "I thought X was real and it wasn't" for
   anything marked Coming Soon/prototype in Section 3 — i.e., the disclosure
   language actually works on people who aren't already insiders. Tracked by
   directly asking each pilot citizen this question in the exit conversation
   (Section 4/5), not inferred.

**Secondary / stretch criteria (nice to hit, not required for "success"):**
- At least one citizen tries SIINDEX Q&A or Voice unprompted and it answers
  correctly about what is/isn't live (this is the actual product test of the
  Q&A/Voice system's honesty layer, which BUILD_LOG confirms was fixed and
  CI-verified this cycle).
- At least one citizen reaches Tier 2 (government-ID mock) and their exit feedback
  confirms they understood, from the on-screen copy alone, that it's a prototype
  check and not real ID verification (`sovereign-verify.html` already carries this
  copy — this stretch goal tests whether it actually lands).

**Explicitly NOT a success criterion:** total signups, INDX price, on-chain
anything, or media/press. The INDX SPL token has no real mint address
(`js/indx-wallet.js`) and is not expected to exist by December — the pilot must be
designed to fully succeed on the Postgres ledger alone.

---

## 2. Cohort size and invitation mechanism

### What actually exists to build this on

- `public.waitlist` (3 rows today, columns: `id`, `name`, `contact`, `region`,
  `referral_code`, `referred_by`, `queue_position`, `created_at`, `auth_user_id`) —
  real table, real RLS, fed by the real `join_founding_waitlist` RPC called from
  `founding.html`.
- `create_instant_invite(p_referrer_id, p_amount_indx)` /
  `fulfill_instant_invite(p_invite_code, p_new_citizen_id)` — a real, already-deployed
  referral mechanism: an existing citizen generates a one-time 8-character code
  attached to a pledge of their own ledger `indx_balance`; a new citizen redeeming it
  gets that balance transferred via a real `transactions` row. This is a genuine,
  working P2P invite-with-incentive flow — but it requires the *inviter* to already
  be an onboarded citizen with a nonzero ledger balance, so it's a fan-out mechanism
  for after the first cohort is seeded, not a way to source the first 10–15 people.
- `waitlist.referred_by` / `referral_code` — the waitlist itself already supports
  referral chains (row 2 and 3 of the real data are both `referred_by` row 1's code).

**What does not exist:** any notion of "pilot cohort," "invited," or "onboarded from
waitlist" on the `waitlist` table itself — there's no status column distinguishing
"signed up" from "actually invited to the pilot" from "converted to a citizen."
Today that gap is bridged only by `link_waitlist_to_session`, which links a waitlist
row to an auth session after the person separately signs up — it does not track
pilot-specific invitation state.

### Recommendation: founder-sourced direct invitation, not a waitlist drawdown

Given 3 real waitlist rows, treating the waitlist as the pilot's recruitment source
would either produce a 3-person pilot or force inventing demand that isn't there.
Instead:

1. **Cohort size: 15–25 people**, personally invited by AJ (family, Pacific diaspora
   contacts, trusted early testers) — small enough for one founder to personally
   walk through onboarding and personally notice when something breaks, large
   enough to hit the ≥10-signup / ≥5-transfer success bar in Section 1 with some
   margin for drop-off.
2. **Every invitee is still routed through the real `founding.html` →
   `join_founding_waitlist` flow first**, so the real waitlist keeps being the single
   source of truth for "who has expressed interest," rather than a parallel
   spreadsheet. AJ sends each person a personal message with the link and a short
   explanation that this is an invite-only test, not a public opening.
3. **Proposed, not yet built:** a single nullable column,
   `waitlist.pilot_status text` (`invited` / `onboarded` / `declined`, null =
   default/not part of pilot), added via a normal migration. This is the minimum
   schema change to let AJ track pilot invites against the real table instead of a
   side spreadsheet, without touching any existing column or breaking
   `founding.html`'s existing insert. **Not implemented by this plan** — flagged
   here as the one small addition worth making before Section 5's Week 1, and
   sized deliberately small (one column, no new table, no RLS change needed beyond
   what already exists since `founder_reads_waitlist` already covers founder
   visibility).
4. Once ≥3–5 pilot citizens are onboarded and have a nonzero ledger balance,
   **switch on `create_instant_invite`/`fulfill_instant_invite`** for organic
   fan-out within the cohort (e.g., "invite one more person, if they join you both
   get 10 INDX-ledger credit") — this is real, live code, good for testing the
   referral mechanism itself as part of the pilot, and keeps the cohort inside the
   15–25 ceiling by capping how many invite codes are handed out.

This keeps every mechanism in this section either (a) already live and already used
in production, or (b) a single explicitly-flagged proposed column — nothing
fabricated.

---

## 3. Feature exposure matrix

Style follows the existing house convention (`limit-orders.html`'s
"illustrative — no live order book", `l99-launch-command.html`'s three-layer
disclosure, `siindex-agents.html`'s "Illustrative... not a live execution log"):
**disclose, don't delete**, unless a feature is actively misleading with disclosure
left on-screen — that exception is called out explicitly below, not applied broadly.

### ON — safe to expose to pilot citizens as real, working features

| Feature | Screen(s) | Why it's safe |
|---|---|---|
| Tier 0 signup (phone/email) | `onboarding-flow.html`, `join.html`, `quickstart-onboarding.html` | Real RPC (`create_onboarding_citizen`), 16 real citizens already exist on it |
| Tier 1 KYC (PayID) | `sovereign-verify.html` | Real RPC (`verify_payid`), unlocks a real transfer-limit exemption in `transfer_indx` |
| Tier 2 KYC (government ID) | `sovereign-verify.html` | Real RPC (`verify_government_id`) — **must stay labeled as the existing on-screen copy already states**: "Prototype check — instantly approved for testing. This is not yet a real identity verification." This is disclosed-mock, not hidden-mock — it's fine to let pilot citizens complete it as long as that sentence stays visible, since a citizen who reads it will not come away believing their ID was checked |
| Remittance / P2P transfer | `remittance.html`, `send.html`, `pay.html` | Real Postgres ledger via `transfer_indx`, real fraud/risk checks, real Approval Gateway for risk-class ≥3 |
| Transaction history | `history.html` | Reads the real `transactions` table |
| Citizen dashboard | `citizen-dashboard.html` | Real RPC calls per BUILD_LOG |
| SIINDEX Q&A + Voice | wherever the fixed/CI-verified Q&A and voice surfaces live (public-home.html and related) | Explicitly confirmed fixed and CI-verified this cycle; this is the system that's supposed to *tell citizens the truth* about what's live, so exposing it is part of the pilot's own honesty test (Section 1 stretch goal) |
| Referral invite (`create_instant_invite`/`fulfill_instant_invite`) | wherever wired in the citizen dashboard/referral UI | Real ledger-balance transfer, real `transactions` row — see Section 2 point 4 for sequencing |

### VISIBLE, marked "Coming Soon" / prototype — keep on screen, disclosure only

| Feature | Screen(s) | Current disclosure | Pilot handling |
|---|---|---|---|
| Agent swarm roster (12-specialist view) | `siindex-agents.html` | Already labeled "Illustrative... founder view only, not a live execution log" | Leave as-is. Real backend is action-scoped (`agent_registry`), not named specialists — pilot citizens should never be told "N agents are working on your case" |
| Limit orders / order book | `limit-orders.html` | Already double-disclosed ("(illustrative — no live order book)" + plain-language caption under the chart) | Leave as-is, no change needed |
| DEX swap (SovSwap) | `dex-swap.html` | Already discloses "no Raydium pool seeded... no swap here actually executes" | Leave as-is |
| Lending / AMM / LP simulations | `income-streams.html` and related yield/staking screens | Should carry the same "(illustrative — no live position)" pattern used elsewhere | **Verify before pilot invite-send** that every lending/AMM/LP-flavored screen a pilot citizen can reach carries an equivalent caption to `limit-orders.html`'s; if any doesn't, that's the one pre-pilot content fix worth doing (see Section 5) |
| INDX token features (price, buy/sell, buyback/burn, token-detail) | `buy-indx.html`, `buyback-burn.html`, `token-detail.html` | `token-detail.html` already corrected this cycle to state the real status (ledger balances live today, SPL token planned, no NFT receipts) | Leave visible with existing corrected copy — a pilot citizen should be able to see the token roadmap, just not be told it's live |
| Fiat on/off-ramp | `fiat-onramp.html`, and the three tier-perk lines on `sovereign-verify.html` | Already discloses "Planned rails, not live integrations yet" / "(planned — not live yet)" | Leave as-is |
| L99 launch command / founder tools | `l99-launch-command.html` | Founder-only, already triple-disclosed | Not reachable by pilot citizens anyway (founder-scoped); no change needed |

### HIDE entirely for pilot citizens — and why disclosure isn't enough here

- **`siindex-avatar.html`'s backing `siindex-chat` edge function**, per BUILD_LOG's
  memory trail: this function has `verify_jwt: false` (callable by anyone holding
  the public anon key, with no server-side check at all) and its source isn't in
  the repo to audit. Disclosure doesn't fix an actual open call surface — the risk
  isn't "a citizen might misunderstand what this does," it's "this may be a live,
  unaudited endpoint with no server-side gate," which is an access-control problem,
  not a truth-in-labeling problem. Recommend it stay off any pilot-citizen-facing
  navigation path until AJ or someone can read what `siindex-chat` actually does;
  this is unrelated to whether its *feature* is fake or real, so it doesn't fit
  the disclosure pattern at all.
- **Founder-only / admin surfaces** (`founder-command-center.html`,
  `siindex-command-center.html`, `siindex-dev*.html`, `siindex-team-portal.html`,
  `l99-launch-command.html`, etc.) — these are already routing-blocked or
  auth-gated per BUILD_LOG's Session 105/106 fixes and were never meant to be
  citizen-facing at all. Not a pilot-specific decision, just confirming the
  existing block should stay in place for pilot citizens too.
- **`app-lock.html`'s biometric-styled unlock**, if a pilot citizen would reach it
  as their *first* interaction with the app rather than something they discover
  mid-flow: the existing fix (renamed to "Quick unlock" / "confirm it's you
  (prototype check)", per-device PIN instead of the old shared `123456`) makes this
  acceptable to leave visible with disclosure, **not** a hide case — flagged here
  only to confirm the team should double check during pilot walkthroughs that a
  first-time pilot citizen actually reads the "🚧 Prototype re-entry check" line
  and doesn't assume real biometric security is protecting their funds. If exit
  feedback (Section 1, criterion 5) shows people missed it, escalate to "hide the
  Face-ID-styled button behind an explicit prototype toggle" — a real fallback,
  not the default plan.

---

## 4. Rollback / support plan

This has to work for one person (AJ), not a support team, with no dedicated
incident-response tooling beyond Supabase's own dashboard and CLI. Keep it simple
enough to actually execute under stress.

**Freeze new signups (fastest lever, no code deploy needed):**
Drop or disable the `"citizens insert on onboard"` RLS policy on `citizens`
temporarily (`ALTER POLICY ... TO ...` or a quick `DROP POLICY` + note to
re-create it verbatim afterward), or simpler still: pull the pilot invite links
down and ask the cohort directly to pause — with 15–25 people this is a
WhatsApp/SMS message, not an infrastructure problem. Existing pilot citizens keep
working; only new signups stop.

**Freeze new transfers (if `transfer_indx` itself misbehaves):**
Same pattern — a targeted RLS/policy change or a one-line early-return guard in
the `transfer_indx` function gated on a feature-flag row (e.g., a `system_flags`
table read at the top of the function) is the cleanest fix, but if that doesn't
exist yet, the blunt fallback is revoking `EXECUTE` on `transfer_indx` from the
`authenticated` role via a quick migration — transfers hard-fail with a clear
Postgres permission error rather than partially applying. Reverse by re-granting.

**Roll back a bad migration:**
Every schema change in this project so far has gone through `apply_migration`
(tracked migrations, per BUILD_LOG's own verification language — "applied as a
tracked migration," "tested in a rolled-back transaction first"). Keep doing
that discipline during the pilot: no ad-hoc `execute_sql` DDL against the live
pilot database. If a migration ships a real bug, the rollback is a new migration
that reverses it (Supabase/Postgres migrations here are forward-only in practice,
per how BUILD_LOG describes prior fixes — e.g. the `verify_payid_tier2` rename
was done as a forward migration, not a revert) — write the fix as fast as the
original, re-verify with the same "test in a rolled-back transaction first" habit
before applying for real.

**Data-loss / corruption scenario:**
Supabase project-level backups are the actual safety net here — confirm before
the pilot starts (not during an incident) what backup/PITR window the project
currently has, since this plan cannot verify that without checking the project's
billing tier. If PITR isn't available on the current plan, that's a real gap
worth closing (upgrading tier, or at minimum a manual `pg_dump` snapshot taken
right before invite-send and again daily during the pilot window) given this is
real citizens' real data, however small the ledger amounts.

**Who monitors it:**
Honestly: AJ, manually, during the pilot window. No on-call rotation, no
alerting pipeline beyond whatever Supabase's own dashboard surfaces. Given the
cohort is 15–25 people over roughly two weeks (Section 5), the realistic plan is:
- AJ personally checks `security_events`, `transactions`, and the Approval
  Gateway queue at least once daily during the active pilot window.
- Each pilot citizen gets a direct line back to AJ (the same channel used to
  invite them — WhatsApp/SMS/email) for reporting anything that looks wrong,
  rather than a support ticket system that doesn't exist.
- A same-day fix-or-freeze rule: if a Sev-1 (per Section 1's definition) surfaces,
  the affected flow is frozen (per the levers above) within the same day rather
  than left live while a fix is written, even if that means the pilot pauses for
  a day.

**What this plan does not pretend:** there is no 24/7 monitoring, no automated
alerting, and no second engineer to page. That's a real constraint of a
single-founder, pre-revenue project, and the pilot's small deliberate cohort size
(Section 2) is itself the main risk mitigation — a 15–25 person pilot that AJ can
personally watch is safer than a larger one that outstrips what one person can
monitor.

---

## 5. Timeline (within the December 2026 window)

Working backward from a mid-December pilot window, given the public launch target
of 24 Feb 2027 needs real runway afterward to digest pilot findings:

| When | Milestone |
|---|---|
| **Now – ~Nov 20** | Feature freeze prep: confirm every lending/AMM/LP-flavored screen a pilot citizen can reach carries the same disclosure pattern as `limit-orders.html` (Section 3); add the proposed `waitlist.pilot_status` column (Section 2) via a normal tracked migration; confirm Supabase backup/PITR posture (Section 4) and take a manual snapshot if needed; personally walk through Tier 0 → Tier 1 → Tier 2 → one transfer end-to-end as a non-founder test account to catch anything broken before real invitees see it |
| **~Nov 20** | **Feature freeze** — no new screens, no schema changes beyond what's already tested, except fixes to bugs found during the pilot itself. This is the cutoff so the app AJ walks through in the last week of prep is the same app pilot citizens see |
| **~Nov 20 – Dec 1** | Final content audit against Section 3's matrix (run the existing `verify-public-surface.mjs`/`verify-siindex-public-phase-a.mjs`/`verify-siindex-voice.mjs` scripts, since BUILD_LOG confirms these are the real, CI-wired checks already in the repo) |
| **~Dec 1** | **Invite-send** — personal messages go out to the 15–25 person cohort with the `founding.html` link and a short explanation this is an invite-only pre-launch test |
| **Dec 1 – Dec 8** | Rolling onboarding window — AJ personally walks the first few people through signup live (voice/video call or in person where possible) to catch friction immediately, then lets the rest self-serve |
| **Dec 8 – Dec 19** | **Active pilot window** — citizens use remittance, KYC tiers, dashboard, SIINDEX Q&A/Voice for real. Daily monitoring per Section 4. Target: hit the ≥10 signup / ≥8 Tier-1 / ≥5 transfer bar (Section 1) inside this window, not on day one |
| **Dec 19 – Dec 23** | **Pilot close** — direct exit conversations with as many of the 15–25 as will give feedback (the Section 1 criterion-5 question specifically: "did anything feel real that wasn't?"), tally the success-criteria checklist against actual results, log every bug found (fixed or explicitly deferred) back into `BUILD_LOG.md`'s format |
| **Dec 23 – Dec 31** | Buffer/holiday gap — deliberately left open given this is a single-founder project and December has real personal-time constraints; no pilot activity assumed to require attention here beyond monitoring already-onboarded citizens |
| **Jan 2027** | Findings from the pilot feed directly into the pre-24-Feb-2027 launch punch list — this plan stops at pilot close; what happens with the findings is the next document, not this one |

This timeline assumes the pilot runs entirely on today's live capabilities (Section
3's ON list) with zero dependency on the INDX SPL token deploying — consistent with
the task's own constraint that the pilot must work even if INDX isn't on-chain by
December, which per BUILD_LOG's current baseline (placeholder mint address,
`getINDXBalance()` guarded to never query it pre-TGE) it will not be.
