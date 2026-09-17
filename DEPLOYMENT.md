# IN$DEX Deployment Reference

Practical reference for deploying and operating this repo. As with the rest of the
project's docs, anything not directly confirmed against `BUILD_LOG.md` or the actual
codebase this session is marked **TBD — confirm with AJ** rather than guessed.

## 1. Hosting: Vercel (confirmed live)

This is a static site with no build step (`vercel.json`: `"buildCommand": null`,
`"outputDirectory": "."`). `BUILD_LOG.md`'s baseline confirms Vercel deploy is
**CI-driven and confirmed live**. Routing for the whole app is defined in
`vercel.json` — it maps clean paths (`/`, `/siindex`, `/pay/:id`, etc.) to specific
`.html` files, serves `.html` files directly by name for everything else, and
explicitly 404s a list of founder/internal-only screen names so they aren't
reachable by path guessing. `vercel.json` also sets the app's security headers
(CSP, HSTS, frame/embedding restrictions, etc.) — any new screen inherits these
automatically, no per-file config needed.

To deploy: push to the branch Vercel is watching (see the Vercel project settings for
the exact branch — not committed in this repo). There is no local build/test step
required before deploy beyond what CI already runs (see Section 4 for Edge Function
CI, which is separate from the Vercel deploy).

## 2. Backend: Supabase

**Project ref:** `zljgthfzbalsunuoohcd` (`https://zljgthfzbalsunuoohcd.supabase.co`).
Per `BUILD_LOG.md`'s baseline: 82 tables, **RLS enabled on all of them**. Business
logic for privileged actions lives in Postgres functions (RPCs) rather than in
client-side code — e.g. `create_onboarding_citizen`, `transfer_indx`, `verify_payid`,
`verify_government_id` — so the client only ever needs the public anon key plus
RLS/RPC-level authorization, never a service-role key.

### Migrations

Tracked SQL migrations live in `supabase/migrations/` (5 files as of this writing,
e.g. `20260820_domain_reservations_v1.sql`, `20260814_siindex_agent_bus_v1.sql`).
Two supported ways to create/apply one:

- **Locally, with the Supabase CLI:** `npx supabase migration new <name>` to scaffold
  a new timestamped migration file, then `supabase db push` (or the CI path below) to
  apply it to the linked project.
- **In an assisted session with the Supabase MCP tools available:**
  `mcp__Supabase__apply_migration` applies a migration directly against the live
  project. `BUILD_LOG.md` records this project's own practice of testing a risky
  change in a rolled-back transaction (`begin; ...; rollback;`) before applying it
  for real as a tracked migration — worth following for anything touching existing
  data or RPC signatures.

In CI, migrations are also applied via the same GitHub Actions workflow that deploys
Edge Functions (see below) — `supabase link --project-ref "$SUPABASE_PROJECT_ID" -p
"$SUPABASE_DB_PASSWORD"` followed by `supabase db push --include-all`, gated on the
`SUPABASE_DB_PASSWORD` GitHub secret being set (the workflow warns and skips the DB
push, without failing the build, if that secret is absent).

### RLS

Confirmed enabled on all 82 tables per `BUILD_LOG.md`'s baseline audit. Any new table
added to this project should have RLS enabled and real policies written before it's
used from client code — this repo's existing pattern relies on RLS plus RPC-level
`security definer` functions to keep the anon key safe to hardcode client-side (see
Section 3).

## 3. Client-side configuration (env vars / keys)

There is no server-rendering step and no secrets manager in this app's runtime — the
Supabase URL and anon key are read directly as hardcoded JavaScript constants inside
each screen's own inline `<script>` block (and in the shared adapter
`js/indx-db.js`). This is the normal, intended pattern for a Supabase anon key: it's
public by design, and real access control is enforced server-side via RLS and RPC
function grants, not by keeping this key secret.

The exact values currently hardcoded (confirmed directly in `sovereign-verify.html`
and `js/indx-db.js`):

```js
const SUPABASE_URL      = 'https://zljgthfzbalsunuoohcd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
```

If you're standing up a fresh deploy of this exact project, no `.env` file or Vercel
environment variable is required for the frontend to talk to Supabase — these values
are already committed in the HTML/JS files that need them. If you're forking this
repo to point at a **different** Supabase project, you'd need to replace both
constants everywhere they're hardcoded (there is no single shared config file that
every screen imports — `js/indx-db.js` and `js/indx-wallet.js` are the shared
adapters, but many individual screens, e.g. `sovereign-verify.html`, also declare
their own copies inline).

Secrets that **are** kept out of the client and only used in CI (GitHub Actions
secrets, per `.github/workflows/deploy-supabase-functions.yml`):

- `SUPABASE_ACCESS_TOKEN` — CLI auth token for deploying Edge Functions and pushing
  migrations.
