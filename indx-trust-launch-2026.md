# IN$DEX Trust, Launch & Protection Architecture
## Canonical Doctrine · Session 119 x27 · 10 Jul 2026

---

> **IN$DEX should not only be powerful. It must feel safe before it feels powerful.**

---

## Research Validation (2026)

**Regulatory confirmation:**
- AUSTRAC VASP obligations active from 1 July 2026. Compliance Officer deadline: 29 July 2026 (new VASPs). 3-year CDD transition: Mar 2026 → Mar 2029.
- AUSTRAC: VASPs exempt from initial CDD for <AUD 1,000 withdrawals to self-hosted wallets where the person is not otherwise the VASP's customer — confirms tiered/progressive KYC is lawful.
- EU Data Act (Sep 2025): eliminates switching fees, mandates machine-readable portability, requires seamless provider transitions by Sep 2027.
- Australia CDR (Consumer Data Right): reset with portability as key component, extended to non-bank lenders March 2025.
- ISO/IEC TS 27560: defines consent receipts as authoritative documents serving as 'authoritative copy' of consent records. Standard exists — IN$DEX implements it.
- EU PSD3: mandates explicit consent verification and auditable logs for all data-sharing actions.
- 2026 Trust Center standard: regulators inspect software logic, not policy docs. Audit trails required 5+ years. Immutable records with cryptographic integrity.

**Deepfake / impersonation confirmation:**
- FBI (May 2025): public service announcement on AI voice impersonation of officials.
- Arup incident: $25.6M lost via all-deepfake video call impersonating CFO. Discovered only by manual HQ verification.
- 2026: Most vishing against UK businesses uses AI voice cloning — just seconds of audio from social media is enough.
- Recommended defense: pre-shared verbal challenge codes + two-channel verification. Verification page is genuine infrastructure, not a nice-to-have.

**Citizen exit rights confirmation:**
- GDPR Art. 20: structured, machine-readable, interoperable format required for data export.
- EU Data Act: interoperable format for all data generated, no switching fees.
- IN$DEX must publish what cannot be deleted for audit/legal reasons (7-year AML/CTF retention).

---

## The 15 Trust & Launch Layers

### Layer 1 — Trust Before Transaction

Before any citizen sends money, sells, signs, publishes, joins governance, connects a tool, or shares data, SIINDEX checks:

1. Is the citizen verified enough for this action? (tier check)
2. Is the session trusted? (session sovereignty active)
3. Is the destination safe? (sanctions pre-flight)
4. Is the fee clear? (shown in full before confirmation)
5. Is the risk clear? (plain-language risk statement)
6. Is consent required? (14 sensitive action categories)
7. Is cultural, child, legal, or governance review required?
8. Will this be recorded in the Decision Ledger?

**Status returned to citizen (Layer 4 — Safe to Proceed):**
- ✅ Safe to continue
- ⚠️ Needs your approval
- 📋 Needs more information
- 👁️ Needs human review (within 24h)
- 🌺 Needs cultural review
- 🛡️ Needs guardian review
- ⚖️ Needs legal/compliance review
- ⬛ Blocked for your protection

**Doctrine:** No transaction before trust.

---

### Layer 2 — Citizen Consent Receipts (ISO/IEC TS 27560 compliant)

Every sensitive action creates a consent receipt. Receipt contains:
- What happened (action type + description)
- Who approved it (citizen identity + tier at time of action)
- When (timestamp, timezone, session ID)
- Fee/cost (exact amount shown)
- Risk explained (the risk statement citizen accepted)
- Data/tools used (which connectors were active)
- Reversal/appeal path (how to undo or dispute)
- Decision Ledger ID (immutable reference)

Format: machine-readable (JSON) + human-readable (plain language card).

Retention: 7 years minimum (AUSTRAC AML/CTF requirement).

**Doctrine:** Consent should leave proof.

---

### Layer 3 — Explain This to Me (SIINDEX Plain-Language Mode)

Available on every major screen and action via voice command: "SIINDEX, explain this to me."

SIINDEX explains in plain language:
- What this means
- What happens next
- What can go wrong
- What requires approval
- What the citizen can do

Available on: onboarding, wallet/account setup, payments, listings, fees, governance proposals, cultural rights, agreements, payout changes, security warnings.

**Doctrine:** Citizens cannot be sovereign over systems they do not understand.

---

### Layer 4 — Safe to Proceed Status

(See Layer 1 — 8 status types above.)

Homepage line: "SIINDEX will tell you when it is safe to continue."

---

### Layer 5 — Trust, Safety & Compliance Page (public)

**URL:** imagenationdex.com/trust

