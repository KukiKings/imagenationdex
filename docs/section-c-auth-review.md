# Section C - authorization review of 21 admin/operations SECURITY DEFINER functions

Project zljgthfzbalsunuoohcd. Reviewed 21 Oct 2026. Read-only: no function, grant or policy was changed.
Source list: docs/security-definer-inventory.md, line "Authenticated can execute admin and operations functions with no caller in this repo".
Method: read each live body with pg_get_functiondef; tested toggle_kill_switch as a non-founder authenticated caller inside a rolled-back transaction.

## Result

- 21 of 21 have a real authorization gate in the body. 0 lack one. 0 bypass is_founder().
- 6 use is_founder_aal2() (founder plus MFA step-up). 14 use is_founder() only (founder, no MFA step-up). 1 (is_founder_aal2) is the aal2 gate function itself.
- The inventory's suggested fix (move all 21 to service_role) is not needed for safety and would break the founder console, which calls them as an authenticated user. Keep the grants.
- Four hardening findings below. None is an open hole to a non-founder caller.

## Priority one: toggle_kill_switch(boolean, text, text)

- Gate: `IF NOT is_founder()` raises not_authorized; then `IF NOT is_founder_aal2()` raises step_up_required. Founder plus MFA (aal2) is required to engage or release the Sovereign Pause.
- Tested: authenticated user with a random uid and aal1 gets "not_authorized: only the founder may engage or release the Sovereign Pause". Kill switch state unchanged (engaged = false after the test). One overload only.
- Direct table write is also closed: siindex_kill_switch has RLS on and only a SELECT policy (is_founder()), so no INSERT/UPDATE policy exists. anon and authenticated hold table INSERT/UPDATE grants, but RLS default-denies them.
- Verdict: a platform-wide control is NOT exposed to ordinary logged-in accounts.
- Two defects remain (F1, F2 below).

## Gate table

| # | Function | Gate in body | Strength |
|---|----------|--------------|----------|
| 1 | toggle_kill_switch | is_founder() then is_founder_aal2() | strong |
| 2 | is_founder_aal2 | is_founder() AND auth_aal() = 'aal2' (it is the gate; returns boolean) | n/a |
| 3 | add_verified_sender | is_founder_aal2() | strong |
| 4 | revoke_verified_sender | is_founder_aal2() | strong |
| 5 | mark_citizen_as_test_actor | is_founder_aal2() | strong |
| 6 | resolve_complaint | is_founder_aal2() | strong |
| 7 | resolve_dispute | is_founder_aal2() | strong |
| 8 | assign_incident_commander | is_founder() | founder only (writes) |
| 9 | record_positive_test_step | is_founder() | founder only (writes) |
| 10 | review_reported_indicator | is_founder() | founder only (writes; changes threat indicators) |
| 11 | sweep_expired_test_actors | is_founder() | founder only (writes) |
| 12 | run_truth_maintenance_scan | is_founder() | founder only (read) |
| 13 | request_investigation_access | is_founder() | founder only (grants access to citizen-private data) |
| 14 | read_session_messages_under_investigation | is_founder() plus a live access record owned by caller | founder only (reads citizen message content) |
| 15 | replay_intent | is_founder() | founder only (read) |
| 16 | get_agent_bom | is_founder() | founder only (read) |
| 17 | get_trace_export | is_founder() | founder only (read) |
| 18 | get_consent_oversight | is_founder() | founder only (read, purpose_note excluded) |
| 19 | get_intent_oversight | is_founder() | founder only (read, raw_intent excluded) |
| 20 | get_session_oversight | is_founder() | founder only (read, purpose/objective excluded) |
| 21 | get_session_message_counts | is_founder() | founder only (read, counts only) |

Why is_founder() holds: it checks founder_authority for auth.uid() with revoked_at IS NULL. A null or anonymous uid matches nothing, so it returns false. founder_authority has 1 row (active), RLS on, no policies, so callers cannot add themselves. auth_aal() reads the aal claim from the signed JWT, so it cannot be set by the caller. All 21 are SECURITY DEFINER with search_path pinned to public.

