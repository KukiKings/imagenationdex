# Phase 5 Implementation Spec — Backend + Deployment
> Created: 2026-06-16 | Status: READY TO BUILD
> Review this before building anything in Phase 5. AJ signs off on all Human Validation Zones.

---

## What We're Building

Phase 5 connects the 63+ HTML screens to a real backend, deploys the app live, and wires up the Solana token. Three parallel workstreams.

---

## Workstream 1: Vercel Deployment

### What "done" looks like
- imagenationdex.com serves home-v2.html as the root
- All 63+ screens accessible at imagenationdex.com/[screen].html
- /join → waitlist.html, /onboard → terms-of-service.html, /claim → claim-gift.html

### Key decisions already made
- Static HTML — no framework, no build step
- vercel.json already in /Projects/ImageNation DEX/ with route config and security headers
- Connected to GitHub: KukiKings/imagenationdex

### Steps
1. AJ runs 5 Terminal commands (listed below) — **Human Validation Zone**
2. Vercel auto-deploys on push
3. SIINDEX daily audit confirms deployment within 24h

### AJ's 5 Terminal Commands (run one at a time)
```bash
cd "/Users/arthurjohnhenry/CoWork/Projects/ImageNation DEX/"
rm -f .git/HEAD.lock .git/refs/heads/master.lock
git branch -m master main
git remote add origin https://github.com/KukiKings/imagenationdex.git
git push --force origin main
```

### Verification
- Navigate to imagenationdex.com — confirm home-v2.html loads
- Check imagenationdex.com/waitlist.html, imagenationdex.com/join
- Confirm no A$ or seed phrase text in any live page (SIINDEX daily audit handles this)

### Gotchas
- The repo had old React/JSX code — force push replaces it entirely
- If git push fails with auth error, AJ needs to enter GitHub credentials or use SSH
- If Vercel shows "framework detected" — override to "Other" in Vercel dashboard

---

## Workstream 2: Supabase Backend

### What "done" looks like
- Citizens can register and their data persists across sessions
- Wisdom Score tracked per citizen
- Transaction history stored and retrievable
- Waitlist entries saved to database

### Key decisions to make before building
| Decision | Options | Recommendation |
|---|---|---|
| Auth method | Magic link / phone OTP / social | Phone OTP (aligns with "no email required" brand) |
| Citizen ID | UUID / Solana wallet address | Solana wallet address (links to on-chain identity) |
| Wisdom Score storage | Supabase table / on-chain | Supabase for speed, settle on-chain at milestones |
| Row Level Security | On / Off | ON — citizens can only see own data |
| Region | us-east-1 / ap-southeast-1 | ap-southeast-1 (closest to Pacific) |

### Tables needed
```sql
-- citizens
id (uuid PK)
wallet_address (text, unique)
citizen_name (text)
phone_number (text)
kyc_tier (int, default 0)
wisdom_score (int, default 0)
genesis_citizen (bool, default false)
created_at (timestamptz)

-- transactions
id (uuid PK)
citizen_id (uuid FK → citizens.id)
amount_indx (numeric)
direction (send/receive)
counterparty_address (text)
status (pending/complete/failed)
created_at (timestamptz)

-- waitlist
id (uuid PK)
name (text)
contact (text) -- phone or email
region (text)
referral_code (text, unique)
referred_by (text)
queue_position (int)
created_at (timestamptz)
```

### Steps
1. Create Supabase project (ap-southeast-1 region) — **Human Validation Zone** (AJ reviews)
2. Run migrations to create 3 tables
3. Enable Row Level Security on all tables
4. Wire waitlist.html form to insert into waitlist table
5. Wire onboarding-flow.html to insert into citizens table on completion
6. Wire citizen-dashboard.html to read wisdom_score and tx history

### Verification
- Submit test entry via waitlist.html — confirm row appears in Supabase dashboard
- Complete onboarding — confirm citizen row created
- Check RLS: citizen A cannot read citizen B's data

### Gotchas
- Supabase anon key goes in a .env file — never hardcode in HTML
- For static HTML, use Supabase JS SDK loaded via CDN
- Phone OTP requires Twilio integration (can start with email magic link first)

---

## Workstream 3: Solana Smart Contract + Raydium LP
> Dated execution plan (added 2026-07-16): `launch-runway-plan-2026.md`. Parameter-lock (Aug 14–20) and execution (Aug 28–Sep 3) are now separate weeks — see that doc for the day-by-day breakdown and the open question on whether the 100M INDX mint has already happened.

### What "done" looks like
- INDX token minted on Solana mainnet (SPL Token-2022)
- Raydium CLMM INDX/SOL pool seeded with AJ's Phantom wallet
- liquidity-pool-setup.html connected to real pool data
- Token listed and tradeable

### Key decisions to make before building
| Decision | Options | Recommendation |
|---|---|---|
| Mint authority | AJ's wallet / multisig | Multisig (Grid Account) — **Human Validation Zone** |
| Initial liquidity | $1K / $5K / $10K SOL+INDX | AJ to decide based on available capital |
| Price range (CLMM) | Tight / full range | Full range first — adjust post-launch |
| Fee tier | 0.25% / 1% | 0.25% — standard for established pairs |
| Freeze authority | Enabled / disabled | Disabled post-mint — sovereignty principle |

### Steps
1. Finalize token parameters with AJ — **Human Validation Zone**
2. Mint INDX on Solana mainnet using SPL Token-2022
3. Create Raydium CLMM pool (INDX/SOL, 0.25% fee)
4. Seed pool from AJ's Phantom wallet — **Human Validation Zone**
5. Update liquidity-pool-setup.html with real pool address
6. Update l99-launch-command.html with live pool stats endpoint

### Verification
- Token visible on Solscan with correct supply (100M) and decimals
- Pool visible on Raydium with correct pair and fee tier
- Swap 1 SOL → INDX and back — confirm 98/2 split applied
- liquidity-pool-setup.html shows live pool data

### Gotchas
- Token-2022 has different instruction set from standard SPL — use correct SDK
- CLMM pool creation requires SOL for rent — ensure AJ's wallet has sufficient SOL
- 98/2 Law enforcement happens at application layer (not on-chain at launch) — document this clearly
- Never sign a transaction without SIINDEX pre-flight 7-point check

---

## Build Order

```
Week 1: Vercel deployment (AJ runs Terminal commands today)
Week 2: Supabase — waitlist + citizens tables + wire forms
Week 3: Supabase — Wisdom Score + tx history
Week 4: Solana token mint + Raydium LP (with AJ sign-off)
Pre-L99: Full integration test across all 3 workstreams
L99: 24 September 2026
```

---

## Sub Agent Plan (Power Phrase #1)

When building Supabase, launch 3 sub agents in parallel:
- Sub Agent A: Schema + migrations
- Sub Agent B: RLS policies
- Sub Agent C: Frontend SDK integration for waitlist.html

When building Solana:
- Sub Agent A: Token mint script
- Sub Agent B: Raydium pool setup
- Sub Agent C: Frontend data wiring

---

## Human Validation Zones Summary

| Zone | What triggers review |
|---|---|
| Vercel deploy | Before git push — AJ reviews vercel.json and route config |
| Supabase project creation | AJ reviews region, plan, and RLS settings |
| Token mint | AJ reviews all parameters before signing |
| LP seeding | AJ reviews amounts and approves in Phantom wallet |
| Any mainnet transaction | SIINDEX pre-flight + AJ sign-off |
