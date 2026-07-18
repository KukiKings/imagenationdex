# Sovereign Citizen Shield, Trusted Communications & NFT Receipt — Reality Ledger
> Companion doc to AJ's 27-section directive (18 Jul 2026). Maps doctrine to what IN$DEX can honestly build/claim now vs what needs external partnerships vs what is aspirational framing. Same method used for Sovereign Access Network, Presence Layer, and Executive/Citizen SIINDEX reality ledgers — read those for precedent.

**Rule for everything below:** if a screen or claim says a protection exists, the protection must exist. No fake shields. No theatre.

---

## 1. Research findings — the cited standards/stats, verified

All checked against current sources (Jul 2026). AJ's directive is well-grounded — nothing here was fabricated — but several citations need a precision correction before we build on them:

- **World Bank Global Findex 2025**: confirmed. 1.3B adults unbanked; of those, ~900M own a mobile phone and ~530M of those own a smartphone. Doing the subtraction: 900M − 530M = **370M basic/feature-phone-only** and 1.3B − 900M = **400M with no personal phone** — both match AJ's segmentation exactly. The 800M-without-ID / 2.8B-without-digital-ID / 1.4B-offline-across-81-countries figures are directionally consistent with recent World Bank/ID4D and ITU reporting; treat as approximate, not audited-to-the-person.
- **GSMA Open Gateway (Number Verification, SIM Swap, Device Swap, Call Forwarding Signal)**: real, CAMARA-standard APIs, live in production in multiple markets (e.g. Uruguay's Antel/Claro went live June 2026). **Availability is operator- and jurisdiction-dependent** — this must be built as an optional adapter pattern (matches the Provider Adapter contract already built for eSIM), never assumed present.
- **NIST phishing-resistant MFA guidance**: real and current, but the citation needs updating — **SP 800-63B was withdrawn Aug 2025 and superseded by SP 800-63B-4** (July 2025). The substance AJ cited is correct: OTP (SMS or app-generated, manually entered) is explicitly *not* classified as phishing-resistant; FIDO2/WebAuthn passkeys and PIV/CAC are the gold standard.
- **W3C Secure Payment Confirmation (SPC)**: confirmed still a **Candidate Recommendation Draft** (latest draft 15 Apr 2025), not a final Recommendation. Advancement depends on a second independent interoperable implementation, timeline unknown. Build toward it, but never market a screen as "W3C-certified" — it isn't a ratified standard yet.
- **C2PA Content Credentials**: confirmed real and now an ISO standard (ISO/IEC TR 20226:2025), spec v2.4 current, X.509-only signing as of the 2025 revision. Records provenance/edit history — does **not** verify that factual claims inside the content are true. Requires a C2PA-compliant signing tool/service; SIINDEX avatar/voice output would need to route through one.
- **ERC-5192 / ERC-5484 (soulbound tokens)**: confirmed real Ethereum EIPs. **Critical correction: these are EVM-only.** IN$DEX's canonical chain is Solana (SPL Token-2022, per whitepaper Appendix A) — ERC-5192/5484 literally cannot be deployed on Solana. The equivalent primitive is an **SPL Token-2022 mint with the Non-Transferable extension** (and optionally the Permanent Delegate extension if a founder-controlled burn/reissue path is wanted). AJ's own text anticipates this ("IN$DEX needs a chain-neutral receipt definition and must use an equivalent mechanism only where the selected chain can enforce it") — so this doc formalizes that as the actual Solana-native mechanism.
- **x402 payment protocol**: confirmed real, Coinbase-authored, HTTP-402-based stablecoin micropayment protocol for agent/API commerce, live with a real facilitator (Base/Polygon/Arbitrum/World/Solana). **Not fully confirmed:** a formally-named "signed-offer and receipt extension" or "payment-identifier extension" as official x402 spec extensions — search turned up strong idempotency-key/dedup *engineering guidance* from the ecosystem, not a citable spec section. Treat "x402 receipt extension" as a pattern to design ourselves (idempotency key + signed receipt on top of x402), not an off-the-shelf spec we can claim compliance with.
- **W3C Verifiable Credentials 2.0**: confirmed — became a full W3C Recommendation 15 May 2025 (VCDM 2.0 plus 6 companion specs, incl. Data Integrity 1.0 and Bitstring Status List 1.0 for revocation). This one is genuinely production-ready and safe to build directly on.
- **INTERPOL 2026 Global Financial Fraud Threat Assessment**: confirmed real, published ~17 Mar 2026. $442B global fraud losses in 2025, 54% rise in fraud-related Notices/Diffusions 2024→2025, agentic-AI fraud campaigns flagged as an emerging category. Accurately characterizes the threat environment AJ is designing against.

**Bottom line:** this is one of the better-sourced directives we've built from this session — the doctrine is not hallucinated. The build risk is entirely in *scope* (27 sections, population-scale, requires institutional partnerships for the telecom/law-enforcement layers) not in *premise*.

---

## 2. What IN$DEX can honestly build alone, right now (Supabase + screens)

No external partner needed:
- Trusted Sender Registry (schema + founder-managed entries)
- Malicious-content airlock — heuristic layer only (URL/domain shape checks, known-bad list, lookalike-domain detection, QR destination extraction+check). **Not** a full ML phishing classifier — that's a real product, not a weekend schema.
- VERIFIED / CAUTION / STOP / UNKNOWN classification states + citizen-facing check function
- Safe-callback pattern: registry lookup + "here's the verified contact route" — no live telephony integration
- Panic command (`protect_me()`): pause outgoing tx, revoke sessions, block new payees, log incident — all achievable against tables we already control
- Security/incident receipt (extends `consent_receipts`, already built this session)
- Action Intent Card hardening (extends what Part Eight already built)
- Agent spending boundary (extends `agent_registry`/policy tables from the Assurance Layer)
- NFT receipt data model + Layers 1-5 of the Sovereign Receipt Stack (citizen-readable receipt, signed machine receipt, VC-shaped receipt object, encrypted evidence reference, on-chain-anchor-ready digest) — **as data**, no live chain write required yet
- Citizen education prompts (copy, SIINDEX voice)

## 3. What needs a real external partner before it's honest to claim

- GSMA Open Gateway SIM-Swap/Number-Verification/Device-Swap/Call-Forwarding — needs a telecom aggregator relationship (same category as the eSIM Provider Adapter work). Build the adapter *interface* now; wire a real provider later. Never show a "SIM swap: clear" badge without a live call behind it.
- C2PA-signed SIINDEX media — needs a C2PA-compliant signing pipeline for avatar video/audio.
- W3C SPC cryptographic payment confirmation — needs browser/wallet-side implementation; still pre-Recommendation, high risk of spec churn.
- Layer 6 (actual on-chain NFT mint) — needs the live Solana program + Raydium LP work already tracked in phase5-spec.md. Data model can exist now; the mint instruction cannot fire before mainnet deployment.
- Scam Intelligence Exchange cross-institutional sharing — needs legal/data-sharing agreements, not just schema.
- Telecom-based coercion/shared-device signals, law-enforcement evidence preservation — policy + partnership work, not code.

## 4. What stays aspirational framing (do not build a fake version of)

- "SIINDEX verifies via GSMA Open Gateway" — do not simulate this with fake-pass logic. If no provider is wired, the check function must honestly return `UNKNOWN`/`not_available`, never a fabricated `VERIFIED`.
- Deepfake-proof avatar — C2PA proves origin, not truth. Never let copy imply "this proves it's really SIINDEX speaking the truth."
- Compensation reserve payouts — this is a real-money commitment requiring legal/treasury design (ties into the Financial/Institutional Survival Layer already built). Don't wire a button that promises money back without that design existing first.

---

## 5. Build sequence adopted for this pass

Phase 1 (building now): Trusted Sender Registry, content/URL/QR airlock (heuristic), classification states, safe-callback data model, panic command, security receipt, education copy hooks.
Phase 2+ (future sessions, needs partner or chain work): Payment firewall UI wiring, telecom adapters, NFT live minting, Scam Intelligence Exchange, compensation framework.

All Phase 1 objects follow this session's established default-deny discipline: RLS + matching grants together, ownership checks in-body AND at grant level, `SET search_path`, founder-gating for anything non-citizen-facing, migration receipts logged, `security.run_exposure_scan()` re-run clean after.
