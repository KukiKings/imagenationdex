-- Backfilled 2026-09-17: applied live via mcp__Supabase__apply_migration during an
-- assisted session. Registered in supabase_migrations.schema_migrations as this exact
-- version at the time it was applied -- this file brings the repo's tracked history in
-- line with what is already live; it does not re-apply anything on its own (a fresh
-- `supabase db push` against a NEW project would still create everything correctly,
-- since every statement below is written to be safe to run once from empty).
-- Context: BUILD_LOG.md, "Built the real collateral escrow" (17 Sep 2026).

-- Real USDC collateral escrow — schema + wiring, 2026-09-17.
--
-- This is the real-verification system the 2026-09-17 borrow_from_pool hardening
-- pointed at. It is built, safe, and inert by default: no vault address is configured,
-- so create_collateral_deposit_intent below refuses to issue references, and
-- collateral_deposits stays empty, so borrow_from_pool continues to safely refuse every
-- request exactly as it did under the plain hard-block. Nothing here changes behavior
-- until a real vault address is configured AND a real webhook starts confirming
-- deposits AND EXECUTE on borrow_from_pool is deliberately re-granted to authenticated
-- (still revoked as of this migration).

-- ── Non-secret platform config (public Solana addresses, not credentials) ──
CREATE TABLE IF NOT EXISTS public.lending_config (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lending_config ENABLE ROW LEVEL SECURITY;
-- No policies: default-deny for anon/authenticated. Only postgres/service_role can read
-- or write this table (matches the pattern already flagged as safe-by-default elsewhere
-- in this schema's RLS-enabled-no-policy tables).

-- ── A citizen requests a deposit reference before sending USDC ──
CREATE TABLE IF NOT EXISTS public.collateral_deposit_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id uuid NOT NULL REFERENCES public.citizens(id),
  reference text NOT NULL UNIQUE,
  vault_address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  used_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_collateral_deposit_intents_reference ON public.collateral_deposit_intents (reference);
ALTER TABLE public.collateral_deposit_intents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS collateral_deposit_intents_select_own ON public.collateral_deposit_intents;
CREATE POLICY collateral_deposit_intents_select_own ON public.collateral_deposit_intents
  FOR SELECT USING (citizen_id IN (SELECT id FROM public.citizens WHERE auth_user_id = auth.uid()));
-- No INSERT/UPDATE policy for authenticated/anon — rows are only ever created by
-- create_collateral_deposit_intent (SECURITY DEFINER) and only ever updated by the
-- webhook (service_role).

-- ── A real, on-chain-confirmed USDC transfer, recorded only by the webhook ──
CREATE TABLE IF NOT EXISTS public.collateral_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id uuid NOT NULL REFERENCES public.citizens(id),
  intent_id uuid REFERENCES public.collateral_deposit_intents(id),
  tx_signature text NOT NULL UNIQUE,
  vault_address text NOT NULL,
  mint text NOT NULL CHECK (mint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), -- real mainnet USDC mint only
  usdc_amount numeric NOT NULL CHECK (usdc_amount > 0),
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz,
  consumed_by_position_id uuid REFERENCES public.lending_positions(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_collateral_deposits_citizen_unconsumed
  ON public.collateral_deposits (citizen_id) WHERE consumed_at IS NULL;
ALTER TABLE public.collateral_deposits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS collateral_deposits_select_own ON public.collateral_deposits;
CREATE POLICY collateral_deposits_select_own ON public.collateral_deposits
  FOR SELECT USING (citizen_id IN (SELECT id FROM public.citizens WHERE auth_user_id = auth.uid()));
-- No INSERT/UPDATE policy for authenticated/anon — only the webhook (service_role) and
-- borrow_from_pool (SECURITY DEFINER, marks consumed_at) ever write to this table.

-- ── RPC: citizen requests a reference before sending USDC ──
CREATE OR REPLACE FUNCTION public.create_collateral_deposit_intent(p_citizen_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_vault_address text;
  v_reference text;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM citizens WHERE id = p_citizen_id AND auth_user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not_authorized: caller does not own this citizen record';
  END IF;

  SELECT value INTO v_vault_address FROM public.lending_config WHERE key = 'vault_address';
  IF v_vault_address IS NULL OR v_vault_address = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Collateral custody is not configured yet. Borrowing against USDC is not live.');
  END IF;

  v_reference := 'COL-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  INSERT INTO public.collateral_deposit_intents (citizen_id, reference, vault_address)
  VALUES (p_citizen_id, v_reference, v_vault_address);

  RETURN jsonb_build_object(
    'success', true,
    'reference', v_reference,
    'vault_address', v_vault_address,
    'mint', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    'expires_in_hours', 48,
    'instructions', 'Send USDC to vault_address on Solana with this reference included as a memo. The deposit is credited automatically once confirmed on-chain -- do not send without the memo, it cannot be matched to your account otherwise.'
  );
END;
$function$;
GRANT EXECUTE ON FUNCTION public.create_collateral_deposit_intent(uuid) TO authenticated;

-- ── borrow_from_pool: now checks real confirmed collateral, not a caller-supplied number ──
CREATE OR REPLACE FUNCTION public.borrow_from_pool(p_citizen_id uuid, p_usdc_collateral numeric, p_borrow_indx numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_citizen          RECORD;
  v_deposit          RECORD;
  v_position_id      UUID;
  v_collateral_ratio NUMERIC;
  INDX_PRICE         CONSTANT NUMERIC := 0.24;
  MIN_RATIO          CONSTANT NUMERIC := 150.0;
  v_gate             jsonb;
BEGIN
  -- SECURITY FIX 2026-09-17 (superseding the same-day hard-block): p_usdc_collateral is
  -- a legacy parameter kept only for call-signature compatibility with
  -- lending-dashboard.html's existing (currently unreachable — EXECUTE is not granted to
  -- authenticated/anon) call site. It is IGNORED for the collateral check below. The real
  -- collateral amount is always read from a matching row in collateral_deposits, which is
  -- only ever populated by the collateral-deposit webhook after Helius confirms a real
  -- on-chain USDC transfer into the configured vault, referenced back to this citizen via
  -- create_collateral_deposit_intent. Until a vault is configured and that webhook is
  -- live, collateral_deposits stays empty and every borrow request below correctly and
  -- safely fails with "no verified on-chain USDC collateral."
  IF auth.uid() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM citizens WHERE id = p_citizen_id AND auth_user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not_authorized: caller does not own this citizen record';
  END IF;

  SELECT * INTO v_citizen FROM public.citizens WHERE id = p_citizen_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Citizen not found');
  END IF;

  IF p_borrow_indx <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Borrow amount must be greater than zero');
  END IF;

  SELECT * INTO v_deposit
  FROM public.collateral_deposits
  WHERE citizen_id = p_citizen_id
    AND consumed_at IS NULL
    AND usdc_amount >= (p_borrow_indx * INDX_PRICE * MIN_RATIO / 100)
  ORDER BY usdc_amount ASC, confirmed_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No verified on-chain USDC collateral found for this amount. Real collateral custody is not live yet.');
  END IF;

  v_collateral_ratio := (v_deposit.usdc_amount / (p_borrow_indx * INDX_PRICE)) * 100;

  v_gate := request_action_approval(p_citizen_id, 'borrow_from_pool', p_borrow_indx, 'Borrow ' || p_borrow_indx || ' INDX against ' || v_deposit.usdc_amount || ' USDC verified collateral (deposit ' || v_deposit.id || ')');
  IF (v_gate->>'gate_required')::boolean THEN
    RETURN jsonb_build_object('success', false, 'pending_approval', true, 'intent_id', v_gate->>'intent_id', 'message', v_gate->>'message');
  END IF;

  INSERT INTO public.lending_positions (citizen_id, position_type, indx_amount, usdc_collateral, collateral_ratio, status)
  VALUES (p_citizen_id, 'borrow', p_borrow_indx, v_deposit.usdc_amount, v_collateral_ratio, 'active')
  RETURNING id INTO v_position_id;

  UPDATE public.collateral_deposits SET consumed_at = NOW(), consumed_by_position_id = v_position_id WHERE id = v_deposit.id;

  UPDATE public.citizens SET indx_balance = indx_balance + p_borrow_indx WHERE id = p_citizen_id;

  INSERT INTO public.security_events (tier, zone, description, detail)
  VALUES ('T1', 'lending', 'Lending borrow (real verified collateral)',
          jsonb_build_object('citizen_id', p_citizen_id, 'borrow_indx', p_borrow_indx, 'usdc_collateral', v_deposit.usdc_amount, 'deposit_id', v_deposit.id, 'collateral_ratio', v_collateral_ratio, 'position_id', v_position_id));

  RETURN jsonb_build_object('success', true, 'position_id', v_position_id, 'borrow_indx', p_borrow_indx,
    'usdc_collateral', v_deposit.usdc_amount, 'collateral_ratio', v_collateral_ratio, 'new_balance', v_citizen.indx_balance + p_borrow_indx);
END;
$function$;
-- EXECUTE grants on borrow_from_pool deliberately left untouched (still postgres/service_role
-- only) -- re-granting to authenticated is a launch decision for AJ once the vault + webhook
-- are real and tested, not something this migration does.
