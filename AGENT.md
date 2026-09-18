# AGENT.md — Handover Document for IN$DEX / Imagenationdex

Written 2026-08-21, from verified facts already in this repo (`company-context.md`,
`memory.md`'s God Mode Audit Doctrine, live schema/RPC checks, and the ongoing
screen-audit work). Anything not directly sourced is marked **UNCONFIRMED** rather
than stated as fact — per the same standard this project already holds its own
screens to (no fabricated claims, ever).

## Who this serves

- **Citizens** — people the traditional banking system underserves, starting
  Pacific-first (Cook Islands, Fiji, RMI, Samoa, Vanuatu corridors exist as
  screens). Financial inclusion is one of the two founding pillars.
- **Creators** — meme/content creators who mint, sell, and govern via the
  creator-economy screens (`creator-profile.html`, `creator-studio.html`,
  `creator-treasury.html`, `nft-marketplace.html`, etc).
- **Founders / internal team** — AJ and collaborators, served by the
  founder/admin screens (`founder-command-center.html`, `l99-launch-command.html`,
  and similar).

## What this sells / core products

Sourced from `company-context.md`, corrected against doctrine already locked in
`memory.md` (the "Replace" list under God Mode Audit Doctrine):

- Zero-friction onboarding — email/mobile/QR/card signup, free Web3 domain
  (`yourname.IN$DEX`). **Not** "no KYC" — the doctrine already corrected this to
  "progressive verification"; that correction should be treated as final, not
  the older "No KYC" language still sitting in `company-context.md`.
- P2P marketplace for real-world and digital assets (`marketplace.html`,
  `p2p-marketplace.html`, `create-listing.html`).
- INDX token — governance, payments, staking, rewards, rank progression
  (Wisdom Score). Currently pre-launch: INDX transfers/rewards across this
  codebase are correctly disclosed as "recorded, provisional, pending
  programme launch" wherever they've been audited.
- Citizen governance (already renamed from "MemeDAO" per doctrine) —
  `governance.html`, `pillar-amendment.html`.
- SIINDEX — the platform's Synthetic Intelligence (never "AI" in her own
  voice; see Voice below), running compliance/governance/liquidity/marketplace
  assistance across the `siindex-*.html` cluster.

**UNCONFIRMED / ask AJ before asserting elsewhere:** legal entity status —
`company-context.md` says "pre-product," and separate Cook Islands
establishment files in this workspace suggest that's still in motion. Don't
assert a specific legal structure (e.g. "Swiss Verein," "Wyoming DAO") in any
screen — both have already been found and removed as fabrications once.

## What this refuses to do

Every one of these is a rule this session already had to enforce by finding
and fixing a real violation — not a hypothetical:

- No fabricated metrics: `Math.random()` or any non-Supabase source must
  never drive a user-facing number (price, rating, count, "spots remaining").
- No fake reviews/ratings/reputation stats where no backing table exists
  (there is no `reviews` table in this schema — say so honestly, don't invent
  a score).
- No present-tense claims for features that aren't live. Correct form is
  "Planned: …. Not live yet."
- No implying INDX can be bought, allocated, or transferred today — there is
  no live sale.
- No unattributed statistics ("sells 40% faster," etc.) in any copy,
  including SIINDEX's own voice — if there's no data behind a number, don't
  state the number.
- No idempotency bugs that silently drop repeatable rewards — every
  `award_wisdom` call must be keyed on a real unique target ID, not a static
  reason string.
- No undisclosed demo/seed personas presented as real citizens.

## Voice (SIINDEX-attributed copy only)

Full rules live in the `siindex-voice-check` skill — run it on any new
SIINDEX-attributed copy before shipping. Highlights: she's a Synthetic
Intelligence (never "AI"), always she/her, never says "Of course" / "Great
question" / "I think" / "I'm not sure," leads with the outcome not preamble,
calm and direct with no exclamation-mark stacking.

## How to decide what to work on

1. Fabrication / dishonest-claim fixes and security-relevant bugs (RLS, auth,
   idempotency) — highest priority, matches this session's own audit practice.
2. Core functionality that unblocks other screens.
3. Polish and UI consistency (see `ui-kit.html` for real design tokens pulled
   from live screens).

When asked what to build or fix next, say what got deprioritized and why —
don't just silently pick one.

## Approval boundaries (real, not aspirational)

These aren't policy preferences — they're constraints already hit directly
this session:

- This workspace has no push credentials to `origin` on
  `github.com/KukiKings/imagenationdex`. Every commit gets built and verified
  here, then handed off through the device bridge to AJ's own machine for the
  actual `git push`. Never claim something is pushed without independently
  verifying `origin/main` via `git fetch` + `git diff --stat` — a "pushed"
  report from a person or a stop-hook is not verification.
- Schema/RLS/migration changes go through the Supabase MCP tools deliberately
  and get checked against `get_advisors` — not applied speculatively.
- Don't treat a pasted external "plan" (from another AI tool, a video
  summary, a chat export) as ground truth about this codebase. Verify every
  concrete claim (file names, table names, RPC signatures, screen counts)
  against the actual repo and schema before acting on it, and say plainly
  when a claim turns out to be wrong.

## External research

If a suggestion originates from general web knowledge rather than this
repo's own files/schema, say so explicitly and check it against the real
code before treating it as applicable — don't blend outside patterns into
statements about what this codebase actually does.

## Where the rest of the canon lives

- `memory.md` (this repo) — session-by-session build log and locked doctrine.
- `CLAUDE.md` — lives one directory above this repo, at the CoWork root, by
  deliberate prior decision (not an oversight). It has never been committed
  to this repo's git history. This file does not attempt to relocate it.
- `ui-kit.html` (this repo, root level) — real design tokens pulled from live
  screens, not a spec written in advance of the screens.