## Findings and proposed fixes (none applied)

Doctrine sentence: **An action that changes platform state or exposes citizen-private data runs only for the verified founder, and the irreversible or privacy-breaking ones also require an MFA-verified (aal2) session.**
Binary enough to enforce deterministically: yes. Every check below is a boolean on auth.uid() and the aal claim; no judgement is involved.

### F1 - toggle_kill_switch trusts a caller-supplied identity (audit spoofing)

`engaged_by` and the security_events detail record p_engaged_by, free text from the caller. The founder can write any name; the real uid is not stored in the switch row.

Proposed change, inside the function after the two gate checks:

```sql
-- s9c-audit-identity: record the verified caller, not a self-declared name
p_engaged_by := coalesce(auth.uid()::text, 'unknown') || CASE WHEN nullif(p_engaged_by,'') IS NOT NULL THEN ' (' || p_engaged_by || ')' ELSE '' END;
```

Binary: yes.

### F2 - failed-attempt audit rows are rolled back and never persist

toggle_kill_switch inserts a T4/T3 security_events row and then RAISEs. RAISE EXCEPTION aborts the call's transaction, so the insert is discarded. Test: after a non-founder call, kill_switch_unauthorized_attempt count was 0, and it is 0 in production history. Unauthorized attempts on the most sensitive control leave no trace.

Proposed change (pick one; both change the caller contract so need AJ approval):
- Return instead of raise on the failure path: insert the event, then `RETURN NULL;` (the function returns a siindex_kill_switch row; the founder UI must treat NULL as "denied"). Keep RAISE only for the aal2 case after logging in the same way.
- Or log the attempt from an autonomous path (a pg_background/dblink call or a service-side edge function) - heavier.

Binary: yes (deny is deterministic); the choice of contract is AJ's.

### F3 - highest-impact is_founder()-only functions should require aal2

request_investigation_access and read_session_messages_under_investigation expose citizen-private message content. assign_incident_commander, review_reported_indicator, sweep_expired_test_actors and record_positive_test_step change state. They accept a founder session without MFA step-up, unlike the 6 functions above that use is_founder_aal2().

Proposed change, replace the first line of each body:

```sql
-- before
IF NOT is_founder() THEN RAISE EXCEPTION 'not_authorized'; END IF;
-- after
IF NOT is_founder_aal2() THEN RAISE EXCEPTION 'step_up_required: requires an MFA-verified (AAL2) session'; END IF;
```

For request_investigation_access the existing failure path returns jsonb `{success:false, reason:'not_authorized'}`; keep that shape with reason 'step_up_required'. Leave the 8 read-only oversight/replay/export/scan functions (rows 12, 15-21) on is_founder(). Binary: yes.
Cost: the founder must hold an aal2 session to use those six functions. The founder console must prompt for MFA.

### F4 - broad table grants on founder_authority and siindex_kill_switch (defense in depth)

anon and authenticated hold INSERT/SELECT/UPDATE on founder_authority and INSERT/SELECT/UPDATE on siindex_kill_switch. RLS blocks them today (no write policies), so this is not exploitable now, but one mistaken policy or a disabled RLS would open both.

Proposed change:

```sql
REVOKE INSERT, UPDATE, DELETE ON public.founder_authority FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.siindex_kill_switch FROM anon, authenticated;
REVOKE ALL ON public.founder_authority FROM anon;
```

Check first that no live page writes these tables directly (none found in the inventory; the kill switch is written only via toggle_kill_switch, which is SECURITY DEFINER). Binary: yes.

## Not found / not checked

- I did not search the repo for callers of these functions beyond the inventory's note of "no caller in this repo".
- I did not test the other 19 functions with a non-founder session; their gates were read from the live body, not exercised. toggle_kill_switch is the only one exercised.
- is_founder() is anon-executable by design because 41 RLS policies call it; unchanged.
- Nothing here was deployed. F1-F4 need AJ's PROCEED.
