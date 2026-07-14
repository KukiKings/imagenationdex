# Business Description — IN$DEX
**For AUSTRAC registration** · Draft 0.2 · 14 July 2026 · **Status: DRAFT — legal review required**
**Entity:** Arthur Henry (sole trader) t/a Image Nation Decentralised Exchange · ABN 95 579 343 955 · AAN 263945366

---

## What IN$DEX does (plain language)

IN$DEX (ImageNation Decentralised Exchange) is a mobile financial platform built for people the banking system never reached — beginning with Pacific Island communities and the Pacific diaspora in Australia. A customer ("citizen") signs up with a phone number, receives a personal payment address in the form of a simple name (for example, maria.IN$DEX), and can then receive money, send money, save, and cash out — without a bank account, and without managing cryptographic keys or seed phrases.

Under the surface, value moves as the platform's INDX token on the Solana blockchain, but the citizen experience is a payments app: scan a QR code or speak a name, see the fee, approve, done. On every transaction the citizen keeps 98% of value; 2% goes to the platform's Civilisation Fund (the protocol fee), fixed in code.

## Customer types
- Pacific diaspora in Australia sending remittances home (initial corridors: Samoa, Fiji, Vanuatu, Republic of the Marshall Islands)
- Unbanked and underbanked individuals in corridor countries receiving and spending funds
- Small merchants in corridor communities accepting payments
- Retail users trading the INDX token

## Products and services
| Service | Description |
|---|---|
| Grid Account | Custodial-style wallet using Squads Protocol v4 multisig with 2-of-3 MPC keys (device, cloud, recovery). No seed phrases exist. No single party — including the platform — can move funds alone. |
| P2P transfers | INDX transfers between citizens via sovereign domain addresses |
| Remittance | AUD in (via licensed on-ramp partners) → INDX transfer → local cash-out in corridor countries |
| DEX / token exchange | INDX/SOL liquidity pool on Raydium (Solana) |
| Staking | Time-locked INDX staking with published estimated ranges (no guaranteed returns) |
| Marketplace | Goods/services listings settled in INDX under the same transaction controls |

## Technology
- **Blockchain:** Solana mainnet; INDX is an SPL Token-2022 asset (100,000,000 fixed supply; mint and freeze authority burned)
- **Backend:** Supabase (PostgreSQL, Sydney region ap-southeast-2 — Australian data residency), row-level security, append-only compliance event ledger
- **Identity:** progressive verification tiers; biometric liveness processed on-device only
- **Monitoring:** PQSI real-time tiered transaction monitoring (T0–T4) with automated halt capability
- **Fiat rails:** licensed third-party on-ramp partners (Transak primary); IN$DEX does not accept cash

## How a transaction flows
1. Citizen initiates (app tap or voice) → 2. Platform runs pre-flight: identity tier check, sanctions/counterparty screening, limit check, Travel Rule data assembly → 3. Citizen shown full disclosure (amount, fee, destination, risk) and approves; 2FA above $500 → 4. Transaction signs via multisig and settles on Solana → 5. Records written: transaction record, consent receipt, IFTI report where cross-border → 6. Citizen receives receipt.

## Estimated volumes (first 12 months)
⬜ AJ to provide: estimated monthly transaction count and AUD value at launch and at month 12. (Recommend conservative, evidence-based figures — regulators prefer realistic over ambitious.)

## What IN$DEX does not do
No cash acceptance. No anonymous accounts. No guaranteed investment returns and no financial advice. No transfers to unscreened counterparties. No operation in sanctioned jurisdictions.
