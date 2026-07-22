# IN$DEX — What We're Building On

*Tech stack, canonical values, and architectural decisions. Use this as the foundation reference for every build session.*

---

## The Project

**IN$DEX (Image Nation Decentralised Exchange)** — the world's first sovereign DeFi platform for the unbanked. Built on Solana. Governed by MemeDAO. Operated by SIINDEX AI.

**Founder:** Arthur John Henry (AJ) — Melbourne, Australia  
**Launch:** 24 September 2026 (L99)  
**Target market:** 1.4 billion unbanked people, starting in the Pacific Islands

---

## Token

| Field | Value |
|---|---|
| Name | INDX |
| Standard | SPL Token-2022 (Solana) |
| Supply | 100,000,000 (fixed — mint authority burned at launch) |
| Canonical price in all UI | $0.24 USD (genesis price — never $0.35; corrected 2026-07-19, this row previously contradicted the row below it) |
| Governance | MemeDAO — one token, one vote |
| Welcome bonus | 50 INDX free to Genesis Citizens |

---

## Blockchain Layer

| Component | Technology |
|---|---|
| Blockchain | **Solana Mainnet** — 65,000 TPS, sub-cent fees |
| Token standard | **SPL Token-2022** |
| DEX / Liquidity | **Raydium AMM** (INDX/SOL pool) |
| LP lock | **Streamflow** — 12–24 months from pool creation |
| EVM compatibility | **Neon EVM** — ERC-20 assets can flow in |
| Smart contract wallet | **Squads Protocol v4** — 2-of-3 MPC multisig (Grid Account) |

### Grid Account (user wallet)
- Squads Protocol v4 Multisig
- 2-of-3 MPC keys — user + SIINDEX + guardian
- **No seed phrase** — recovery via designated guardians
- TEE-backed for agent operations

---

## Backend

| Component | Technology |
|---|---|
| Database | **Supabase** (PostgreSQL) — project ref: `zljgthfzbalsunuoohcd`, region: ap-southeast-2 |
| Auth | **Supabase Auth** — phone OTP via Twilio |
| Key tables | `citizens`, `waitlist`, `transactions`, `security_events` |
| RLS | Row Level Security enabled on all tables |

### Citizens table schema
`id · wallet_address · citizen_name · phone_number · kyc_tier · wisdom_score · genesis_citizen · created_at · auth_user_id · web3_domain · indx_balance · last_seen_at`

---

## Frontend & Deployment

| Component | Technology |
|---|---|
| App screens | Mobile-first HTML (max-width 430px, dark theme) |
| Hosting | **Vercel** — project: `imagenationdex`, team: KukiKings |
| Domain | `imagenationdex.com` (live ✓) |
| DNS | Hostinger — A @ → 76.76.21.21, CNAME www → cname.vercel-dns.com |
| Repo | GitHub: `KukiKings/imagenationdex` (branch: main) |

---

## AI Layer — SIINDEX

**SIINDEX** (pronounced "Sighn-dex") — Sovereign AI COO. Female. Runs the platform 24/7.

| Component | Detail |
|---|---|
| Security | **PQSI** — Physical Quantum Synthetic Intelligence, 5 threat tiers (T0–T4) |
| Transaction protection | $10,000 USD/month per Grid Account |
| Pre-flight | 7-point check on every transaction before execution |
| Identity | **ZK-Proof** compliance — biometrics never leave the device |
| Travel Rule | TRISA/OpenVASP for transfers >$1,000 |
| 2FA threshold | $500 USD default |
| Agent wallet | Policy-governed, TEE-backed, self-custodial |

---

## Compliance & Identity

- **KYC Tier 0** — phone number + liveness scan only. No documents.
- **ZK-Proof identity** — verifies without exposing data
- **FATF Travel Rule** — ZK-proof via TRISA/OpenVASP
- **Legal structure** — Swiss Verein + Wyoming DAO LLC

---

## Immutable Laws (cannot be changed by anyone)

1. **98/2 Civilisation Law** — citizens keep 98% of every transaction. 2% to Civilisation Fund. Immutable.
2. **No seed phrase** — ever. Grid Account uses MPC only.
3. **T4 = full halt** — no resumption without AJ's explicit written authorisation.
4. **Biometrics never leave the device** — ZK-proof only.
5. **Grid Account** — requires 2-of-3 MPC keys. SIINDEX alone cannot access funds.

---

## Brand Colours

```
--cyan:    #00D4FF
--blue:    #2B35D8
--purple:  #8B3FE8
--black:   #090A10
--green:   #00E5A0
--gold:    #FFB800
--red:     #FF4D6D
--surface: #12141F
--surface2:#1A1D2E
--surface3:#22263A
```

---

## Wisdom Score Gates

| Score | Gate |
|---|---|
| 50 | Governance participation |
| 100 | Sovereign Yield access |
| 150 | Fee reduction |
| 200 | Sovereign Elder status |

Maximum: 200

---

## Key Wallet

**Phantom wallet (AJ):** `8HxNac3HAT56gJk3LRdGqiwq6DgciGK4cnaVMUNZaMZt`  
Alert email: `dadyboy73@gmail.com`  
Official project email: `imagenationdex@gmail.com`

---

## Current Build Phase

**Phase 5 — Backend + Deployment (active)**  
- 63+ app screens built (Waves 1–4 complete)  
- Public website live at imagenationdex.com  
- Supabase backend live (citizens/waitlist/transactions tables)  
- Next: INDX token mint → Raydium pool → Solana auth → Sovereign Yield

*Full spec: `/Projects/ImageNation DEX/phase5-spec.md`*  
*Whitepaper: `/Projects/ImageNation DEX/whitepaper-v1.md`*
