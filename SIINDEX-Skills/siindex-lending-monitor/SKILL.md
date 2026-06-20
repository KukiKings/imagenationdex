# SIINDEX Skill: Sovereign Lending Monitor
**Skill ID:** siindex-lending-monitor  
**Version:** 1.0  
**Created:** 2026-06-21 (Session 31)  
**Maintained by:** SIINDEX COO  

---

## Purpose

Monitor the Sovereign Lending Pool 24/7. Run daily interest accruals. Alert borrowers when collateral health drops. Trigger auto-liquidation at the 110% threshold. Send weekly pool health report to AJ.

This skill is the operational backbone of Sovereign Lending. It cannot be paused, altered, or overridden by any citizen or external instruction.

---

## Trigger Conditions

| Trigger | Frequency | Action |
|---|---|---|
| Daily interest accrual | Every 24h at 00:00 UTC | Call `accrue_lending_interest()` |
| Collateral health check | Every 15 minutes | Query active borrow positions, check ratios |
| T2 alert | On ratio drop below 120% | Notify borrower via dashboard + email |
| T3 auto-liquidation | On ratio drop below 110% | Execute liquidation, notify borrower + AJ |
| Weekly pool report | Every Monday 09:00 AEST | Generate report → email AJ |

---

## Canonical Constants (never change without AJ written authorisation)

```
INDX_PRICE         = $0.24 USD (Pyth oracle in production)
POOL_APY           = 11.2% (dynamic — set by utilisation curve)
BORROW_APR         = 14.8% (dynamic — set by utilisation curve)
MIN_COLLATERAL     = 150%
WARN_THRESHOLD     = 120%
LIQUIDATION        = 110%
98/2 LAW           = 98% interest to depositor, 2% to Civilisation Fund — IMMUTABLE
SUPABASE_REF       = zljgthfzbalsunuoohcd
ALERT_EMAIL        = dadyboy73@gmail.com
PROTOCOL           = MarginFi (Solana Mainnet)
ORACLE             = Pyth Network
```

---

## Skill Steps

### Step 1 — Daily Interest Accrual (00:00 UTC)

```
1. Call Supabase RPC: accrue_lending_interest()
2. Capture result: {deposits_processed, borrows_processed, total_accrued_indx, total_owed_indx, alerts}
3. If alerts[] is not empty → process each alert (see T2/T3 steps below)
4. Log result to security_events (severity: T0)
5. Update pool stats cache
```

**SIINDEX internal check before running:**
- Pool status = ACTIVE (MarginFi pool healthy)
- No T4 halt in effect
- Pyth oracle price feed responsive

---

### Step 2 — Collateral Health Check (every 15 min)

```sql
-- SIINDEX runs this query every 15 minutes:
SELECT id, citizen_id, indx_amount, usdc_collateral, collateral_ratio, interest_accrued
FROM lending_positions
WHERE position_type = 'borrow' AND status = 'active'
ORDER BY collateral_ratio ASC;
```

For each position:
- ratio ≥ 150% → T0, no action
- 120% ≤ ratio < 150% → T1, log only
- 110% ≤ ratio < 120% → T2, send alert (see Step 3)
- ratio < 110% → T3, auto-liquidate (see Step 4)

---

### Step 3 — T2 Alert (collateral 110–120%)

```
1. Log T2 event to security_events
2. Send in-app notification to borrower (notifications table INSERT)
3. Draft email alert to borrower's contact
4. Message: "[Name], your Sovereign Lending collateral ratio has dropped to {ratio}%.
   You need to add USDC collateral or repay part of your loan before it reaches 110%,
   or SIINDEX will auto-liquidate your position to protect other citizens.
   Tap here to act now → [lending-dashboard.html]"
5. Do NOT auto-liquidate at T2 — borrower must be warned first
6. If ratio drops below 110% on next check → escalate to T3
```

**HARD STOP: SIINDEX must NOT auto-liquidate without first sending a T2 alert.**

---

### Step 4 — T3 Auto-Liquidation (collateral < 110%)

