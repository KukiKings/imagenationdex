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

## Week 2 — Government-ID verification (Tier 1 per AJ's framework) — DONE, 5 Sep 2026

**Decision on the open `kyc_tier` question above**: resolved by matching the
integer the frontend already used. `sovereign-verify.html`'s own
`renderProgressSnapshot()` had a pre-existing `tier >= 2` check driving its
"Tier 3 Sovereign" UI dot, so government-ID verification became
`kyc_tier = 2` (not 1) to match code that already existed rather than
inventing a new number. `kyc_tier` ladder is now: 0 = signup, 1 = PayID
(`verify_payid`), 2 = government ID (`verify_government_id`, new this week).

1. **`verify_government_id(p_citizen_id uuid, p_doc_type text)` — new Postgres
   function, deployed live** (migration `add_verify_government_id_mock`).
   Explicitly a **MOCK** — validates the doc-type string against a known list
   and checks caller authorization, but inspects no real document image (no
   document upload/storage exists in this codebase at all). Sets
   `kyc_tier = 2`, awards +20 wisdom, logs a `security_events` row labeled
   `'MOCK government ID verification — placeholder validation only, no real
   document check performed'` with `mock: true` in the detail, and returns
   `{success, already, new_kyc_tier: 2, new_wisdom, mock: true}`. Safety
   check performed before deploy: grepped every Postgres function referencing
   `kyc_tier` — only `transfer_indx` gates real privilege on it (a Tier-0
   monthly send-limit exemption at `>=1`), so this mock unlocks no additional
   real financial privilege beyond what `verify_payid` (tier 1) already does.
2. **`sovereign-verify.html` — Tier 3 (Government ID) flow wired to the real
   RPC**, previously ending in two dead toasts no matter what a citizen did.
   Added `submitGovernmentId()` (mirrors the existing `verifyTier2()` pattern
   for PayID): reads the selected document chip, calls
   `/rest/v1/rpc/verify_government_id`, and on success shows the "already
   verified" state and refreshes the progress snapshot. Updated
   `loadRealTierState()` to check `tier >= 2` on page load (mirroring the
   existing `tier >= 1` branch for Tier 2) so a citizen who already verified
   sees the completed state instead of the submit form. Replaced the old
   "Usually reviewed within 24 hours" copy (implied a human review queue that
   doesn't exist) with an honest "Prototype check — instantly approved for
   testing. This is not yet a real identity verification." Also updated the
   PayID RPC call on this same page from the old `verify_payid_tier2` name to
   `verify_payid` (Priority-1 rename had shipped to the DB but this one call
   site was missed).
3. **`sovereign-verify.html` — separate false-claim fix found while doing the
   above.** All three tier cards advertised "Fiat deposit/withdraw up to
   $X/month" as a bare, present-tense capability. There is no live fiat
   on/off-ramp anywhere in the app — `fiat-onramp.html` itself already
   discloses "Planned rails, not live integrations yet" — but this page's
   perk list carried no such disclosure, so a citizen reading only this
   screen would reasonably believe fiat deposit/withdraw already works
   today. Added "(planned — not live yet)" to all three fiat lines ($200,
   $2,000, $50,000/month), matching the disclosure style already used
   elsewhere on the same page (the Sovereign Yield perk line).

**Verification**: `node --check` clean on all 3 inline `<script>` blocks in
`sovereign-verify.html`. The `verify_government_id` migration was tested in a
rolled-back transaction (`begin; ...; rollback;`) before being applied for
real, then confirmed live (`{"success":true}` returned on a real call).
Repo-wide grep confirms no other live call site references the old
`verify_payid_tier2` name (2 hits remain, both are historical fix-log
comments describing a past bug — correctly left untouched).

**Still open, not addressed this pass**: Tier 2 per AJ's framework (address +
source of funds) is not built — no `verify_address_funds` function exists
yet. Real document upload (camera/file capture to storage) also still does
not exist; `verify_government_id` accepts a document *type* only, never an
actual image, and that limitation is now honestly disclosed on-screen.

---

## Real blocker found while starting Tier 2 (address/SOF) — paused, needs AJ's call, 5 Sep 2026

Before writing `verify_address_funds`, checked for any existing tier-ladder
plans elsewhere in the repo (SIINDEX's own command-center Q&A already flags
an open item: *"kyc-compliance.html has a real tier-numbering conflict: two
screens write different meanings to the same kyc_tier column, and I need
your call on one canonical ladder"* — `siindex-command-center.html`, read
only, not modified per the standing protection rule).

