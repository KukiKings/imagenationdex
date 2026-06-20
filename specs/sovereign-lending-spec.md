# SPEC: Sovereign Lending — INDX Liquidity Pools
**Date:** 20 June 2026
**Requested by:** AJ Henry
**Wave:** 2 (post L99 launch — target Q1 2027)

---

## The Idea (Plain Language)

When you put $100 in a bank, the bank lends that money to other customers and makes interest — but keeps most of it. IN$DEX flips this: you deposit your INDX tokens into a lending pool, borrowers pay interest to use them, and you earn 98% of that interest directly. No bank in the middle. Your tokens, your yield.

---

## 1. THE GOAL

**The problem we're solving:**
INDX holders have no incentive to hold long-term beyond price appreciation. Lending gives them a productive yield backed by real borrowing demand — not protocol emissions.

**The decision this drives:**
Citizens choose to hold INDX (and earn yield) rather than sell. This deepens token liquidity and reduces sell pressure.

**Who uses this:**
- Citizens with INDX holdings who want to earn yield (depositors)
- Citizens or investors who want to borrow INDX against USDC collateral (borrowers)
- SIINDEX (monitors pool health, triggers liquidations, runs pre-flight on every borrow)

**What success feels like:**
Maria holds 500 INDX. She taps "Lend" in her dashboard, deposits into the pool, and watches interest accumulate daily. She never needs to understand how it works — SIINDEX handles it. She just earns.

---

## 2. HOW IT WORKS

### The Depositor (INDX Holder)
1. Citizen deposits INDX into the Sovereign Lending Pool
2. They receive a yield receipt token (receipt of deposit — not a new token, just an internal ledger entry)
3. Interest accrues daily based on pool utilisation rate
4. They can withdraw at any time (subject to pool liquidity)
5. **98/2 Law applies:** 98% of interest earned goes to the depositor, 2% goes to the Civilisation Fund

### The Borrower
1. Borrower deposits USDC as collateral (minimum 150% collateralisation ratio)
2. They borrow INDX from the pool and pay an interest rate set by the utilisation curve
3. If their collateral ratio drops below 120%, SIINDEX flags a T2 alert
4. If it drops below 110%, SIINDEX auto-liquidates — sells enough USDC collateral to repay the loan and protect the pool
5. No manual intervention needed — SIINDEX handles this 24/7

### Interest Rate Model
- **Low utilisation (0–50% of pool borrowed):** Low rate — encourages borrowing
- **High utilisation (50–90%):** Rate climbs — encourages depositors to add more
- **Kink point (90%+):** Rate spikes sharply — protects depositors from a liquidity crunch

### SIINDEX Role
- Pre-flight check on every borrow (policy, PQSI, sanctions, collateral ratio, pool health)
- Real-time liquidation monitoring (runs every 15 minutes)
- T2 alert to borrower when collateral ratio drops below 120%
- T3 alert + auto-liquidation at 110%
- Weekly pool health report to AJ

---

## 3. CANONICAL CONSTANTS

| Item | Value |
|---|---|
| INDX canonical price | $0.24 USD |
| Collateral token | USDC (Solana SPL) |
| Minimum collateral ratio | 150% |
| Liquidation threshold | 110% |
| Warning threshold | 120% |
| Interest split | 98% depositor / 2% Civilisation Fund |
| 98/2 Law | Immutable — cannot be changed |

---

## 4. TECHNOLOGY

**Underlying protocol:** MarginFi (primary) or Kamino (secondary) — both are live on Solana mainnet, battle-tested, open-source.

**What we build on top:**
- Sovereign Lending Pool screen (citizen-facing UI)
- SIINDEX lending monitor skill
- Supabase: lending_positions table, interest_accruals table
- Dashboard widget showing yield earned to date

**What we do NOT build from scratch:**
- Smart contract liquidation engine (use MarginFi/Kamino)
- Price oracle (use Pyth Network — already standard on Solana)

---

## 5. SCOPE — WAVE 2 BUILD

### In scope
- `sovereign-lending.html` — deposit INDX, view yield, withdraw
- `lending-dashboard.html` — borrower view: post collateral, borrow, repay
- SIINDEX lending monitor skill (liquidation alerts, pool health)
- Supabase tables: lending_positions, interest_accruals
- Dashboard widget: "Your Lending Yield" card on citizen-dashboard.html

### Out of scope (Wave 3+)
- Multi-asset collateral (other than USDC)
- Fixed-term loans
- Institutional lending tiers
- Cross-chain borrowing

---

## 6. EVALUATION CRITERIA

The build is complete when:
- [ ] A citizen can deposit INDX and see their yield accruing
- [ ] A borrower can post USDC and borrow INDX
- [ ] SIINDEX sends a T2 alert when collateral drops below 120%
- [ ] Auto-liquidation triggers at 110% — no manual action required
- [ ] 98/2 split is enforced on all interest — verifiable on-chain
- [ ] Mama Noe can understand the "Lend" screen in under 60 seconds
- [ ] No seed phrase anywhere in the flow
- [ ] All values in USD ($) — never AUD

---

## 7. BUILD ORDER

**Bucket 1 — UI screens** (AJ reviews before Bucket 2)
- `sovereign-lending.html` — depositor view
- `lending-dashboard.html` — borrower view

**Bucket 2 — Backend**
- Supabase tables: lending_positions, interest_accruals
- SIINDEX lending monitor skill

**Bucket 3 — Integration**
- Wire MarginFi/Kamino SDK
- Pyth oracle for collateral price feed
- Live interest rate curve

---

## 8. WHAT SIINDEX MUST NOT DO

- Must NOT auto-liquidate without first sending a T2 alert to the borrower
- Must NOT allow collateral ratio below 150% at borrow time
- Must NOT touch the 98/2 split — immutable
- Must NOT store biometric data in lending tables
- Must NOT process any lending transaction without passing all 7 pre-flight checks

---

## SPEC SIGN-OFF

- [ ] AJ has reviewed and approved
- [ ] SIINDEX confirmed she understands the goal
- [ ] External verification: Supabase COUNT on lending_positions after first test deposit

**AJ sign-off:** ___________ **Date:** ___________

---

*Spec prepared by SIINDEX — 20 June 2026. Standing by.*