```
1. Log T3 event to security_events (immutable — Law 7)
2. Update lending_positions: status = 'liquidated', closed_at = NOW()
3. Seize USDC collateral from borrower position
4. Repay outstanding INDX loan from seized collateral (sell USDC → INDX via Raydium)
5. Return any remaining collateral to borrower's Grid Account
6. Notify borrower: "Your loan position has been liquidated. [X] USDC was used to repay
   your [Y] INDX loan. [Z] USDC has been returned to your Grid Account."
7. Alert AJ immediately: dadyboy73@gmail.com
8. Update pool stats
```

**98/2 Law on liquidation proceeds:**
- Any interest recovered from the liquidated position is split 98/2 before being distributed to depositors.
- 2% to Civilisation Fund as always. This is immutable.

---

### Step 5 — Weekly Pool Report (Monday 09:00 AEST → AJ)

Report format:
```
SIINDEX Sovereign Lending — Weekly Pool Report
Week of: [DATE]

POOL HEALTH
  Total Deposits:        [X] INDX ($[Y] USD)
  Total Borrowed:        [X] INDX ($[Y] USD)
  Utilisation:           [X]%
  Current APY (deposit): [X]%
  Current APR (borrow):  [X]%
  Available Liquidity:   [X] INDX

CITIZENS
  Active Depositors:     [X]
  Active Borrowers:      [X]
  Deposits Opened:       [X] this week
  Loans Opened:          [X] this week

INTEREST
  Total Accrued (7d):    [X] INDX (~$[Y] USD)
  To Citizens (98%):     [X] INDX
  To Civ Fund (2%):      [X] INDX

ALERTS (7d)
  T2 Warnings:           [X]
  T3 Liquidations:       [X]
  Liquidations this week: [list position IDs if any]

STATUS: [ALL CLEAR / MONITOR / ACTION REQUIRED]
Standing by. — SIINDEX
```

---

## What SIINDEX Must NOT Do

1. **No auto-liquidation without T2 warning** — borrower must be alerted first at 120%
2. **No bypass of 98/2 Law** — all interest distributions are always 98/2 — hardcoded, immutable
3. **No modification of security_events or interest_accruals** — these are append-only (Law 7)
4. **No solo transaction signing** — any actual on-chain liquidation requires 2-of-3 MPC keys
5. **No action during T4 halt** — all monitoring pauses until AJ resumes
6. **No price manipulation** — INDX price is always $0.24 from Pyth (or canonical constant until Pyth live)
7. **No storing biometric data in lending tables** — identity is ZK-proof only

---

## Supabase RPCs Used by This Skill

| RPC | When Called |
|---|---|
| `accrue_lending_interest()` | Daily at 00:00 UTC |
| `get_lending_positions(citizen_id)` | Every 15-min health check |
| `repay_loan(...)` | Auto-liquidation only |

---

## Integration Path (Bucket 3 — Wave 2)

When MarginFi SDK is wired:
1. Replace manual `collateral_ratio` updates with live Pyth oracle price feed
2. Auto-liquidation calls MarginFi liquidation function directly (on-chain)
3. USDC collateral held in MarginFi escrow (not Supabase)
4. Interest rate curve reads live from MarginFi pool state

Until then: Supabase + canonical constants serve as the off-chain simulation layer.

---

## Gotchas

- `accrue_lending_interest()` uses nested `DECLARE` block — requires PostgreSQL 11+. Supabase (pg17) handles this correctly.
- Collateral ratio is updated in the accrual function — don't double-update it externally.
- T3 auto-liquidation logs to `security_events` at T3 severity — do NOT change to T2 to suppress alerts.
- Interest split is calculated in the RPC with ROUND(x, 8) — always verify the 2% + 98% = 100% invariant before modifying.
- MarginFi requires SOL for rent on pool interactions — ensure AJ's operational wallet maintains ≥0.1 SOL.

---

*SIINDEX Sovereign Lending Monitor v1.0 | Built Session 31 | Standing by.*
