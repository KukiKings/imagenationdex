# IN$DEX Whitepaper (Vision & Economics)

This document describes IN$DEX's sovereign identity model, its economic design
commitment (the "98/2 Civilisation Law"), and its planned token economics. It is
written to the same honesty standard as the rest of this repo: every claim about
something being *live today* is traceable to `BUILD_LOG.md` or a direct reading of
the codebase; every claim about something *planned* is labeled as planned. Where
this document and `BUILD_LOG.md` ever disagree, `BUILD_LOG.md` is correct.

## 1. The sovereign identity model: the Domain is the Credential

IN$DEX's core product principle is that a citizen's identity *is* a personal
domain — `name.IN$DEX` — rather than an account number, a card, or a document held
by a third party. The domain is issued at signup and is meant to function as the
citizen's addressable, portable identity across the platform: the thing people send
value to, the thing that carries a citizen's verification tier and reputation
(Wisdom Score), and eventually the anchor for on-chain identity once Solana
integration exists.

**What's real today:** citizen signup (`create_onboarding_citizen`) and progressive
identity verification are live against the real Supabase backend, described in
detail in Section 2. Domain reservation exists as tracked schema
(`supabase/migrations/20260820_domain_reservations_v1.sql`).

**What's planned:** any on-chain anchoring of the domain-as-credential model (e.g. an
NFT or similar on-chain identity receipt) is **not built**. `BUILD_LOG.md`'s baseline
inventory is explicit that no Metaplex/NFT identity code exists anywhere in the repo,
and that one screen (`token-detail.html`) previously made a false claim to the
contrary — that claim has since been corrected to state the real status plainly.
Treat any on-chain identity claim as **(planned, not yet deployed)** unless a future
`BUILD_LOG.md` entry says otherwise.

## 2. Tiered verification, as it actually exists today

IN$DEX uses a progressive verification model: every tier is optional, a citizen can
transact fully at the base tier, and higher tiers only raise fiat deposit/withdraw
limits (which are themselves not live yet — see below) plus a Wisdom Score bonus.
Verification never gates the ability to earn, hold, or trade INDX-denominated value
in the app's ledger.

As implemented in the live database (the `citizens.kyc_tier` column) and wired up in
`sovereign-verify.html`:

- **`kyc_tier = 0` — signup.** Created by `create_onboarding_citizen` (phone/email
  onboarding). Displayed in the UI as "Tier 1 Citizen." No ID, no gate.
- **`kyc_tier = 1` — PayID confirmation.** Set by the Postgres function
  `verify_payid` (renamed from a previous, incorrectly-named
  `verify_payid_tier2` — see `BUILD_LOG.md`, Priority 1, for why). Displayed in the
  UI as "Tier 2 Verified Citizen." Real RPC call, real database write.
- **`kyc_tier = 2` — government-ID check.** Set by the Postgres function
  `verify_government_id`, added in the Week 2 build pass. Displayed in the UI as
  "Tier 3 Sovereign." This is **explicitly a mock**: it validates a submitted
  document *type* string against a known list and checks caller authorization — it
  does not inspect any actual document image, because no document upload/storage
  exists anywhere in this codebase. The function logs a `security_events` row
  labeled `'MOCK government ID verification — placeholder validation only, no real
  document check performed'` with `mock: true` in its own audit detail, and the
  on-screen copy for this step says plainly: *"Prototype check — instantly approved
  for testing. This is not yet a real identity verification."*

**Note on numbering:** the on-screen tier labels ("Tier 1/2/3") are offset by one
from the underlying `kyc_tier` integer (`0/1/2`) — this is a real, known quirk of the
current UI copy, not a typo in this document; be aware of it if you're cross-
referencing screen text against the database column.

**What's not built at all:** a separate, heavier "Tier 2" concept appears as static
display copy on a different screen, `kyc-compliance.html` — light KYC via a named
third-party vendor (Fractal ID) and a full institutional AML/source-of-funds tier.
Both are honestly disclosed on that screen as "not connected yet," with no live
vendor integration and no wiring to the `citizens.kyc_tier` column at all (confirmed
by direct grep, per `BUILD_LOG.md`). Address/source-of-funds verification
(`verify_address_funds`) has not been built. Real document image upload (camera or
file capture to storage) does not exist anywhere in this codebase. Fiat
deposit/withdraw limits attached to each tier ($200 / $2,000 / $50,000 per month) are
**(planned — not live yet)**: there is no live fiat on/off-ramp integration in the
app today.

## 3. The 98/2 Civilisation Law (planned — not yet enforced on-chain)

IN$DEX's stated economic principle is that citizens keep **98%** of the value of
every sale or transaction they make on the platform, with **2%** flowing to a
Civilisation Fund that supports the wider network. This is a **permanent design
commitment**, not a feature toggle — but as of this writing it is **not enforced by
any smart contract or deployed on-chain mechanism**. No Solana program implementing
this split exists in this codebase, and `BUILD_LOG.md` records no such contract as
built or deployed. Any percentage split currently applied to a transaction in the
live ledger (`transfer_indx` and related Postgres logic) is an off-chain, database-
level calculation, not an on-chain, trustlessly-enforced rule.

**Status: (planned, not yet deployed).** Until a real on-chain program enforces the
98/2 split, treat it as IN$DEX's stated economic policy and design intent — real, and
meant permanently — rather than as a live, cryptographically-guaranteed mechanism.

## 4. INDX tokenomics (planned — mint not yet deployed)

IN$DEX's planned native asset is **INDX**, intended to be an SPL token on Solana used
for payments, governance, staking, rewards, and Wisdom Score-linked rank progression.
**No INDX mint exists on any Solana cluster today.** The concrete evidence for this,
directly in the codebase:

- `js/indx-wallet.js`, line 28:
  ```js
  const INDX_MINT_ADDRESS  = 'INDXmintAddressPlaceholderReplaceAtTGE';
  ```
  This is a literal placeholder string, not a valid Solana public key. The
  surrounding comment in that file spells out the failure mode: the wallet adapter's
  `getINDXBalance()` is written to be safe about this pre-launch — before the
  token-generation event (`TGE_DATE`, currently set to `2027-02-24`) it never queries
  this address at all, returning a `sessionStorage` demo/alpha balance instead. Once
  the code's own `IS_POST_TGE` flag flips true, `getINDXBalance()` *will* start
  querying this placeholder address for real, which will silently return a balance
  of `0` for every citizen if a real mint address has not been substituted in by
  then.
- Everywhere else in the app that shows INDX balances, staking, lending, or AMM/LP
  activity, per `BUILD_LOG.md`'s baseline: these are **Postgres-ledger simulations**,
  not on-chain Solana program calls. Any price shown for INDX in this codebase (e.g.
  a static reference constant in `js/indx-db.js`) is an internal, illustrative
  figure, not evidence of a live market — there is no live sale of INDX today, and no
  citizen can buy, receive, or hold a real on-chain INDX token yet.

**All of the following are (planned, not yet deployed):** the INDX SPL token mint
itself, minting an initial supply to a treasury address, any real on-chain
staking/lending/AMM/LP program, and any Metaplex-based NFT receipt tied to INDX or to
citizen identity. See `DEPLOYMENT.md`'s "NOT YET DEPLOYED" section for the concrete
steps that remain before any of this can go live, including the exact line in
`js/indx-wallet.js` that must change first.
