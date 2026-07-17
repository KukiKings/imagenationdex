# IN$DEX Financial and Institutional Survival — Reality Mapping
**Companion to:** `siindex-master-architecture-v1.md`, `siindex-v1-build-spec.md`, `siindex-assurance-layer-v1.md` (SIINDEX Layer 1, shipped this session)
**Status:** Reality-mapping pass — no schema created yet, no code written yet
**Date:** 17 Jul 2026

---

## What AJ asked for

AJ pasted a "correct placement inside the master architecture" doctrine establishing two permanent layers:

- **Layer 1 — SIINDEX Advanced Assurance and Sovereign Execution.** This is the doctrine already mapped and built this session (`siindex-assurance-layer-v1.md`, Phases A-D, all shipped and live-verified). Its question: *can every SIINDEX decision prove its identity, authority, origin, execution, evidence, and result?*
- **Layer 2 — IN$DEX Financial and Institutional Survival.** New this pass. Its question: *can IN$DEX offer, hold, transfer, lend, invest, settle, and protect value without endangering the citizen or the civilisation?*

The two connect through a 17-step enforcement pipeline, three items are proposed for elevation to constitutional status, and AJ specified a recommended 11-volume canonical document structure.

This document does for Layer 2 exactly what `siindex-assurance-layer-v1.md` did for Layer 1: map every piece to what's real today, what's genuinely buildable as honest infrastructure, and what requires facts or decisions only AJ (or a real lawyer/compliance advisor) can supply — before any schema gets written.

---

## The single fact that governs this entire layer

Before mapping individual sections, one real, load-bearing fact needs to be stated plainly, because it changes what "buildable" means for almost everything in Layer 2:

