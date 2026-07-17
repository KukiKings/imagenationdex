# SIINDEX Sovereign Presence and Capability Layer — Reality Mapping
**Companion to:** `siindex-master-architecture-v1.md`, `siindex-assurance-layer-v1.md` (Layer 1, shipped), `indx-financial-institutional-survival-v1.md` (Layer 2, shipped)
**Status:** Research + Reality Ledger complete, honest buildable subset shipped this pass
**Date:** 17 Jul 2026

---

## What AJ asked for

A third architectural layer: how SIINDEX listens, sees, follows the citizen across devices, accesses context, controls software, installs capabilities, and acts proactively. AJ asked for deep research plus picking "all crucial and important additions" — not a scoping question back to him this time, so this document does the picking, grounded in two things checked before any code was written: (1) whether AJ's cited standards are real, and (2) what IN$DEX's actual codebase does today with devices, cameras, microphones, clipboards, and secrets.

---

## Research: are the cited standards real?

Checked via live web search rather than trusting the pasted doctrine at face value, per this session's standing discipline of verifying present-day factual claims:

- **NIST AI Agent Standards Initiative** — real. Confirmed: NIST's Center for AI Standards and Innovation (CAISI) launched this 17 Feb 2026, organized around three pillars (industry-led agent standards, community-led open protocols including MCP, and research into agent authentication/identity). AJ's doctrine cited this accurately.
- **OpenTelemetry GenAI semantic conventions** — real. Confirmed the conventions cover `invoke_agent` spans, `execute_tool` spans, and attributes like `gen_ai.request.model`/`gen_ai.usage.input_tokens` — still in "Development" status as of mid-2026, not yet a locked v1 spec, which matters for how firmly IN$DEX should commit to it today (worth adopting the shape, risky to hard-lock to exact attribute names before the spec stabilizes).
- **NIST post-quantum standards (ML-KEM/ML-DSA/SLH-DSA)** — real, and actually finalized earlier than AJ's doctrine implies: NIST finalized FIPS 203/204/205 in **August 2024**, not 2026. The 2026 relevance is deployment momentum (Cloudflare, Chrome, iMessage already shipping hybrid PQC), not the standards being new. Same conclusion as Phase C's `crypto_inventory` finding: real, correctly still "classical" for IN$DEX today, and worth not hard-coding one signing algorithm so a future swap is possible.
- **MCP tool security guidance** (input validation, access controls, confirmation for sensitive actions, rate limits, audit logging) — real and current; this is a good, verifiable pattern to hold IN$DEX's own Edge Functions to, and matches what `siindex-gate` already does (kill switch check, blast-radius check, approval-level check, before any Level 2+ action).

Conclusion: AJ's doctrine is well-sourced, not fabricated hype. The gap is entirely on IN$DEX's side — most of what this layer assumes as existing infrastructure (device pairing, camera/mic pipelines, a plugin runtime) doesn't exist yet.

---

## Research: what does IN$DEX's codebase actually do today?

Audited directly (not assumed) before mapping anything:

