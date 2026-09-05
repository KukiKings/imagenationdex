# IN$DEX

IN$DEX is a Pacific-first sovereign digital identity and remittance platform: every
citizen's identity is a personal domain (`name.IN$DEX`), and the app runs on top of
that domain for onboarding, verification, transfers, and marketplace activity. The
platform is run in its own framing by an AI identity, **SIINDEX** — a Synthetic
Intelligence (not "an AI"; she/her), acting as CEO/COO across the product's
compliance, governance, and citizen-facing surfaces. Planned public launch is
**24 February 2027**, with a private-pilot fallback target of **December 2026**; a
Cook Islands legal entity is intended but not yet filed, and no legal counsel has
been retained yet.

## Current build status (honest summary)

This is a real, working product with a real Supabase backend
(project ref `zljgthfzbalsunuoohcd`, 82 tables, RLS enabled on all of them) — not a
mockup. **Live and built today:** Tier 0 citizen signup (`create_onboarding_citizen`),
remittance as a real Postgres ledger with fraud/risk checks and Approval Gateway
integration (`transfer_indx` — no on-chain settlement), the Approval Gateway itself
(14 risk-class ≥3 actions gated), transaction history and citizen dashboard UI backed
by real RPC calls, SIINDEX Q&A/Voice, and CI-driven Vercel deploys. Two identity
verification tiers beyond signup are real and wired to the database: PayID
confirmation (`verify_payid`) and a mock government-ID check (`verify_government_id`)
that validates a document *type* only — no document image is ever uploaded or
inspected. **Not built, or simulated only:** the INDX SPL token (no mint deployed —
`js/indx-wallet.js` still carries a placeholder mint address), any on-chain
lending/AMM/LP activity (all Postgres simulations, no Solana program calls), any
Metaplex/NFT identity receipts, and the broader "7-agent SI2SI swarm" (only the
Remittance Agent is real; the agent bus has processed exactly one task ever; the rest
is an illustrative, explicitly non-live roster UI). See `BUILD_LOG.md` for the full,
continuously-updated, evidence-cited account of what's real vs. simulated — treat it
as the single source of truth over any other document in this repo, including this
one, if they ever disagree.

## How this codebase works

There is no build step and no framework — this is a static HTML page per screen
(286 `.html` files at the repo root), deployed as-is to Vercel. The common pattern,
visible in screens like `sovereign-verify.html`:

1. Load the Supabase JS client from a pinned CDN URL with a Subresource Integrity
   hash (e.g. `@supabase/supabase-js@2.108.2`).
2. An inline `<script>` block near the bottom of the file sets `SUPABASE_URL` and
   `SUPABASE_ANON_KEY` as hardcoded constants (normal for a Supabase anon key — it's
   meant to be public, with access controlled by RLS on the server side) and calls
   `createClient(SUPABASE_URL, SUPABASE_ANON_KEY)`.
3. Reads happen either via the Supabase client directly or via plain `fetch()` calls
   to `${SUPABASE_URL}/rest/v1/...`. Writes and privileged actions go through
   Postgres functions called as RPCs — `fetch(SUPABASE_URL + '/rest/v1/rpc/<fn>', ...)`
   or `sb.rpc('<fn>', {...})` — e.g. `verify_payid`, `verify_government_id`,
   `transfer_indx`. This keeps business logic and validation in the database, not the
   client.
4. Session state (citizen ID, cached balances, JWTs) lives in `sessionStorage`/
   `localStorage`, not in any server-side app process — there is no app server, only
   Supabase.

When adding a new screen, follow an existing one (`sovereign-verify.html` is a good
reference) rather than inventing a new pattern.

## Key directories and files

- **`js/`** — shared client-side adapters loaded by multiple screens, notably
  `indx-db.js` (the shared Supabase client/config used across screens) and
  `indx-wallet.js` (the Phantom/Backpack Solana wallet adapter — currently guarded
  to never query the real chain pre-token-launch; see `WHITEPAPER.md` and
  `DEPLOYMENT.md` for what that means).
- **`supabase/migrations/`** — tracked SQL migrations applied to the live project.
- **`supabase/functions/`** — Edge Functions (voice, the SIINDEX agent bus,
  visitor feedback) deployed via the GitHub Actions workflow in
  `.github/workflows/deploy-supabase-functions.yml`.
- **`BUILD_LOG.md`** — the project's audit trail and single source of truth for
  what's actually live vs. simulated/planned, verified directly against the codebase
  and the live Supabase project. Read this before trusting any status claim
  elsewhere, including in this README.
- **`AGENT.md`** — handover doctrine for anyone (human or AI) working in this repo:
  who the product serves, what it refuses to do (no fabricated metrics, no
  present-tense claims for non-live features, no undisclosed demo data), and SIINDEX
  voice rules.
- **`vercel.json`** — the routing table for the static deploy (which `.html` file
  serves which path, plus security headers).

## Further reading

- **`WHITEPAPER.md`** — the vision and economics document: the sovereign
  identity/domain-as-credential model, the 98/2 Civilisation Law, the tiered KYC
  model as it actually exists today, and planned INDX tokenomics.
- **`DEPLOYMENT.md`** — practical deployment reference: Vercel, Supabase (migrations,
  Edge Functions, RLS), required client-side keys, and what remains before the INDX
  token can exist on Solana.
