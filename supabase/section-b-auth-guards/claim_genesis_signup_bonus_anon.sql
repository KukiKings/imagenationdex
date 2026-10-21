-- S9 Section B auth guard: public.claim_genesis_signup_bonus_anon(uuid)
-- Applied to project zljgthfzbalsunuoohcd. Anon EXECUTE grant intentionally kept; service_role passes.
DO $mig$
DECLARE d text; n text;
BEGIN
  SELECT pg_get_functiondef('public.claim_genesis_signup_bonus_anon(uuid)'::regprocedure) INTO d;
  IF d LIKE '%s9-auth-guard%' THEN RAISE NOTICE 'already guarded'; RETURN; END IF;
  n := regexp_replace(d, '\mBEGIN\M', E'BEGIN\n  -- s9-auth-guard: reject calls with no session (service_role passes). S9 Section B.\n  IF auth.uid() IS NULL AND coalesce(auth.role(), '''') <> ''service_role'' THEN\n    RAISE EXCEPTION ''authentication required'' USING ERRCODE = ''28000'';\n  END IF;', 'i');
  IF n = d THEN RAISE EXCEPTION 'no BEGIN found'; END IF;
  EXECUTE n;
END
$mig$;
