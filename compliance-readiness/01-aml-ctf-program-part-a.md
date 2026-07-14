# AML/CTF Program — Part A: Risk & Governance
**Entity:** Arthur Henry (sole trader), trading as Image Nation Decentralised Exchange (IN$DEX)
**ABN:** 95 579 343 955 · **AUSTRAC AAN:** 263945366 · **Version:** Draft 0.2 · 14 July 2026
**Status: DRAFT — requires review by a licensed AML/CTF advisor before submission.**

---

## 1. Designated Services Provided

| # | Designated service | How IN$DEX provides it |
|---|---|---|
| 1 | Exchange of virtual assets | INDX/SOL trading via on-platform DEX (Raydium CPMM pool) |
| 2 | Transfer of virtual assets | Citizen-to-citizen INDX transfers via sovereign domains (name.IN$DEX) |
| 3 | Custody/administration of virtual assets | Grid Account — Squads Protocol v4 multisig, 2-of-3 MPC keys; the platform never holds unilateral control (no single key, including the platform's, can move citizen funds) |
| 4 | Remittance (RSP) | Australia → Pacific corridors: Samoa, Fiji, Vanuatu, Republic of the Marshall Islands |

## 2. Business Risk Assessment (ML/TF)

### 2.1 Customer risk
- **Primary customers:** retail citizens — Pacific diaspora in Australia and unbanked/underbanked citizens in Pacific corridor countries. Predominantly low-value, high-frequency remittance and P2P payments.
- **Elevated-risk segments:** customers in higher-risk jurisdictions; customers structuring transfers below thresholds; politically exposed persons (PEPs).
- **Mitigations:** Progressive verification tiers with hard transaction caps (Part B §2); PEP and sanctions screening at onboarding and ongoing; velocity monitoring per Grid Account.

### 2.2 Product/service risk
- **Virtual asset transfers:** pseudonymity risk mitigated by mandatory sovereign-domain identity binding (every wallet maps to a verified citizen identity at the tier limits in Part B) and counterparty wallet screening.
- **Remittance corridors:** cash-out points in Pacific jurisdictions with developing AML regimes. Mitigation: corridor-specific limits, IFTI reporting on every cross-border transfer, partner due diligence (§2.4).
- **Custody:** 2-of-3 MPC removes single-point key theft; the immutable 98/2 protocol fee is enforced in code and cannot be bypassed to obscure flows.

### 2.3 Channel risk
- 100% non-face-to-face onboarding (mobile). Mitigation: biometric liveness verification from Tier 1, device binding, phone-number verification at Tier 0 with strict caps.

### 2.4 Third-party/partner risk
- Fiat on-ramp partners (Transak primary, Kado secondary — both selected under the Sovereign Ramp Standard, which requires the partner to hold its own licences and perform KYC Reliance).
- Payment/telecom partners in corridors (subject to due diligence before activation).
- Correspondent-style relationships documented and reviewed annually.

### 2.5 Jurisdiction risk
- Operating base: Australia. Corridor countries: Samoa, Fiji, Vanuatu, RMI — each assessed against FATF lists at onboarding of the corridor and quarterly thereafter. Any corridor country added to the FATF blacklist suspends new transfers to that corridor pending review.

## 3. Governance & Oversight

- **AML/CTF Compliance Officer:** Arthur John Henry, Founder & Director (senior management authority confirmed). Contact: ⬜ phone · imagenationdex@gmail.com.
  - **Honest gap flagged for reviewer:** the founder does not hold prior formal AML/CTF certification. Recommendation: engage an external AML/CTF advisor for the first 12 months and complete an accredited AML/CTF compliance course before launch (L99, 24 Sep 2026).
- **Board oversight:** the sole director reviews the compliance dashboard monthly and signs the Annual Compliance Report. All compliance events are logged immutably (§6).
- **Program review:** independent review annually; first review scheduled before L99 launch.

## 4. Transaction Monitoring

Monitoring is implemented through the PQSI tiered-alert framework, applied to every transaction in real time:

| Tier | Meaning | Automated response |
|---|---|---|
| T0 | Clear | None |
| T1 | Advisory | Logged |
| T2 | Caution | Auto-execution paused, dashboard flag, draft alert to Compliance Officer |
| T3 | Alert | Transactions halted for the account, immediate alert + email to Compliance Officer |
| T4 | Critical | Full platform halt; resumption requires the Compliance Officer's explicit written authorisation |

**Rule triggers include:** velocity anomalies per Grid Account; structuring patterns (repeated just-below-threshold transfers); transfers to newly created or screened-negative wallets; corridor-limit breaches; sanctions-list matches; 2FA is mandatory above AUD-equivalent $500 per transaction (citizen-adjustable downward only).

## 5. Reporting Obligations

| Report | Trigger | Process |
|---|---|---|
| SMR (Suspicious Matter Report) | Any reasonable suspicion of ML/TF | Compliance Officer files with AUSTRAC within 3 business days (24h for terrorism financing); supporting evidence exported from the immutable event log |
| TTR (Threshold Transaction Report) | Physical currency ≥ AUD $10,000 | Not currently applicable (no cash acceptance); procedure retained in case cash agents are introduced |
| IFTI | Every international funds/VA transfer instruction | Automated report generation per corridor transfer; filed within 10 business days |
| Annual Compliance Report | Yearly | Self-assessment by Compliance Officer |

## 6. Record Keeping
Per `05-record-keeping-policy.md`: all transaction records, customer identification records, screening results, SMR/TTR/IFTI filings and compliance decisions retained **7 years minimum**, stored in Supabase (Sydney region, ap-southeast-2 — Australian data residency) with an append-only, deletion-blocked security_events ledger, plus on-chain transaction references.

## 7. Sanctions Screening
- Lists screened: UN Consolidated, Australian (DFAT) Consolidated, OFAC SDN, EU Restrictive Measures.
- Screening points: at onboarding, at every tier upgrade, per-transfer counterparty pre-flight, and full-book re-screen on list updates.
- Positive match → transaction blocked (status: "Blocked for your protection"), account frozen at T3, SMR assessment initiated.

## 8. Staff Training
Current staffing is founder-only; training obligation applies to the founder and any future staff/agents: AML/CTF induction before system access, annual refresher, corridor-specific typology training. Training records kept 7 years.

## 9. Program Change Control
Any change to this Program requires the Compliance Officer's written sign-off, is version-numbered, and is logged to the Decision Ledger. AUSTRAC enrolment details updated within 14 days of any material change.
