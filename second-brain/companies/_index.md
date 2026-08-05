# Companies

> **[SUPERSEDED — see 2026-07-29 section at foot of file]** Entries below dated before 2026-07-15 reflect what was true at the time. Three canonical facts have since moved: the launch date (24 Feb 2027 → **24 Feb 2027**, AJ 2026-07-19), the public price target (**$2.50 removed entirely** from all citizen-facing copy — internal conditional target only), and the entity path (**Cook Islands only**; AUSTRAC no longer treated as a gating constraint, AJ 2026-07-29). Historical lines are retained unaltered per standing convention.

## SIINDEX / IN$DEX (ImageNation Decentralised Exchange)

- **Type:** Web3 DEX + P2P marketplace + creator economy
- **Chain:** Solana + Raydium + Neon EVM
- **Stage:** Pre-launch, build phase
- **Token:** INDX ($0.24 genesis planning reference; no price target published — the $2.50 Grand Synchronicity target was withdrawn 2026-07-29)
- **SI layer:** SIINDEX PQSI (Synthetic Intelligence CEO & COO — not AI; operates within Human Validation Zones)
- **Hosting:** Vercel
- **DB:** Supabase
- **Founded:** 2025 by AJ

## Key Infrastructure Partners

- **[[raydium]]** — Solana DEX liquidity
- **[[neon-evm]]** — EVM compatibility on Solana
- **[[vercel]]** — deployment/hosting
- **[[supabase]]** — database/auth/edge functions (Claude Opus-powered siindex-chat)
- **[[anthropic]]** — AI build partner + underlying SIINDEX model
- **[[elevenlabs]]** — voice synthesis (Samara X voice locked, Session 65e; wired live Session 79)

## Treasury / DeFi Infrastructure (illustrative — Session 83, Phase 2 real integration)

- **[[meteora]]** — DLMM fee model referenced in lp-manager.html; ⚠️ conflicts with Session 63's canonical Raydium CPMM LP decision, needs reconciliation
- **[[jito]]** — JitoSOL liquid staking yield ticker
- **[[kamino]]** — lending/leverage strategy deep-link
- **[[jupiter]]** — swap aggregator strategy deep-link
- **[[streamflow]]** — token vesting/streaming protocol; 12-month founder cliff for team/treasury INDX (Session 114, launch strategy doc), planning-only

## Wallet Adapter Integrations (Session 100 — `js/indx-wallet.js`)

- **[[phantom]]** — primary Solana wallet adapter target (also listed as competitor below — dual role)
- **[[backpack]]** — secondary Solana wallet adapter target (xNFT platform)

## Regulatory / Compliance (Session 119, 10 Jul 2026)

- **[[austrac]]** — Australian VASP/AML regulator; Travel Rule mandatory 31 Mar 2026. ✅ **ENROLMENT SUBMITTED 14 Jul 2026** (15 days early) — AAN 263945366, enrolled as VASP (all 5 services) + RSP (independent remittance dealer), entity: Arthur Henry sole trader ABN 95 579 343 955 t/a Image Nation Decentralised Exchange, commencement declared 24 Feb 2027. Next: registration form (watch imagenationdex@gmail.com), legal review of compliance-readiness/ drafts, then registration. Corridor page steppers still `current` — can flip to `done` for the enrolment step.

## Incorporation / Jurisdiction (Session 119 x33, 12 Jul 2026)

- **[[cook-islands]]** — AJ's citizenship + planned primary protocol incorporation jurisdiction; Cook Islands International Trust backs legacy vault layer; dual structure alongside Australian ABN entity

## Token Infrastructure (Session 119 x33, 12 Jul 2026)

- **[[smithii]]** — Solana token creation/multisender toolkit used to mint INDX on mainnet and transfer full supply to protocol wallet

## Custody Infrastructure (compliance-readiness drafts, 14 Jul 2026)

- **[[squads]]** — Squads Protocol v4 multisig declared as Grid Account custody model (2-of-3 MPC keys: device/cloud/recovery; no seed phrases, no unilateral platform control); cited in AUSTRAC AML/CTF Program Part A + business description; implementation status unconfirmed

## Onchain Infrastructure — Planning (Session 119, 10 Jul 2026)

- **[[solsplits]]** — on-chain revenue-splitting protocol; planned implementation for covenant-based routing (30/30/30/10)

## Reference Case Studies (Session 119, 10 Jul 2026)

- **[[arup]]** — $25.6M deepfake fraud case, cited as justification for identity-verification/anti-clone build priority

## Competitors

