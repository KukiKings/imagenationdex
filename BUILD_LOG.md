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

## Audited the 5 screens AJ flagged as broken — 4 already fixed, 1 real bug found and fixed — 5 Sep 2026

AJ named 5 specific screens as broken (`siindex-sovereign-embodiment.html`,
`app-lock.html`, `l99-launch-command.html`, `limit-orders.html`,
`token-detail.html`). Dispatched one verification agent per file rather
than trusting the claims at face value — each agent independently read the
full file, checked git history, and re-derived the finding before touching
anything.

**Result: 4 of the 5 were already fixed**, all by an earlier commit on
this branch (`d058a26`, "Priority 1 critical fixes"), from earlier in this
same session. `siindex-sovereign-embodiment.html`'s fake ticker
percentages, `app-lock.html`'s fake-Face-ID-success animation,
`limit-orders.html`'s unlabeled fake depth chart, and `token-detail.html`'s
false "Metaplex Bubblegum, verified via mainnet" claim were all
confirmed clean on the current working tree — no edits needed, verified
independently rather than re-doing already-done work.

**`l99-launch-command.html` had a real, still-live bug**: a "First
Citizens Arriving" widget ran an *unbounded* fake-citizen generator
(`AUTO_CITIZENS` — 8 hardcoded Pacific-nation names — driven by an
unconditional `setInterval(..., 5000)` in `startAutoArrivals()`) that kept
incrementing a "citizens onboarded" counter forever while the page stayed
open, persisted that count to `localStorage`, and restored/resumed the
climbing fake count on every later visit (`ewaRestore()`). This is
distinct from the screen's earlier, already-fixed 4-name scripted
rehearsal sequence — this generator kept fabricating *new* names and
*new* growth indefinitely, on a screen whose own countdown shows the real
launch date is still Feb 2027 (i.e. it's currently impossible for any
real citizen to have onboarded at all).

Fixed by deleting `AUTO_CITIZENS`, `startAutoArrivals()`, `ewaRestore()`,
and their `localStorage` persistence keys entirely (no real citizen-count
data source exists yet for a pre-launch rehearsal widget, so removal —
not a fake-to-real swap — was the honest fix), strengthening the
existing disclaimer copy to be unambiguous that the card is a scripted
rehearsal that doesn't grow on its own, and confirming via grep that no
orphaned references remain outside explanatory comments.

**Verification**: `node --check` clean on the one inline script. Confirmed
live against the Supabase schema (`list_tables`) that no `orders` /
`order_book` / `limit_orders` table exists anywhere, corroborating the
`limit-orders.html` agent's independent finding that there's genuinely no
real market data source for that screen yet. Committed as a standalone
change; did not touch any protected file.

---

## Section 8 (Compliance, Legal & Trust) audit sweep — closed out — 5 Sep 2026

Six of the 23 Section 8 screens had never had the full `indx-screen-audit`
v2 checklist run against them (the other 17 were already done in earlier
batches). Dispatched one verification agent per file to close the gap:

- **`data-breach-claim.html` — FAIL → fixed.** A live `INDX_PRICE_USD=0.24`
  constant was actually wired into six on-screen $ conversions (not dead
  code, unlike the same constant found elsewhere). "IN$DEX pays you based
  on severity of data exposed" stated a live payout mechanism that doesn't
  exist. The default scan message read "Checking 14.2 billion breached
  records..." for the first ~700ms before the honest message replaced it.
  A `localStorage`-persisted countdown manufactured urgency on a claim
  ("Optus · Sep 2022," "89d" remaining) that was never real. All four
  fixed to honest "planned/illustrative" framing; no backend exists for
  this feature (confirmed via `list_tables`), so no real-wiring option
  existed.
- **`data-royalty.html` — PASS, 0 edits.** Already matches the honest
  template `data-marketplace.html` established: real Supabase-backed zero
  states, explicit "not connected yet," a labeled-hypothetical calculator.
- **`data-sovereignty-hub.html` — FAIL → fixed.** One dead
  `INDX_PRICE_USD=0.24` declaration had survived its own 28 Aug audit pass
  (that fix predated the sibling-screen precedent for flagging this exact
  dead-code pattern by a day). Removed. Flagged that the same dead constant
  is still live in `citizen-dashboard.html`, `join.html`, `transparency.html`,
  `sovereign-identity.html`, `instant-onboard.html` — outside Section 8,
  not touched, noted for a future sweep.
- **`trust-compliance-dashboard.html` — FAIL → fixed.** A fabricated
  "Trust Civilisation Law guarantees no citizen is blocked unfairly" (no
  such law exists — canon's only Civilisation Law is the unrelated 98/2
  revenue split) and a stale "Safe when within AUSTRAC thresholds" line
  implying an active AUSTRAC-regulated framework. Fixed the latter by
  reusing `siindex-trust-compliance.html`'s exact canonical wording
  verbatim (AUSTRAC/VASP registration paused/out of scope; Cook Islands
  registration in progress). Also removed the same dead `INDX_PRICE_USD`
  constant and added "(provisional, pending launch)" to three INDX reward
  amounts for sitewide consistency.
- **`sovereign-verify.html` — FAIL → fixed.** The post-verify success
  message was hardcoded to a single Tier-2 (PayID) script — "Your PayID is
  linked... deposit and withdraw up to $2,000/month" — and fired unchanged
  for Tier 3 and Tier 4 verification too, so a citizen completing address/
  source-of-funds verification would see a false claim about a PayID
  action they never took, the wrong limit, and the wrong Wisdom award.
  Built a tier-correct `showTierSuccess()` with honest "(not live yet)"
  fiat framing for all three tiers; same undisclosed present-tense fiat
  claim also existed in the "Why verify" bottom sheet, fixed there too.
  Governance-voting perk line was missing the "not live yet" disclosure
  present on the adjacent yield perk — added. Added missing `og:title`/
  `og:description` meta tags.
- **`dispute.html` — PASS, 0 edits.** Confirmed it does *not* share
  `arbitration.html`'s fake jury/bond/verdict problem — `arbitration.html`
  was retired to a redirect stub in Aug 2026 specifically because
  `dispute.html` already has the real thing (real `disputes`/
  `dispute_events` tables, real `open_dispute`/`resolve_dispute` RPCs,
  shared with `merchant-command-center.html`).

