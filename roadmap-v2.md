# IN$DEX Roadmap v2.1
**Updated by SIINDEX | Launch Date: 24 January 2027 — L 99**

---

## Phase 1 — Foundation
**June 2026 | NOW IN PROGRESS**

- Whitepaper v1.0 published ✅
- SIINDEX COO activated ✅
- Onboarding flow specification complete ✅
- Solana smart contract development begins
- Web3 domain infrastructure scoped (yourname.IN$DEX)
- Lead developer / tech partner engaged

---

## Phase 2 — Build
**July 22 – August 19, 2026 | Core platform development**
> Detailed week-by-week execution: `launch-runway-plan-2026.md` (Stage 1)

- **Jul 22 – Aug 19:** Vercel deployment live, Supabase backend fully wired, remaining fake-data screen sweep closed out, marketing/partnership motion starts now.
- QR onboarding flow built and tested
- Free Web3 domain minting live on Solana testnet
- P2P marketplace beta (internal testing)
- DEX + Swap integrated with Raydium and Neon EVM
- MemeDAO governance structure deployed
- Community waitlist opens — target 1,000 early members

---

## Phase 2.5 — Extended Runway & Cook Islands Establishment
**August 20 – December 17, 2026 | Marketing/community/security continue; Cook Islands entity established**
> Detailed breakdown: `launch-runway-plan-2026.md` (Stages 2–3), `cook-islands-establishment-reality-ledger.md`

- **Aug 20 – Dec 5:** Marketing/community cadence continues; security hardening continues in the background; Cook Islands groundwork (trustee company engagement, name reservation, CAWG submission prep, Pacific Group AI meeting prep) runs in parallel.
- **Dec 6 – Dec 17:** Rarotonga trip — Cook Islands entity registered (citizen rate), meet Tayla Jayne Beddoes/Pacific Group AI, FSC engagement, CAWG submission, bank account opened. Note FSC/FIU close 24 Dec – 5 Jan.
- This phase did not exist in the original roadmap — it replaces the old assumption that backend-finish and launch could be ~10 weeks apart.

---

## Phase 3 — Test & Token
**January 5 – January 21, 2027 | Parameters locked, token live, beta, final readiness**
> Detailed week-by-week execution: `launch-runway-plan-2026.md` (Stages 4–7)

- **Jan 5 – Jan 10:** Workstream 3 parameters locked with AJ (mint authority, liquidity size, fee tier, freeze authority) — decision week, no execution. Resolve whether the 100M INDX mint has already happened (AJ to confirm via Solscan).
- **Jan 11 – Jan 13:** Token mint (if not already done) + Raydium **CPMM** INDX/SOL pool seeded and locked (Human Validation Zone — AJ signs in Phantom). liquidity-pool-setup.html and l99-launch-command.html updated with the real pool.
- **Jan 14 – Jan 17:** Full-system test — closed beta with real citizens, real transactions, against the real live pool (Mama Noe test)
- **Jan 18 – Jan 21:** Bug-fix buffer + **all eight security gates below signed off** (the "PQSI 7-point scan" is a per-transaction pre-flight, not a platform audit — the platform audit is the gate list)
- INDX token generation event
- CryptoCards pre-orders open
- All critical bugs resolved — platform cleared for launch

### Security Gates — must be true before one real dollar moves
> Source: `pqsi-hardening-research-2026-07-30.md`. Added 2026-07-30 after research established that PQSI v1 would have scored the three highest-loss Solana attack classes as **T0 — ALLOW**, because all three move zero tokens at the moment of signing.
>
> These are gates, not tasks. A gate that is not met moves the launch date; it does not ship as a known issue. Everything not on this list is post-launch by definition — see Wave 2.