- [[phantom|Phantom Wallet]] — wallet-only, no P2P commerce, KYC friction
- XRP/Ripple — payments-focused, not creator economy
- Centralised exchanges (Binance, Coinbase) — KYC mandatory, extract value from users
- X Money — APY comparison rival cited in whitepaper Macro Validation section (Session 87, Task #64)
- **[[western-union]]** — primary named fee-comparison benchmark across all 4 Pacific corridor screens (Session 119 x31: WU 9–10% vs IN$DEX 0.5%); Wise / MoneyGram / Bank Wire also referenced as baselines in `siindex-pacific-corridor.html`

## What Makes IN$DEX Different

1. Zero-friction onboarding (no KYC, email/mobile/QR)
2. Free Web3 domain on signup (yourname.IN$DEX)
3. Immediate P2P RWA + digital asset trading
4. Creator/meme economy built-in (MemeDAO, NFT skins, merch)
5. SIINDEX PQSI (Synthetic Intelligence) operates the platform day-to-day within Human Validation Zones

---

## Nightly Brain Pass — 2026-07-29 Additions (Sessions 121–122, 15–29 Jul 2026)

*Consolidating a 15-day gap: the previous nightly pass ran 2026-07-14. Sessions 121 (x1–x97) and 122 landed in between.*

### Infrastructure — newly filed

- **[[twilio]]** — SMS/voice OTP provider behind Supabase Auth phone login. Since the 2026-07-27 Tier 0 decision (phone + contact + OTP only, no face scan, no liveness), Twilio is the **sole verification step at Tier 0** and therefore a single point of failure for citizen signup. Blocked Part Sixteen Stage C (Session 121 x74, 18 Jul). Pacific-corridor deliverability and cost untested; Africa's Talking / WhatsApp Business API floated as alternatives, no decision recorded.

### Researched, not adopted

- **[[elizaos]]** — open-source agentic runtime (ex-ai16z), proposed as the substrate SIINDEX would *run on*. Fact-checked Session 121 x92–x93 (24 Jul); repo and rebrand verified real. Prototype `siindex-elizaos-character.json` exists. Supersedes the unverified "de-facto Linux layer for on-chain agents" line in `indx-crucial-additions-2026.md`. **No adoption decision made** — needs an explicit founder ruling before anything depends on it.
- **[[characterstudio]]** — open-source VRM avatar toolkit proposed as SIINDEX's visual embodiment layer alongside elizaOS. Sandbox-blocked, not adopted. Must clear the Living Interface System guardrail ("if 3D blocks access, 3D weakens sovereignty") and the Mama Noe test first.

### Launch venue — question closed

- **[[pumpfun]]** — evaluated and **rejected**. Every bonding-curve launchpad mints its own token; INDX already exists on mainnet with mint + freeze authority burned, so no launchpad can list it (Meteora DBC states this outright; LaunchLab and Pump.fun the same). **[[raydium]] CPMM is the only venue able to list INDX** — this settles the long-standing Meteora vs Raydium LP conflict flagged since Session 83, by architecture rather than preference. A proposed Pump.fun "test launch" marketed to the IN$DEX community was declined (0.198% graduation rate; contradicts the 98/2 doctrine). Detail in `launchpad-research-2026.md`.

### Status corrections to entries above

- **[[meteora]]** — the "conflicts with Session 63's Raydium CPMM decision, needs reconciliation" note on line 25 is now **RESOLVED**: Raydium CPMM, per the launchpad architecture finding above. The Two-Phase Meteora Alpha Vault → LaunchLab plan (Session 114) is superseded; the Alpha Vault UI card was reframed as "TGE Launch Mechanism — Under Review" (Session 121 x96).
- **[[austrac]]** — AAN 263945366 enrolment remains submitted; REG-22048 IND Remitter registration and UER-162931 enrolment-detail update both **SUBMITTED 17 Jul 2026** (Session 121 x49–x50). Registration now sits **under assessment**. Note the recorded commencement date (24 Feb 2027) predates the launch move to 24 Feb 2027 and may need updating with the regulator. As of 2026-07-29 AUSTRAC is no longer treated as the gating constraint on structure — Cook Islands only.
- **[[cook-islands]]** — registry account submitted and company name decided (2026-07-29, commit c50f2b9). Constraint of record: Parliament is dissolved, caretaker government, **election 12 Aug 2026** — this undercuts any "engage CAWG now" urgency framing. FSC review expected December.

### Fabricated entities — withdrawn, do not re-file

- **Swiss Verein** and **Wyoming DAO LLC** — recorded as fabricated 2026-07-22, but the correction reached only one file; still live in five as of 2026-07-29 including a `kyc-compliance.html` "View Charter & Registration" button for a charter that never existed. Now withdrawn explicitly and re-framed to Cook Islands only. **Neither entity exists. Never re-introduce.**

---

## Nightly pass 2026-07-30 — new entries

**Legal entity name decided:** the Cook Islands company will be **`Image Nation DEX Limited`** (AJ, 2026-07-29, recorded in `cook-islands-registration-prep.md`). The legal name and the brand are deliberately different — `IN$DEX` already stands for *Image Nation Decentralised Exchange*, so the legal name is the literal expansion and loses no meaning; the wordmark, logo, wave, star and `$` stay brand assets. Rejected: `Image Nation Decentralised Exchange Limited` (unwieldy on forms), `INDEX Limited` (generic, likely conflicts). **Correction of record:** the earlier claim that the registry will not accept `$` in a company name was *inferred, not verified* — BTIB states only that names must be in English. Settle with a name search, and search the variants (`Image Nation DEX`, `Image Nation`, `ImageNation`, `Index`), not just the exact string.

**Registered office is still open.** See [[uncle-mac]] — asked, not confirmed.

### Security research sources (not vendors, not partners)

- **[[slowmist]]** — source for the Solana `assign` owner-reassignment drain. The finding that killed PQSI v1.
- **[[swissborg]]** — the `setAuthority` case, 192,600 SOL (~$41M), attacker waited 8 days before draining. Basis for PQSI Addition 2 (re-classify at execution).
- **[[scam-sniffer]]** — 2025 drainer loss baseline ($83.85M, 106k victims, $790 average). Basis for PQSI Addition 7 (size risk to the citizen, not the dollar).

### Open vendor / counterparty decisions

- **[[reputation-feed-vendors]]** — Blockaid / GoPlus / TRM / Chainalysis shortlist. ⏳ **UNDECIDED, launch gate.** All commercial. `transaction-confirm.html` renders sanctions screening as a hardcoded pass, labelled `EXAMPLE` since 29 Jul.
- **[[vodafone-cook-islands]]** — ⏳ **no contact made.** Port-out lock conversation is the carrier half of SIM-swap mitigation; code alone cannot supply it. Decision #6 of the six only AJ can make.
- **[[squads]]** — note added: Squads v4 ships **time locks and spending limits natively** (audited by Neodyme and OtterSec). **Neither is configured.** Cheapest high-value security win currently available.

---

## Nightly pass 2026-08-05 (late) — new entries

### Cook Islands regulators, now filed separately

- **[[cook-islands-fsc]]** — Financial Supervisory Commission. Licenses remittance under the Money Changing & Remittance Businesses Act 2009 (local office, local staff, appointed auditor, mandatory face-to-face meeting in-country, guidance ~USD $100K capital). **No virtual-asset/VASP regime exists** — re-confirmed 5 Aug. What the jurisdiction has legislated on crypto is seizure, not authorisation: the Tainted Cryptocurrency Recovery Bill 2023 was **withdrawn** as unconstitutional; the Ransomware Suppression Bill 2025 is still **not tabled**. ⏳ Parliament dissolved, election 12 Aug 2026.
- **[[btib]]** — Business Trade and Investment Board. The foreign-investment gate: NZD $1M capital (Rarotonga) / $500K (outer islands), NZD $750 fee. **Probably does not apply to IN$DEX** — AJ's Cook Islands citizenship puts him on the NZD $75 domestic pathway. ⚠️ Not confirmed by a practitioner.

### Precedent, not a partner

- **[[pacific-group-ai]]** — Cook Islands AI company, founder [[tayla-jayne-beddoes]]. Built INA and Tumutoa, the Cook Islands Parliament's first AI agents (RNZ, Cook Islands News). **No relationship exists. Not a partner, not a vendor, no contact made.** Filed because it is the nearest peer precedent for how SIINDEX will be received in Rarotonga.

### Legal form arriving from a pasted document — the recurring failure

- **DUNA (Wyoming Decentralized Unincorporated Nonprofit Association)** — appeared in a pasted strategy document labelled "(From Production)" on 5 Aug 2026. It is a **US** entity, requires **100 members** (IN$DEX has zero citizens), and is strictly nonprofit. **Not adopted, and must not appear in any IN$DEX file, screen or document.** Same class as the fabricated Swiss Verein / Wyoming DAO LLC above: a legal structure entering canon from a document rather than from a decision. See [[legal-structure-options]].
