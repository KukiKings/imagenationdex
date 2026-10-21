-- S9 Section B auth guard: public.link_citizen_auth(p_phone text, p_auth_id uuid)
-- Applied to project zljgthfzbalsunuoohcd. LANGUAGE sql converted to plpgsql so it can raise. Anon EXECUTE grant intentionally kept; service_role passes.
CREATE OR REPLACE FUNCTION public.link_citizen_auth(p_phone text, p_auth_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- s9-auth-guard: reject calls with no session (service_role passes). S9 Section B.
  IF auth.uid() IS NULL AND coalesce(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000';
  END IF;
  UPDATE citizens SET auth_user_id = p_auth_id WHERE phone_number = p_phone AND auth_user_id IS NULL;
END
$function$;