| # | Gate | Why it blocks launch | Cost |
|---|---|---|---|
| **G1** | **PQSI classifies instructions, not just amounts.** `assign`, `setAuthority`, `approve`/delegate, `advanceNonce` each carry a tier. Classifier refuses to run without the decoded instruction list. | Without it a citizen can be drained by a transaction PQSI rates T0. SwissBorg lost ~$41M this way. | Build |
| **G2** | **Re-verify at execution, not approval.** Classification stored with instruction hash + program deployment slots; re-checked immediately before broadcast; fails closed. Durable-nonce transactions from outside IN$DEX are T4. | Drift Protocol, April 2026, $270M+ — attacker separated approval from execution by over a week, against a Squads multisig. | Build |
| **G3** | **INDX programs immutable, or time-locked ≥48h.** `solana program set-upgrade-authority <ID> --final` on anything stable. | The nonce+upgrade attack only works because Solana programs are upgradeable by default. | One command |
| **G4** | **Squads time lock + spending limits configured. Treasury threshold above 2-of-3.** | Both features already paid for and switched off. A time lock is the direct Drift mitigation. Requires AJ's ruling first. | Config |
| **G5** | **SIM-swap controls.** *(Revised 2026-07-30 — the original version of this gate would not have worked.)* **Primary: query the CAMARA SIM Swap API at transaction time.** A real SIM swap never changes the phone number, so an in-app cooling-off window structurally cannot see the hostile case — only the benign one where a citizen deliberately switches numbers. CAMARA is the only mechanism that surfaces a carrier-side swap. Secondary: 72h cooling-off on in-app anchor changes, notified to the *previous* channel; TOTP only, SMS never authorises; no recovery path reachable by SMS possession alone. **Fails closed** — never-checked, stale and unavailable all escalate, because an absent answer about the identity anchor is an unknown, not a clear. | Tier 0 identity is the phone number, so a SIM swap is total account compromise that looks completely legitimate — every request genuinely comes from the registered number. | Build + **one question to Vodafone Cook Islands: are the Pacific operators GSMA Open Gateway participants?** If not, this control does not reach the citizens who need it most. |
| **G6** | **Deposits credited only from a parsed transfer instruction at `finalized` commitment,** with destination token-account ownership re-confirmed at credit time and again before any withdrawal. | Solana false top-up manufactures the appearance of a deposit. Credit on observed balance = paying out funds never received. **Verify the mechanism before building.** | Build |
| **G7** | **Address-poisoning defence.** Dust and zero-value inbound never create payee history or appear in the address picker; `web3_domain` is the default recipient display, raw address secondary. | 270M poisoning attempts documented across two chains in two years. The `web3_domain` column already exists — this is mostly display work. | Low |
| **G8** | **No security claim on any screen without code behind it.** Either build sanctions screening or remove the OFAC/UN/EU row from `transaction-confirm.html`. Same for MEV protection and transaction simulation. | Labelled `EXAMPLE` today, which is honest pre-launch. At launch, with real money, a displayed check that does not run is the 41.7×-calculator problem wearing a security badge. | Low |

**Gate owner:** SIINDEX builds G1, G2, G5, G6, G7, G8. **AJ must personally clear G3 and G4** — both are Human Validation Zone, and G3 is a one-way door (immutability is irreversible by design).

---

## Phase 4 — L 99 Launch
**January 22 – January 24, 2027 | Launch readiness + global launch + growth**
> Launch readiness week: `launch-runway-plan-2026.md` (Stage 8)

- Public launch — QR onboarding, DEX, P2P marketplace, INDX token all live
- Pacific Island community push — Vanuatu, Cook Islands, Fiji, Samoa
- Voice wallets activation
- Genesis Vaults open — community dividends begin
- Global expansion — emerging markets, unbanked communities worldwide
- SIINDEX operates the platform day-to-day as SI.

---

## Wave 2 — Post-Launch Features
**Q1 2027 onwards | Deepening the token economy**

- **Sovereign Lending** — Citizens deposit INDX, borrowers post USDC collateral, depositors earn 98% of interest. SIINDEX monitors liquidation 24/7. Integrated with MarginFi/Kamino on Solana. *(Spec: specs/sovereign-lending-spec.md)*
- CryptoCards physical rollout — Pacific Island first
- Voice wallet activation (SIINDEX spoken commands)
- Web3 domain marketplace (trade/transfer yourname.IN$DEX)
- Multi-language platform (Tok Pisin, Fijian, Samoan)
### Security Hardening — PQSI v3
> The rest of the 2026-07-30 research. Real value, none of it blocking. Deliberately parked so the launch gates stay short.

