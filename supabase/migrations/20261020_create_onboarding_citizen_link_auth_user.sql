-- create_onboarding_citizen: link citizens.auth_user_id and never create a second row for a signed-in user.
-- Applied live as migration `create_onboarding_citizen_link_auth_user`.
-- Signed-in user with an existing citizen row: UPDATE that row (referred_by only if empty).
-- Signed-in user with no row: INSERT with auth_user_id = auth.uid().
-- Not signed in: INSERT with auth_user_id NULL (unchanged behaviour).
CREATE OR REPLACE FUNCTION public.create_onboarding_citizen(p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
  v_uid uuid := auth.uid();
BEGIN
  -- Signed-in user who already has a citizen row: update it, never insert a second one.
  IF v_uid IS NOT NULL THEN
    SELECT id INTO v_id FROM citizens WHERE auth_user_id = v_uid FOR UPDATE;
    IF FOUND THEN
      UPDATE citizens SET
        citizen_name         = coalesce(p_payload->>'citizen_name', citizen_name),
        phone_number         = coalesce(p_payload->>'phone_number', phone_number),
        email                = coalesce(p_payload->>'email', email),
        web3_domain          = coalesce(p_payload->>'web3_domain', web3_domain),
        referred_by          = coalesce(referred_by, p_payload->>'referred_by'),
        account_type         = coalesce(p_payload->>'account_type', account_type),
        business_metadata    = coalesce(p_payload->'business_metadata', business_metadata),
        jurisdiction_country = coalesce(p_payload->>'jurisdiction_country', jurisdiction_country),
        updated_at           = now()
      WHERE id = v_id;
      RETURN jsonb_build_object('success', true, 'id', v_id, 'action', 'updated');
    END IF;
  END IF;

  INSERT INTO citizens (citizen_name, phone_number, email, web3_domain, kyc_tier, referred_by, account_type, business_metadata, jurisdiction_country, auth_user_id)
  VALUES (
    p_payload->>'citizen_name',
    p_payload->>'phone_number',
    p_payload->>'email',
    p_payload->>'web3_domain',
    0,
    p_payload->>'referred_by',
    coalesce(p_payload->>'account_type', 'citizen'),
    p_payload->'business_metadata',
    p_payload->>'jurisdiction_country',
    v_uid
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('success', true, 'id', v_id, 'action', 'inserted');
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('success', false, 'reason', 'duplicate', 'detail', SQLERRM);
END;
$function$;
