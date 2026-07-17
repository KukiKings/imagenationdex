# SIINDEX Advanced Assurance and Sovereign Execution Layer — Reality Mapping
**Companion to:** `siindex-master-architecture-v1.md` (doctrine + Reality Ledger), `siindex-v1-build-spec.md` (what's already real)
**Status:** Reality-mapping pass complete — no new schema created yet, no code written yet
**Date:** 16 Jul 2026

---

## Purpose of this document

AJ pasted the full "Advanced Assurance and Sovereign Execution Layer" doctrine — 24 sections covering agent identity, delegation, pre-action enforcement, policy-as-code, threshold authority, confidential execution, supply-chain integrity, agent bill of materials, quantum-safe continuity, knowledge provenance, truth maintenance, trace interoperability, forensic replay, safety cases, constitutional invariants, blast-radius control, memory promotion, authenticity, trusted time, citizen verification, incident command, independent witnesses, standards/interoperability, and open exit.

This is a genuinely serious, well-constructed doctrine. It is also, section by section, a mix of things IN$DEX's real stack (Supabase Postgres + Edge Functions + static HTML, no standing daemon, no TEEs, no second model provider, no real multi-party cryptographic key infrastructure) can honestly deliver **now**, and things that require infrastructure that does not exist yet (quantum computing, confidential/attested compute, real asymmetric agent identity keys, independent external auditors, a standards/protocol gateway spanning telecom/banking/government).

Per this session's whole standing discipline: nothing below gets marked "Real" unless it is live, callable, and has been (or will be) checked with an actual SQL/RPC call — not a code read. Below is the section-by-section Reality Ledger, followed by a concrete, scoped v1 build proposal for the parts that are honestly buildable right now.

---

## Section-by-Section Reality Ledger

| Doctrine Section | Status | Notes |
|---|---|---|
| **Agent Identity** | Partial → buildable | `agent_registry` (built this session) already has agent_name, purpose, domain, permitted_tools, risk_class, status. Missing: owner, constitutional_authority, prohibited_actions, model_version, software_version, execution_environment, start/expiry/revocation, verification key. All addable as new columns. A real **HMAC-signed verification key** is honestly buildable (symmetric, server-side signing via a service-role secret — already used for `agent_messages` this session); a real asymmetric PKI / W3C-style verifiable-credential agent identity is **not** — that's genuine roadmap. |
| **Delegation** | Not built → buildable | No `delegations` table exists. The full authority-chain shape (purpose/scope/data limit/financial limit/time limit/jurisdiction/approval/expiry/revocation/signature) is a straightforward additive table, and narrowing-only delegation is enforceable as a real CHECK/trigger against the parent grant. |
| **Pre-Action Enforcement** | **Real v1, partial** | This is substantially already built: `siindex-gate` is exactly a deterministic pre-action authorization gateway, checked before any Level 2+ action executes, with a real kill switch. Not yet checked: jurisdiction, reversibility flag, provider authority. These are addable checks to the existing function, not a new system. |
| **Policy as Code** | Not built → buildable | Supabase migrations are already versioned (via `list_migrations`) but not modeled as *policy*. A `policy_changes` log table (version/tested/reviewed/authorised/signed/receipted/reversible) is a real, lightweight, buildable governance record. |
| **Threshold Authority** | Not built → partially buildable | No real cryptographic multi-sig for civilisation-level root/treasury/shutdown keys exists (the Grid Account's 2-of-3 MPC is a *citizen wallet* feature, not this). What **is** honestly buildable: an application-level N-of-M approval requirement enforced in Postgres (a `threshold_approvals` table requiring named distinct human approvers before specific top-tier actions) — same pattern as `council_reviews`' "zero dissent" rule, extended to require a minimum count of independent named approvers. This must be labeled honestly as **database-enforced multi-party approval**, not cryptographic key-splitting. |
| **Confidential Execution** | Not built — roadmap | No TEE/attested compute exists anywhere in this stack. Not fakeable; stays roadmap. |
| **Supply-Chain Integrity** | Partial → buildable | Git already gives every deployed change a real commit hash, author, and diff (this whole session's commit history *is* a provenance record). A `component_registry` table formalizing source/version/builder/git-commit/approver per deployed Edge Function or migration is real and buildable — it's making the existing git provenance queryable, not inventing new trust. |
| **Agent Bill of Materials** | Buildable, cheap | `agent_registry` + `citizen_intents` + `council_reviews` + `agent_messages` already jointly contain everything needed to answer "what participated in this decision." A `get_agent_bom(intent_id)` RPC joining these is real, buildable, and answers the doctrine's own test question honestly from data that already exists. |
| **Quantum-Safe Continuity** | Not built → partial record-keeping buildable | No real post-quantum cryptography exists or is realistic to add to this stack today. What's honest and buildable: a `crypto_inventory` table recording what crypto is actually in use where (HMAC-SHA256 for agent signing, bcrypt/argon2 for auth if used, TLS via Supabase, Solana's existing signature scheme for the Grid Account) with a `pq_status` column truthfully marked "classical" — a real inventory, explicitly not a PQC migration (that stays roadmap). |
| **Knowledge Provenance** | Partial → buildable | `memory_items` already has source/purpose. Extending with creator/issuer/evidence/transformation/contradiction/supersession fields is additive. |
| **Truth Maintenance** | Not built → partial | Monitoring evidence for expiry/revocation/dispute and cascading to affected decisions is real but non-trivial. A v1 version (flag `citizen_intents` referencing since-revoked `memory_items`/`security_events`) is buildable; full cascade detection across all evidence types is a larger future project. |
| **Trace Interoperability** | Partial → buildable | `agent_messages`/`citizen_intents`/`security_events` are already structured, queryable logs. A `get_trace_export(intent_id)` RPC returning an open JSON structure (not a proprietary format) is a real, cheap addition. |
| **Forensic Replay** | Partial → buildable | State/authority/policies/agents/inputs/decisions for anything routed through the Orchestrator are already captured across `citizen_intents`/`agent_messages`/`approval_gates`/`council_reviews`. A `replay_intent(intent_id)` RPC reconstructing the full timeline from these tables is real. What it can't replay: external provider responses not logged verbatim, or anything that happened before Orchestrator adoption (most current screens don't call it yet — see Reality Ledger in the master doc). |
| **Safety Cases** | Not built → buildable as governance record | This is fundamentally a documentation/review artifact, not code. A `safety_cases` table (domain/intended_use/excluded_use/hazards/controls/residual_risk/approval) per high-impact domain (Payment, Governance, Dispute, Insurance Fund) is real and buildable — it's a structured place to put a real judgment call, not an automated system. |
| **Constitutional Invariants** | Not built → partially buildable | Several of the doctrine's own examples map onto tables that already exist and can be enforced as real Postgres CHECK constraints/triggers today: "an agent cannot approve its own authority expansion" (enforceable against `council_reviews`/`approval_gates`), "a high-risk payment cannot bypass approval" (already true — `siindex-gate` enforces this). Others reference features that don't exist yet (child profiles, telecom suspension affecting Grid Account, marketplace dispute blocking essential access) — those invariants can be written down now and enforced later, when the underlying feature exists. Enforcing an invariant on a table that doesn't exist would be fake; documenting it as a pending invariant is honest. |
| **Blast-Radius Control** | Not built → buildable | `agent_registry` doesn't yet have per-agent limits (citizens affected, money moved, records changed, time window). Adding these columns and checking them in `siindex-gate` is real and directly closes a gap the doctrine calls out. |
| **Memory Promotion** | Partial → buildable | `memory_items.class` exists but doesn't yet model the staged pipeline (untrusted → session → candidate → verified → citizen-approved → institutional → precedent). Adding a `promotion_stage` column and a `promote_memory_item()` RPC that checks authority/purpose/evidence/retention before advancing stage is real and buildable. |
| **Authenticity** | Not built — mostly roadmap | Multi-signal authenticity (signed publication, trusted timestamp authority, live challenge-response, public verification service) needs infrastructure IN$DEX doesn't have. A modest honest first step: an `official_content_ledger` table hashing + timestamping official SIINDEX publications using Postgres's own trusted clock — real, but far short of the full doctrine; the rest stays roadmap. |
| **Trusted Time** | **Substantially already true** | Every real RPC built this session uses `now()` (server-side Postgres time), not client-supplied timestamps — this is already the de facto pattern, worth stating honestly rather than building new infrastructure for it. |
| **Citizen Verification Kit** | Partial → buildable | `consent_receipts` + `get_consent_receipts`/`get_consent_receipt_count` RPCs already exist (built earlier this session). A `get_citizen_verification_bundle(citizen_id)` RPC aggregating consent receipts, wisdom score, credentials, and transaction history into one exportable JSON is real, buildable, and directly serves the doctrine's own definition of the kit. A fully separate "runtime outside the main SIINDEX interface" is roadmap. |
| **Incident Command** | Not built → buildable as governance record | No formal role-assignment system exists for a T3/T4 halt. An `incident_command_roles` reference table + tying named human roles to an active `security_events` T3/T4 row is a real, lightweight addition — a governance record, not automation replacing AJ's judgment. |
| **Independent Witnesses** | Not built — roadmap | No external auditors, trustees, or public transparency services are onboarded. Cannot be built honestly today; stays roadmap until real third parties exist. |
| **Standards and Interoperability** | Partial — mostly roadmap | The Sovereign Access Network work (connectivity_providers, Provider Adapter contract, built earlier this session) is a real first step in this direction for telecom specifically. The full protocol gateway spanning payments/blockchains/education/government/identity/audit does not exist. |
| **Open Exit** | Not built — roadmap | No minimal standalone runtime exists outside the main app. This is a legitimate, valuable future commitment (matches the project's own portability/non-lock-in values) but nothing here is buildable today without dedicated infrastructure work. |

---

## What this means, honestly

Of 24 sections: **1 is already substantially real** (Trusted Time), **1 is real but needs 3 more checks added** (Pre-Action Enforcement), **16 have a genuinely buildable v1** using nothing but more Postgres tables/columns/RPCs on the existing stack, and **6 are honest roadmap** (Confidential Execution, real Quantum-Safe crypto, real cryptographic Agent Identity via asymmetric PKI, Independent Witnesses, full Standards/Interoperability gateway, Open Exit runtime) that would require infrastructure (TEEs, external auditors, a standards gateway, a separate minimal runtime) this pass cannot honestly claim to deliver.

The buildable 16 is still a lot of scope. See the phased proposal below.

---

## Proposed Build — Assurance Layer v1 (buildable subset only)

**Phase A — Identity, Delegation, Blast-Radius (extends `agent_registry`)**
- Extend `agent_registry`: owner, constitutional_authority, prohibited_actions (jsonb), model_version, software_version, execution_environment, start_date, expiry, revocation_status, verification_key (HMAC).
- New `delegations` table: full authority-chain shape, narrowing-only enforced via trigger.
- Extend `agent_registry` with blast-radius limits (max_citizens_affected, max_money_indx, max_records_changed, time_window) and check them in `siindex-gate`.

**Phase B — Policy, Threshold Authority, Constitutional Invariants**
- `policy_changes` log table.
- `threshold_approvals` table (N-of-M named-approver enforcement for top-tier actions — kill switch permanence changes, agent_registry risk_class elevation, etc.)
- A handful of real CHECK constraints/triggers for invariants that map onto tables that exist today (self-approval prevention, high-risk-bypass prevention — largely already true, formalize as an explicit constraint).

**Phase C — Provenance, BOM, Trace, Replay, Crypto Inventory, Safety Cases**
- `component_registry` (git-commit-anchored provenance for deployed Edge Functions/migrations).
- `get_agent_bom(intent_id)`, `get_trace_export(intent_id)`, `replay_intent(intent_id)` RPCs over existing Orchestrator tables.
- `crypto_inventory` table (honest classical-crypto record, pq_status truthfully "classical").
- `safety_cases` table, filled out for Payment/Governance/Dispute/Insurance Fund (the four highest-exposure real domains).

**Phase D — Memory Promotion, Truth Maintenance, Citizen Verification Kit, Incident Command**
- `memory_items.promotion_stage` + `promote_memory_item()` RPC.
- v1 truth-maintenance check (flag intents referencing revoked evidence).
- `get_citizen_verification_bundle(citizen_id)` RPC.
- `incident_command_roles` table wired to `security_events` T3/T4 rows.

**Explicitly not in this build — stays disclosed roadmap:**
Confidential Execution / TEEs, real post-quantum cryptography, real asymmetric agent-identity PKI, Independent Witnesses, full Standards/Interoperability protocol gateway, Open Exit standalone runtime, and full multi-signal Authenticity infrastructure (a minimal content-hash ledger is in Phase C-adjacent scope if AJ wants it added).

---

## What I need from AJ before touching schema

This adds roughly 8-10 new tables/columns beyond what SIINDEX v1 already built, all additive and RLS-enabled from creation, same pattern as every table this session. Per the standing "new Supabase table → ask first" rule, I need a scope decision before creating anything: build all four phases now, a subset, or review this document first without building yet.
