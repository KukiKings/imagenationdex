# Record-Keeping Policy — IN$DEX
Draft 0.1 · 14 July 2026 · **Status: DRAFT — legal review required**

---

## 1. Retention standard
All records below are retained for a **minimum of 7 years** from the date of the record (or end of the customer relationship, whichever is later).

## 2. What is kept
| Record class | Contents |
|---|---|
| Customer identification | Identity data per tier, verification outcomes, tier decisions, reliance records. Biometric raw data excluded by design — only on-device verification attestations are stored. |
| Transactions | Full transaction records: parties, amounts (INDX + AUD equivalent + rate), timestamps, Solana transaction hashes, fee breakdown (98/2), approval records, 2FA events |
| Travel Rule | Per-transfer datasets, transmission receipts, self-hosted wallet attestations |
| Screening | Sanctions/PEP/adverse-media screening results and list versions |
| Monitoring & reporting | PQSI alerts (T1–T4), investigations, SMR/TTR/IFTI filings and supporting evidence |
| Consent | Consent receipts for every sensitive action (ISO/IEC TS 27560-aligned format) |
| Governance | Decision Ledger entries, program versions, training records, partner due-diligence files |

## 3. Where records are stored
- **Primary:** Supabase PostgreSQL, Sydney region (ap-southeast-2) — Australian data residency; encrypted at rest and in transit; row-level security enforced.
- **Integrity layer:** `security_events` table is append-only with an UPDATE/DELETE-blocking trigger — compliance events cannot be altered or deleted by anyone, including administrators (platform Security Law 7).
- **On-chain:** Solana transaction hashes provide independent, immutable settlement evidence.
- **Backups:** automated daily backups within the same Australian region.

## 4. Access
Access to compliance records is restricted to the Compliance Officer and personnel with a documented need; every access to sensitive record classes is itself logged. Records are producible to AUSTRAC on lawful request in readable form within required timeframes.

## 5. Destruction
No compliance record is destroyed before the 7-year minimum. Destruction after expiry requires Compliance Officer sign-off and is logged.