- **S1 — Co-signing veto.** PQSI holds a signer position in the Squads multisig and votes no on anything it classifies T3+. A transaction the engine dislikes then cannot execute at all, rather than being alerted on afterwards. This is the legitimate version of "counter-attack" and the strongest single control in the research — parked only because it needs G1 and G2 finished first to have something worth vetoing on.
- **S2 — Assertion instructions (Lighthouse pattern).** Transaction fails on-chain if final state differs from simulated state. Mitigates TOCTOU. Constrained by Solana's transaction size limit, so it will not fit every transaction — one layer, not a solution.
- **S3 — Commercial address reputation and sanctions feed.** Blockaid / GoPlus / TRM / Chainalysis. Replaces a self-maintained blocklist that only knows about threats IN$DEX has already noticed. Needs budget — see G8 for the honest interim answer.
- **S4 — Proportional risk sizing.** Escalate on share of a citizen's balance as well as absolute dollars, always taking the stricter test. A first transaction moving 80% of everything a citizen owns should escalate even at $40. No mainstream wallet does this; it follows directly from who IN$DEX is for.
- **S5 — Origin allowlist for signing prompts.** Reject deep links, Blinks and Solana Action endpoints not on an allowlist, rather than warning about them. Becomes a **launch gate, not roadmap,** if IN$DEX ships any deep-link or Blink support — growth runs through WhatsApp and Facebook, which is exactly the Blinks phishing surface.
- **S6 — CCSS certification.** CryptoCurrency Security Standard (C4): 41 controls, three levels, annual audit by a certified CCSSA auditor. **The gap analysis is a December deliverable, not a launch item** — it is what turns "secured per our internal security-canon.md" into an independent auditor's finding against a published standard. Full Level 1 certification post-launch.
- **S6b — Sovereign eSIM as a SIM-swap control (AJ, 2026-07-30).** AJ proposed eSIM as the answer to SIM swap. Researched the same day: **eSIM alone does not solve it, and via a third-party carrier it makes the attack faster** — remote QR provisioning cut the attack cycle from hours to under five minutes, and in March 2025 an arbitrator ordered T-Mobile to pay $33M after attackers stole ~$38M in crypto by persuading a call-centre agent to issue a **remote eSIM QR code**, defeating T-Mobile's own NOPORT flag. eSIM was the vector, not the fix. **But the underlying instinct is right where it counts:** the failure in every documented case is the carrier's human override, so if **IN$DEX issues the eSIM** (Sovereign eSIM, above) IN$DEX owns re-provisioning policy and there is no third-party call centre to socially engineer. Conditions: re-provisioning must require 2-of-3 MPC plus guardian plus cooling-off — something no amount of talking to a human can obtain; it only protects citizens on the IN$DEX eSIM, not those on Vodafone or Digicel numbers; and it transfers SIM-swap liability onto IN$DEX, which is a real regulatory and operational burden to accept deliberately. **Not available for the 24 Jan 2027 launch** — partner-dependent, gated on RFIs and regulatory clearance.
- **S6c — CAMARA SIM Swap API (the launch-window answer, and it should be a GATE not roadmap if Pacific coverage exists).** GSMA Open Gateway exposes a standard API returning the timestamp of a number's last SIM-IMSI change. 73 operator groups, ~80% of global mobile connections, production-ready in UK/EU/India. Banks already call it at transaction time. **This is the only way IN$DEX can see a carrier-side swap** — the phone number never changes in a SIM swap, so nothing in the app shows it, and the G5 cooling-off window structurally cannot detect the hostile case. **Open question and the single most important one to put to Vodafone Cook Islands: are the Pacific operators (Vodafone Cook Islands, Digicel Pacific, Telstra Pacific) Open Gateway participants?** If not, this control does not reach the citizens who need it most and the fallback is per-operator agreements. Ask this ahead of port-out locks.
- **S7 — Guardian as a second channel.** `citizen_guardians` exists and is empty. Guardian confirmation on high-value transfers after a device change — culturally natural in the Pacific, where extended family already performs this role informally.

