-- upsert_tier0_profile: stop wiping region, date_of_birth and guardian_email on repeat sign-ins.
-- Only these ON CONFLICT lines changed. A null or empty incoming value now leaves the stored value alone.
-- under_18 follows date_of_birth: it is only rewritten when a new date_of_birth is supplied,
-- otherwise a minor's flag would reset to false while the stored date still says minor.
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
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email,
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
