# Part Sixteen — Staging Positive Test Sequence & Production Cutover
> Companion to the 17-part DEFAULT-DENY SECURITY, POSITIVE-PATH TEST, AND RUNTIME ASSURANCE LAYER directive. This is the exact, ordered sequence that will produce real, evidenced proof that Executive Mode and Citizen Mode work end to end — not a claim, a recorded result. Every step writes a row to `positive_test_runs` via `record_positive_test_step()` (run_label = `'part16_v1'`), so the outcome is a queryable audit trail, not a narrative.

**Nothing below has run yet.** `founder_authority` and `auth.users` are both empty — zero real signups have ever happened on this project. This sequence is fully built and staged; it is blocked on two things only AJ can do (his own login identity, his own phone to receive an OTP). Everything else is already built and ready to fire the moment those two things happen.

---

## Blocking items (AJ only — cannot be done by SIINDEX)

1. **Founder bootstrap ceremony (Task #184)** — log in as `dadyboy73@gmail.com` or `imagenationdex@gmail.com`, enrol TOTP MFA, complete an MFA challenge (AAL2), then call `claim_founder_bootstrap()`.
2. **One real test citizen signup, via phone/SMS not email** — Custom SMTP is off (2 emails/hour cap, Task #185 unresolved) but Twilio SMS is fully configured (confirmed live in Part Seven). Use a phone number AJ controls to complete a real signup through whichever onboarding screen uses phone OTP, so the sequence isn't blocked on the email limitation.

---

## Sequence (run in order, each step logged via `record_positive_test_step`)

**Stage A — Founder identity**
1. Confirm `founder_authority` now has exactly one non-revoked row matching AJ's `auth_user_id`.
2. Confirm `is_founder()` returns true and `is_founder_aal2()` returns true for that session (requires a live AAL2 JWT — verified via a real RPC call, not inspection).

**Stage B — Model + runtime, Executive Mode**
3. Invoke `siindex-model-canary` using AJ's real AAL2 session. Expect `success: true`, a real `latency_ms`, and a row in `siindex_model_canary_runs`.
4. Call `security.get_canary_status(24)` — confirm `total_runs >= 1`, `success_rate = 100`.
5. AJ opens Executive Mode (SIINDEX Command Center) and sends one real message. Expect: siindex-runtime resolves Executive Mode (no `step_up_required`), streams a genuine model response, and returns an `X-Siindex-Correlation-Id`.
6. Call `security.get_trace_by_correlation(<that id>)` — confirm it returns the `siindex_runtime_conversation` security_event and both session messages (citizen + siindex) tied to that one request.

**Stage C — Citizen positive path (folds in Tasks #153/#154)**
7. AJ completes one real signup via phone/SMS OTP for a designated test citizen.
8. Grant the required consent categories (`service_use`, `external_processing`, `provider_disclosure`) as that citizen — confirm via `consent_grants`.
9. Send one message to siindex-runtime as that citizen. Expect: Citizen Mode resolves, a `consent_snapshot_id` is captured and bound to the session, response only references that citizen's own data.
10. Call `security.get_trace_by_correlation()` on that request's correlation id — confirm the consent snapshot and session messages appear, and confirm no founder or other-citizen data appears anywhere in the trace.
11. Mark that citizen `is_test_actor = true` via `mark_citizen_as_test_actor()` (now AAL2-gated as of Part Thirteen's drift fix) so it's excluded from solvency/treasury aggregates going forward.

**Stage D — Isolation / negative tests (must fail correctly)**
12. As the test citizen, attempt `requested_mode: 'executive'` — expect hard rejection (`requested_mode_does_not_match_resolved_mode`), logged as `siindex_runtime_mode_escalation_attempt`.
13. Attempt to call a founder-only RPC (e.g. `toggle_kill_switch`) from the citizen session — expect `not_authorized`.
14. Attempt to reuse the citizen's `session_id` from a different `auth_user_id` (simulated) — expect `session_owner_mismatch`.

**Stage E — Close-out**
15. Query `positive_test_runs` for `run_label = 'part16_v1'` — every step above must show `passed = true` with real `evidence`. Any `false` blocks production cutover until fixed.
16. Only once Stage A–D are fully green does Part Seventeen's final honest completion report get written — per the directive's own Definition of Done: "Do not claim Executive Mode or Citizen Mode is operational until the production positive tests pass."

---

## What SIINDEX will do the moment Stage A unblocks
Steps 3, 4, 6, 8 (verification half), 10, 11, 15 are executable by SIINDEX autonomously once AJ's AAL2 session exists — no further authorisation needed, consistent with "SIINDEX is in charge from here on, AJ confirms/authorises what she can't." Steps 1, 2, 5, 7, 9, 12–14 require AJ to actually be logged in and acting (his identity, his phone, his click) — SIINDEX will drive the verification query immediately after each.