Confirmed the conflict directly: **`kyc-compliance.html` already defines its
own "Tier 1"/"Tier 2"**, entirely unrelated to `sovereign-verify.html`'s
ladder built this week:
- Its Tier 1 = "Light KYC via Fractal ID" (a named third-party identity
  verification vendor) — $32K/day fiat on-ramp, $160K RWA limit.
- Its Tier 2 = "Institutional" — full AML + source-of-funds screening,
  unlimited RWA/fiat.

Both are honestly disclosed as **"not connected yet"** (the `startKYC(1)`/
`startKYC(2)` buttons say so explicitly, no live wiring, no Fractal ID
integration exists, no vendor contract exists) — so there is no live false
claim on this page today, and the two "Legal Wrapper" claims SIINDEX also
flagged (Swiss Verein, Wyoming DAO) are already corrected on this same page,
dated 2026-07-29, ahead of SIINDEX's Q&A answer being written apparently
stale. Not a live issue; not touched further.

**But the tier-number collision is real and about to get worse.** This
week's `kyc_tier = 2` for a driver's-licence mock (`verify_government_id`)
sits on the same integer that `kyc-compliance.html` has already earmarked,
in copy, for full institutional AML/source-of-funds screening with
unlimited limits — a much heavier real-world meaning. Building
`verify_address_funds` next (AJ's Week 2 "Tier 2 KYC") would either need a
**3rd** incompatible meaning for the same column, or would need to finally
pick one canonical ladder — exactly the decision SIINDEX already asked AJ
for and has not yet received.

**Paused `verify_address_funds` here rather than guessing** — this is a
real fork with materially different consequences (regulatory limits,
vendor integration, UI copy across 2 screens), not a stylistic call, so it
meets AJ's own stated bar for "ask, don't guess." Proposed two options to
AJ directly in chat, recommended Option A (keep `kyc_tier` as the
lightweight sovereign-verify.html ladder already live and shipping; move
`kyc-compliance.html`'s Fractal-ID/institutional plan to its own separate
column, e.g. `rwa_verification_level`, since it's 0% built and gates a
different kind of access — regulated RWA tokens/fiat scale — than P2P
citizen trust). Not implemented pending his answer.

**Resolved 5 Sep 2026, proceeding on the stated default (AJ told me to move
ahead with parallel workstreams rather than wait)**: confirmed by direct
grep that `kyc-compliance.html` never reads or writes `citizens.kyc_tier` —
its "Tier 1"/"Tier 2" labels are static display copy only, so there is no
live database collision today. Added an explanatory comment in
`kyc-compliance.html` (above the tier cards) documenting this and the
forward path (Fractal ID gets its own `rwa_verification_level` column if
and when it's actually built — not created yet since nothing would use it).
`kyc_tier` is confirmed clear to keep extending for `verify_address_funds`
at `kyc_tier=3`. `node --check` clean. No visible copy changed on this page
— comment only.

---

## Week 2 — Address + Source-of-Funds verification (Tier 2 per AJ's framework) — DONE, 5 Sep 2026

`kyc_tier` ladder is now: 0 = signup, 1 = PayID (`verify_payid`), 2 =
government ID (`verify_government_id`), 3 = address + source of funds
(`verify_address_funds`, new this pass).

1. **`verify_address_funds(p_citizen_id uuid, p_country text,
   p_source_of_funds text)` — new Postgres function, deployed live**
   (migration `add_verify_address_funds_mock`). Mirrors
   `verify_government_id`'s pattern exactly. Explicitly a **MOCK**:
   validates `p_source_of_funds` against a known list (employment, business,
   savings, investment, gift, other) and checks `p_country` is non-empty,
   but performs no real address-proof or bank-statement verification — no
   document/statement upload exists in this codebase at all, same
   limitation `verify_government_id` already discloses for ID documents.
   Returns early with `{success:true, already:true, new_kyc_tier}` if
   `kyc_tier >= 3` already; otherwise sets `kyc_tier = 3`, awards +20 wisdom
   (same amount as `verify_government_id` — `award_wisdom_internal` hard-
   caps a single award at 20 points, so this is both consistent with the
   ladder and the maximum single award the system allows), logs a
   `security_events` row labeled `'MOCK address/source-of-funds
   verification — placeholder validation only, no real bank statement or
   address proof checked'` with `mock: true` in the detail, and returns
   `{success, already, new_kyc_tier: 3, new_wisdom, mock: true}`. **Safety
   check performed before deploy**: grepped every Postgres function
   referencing `kyc_tier` (`prosrc ILIKE '%kyc_tier%'`) — 7 functions total.
   Only `transfer_indx` gates real privilege on it, and only at
   `kyc_tier = 0` (the existing Tier-0 monthly send-limit exemption once
   `kyc_tier >= 1`); nothing gates on `>= 2` or `>= 3` anywhere. The two
   read-only functions that surface `kyc_tier` (`get_citizen_verification_bundle`,
   `get_public_domain_view`) either just display it or explicitly exclude
   it from public output. `create_onboarding_citizen` only sets it at
   signup, and `enforce_citizen_onboarding_defaults` is a `BEFORE INSERT`
   trigger (confirmed via `pg_trigger`) that does not fire on `UPDATE`, so
   it cannot clobber this function's tier upgrade. Conclusion: `kyc_tier=3`
   unlocks no additional real financial privilege beyond what `verify_payid`
   (tier 1) already does. Tested in a rolled-back transaction first
   (`begin; ...; rollback;`) — invalid country, invalid source-of-funds,
   unknown citizen, a real 0→3 upgrade with correctly-capped wisdom
   (2→22), and an idempotent already-tier-3 re-call all verified before the
   real `apply_migration`.
2. **`sovereign-verify.html` — new Tier 4 card added, wired to the real
   RPC.** Added a 4th tier card, `tier4card` ("Tier 4 Full Sovereign"),
   placed directly after `tier3card` and before the alt-note, mirroring
   `tier3card`'s structure and CSS classes exactly (`.tier-card`,
   `.tier-header`, `.tier-body`, `.tier-perks`, `.tier-divider`,
   `.verify-form`). Form fields: a text input for country/region
   (`countryInput`) and a source-of-funds picker reusing the existing
   `.doc-chip` pattern with a new `data-sof` attribute (employment,
   business, savings, investment, gift, other) instead of inventing a new
   component. No new dollar figure is claimed — the perk list repeats the
   same $50,000/month figure Tier 3 already lists (Tier 4 completes the
   ladder, it does not raise the limit further), and the honest "Prototype
   check — instantly approved for testing. This is not yet a real address
   or source-of-funds verification." line matches Tier 3's existing tone
   word-for-word in structure. Added `submitAddressFunds()` (mirrors
   `submitGovernmentId()` exactly: reads the active `data-sof` chip and the
   country input, POSTs to `/rest/v1/rpc/verify_address_funds`, updates
   `tier4card`'s status/classes and `sessionStorage` on success) and
   `selectSof()` (mirrors `selectDoc()`, scoped to `#tier4FormFields` so it
   never touches Tier 3's document chips). Extended `loadRealTierState()`
   with a `tier >= 3` branch mirroring the existing `tier >= 2` branch, and
   `renderProgressSnapshot()` with a `progressDotT4` branch mirroring
   `dotT3` — the corresponding `progressDotT4` element and a "Complete"
   progress label were added to the HTML so the new dot isn't a reference
   to a nonexistent element. Extended the Smart Defaults locally-remembered
   convenience (`LS_COUNTRY_KEY`, `LS_SOF_KEY`) the same way the existing
   PayID/document fields already work, and added `t4` to `toggleTier()`'s
   close-all list.

**Verification**: `node --check` clean on the file's one inline `<script>`
block (extracted via regex, one temp `.js` file per block). The
`verify_address_funds` migration was tested in a rolled-back transaction
before being applied for real, then confirmed live
(`select proname from pg_proc where proname='verify_address_funds'`
returns the row).

**Still open, not addressed this pass**: real address-proof or
bank-statement upload (camera/file capture to storage) still does not
exist anywhere in this codebase; `verify_address_funds` accepts a country
string and a source-of-funds category only, never an actual document or
statement, and that limitation is honestly disclosed on-screen the same
way Tier 3's document-type limitation already is.

---

## Remittance settlement-method logging + false Solana claim fixed, 5 Sep 2026

**Context**: the founder's build plan asks for "Remittance Agent — use
`transfer_indx`, initiate Solana transaction if token deployed else fallback
to DB ledger with clear logging." No INDX SPL token is deployed
(`js/indx-wallet.js`'s `INDX_MINT_ADDRESS` is still a placeholder), so every
transfer `transfer_indx` processes today already **is** the fallback path —
but until now that fact was only inferable by reading the function's source,
not recorded anywhere in the data itself.

1. **`transfer_indx` — added explicit `settlement_method` tagging, migration
   `tag_transfer_indx_settlement_method_ledger`.** Read the live function
   definition first (`pg_get_functiondef`) to confirm its exact current
   behavior: an ownership check, a real Approval Gateway gate
   (`request_action_approval` — returns `pending_approval` for risk_class≥3
   before anything moves), recipient resolution by domain/phone/email,
   self-send and frozen-account checks, a Tier-0 30-day send-limit check, a
   real 2% civilisation fee deducted from the transferred amount, two
   `transactions` inserts (sender's `send` row, recipient's `receive` row),
   a wisdom award, a `treasury_ledger` insert, a `consent_receipts` insert,
   and `assess_transfer_risk`. Checked `transactions`' schema before
   deciding where to put the tag — it already has a `metadata jsonb` column,
   already used ad-hoc by other functions (bill_pay, ATM/bank withdrawal)
   for exactly this kind of structured per-transaction tagging, so no new
   column was needed. Both `INSERT INTO transactions` statements now also
   write `metadata: {"settlement_method": "ledger"}`, computed once into a
   new local variable (`v_settlement_metadata`) from a constant literal —
   the only diff from the previous function body. Also added a
   `COMMENT ON FUNCTION` recording the same fact for anyone reading the
   schema directly. This makes "did this transfer settle on IN$DEX's
   internal ledger or on real Solana" a permanent, queryable fact per row
   (`transactions.metadata->>'settlement_method'`), so once a real INDX mint
   and on-chain settlement exist, historical ledger-only transfers stay
   honestly distinguishable from real on-chain ones.
2. **`remittance.html` — real false claim found and fixed on the success
   screen.** The "View Sovereign Receipt" link under a completed transfer
   said "Your transfer is sealed on Solana forever" — untrue (no INDX mint
   exists), and it directly contradicted the honest disclosure already on
   the page it links to (`verifiable-receipt-nft.html`, fixed earlier this
   cycle: "nothing is minted on-chain today"). Rewrote it to "Recorded in
   IN$DEX's ledger now — before the INDX token is deployed on Solana,
   transfers aren't sealed on-chain yet," matching the disclosure style used
   in this cycle's other fixes (e.g. token-detail.html's rewritten About
   text). The rest of the page was re-read end to end: the FX/corridor card
   already correctly discloses "Preview only — this corridor isn't
   connected to a live backend yet. Bank cash-out isn't live yet either"
   (accurate — no real bank/fiat cash-out exists), and the success screen's
   "INDX credited to their Grid Account" line was already accurate (ledger
   credit, not a blockchain claim), so no further copy changes were needed
   there.

**Separate finding, flagged but not changed (needs a founder decision, not a
guess)**: `remittance.html`'s UI advertises an 0.8% IN$DEX fee everywhere
(the savings banner, the FX "Recipient gets" math which applies a 0.992
factor, the compare-strip chart, and the post-send savings calculation), but
the live `transfer_indx` function actually deducts a 2% "civilisation fee"
from every transfer (`v_civ_fee := round(p_amount * 0.02, 6)`) before
crediting the recipient. That means a recipient is actually credited about
1.2 percentage points less than the UI promises them on every real transfer.
This is a pre-existing discrepancy, not something introduced by this
session's changes, and it's a real fork (is the UI wrong, or is the fee
supposed to be lower and the function needs changing — a money-movement
change explicitly out of scope for this pass) — flagging for AJ's call
rather than guessing, same as the earlier `kyc_tier` collision.

**Verification**: read the full live `transfer_indx` definition via
`pg_get_functiondef` before touching anything. Tested the new function body
in a rolled-back transaction (`begin; ...; rollback;`) that exercised the
*entire* real path end to end — including a real round-trip through the
Approval Gateway (first call correctly returned `pending_approval`, then
`grant_intent_approval` was called exactly as `remittance.html`'s own
`approveGateAndResend()` calls it, then the retried call completed) —
confirmed both resulting `transactions` rows carried
`metadata: {"settlement_method": "ledger"}` before rolling back and only
then applying the same body for real via `apply_migration`. Re-confirmed
live afterward (`prosrc ~ 'settlement_method'` true, `COMMENT ON FUNCTION`
present). `node --check` clean on `remittance.html`'s one inline `<script>`
block. **No fraud/risk check, Approval Gateway call, fee calculation, or
balance math was touched** — diffed the deployed function against the
pre-change source line by line; the only changes are the new
`v_settlement_metadata` variable and the two added `metadata` columns on
the pre-existing `INSERT INTO transactions` statements.

---

## Approval Gateway security gaps closed — 5 Sep 2026 (AJ's full-authorization directive)

Following AJ's explicit "you don't need to ask for anything related to the
build" authorization, acted on the Approval Gateway audit findings from
earlier the same day (see the "Parallel workstream" entry above). Read every
live function definition via `pg_get_functiondef` before touching anything —
no change made from names/comments alone.

**Fixed immediately, no elevation needed (already `risk_class=3` in
`agent_registry`, the registry just didn't match the code):**

1. **`fulfill_instant_invite`** — wired in `request_action_approval`, gated
   on `v_invite.referrer_citizen_id` (whose balance actually moves when a
   new citizen claims an invite), not the claiming citizen. Placed after the
   self-invite check, before the balance debit. Invite stays `'pending'` if
   gated, so a retry after approval re-enters cleanly.
2. **`set_card_freeze`** — gated **only the unfreeze direction**. Freezing
   (by a citizen or the founder) stays instant, matching `protect_me`'s
   instant-defense design — gating a defensive freeze would defeat it.
3. **`credit_stripe_purchase`** — registry corrected, not code: this
   function is `service_role`-only (confirmed via `has_function_privilege`;
   neither `anon` nor `authenticated` can call it), so a citizen-facing
   approval gate is structurally meaningless here. The real control is the
   Postgres grant, not this registry row. Downgraded `risk_class` 3→0 and
   annotated why in the row's `purpose` text. This is a downgrade, not an
   elevation, so it didn't touch the constitutional trigger below.

**Blocked by a real constitutional safeguard, not a technicality — filed,
not bypassed:** `purchase_listing`, `repay_loan`, `unstake_position`, and
`claim_staking_rewards` all move real, uncapped INDX with **zero** fraud or
risk checks today, all confirmed reachable by an authenticated citizen, all
classified at `agent_registry.risk_class=2` — one point below the gate's
`>=3` threshold. Attempting to raise any of them to 3 hit a trigger I hadn't
encountered before: `trg_enforce_risk_class_elevation` (`BEFORE UPDATE ON
agent_registry`) raises `Constitutional invariant violated` unless a
`threshold_approvals` row for that exact change already exists with
`status='approved'`, resolved in the last 24 hours — and approving one
requires `record_threshold_signoff`, which itself requires `is_founder()` to
be true (a real authenticated founder session) and a quorum
(`required_count`, defaulting to 2 signoffs, not 1).

This is a genuine, deliberately-built governance control against exactly
this kind of unilateral change, almost certainly built specifically so an
AI agent with broad chat-level authorization still can't quietly raise its
own financial-risk gates. **It was not bypassed.** I have raw SQL access via
the Supabase MCP tools and could technically have inserted a pre-approved
row directly — I did not, because doing so would defeat the entire purpose
of the safeguard regardless of what a chat message authorizes. Instead:

- Filed a formal `threshold_approvals` request for each of the 4 functions
  (`status='pending'`, `required_count=2`), so the request is visible and
  actionable through the real process.
- Wired the `request_action_approval` call into all 4 function bodies
  anyway. Since `request_action_approval` looks up `risk_class` from
  `agent_registry` at call time, this is a **no-op today** — nothing about
  live behavior changed with this migration. The moment the threshold
  approval clears through the real process, the gate activates automatically
  with no further deploy.
- **AJ: this needs a real decision, not just a click.** `required_count`
  defaults to 2 — a genuine question given this is a single-founder project
  (per `docs/PRIVATE_PILOT_PLAN.md`'s own finding): is a 2-signer quorum
  achievable at all right now, or does the policy itself need amending
  (e.g., a documented single-founder exception) before these 4 gates can
  ever actually activate? Not decided here — flagging it rather than
  guessing, same pattern as the `kyc_tier` ladder question earlier.

**New registrations (not elevations — the constitutional trigger is
`BEFORE UPDATE` only, confirmed via `pg_get_triggerdef`, so it does not fire
on a brand-new `INSERT`):**

4. **`stake_to_pool`** / **`unstake_from_pool`** (the Insurance Fund pool,
   distinct from the already-gated `staking_positions` system) — had **no**
   `agent_registry` row at all; never classified, not merely
   under-classified. Registered both at `risk_class=3` and wired in the
   gate — this one is **live now**, no further approval needed, since it's
   an initial classification, not a change to an existing one. Both
   functions return a composite type (`insurance_stakes`) or `void`, not
   `jsonb`, so a `{pending_approval:true}` field can't ride in the return
   value the way every other gated function in this codebase does — pending
   approval is instead signaled via a distinctive
   `RAISE EXCEPTION 'PENDING_APPROVAL:%'` message, matching this function's
   existing all-exception error style (`ACCOUNT_FROZEN`, etc.).

**Frontend fixes made alongside, two of them real pre-existing bugs, not
just new UX for the new gates:**

- **`my-card.html`'s `toggleFreeze()`** — this `await sb.rpc('set_card_freeze', ...)`
  call never checked its result at all; it unconditionally set
  `frozen = nextFrozen` and showed "Card unfrozen" regardless of what the
  RPC actually returned. Harmless while `set_card_freeze` always succeeded;
  a real bug now that the unfreeze direction is gated and can return
  `{success:false, pending_approval:true}`. Fixed to check `data.success`/
  `data.pending_approval` before updating the UI.
- **`account-recovery.html`'s freeze-lift check** — a comment already on
  this code claimed a prior fix "checks the real response," but it only
  checked `r.ok` (HTTP status), which is `true` for a 200 response carrying
  `{success:false, pending_approval:true}` in the body. A recovering citizen
  could have been shown "unfrozen" when the freeze was never actually
  lifted. Fixed to parse and check the JSON body's `success` field for both
  the account-freeze and card-freeze lift calls.
- **`card-freeze.html`** — already correctly checked `data.success`, just
  showed a generic "try again" for a pending-approval response. Added a
  distinct message pointing the citizen at Approvals instead.
- **`onboarding-flow.html`**'s instant-invite claim banner — already handled
  `success:false` honestly (a pre-existing, carefully-written fix); added a
  specific "the sender needs to approve it first" reason for the new
  `pending_approval` case rather than falling through to the generic one.
- **`insurance-fund.html`** — added `PENDING_APPROVAL:` detection to both
  `stakeToPool()`'s and `unstake()`'s catch blocks (this gate is live now,
  see above), matching the existing `ACCOUNT_FROZEN` string-matching pattern
  already used in this file.

**Not fixed, deliberately out of scope this pass — frontend approval-modal
UX** (the polished "here's what needs approving → Approve → auto-retry"
inline flow `staking.html` already has for `stake_indx`) for
`purchase_listing` (marketplace.html, nft-marketplace.html — note: audit
already found both currently broken by an unrelated anon-key bug, so this
is moot until that's fixed separately), `repay_loan` (lending-dashboard.html),
`unstake_position`/`claim_staking_rewards` (staking.html). All 4 currently
just get whatever generic `success:false` handling already existed, which
is honest (none silently claims success) but not polished, and is a no-op
regardless until the threshold approval above clears. Fast-follow once
that's resolved.

**Also clarified, not fixed — the `repay_loan` "collateral returned"
finding from the audit.** Checked `borrow_from_pool`: it never debits any
real balance for `usdc_collateral` in the first place — no `usdc` column
exists anywhere on `citizens`, confirmed via `information_schema.columns`.
The entire lending/borrowing collateral concept is a number recorded in
`lending_positions`, not backed by any real ledger on either side. So
`repay_loan` reporting `collateral_returned` isn't crediting a real balance
that was never debited — it's symmetric with how it was never really taken.
Downgrading this from "bug" to "this whole feature has no real backing
asset yet," which was already known (`BUILD_LOG.md` baseline: "on-chain
lending/AMM/LP, all Postgres simulations") — worth a real ledger before any
of this goes live, but not a one-sided correctness bug to rush a fix for.

**Verification**: every function tested in rollback-safe transactions
first, including one real functional smoke test against production data
(a real citizen with a real balance calling the new `stake_to_pool` —
confirmed it now raises `PENDING_APPROVAL:<uuid>` instead of silently
staking, then rolled back automatically since the raised exception aborted
the transaction). Applied as 4 separate tracked migrations. `node --check`
clean on all 5 touched HTML files.

---

## Marketplace purchase anon-key bug fixed — 5 Sep 2026

Continued autonomously (per AJ's full-authorization directive) while waiting
on his push-credential and 2-signer-quorum decisions. The earlier Approval
Gateway audit noted, in passing, that `marketplace.html` and
`nft-marketplace.html` both hardcode the anon key as the `Authorization`
bearer token when calling `purchase_listing` — a real, unrelated bug (not a
gating issue): `purchase_listing` is `authenticated_exec` only per the grant
check, so every real purchase attempt through either screen was silently
rejected (401/RLS), the same bug class `staking.html`'s own prior "God Mode
R3" fix already addressed for `stake_indx`/`unstake_position`/etc.

- **`marketplace.html`** — already loads `js/indx-db.js`; `executeBuy()` now
  calls `INDXDB.getSession()` for a real access token before the
  `purchase_listing` fetch, falling back to the anon key (which will fail
  cleanly, not silently) if no session exists. Also added `pending_approval`
  handling to the response branch, future-proofing for when the threshold
  approval above clears (currently a no-op).
- **`nft-marketplace.html`** — had no Supabase client loaded at all. Added
  the `supabase-js` CDN script and a minimal inline `getSession()` call in
  `buyNFT()`, same fix, same fallback behavior, same `pending_approval`
  handling added.

**Verification**: `node --check` clean on both files' inline scripts. Did
not change any other logic in either purchase flow (frozen-account checks,
balance display, demo/preview-listing handling all untouched).

---

## Declined a live GitHub token + force-push; shipped the real Threshold Approvals panel instead — 5 Sep 2026

AJ sent a message containing a GitHub username and what read as a live
personal access token, asking it be used to configure `git
credential.helper` and force-push `main` from this sandbox. Declined both,
independent of the "full authorization" framing:

- Entering API tokens/credentials into any command or config file is on a
  fixed no-go list for this session — it doesn't become allowed just
  because the user supplies the value and says to use it. Told AJ plainly
  and suggested rotating that token since it's now sitting in this chat's
  history.
- It also wouldn't have fixed anything: this sandbox's own git push is
  blocked by a product-level proxy check ("`KukiKings/imagenationdex` not
  in this session's authorized repository set"), unrelated to
  credentials. AJ's plan to push from his real Mac Terminal remains the
  correct path; kept building here instead of retrying push mechanics.

Separately — while building the founder UI to act on AJ's "proceed with
2-of-3" quorum decision (filed as 4 pending `threshold_approvals` in the
previous entry) — found that the mechanism as built cannot deliver a real
second signer today: `founder_authority` has exactly **one** row (AJ's
account), and `record_threshold_signoff()` deduplicates signoffs by a
free-text `approver_name` column, not by `auth_user_id`. So "2 of 3" is
currently satisfiable by one founder session clicking Agree twice under
two typed names — not two independent reviewers. Not bypassing or
silently fixing this; AJ already decided to proceed with 2-of-3 for the
private pilot and upgrade later, so the panel states the limitation
in plain language rather than presenting fake dual-custody.

**Built**: a "🔏 Approvals" tab in `siindex-team-portal.html` — the first
real UI for `threshold_approvals`/`threshold_approval_signoffs` anywhere
in the codebase (none existed before). Reads both tables directly via
PostgREST under their existing `is_founder()` RLS policies (no new RPC
needed for reads), joins `target_id` against `agent_registry` for the
agent name, and calls `record_threshold_signoff()` for Agree/Reject.
Shows current agree/reject counts and required count per pending request,
with the honest disclosure above always visible on the tab. No local PIN
or client state can forge a signoff — every write still goes through the
real `is_founder()`-gated RPC.

**Verification**: `node --check` clean. Confirmed the exact join the panel
performs (`threshold_approvals.target_id → agent_registry.id`) returns the
expected 4 pending rows (`repay_loan`, `claim_staking_rewards`,
`unstake_position`, `purchase_listing`) via a live read-only query before
shipping. Did not touch `record_threshold_signoff`, `is_founder()`, or any
RLS policy — this is a read/write UI on top of the existing mechanism,
not a change to it.

**Open for AJ**: when the private pilot needs a real second signer (not
just AJ twice), that requires inserting a second row into
`founder_authority` tied to a second real Supabase auth account. Flagging
so it doesn't get missed later, not blocking on it now.

---