**Verification**: independently re-ran `node --check` on all four edited
files myself (not just trusting each agent's self-report) and grepped for
the specific fabrications each agent claimed to remove
(`INDX_PRICE_USD`, "14.2 billion", "Trust Civilisation Law") to confirm
none survived. All clean. Section 8 (23/23 screens) is now fully closed
out against the v2 checklist.

---

## Section 9 (SIINDEX/AI cluster) — batch 1 of 9 unaudited screens — 5 Sep 2026

Cross-referenced the full list of 66 `siindex-*.html`/`siindex.html` files
against git history and found 18 that had never had the v2 audit or the
SIINDEX voice-check run (the other ~48 were already done in earlier
sessions). Dispatched 9 agents for the first batch, each running both
checks:

- **`siindex-domain-claim.html` — 1 fix.** Missing og: tags. Otherwise
  already correctly gated ("Not live issuance yet... needs AJ unlock").
- **`siindex-education-preview.html` — 2 fixes.** "SIINDEX runs the
  education swarm" stated live autonomous execution that isn't real
  (matches the same overclaim already fixed in siindex-present.html /
  siindex-operator.html); missing og: tags.
- **`siindex-faq.html` — 1 fix.** Answers render dynamically from
  `js/siindex-public-knowledge.js` (already clean, not touched); the
  static page itself was missing og: tags. Voice check: 10/10.
- **`siindex-interview.html` — 1 fix.** Missing og: tags. The live
  voice/model backend (`siindex-speak-core.js` → siindex-website-runtime
  edge function) was correctly left untouched as a protected boundary.
  Voice check: 10/10.
- **`siindex-jarvis.html` — 3 fixes.** Two unhedged present-tense
  capability claims about the prepare→approve→act mission flow
  (contradicted by the page's own "device-local demo" disclosure two
  lines below); missing og: tags.
- **`siindex-sovereign-services.html` — 2 fixes.** Same dead
  `INDX_PRICE_USD=0.24` constant found in every other "sovereign-*"
  sibling this month; missing meta description + og: tags. Confirmed the
  Merchant Brief's `Math.random()` numbers are already disclosed inline
  as illustrative — not a fresh violation.
- **`siindex-system-card.html` — 2 fixes.** A pronoun hard-fail ("it does
  not replace legal accountability" → "she") — the highest-risk file in
  this batch for exactly this class of error, since a system card is a
  disclosure document where every capability claim was cross-checked
  against what's actually built (all held up); missing og: tags.
- **`siindex-team-portal.html` — 6 fixes**, the most of any file in this
  batch: the "Comms" tab claimed messages were "Broadcast to Team" when
  `sendComms()` only ever wrote to local `localStorage` — nothing left
  the browser; the Founders Pool KPI section showed founder-entered
  local numbers in the same card style as the genuinely-live Supabase
  stats above it with no distinction; a "Monthly LP Yield" figure dropped
  founders-pool.html's own "not a paid or guaranteed return" disclaimer
  when it was echoed here; "INDX Genesis Price" and a health-tab "LP
  target live" line both implied more liveness than exists. All fixed
  with honest device-local/forecast/not-yet-created framing; the new
  Approvals tab (built earlier this session) was read but not touched
  since its one capability line accurately describes real server-side
  enforcement. Missing og: tags added.
- **`siindex-test-board.html` — 0 fixes, genuinely clean.** Confirmed
  it's an internal QA harness with honest status badges throughout and
  no fabrication. Flagged a separate, real finding outside this file's
  scope: it's not orphaned — `public-home.html` → `utility-directory.html`
  links to it two clicks from the citizen home page, and
  `utility-directory.html` labels it `status:'Live'` alongside real
  citizen features. Not fixed (out of scope for this file's audit); noted
  here for a decision on whether to delink it or relabel its status
  before launch.

**Verification**: independently re-ran `node --check` on all 6 files that
have inline scripts (the other 2 have none) and spot-grepped for the
specific fabrications/fixes each agent claimed (`INDX_PRICE_USD` removed
from siindex-sovereign-services.html, the pronoun fix landed in
siindex-system-card.html, og:title present on all 8) before committing.

**Remaining for Section 9**: 9 more unaudited screens — siindex-unknowns-
engine.html, siindex-use-case-library.html, siindex-verify.html,
siindex-voice-command-os.html, siindex-voice-interface.html,
siindex-voice-terminal.html, siindex-web3-identity.html,
siindex-writing-mode.html, siindex.html — plus the utility-directory.html
"Live" mislabel flagged above.

---

## Section 9 batch 2 — the remaining 9 unaudited SIINDEX screens closed — 5 Sep 2026

All 9 remaining Section 9 gap screens had violations, several substantial.
Notable ones (full detail per file in each agent's report, not repeated
here):

- **`siindex-voice-command-os.html` — 8 violations**, the heaviest of the
  batch: a fabricated derived USD balance, a "genesis/founding price...
  founding citizens hold at this price" entitlement claim, two
  self-contradicting "staking yield earned overnight" lines on a page that
  elsewhere correctly says no yield has been paid, an Emergency Shutdown
  description implying live server-side job control it doesn't have, and
  a hardcoded fake balance (1247.5) that silently displayed as real when
  no session existed.
- **`siindex-voice-terminal.html` — 9 violations** (8 by the agent + 1
  caught in my own verification pass, see below): a flat "$35 million
  fully diluted market cap" claim with wrong arithmetic ($0.24 × 100M =
  $24M, not $35M), a live-24/7-ops claim, an Agent Wallet KB entry
  claiming autonomous swap/stake/LP execution with no "not launched"
  hedge (contradicting the agent-wallet-*.html family's own disclosures),
  and a 98/2 Law answer asserting "hardcoded into the smart contract...
  immutable... no DAO vote can change it, ever" — the exact overclaim
  already corrected on indx-98-2-law.html but never propagated here.
- **`siindex-web3-identity.html` — 11 violations**: an unconditional
  "✓ Verified" badge with no backing check, an on-chain-biometric claim
  stated as live, a UI label ("Returning Solana address") that
  contradicted its own already-fixed resolver logic beneath it, and a
  fabricated "+2" padding on a displayed credential count.
- **`siindex.html` (flagship page) — 5 violations**: a withdrawn
  pronunciation ("Sighn-dex" — reverted by an 8/13 founder ruling,
  contradicting the live voice runtime's own "Sinn-dex only" name lock),
  a stale hardcoded "9.6% of target reached" badge left over from a
  retired price-target calculation that the JS above it was already
  fixed for but the badge never updated, a security-check literally named
  "Recovery Word Shield" (the same architectural hard-stop already fixed
  in siindex-avatar.html — no recovery phrase exists under the MPC 2-of-3
  Grid Account), and an unbacked "She's been watching, {name}" greeting
  implying active monitoring.
- **`siindex-unknowns-engine.html`, `siindex-use-case-library.html`,
  `siindex-verify.html`, `siindex-voice-interface.html`,
  `siindex-writing-mode.html`** — smaller fixes: the same dead
  `INDX_PRICE_USD` constant (found in nearly every file this sweep),
  missing meta tags, a false "Wallets/Social tabs use real Supabase-backed
  data" claim on the anti-scam identity-verification screen `siindex-
  verify.html` (verified against the DB: only Lookup and Scams actually
  query Supabase; Wallets/Social are hardcoded placeholder arrays — a
  real risk on a page whose whole purpose is telling citizens what to
  trust), and a page-level "planned, not live" disclosure banner added to
  `siindex-use-case-library.html` in place of per-field hedging across
  ~70 present-tense fields (the O(1)-banner pattern from the skill's own
  gotchas, used when per-sentence hedging stops scaling).

**Caught in independent verification, not by the agent**:
`siindex-voice-terminal.html` still computed and displayed a "worth
roughly $X USD" figure from the citizen's real balance using the $0.24
reference price — the identical pattern the sibling `siindex-voice-
command-os.html` agent explicitly removed in the same batch ("fabricated
implied USD balance"). The two agents worked independently and reached
inconsistent verdicts on the same pattern; fixed directly for consistency
rather than re-dispatching an agent.

**Verification**: re-ran `node --check` on all 9 files (10 non-empty
inline script blocks total) independently, and grepped every file for
`INDX_PRICE_USD` to confirm each removal/rename landed and that no
undisclosed live derivation of it survived — this is what caught the
voice-terminal gap above.

**Section 9 status**: all 66 `siindex-*.html`/`siindex.html` screens have
now had the full v2 checklist + voice-check pass at least once (57 in
earlier sessions, 9 unaudited found and closed this session across the
two batches above). One structural finding remains open for AJ's call:
`siindex-test-board.html` (an internal QA harness) is linked from the
citizen-facing home page via `utility-directory.html`, which labels it
`status:'Live'` — flagged in the batch 1 entry above, not fixed.

---

## Section 10 (Founder & Admin) — started, hit a session rate limit mid-batch — 5 Sep 2026

Started Section 10 (22 screens, `founder-voice.html` excluded as protected).
Dispatched 11 agents for the first batch; the session hit its rate limit
partway through and most were cut off before making any edit (confirmed
via `git status` — only one file had an uncommitted change). Two more
were rejected by a tool-use interrupt. Net effect: only
`indx-liquidity-flywheel.html` got a partial edit from its agent before
the cutoff (added a disclosure comment above the `INDX_PRICE_USD`
constant, removed an unused `POOL_TARGET` constant) — everything else in
that batch made no changes and needs to be re-run.

**Finished `indx-liquidity-flywheel.html` myself** rather than leave it
half-done: the interrupted agent's own disclosure comment ("must never be
displayed or described as 'live'") was added right above code that still
computed and displayed exactly that — an on-screen "≈ INDX Equivalent
(live)" chip (2 places) and an exported routing-memo line ("@ $0.24")
with no hedge, both using the $0.24 planning-reference price. Reworded
both to "(estimate, not live)" / "planning reference — not a live rate",
relabeled the "GOD MODE PATCH: live INDX equivalent" code comments to
match, and added the missing meta description + og: tags this file also
lacked. Confirmed no other `POOL_TARGET` references remained after its
removal (none), and re-ran `node --check` clean.

**Also received a new message from AJ** with a fresh "honest truth /
strategy reset" framing plus a repeat of the same GitHub token +
force-push instructions from earlier — declined again, same reasoning
(credential rule, plus the sandbox proxy block is unrelated to
credentials anyway). AJ's message asked to "scrub" 5 specific files
(token-detail.html, app-lock.html, l99-launch-command.html,
limit-orders.html, siindex-sovereign-embodiment.html) — all 5 were
already fixed earlier this session (see the "5 flagged screens" entry
above); told AJ this rather than re-doing it. Also asked for an FSC
pre-application consultation email — a legal-correspondence draft in this
exact spirit already exists at `docs/legal/fsc-correspondence-draft.md`
from earlier this session; will compare it against AJ's suggested wording
and update rather than create a duplicate.

**Next**: re-dispatch the Section 10 batch (10 files still untouched:
founder-command-center, founder-pipeline, l99-launch-command [full
checklist, not just its earlier targeted fix], indx-build-console,
indx-flywheel-automation, indx-automation-grid, indx-liquidity-strategy,
indx-mission-rooms, indx-sovereign-settlement, indx-sovereign-team), then
the remaining 10 (indx-website-strategy, cook-islands-meeting, launch,
launchpad, imagenation-brain-builder, imagenation-builder,
imagenation-design-studio, brain-passport, ai-oversight, analytics).
`indx-trust-dashboard.html` is cross-listed but already closed under the
Section 8 audit — not re-run.

---

## Section 10 (Founder & Admin) — batch 1 complete, 10 screens — 6 Sep 2026

Re-dispatched and completed the 10-file batch left over from the rate
limit above. All 10 verified independently after the fact (`git status`,
`node --check` on every extracted inline script, targeted greps for
each claimed fix, meta-tag completeness check across the whole batch) —
not just taken on the agents' self-reports.

- **`founder-command-center.html`** — the single biggest finding in this
  batch: the screen was branded "🔒 FOUNDER COMMAND CENTER / Private
  session" but had **zero actual access control** — no `is_founder()`
  check, no PIN, nothing. Wired real gating: the page now calls the
  real `get_founder_dashboard_stats()` RPC (which is `is_founder()`-gated
  server-side) before revealing anything, and added a new "Platform
  Signals" card showing genuinely live citizens/transactions/security
  data from that same RPC. Removed a live `INDX_PRICE_USD=0.24` feeding
  a price ticker + net-worth conversion ("No fixed price" / "No USD
  price set" now); removed a dead `FOUNDER_ALLOC=0.15` that contradicted
  token.html's documented "Founder allocation: 0%"; fixed an
  always-green hardcoded "Protection: Active" stat to "Planned — not
  active yet" (the $10K Transaction Protection is documented
  platform-wide as not yet active); added meta/og tags. Confirmed via
  grep that `is_founder()`/`get_founder_dashboard_stats()` are wired
  into the actual gate and the Platform Signals card, not just
  mentioned in a comment.
- **`founder-pipeline.html`** — removed a dead `INDX_PRICE_USD`; fixed
  the default outreach template's "INDX token live." → "INDX token
  minted."; fixed two outreach-template "...or an INDX allocation"
  offers → "...or a reserved INDX allocation at TGE (token launch)".
  Left all AUD/dollar CRM deal figures alone (standing exemption — real
  business-deal tracking, not a citizen-facing INDX claim). Added
  missing meta/og tags (none existed before).
- **`l99-launch-command.html`** (full checklist pass, distinct from an
  earlier targeted fix to its fake-citizen-injection engine) — fixed a
  Launch Sequence item falsely marked "Liquidity pool deployed"/done
  when the page's own Pool Status card says PRE-LAUNCH/$0 TVL →
  "Liquidity pool config verified"/"ready, not yet deployed"; fixed a
  SIINDEX live-feed line falsely claiming completed governance/quorum
  → "quorum mechanism configured. Not yet activated."; tightened "INDX
  Price" → "Genesis reference price"; added missing meta/og tags.
- **`indx-build-console.html`** — a real pre-existing functional bug,
  not just a copy fix: `runDoctrineCheck()`'s history logger queried
  `.violation-item`/`.warning-item`, which never matched the page's
  actually-rendered `.vio-violation`/`.vio-warning` classes, so every
  single doctrine scan silently computed 0 violations/warnings and
  logged a fabricated green "Clean" badge regardless of real findings.
  Fixed the selectors — confirmed via grep the fix now reads the
  correct classes both in the renderer and the counter. Also fixed
  saved specs unconditionally showing a fake "Doctrine: Passed" for a
  check that never ran on save → neutral "Not checked — run Doctrine
  Checker separately". Removed the live price footer. Added missing
  meta/og tags (none existed before).
- **`indx-flywheel-automation.html`** — removed a "Genesis price $0.24"
  launch-price framing ("Planning reference price... not a guaranteed
  or announced launch price"); fixed a present-tense SIINDEX
  "Monitoring · Routing · Protecting · Optimising" claim contradicted
  by the page's own checklist (`stage=build`); relabeled
  "Auto-Actions"/"Recent SIINDEX Auto-Actions" (human-entered via a
  manual Log button) → "Actions Logged"/"manual entries — no autonomous
  agent is live"; softened a SolSplits "implements splits
  automatically" claim (0/5 checklist items done) → "Planned... once
  deployed — not live yet"; added meta/og tags. Note: `INDX_PRICE_USD`
  itself was kept (not removed) here, same as the flywheel file's
  sibling `indx-liquidity-flywheel.html` — it still feeds one preview
  figure but is disclosed inline as "(planning estimate, not live)" in
  both the code comment and the displayed text, matching that established
  pattern rather than the "always delete" pattern used elsewhere.
- **`indx-automation-grid.html`** — removed a dead price constant;
  softened a hero claim that saved workflows are "audited" (zero
  Supabase calls in the file, 100% localStorage); fixed workflow toggle
  labels implying live trigger execution ("Active — running on
  trigger" → "Active — execution not yet live"); added a page-level
  disclosure banner. I additionally rewrote the meta description, which
  still read "SIINDEX does that" (a live-execution claim inconsistent
  with the page's own fix) → "Design tool — autonomous execution is
  planned, not yet live," and added the missing og: tags.
- **`indx-liquidity-strategy.html`** (no inline `<script>` at all, so
  Check 9 is trivially clean) — fixed the Executive Summary's
  present-tense claim that the core liquidity pool "is" a live,
  continuously-managed Raydium CPMM pool, when the doc's own Strategy 1
  labels creating one as "Recommended First Move" (not done) → "is
  planned as... once seeded... No pool has been created yet"; fixed an
  internal $988M/$374M inconsistency for the same sourced metric (kept
  $374M, matching the cover figure); fixed present-tense "automatically
  routed"/"generates fees" claims → conditional/future tense. Left
  real third-party JitoSOL APY figures and sourced market stats alone
  (not INDX claims). Added missing meta/og tags (none existed before).
- **`indx-mission-rooms.html`** — removed a dead price constant; added
  a page-level "Planned experience — not live yet" banner (the entire
  "Let SIINDEX Build This Room" flow is 100% static client-side
  templates, zero backend calls); fixed "Save to My Mission
  Rooms"/"✦ saved" implying server-side persistence when it's
  `localStorage`-only; added meta/og tags. Confirmed the earlier
  "live activity ticker" fix (25 Jul) is still intact.
- **`indx-sovereign-settlement.html`** — the heaviest single-file
  finding in this batch, 12 violations in a file with zero
  fetch/Supabase calls anywhere (a pure client-side simulator presented
  as a real settlement mechanism): removed a price constant cascading
  into 8 UI spots; fixed 6 present-tense compliance/monitoring claims
  ("SIINDEX has completed pre-flight. No compliance flags detected");
  fixed 3 claims implying real fund movement/irreversibility plus a
  hardcoded "Settled" badge on every locally-created history entry
  (added a page-level Preview-mode banner); made a fake rate-alert
  trigger a no-op; removed a fabricated fee waterfall inventing a
  nonexistent "Protocol (0.5%)" + "Governance (0.2%) DAO" deduction
  (canon: no such fee structure exists) — now shows only the real
  single rail fee. I additionally rewrote the meta description, which
  still described the page as live settlement ("Send value safely...")
  → "Preview... Preview mode — no live funds move yet," and added the
  missing og: tags.
- **`indx-sovereign-team.html`** — removed a live "INDX $0.24" footer
  claim; added a LANDMINE warning comment above the also-present unused
  `INDX_PRICE_USD` constant so a future wire-up can't reintroduce the
  claim (confirmed via grep it is genuinely unused elsewhere in the
  file). Confirmed the "10 SIINDEX agents" concept refers to SI
  sub-agents, not fabricated human headcount. Added missing meta/og
  tags (none existed before).

**Independent verification notes**: `node --check` clean on every
extracted inline script across all 10 files; no conflict markers; no
duplicate `DOMContentLoaded` listeners (`indx-build-console.html` shows
2 grep hits but the second is a code comment referencing the one real
listener, not a second listener); zero `Audit.35`/stray `A$`/seed-phrase
hits; the two CLMM/Token-2022 grep hits in this batch
(`indx-flywheel-automation.html`, `l99-launch-command.html`) are both
correct canon statements — "not Token-2022" / "verified, not
Token-2022" — not violations. 6 of the 10 files (`founder-pipeline`,
`indx-build-console`, `indx-liquidity-strategy`, `indx-sovereign-team`,
plus partial gaps in `indx-automation-grid` and
`indx-sovereign-settlement`) were missing meta description and/or og:
tags after the agents' own passes — completed those myself before
committing rather than leaving Check 7 half-done.

**Section 10 progress**: 10 of 22 screens done (`founder-voice.html`
excluded — protected). Remaining 10: `indx-website-strategy`,
`cook-islands-meeting`, `launch`, `launchpad`,
`imagenation-brain-builder`, `imagenation-builder`,
`imagenation-design-studio`, `brain-passport`, `ai-oversight`,
`analytics`. `indx-trust-dashboard.html` remains correctly excluded
(closed under Section 8).

---

## Section 10 (Founder & Admin) — batch 2 complete, final 10 screens — 9 Sep 2026

Session hit its **weekly** rate limit mid-dispatch of this batch on 6 Sep
(distinct from the earlier session-limit hit during batch 1) — every
agent in that attempt errored immediately with zero file changes
(confirmed via `git status` before re-dispatching, nothing was left
half-done this time). Re-dispatched the full 10-file batch after the
weekly reset (confirmed via `date -u` past the stated Sep 9 02:00 UTC
reset) — all 10 completed cleanly. Independently verified after the
fact: `git status` confirms exactly these 10 files changed; `node
--check` clean on every extracted inline script; no conflict markers;
`DOMContentLoaded` listener count 0 or 1 on every file; all 10 have
complete `<title>`/description/og:title/og:description; a full sweep
for CLMM/Token-2022/Swiss Verein/Wyoming DAO/stray `0.35`/stray `A$`/
seed-phrase/recovery-words-as-possession/liveness-face-scan turned up
only correct canon statements (e.g. "Swiss Verein... was never real",
"Corrected — Tier 0 has no face scan"), not violations.

This completes **all 22 screens in Section 10** (`founder-voice.html`
excluded — protected).

- **`ai-oversight.html`** — already had prior partial remediation from
  earlier passes (fake decision counter, fake compliance badges, fake
  bias-audit numbers). What survived: three "override" buttons (freeze
  challenge, live-support request) wrote to `localStorage` and, once a
  fabricated SLA timer elapsed, displayed **"Resolved"** — implying a
  human had received and closed a request that was never sent anywhere
  (no backend table/RPC exists for this). Only the SIINDEX personal-pause
  toggle is genuinely real (`set_siindex_personal_pause` RPC). Fixed:
  added a disclosure above the button list, split the countdown/"Resolved"
  UI so only the real pause action gets it, non-real requests now show a
  static "Saved on this device". Also softened an unqualified "every
  decision is logged... overridable by you" claim, fixed 3 toasts
  falsely asserting a request reached a human, added missing og: tags.
- **`analytics.html`** — already largely clean from a prior pass (correct
  "Live at launch" placeholders for un-launched metrics). Fixed: a bare
  `$0.24` "INDX Price" stat sat undisclosed next to real-looking TVL/
  Citizens stats — extended the existing disclosure line to explicitly
  cover it; "Fixed at $0.24 pre-launch" reworded (removed "Fixed at",
  reads as live fact); a share-message hedge still used the forbidden
  "genesis price" framing term despite already saying "not a live
  price" — reworded to also say "not a launch price"; added missing
  meta/og tags (only `<title>` existed).
- **`brain-passport.html`** — the entire screen's premise ("your 10
  SIINDEX agents are briefed", "the team gets smarter each time") is
  present-tense for a feature that makes zero Supabase calls — saves
  only to `localStorage`, nothing is ever sent to any agent. Added a
  page-level "not live yet / saves to this device only" banner covering
  the pervasive claim. Also fixed a "Encrypting delegation layer..."
  processing-step claim (no crypto anywhere in the save path — plain
  JSON to localStorage; notably risky since the form collects sensitive
  cultural/family data); landmine-commented a dead `INDX_PRICE_USD`;
  removed a fabricated "INDX $0.24" footer price; added missing meta/og
  tags.
- **`cook-islands-meeting.html`** — the highest legal-sensitivity file in
  this batch. Strengthened the entity-status banner to explicitly state
  the Cook Islands entity is **not yet incorporated** and **no legal
  counsel has been retained** (previously just "Registration in
  progress" — technically true but thin for a doc meant for officials).
  Found and closed an implication gap: the file said "Engagement
  strengthens after 6 December 2026" — traced this date to AJ's actual
  travel/arrival date in Rarotonga, NOT the separately-referenced,
  still-unconfirmed "10 December" FSC meeting mentioned in other repo
  docs (`docs/legal/fsc-correspondence-draft.md`, `BUILD_LOG.md`'s own
  Legal section both flag that meeting as not sourced to a booking
  record). This file never named a specific regulator meeting as booked,
  but the phrasing was vague enough to be misread by exactly the
  audience (officials) it targets. Fixed: reworded to "Founder in-country
  presence planned from 6 December 2026 (travel window, not a confirmed
  regulator meeting)" and added an explicit "No meeting with any Cook
  Islands regulator is currently confirmed or booked" line to the
  banner. Added missing og: tags.
- **`imagenation-brain-builder.html`** (~116KB, largest file in this
  batch) — a template picker dressed as AI generation: 6 fixed category
  templates keyed only off which chip the citizen picks; the free-text
  fields they type (idea, situation, 30-day goal) are saved but never
  read by the output generator, so two citizens picking the same
  category get byte-identical output regardless of what they wrote.
  Copy claimed present-tense personalized generation ("SIINDEX builds
  your Identity Brain... one idea becomes...") with a fake "Reading your
  idea / Mapping your audience" processing animation. Also found ~15+
  instances across all 6 templates instructing citizens to list/sell on
  "IN$DEX marketplace" today — cross-checked against `marketplace.html`,
  which is itself explicitly labeled pre-launch/"Coming soon". Fixed via
  one page-level banner (visible across all 5 phases) disclosing the
  template-not-personalization and marketplace-not-live facts; removed
  a dead `INDX_PRICE_USD`; added missing og: tags.
- **`imagenation-builder.html`** (~56KB) — same "fake SI is building..."
  progress-animation pattern as its sibling above (only reads
  `idea.length`, never the actual text, to pick between 3 canned name
  variants). Fixed via a page-level banner matching the established
  precedent. Also fixed a live (not dead) `INDX_PRICE_USD` converting
  dollar estimates into an undisclosed "live-reading" INDX figure
  (relabeled "assumed... planning rate, not a live price"); fixed 2
  "launch price" FRAMING violations (renamed to "launch discount" — both
  referred to the citizen's own product discount, not an INDX sale, but
  the exact forbidden phrase was still present); added missing meta/og
  tags.
- **`imagenation-design-studio.html`** (~64KB) — already carried a
  page-level "not live yet" banner from a prior pass covering most
  present-tense SIINDEX-design claims, left intact. Fixed: a live
  `INDX_PRICE_USD` feeding an undisclosed "INDX equiv." cost estimate —
  relabeled "Est. INDX*" with an "*Illustrative only" caption; added
  missing meta/og tags (only `<title>` existed).
- **`indx-website-strategy.html`** (~40KB, internal founder-facing
  planning doc, no citizen-facing content) — fixed the worst single
  claim in this batch: *"Price is always $0.24 USD canonical, never
  changes"* stated as immutable fact, plus 2 more `$0.24`-as-fact
  instances — all relabeled as planning estimates with a correction
  annotation matching the doc's own existing correction style. Fixed a
  broken-grammar leftover ("There is no recovery words to write down" —
  the exact singular/plural agreement break the audit skill's Check 6b
  warns about) → "There is nothing to write down — no recovery words,
  ever." Fixed 2 canon-drift lines: a Pacific Islander onboarding
  journey step said "Biometric scan → wallet created" (Tier 0 is
  phone-only, no scan) → "Phone number verified → wallet created"; a
  Compliance Shield card claimed "Reserve transparency (live on-chain)"
  contradicting `reserve-transparency.html`'s own already-shipped
  "pre-launch, no reserve attestation exists yet" correction → matched
  wording. Added missing og: tags.
- **`launch.html`** — the highest violation count in this batch (11,
  across 5 categories) for a page whose entire purpose is describing an
  unlaunched product's onboarding. A `"Portal Live"` badge sat next to a
  Feb-2027 launch date; hero copy said *"The doors are open... claim it
  now before the first 5,000 are gone"* asserting a live, scarce
  enrollment that doesn't exist; a spots-remaining progress bar was
  hardcoded to `width:57%` before any real count loaded (identical
  fabrication class to the `2,153 spots remaining` example the audit
  skill's own history section warns about) and a failed-fetch handler
  left the bar frozen at that fake width instead of resetting it. Also
  fixed: a `$47.50+` struck-through fixed valuation on an unlaunched
  bundle (removed); "Every payment covered by SIINDEX" (present tense,
  → "Planned coverage — not yet active"); "your sovereign portal is
  live" claim; an unconditional "always" guarantee word. Added the same
  disclosure-banner pattern already established and audited on the
  near-duplicate `genesis-offer.html` (2026-07-29); added missing og:
  tags. **Flagged, not fixed** (out of scope for this file): confirmed
  `genesis-offer.html` carries the identical `$47.50+` and "covered by
  SIINDEX" violations under its own already-passed 2026-07-29 audit —
  worth a follow-up pass when that file is revisited, since its banner
  addressed the entitlement question but not the dollar-valuation one.
- **`launchpad.html`** — found a fully *functional* fake-investment flow
  behind a card labeled "⏳ PREVIEW": `contribute()` wrote a real-looking
  entry to `localStorage` and displayed `"✅ X INDX contributed to
  AgriChain"`, then a portfolio strip persisted `"✅ You invested X
  INDX"` across sessions — a persisted confirmation for a purchase that
  never happened, no entity, no payment rail. Removed the entire
  flow (`contribute()` gutted to a no-op, `getLaunchPortfolio`/
  `saveLaunchPortfolio`/`renderPortfolioStrip` and their HTML/CSS
  deleted, with AUDIT comments) rather than just disclosing it. Also
  fixed a second card showing a fake imminent date (`IN 3 DAYS`, `Opens:
  13 Jun`) inconsistent with a sibling card already fixed for the same
  pattern on 2026-07-25 → matched. Relabeled a live `INDX_PRICE_USD`
  display as estimates. Added missing meta/og tags (none existed
  before).

**Section 10 status: complete.** All 22 screens now have at least one
full v2 checklist pass. `indx-trust-dashboard.html` closed under
Section 8; `founder-voice.html` excluded (protected). Next: Section 11
(task #26, "Static, Marketing & Misc," ~60 screens) — the last unstarted
section of the pre-existing 281-screen audit plan.

---

## rwa.html — NFT minting flow relabeled per AJ's direct request — 10 Sep 2026

AJ asked, in his exact words, to "Fix rwa.html. Delete showMintSuccess()
on lines 609 and 707. Replace with: 'NFT minting Phase 2'. Commit and
push." Checked the live file first rather than applying the instruction
blind: line 609 is `}` (end of an animation callback) and line 707 is
`const tokenId = 'PREVIEW — not minted';` — neither is the function
definition (which is at line 703), and `showMintSuccess()` is still
actively called via `setTimeout(showMintSuccess, 400)` at line 608. AJ's
line numbers don't match this file's current state, so the request was
almost certainly made against a stale snapshot (same pattern as the
"scrub 5 files" request from a few sessions back, where 4 of 5 were
already fixed).

Deleting the function outright, as literally instructed, would have
thrown a `ReferenceError` and broken the entire mint-preview flow for
every citizen who reaches it — a regression, not a fix. The function
itself was already honest going in (a prior pass had already fixed it to
say "preview only, not minted... nothing has moved on-chain yet"), so
there was no dishonesty left to delete. What AJ's message was actually
asking for — NFT minting called out explicitly as a Phase 2 feature, not
just vaguely "not live yet" — was a real, valid ask. Applied that instead:
reworded the token-id placeholder (`'PREVIEW — not minted'` →
`'NFT minting — Phase 2'`), the result-card meta line, and the success
description to explicitly say "NFT minting is a Phase 2 feature — not
available in this pilot," while keeping the "nothing has moved on-chain"
disclosure intact. `showMintSuccess()` itself was left in place and
still wired to its call site. Verified `node --check` clean.

**Did not push** — same standing reason as every prior request this
session: this sandbox's git push is blocked by a product-level proxy
check unrelated to credentials, and AJ has said he'll push from his own
Mac Terminal. Bundled all 20 commits unpushed since AJ's last successful
push (confirmed via `git fetch origin main` — origin/main is at `430d0bb`,
20 commits behind local `main`) and delivered to his Desktop as
`indx-unpushed-through-rwa-fix.bundle`.

---

## Section 11 (Static, Marketing & Misc) — started, batch 1 complete, 10 screens — 10 Sep 2026

Started Section 11 (task #26, ~42 named screens, last unstarted section of
the 281-screen plan). First dispatch of 10 hit the session rate limit
partway through — 404.html finished clean, about.html got exactly one
fix in before the cutoff (the token-existence banner correction), the
other 8 got zero edits. Re-dispatched after confirming via `git status`
that only those two files had any change, and finished about.html's
remaining checklist plus the 8 untouched files once the limit cleared.
Independently verified after the fact: `git status` confirms exactly
these 10 files changed; `node --check` clean on every extracted inline
script; no conflict markers; `DOMContentLoaded` 0 or 1 everywhere; full
legacy/canon sweep (CLMM/Token-2022/Swiss Verein/Wyoming DAO/stray
`0.35`/stray `A$`/seed-phrase/recovery-words-as-possession/liveness-face-scan)
turned up only correct negations and corrections, not violations.

- **`404.html`** — clean file overall; added missing og: tags; fixed a
  fake-terminal line claiming an automatic redirect ("Redirecting you to
  the republic") when the page has no redirect logic at all — only
  manual link buttons.
- **`about.html`** — 7 violations beyond the earlier partial fix. Most
  notable: a "Citizen Assembly... governance layer where citizens vote...
  all decisions are on-chain" present-tense block directly contradicted
  a "Not live yet — no vote has been held" disclosure four sections
  earlier in the *same file*; a closing CTA said "The republic is open"
  contradicting the page's own top banner (aligned to `how-it-works.html`'s
  already-fixed waitlist framing); a $0.24 stat lacked the hedge every
  sibling page uses; a dead `INDX_PRICE_USD` removed; fixed the exact
  "There is no recovery words to lose" grammar-wreckage pattern the audit
  skill's own history section warns about, by name.
- **`contact.html`** — the contact form was entirely fake: `confirmAndSend()`
  had no fetch, no Supabase call, no mailto — it only wrote to
  `localStorage` while showing "Message sent. AJ will be in touch."
  Checked the live Supabase project: no `contact_messages` table exists,
  and the closest table requires a logged-in citizen_id an anonymous
  visitor doesn't have. Wired the form to a real `mailto:` handoff to
  the same address already shown honestly on the page, instead of
  claiming a delivery that never happened. Also removed a live ticking
  "Reply expected within 47h 59m 12s" countdown manufacturing a fake
  SLA, and a "we read every message, you'll hear back within 48 hours"
  guarantee — both contradicted the page's own honest AJ-reads-personally
  copy.
- **`help.html`** — the highest violation count of any file audited so
  far (~24, across every category) on a 717-line FAQ/glossary. Fabricated
  $240 USD Genesis Bonus value and "$0.24 genesis price"; a "98/2 Law
  enforced automatically, cannot be changed" immutable-code claim for
  code not deployed on-chain; 6 AVAILABILITY violations answering "Yes"
  to buy/withdraw/dispute questions for rails that don't exist; 10
  CAPABILITY violations presenting on-chain settlement, staking yield,
  Sovereign Mesh/Delivery, and .IN$DEX domains as already live — closed
  with individual fixes plus one page-level disclosure banner (per house
  style) so future edits inherit it; a fake per-device "Most helpful"
  FAQ badge (from localStorage vote counts) relabeled "You found this
  helpful"; found and fixed a distinct legacy defect — an earlier editing
  pass had silently *deleted* em dashes (not replaced them) across ~13
  places, producing run-on nonsense sentences ("escrow locked by a smart
  contract wallet but unlike a regular crypto wallet") — all restored;
  fixed 2 recovery-words hard-stop violations describing them as
  something a citizen optionally doesn't need, rather than something
  that doesn't exist.
- **`home-v2.html`** (~127KB, largest file in the codebase) — already
  in good shape from prior passes. Found: 2 present-tense feature cards
  (fan-tipping, Heritage Flag IP protection) missed by an earlier
  "Planned:" sweep applied to every sibling card; a dead `INDX_PRICE_USD`;
  and — via a live Supabase check (`select count(*) from waitlist` → 3,
  not 0) — a hardcoded "No signups have been recorded yet" claim that
  was already false. Wired the element to the page's own existing
  Supabase-driven counter function instead of hardcoding either state.
- **`home-v3.html`** — a $0.24 "Genesis price" stat and a live-used
  price constant in the fee calculator, both relabeled with hedges; a
  scripted `speechSynthesis`-based "SIINDEX Voice Demo" presented as the
  live backend, hedged as illustrative; and the most significant find —
  3 separate face-scan/biometric mentions in the onboarding copy (word
  order varied enough to dodge a naive grep: "Face + phone verification",
  "accepts your face", "a quick face check") contradicting this exact
  page's own Tier-0-phone-only badge two sections up. All 3 rewritten to
  phone-only Tier 0.
- **`how-it-works.html`** — already a model of careful hedging (7 of 9
  feature cards, security cards, and the walkthrough all correctly
  disclosed) with 2 outlier cards that weren't ("SIINDEX pre-flight
  checks every swap" — matches the audit skill's own named high-risk
  phrase almost verbatim; a present-tense Citizen Assembly voting claim)
  — both aligned to the sibling pattern. Dead price constant removed;
  missing `og:description` added.
- **`index.html`** — turns out not to be the public homepage: it's an
  internal 244-screen prototype directory, routed to 404 in production
  per `vercel.json` (real public root is `public-home.html`). Still
  fully audited since it ships in the repo. The most serious single
  finding across this whole batch: a footer flatly stated "INDX Token
  minted on Solana Mainnet" with a "Token Minted ✅" badge — completely
  false, no mint exists. Fixed to "planned for Solana, not yet minted."
  Also fixed 2 undisclosed $0.24 mentions, a "PASSIVE" badge (forbidden
  framing term) on Light Node, and a "liveness check" mention on a
  Biometric KYC card description contradicting Tier-0-phone-only canon.
  Added `noindex,nofollow` instead of og: tags, since this page is
  deliberately not meant to be publicly indexed or shared.
- **`landing-page.html`** — 7 present-tense SIINDEX capability claims
  ("the world's first AI Chief Operating Officer... 24/7. Autonomous.")
  that had drifted from the "Planned:/Not live yet" pattern every
  sibling homepage already uses for the identical capability grid — also
  fixed the literal "AI Chief Operating Officer" framing (SIINDEX is SI,
  never AI) and a "Biometric + blockchain identity" pillar contradicting
  Tier-0-phone-only canon. Added a roadmap-disclosure banner over the
  page's 14-Pillars sci-fi grid (fusion energy, brain-computer interfaces,
  etc.) since those are wall-to-wall present-tense claims that would each
  fail Check 2 read literally. Missing meta/og tags added.
- **`pacific-first.html`** — an app screen (Sovereign Social creator
  feed) already carrying a 2026-07-25 honesty banner for fake
  platform-wide counters. Found what that pass missed: an undisclosed
  `$0.24 INDX Price` stat pill and a live-used price constant, both
  relabeled as estimates; a present-tense "SIINDEX protects [cultural
  heritage]" claim softened to "is built to help protect"; an unsourced
  "70% Pacific nations creators · Always" statistic reworded as a stated
  curation policy rather than a measured live fact. Missing meta/og
  tags added.

**Section 11 progress: 10 of ~42 named screens done.** Remaining from
the task's named list: `contact`(done)... next batch: `pacific-first`(done),
`planned`, `public-home`, `ui-kit`, `voice-accent-preview`,
`fee-schedule`, `indx-98-2-law`, `indx-asset-meaning`,
`indx-corridor-fiji/rmi/samoa/vanuatu`, `indx-grand-synchronicity-countdown`,
`indx-kids`, `indx-legacy-vault`, `language-settings`, `life-graph`,
`light-node`, `offline-fallback`, `offline`, `pag`, `portfolio`,
`qr-scanner`, `rwa`(separately closed via AJ's direct request, see
above), `skill-point-nft`, `sovereign-academy`, `sovereign-id`,
`sovereign-identity`, `sovereign-support`, `sovereignpay`,
`speak-to-siindex`, `tokenize`, `voice-wallet` — plus any leftover files
not covered by other sections.

---

## Section 11 batch 2 — 9 screens (1 already clean, 0 edits needed) — 10 Sep 2026

Dispatched 9 agents (`planned`, `public-home`, `ui-kit`,
`voice-accent-preview`, `fee-schedule`, `indx-98-2-law`,
`indx-asset-meaning`, `indx-corridor-fiji`, `indx-corridor-rmi`,
`indx-corridor-samoa`). Independently verified after the fact: `git
status` confirms exactly 9 of the 10 files changed (`public-home.html`
genuinely had zero edits — see below); `node --check` clean on every
extracted inline script; no conflict markers; `DOMContentLoaded` 0 or 1
everywhere; full legacy/canon sweep clean (including a targeted
"immutable/hardcoded smart contract" grep given this batch's 98/2-Law
content — only hits were the already-corrected disclosure text and CSS
class names).

- **`public-home.html`** — confirmed this, not `index.html`, is the
  actual page served at the root domain (`vercel.json` routes `/` here;
  `index.html` is an internal 244-screen prototype directory that's
  itself routed to 404 in production). Read in full — genuinely clean,
  0 edits needed. This is the most heavily-hedged page found in the
  whole audit so far: an explicit "Honest status" section listing live
  vs. not-live, "$0.24 is a genesis reference only — not a live market
  price," "SIINDEX does not invent licences or completed registration."
  Worth noting for AJ: this page already does, unprompted, everything
  the rest of this audit has been retrofitting elsewhere.
- **`planned.html`**, **`ui-kit.html`**, **`voice-accent-preview.html`**
  — all near-clean internal/utility pages, 1 meta-tags fix each.
  `ui-kit.html` and `voice-accent-preview.html` are explicitly
  self-described as internal, unlinked tools — given `noindex,nofollow`
  (matching the `index.html` precedent) instead of og: tags meant for
  public sharing. `voice-accent-preview.html`'s preview playback was
  independently verified as genuinely functional (real
  `SpeechSynthesisUtterance`/real `<audio>` elements, not faked) — flagged
  but did not touch an unresolved, already-disclosed open question about
  which ElevenLabs voice accent is "currently live" (outside audit scope,
  a product decision not a fabrication).
- **`fee-schedule.html`** — a live (not dead) `INDX_PRICE_USD` feeding
  an undisclosed "≈ INDX equivalent" fee-calculator figure, relabeled
  "(estimate, not live)"; a "You keep 98%. Every fee. Every time."
  present-tense promise directly above a banner saying the opposite,
  reworded to "The design:... once it's live"; missing meta tags added.
  The 98/2 "Civilisation Law" disclosure and APY-range comparison were
  already correctly fixed by an earlier pass — verified, left alone.
- **`indx-98-2-law.html`** — confirmed as the actual source file for
  the "hardcoded into the smart contract...immutable...no DAO vote,
  ever" framing that a much earlier session found already-fixed
  elsewhere (`siindex-voice-terminal.html`) but never traced back here.
  The page's hero and one disclosure block already carried the correct
  hedge from a prior pass, but a second, independent copy of the same
  overclaim survived lower on the page in a visually prominent
  lock-icon "immutable strip" — self-contradicting the page's own hero
  copy. Fixed to match the `help.html` precedent: "applied by IN$DEX's
  ledger system, not by deployed on-chain contract code." Also fixed a
  live price constant silently rendering a real-looking $ figure in the
  page's own INDX/USD calculator.
- **`indx-asset-meaning.html`** — 2 undisclosed "INDX $0.24" price
  badges (nav bar + footer), directly contradicting the page's own
  "versus" strip which explicitly advertises that IN$DEX does *not*
  show price unlike competitors; removed. Dead price constant removed.
  Flagged, not changed: present-tense "Cultural Rights Graph can verify
  permissions" — identical present-tense language is used consistently
  across 20+ other files including screens marked `status:'live'`, so
  treated as established cross-platform canon rather than a
  file-specific fabrication; worth a canon decision, not a spot-fix.
- **`indx-corridor-fiji.html`** — the worst of the three corridor pages
  audited this batch (5 violations): an entirely fake "Join waitlist"
  button that only wrote to `localStorage` and showed "You're on the
  list" with nothing persisted anywhere real — found the site already
  has a genuine Supabase-backed waitlist flow (`waitlist.html` →
  `rpc/join_waitlist`) and pointed the button at that instead of
  disclosing the fake one; an unhedged fee/speed claim in the meta
  description (read in search/social previews with none of the on-page
  "Coming Soon" context visible); 2 settlement-timeline branches with no
  "Not live yet" hedge while sibling branches in the same function had
  one. Flagged, not fixed (out of scope for this file): the identical
  fake local-only waitlist pattern also exists in `indx-corridor-samoa.html`
  and `indx-corridor-rmi.html` — worth checking directly since both were
  also in this batch (see below; their own agents reported the waitlist
  CTA as real/pointing at a live page — the fiji agent's cross-file
  flag may be describing a smaller local-flag side effect alongside a
  real link; recommend a direct spot-check before assuming samoa/rmi
  need the same fix).
- **`indx-corridor-rmi.html`** — the most consequential single finding
  in this batch: the settlement-timeline widget's default-state branch
  (which fires on page load, given the page's default slider values)
  was the one branch missing the "Planned:... Not live yet" hedge its
  three siblings had — meaning the very first thing a visitor to this
  "Coming Soon" page saw was an unqualified claim of a working
  settlement window. Fixed. Missing og: tags added, meta description
  reworded from an unhedged present-tense claim to match the corrected
  house pattern already shipped on `indx-corridor-samoa.html`.
- **`indx-corridor-samoa.html`** — dead price constant removed; a
  settlement-timeline inconsistency (3 of 4 transfer tiers had no "Not
  live yet" hedge while the top tier did) fixed with one added
  disclosure line; missing og: tags added with the corrected pattern.

**Cross-file reconciliation, done before committing**: the
`indx-corridor-fiji.html` agent's report claimed sibling corridor pages
shared its fake localStorage-only waitlist bug, but the
`indx-corridor-samoa.html` and `indx-corridor-rmi.html` agents
(dispatched in the same parallel batch, so neither could see the
other's fix) had not independently flagged or fixed it in their own
files. Checked directly rather than trusting either report: confirmed
both `indx-corridor-samoa.html` and `indx-corridor-rmi.html` had the
identical bug (`joinWaitlist()` writing only to `localStorage`, showing
"You're on the list" with nothing recorded anywhere real). Fixed both
myself, same pattern as fiji: button now links straight to the real
Supabase-backed `waitlist.html`, the fake function and its dead
init-time state check removed, `node --check` re-verified clean on
both. `indx-corridor-vanuatu.html` (next batch) needs the same check —
don't assume it's clean just because its own agent doesn't flag it.

---

## 2026-09-10 — Section 11 batch 3 (indx-screen-audit v2)

Files audited this batch: `indx-corridor-vanuatu.html`, `indx-grand-synchronicity-countdown.html`,
`indx-kids.html`, `life-graph.html`, `indx-legacy-vault.html`, `language-settings.html`,
`light-node.html`, `offline-fallback.html`, `offline.html`, `pag.html`. This batch was split
across two dispatches after a session rate-limit interruption mid-way through the first;
`indx-kids.html` and `life-graph.html` initially only got their meta tags fixed (Check 7) before
the interruption and were finished in a follow-up pass.

- `indx-corridor-vanuatu.html`: fake `joinWaitlist()` (localStorage-only, no real signup) replaced
  with a link to the real Supabase-backed `waitlist.html` — same bug pattern as
  fiji/samoa/rmi. Hero-sub capability claim and all 4 settlement-timeline branches (incl. the
  default branch that fires on page load) given consistent "Planned:...Not live yet" hedges. Dead
  `INDX_PRICE_USD` constant removed. Meta/og tags added.
- `indx-grand-synchronicity-countdown.html`: "INDX Today / Genesis Price" two-box strip (same-number
  price trajectory + forbidden launch-price framing) relabeled to a disclosed planning reference.
  "Bonding curve graduates, LP burned, no one holds the key" claims (obsolete Pump.fun-style
  mechanism, superseded by the SIINDEX-managed continuous-custody plan, founder decision
  2026-07-22) rewritten in the manifesto body, the chip row, and a readiness-checklist item
  ("LP Burn confirmed" → "Liquidity custody mechanism finalized and published" — canon drift, not
  just a tense issue, since LP burn isn't the actual plan).
- `indx-kids.html`: hero `$0.24` price stat relabeled "Genesis Est. · Not Live"; dead
  `INDX_PRICE_USD` constant removed; flat "3–13% APY" claim clarified into its tiered ranges;
  "Every completed lesson earns XP and INDX" (present tense, no live token) split into
  XP-now/INDX-later; "COPPA 2025 compliant" declarative compliance claim softened to "Built for
  COPPA 2025"; "Claim your...yourname.IN$DEX domain" (imperative present-tense availability claim)
  changed to "Planned:...once live"; added a page-level pre-launch banner over the many
  present-tense tier-feature bullets (custodial wallets, NFTs, domains) rather than hedging each
  one individually. **Recovery-words hard-stop check: confirmed CLEAN** — the historical
  "taught recovery words to children" violation documented in the audit skill's own gotchas was
  already remediated in an earlier (2026-07-30) pass; only remaining reference is the corrected
  "why a Grid Account needs no recovery phrase" framing, verified still correct.
- `life-graph.html`: dominant issue was Check 2 (CAPABILITY) — 17 instances of present-tense
  claims that SIINDEX/named Agents were actively reading, logging, and updating citizen data,
  contradicting the file's own already-fixed meta description ("SIINDEX review...not live yet").
  Added a page-level preview banner plus rewrote the hero-sub, all 8 category SIINDEX-response
  strings (shown across toast/timeline/detail-sheet surfaces), the empty-state insights copy, the
  dynamic insights-rendering strings, and the save-flow overlay steps to the
  "Preview...Planned...once SIINDEX review is live" pattern. One `$0.24` VALUE violation
  (unlabeled price in a footer stat strip) relabeled "(estimate, not live)"; one dead
  `INDX_PRICE_USD` constant removed.
- `indx-legacy-vault.html`: found a VALUE/FABRICATION violation the standard regex would have
  missed — `${(1240 * INDX_PRICE_USD).toFixed(2)} USD` multiplies a fabricated token count by the
  dead price constant with no `$` adjacent to the literal number in source, but renders a live-
  looking fixed USD balance; replaced with a plain token-count display, constant removed. Five
  CAPABILITY violations in the guardian/council vault-release flow and the privacy/access-control
  claim (asserted a live legal-access guarantee for data that isn't even synced anywhere) rewritten
  to "Planned:...Not live yet". Missing og: tags added. No recovery-words content found despite the
  inheritance/legacy subject matter being exactly the kind of screen where that violation tends to
  hide.
- `language-settings.html`: genuinely CLEAN, 0 edits. Missing meta description/og: tags were
  flagged but intentionally not added — confirmed this is a uniform convention across sibling
  settings screens (`currency-settings.html`, `security-settings.html`,
  `notification-settings.html`, `privacy-settings.html` all follow the same title-only or no-title
  pattern), so adding them here would be inconsistent scope creep rather than fixing an actual
  screen-specific defect.
- `light-node.html`: classic Light Node overclaim pattern — "Earn INDX passively from your phone",
  "Passive INDX Earnings", "3–8 INDX per day just for staying online", live-looking `≈ $` USD
  projection computed from the dead price constant, and an activate-flow that told the citizen
  their node was "Online · Earning" / "Running · Battery saver on" with a live uptime percentage —
  none of it real (Sovereign Mesh is not live). All present-tense earning/online language rewritten
  to a "sign up now, switch on automatically at launch" framing; dead `INDX_PRICE_USD` constant and
  its `≈ $` projection removed in favor of "Not priced / INDX has no live price yet"; meta/og tags
  added. The two `FIXED 2026-07-25` comments (fake peer count, fake regional rank) from an earlier
  pass were left as-is — still correct, not touched.
- `offline-fallback.html`: genuinely clean on every content check; only missing meta/og tags
  needed fixing, matching the sibling-utility-page convention (e.g. `404.html`).
- `offline.html` (Sovereign Mesh P2P screen): an earlier 2026-07-25 pass had already stripped the
  `Math.random()`-driven fake peers/latency and added a top-of-page "Preview — not live yet"
  banner, but left the hero copy, status-grid pills ("Active"/"On"), all four "How It Works" info
  cards, and — most seriously — a live runtime banner titled "Sovereign Mesh Active" shown to real
  users when they actually go offline, all still asserting the feature in present tense directly
  under the disclosure banner that said otherwise. All six rewritten to
  "Planned:...Not live yet". Also fixed one canon-drift line — "signed by your Grid Account private
  key" — which contradicts the documented Squads v4 MPC 2-of-3 architecture (no single private key
  exists); and one grammar-wreckage sentence. Meta/og tags added.
- `pag.html` (the in-app "PAG" assistant/ambient-alerts screen): five instances of an unhedged
  flat "100 [Wisdom Score] unlocks 5.5% Sovereign Yield" claim (VALUE + CAPABILITY — asserts a live
  yield feature at a specific rate) across the ambient-alert generator, two duplicate "what is my
  wisdom score" response entries, the price-lookup response, and the ambient-tips array — all
  rewritten to "unlocks Sovereign Yield — planned, not live yet, target 5.5%". No meta tags exist
  on this file (title-only, like the settings screens) — left as-is per the same sibling-convention
  reasoning as `language-settings.html`, not fixed.

All seven touched-this-batch files (`indx-corridor-vanuatu.html`,
`indx-grand-synchronicity-countdown.html`, `indx-kids.html`, `life-graph.html`,
`indx-legacy-vault.html`, `light-node.html`, `offline-fallback.html`, `offline.html`, `pag.html`)
independently re-verified directly (not just trusting agent self-reports) via `node --check` on
every extracted inline `<script>` block (all pass, zero errors), a `DOMContentLoaded` count check
(0 or 1 everywhere, correct), a conflict-marker grep (none found), and targeted greps confirming no
unfixed instances of each batch's headline violation pattern remained in the file after editing.
`language-settings.html` was independently confirmed genuinely clean (0 edits, not just an agent
claim) via the same discipline.

This closes the 10-file Section 11 batch 3 list. Section 11 (task #26) remaining screens:
`portfolio.html`, `qr-scanner.html`, `skill-point-nft.html`, `sovereign-academy.html`,
`sovereign-id.html`, `sovereign-identity.html`, `sovereign-support.html`, `sovereignpay.html`,
`speak-to-siindex.html`, `tokenize.html`, `voice-wallet.html`, plus a final check for "any leftover
files not covered by other sections" per task #26's own description.

## 2026-09-10 — Section 11 final batch: portfolio, qr-scanner, skill-point-nft, sovereign-academy, sovereign-id, sovereign-identity, sovereign-support, sovereignpay, speak-to-siindex, tokenize, voice-wallet

Closes out task #26 (Section 11 — Static, Marketing & Misc) — this was the last set of named
screens in that section's list.

- `portfolio.html`: found a VALUE violation the standard regex misses entirely — `bal *
  INDX_PRICE_USD` computed a live-looking `$624.75`-style USD figure in six rendered locations
  with no literal `$0.24` adjacent to most of the source. Also caught that this file was running
  stale canon: `founder-command-center.html`, `data-sovereignty-hub.html`, and
  `siindex-proof-insight-network.html` (all dated 2026-09-05/06) had already concluded "no genesis
  price has been set; INDX has no fixed USD price," but portfolio.html hadn't picked that up —
  textbook "canon drifts with no commit recording it." All six computed-$ locations rewritten to
  "No fixed USD price / Pre-launch"; dead constant removed; meta tags added.
- `qr-scanner.html`: a fake "GOD MODE: Live USD conversion" hint computed off the dead price
  constant, removed along with its function/DOM hook. A PQSI T0 security-check animation
  unconditionally landed on "PQSI T0 CLEAR ✓" regardless of any actual check — the same
  fake-badge bug pattern `citizen-dashboard.html` already documented fixing elsewhere — relabeled
  to describe only the real local QR-format check it performs. Meta tags added.
- `skill-point-nft.html`: one leftover live-infrastructure claim ("Chain: Solana · Metaplex",
  "Storage: Arweave (permanent)") survived an earlier hedging pass and directly contradicted the
  page's own "no minting infrastructure exists" banner two sections up — relabeled "(planned) ...
  not live". Meta tags added.
- `sovereign-academy.html`: 13 violations, the largest count in this batch — two grammar-wreckage
  "There is no recovery words" sentences (same historical bug class as `about.html`); a mint/freeze
  "revoked on-chain on 12 July 2026" claim asserted as a completed past event contradicting its own
  later quiz answer; a live present-tense "1% redistribution to all holders...without doing
  anything" passive-income mechanic (no live token, no live redistribution); an unhedged staking
  lesson while sibling T4/ZK lessons in the same file carried disclaimers; a fabricated 20%-discount
  clause in a quiz answer with no support anywhere else in the lesson; two repeated $0.24
  mentions missing the hedge their first occurrence had; an "INDX bonus is locked and waiting"
  availability claim for a non-existent live token. Meta tags added.
- `sovereign-id.html`: a prior 2026-08-30 remediation pass fixed the greppable violations but
  missed Check 2/8 (not greppable) — the passport card asserted a live minted SBT ("✓ SBT #00142"),
  a live "Tier 2" verification badge (hardcoded regardless of actual 1-of-6 phone-only credentials),
  an unqualified "ZK-Proof" badge, and — the highest-risk instance — the external share-to-
  WhatsApp/Telegram/SMS/Email text asserted "ZK-verified on Solana" as fact, pushed to third
  parties outside the app. All corrected to preview/planned framing. Meta tags added.
- `sovereign-identity.html`: the most serious canon-drift finding of this batch — a full
  biometric "Zero-Knowledge Biometric Proof" / face-scan / "Active Liveness: 99/100" score section
  with fake bars for "Face ID match," "Active liveness (blink/turn)," and "Behavioural biometrics,"
  sitting directly below the page's own Tier-0-phone-only-no-face-scan disclosure banner. This is
  architecturally forbidden, not merely unbuilt, so it was removed outright (not hedged) along with
  its dead JS (`animateLiveness()`) and CSS. A SIINDEX toast falsely claiming "Your CPT is valid
  and on-chain" was also fixed, and a dead `INDX_PRICE_USD` landmine removed. Meta tags added.
- `sovereign-support.html`: verified directly against the live Postgres schema (per this batch's
  brief, given the contact.html fake-form precedent) that `file_complaint`, `claim_genesis_signup_
  bonus`, and all six Wisdom Score point values cited in the chat responses are real, correctly
  wired RPCs matching the on-screen copy exactly — no contact.html-style fakery here. Two remaining
  violations: an unhedged "Sovereign Yield" mention and a present-tense "Sovereign Court handles
  jury-based arbitration" claim contradicting `help.html`'s already-fixed canon (Sovereign Court is
  planned; IN$DEX support handles disputes during the pilot). Meta tags added.
- `sovereignpay.html`: three present-tense "confirmed on Solana" / "settlement ... Solana" claims
  (no live INDX token/settlement exists — payments record in IN$DEX's own ledger) fixed, matching
  the already-corrected `remittance.html` pattern. A fake recipient-verification badge marked any
  typed string over 5 characters "✓ Verified" with no real lookup — same bug class already fixed on
  `qr-scanner.html` — now checks real send history instead. A hardcoded 4-name fake "Recent
  contacts" list replaced with a function reading real transfer history. A dead `randomTx()`
  fabrication function marked as a landmine rather than silently left. Meta tags added.
- `speak-to-siindex.html`: one VALUE violation ($0.24 "Genesis reference" price contradicting the
  page's own "no live token price" banner) and missing og: tags. SIINDEX's two first-person
  dialogue lines passed a full voice check (correct SI/she framing, no forbidden phrases).
- `tokenize.html`: the front door to the whole mint/tokenize flow had zero disclosure while every
  downstream screen it links to (`business-nft.html`, `music-nft.html`) already carries the house
  "not connected yet" banner. 9 present-tense minting/on-chain claims across the hero, all 4
  category cards, and all 4 "how it works" steps rewritten to the `rwa.html` house phrasing
  ("NFT minting is a Phase 2 feature — not available in this pilot"), plus a new page-level
  disclosure banner. Meta tags added.
- `voice-wallet.html`: "genesis price" framing violation (forbidden phrase, same fix pattern as
  `citizen-dashboard.html`'s "genesis reference"); a forbidden SIINDEX voice phrase ("I'm not sure")
  in the unrecognized-command fallback; a static HTML success-message fallback ("Payment sent
  instantly. Zero bank needed.") that's always JS-overwritten but live in raw markup if anything
  scrapes/pre-renders it, replaced with the file's own placeholder convention. Meta tags added.
  Verified `transfer_indx` goes through a genuine Approval Gateway RPC flow, not a fake send.

All 11 files independently re-verified directly (not trusting agent self-reports alone): `node
--check` on every extracted inline `<script>` block (all pass, zero errors across 32 total script
blocks), `DOMContentLoaded` count check (0 or 1 everywhere), conflict-marker grep (none found), and
targeted post-fix greps confirming each file's headline violation pattern (dangling
`INDX_PRICE_USD` refs, leftover liveness/ZK-Solana claims, the hardcoded `CONTACTS` array, meta
tags) was genuinely gone, not just claimed gone.

**This closes Section 11 (task #26) — all ~42 named screens in the section's description have now
been audited.** Remaining: a final check for "any leftover files not covered by other sections"
per the task's own description, then mark task #26 complete.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U57VbYcJz9FgBwyMitw814

## 2026-09-11 — Section 11 "leftover files" reconciliation (partial, session paused mid-batch)

A reconciliation pass (cross-checking all 282 top-level *.html files against the file lists in
tasks #16-#26) found 14 files never covered by any section: agent-strategies.html,
agent-wallet.html, agent-wallet-cli.html, agent-wallet-dashboard.html, business-network.html,
business-nft.html, business-onboarding.html, citizen-protection-mode.html, founding.html (distinct
from the already-audited founding-citizen.html), merchant-coach.html,
merchant-command-center.html, merchant-epos.html, merchant-pos.html, music-nft.html.

This batch was interrupted by a session rate-limit reset mid-dispatch. Completed so far:

- `agent-wallet-cli.html` / `agent-wallet-dashboard.html`: both genuinely clean on every content
  check — both already correctly frame all agent-execution content as preview/simulated/not-yet-
  live (the dashboard's own comments document two prior remediation passes, 2026-07-25 and
  2026-08-20). Only fix: missing meta description/og: tags on both, added.
- `agent-strategies.html`: partial pass only — one fix landed before the interruption: a "✓
  Running" button label (implying a live agent-strategy is actively executing) relabeled "✓
  Selected (not live)" in both the static markup and the JS render function. The rest of this
  file's checklist (checks 1, 3-6, 6a, 6b, 7, 8) has NOT been run yet.
- `agent-wallet.html`: not started at all.
- The remaining 9 files (business-network, business-nft, business-onboarding,
  citizen-protection-mode, founding, merchant-coach, merchant-command-center, merchant-epos,
  merchant-pos, music-nft) — not started.

All 3 touched files independently verified (node --check, DOMContentLoaded count, conflict
markers) before this commit.

**Section 11 / task #26 is NOT yet closed** — the "any leftover files not covered by other
sections" clause in its own description is only ~15% done. Remaining on resumption:
agent-strategies.html (finish checks 1/3-6/6a/6b/7/8), agent-wallet.html (full pass), plus the 9
files listed above.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U57VbYcJz9FgBwyMitw814