**IN$DEX is currently enrolled with AUSTRAC as a sole trader — Arthur Henry personally, ABN 95 579 343 955 — not as a separate company.** Confirmed directly from `compliance-readiness/README.md`: *"Enrolled entity (as declared 2026-07-14): Arthur Henry (sole trader) · ABN 95 579 343 955 · t/a Image Nation Decentralised Exchange."* The enrolment itself is done (AUSTRAC Account Number 263945366 issued, both VASP and RSP categories declared), but registration is still pending, and — critically — **legal review of the AML/CTF Program documents has not happened yet** ("need legal review before submission" is the folder's own status line, and the "Legal review completed by: ______" line is still blank).

This matters because Layer 2's own language assumes structure that doesn't exist yet:

- *"Citizen Assets Are Constitutionally Separate... never assets of IN$DEX, SIINDEX, the founder, an investor, a provider, or an operating company"* — as a sole trader, there is today **no legal separation between AJ personally and the business**. A sole trader's assets and liabilities are the same assets and liabilities as the individual's. This isn't a smart-contract or database problem; it's a company-structuring and insolvency-law fact.
- *"legal entity separation," "custody classification," "insolvency remoteness," "Licence and Authorisation Registry," "Product Legal Passport"* all presuppose a real corporate entity, and in most cases a real financial-services or remittance licence, neither of which exist yet beyond the AUSTRAC enrolment in progress.
- *"independent audit," "legal privilege"* require a real engaged audit firm and a real retained lawyer — neither exists in any project file checked (`company-context.md`, `master-plan-v12.5.md`, `austrac-vasp-enrollment.md`, `compliance-readiness/*`).

None of this is a reason to abandon Layer 2 — the doctrine is right that these are real existential risks IN$DEX will eventually face. But building a "Licence and Authorisation Registry" table or a "Legal Entity Separation" service today, seeded as if real licences or a real Pty Ltd already exist, would be fabricating regulatory status — a category of dishonesty this whole session has been built around refusing to do, and here the stakes (AUSTRAC penalties up to AUD $22.2M per contravention, per `austrac-vasp-enrollment.md`) are categorically higher than a wrong balance on a screen.

**Also worth surfacing prominently, separately from the architecture question: the AUSTRAC registration deadline (29 Jul 2026) is 12 days away from today. Legal review of the AML/CTF Program is still not booked. This is a real, live, time-boxed compliance action item sitting alongside this doctrine request, not a hypothetical.**

---

## Section-by-Section Reality Ledger — Layer 2

| Doctrine Item | Status | Notes |
|---|---|---|
| **Financial Product Boundary Engine** | Buildable now, honestly scoped | Can be built as a real internal classification table tagging each IN$DEX product/screen (DEX swap, staking, lending, remittance, INDX purchase) with a risk category and a plain-language boundary note — e.g. "this is a preview, not a financial product yet" for the many screens already disclosed that way this session. This is **internal risk labeling**, not a legal determination of regulated-activity status — that determination needs a lawyer. |
| **Legal entity separation** | Not built — blocked on a real business decision | Cannot be built in software. Needs AJ to actually incorporate a separate legal entity (a Pty Ltd is what `austrac-vasp-enrollment.md` itself already anticipates — it asks for "Company full legal name (Pty Ltd)" and an ACN that don't exist yet under the sole-trader enrolment). |
| **Regulated activity routing** | Partial → buildable as a routing *table*, not a compliance guarantee | A `regulated_activity_classification` table tagging which IN$DEX actions AJ's compliance advisor eventually determines are regulated is real and useful — but until that legal determination happens, every row would have to honestly say "classification pending legal review," not a real determination. |
| **Advice boundaries** | Buildable now as a real content rule | SIINDEX already has a voice/behavior canon (never gives confident financial advice per CLAUDE.md's own "legal_and_financial_advice" instruction). Formalizing "SIINDEX explains and compares; a licensed human/entity advises" as an explicit rule in `siindex-voice-corpus.md`/security-canon.md is real and buildable today. |
| **Custody classification** | Not built — depends on the entity question above | Whether the Grid Account constitutes "custody" under Australian financial services law is a legal question, not a code question. The Grid Account's real technical fact (2-of-3 MPC, SIINDEX alone cannot move funds) is a genuinely strong *input* to that legal analysis — worth handing to a lawyer, not something I can classify myself. |
| **Rewards separation** | Buildable now | Real and simple: the 98/2 Civilisation Fund split, staking rewards, and referral wisdom bonuses are already structurally separate ledger entries (`transactions`, `staking_positions`, `citizens.wisdom_score`) — can be documented as such, no new code needed. |
| **AML/CTF** | Partial → real drafts already exist | `compliance-readiness/01-04` are real drafted AML/CTF Program documents, explicitly marked as drafts needing legal review. Not roadmap — already substantially done as documentation; the honest gap is legal sign-off, not content. |
| **Lending / Liquidity** | Real (technical) / Not built (regulatory) | `sovereign-lending.html`'s deposit/withdraw/borrow/repay RPCs are real and live-verified (this session, x44). Whether operating a lending pool requires an Australian credit licence is a separate legal question, unaddressed. |
| **Insolvency remoteness** | Not built — legal/structural, not technical | Requires real trust structuring or statutory segregation (e.g., client money trust account equivalents), which requires a lawyer and likely a real bank/custodian relationship. Cannot be simulated honestly in Supabase alone. |
| **Treasury boundaries** | Partial → buildable | A `treasury_ledger` distinguishing citizen-owned funds from any IN$DEX/founder-owned funds is a real, useful database separation to build now, and directly supports (without replacing) the eventual legal insolvency-remoteness work. |
| **Proof of solvency** | Not built → partial buildable | A real, queryable "sum of citizen balances vs sum of platform-controlled reserve" reconciliation report is honestly buildable today (similar shape to `reserve-transparency.html`, which already exists) — but it is a solvency *indicator*, not a legal "proof of solvency" attestation, which needs an auditor. |
| **Stable-value assets** | Not applicable yet | INDX is not currently pegged/stable per whitepaper canon ($0.24 fixed reference price, not a stablecoin mechanism) — no stable-value asset work is in scope until that changes. |
| **Token governance** | Real | MemeDAO governance tables (`pillar-amendment.html`, `cast_governance_vote`) already real and live-verified this session. |
| **Market integrity** | Partial → buildable | Wash-trading/self-dealing detection on the DEX is realistic to add as a monitoring query once real swap volume exists; currently `dex-swap.html` is explicitly preview-only (no real Raydium LP yet per `launch-runway-plan-2026.md`), so there is no real market to protect yet. |
| **Smart contracts** | Roadmap | No Solana program has been deployed (Phase 5, unstarted per CLAUDE.md's Current Build Phase). Contract-level safeguards are premature until a contract exists. |
| **Chain and oracle failure** | Roadmap | Same reason — no live on-chain dependency exists yet to fail. |
| **Tax** | Partial → buildable | `real_tax_summary_export` RPC already exists (built earlier this session's broader work) — a `tax_event_ledger` capturing real transaction-level data for a citizen's own records is buildable and useful. This is record-keeping, explicitly not tax advice. |
| **Death and incapacity** | Not built → buildable as a real process, pending legal input | The Grid Account's 2-of-3 MPC already gives a technical path (a nominated guardian could be one of the 3 keys), but the legal recognition of a nominee/estate claim needs real legal design, not just a database flag. |
| **Complaints** | Buildable now | A real `complaints` table + deadline tracking is straightforward, matches the existing `disputes`/`dispute_events` pattern already built (SIINDEX v1, x39) and can be extended to non-marketplace complaints generally. |
| **Compensation** | Not built — depends on a real fund existing | `insurance-fund.html`'s backend is real for staking/tracking (SIINDEX v1) but explicitly, honestly disclosed as having no real claims-payout mechanism (Phase C `safety_cases` entry, this session) — the same honesty applies here. |
| **Insurance** | Same as above | No underwritten insurance product exists; `insurance-fund.html` is a citizen-funded pool, not a licensed insurance product. |
| **Wind-down** | Not built → documentable now | A real, written wind-down plan (what happens to citizen data/funds/domains if IN$DEX ceases operating) is a governance document, not code — buildable as a doc today, directly serving the "Civilisation Continuity Outranks Product Continuity" principle below. |
| **Ecosystem neutrality** | Buildable as a policy statement | Real and cheap: a documented commitment that IN$DEX doesn't structurally favor its own token/products over citizen interests — enforceable in spirit via existing constitutional invariant triggers (Phase B, this session) once specific rules are named. |
| **Independent audit** | Not built — needs a real engaged auditor | Cannot be fabricated. A `component_registry`/`policy_changes`-style audit trail (already built, Phase C) is real preparation *for* an eventual audit, not the audit itself. |
| **Legal privilege** | Not applicable without a retained lawyer | No real legal counsel relationship is on file. |

---

## The 17-step unified enforcement pipeline — reality check

AJ's proposed sequence (Citizen Intent Ledger → Objective Contract → Jurisdiction and Location Engine → Financial Product Boundary Engine → Product Legal Passport → Licence and Authorisation Registry → Advice Boundary Classifier → Citizen Vulnerability and Suitability Check → Conflict-of-Interest Engine → Pre-Action Authorisation Gateway → Citizen Comprehension Proof → Licensed execution → Independent settlement verification → Financial Services Receipt → Tax Event Ledger → Trace and forensic record → Complaints/recovery/exit pathway) is architecturally sound and maps cleanly onto what already exists plus what's genuinely addable:

- **Steps 1, 10, 16** (Citizen Intent Ledger, Pre-Action Authorisation Gateway, Trace and forensic record) are **already real** — `citizen_intents`, `siindex-gate`, `get_trace_export`/`replay_intent` (this session, Layer 1).
- **Steps 3, 8, 9, 11, 13, 15, 17** (Jurisdiction Engine, Vulnerability/Suitability Check, Conflict-of-Interest Engine, Comprehension Proof, Settlement verification, Tax Event Ledger, Complaints pathway) are **genuinely buildable now** as deterministic tables/RPCs, none of which require pretending a licence or entity exists — they're citizen-protection and record-keeping mechanisms that stand on their own merit.
- **Steps 2, 4, 5, 6, 7, 12, 14** (Objective Contract, Financial Product Boundary Engine, Product Legal Passport, Licence and Authorisation Registry, Advice Boundary Classifier, Licensed execution, Financial Services Receipt) **all bottleneck on the same real-world fact above** — they either require a real licence/entity to reference, or their honest content today is "not yet classified / not yet licensed," which is fine to build *as long as every row says that plainly* rather than implying a real licence exists.

---

## The "architectural correction" — deterministic services, not agents

This is directly actionable and consistent with what Phase B of the Assurance Layer already did (Postgres CHECK constraints/triggers, not "agents," enforcing constitutional invariants). AJ's list of things that should be deterministic services rather than SIINDEX agents — licence verification, policy enforcement, ledger segregation, treasury limits, custody reconciliation, transaction limits, tax-event capture, threshold signatures, product freezes, sanctions checks, complaint deadlines, smart-contract release gates, provider-authorisation checks, asset-to-liability reconciliation — matches exactly how `agent_registry` should be read going forward: most of these are not "agents" needing an identity row at all, they're plain Postgres functions/triggers, same category as the constitutional-invariant triggers already shipped.

One honest gap worth naming: `agent_registry` doesn't currently distinguish "SIINDEX reasoning agent" from "deterministic enforcement service" — everything registered so far (all 30 rows) actually already has `model_version = 'n/a — deterministic SQL function, not model-backed'` (Phase A, this session), so the substance of this correction is already true. Making the distinction more visible (e.g., a `service_kind` column) would be a small, honest, buildable follow-up.

---

## The three proposed constitutional additions

AJ proposes elevating three items to constitutional status. These are governance/canon decisions, not database changes, and per CLAUDE.md's own standing rule ("ASK FIRST: Any change to CLAUDE.md or security-canon.md"), I have not applied any of these — they need AJ's explicit sign-off. Proposed wording, ready to add as Law 8-10 in `security-canon.md` if approved:

```
LAW 8 — CITIZEN ASSETS ARE CONSTITUTIONALLY SEPARATE
  Citizen assets are never assets of IN$DEX, SIINDEX, the founder, an investor,
  a provider, or an operating company. Every product, ledger, smart contract,
  custody arrangement, and legal entity must preserve this rule.
  [Honest caveat to log alongside this law, not hide: as of 17 Jul 2026, IN$DEX
  operates as a sole trader with no real legal separation between the founder
  and the business. This law is the target state the entity structure must be
  built to meet, not a description of current legal reality.]

LAW 9 — REGULATED POWER REQUIRES LICENSED AUTHORITY
  SIINDEX may explain, classify, compare, prepare, and orchestrate. Regulated
  advice or execution occurs only through an authorised entity or professional.
  SIINDEX never silently crosses from intelligence into unlicensed financial
  conduct.

LAW 10 — CIVILISATION CONTINUITY OUTRANKS PRODUCT CONTINUITY
  A financial product may close. A provider may fail. A licence may be
  suspended. A blockchain may collapse. The citizen's Grid Account, Sovereign
  Life Domain, identity, credentials, evidence, complaints, recovery,
  portability, and exit rights must survive.
```

---

## Recommended canonical structure — mapped to what exists

| # | Volume | Current status |
|---|---|---|
| 1 | IN$DEX Civilisation Constitution | Not a standalone doc — content scattered across whitepaper Appendix A, CLAUDE.md, `siindex-master-architecture-v1.md`. Worth consolidating, not urgent. |
| 2 | Citizen Bill of Rights | Same as above — referenced inside `siindex-master-architecture-v1.md`, not extracted as its own volume yet. |
| 3 | SIINDEX Identity and Constitutional Architecture | Substantially covered by `siindex-master-architecture-v1.md` + Phase A of the Assurance Layer (`agent_registry` identity fields). |
| 4 | SIINDEX Execution Harness | `siindex-v1-build-spec.md` (Orchestrator, Edge Functions) — real, shipped. |
| 5 | SIINDEX Advanced Assurance and Sovereign Execution Layer | `siindex-assurance-layer-v1.md` — real, shipped, all 4 phases, this session. |
| 6 | IN$DEX Regulation-Native Financial Architecture | New — this document covers the reality-mapping half; the 17-step pipeline needs its own build spec once AJ scopes it (see question below). |
| 7 | IN$DEX Financial and Institutional Survival Doctrine | This document. |
| 8 | IN$DEX Connectivity and Sovereign Access Architecture | `sovereign-access-network-v1.md` — real, Phase 0 shipped. |
| 9 | IN$DEX Identity, Credentials, and Sovereign Life Domains | `sovereign-domain-credential-layer-v1.md`, `sovereign-life-domain-use-cases-v1.md` — real, Phase 1 shipped. |
| 10 | IN$DEX Economic Participation and Opportunity Architecture | Not yet formalized as a doc — `opportunity-finder.html`/`opportunity-feed.html` exist as screens with no governing architecture document behind them. |
| 11 | IN$DEX Continuity, Resolution, and Open Exit Architecture | Partially covered by the Assurance Layer's honest "Open Exit — roadmap" entry; no dedicated volume yet. Directly related to proposed Law 10 above. |

---

## What I need from AJ before building anything from this doctrine

Unlike the Assurance Layer (pure internal engineering, safe to build autonomously once scoped), Layer 2 touches real regulatory and legal representations with real penalties attached. I'm not proceeding to write schema until this is scoped, because guessing wrong here isn't a bug to fix later — it's a false compliance claim.

---

## Decision (17 Jul 2026) and what was built

AJ chose: build the honest subset only (no fabricated licence/entity/custody claims), and approved adding the 3 proposed items as Laws 8-10 in `security-canon.md` (with Law 8's sole-trader caveat kept intact and un-removable without AJ's explicit future sign-off).

**Shipped, live-verified:**
- `financial_product_classification` — 8 real IN$DEX products tagged with an internal risk category and a plain boundary note. `regulated_status` defaults to `'pending_legal_review'` on every row and is a plain column, not RPC-writable — no automated process can ever claim a legal determination that hasn't actually happened.
- `citizens.jurisdiction_country` — self-reported, defaults null, explicitly commented as not a legal residency/tax determination.
- `treasury_ledger` + `get_solvency_indicator()` — real segregation of citizen-liability funds vs civilisation fund vs platform operating funds; the solvency RPC sums real balances and returns an explicit disclaimer that it is an indicator, not an audited proof.
- `tax_event_ledger` + `record_tax_event()` + `get_citizen_tax_summary()` — real record-keeping, explicit "not tax advice" disclaimer on every summary returned.
- `complaints` + `complaint_events` + `file_complaint()`/`resolve_complaint()` — real complaint lifecycle, 5-day internal target response time labeled as an internal service target, not a regulatory guarantee.
- Laws 8-10 added to `security-canon.md`, doc header/footer updated from "Seven" to "Ten" Security Laws throughout.

**Explicitly not built (still correctly blocked on real facts, not on effort):** Legal entity separation, custody classification, insolvency remoteness, Licence and Authorisation Registry, Product Legal Passport, independent audit, legal privilege, smart-contract/oracle safeguards (no contract deployed yet), stable-value asset work (not applicable). These stay flagged, not faked.

**Not yet wired (a real, honest gap, not hidden):** `record_tax_event()` exists and works but is not yet called automatically by `transfer_indx`, `credit_stripe_purchase`, `claim_staking_rewards`, or other real money-movement RPCs — a citizen's tax summary will show nothing until that integration is done as a follow-up pass.

**Advice Boundary Classifier (Law 9 in practice):** SIINDEX's existing behavior rule already applies here — CLAUDE.md's `legal_and_financial_advice` instruction (never give confident financial/legal recommendations, always caveat that Claude/SIINDEX is not a licensed advisor) *is* the Advice Boundary Classifier in its current, honest form. No new code needed; Law 9 formalizes the existing behavior as constitutional rather than just a style guideline.

**Ecosystem neutrality (documented, not code):** IN$DEX's real structural commitments today: the 98/2 Civilisation Law applies uniformly regardless of which product a citizen uses; no product screen currently ranks or hides options based on which generates more revenue for the platform; the Financial Product Boundary table above is public/console-readable, not hidden. This is a real, checkable starting position, not a compliance guarantee — worth revisiting once real products (lending, remittance) go live with real volume.

**Wind-down (documented, not code):** if IN$DEX ceased operating tomorrow, today's real technical facts are: citizen identity lives in `citizens`/`web3_domain` (portable, not locked to any one screen), the Grid Account's 2-of-3 MPC means SIINDEX alone was never the only path to funds, and `get_citizen_verification_bundle()` (Assurance Layer Phase D) already gives any citizen a real exportable record of their own consent history, credentials, and transactions. What's genuinely missing for a real wind-down plan: a written, AJ-approved procedure for how citizen INDX balances would be settled or migrated, and who (a real appointed person, not SIINDEX) would execute it. This is a real governance document to write with AJ directly, not something to fabricate here.