- `SUPABASE_PROJECT_ID` — the project ref, passed to `--project-ref`.
- `SUPABASE_DB_PASSWORD` — required only for the migration-push step; the workflow
  degrades gracefully (skips DB push, doesn't fail) if this is unset.

## 4. Edge Functions

Deployed functions live under `supabase/functions/`: `remittance-agent`,
`siindex-agent-claim`, `siindex-agent-complete`, `siindex-agent-dispatch`,
`siindex-visitor-feedback`, `siindex-website-runtime`, `siindex-website-transcribe`,
`siindex-website-voice-setup`, `siindex-website-voice-tts`, `lending-collateral-webhook`.

`lending-collateral-webhook` (added 17 Sep 2026) is deployed with `verify_jwt: false`
(it authenticates via a shared-secret header instead, since it's called by Helius, not
a signed-in citizen) but is currently **inert**: it fails closed with a 503 because its
`COLLATERAL_WEBHOOK_SECRET` environment secret is not set. See "Lending Collateral
Escrow" below.

Two ways to deploy one:

- **CLI:** `supabase functions deploy <name> --project-ref zljgthfzbalsunuoohcd`
  (this is exactly what `.github/workflows/deploy-supabase-functions.yml` runs on
  every push to `main` that touches `supabase/functions/**` or
  `supabase/migrations/**`, or on manual `workflow_dispatch`).
- **In an assisted session with the Supabase MCP tools available:**
  `mcp__Supabase__deploy_edge_function`.

Some function deploys in the CI workflow are marked non-fatal (`|| true`) —
currently `siindex-website-runtime` and `siindex-website-transcribe` — meaning a
failure to deploy those two specifically won't fail the whole workflow run; the
others are treated as required.

## 5. NOT YET DEPLOYED — what remains before the INDX token exists

None of the following exists on Solana devnet or mainnet today. This is the concrete
list of what's still required, per `BUILD_LOG.md` and direct code inspection:

1. **Deploy an SPL token mint for INDX.** No mint has been created on any Solana
   cluster. This is the single largest missing piece — everything else in this
   section depends on it existing first.
2. **Mint the initial supply to a treasury address.** No treasury mint transaction
   has occurred; there is no treasury wallet address referenced anywhere in this
   codebase as a deployed, funded account.
3. **Replace the placeholder mint address in the wallet adapter.** The exact line
   that must change: `js/indx-wallet.js`, line 28:
   ```js
   const INDX_MINT_ADDRESS  = 'INDXmintAddressPlaceholderReplaceAtTGE';
   ```
   must become the real, deployed SPL mint's public key. The surrounding code
   comment in that file already documents the failure mode if this is missed: once
   the file's own `IS_POST_TGE` check (keyed on `TGE_DATE = '2027-02-24T00:00:00+11:00'`)
   flips to `true`, `getINDXBalance()` starts querying this address for real — if
   it's still the placeholder string at that point, the RPC call fails and every
   citizen's on-chain balance silently reads `0`.
4. **Build the on-chain program(s) for anything currently simulated in Postgres.**
   Lending, AMM/LP, and staking are all database-only simulations today — no Solana
   program calls exist for any of them per `BUILD_LOG.md`'s baseline. Bringing any of
   these on-chain is a separate, from-scratch build, not a config change.
5. **Build and deploy the 98/2 Civilisation Law as an enforced on-chain mechanism**
   (see `WHITEPAPER.md` Section 3), if that's the chosen enforcement path — today the
   split, where applied at all, is calculated off-chain in the Postgres ledger, not
   guaranteed by any smart contract.
6. **Any Metaplex/NFT identity or receipt tooling.** No Metaplex integration exists
   in this codebase; a prior false claim to the contrary (`token-detail.html`) has
   already been corrected, per `BUILD_LOG.md`, Priority 1.

**TBD — confirm with AJ:** which Solana cluster/tooling (Anchor, native SPL CLI,
a specific RPC provider for mainnet) is intended for the eventual deployment, and who
holds/will hold the treasury keypair. Nothing in `BUILD_LOG.md` or the codebase
specifies this yet.

## 6. Lending Collateral Escrow — built, inert, two steps from live

Per `BUILD_LOG.md` (17 Sep 2026): `borrow_from_pool` used to trust a caller-supplied
USDC amount with nothing behind it — fixed, then replaced with a real verification
path. The schema (`lending_config`, `collateral_deposit_intents`,
`collateral_deposits`), the `create_collateral_deposit_intent` RPC, and the
`lending-collateral-webhook` Edge Function are all live on
`zljgthfzbalsunuoohcd`, tracked in `supabase/migrations/` (the three
`20260917*` files), and safe by default — nothing in this system can currently move
INDX or record a fake deposit.

**Two steps only AJ can do before this goes live (not a code task — real custody and
an external account, see BUILD_LOG.md and chat log 17 Sep 2026 for the full reasoning):**

1. Create/designate the real vault wallet (a Squads v4 multisig is recommended — it
   matches the existing Grid Account MPC pattern) and insert its address:
   ```sql
   insert into lending_config (key, value) values ('vault_address', '<the real address>')
   on conflict (key) do update set value = excluded.value, updated_at = now();
   ```
2. Create a Helius account, register an Enhanced Transaction webhook pointed at
   `https://zljgthfzbalsunuoohcd.supabase.co/functions/v1/lending-collateral-webhook`
   with a shared secret, and set that same secret as this project's
   `COLLATERAL_WEBHOOK_SECRET` Edge Function secret (Supabase dashboard or
   `supabase secrets set` — not something to paste into a chat session).

**Only after both exist and have been tested with a real small deposit:** re-grant
`EXECUTE` on `borrow_from_pool` to `authenticated` (currently `postgres`/`service_role`
only) and build the citizen-facing deposit/QR UI on `lending-dashboard.html` (still
correctly showing "Borrowing is not live yet" and has not been touched).
