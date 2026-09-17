-- Backfilled 2026-09-17: applied live via mcp__Supabase__apply_migration during an
-- assisted session (see DEPLOYMENT.md Section 2 "two supported ways to apply one").
-- Registered in supabase_migrations.schema_migrations as this exact version at the
-- time it was applied -- this file brings the repo's tracked history in line with
-- what is already live and already recorded remotely; it does not re-apply anything.
-- Context: BUILD_LOG.md, "Fixed a live vulnerability in borrow_from_pool" (17 Sep 2026).

CREATE OR REPLACE FUNCTION public.borrow_from_pool(p_citizen_id uuid, p_usdc_collateral numeric, p_borrow_indx numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- SECURITY FIX 2026-09-17: this function previously accepted p_usdc_collateral as a
  -- raw, self-reported caller parameter with NO verification against any real USDC
  -- balance, deposit, or custody record -- none exists anywhere in this schema (no
  -- USDC/fiat column on citizens, no deposit/custody table, no on-chain deposit
  -- monitoring). It computed a collateral ratio against that unverified number and,
  -- if the arithmetic cleared 150%, unconditionally credited real, spendable INDX to
  -- citizens.indx_balance -- i.e. it allowed minting unlimited real INDX by lying
  -- about collateral that was never provided.
  --
  -- EXECUTE on this RPC was already revoked from authenticated/anon on 2026-08-29
  -- (see lending-dashboard.html's "Borrowing is not live yet" banner), so the exploit
  -- was not reachable through the app, and a direct query of lending_positions
  -- confirms zero rows were ever created (no citizen was ever affected). But the
  -- function body itself still contained the unsafe logic, which is a landmine: any
  -- future re-grant of EXECUTE to authenticated (e.g. while wiring up a real feature)
  -- would silently reopen unlimited INDX minting. Hardened here so the function is
  -- safe on its own terms, independent of grants -- it now always returns a clean
  -- "not live" response and can neither create a lending_positions row nor touch
  -- indx_balance.
  --
  -- Superseded later the same day by real_collateral_escrow_schema_and_borrow_from_pool_wiring,
  -- which replaces this hard block with a real confirmed-deposit check. Kept here for
  -- an accurate history.
  IF NOT EXISTS (SELECT 1 FROM public.citizens WHERE id = p_citizen_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Citizen not found');
  END IF;

  RETURN jsonb_build_object(
    'success', false,
    'error', 'Borrowing against USDC collateral is not live yet. Real on-chain collateral custody has not been built, so no USDC deposit can currently be verified.'
  );
END;
$function$;
