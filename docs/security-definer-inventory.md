# SECURITY DEFINER inventory, public schema

**Created:** 2026-10-21 · **Source finding:** S9 in docs/canon-utilities-mined.md · **Status:** inventory and review script only. Nothing was applied, no function body was changed, nothing was dropped or deployed.
**Companion script:** scripts/revoke-anon-security-definer.sql (not run).

## Result

- Total SECURITY DEFINER functions in schema public: **158** (extension-owned excluded). All 158 pin search_path.
- **KEEP-PUBLIC: 9. LOCK: 149.**
- Executable by anon today: **42** (9 KEEP-PUBLIC + 33 LOCK). Executable by authenticated: 153. Service-role only: 5.
- LOCK breakdown: **Section A 18** (anon-executable, no caller in this repo, safe to revoke now); **Section B 15** (anon-executable and called from this repo, revoke only after the client changes); **Section C 116** (already not anon-callable, no grant change needed).
- After Section A the anon-executable count is 24. After Section B it is 9.
- 107 of the 158 bodies mention auth.uid(); 51 do not. I searched bodies for that string only. I did not audit what each function does with it, and a function that takes p_citizen_id from the caller is only safe if its body compares that id with the session.

## Method

Query run read-only against project zljgthfzbalsunuoohcd on 2026-10-21 (shortened):

    select p.oid::regprocedure, pg_get_function_result(p.oid), has_function_privilege('anon', p.oid, 'execute'),
           has_function_privilege('authenticated', p.oid, 'execute'), p.prosrc ~* 'auth.uid()'
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef and p.prokind in ('f','p')
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e');

