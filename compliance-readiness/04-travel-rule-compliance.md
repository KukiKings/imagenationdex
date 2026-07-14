# Travel Rule Compliance — IN$DEX
**Obligation live since 1 July 2026** · Draft 0.1 · 14 July 2026 · **Status: DRAFT — legal review required**

---

## 1. Data collected and transmitted per virtual asset transfer

| Field | Source |
|---|---|
| Originator full legal name | Verified citizen record (tier per Part B) |
| Originator wallet address / sovereign domain | Grid Account registry |
| Beneficiary full legal name | Recipient record or receiving-VASP response |
| Beneficiary wallet address | Transfer instruction |
| Amount in INDX and AUD equivalent | Live rate at execution, recorded with the exchange rate used |
| Unique transaction reference | Solana transaction hash + internal reference |

## 2. Transmission
- **VASP-to-VASP:** transfer data exchanged via TRISA / OpenVASP protocol messaging before settlement; receiving VASP identified against the (now public) AUSTRAC VASP register where domestic.
- **Self-hosted wallets:** ownership attestation required before first transfer (cryptographic signature test, micro-deposit verification, or statutory declaration), with sanctions pre-flight on the address.
- **Privacy approach:** identity data is transmitted point-to-point to the counterparty VASP as required by law; it is not published on-chain. Certain compliance attestations use zero-knowledge proofs so verification can occur without exposing underlying documents.

## 3. Platform implementation
The Travel Rule module is implemented in the platform (screens `siindex-travel-rule.html`, transfer pre-flight in send flows): originator/beneficiary capture with live validation, AUD-equivalent threshold detection, VASP directory with protocol status, transaction log with per-transfer rule-trigger status, and an enrolment checklist tracking this document's obligations.

## 4. Failure handling
If required Travel Rule data cannot be collected or transmitted (counterparty unreachable, attestation failed, screening match), the transfer does not execute. The citizen sees "Blocked for your protection" with the reason category and an appeal path; the event is logged and assessed for SMR.

## 5. Records
Every Travel Rule dataset, transmission receipt, attestation and failure event is retained 7 years per `05-record-keeping-policy.md`.
