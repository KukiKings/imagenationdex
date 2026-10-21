-- scripts/revoke-anon-security-definer.sql
-- REVIEW ONLY. Written 2026-10-21 from docs/security-definer-inventory.md. NOT RUN. No function body is changed, nothing is dropped, nothing is deployed.
-- Scope: SECURITY DEFINER functions in schema public (158). 42 are executable by anon today. 9 are KEEP-PUBLIC and are not touched here.
--   Section A (18): anon-executable, no caller found in this repo. Safe to apply first.
--   Section B (15): anon-executable AND called from this repo, some from pre-session pages. COMMENTED OUT. Applying them before the client moves behind a session or an edge function breaks onboarding, login and KYC.
-- Each pair revokes from PUBLIC, anon and authenticated (Postgres grants EXECUTE to PUBLIC by default, so revoking anon alone does nothing), then grants back to the one role that should call it. service_role keeps its own grant.
-- Pay stays off: the four payment-request functions go to service_role only until pay is approved by AJ.
-- Rollback for a function: GRANT EXECUTE ON FUNCTION public.<name>(<arg types>) TO anon, authenticated;

-- ===== Section A: apply first =====
BEGIN;

REVOKE ALL ON FUNCTION public.check_message_authenticity(uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_message_authenticity(uuid, text, text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.get_cash_agents_near(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_cash_agents_near(text) TO authenticated;
REVOKE ALL ON FUNCTION public.get_connectivity_providers() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_connectivity_providers() TO authenticated;
REVOKE ALL ON FUNCTION public.get_instant_invite_status(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_instant_invite_status(text) TO authenticated;
REVOKE ALL ON FUNCTION public.get_listings(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_listings(text, integer, integer) TO authenticated;
REVOKE ALL ON FUNCTION public.get_pool_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_pool_stats() TO authenticated;
REVOKE ALL ON FUNCTION public.get_solvency_indicator() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_solvency_indicator() TO authenticated;
REVOKE ALL ON FUNCTION public.get_top_stakers(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_stakers(integer) TO authenticated;
REVOKE ALL ON FUNCTION public.report_scam_indicator(uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.report_scam_indicator(uuid, text, text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_add_cash_agent(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_cash_agent(jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.admin_set_cash_agent_status(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_cash_agent_status(uuid, text) TO service_role;
REVOKE ALL ON FUNCTION public.cancel_payment_request(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_payment_request(uuid, uuid) TO service_role;
REVOKE ALL ON FUNCTION public.create_payment_request(uuid, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_payment_request(uuid, numeric, text) TO service_role;
REVOKE ALL ON FUNCTION public.fulfill_payment_request(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_payment_request(uuid, uuid, text) TO service_role;
REVOKE ALL ON FUNCTION public.get_payment_request(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_payment_request(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_auth_user() TO service_role;
REVOKE ALL ON FUNCTION public.waitlist_count() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.waitlist_count() TO service_role;
REVOKE ALL ON FUNCTION public.waitlist_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.waitlist_stats() TO service_role;

COMMIT;

-- ===== Section B: HOLD. Uncomment only after the calling pages run under a session or call an edge function =====
-- Callers in this repo: join.html, onboarding-flow.html, quickstart-onboarding.html, grid-account-onboarding.html, biometric-kyc.html, creator-onboarding.html, login.html, sovereign-verify.html, agents/kyc-agent.js, agents/compliance-agent.js, and the intent-approval pages.
-- get_action_intent_card also needs a body fix (it skips its identity check when auth.uid() is NULL). That is a body change and is out of scope here.
-- BEGIN;
--
-- REVOKE ALL ON FUNCTION public.claim_creator_signup_bonus(uuid) FROM PUBLIC, anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.claim_creator_signup_bonus(uuid) TO authenticated;
-- REVOKE ALL ON FUNCTION public.claim_genesis_signup_bonus(uuid) FROM PUBLIC, anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.claim_genesis_signup_bonus(uuid) TO authenticated;
-- REVOKE ALL ON FUNCTION public.create_onboarding_citizen(jsonb) FROM PUBLIC, anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.create_onboarding_citizen(jsonb) TO authenticated;
-- REVOKE ALL ON FUNCTION public.get_action_intent_card(uuid) FROM PUBLIC, anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.get_action_intent_card(uuid) TO authenticated;
-- REVOKE ALL ON FUNCTION public.get_citizen_by_phone(text) FROM PUBLIC, anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.get_citizen_by_phone(text) TO authenticated;
-- REVOKE ALL ON FUNCTION public.get_platform_security_status() FROM PUBLIC, anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.get_platform_security_status() TO authenticated;
-- REVOKE ALL ON FUNCTION public.get_staking_stats() FROM PUBLIC, anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.get_staking_stats() TO authenticated;
-- REVOKE ALL ON FUNCTION public.grant_intent_approval(uuid, integer, text) FROM PUBLIC, anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.grant_intent_approval(uuid, integer, text) TO authenticated;
-- REVOKE ALL ON FUNCTION public.link_citizen_auth_by_id(uuid) FROM PUBLIC, anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.link_citizen_auth_by_id(uuid) TO authenticated;
-- REVOKE ALL ON FUNCTION public.request_action_approval(uuid, text, numeric, text) FROM PUBLIC, anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.request_action_approval(uuid, text, numeric, text) TO authenticated;
-- REVOKE ALL ON FUNCTION public.verify_address_funds(uuid, text, text) FROM PUBLIC, anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.verify_address_funds(uuid, text, text) TO authenticated;
-- REVOKE ALL ON FUNCTION public.verify_government_id(uuid, text) FROM PUBLIC, anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.verify_government_id(uuid, text) TO authenticated;
-- REVOKE ALL ON FUNCTION public.verify_payid(uuid, text) FROM PUBLIC, anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.verify_payid(uuid, text) TO authenticated;
-- REVOKE ALL ON FUNCTION public.claim_genesis_signup_bonus_anon(uuid) FROM PUBLIC, anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.claim_genesis_signup_bonus_anon(uuid) TO service_role;
-- REVOKE ALL ON FUNCTION public.link_citizen_auth(text, uuid) FROM PUBLIC, anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.link_citizen_auth(text, uuid) TO service_role;
--
-- COMMIT;

-- ===== Verification (read-only). Expected anon-executable count: 42 now, 24 after Section A, 9 after Section B =====
select count(*) filter (where has_function_privilege('anon', p.oid, 'execute')) as anon_executable,
       count(*) filter (where has_function_privilege('authenticated', p.oid, 'execute')) as authenticated_executable,
       count(*) as total_security_definer
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef and p.prokind in ('f', 'p');