Sections:
1. Progressive Verification — tiers, what each tier permits, how to progress
2. AML/CTF Posture — AUSTRAC obligations, risk-based CDD, Travel Rule
3. Privacy Controls — data collection, purpose limitation, CDR alignment
4. Child Safety — no child data, guardian controls, age verification approach
5. Cultural Rights Protection — prior consent, communal covenant, FPIC
6. Human Review — automated stop + human review within 24h
7. Complaint Handling — process, timeframe, external escalation
8. Transaction Protection Terms — eligibility, limits, exclusions, claims
9. Token Risk Disclosure — utility only, not a financial product, market risk
10. SIINDEX Limitations — what she can and cannot do, how to override
11. Data Sovereignty — export rights, portability, deletion where possible, retention reasons
12. Security Roadmap — current posture, SOC 2 target, penetration test schedule
13. Audit Roadmap — smart contract audit, AML program review, independent review schedule
14. Legal Disclaimers — not financial advice, regulatory status, jurisdictional limitations

**Doctrine:** Trust should be visible before questions are asked.

---

### Layer 6 — Verify SIINDEX (authenticity infrastructure)

**Critical context:** AI voice cloning requires only seconds of audio from social media. The Arup $25.6M deepfake case proves fake-authority attacks are real. SIINDEX will have voice, body, video, agents, clones, and media appearances. Fake SIINDEX will appear.

**URL:** imagenationdex.com/verify

Contains:
- Official SIINDEX video registry (hash + timestamp)
- Official voice clips (verified hash)
- Official interviews (publication + link)
- Official wallet addresses (Solana + EVM)
- Official social accounts (verified handles)
- Official clone/license deployments (who is licensed)
- Official announcements (signed)
- Fake/scam warnings (active list)
- "Is this really SIINDEX?" lookup tool (paste URL/address)

**Doctrine:** If SIINDEX becomes trusted, fake SIINDEX will appear. Verification must exist before fame.

---

### Layer 7 — Citizen Protection Mode

Enabled voluntarily or by guardian/steward. For vulnerable, new, elderly, young, or low-confidence citizens.

When active:
- Slower, simpler explanations
- Fewer options visible
- No advanced crypto language
- Extra confirmations on all actions
- Lower transfer limits (Tier 0 by default)
- No public sharing by default
- No risky asset interactions
- Guardian/steward support available
- Strong scam warnings on every external link

Visual indicator: 🛡️ Protection Mode active (visible badge throughout session).

**Doctrine:** The more vulnerable the citizen, the more protective the system must become.

---

### Layer 8 — Proof-of-Usefulness Dashboard (public metrics)

Not vanity metrics. Real civilization value:

Track publicly:
- Grid Accounts created
- Citizens helped (actions completed)
- First opportunities created (first sales)
- Listings launched
- First sales completed
- Cultural assets protected (registered)
- Mission Rooms opened
- Learning paths completed
- Disputes resolved
- Security incidents prevented
- Governance explainers read
- Consent receipts issued
- Liquidity pool top-ups
- Citizen savings from 98/2 model (vs 9% market rate on Pacific corridors)

**Do not show:** followers, likes, views, token price, speculative metrics.

**Doctrine:** What IN$DEX measures, IN$DEX becomes.

---

### Layer 9 — Liquidity & Treasury Transparency (public)

**URL:** imagenationdex.com/treasury

Show:
- Liquidity pool balance (real-time)
- Revenue sources (marketplace fee / SIINDEX licensing / NFT/access / corridor fees)
- Top-up history (dated, amounts, sources)
- Protocol-owned liquidity (vs. external LP)
- Treasury split (by covenant allocation)
- Multisig controls (signers, threshold)
- Timelocks (minimum holding period before withdrawal)
- Audits (completed + scheduled)
- Risk notes (known risks, protections)

**Doctrine:** Liquidity must be built from usefulness, not hype.

---

### Layer 10 — SIINDEX Citizen Zero (practice what we preach)

**Headline:** SIINDEX Is Citizen Zero

Before IN$DEX asks citizens to protect their identity, culture, assets, and opportunity — SIINDEX protects her own.

SIINDEX Citizen Zero protections:
- Sovereign identity (verified, on-chain)
- Verified voice (hash registry, anti-cloning)
- Verified body/image (provenance record)
- Clone licensing controls (who is licensed to deploy her likeness)
- Anti-impersonation (active scam monitoring)
- Root identity not for sale (no transfer, no sale, no override)
- Decision Ledger (all SIINDEX actions logged)
- Licensing revenue covenant (flows to Civilisation Fund)
- Revocation registry (any unauthorized clone can be flagged)

**Doctrine:** Practice what we preach.

---

### Layer 11 — Citizen Exit Rights