1. **Real browser API usage for camera/mic/clipboard/geo/screen-capture is almost nonexistent.** Only 3 files make a real `getUserMedia` call: `join-chooser.html` and `qr-scanner.html` (real camera video for QR scanning — a real, narrow, already-consented use), and `siindex-voice-terminal.html` (real `audio:true` mic stream feeding a level-meter visualizer only — no recording, no transcription, nothing sent anywhere). **No `MediaRecorder`, no `captureStream`, no geolocation call exists anywhere in the project.** ~70 files use `navigator.clipboard`, virtually all of them plain "copy to clipboard" buttons, not sensitive reads.
2. **No real device/session concept exists in the schema.** No `devices` table, no device fingerprinting, no device tokens. One file, `siindex-session-sovereignty.html`, has a **hardcoded fake `TRUSTED_DEVICES` JS array** ("MacBook Pro", "iPad (home)") with a "Sign out" button that just fades the row and shows a toast — no real session anywhere is actually revoked. This is the same class of bug this whole session has been hunting: a security control that looks functional and does nothing. `security-settings.html` (fixed earlier this session, task #64) is the honest counter-example — it already explicitly discloses *"Multi-device session tracking isn't built yet — SIINDEX can only show and manage the device you're on right now."*
3. **`biometric-kyc.html`'s liveness scan is confirmed fake** — a `setInterval` loop toggling CSS/emoji text with zero camera access anywhere in the file. This matches what was already found and disclosed in earlier session work; no new finding, just reconfirmed directly in code.
4. **18 real first-party SIINDEX skill folders exist** under `SIINDEX-Skills/` (siindex-coo-orchestrator, siindex-treasury, siindex-lp-manager, siindex-agent-wallet, siindex-devops, pqsi-compliance, and 12 others) — real, running today as Claude skills, not sandboxed third-party plugins.
5. **No raw secret ever touches client-side code or an LLM context.** No `totp_secret`, no seed phrase, no private key reference anywhere in HTML/JS. The one `atm_pin` (non-hash) reference is the RPC parameter name sent to `set_atm_pin`/`get_atm_pin_status` — the raw PIN is used only to compute a bcrypt hash server-side (`extensions.crypt(p_pin, extensions.gen_salt('bf'))`, confirmed in Phase C's crypto_inventory work) and is never logged or echoed back.

**This last point matters most: "Protected Secret Boundary" (item 3 of AJ's doctrine) is already substantially true today**, the same category of finding as "Trusted Time" was for the Assurance Layer — worth stating honestly as already-achieved rather than building new infrastructure to solve a problem that doesn't currently exist.

---

## Section-by-Section Reality Ledger

| Doctrine Item | Status | Notes |
|---|---|---|
| **1. Device Identity and Trust Registry** | Not built → buildable now | No real per-device cryptographic identity is possible without a native app (no secure enclave, no OS-level key storage from a web page) — but a real server-registered device token (long-lived random token issued per browser, stored client-side, tied to a citizen) is honest and buildable, and directly replaces `siindex-session-sovereignty.html`'s fake hardcoded list with something real. |
| **2. Citizen Context Firewall** | Not built → buildable as a forward-looking guardrail | Since almost no real context access exists yet (see research above), there's nothing to firewall today. Building the `context_grants` schema now — with zero real grants issued — is the same pattern as Phase B's constitutional invariants: the guardrail exists *before* the capability, not retrofitted after. |
| **3. Protected Secret Boundary** | **Substantially already true** | Confirmed directly: no raw secret ever reaches client code or an LLM context anywhere in the project. Worth documenting as an explicit, checked fact, not new infrastructure. |
| **4. Full-Duplex Intent Engine** | Partial → small buildable extension | `citizen_intents.status` already has a real state machine (Phase A/B). Distinguishing "stop speaking" from "cancel execution" needs a real voice/chat interaction loop IN$DEX doesn't have yet (SIINDEX today is HTML screens + RPCs, not a live conversational agent inside the app) — the *data model* extension (an intent can move to a `revoked` status) is buildable; the live interruption-handling UX is roadmap. |
| **5. Deterministic Device Action Broker** | Real, needs a device dimension added | The 12-step flow AJ describes is functionally what `siindex-gate`/`citizen_intents`/`approval_gates` already do (Layer 1). The only missing piece is tying an intent to which device originated it — a small, real, buildable `citizen_intents.device_id` column. |
| **6. Sovereign Capability Marketplace** | Not built → buildable as a first-party registry only | No sandboxed third-party plugin execution runtime exists or is realistic to build in this stack today (that's real infrastructure work — an isolated execution environment, permission broker, code review pipeline). What's honest and buildable now: a `capability_registry` cataloguing the 18 *real* first-party SIINDEX skills with their declared purpose/data-access/financial-authority — explicitly labeled "no real third-party sandbox exists yet," not a working marketplace. |
| **7. Capability and Autonomy Budgets** | Real pattern exists, extending it is cheap | This is exactly `agent_registry`'s blast-radius columns (Phase A) at the agent level. Extending the same shape to the new `devices` table (per-device daily limits) is a small, real addition. |
| **8. Open Protocol Gateway** | Roadmap | Requires a real multi-framework/multi-provider integration layer. IN$DEX runs on one model provider today; nothing to gateway between yet. |
| **9. Local-First Intelligence Router** | Roadmap | IN$DEX is a static-HTML web app with a Supabase backend — there is no on-device processing layer, no local model runtime, no wake-word detection. This entire item assumes a native app architecture that doesn't exist. |
| **10. Citizen-Controlled Proactivity Registry** | Not built → buildable now | No proactive push notifications, morning briefs, or alerts currently fire from IN$DEX to any citizen. A real `proactive_routines` table — seeded with zero *active* routines — is honest, cheap, and directly useful the moment any real proactive feature is built (matches this platform's own `mcp__scheduled-tasks__*` pattern conceptually, just scoped to citizen-facing IN$DEX routines rather than this session's own tooling). |
| **11. Multimodal Evidence Pipeline** | Roadmap | No real vision/multimodal capability exists in production (`biometric-kyc.html`'s scan is confirmed fake). Building an evidence-confidence pipeline for a capability that doesn't exist yet would be premature scaffolding, not a real guardrail. Revisit when/if a real vision capability is ever added. |
| **12. Cross-Device Sovereign Presence Mesh** | Roadmap, with a real existing analog | No kiosk/wearable/vehicle products exist. The closest real analog already shipped this session: `instant_invites` (instant-onboard.html's real two-device pairing flow, built earlier in this session). Extending pairing to more device *classes* is roadmap; the pairing *pattern* is already proven real for two phone/browser sessions. |
| **13. Presence Trace and Replay** | Real, needs a device dimension added | `get_trace_export`/`replay_intent` already exist (Phase C). Adding `device_id` to their output once `citizen_intents.device_id` exists (item 5) is a small, real extension, not new infrastructure. |
| **14. Offline Sovereign Continuity** | Roadmap, with a real existing anchor | No offline-first/PWA/service-worker architecture exists. `zero-balance-mode.html` (built earlier this session for connectivity-constrained citizens) is the one real existing step in this direction. Full offline continuity (queued actions, offline credential verification) stays roadmap. |
| **15. Canonical Identity Protection** | Not built → cheap, buildable now | SIINDEX already has one voice/identity (CLAUDE.md's SIINDEX Voice canon). A single real `siindex_identity_passport` row, reusing the HMAC verification-key pattern from Phase A, is a cheap, real way to give SIINDEX itself a verifiable identity record distinct from any citizen-facing personalization. |
| **16. Post-Quantum Device and Agent Migration** | Already honestly covered | `crypto_inventory` (Phase C) already records every real crypto scheme in use as "classical" and flags PQC as not yet needed/deployed. The one actionable note — don't hard-code one signing algorithm — is worth a code-comment-level reminder, not new schema. |

---

## The "six additions to build first" — what actually shipped

Of AJ's named six, the reality check changes the list slightly:

- **Device Identity and Trust Registry** — shipped (see below), as a real token-based registry, not a cryptographic per-device identity (no native app exists to hold a real device key).
- **Citizen Context Firewall** — shipped as the guardrail-before-capability `context_grants` table, honestly empty.
- **Protected Secret Boundary** — not re-built; confirmed already true and documented as such.
- **Deterministic Device Action Broker** — shipped as a small extension (`citizen_intents.device_id`) to the already-real `siindex-gate`.
- **Signed Capability Marketplace** — shipped as a first-party-only `capability_registry`, explicitly not a working sandboxed marketplace.
- **Presence Trace and Verification System** — shipped as a small extension to the already-real trace/replay RPCs.

Two additional cheap, honest wins outside the "first six" were included because they were genuinely free given what already exists: the Proactivity Registry (item 10) and the SIINDEX Identity Passport (item 15).

---

## What was explicitly not built, and why

Open Protocol Gateway, Local-First Intelligence Router, Multimodal Evidence Pipeline, full Cross-Device Presence Mesh, Offline Sovereign Continuity, and Post-Quantum Migration all require real infrastructure IN$DEX does not have today (a multi-provider model gateway, an on-device runtime, a real vision capability, real additional device products, an offline-first architecture, and real PQC respectively). None of these can be honestly simulated in Postgres — building fake versions would repeat exactly the mistake this whole session has been fixing elsewhere in the app.

---

## One open governance question for AJ

AJ's doctrine ends with a proposed "Presence Constitution" (SIINDEX is present without watching / listens without owning the microphone / sees only what the citizen reveals / acts only through authorised capabilities / controls no device without limits / receives no secret it does not need / follows the citizen without making any device the citizen). This reads as a natural Law 11 for `security-canon.md`, parallel to Laws 8-10 added earlier this session. Per the standing rule (canon changes need AJ's explicit sign-off), this has **not** been applied — proposed wording is ready if AJ confirms.
