# IN$DEX eCrypto Card — Build Brief
**Status:** Ready to spec infrastructure, build card UI when BIN sponsor confirmed
**Priority:** Critical — core product, mass adoption driver
**Date logged:** 2026-06-25
**Estimated build time:** UI = 1 Claude Code session | Infrastructure = requires BIN sponsor partner

---

## What it is

The IN$DEX CryptoCard — a sovereign Visa/Mastercard-network card linked directly to the citizen's .IN$DEX domain wallet. No card number identity. No bank account required. Your domain IS your card. Spend digital assets anywhere on Earth, withdraw cash at ATMs, and top up with cash at IN$DEX merchant terminals.

---

## Market context

- Crypto card monthly spend: $100M (2023) → $1.5B (late 2025) → $18B annualised. 15x in 2 years.
- Crypto ATM market: $550M (2026) → $18.1B (2034) at 54.8% CAGR.
- Mastercard chose Solana (IN$DEX's chain) for stablecoin settlement.
- Visa runs stablecoin settlement and carries 90%+ of all on-chain crypto card volume.
- 59% of crypto users now prefer non-custodial wallets — IN$DEX's model is the market preference.
- 1.3 billion adults globally are unbanked. Most have mobile phones.

---

## The 6 spending use cases (ranked by adoption impact)

### 1. Apple Pay & Google Pay — tap to pay anywhere
Virtual card issued in seconds after biometric KYC → citizen adds to Apple Pay or Google Pay → taps phone at any contactless terminal on Earth. No physical card wait. No new wallet app. This is the #1 adoption driver. Phantom launched this on Solana. Bitget Wallet Card supports Apple Pay, Google Pay, WeChat Pay, and Alipay globally. IN$DEX path: PQSI biometric onboarding → virtual card issued → live on Apple Pay before citizen leaves the onboarding screen.

### 2. Physical CryptoCard — ATM withdrawals & in-store
Physical card ships within 7 days of virtual card issue. Works at 40,000+ crypto ATMs globally plus the entire Visa/Mastercard ATM network. ATM limit tiers by Wisdom Score:
- Tier 1 (new citizen): $500/day
- Tier 2 (established): $2,000/day
- Tier 3 Sovereign Elder (Wisdom Score 200+): $5,000/day

Higher responsible on-chain behaviour = higher spending power. This replaces credit scoring for people who have never had a credit file.

### 3. Stablecoin-backed spending (USDC as the rails)
Volatile crypto makes terrible spending currency. The industry has converged: USDC at the spending layer. Citizen holds INDX/SOL/local tokens in sovereign wallet → automatic conversion to USDC at point of sale → citizen never touches the conversion. Solana fees: $0.0005 per transaction. Mastercard's settlement chain: Solana. This is a natural fit.

### 4. Zero-fee cross-border spending
Pacific remittance corridors charge 6–11% in fees. Western Union to Vanuatu: ~9%. IN$DEX CryptoCard: 0% FX on USDC spending. 2% SovereignPay fee goes back into the protocol, not to Western Union. A Pacific worker sending $500 home saves $45 every single time. This is the disruption claim that writes itself.

### 5. INDX cashback on every purchase
Every card purchase earns INDX token cashback. Rate by Wisdom Score tier:
- Tier 1: 1% cashback in INDX
- Tier 2: 2.5% cashback in INDX
- Tier 3 Sovereign Elder: 5% cashback in INDX
Cashback auto-deposits to Genesis Vault (compounding). The card makes the citizen richer in the IN$DEX protocol with every purchase. Best crypto cards in 2026 offer up to 20% — room to grow.

### 6. Cash top-up at IN$DEX merchant terminals (the Pacific unbanked on-ramp)
Every IN$DEX merchant becomes a top-up point. Citizen hands merchant cash → merchant scans citizen's .IN$DEX QR → USDC credited to citizen's wallet → available on card immediately. Same model as M-PESA agent top-up in Kenya. This is the feature that unlocks the genuinely unbanked — cash-to-card with no bank account required. Visa and Mastercard support "cash at retail" top-up through prepaid card programs.

---

## The 3 deposit (top-up) methods

| Method | Speed | Fee | Who it serves |
|---|---|---|---|
| Cash at merchant terminal | Instant | 0% | Unbanked Pacific citizens |
| Debit/credit card | Instant | ~3–4% | Banked citizens, quick top-up |
| Bank transfer (ACH/NPP/local rails) | 1–2 days | ~1% | Larger deposits |

Apple Pay and Google Pay top-up directly into the IN$DEX wallet will also be supported.

---

## The 3 withdrawal methods

| Method | Where | Daily limit |
|---|---|---|
| ATM (physical card) | 40,000+ crypto ATMs + global Visa/Mastercard network | Wisdom Score tier |
| Bank off-ramp | USDC → local bank account | $10,000/day |
| Merchant cash-out (P2P) | Any IN$DEX merchant — scan QR, receive cash | $500/day (Tier 1) |

---

## IN$DEX-specific differentiators nobody can copy

**The domain IS the card identity** — No 16-digit card number. No expiry date to steal. Authentication is biometric + .IN$DEX domain. To pay you, someone sends to your domain. When you tap your card, it resolves your domain. Structurally impossible for traditional card issuers to replicate.

**Wisdom Score-tiered limits** — Responsible behaviour upgrades your card. Bad actors stay capped. Replaces credit scoring for a population that has never had a credit file.

**SIINDEX fraud detection at point of sale** — Every transaction runs PQSI pre-flight before it executes. SIM swap, device compromise, scam merchant → transaction paused before money moves. No other crypto card has an AI immune system at the card layer.

**Merchant network as the on/off ramp** — IN$DEX merchants are the ATMs and the cash top-up points. The card and the marketplace are the same closed-loop economy. Every merchant added deepens the network effect.

**Spending at IN$DEX merchants = double cashback** — 5% cashback when spending at an IN$DEX merchant terminal (vs 1% elsewhere for Tier 1). Drives merchant and citizen adoption simultaneously.

---

## Infrastructure path — how to issue the card

IN$DEX does not need to become a bank. The path is BIN sponsorship:

1. **BIN Sponsor** — a licensed financial institution holds the Visa/Mastercard membership and issues under their umbrella. Mastercard just launched "BIN Sponsor Plus" — a formalised accreditation program specifically to shorten fintech time-to-market.
2. **Program Manager** — IN$DEX acts as the program manager: controls the product, UX, reward logic, and PQSI security layer.
3. **Card Processor** — Marqeta, Galileo, Stripe Issuing, or Paymentology. All support crypto card programs on Solana/USDC rails.
4. **Timeline** — 60–90 days to first virtual card with the right BIN sponsor.

**BIN sponsor candidates to approach:**
- Marqeta (powers Square, Uber, DoorDash card programs)
- Galileo (powers SoFi, Chime, MoneyLion)
- Paymentology (emerging markets focus, Pacific-relevant)
- Stripe Issuing (fastest time to market, developer-friendly)

---

## Card UI screens to build (Claude Code)

- [ ] `my-card.html` — upgrade existing screen with: virtual card display (masked), Apple Pay / Google Pay add buttons, balance, last 5 transactions, cashback earned this month
- [ ] `card-top-up.html` — deposit flow: choose method (cash/card/bank), amount, confirm
- [ ] `card-atm-withdrawal.html` — find nearest crypto ATM (map), daily limit remaining, PIN management
- [ ] `card-cashback.html` — cashback history, INDX earned, Genesis Vault link, tier progress
- [ ] `card-freeze.html` — instant card freeze/unfreeze, PQSI security alerts, transaction disputes
- [ ] `merchant-card-topup.html` — merchant-side screen: scan citizen QR, enter cash amount, confirm top-up

---

## How to kick off the UI build

Open Claude Code and paste this:

> "Build an upgrade to `my-card.html` for the IN$DEX CryptoCard. Dark theme (cyan #00D4FF, black #090A10). Show a virtual card with the citizen's .IN$DEX domain name (no card number visible — domain IS the identity). Show: current balance in USDC and INDX, Apple Pay and Google Pay add buttons, Wisdom Score tier badge, cashback earned this month, last 5 transactions with merchant name and amount, freeze/unfreeze toggle, and a 'Top Up' button. Mobile-first, single HTML file."

Then build each additional screen as a separate session.

---

## What needs to happen before card goes live

- [ ] BIN sponsor partner selected and contracted
- [ ] Visa or Mastercard program manager application submitted
- [ ] PQSI card transaction layer built (pre-flight on card spend, not just wallet transactions)
- [ ] USDC/INDX → fiat conversion oracle integrated
- [ ] Apple Pay / Google Pay provisioning API connected
- [ ] Cash top-up merchant terminal flow tested with pilot merchants
- [ ] Wisdom Score tier logic implemented in card issuance system
- [ ] ATM network PIN provisioning tested

---

## Source research

Session date: 2026-06-25
Research covered: Crypto card market data ($18B annualised), Solana/Mastercard/Visa stablecoin settlement, Apple Pay/Google Pay integration landscape, ATM market ($18B by 2034), BIN sponsorship infrastructure (Mastercard BIN Sponsor Plus), USDC stablecoin spending rails, cashback reward benchmarks, no-KYC limitations, cash top-up for unbanked, cross-border fee disruption opportunity.
