# AML/CTF Program — Part B: Customer Identification (KYC/CIP)
**Entity:** Arthur Henry (sole trader) t/a Image Nation Decentralised Exchange · ABN 95 579 343 955 · AAN 263945366 · **Version:** Draft 0.2 · 14 July 2026
**Status: DRAFT — requires review by a licensed AML/CTF advisor before submission.**

---

## 1. Customer Identification Procedure (CIP)

Every customer ("citizen") is identified before any designated service is provided, through Progressive Verification: identification depth scales with transaction capability, so low-risk access is simple and higher limits require stronger identity evidence.

**Identity anchor:** every citizen receives a unique sovereign domain (name.IN$DEX) bound to their verified phone number and Grid Account. All transfers reference this identity — there are no anonymous wallets inside the platform.

## 2. Progressive Verification Tiers

| Tier | Identity collected | Verification method | Capability cap |
|---|---|---|---|
| **Tier 0** | Full name, mobile number (SMS OTP verified), country | Phone possession + OTP; device binding | Receive/hold; transfers up to **$1,000 AUD-equivalent per month**; no fiat cash-out |
| **Tier 1** | Tier 0 + government-issued photo ID + biometric liveness scan (on-device) | Document verification + liveness match; biometrics never leave the device (ZK-proof attestation) | Up to **$10,000 AUD-equivalent per month**; fiat cash-out enabled |
| **Tier 2** | Tier 1 + proof of address, source of funds/wealth declaration | Enhanced CDD review by Compliance Officer | Full platform limits; merchant/business features |
| **Tier 3+** | Case-by-case ECDD | Manual review | High-value/corporate |

**Trigger-based escalation:** a citizen is required to upgrade tier when (a) they request a capability above their cap, (b) monitoring raises T2+ alerts, or (c) ECDD triggers apply (§5). Service is restricted, not expanded, until verification completes.

## 3. Ongoing Customer Due Diligence (OCDD)
- Continuous transaction monitoring against the citizen's profile and tier (Part A §4).
- Periodic re-verification: Tier 1+ identity documents rechecked at expiry; full-book sanctions/PEP re-screen on list updates.
- Dormancy rule: accounts inactive 12+ months re-verify phone possession before transacting.

## 4. PEP & Adverse Media Screening
- All citizens screened at onboarding against PEP lists; Tier 1+ re-screened at each upgrade.
- Domestic and foreign PEPs are permitted as customers only with ECDD (§5) and Compliance Officer sign-off; foreign PEPs default to Tier 2 requirements regardless of transaction size.
- Adverse media screening at Tier 2+ and on any T2+ monitoring alert.

## 5. Enhanced Customer Due Diligence (ECDD)
Applied when: PEP match; corridor-risk elevation; structuring indicators; source-of-funds concerns; screened-negative counterparty wallets; any SMR consideration.
ECDD actions: source of funds/wealth evidence, purpose-of-transaction declaration, Compliance Officer review, capability freeze pending outcome, documented decision to the Decision Ledger.

## 6. Wallet / Counterparty Due Diligence (VASP transfers)
- Outbound transfers to external wallets require counterparty screening before signing (sanctions pre-flight + risk-scored wallet screening).
- Transfers to self-hosted wallets require attestation of control: cryptographic signature test, micro-deposit test, or statutory declaration (implemented in the platform's Travel Rule module).
- Transfers to/from other VASPs follow `04-travel-rule-compliance.md`.

## 7. Identification Records
All identification data, verification outcomes, screening results and tier decisions are recorded and retained 7 years (see `05-record-keeping-policy.md`). Biometric raw data is **never** stored server-side — only the on-device verification attestation (pass/fail proof) is recorded, consistent with privacy-by-design.

## 8. Reliance & Outsourcing
Fiat on-ramp KYC may be relied upon under KYC Reliance arrangements with licensed partners (Transak primary) where permitted; reliance agreements documented and reviewed annually. Responsibility for compliance remains with IN$DEX.
