# SIINDEX v1 Build Spec — Making the Architecture Real
**Companion to:** `siindex-master-architecture-v1.md` (doctrine + Reality Ledger)
**Status:** Draft for AJ review — no schema created yet, no code written yet
**Date:** 16 Jul 2026

---

## What "complete and live" can honestly mean right now

AJ asked to complete SIINDEX, live, with every crucial addition. Before writing a line of code, here's the honest boundary of what "live" can mean inside IN$DEX's actual stack today (Supabase Postgres + Supabase Edge Functions + static HTML screens, no separate always-on server, no multi-provider model gateway, one builder — me — not a fleet of independent agents):

**Genuinely buildable as real, live infrastructure this pass:**
- A real Orchestrator, implemented as Supabase tables + Edge Functions, that gives every citizen action a single source-of-truth state record, walks it through real approval gates, and won't let a Risk Level 3+ action execute without a real recorded approval.
- A real Agent Registry — every one of IN$DEX's actual specialist functions (transfer_indx, withdraw_indx, award_wisdom, create_instant_invite, etc.) registered with an ID, scope, permitted actions, and risk class, exactly as the Specialist Agent Standard requires.
- A real Memory classification layer — a `memory_items` table with the owner/source/purpose/permission/retention/export fields the doctrine requires, replacing ad hoc sessionStorage for new writes.
- A real Evidence log separating claim/inference/verified fact/action/result, extending the existing `security_events`/`consent_receipts` pattern that already works.
- A real Kill Switch — a single row AJ can flip that every Edge Function checks before running a Level 3+ action. This is a real, working "Sovereign Pause," not a UI mockup.
- Real backends for the two "Not built" domains with the most citizen exposure: Dispute and Insurance Fund (both currently honest-preview-only per the Reality Ledger).
- A `council_reviews` table implementing the Approval Architecture's higher tiers as a real, filled-out record — not as ten separate autonomous AI agents (that infrastructure doesn't exist), but as a real structured sign-off log I fill out from each Council role's lens before anything Level 4+ ships, which AJ can audit.

**Not buildable as "live" this pass — staying flagged as roadmap, not faked:**
- A continuously-running, always-on autonomous orchestrator process making independent decisions with no human in the loop. Supabase Edge Functions are real and callable, but they're request-triggered, not a standing daemon — true autonomy would need a hosted agent runtime IN$DEX hasn't stood up yet.
- A real multi-provider Model Gateway (routing across multiple model vendors). No second model provider is wired in today.
- Ten independently-reasoning Council agents. What's buildable is the real record-keeping structure; the actual multi-perspective reasoning is done by me, as the one active builder, applying each role's checklist — labeled honestly as such.
- Real biometric/ZK identity verification, real FATF Travel Rule ZK-proofs, real TEE-backed agent wallets. These need external providers/SDKs not yet integrated — unchanged from the existing Reality Ledger status.

Everything below is scoped to the first list. Nothing here will claim the second list is done.

---

## Phase 1 — Foundation schema (new tables, additive only, no existing table touched)

1. **`agent_registry`** — id, agent_name, purpose, domain, permitted_tools (jsonb), permitted_memory_classes (jsonb), risk_class, status (active/retired), registered_at. Seeded with every real RPC IN$DEX currently exposes (transfer_indx, withdraw_indx, award_wisdom, create_instant_invite, fulfill_instant_invite, complete_referral, claim_staking_rewards, get_public_domain_view, etc.) as registered "agents" in the Specialist Agent Standard sense.
2. **`agent_messages`** — id, agent_id (fk), task_id, inputs (jsonb), evidence_used (jsonb), action_requested, confidence, risk_level, output (jsonb), created_at. Every Edge Function call in Phase 2+ writes one row here — this is the "signed inter-agent message" ledger, HMAC-signed with a service-role secret (real signature, not decorative).
3. **`citizen_intents`** — id, citizen_id, raw_intent (text), domain, risk_level (0-5), status (received/classified/prepared/approved/executing/verified/complete/halted), created_at, updated_at. The single source-of-truth state object Part II §1 calls for — every domain read/writes this row instead of holding its own copy.
4. **`approval_gates`** — id, intent_id (fk), level (matches the 9 Approval Architecture levels), required, granted_by, granted_at, method. Enforced in Edge Functions: no Level 3+ intent transitions to "executing" without a matching granted row.
5. **`memory_items`** — id, owner_citizen_id, class (session/citizen_approved/operational/evidence/institutional/cultural/civilisation/prohibited), source, purpose, permission_granted (bool), sensitivity, retention_until, correctable (bool), exportable (bool), created_at.
6. **`council_reviews`** — id, intent_id (fk), role (architect/evidence_officer/citizen_advocate/sovereignty_guardian/legal_boundary/risk_officer/cultural_authority/accessibility/adversarial_challenger/verification_officer), verdict (agree/dissent/flag), notes, reviewed_at. Required filled for any Level 4+ intent before execution.
7. **`siindex_kill_switch`** — single-row table: id, engaged (bool), engaged_by, engaged_at, reason. Every Edge Function's first check: if engaged=true, refuse all Level 2+ actions and return a halt message.

All seven are new, additive, RLS-enabled from creation (same pattern as every existing table), and touch nothing already live. This is the step that needs your one go-ahead per the standing "new Supabase table" rule.

## Phase 2 — Orchestrator Edge Functions (real, callable, deployed)

- `siindex-classify` — takes a raw citizen intent + domain, writes a `citizen_intents` row, assigns risk_level using explicit rules (not vibes): mirrors existing domain risk (payments >$500 = Level 3, governance/Law changes = Level 5, preview/read-only = Level 0-1, etc.)
- `siindex-gate` — checks `approval_gates` before allowing status to move to "executing"; checks `siindex_kill_switch` first, always.
- `siindex-verify` — the Evidence and Verification Plane's real enforcement point: takes an agent's `agent_messages` output and requires an independent check (a second RPC call, a DB constraint check, or a Council review row for Level 4+) before marking `citizen_intents.status = 'verified'`.

## Phase 3 — Domain backends (close the two highest-exposure Reality Ledger gaps)

- **Dispute**: `disputes` table (id, buyer_id, seller_id, listing_id, status, evidence jsonb, opened_at, resolved_at) + `dispute_events` table + RPCs (open_dispute, add_dispute_evidence, resolve_dispute). Wires dispute.html from honest-preview back to real, this time for real.
- **Insurance Fund**: `insurance_pool` (total_staked, apy_rate) + `insurance_stakes` (citizen_id, amount, staked_at) + RPCs (stake_to_pool, unstake_from_pool, get_pool_stats). Wires insurance-fund.html the same way.

## Phase 4 — SIINDEX Console (new HTML screen)

One new screen, `siindex-console.html`, mobile-first per canon, for AJ only: live agent registry, kill switch toggle, recent `citizen_intents` feed, council review log. This is the first real "cockpit" view into SIINDEX rather than scattered Supabase table browsing.

---

## What I need from you before touching schema

Per the project's own standing rule ("creating a new Supabase table → ask first, one confirmation, then proceed"), I need a go-ahead on Phase 1 before creating anything. Once you confirm, I'll build Phases 1→4 in sequence in this session without stopping again, auditing and documenting as I go per the usual rhythm — unless something in Phase 3/4 turns out to need a real judgment call (e.g., dispute resolution policy, insurance APY rate), which I'll flag as a real decision point when I hit it, not before.
