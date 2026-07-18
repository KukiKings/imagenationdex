# SIINDEX Executive and Citizen Operating Modes — Reality Mapping
**Companion to:** `siindex-master-architecture-v1.md`, `siindex-assurance-layer-v1.md` (Identity/Delegation/Blast-Radius, Phase A — shipped), `siindex-presence-capability-layer-v1.md` (device/capability/identity-passport layer — shipped)
**Status:** Reality-mapping pass complete. Honest buildable subset shipped this pass.
**Date:** 18 Jul 2026

---

## What AJ asked for

One canonical SIINDEX, not two products: an Executive Mode (Arthur + separately authorised leadership — build progress, launch readiness, security, compliance, finances, risks, blockers, decisions) and a Citizen Mode (every citizen's voice-first relationship — join, identity, Grid Account, learning, work, marketplace, disputes, governance, exit). Shared core (identity, conversation engine, voice engine, orchestration, evidence classification, policy, trace, receipts). Unshared: memory, tools, permissions, data, authority, system prompts, reports, secrets. Explicit correction: don't build the executive command centre as the final SIINDEX — build it as the first private operating mode of the one SIINDEX that will eventually speak with every citizen.

---

## What already existed before this pass (checked directly, not assumed)

This doctrine's two biggest asks — **Identity and Role Resolution** and **Memory Separation** — turned out to be substantially already built, from the Assurance Layer (Phase A, shipped 16-17 Jul):

- `agent_registry` — already has `owner`, `constitutional_authority`, `prohibited_actions`, `permitted_tools`, `permitted_memory_classes`, `risk_class`, blast-radius limits (`max_citizens_affected`, `max_money_indx`, `max_records_changed`, `blast_radius_window_minutes`), `revocation_status`. This is real, live infrastructure for exactly "which tools are permitted / which memory is permitted / what authority they hold."
- `delegations` — full authority-chain shape (grantor, agent, purpose, scope, data_limit, financial_limit, time_limit, jurisdiction, approval_status, expiry, revocation, signature) already real.
- `memory_items` — has `class` (check-constrained: session, citizen_approved, operational, evidence, institutional, cultural, civilisation, prohibited), `promotion_stage`, `sensitivity`, `owner_citizen_id`, `permission_granted`. This is the memory-domain separation mechanism the doctrine asks for — partially. See gap below.
- `siindex-gate` (Edge Function, source read directly this pass) — a real, deterministic pre-action broker: checks the kill switch, checks blast-radius against `agent_registry` limits, checks risk-level-appropriate approval (auto / citizen confirmation / step-up / full Council sign-off for L4-L5), writes to `approval_gates`, updates `citizen_intents.status`. This is a live, working version of the doctrine's "Action Test" (explain/recommend/prepare/approve/execute/verify/receipt as distinct states) and "Source Failure Test" pattern (it fails closed, not open).
- `siindex_identity_passport` (singleton, shipped in the Presence Layer pass) — already the one real candidate for "canonical SIINDEX identity" both modes can share.

Checked and confirmed **not** a general sandbox limitation: `siindex-gate`'s source retrieved cleanly via `get_edge_function`. The earlier failure retrieving `siindex-chat`'s source (two attempts, both `InternalServerErrorException: Failed to retrieve function bundle`) is specific to that function — still unresolved, still blocking real inspection of IN$DEX's only LLM-backed conversational endpoint.

---

## Section-by-Section Reality Ledger

| Doctrine Item | Status | Notes |
|---|---|---|
| **Shared canonical identity** | Real | `siindex_identity_passport` singleton already exists. Both modes now reference it (see build below). |
| **Identity and Role Resolution** | Partial → buildable now | `agent_registry` + `delegations` already carry the shape. Missing: actual registered rows *for* Executive Mode and Citizen Mode as distinct operating profiles. Built this pass. |
| **Memory Separation** | Partial → buildable now | `memory_items.class` didn't distinguish founder/executive-project memory from citizen memory at all — 'operational' was the only non-citizen-specific-sounding class and wasn't reserved for either side. Added `founder`, `executive_project`, `citizen_personal` as new class values (additive, doesn't touch existing rows). |
| **Executive Mode restricted to Arthur** | **Not actually true today — real gap, not fixed this pass** | `siindex-command-center.html` has no authentication check at all. It is unlisted from citizen navigation, same as `siindex-console.html`, but that is obscurity, not access control. Flagged explicitly rather than silently claimed as secure — building real authentication requires deciding what "Arthur's account" is in Supabase Auth terms (a real citizen row for AJ, an admin flag, a separate auth mechanism), which is a genuine scope decision, not something to guess at. |
| **Executive information must never enter Citizen Mode** | Unverifiable today | Cannot audit this against `siindex-chat` (citizen-facing LLM endpoint) without its source, which two attempts couldn't retrieve. `siindex-voice-terminal.html`'s regex KB and `siindex-command-center.html`'s KB are two separate JS files with no shared runtime data — there is no code path today for one to read the other's content, which is a real (if basic) form of separation. Full assurance needs the same `siindex-chat` inspection blocked above. |
| **Action states (Explain/Recommend/Prepare/Approve/Execute/Verify/Receipt)** | Real, already shipped | `citizen_intents.status` + `siindex-gate` + `approval_gates` already implement this state machine for anything routed through the Orchestrator. Not yet true for legacy screens that don't call the Orchestrator (most current screens — noted honestly in the Master Architecture doc already). |
| **Source Failure Test** | Real pattern exists, extended | `siindex-gate` already fails closed. `siindex-command-center.html`'s live-stats loader already had a try/catch showing "Could not load" rather than inventing numbers — confirmed still true, no change needed. |
| **Voice relationship (interrupt, repeat, cancel, escalate)** | Partial | Real STT/TTS exists (both modes). Real natural interruption mid-speech, rate control, and "explain simpler" don't exist in either voice screen today — roadmap, same class of gap as the Full-Duplex Intent Engine flagged in the Presence Layer pass. |
| **Executive Intelligence (unscripted question answering)** | Partial, honestly bounded | `siindex-command-center.html`'s knowledge base answers six real, grounded topics (roadmap, open items, build status, security, compliance, identity) from live data. It does not understand arbitrary unscripted phrasing — that needs a real LLM call, which is what `siindex-chat` already does for citizens. Extending that pipeline (or a sibling of it) with founder context is the correct next step, not attempted blind against a function whose source is currently unreadable. |
| **Citizen Intelligence / First Citizen Journey / Second Citizen Journey** | Not built this pass — explicitly out of scope | AJ's own doctrine orders this after the executive mode is solidified ("do not build the executive command centre as the final SIINDEX — build it as the first... operating mode"). This pass is scoped to the shared-core/mode architecture only. The onboarding voice journey is real, substantial, separate work — not started, not claimed done. |
| **Shared core (conversation/voice/orchestration/evidence/policy/trace/receipt engines)** | Partial | Voice engine (STT+TTS) is genuinely shared code pattern across both modes today. Orchestration (`siindex-gate`/`citizen_intents`/`approval_gates`) is shared infrastructure both modes could route through, though `siindex-command-center.html` doesn't yet create real `citizen_intents` rows for its own answers (it's read-only briefing, not an acting agent yet) — that's a real gap if Executive Mode is ever expected to *act*, not just report. |

---

## What was built this pass

1. **`memory_items.class`** — extended (additive) to include `founder`, `executive_project`, `citizen_personal` alongside the existing session/citizen_approved/operational/evidence/institutional/cultural/civilisation/prohibited.
2. **Two real `agent_registry` rows**, both referencing the same canonical identity, distinguished by permitted memory classes and owner:
   - **SIINDEX — Executive Mode**: `owner='Arthur John Henry (founder)'`, `domain='executive_intelligence'`, `permitted_memory_classes=['founder','executive_project']`, `constitutional_authority` states it may never expose founder/executive_project memory to Citizen Mode.
   - **SIINDEX — Citizen Mode**: `owner='citizen (per-session)'`, `domain='citizen_intelligence'`, `permitted_memory_classes=['citizen_personal','operational','cultural','civilisation']`, `constitutional_authority` states it may never receive founder/executive_project memory or unrestricted citizen-private access across citizens.
3. **`security-canon.md`** — Law 12 added: "Executive and Citizen Modes Are Constitutionally Separate" (see canon for full text).
4. **`siindex-command-center.html`** — disclosure banner updated to state plainly: this is registered as SIINDEX's Executive Mode agent identity, not a separate product; and to flag the real authentication gap honestly instead of implying it's already access-controlled.

## What was not built, and why

- **Real authentication gate on Executive Mode** — flagged, not guessed at. Needs AJ's decision on what "Arthur's account" means in Supabase Auth terms before it can be built for real rather than faked with a client-side password check (which would be theater, not security).
- **True unscripted LLM reasoning for either mode** — blocked on `siindex-chat`'s source being unreadable (`get_edge_function` fails with a server error, tried twice). Once readable, the right move is extending it (or a sibling function) with mode-scoped context, not a blind redeploy.
- **First and Second Citizen Journeys** — explicitly sequenced after this pass by AJ's own doctrine; not started.
- **Natural interruption / speech-rate control / language switching in the live voice UI** — roadmap, same gap already flagged in the Presence Layer pass.
