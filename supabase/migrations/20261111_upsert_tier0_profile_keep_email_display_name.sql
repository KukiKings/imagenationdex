-- upsert_tier0_profile: stop overwriting email and display_name with empty values on repeat sign-ins.
-- Only two ON CONFLICT lines changed from 20261111_upsert_tier0_profile_keep_existing.sql.
-- A null or empty incoming email / display_name now leaves the stored value alone.
-- under_18, region, date_of_birth and guardian_email behave as before.
CREATE OR REPLACE FUNCTION public.upsert_tier0_profile(p_display_name text, p_region text, p_date_of_birth date, p_guardian_email text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    display_name = COALESCE(nullif(btrim(EXCLUDED.display_name), ''), public.citizens.display_name),
    email = COALESCE(nullif(btrim(EXCLUDED.email), ''), public.citizens.email),
    region = COALESCE(EXCLUDED.region, public.citizens.region),
    date_of_birth = COALESCE(EXCLUDED.date_of_birth, public.citizens.date_of_birth),
    guardian_email = COALESCE(EXCLUDED.guardian_email, public.citizens.guardian_email),
    under_18 = CASE WHEN EXCLUDED.date_of_birth IS NOT NULL THEN EXCLUDED.under_18 ELSE public.citizens.under_18 END,
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
$function$;
