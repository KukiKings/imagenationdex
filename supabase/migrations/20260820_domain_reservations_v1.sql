-- Real domain-handle reservation, replacing the sessionStorage-only stub in
-- claim-domain.html. claim_sovereign_domain never existed in the live
-- database (found 2026-08-20) — this is the real RPC that comment promised.
--
-- Scope, deliberately: this RECORDS a reservation. It does not mint on
-- Solana, does not issue a subdomain, and does not touch the token. Actual
-- domain issuance is still Planned (see siindex-public/utility-directory.html,
-- Grand Sync 24 Jan 2027). Reserving now just means: the name is taken,
-- tied to a real citizen, first-come-first-served, and it survives across
-- devices instead of living only in one browser's sessionStorage.

CREATE TABLE IF NOT EXISTS public.domain_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id UUID NOT NULL REFERENCES public.citizens(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS domain_reservations_citizen_idx ON public.domain_reservations(citizen_id);

ALTER TABLE public.domain_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "citizens can view own reservations" ON public.domain_reservations
  FOR SELECT USING (
    citizen_id IN (SELECT id FROM public.citizens WHERE auth_user_id = auth.uid())
  );

GRANT SELECT ON public.domain_reservations TO authenticated;

-- Reserve a handle for the signed-in citizen. Requires a real auth session
-- (auth.uid() must resolve) — same requirement as set_siindex_personal_pause,
-- because anon-created citizens (phone flow, no OTP yet) have no session to
-- scope this to and must not be able to reserve on someone else's behalf.
CREATE OR REPLACE FUNCTION public.reserve_domain(p_domain TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_citizen_id UUID;
  v_clean TEXT;
  v_existing UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'sign_in_required');
  END IF;

  SELECT id INTO v_citizen_id FROM public.citizens WHERE auth_user_id = auth.uid();
  IF v_citizen_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_citizen_record');
  END IF;

  v_clean := lower(regexp_replace(coalesce(p_domain, ''), '[^a-z0-9]', '', 'gi'));
  IF length(v_clean) < 3 OR length(v_clean) > 30 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_length');
  END IF;

  -- Already reserved by this citizen? Idempotent success, not a duplicate error.
  SELECT id INTO v_existing FROM public.domain_reservations
    WHERE citizen_id = v_citizen_id AND domain = v_clean;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'domain', v_clean, 'already_reserved', true);
  END IF;

  IF EXISTS (SELECT 1 FROM public.domain_reservations WHERE domain = v_clean)
     OR EXISTS (SELECT 1 FROM public.citizens WHERE web3_domain = v_clean || '.IN$DEX') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'taken');
  END IF;

  INSERT INTO public.domain_reservations (citizen_id, domain) VALUES (v_citizen_id, v_clean);
  RETURN jsonb_build_object('ok', true, 'domain', v_clean, 'already_reserved', false);
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_domain(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_domain(TEXT) TO authenticated, service_role;

-- Real, honest count for the UI. No names, no timestamps, no invented
-- baseline — just how many real reservations exist right now.
CREATE OR REPLACE FUNCTION public.get_domain_reservation_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT count(*)::INTEGER FROM public.domain_reservations;
$$;

GRANT EXECUTE ON FUNCTION public.get_domain_reservation_count() TO anon, authenticated;
