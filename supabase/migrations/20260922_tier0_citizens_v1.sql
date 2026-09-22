-- Tier-0: a real person record after email OTP.
-- Does NOT create a wallet, issue a domain, or move funds.
-- Domain reservation stays on reserve_domain() after auth.uid() exists.

CREATE TABLE IF NOT EXISTS public.citizens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  region TEXT,
  date_of_birth DATE,
  guardian_email TEXT,
  under_18 BOOLEAN NOT NULL DEFAULT false,
  web3_domain TEXT,
  tier TEXT NOT NULL DEFAULT 'tier0_info',
  status TEXT NOT NULL DEFAULT 'preview',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.citizens ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.citizens ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.citizens ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.citizens ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.citizens ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.citizens ADD COLUMN IF NOT EXISTS guardian_email TEXT;
ALTER TABLE public.citizens ADD COLUMN IF NOT EXISTS under_18 BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.citizens ADD COLUMN IF NOT EXISTS web3_domain TEXT;
ALTER TABLE public.citizens ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'tier0_info';
ALTER TABLE public.citizens ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'preview';
ALTER TABLE public.citizens ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS citizens_auth_user_idx ON public.citizens(auth_user_id);
CREATE INDEX IF NOT EXISTS citizens_email_idx ON public.citizens(email);

ALTER TABLE public.citizens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "citizen reads self" ON public.citizens;
CREATE POLICY "citizen reads self" ON public.citizens
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "citizen updates self" ON public.citizens;
CREATE POLICY "citizen updates self" ON public.citizens
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

GRANT SELECT, UPDATE ON public.citizens TO authenticated;

CREATE OR REPLACE FUNCTION public.upsert_tier0_profile(
  p_display_name TEXT,
  p_region TEXT,
  p_date_of_birth DATE,
  p_guardian_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT;
  v_under BOOLEAN := false;
  v_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'sign_in_required');
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;

  IF p_date_of_birth IS NOT NULL AND p_date_of_birth > (current_date - INTERVAL '18 years') THEN
    v_under := true;
    IF p_guardian_email IS NULL OR position('@' in p_guardian_email) = 0 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'guardian_email_required');
    END IF;
  END IF;

  INSERT INTO public.citizens (
    auth_user_id, display_name, email, region, date_of_birth,
    guardian_email, under_18, tier, status, updated_at
  ) VALUES (
    v_uid,
    nullif(btrim(p_display_name), ''),
    v_email,
    nullif(btrim(p_region), ''),
    p_date_of_birth,
    CASE WHEN v_under THEN lower(btrim(p_guardian_email)) ELSE NULL END,
    v_under,
    'tier0_info',
    'preview',
    now()
  )
  ON CONFLICT (auth_user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email,
    region = EXCLUDED.region,
    date_of_birth = EXCLUDED.date_of_birth,
    guardian_email = EXCLUDED.guardian_email,
    under_18 = EXCLUDED.under_18,
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'ok', true,
    'citizen_id', v_id,
    'tier', 'tier0_info',
    'under_18', v_under,
    'wallet', false,
    'domain_issued', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_tier0_profile(TEXT, TEXT, DATE, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_tier0_profile(TEXT, TEXT, DATE, TEXT) TO authenticated, service_role;