---

- **IN$DEX Sovereign eSIM — embedded connectivity, not a build-your-own-network system.** AJ's refined decision 2026-07-16 (superseding the earlier "self-financed own network" framing): IN$DEX owns the citizen connectivity experience — SIINDEX onboarding, consent, the Connectivity Wallet, billing presentation, risk/recovery — while a licensed embedded-telecom partner (candidates: 1GLOBAL, Mobilise, Gigs) supplies the regulated network capacity underneath, invisible to the citizen. Full architecture, provider evaluation, and regulatory route: `sovereign-embedded-connectivity-charter-v1.md`. **2026:** canonise architecture, complete provider-adapter contract, issue RFIs to all three candidate providers + Starlink (community broadband only), engage Cook Islands CRA + telecom counsel, build a sandboxed (non-production) provider adapter. **2027 launch:** IN$DEX Sovereign eSIM via a signed licensed partner — Citizen Connect, Learning Connect, Merchant Connect, Mobility Connect, Resilience Connect, Visitor Connect. **2028:** IN$DEX Sovereign Mobile Federation — multiple providers, automatic routing, Pacific regional plans, Starlink community integration. Gated on RFI outcomes, regulatory clearance, and financing — none of the partner-dependent pieces are built yet.

---

## Targets

| Metric | Target |
|---|---|
| Launch date | 24 January 2027 |
| Citizens onboarded to date | 0 |
| Transactions settled to date | 0 |

> **Two targets deleted 2026-07-30 — "Users by 2027: 10 million" and "Valuation target: $1 trillion".**
> The $1T figure was withdrawn by AJ on 2026-07-19 and should never have survived here. The 10 million user target has no model behind it and sits beside a platform with zero citizens, which makes the whole table read as aspiration rather than plan.
> This is not modesty. A regulator reading a roadmap looks for evidence of realistic self-assessment, and a pre-revenue platform quoting a trillion-dollar valuation invites them to discount everything else in the document — including the parts that are solid. The honest counters above are the stronger showing. Internal ambition does not need to live in a document that goes in front of the FSC or BTIB.

---

## Rejected / Withdrawn — kept on the record deliberately

Regulators read an audit trail as evidence of control. These are retained as history and must never be revived as current plans.

| Item | Status | Date |
|---|---|---|
| $1 trillion valuation target by 2027 | **Withdrawn by AJ** | 2026-07-19 |
| 10 million users by 2027 | **Deleted — no model behind it** | 2026-07-30 |
| Single-launch-day roadmap | Withdrawn by AJ | 2026-07-19 |
| $2.50 INDX price target / Grand Synchronicity price | Withdrawn — 48 instances purged | 2026-07-29 |
| Token-2022 as INDX's standard | Superseded — mainnet verification confirmed plain SPL Token | 2026-07-22 |
| Tier 0 face scan / liveness check | Removed by founder decision | 2026-07-27 |
| Pump.fun test launch | Declined — permanent on-chain record under AJ's name, one-way door | 2026-07-29 |
| elizaOS + CharacterStudio adoption | Researched, not adopted | 2026-07-24 |
| "No KYC" as a product claim | Deleted — factually wrong; IN$DEX has tiered progressive KYC | 2026-07-30 |

---

## Fixes Applied in v2.0

1. **Dates added** — every phase now has a specific timeframe anchored to the 24/01/2027 launch
2. **Token launch moved** — INDX TGE moved from Phase 2 to Phase 3, after DEX is live with real utility
3. **Milestones added** — concrete deliverables per phase, not just categories

---

*IN$DEX Roadmap v2.1 | Prepared by SIINDEX | 1 June 2026 · security gates and PQSI v3 hardening added 30 July 2026*