Repo callers came from a text search for rpc( calls and /rest/v1/rpc/ URLs in the html, js, mjs, ts and jsx files on origin/main (2ae394a). Edge functions and database triggers were checked separately. A caller in the repo does not prove the page runs without a session; it only means a change needs a client check first.

## Classification rules

- **KEEP-PUBLIC** only when (a) a public or pre-session page in this repo calls it and it returns aggregate or public data or is a public sign-up form, or (b) removing anon execute would break something else.
- Everything else is **LOCK**. Anything touching user data, payments, tokens, domains, admin state or identity is LOCK unless one of the two reasons above applies.
- Target role: **authenticated** for user-facing functions; **service_role** for admin, internal, trigger and payment functions (pay is off, so the four payment-request functions go to service_role until AJ approves pay).
- PUBLIC matters: Postgres grants EXECUTE to PUBLIC by default, so the script revokes from PUBLIC, anon and authenticated, then grants back one role.

## KEEP-PUBLIC (9) and why

- check_domain_available, get_domain_reservation_count: called by claim-domain.html and onboarding-flow.html before sign-in. Boolean and a count. Name probing is possible; rate limiting is not done in the database.
- get_waitlist_count: called by 9 public pages. A count.
- get_founding_stats: called by founding.html with a referral code.
- join_waitlist, join_founding_waitlist: public sign-up forms. They write personal details from an anonymous caller by design. They have no rate limit in the database.
- get_public_domain_view: called by domain.html and siindex-web3-identity.html. Public profile view.
- get_consent_receipt_count: called by indx-trust-dashboard.html. A count.
- **is_founder**: referenced by 41 RLS policies across the schema. Policies run as the calling role, so removing anon execute would make anonymous queries on those tables fail with permission denied. It returns a boolean only. Moving those policies to the authenticated role is the way to lock it later.

## Section A (18): revoke now

- To service_role: admin_add_cash_agent, admin_set_cash_agent_status, cancel_payment_request, create_payment_request, fulfill_payment_request, get_payment_request, handle_new_auth_user, waitlist_count, waitlist_stats.
- To authenticated: check_message_authenticity, get_cash_agents_near, get_connectivity_providers, get_instant_invite_status, get_listings, get_pool_stats, get_solvency_indicator, get_top_stakers, report_scam_indicator.
- Worst first: admin_set_cash_agent_status is anon-executable and its body does not mention auth.uid(), so anyone with the project URL and anon key can call it. admin_add_cash_agent is anon-executable too. get_top_stakers returns citizen ids with domain names. The four payment-request functions are anon-executable while pay is off.
- handle_new_auth_user is a trigger function. Postgres checks EXECUTE when the trigger is created, not when it fires, so revoking caller grants is safe. I did not fire a test signup.

## Section B (15): hold until the client changes

- To authenticated: claim_creator_signup_bonus, claim_genesis_signup_bonus, create_onboarding_citizen, get_action_intent_card, get_citizen_by_phone, get_platform_security_status, get_staking_stats, grant_intent_approval, link_citizen_auth_by_id, request_action_approval, verify_address_funds, verify_government_id, verify_payid.
- To service_role: claim_genesis_signup_bonus_anon, link_citizen_auth.
- Callers: join.html, onboarding-flow.html, quickstart-onboarding.html, grid-account-onboarding.html, biometric-kyc.html, creator-onboarding.html, login.html, sovereign-verify.html, agents/kyc-agent.js, agents/compliance-agent.js and the intent-approval pages. I cannot tell from the repo which of these run before a Supabase session exists. Applying Section B first could break the onboarding and login flows that Phase 4 of docs/prelaunch-roadmap-2026.md tests.
- get_action_intent_card also has the NULL-auth bypass (S8). Revoking anon removes the anonymous path; fixing the body is a separate change.

## Section C (116): no grant change, review items

These are already not callable by anon. Two things were noticed and not changed:

- Authenticated can execute admin and operations functions with no caller in this repo: add_verified_sender, assign_incident_commander, mark_citizen_as_test_actor, record_positive_test_step, resolve_complaint, resolve_dispute, review_reported_indicator, revoke_verified_sender, run_truth_maintenance_scan, sweep_expired_test_actors, toggle_kill_switch, request_investigation_access, read_session_messages_under_investigation, replay_intent, get_agent_bom, get_trace_export, get_consent_oversight, get_intent_oversight, get_session_oversight, get_session_message_counts, is_founder_aal2. Whether each checks the founder role inside its body is not known; I did not read the bodies. Moving them to service_role is the likely fix.
- The three enforce_* trigger functions are granted to authenticated and do not need caller grants.
- borrow_from_pool is called by lending-dashboard.html but authenticated has no EXECUTE, so that call fails today. Lending is inert, so this is consistent with the current locks. Not changed.

## Inventory (158 rows)

Columns: anon and auth show EXECUTE today. uid means the body mentions auth.uid(). repo means a caller exists in this repo. Target is the role after the script; unchanged means no statement is needed.

| # | Function (arg types) | Returns | anon | auth | uid | repo | Class | Target role |
|---|---|---|---|---|---|---|---|---|
| 1 | accrue_lending_interest() | jsonb | - | - | - | - | LOCK | service_role (unchanged) |
| 2 | add_dispute_evidence(uuid, uuid, jsonb) | void | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 3 | add_guardian(uuid, text) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 4 | add_verified_sender(text, text, text[], text[], text[], text, text[]) | jsonb | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 5 | admin_add_cash_agent(jsonb) | jsonb | Y | Y | Y | - | LOCK | service_role |
| 6 | admin_set_cash_agent_status(uuid, text) | jsonb | Y | Y | - | - | LOCK | service_role |
| 7 | assess_transfer_risk(uuid, uuid, text, numeric, uuid) | void | - | - | - | Y | LOCK | service_role (unchanged) |
| 8 | assign_incident_commander(uuid, text, text) | jsonb | - | Y | - | - | LOCK | authenticated (unchanged) |
| 9 | award_wisdom(uuid, integer, text) | integer | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 10 | award_wisdom_internal(uuid, integer, text) | integer | - | - | - | - | LOCK | service_role (unchanged) |
| 11 | borrow_from_pool(uuid, numeric, numeric) | jsonb | - | - | Y | Y | LOCK | service_role (unchanged) |
| 12 | cancel_bill_pay_schedule(uuid, uuid) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 13 | cancel_payment_request(uuid, uuid) | jsonb | Y | Y | Y | - | LOCK | service_role |
| 14 | capture_consent_snapshot(uuid, text, text) | jsonb | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 15 | cast_governance_vote(uuid, uuid, text, integer) | json | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 16 | check_domain_available(text) | boolean | Y | Y | - | Y | KEEP-PUBLIC | anon, authenticated |
| 17 | check_message_authenticity(uuid, text, text, text) | jsonb | Y | Y | Y | - | LOCK | authenticated |
| 18 | claim_creator_signup_bonus(uuid) | jsonb | Y | Y | - | Y | LOCK | authenticated |
| 19 | claim_founder_bootstrap() | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 20 | claim_genesis_signup_bonus(uuid) | jsonb | Y | Y | Y | Y | LOCK | authenticated |
| 21 | claim_genesis_signup_bonus_anon(uuid) | jsonb | Y | Y | - | Y | LOCK | service_role |
| 22 | claim_staking_rewards(uuid, uuid) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 23 | clear_siindex_personal_pause() | void | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 24 | complete_referral(text, uuid) | boolean | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 25 | contribute_to_savings_goal(uuid, uuid, numeric) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 26 | create_collateral_deposit_intent(uuid) | jsonb | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 27 | create_instant_invite(uuid, numeric) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 28 | create_listing(uuid, text, text, numeric, text, text, text, numeric) | json | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 29 | create_onboarding_citizen(jsonb) | jsonb | Y | Y | Y | Y | LOCK | authenticated |
| 30 | create_payment_request(uuid, numeric, text) | jsonb | Y | Y | Y | - | LOCK | service_role |
| 31 | create_savings_goal(uuid, text, text, numeric, date, boolean, numeric, boolean) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 32 | credit_stripe_purchase(uuid, numeric, numeric, text) | jsonb | - | - | Y | Y | LOCK | service_role (unchanged) |
| 33 | deposit_to_pool(uuid, numeric) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 34 | disable_totp(uuid) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 35 | enforce_delegation_narrowing() | trigger | - | Y | - | - | LOCK | authenticated (unchanged) |
| 36 | enforce_intent_approval_before_execution() | trigger | - | Y | - | - | LOCK | authenticated (unchanged) |
| 37 | enforce_risk_class_elevation_approval() | trigger | - | Y | - | - | LOCK | authenticated (unchanged) |
| 38 | file_complaint(uuid, text, text) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 39 | find_unlinked_citizen_by_domain(text) | jsonb | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 40 | fulfill_instant_invite(text, uuid) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 41 | fulfill_payment_request(uuid, uuid, text) | jsonb | Y | Y | Y | - | LOCK | service_role |
| 42 | generate_atm_withdrawal(uuid, numeric) | jsonb | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 43 | get_action_intent_card(uuid) | jsonb | Y | Y | Y | Y | LOCK | authenticated |
| 44 | get_agent_bom(uuid) | jsonb | - | Y | - | - | LOCK | authenticated (unchanged) |
| 45 | get_atm_daily_usage(uuid) | jsonb | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 46 | get_atm_pin_status(uuid) | jsonb | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 47 | get_atm_withdrawal_history(uuid, integer) | jsonb | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 48 | get_bill_pay_history(uuid, integer) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 49 | get_bill_pay_schedules(uuid) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 50 | get_cash_agents_near(text) | jsonb | Y | Y | - | - | LOCK | authenticated |
| 51 | get_citizen_by_phone(text) | json | Y | Y | Y | Y | LOCK | authenticated |
| 52 | get_citizen_devices(uuid) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 53 | get_citizen_tax_summary(uuid) | jsonb | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 54 | get_citizen_verification_bundle(uuid) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 55 | get_connectivity_events(uuid, integer) | jsonb | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 56 | get_connectivity_providers() | jsonb | Y | Y | - | - | LOCK | authenticated |
| 57 | get_connectivity_risk_flags(uuid) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 58 | get_connectivity_wallet(uuid) | jsonb | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 59 | get_consent_compliance_summary() | jsonb | - | Y | - | Y | LOCK | authenticated (unchanged) |
| 60 | get_consent_oversight() | TABLE(...) | - | Y | - | - | LOCK | authenticated (unchanged) |
| 61 | get_consent_receipt_count() | integer | Y | Y | - | Y | KEEP-PUBLIC | anon, authenticated |
| 62 | get_consent_receipts(uuid, integer) | SETOF consent_receipts | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 63 | get_domain_reservation_count() | integer | Y | Y | - | Y | KEEP-PUBLIC | anon, authenticated |
| 64 | get_founder_dashboard_stats() | jsonb | - | Y | - | Y | LOCK | authenticated (unchanged) |
| 65 | get_founding_stats(text) | json | Y | Y | - | Y | KEEP-PUBLIC | anon, authenticated |
| 66 | get_guardians(uuid) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 67 | get_instant_invite_status(text) | jsonb | Y | Y | - | - | LOCK | authenticated |
| 68 | get_intent_oversight() | TABLE(...) | - | Y | - | - | LOCK | authenticated (unchanged) |
| 69 | get_lending_positions(uuid) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 70 | get_listings(text, integer, integer) | json | Y | Y | - | - | LOCK | authenticated |
| 71 | get_my_credentials(uuid) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 72 | get_my_disputes(uuid) | SETOF disputes | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 73 | get_my_listings(uuid) | json | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 74 | get_my_purchases(uuid) | SETOF listings | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 75 | get_my_savings_goals(uuid) | SETOF savings_goals | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 76 | get_my_stakes(uuid) | SETOF insurance_stakes | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 77 | get_my_transfer_risk_flags(uuid) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 78 | get_or_create_referral_code(uuid) | text | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 79 | get_payment_request(uuid) | jsonb | Y | Y | - | - | LOCK | service_role |
| 80 | get_platform_security_status() | jsonb | Y | Y | - | Y | LOCK | authenticated |
| 81 | get_pool_stats() | jsonb | Y | Y | - | - | LOCK | authenticated |
| 82 | get_public_domain_view(text) | jsonb | Y | Y | - | Y | KEEP-PUBLIC | anon, authenticated |
| 83 | get_referral_stats(uuid) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 84 | get_security_settings(uuid) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 85 | get_session_message_counts() | TABLE(...) | - | Y | - | - | LOCK | authenticated (unchanged) |
| 86 | get_session_oversight() | TABLE(...) | - | Y | - | - | LOCK | authenticated (unchanged) |
| 87 | get_solvency_indicator() | jsonb | Y | Y | - | - | LOCK | authenticated |
| 88 | get_staking_positions(uuid) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 89 | get_staking_stats() | jsonb | Y | Y | - | Y | LOCK | authenticated |
| 90 | get_tax_summary(uuid, integer) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 91 | get_tax_transactions(uuid, integer) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 92 | get_top_stakers(integer) | TABLE(...) | Y | Y | - | - | LOCK | authenticated |
| 93 | get_trace_export(uuid) | jsonb | - | Y | - | - | LOCK | authenticated (unchanged) |
| 94 | get_waitlist_count() | integer | Y | Y | - | Y | KEEP-PUBLIC | anon, authenticated |
| 95 | get_withdrawal_history(uuid, integer) | jsonb | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 96 | grant_intent_approval(uuid, integer, text) | jsonb | Y | Y | Y | Y | LOCK | authenticated |
| 97 | handle_new_auth_user() | trigger | Y | Y | - | - | LOCK | service_role |
| 98 | has_consent(uuid, text) | boolean | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 99 | is_founder() | boolean | Y | Y | Y | Y | KEEP-PUBLIC | anon, authenticated |
| 100 | is_founder_aal2() | boolean | - | Y | - | - | LOCK | authenticated (unchanged) |
| 101 | issue_agent_vouch_credential(uuid, uuid, text) | jsonb | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 102 | join_founding_waitlist(text, text, text, text) | json | Y | Y | - | Y | KEEP-PUBLIC | anon, authenticated |
| 103 | join_waitlist(text, text, text, text) | jsonb | Y | Y | - | Y | KEEP-PUBLIC | anon, authenticated |
| 104 | link_citizen_account(uuid, jsonb) | jsonb | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 105 | link_citizen_auth(text, uuid) | void | Y | Y | - | Y | LOCK | service_role |
| 106 | link_citizen_auth_by_id(uuid) | jsonb | Y | Y | Y | Y | LOCK | authenticated |
| 107 | link_waitlist_to_session(uuid) | boolean | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 108 | log_connectivity_event(uuid, text, text, numeric, jsonb, text, boolean) | jsonb | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 109 | mark_citizen_as_test_actor(uuid, text, timestamp with time zone) | jsonb | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 110 | open_dispute(uuid, uuid, uuid, text) | disputes | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 111 | pay_bill(uuid, text, text, text, text, numeric, boolean) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 112 | promote_memory_item(uuid, text, text, text) | jsonb | - | Y | - | Y | LOCK | authenticated (unchanged) |
| 113 | protect_me(uuid) | jsonb | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 114 | purchase_listing(uuid, uuid) | json | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 115 | read_session_messages_under_investigation(uuid, uuid) | TABLE(...) | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 116 | record_positive_test_step(text, integer, text, text, text, boolean, jsonb) | jsonb | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 117 | record_tax_event(uuid, text, numeric, numeric, text, uuid) | jsonb | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 118 | record_threshold_signoff(uuid, text, text) | jsonb | - | Y | - | Y | LOCK | authenticated (unchanged) |
| 119 | register_device(uuid, text, text) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 120 | repay_loan(uuid, uuid, numeric) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 121 | replay_intent(uuid) | jsonb | - | Y | - | - | LOCK | authenticated (unchanged) |
| 122 | report_card_lost(uuid) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 123 | report_connectivity_risk(uuid, text) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 124 | report_scam_indicator(uuid, text, text, text) | jsonb | Y | Y | Y | - | LOCK | authenticated |
| 125 | request_action_approval(uuid, text, numeric, text) | jsonb | Y | Y | - | Y | LOCK | authenticated |
| 126 | request_investigation_access(text, text, uuid, uuid, text[], text, numeric) | jsonb | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 127 | reserve_domain(text) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 128 | resolve_complaint(uuid, text) | jsonb | - | Y | - | - | LOCK | authenticated (unchanged) |
| 129 | resolve_dispute(uuid, text, text) | disputes | - | Y | - | - | LOCK | authenticated (unchanged) |
| 130 | review_reported_indicator(uuid, text, text) | jsonb | - | Y | - | - | LOCK | authenticated (unchanged) |
| 131 | revoke_device(uuid, text) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 132 | revoke_verified_sender(uuid, text) | jsonb | - | Y | - | - | LOCK | authenticated (unchanged) |
| 133 | run_truth_maintenance_scan() | jsonb | - | Y | - | - | LOCK | authenticated (unchanged) |
| 134 | set_account_freeze(uuid, boolean, text) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 135 | set_atm_pin(uuid, text) | jsonb | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 136 | set_card_freeze(uuid, boolean) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 137 | set_siindex_personal_pause(integer) | timestamp with time zone | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 138 | setup_totp(uuid) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 139 | stake_indx(uuid, numeric, text, numeric, numeric, boolean) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 140 | stake_to_pool(uuid, numeric) | insurance_stakes | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 141 | submit_pillar_amendment_proposal(uuid, text, text, text, text) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 142 | sweep_expired_test_actors() | jsonb | - | Y | - | - | LOCK | authenticated (unchanged) |
| 143 | toggle_kill_switch(boolean, text, text) | siindex_kill_switch | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 144 | transfer_indx(uuid, numeric, text, text, text, text, text, text, text) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 145 | unstake_from_pool(uuid, uuid) | void | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 146 | unstake_position(uuid, uuid, boolean) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 147 | update_business_profile(uuid, text, text, text, text, text, jsonb) | jsonb | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 148 | update_connectivity_consent(uuid, text, boolean) | jsonb | - | Y | Y | - | LOCK | authenticated (unchanged) |
| 149 | update_security_pref(uuid, text, boolean) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 150 | upsert_tier0_profile(text, text, date, text) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 151 | verify_address_funds(uuid, text, text) | jsonb | Y | Y | Y | Y | LOCK | authenticated |
| 152 | verify_government_id(uuid, text) | jsonb | Y | Y | Y | Y | LOCK | authenticated |
| 153 | verify_payid(uuid, text) | jsonb | Y | Y | Y | Y | LOCK | authenticated |
| 154 | verify_totp_setup(uuid, text) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 155 | waitlist_count() | integer | Y | Y | - | - | LOCK | service_role |
| 156 | waitlist_stats() | jsonb | Y | Y | - | - | LOCK | service_role |
| 157 | withdraw_from_pool(uuid, uuid, numeric) | jsonb | - | Y | Y | Y | LOCK | authenticated (unchanged) |
| 158 | withdraw_indx(uuid, numeric, text, text, text, text, text, text, text) | jsonb | - | Y | Y | - | LOCK | authenticated (unchanged) |
