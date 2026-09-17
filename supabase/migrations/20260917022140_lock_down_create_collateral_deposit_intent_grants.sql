-- Backfilled 2026-09-17: applied live via mcp__Supabase__apply_migration during an
-- assisted session. Registered in supabase_migrations.schema_migrations as this exact
-- version at the time it was applied -- this file brings the repo's tracked history in
-- line with what is already live; it does not re-apply anything (REVOKE/GRANT are
-- idempotent).
-- Context: BUILD_LOG.md, "Built the real collateral escrow" (17 Sep 2026).

-- SELF-CAUGHT FIX 2026-09-17: CREATE FUNCTION implicitly grants EXECUTE to PUBLIC unless
-- revoked, which meant anon (unauthenticated) could also call
-- create_collateral_deposit_intent -- and since its auth.uid() ownership check is skipped
-- entirely when auth.uid() IS NULL (same pattern as borrow_from_pool/repay_loan, which are
-- safe only because they are NOT granted to anon), an anonymous caller could have created
-- deposit-reference intents attached to any citizen_id. Locking this down to authenticated
-- only, matching every other citizen-scoped RPC in this schema.
REVOKE EXECUTE ON FUNCTION public.create_collateral_deposit_intent(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_collateral_deposit_intent(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_collateral_deposit_intent(uuid) TO authenticated;