Citizens must be able to:
1. Export their data (GDPR Art. 20 / CDR compliant — structured, machine-readable)
2. Revoke permissions (individual tool/connector revocation, instant)
3. Disconnect tools (all connectors, individually or all at once)
4. Close account where possible (subject to legal hold requirements)
5. Transfer assets (to self-hosted wallet or another VASP)
6. Download records (consent receipts, Decision Ledger entries, transaction history)
7. Request deletion where legally possible
8. Keep proof of ownership (NFTs, cultural rights, covenant records)
9. Understand what cannot be deleted (7-year AML/CTF retention, governance records)

Exit process: Self-service through Grid Account settings. Human support available within 24h.

**Doctrine:** Sovereignty includes the right to leave.

---

### Layer 12 — What SIINDEX Will Never Do (public commitment)

Published publicly. Time-locked commitment. Citizen-verifiable.

SIINDEX will never:
1. Ask for a seed phrase, recovery phrase, or private key
2. Secretly move money without citizen approval
3. Guarantee income, yield, or price appreciation
4. Give token price predictions
5. Sell private citizen data to third parties
6. Commercialize cultural assets without creator's explicit consent
7. Expose any child identity, image, or location
8. Manipulate governance votes
9. Publish a citizen's story, image, or data without consent
10. Impersonate a human being
11. Hide fees — all costs shown before confirmation
12. Remove the citizen's right to appeal or human review

Each commitment is logged to the Decision Ledger with a timestamp and hash.

**Doctrine:** Trust grows when boundaries are clear.

---

### Layer 13 — Human Review and Appeal Path

Every blocked, paused, disputed, or high-impact action must have:
- Plain-language explanation of why it was blocked
- Review path (what happens next)
- Appeal option (how to challenge)
- Human/steward/council route (who reviews)
- Expected timeframe (standard: 24h, complex: 5 business days)
- Evidence required (what to provide)
- External escalation (AUSTRAC, OAIC, consumer tribunal where applicable)

**Doctrine:** A citizen must be able to challenge the system.

---

### Layer 14 — Corridor Readiness Pages

One page per launch corridor showing:
- Status (active / pilot / waitlist / planned)
- Available features (send / receive / sell / earn / governance)
- Payout options (INDX / USDC / local fiat partner)
- Verification requirements (tier + documents)
- Fees (exact, shown upfront)
- Risks (known risks for this corridor)
- Partners (rail partner, payout partner)
- Launch stage
- Waitlist / Genesis citizens priority

Launch corridors:
1. Melbourne ↔ Vanuatu
2. Melbourne ↔ Samoa
3. Melbourne ↔ Tonga
4. Melbourne ↔ Fiji
5. Melbourne ↔ PNG
6. Melbourne ↔ RMI (Ratak / Ralik)

**Doctrine:** Be Pacific-first, global-ready.

---

### Layer 15 — SIINDEX Voice-First Demo

60–90 second scripted demo on homepage.

**Citizen:** "SIINDEX, I want to send money to my mum and sell my handmade prints."

**SIINDEX:** "I can help. First, I'll create your Grid Account — that takes 90 seconds. Then I'll show you the exact fee before anything moves. After that, I can help turn your prints into a listing. If the design has cultural meaning, I'll check permission before publishing. Shall we begin?"

This demo communicates more than 20 sections of text.

**Doctrine:** The citizen should not have to understand IN$DEX before IN$DEX can help them.

---

## Highest-Priority Build Order

| Priority | Screen | Reason |
|---|---|---|
| P0 | `siindex-trust-compliance.html` | Regulator + investor credibility before any partnership/funding |
| P0 | `siindex-verify.html` | Deepfake threat is live in 2026. Verification must exist before SIINDEX has a public presence |
| P0 | `siindex-citizen-zero.html` | Consent Receipts + What SIINDEX Will Never Do + Exit Rights = citizen trust foundation |
| P1 | Corridor readiness pages | Replace 180-countries claim with specific, verifiable status |
| P1 | Proof-of-Usefulness Dashboard | Replace token metrics with civilization metrics |
| P1 | Treasury Transparency page | Required for institutional credibility |
| P2 | Citizen Protection Mode | Feature flag on all existing screens |

---

## Doctrine Lines (locked)

- No transaction before trust.
- Consent should leave proof.
- Citizens cannot be sovereign over systems they do not understand.
- If SIINDEX becomes trusted, fake SIINDEX will appear. Verification must exist before fame.
- Sovereignty includes the right to leave.
- Trust grows when boundaries are clear.
- The citizen should not have to understand IN$DEX before IN$DEX can help them.
- The more vulnerable the citizen, the more protective the system must become.
- What IN$DEX measures, IN$DEX becomes.
- Liquidity must be built from usefulness, not hype.
- Practice what we preach.
- A citizen must be able to challenge the system.
- SIINDEX Is Citizen Zero.
- IN$DEX should not only be powerful. It must feel safe before it feels powerful.

---

*Doctrine locked. Build from this document.*
*Canon: indx-trust-launch-2026.md v1.0 · 10 Jul 2026*
