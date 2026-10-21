-- S9 Section C hardening (docs/section-c-auth-review.md, fixes F1-F4).
-- Applied to project zljgthfzbalsunuoohcd as migration s9_section_c_hardening.
-- Kept outside supabase/migrations so CI does not re-run it. Idempotent.

-- F1 + F2: toggle_kill_switch
--   F1: engaged_by records the verified caller uid (plus the supplied label), not free text alone.
--   F2: denied attempts are logged and the function RETURNs NULL instead of RAISE, so the
--       log row is not rolled back. security_events is immutable (no update/delete), so
--       non-founder attempts are logged at T2 (not T4) and rate-limited (3 per caller and
--       20 total per hour) so an ordinary account cannot flood the permanent log.
--       Callers must treat a NULL result as "denied".
CREATE OR REPLACE FUNCTION public.toggle_kill_switch(p_engaged boolean, p_engaged_by text, p_reason text)
 RETURNS siindex_kill_switch
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_row public.siindex_kill_switch; v_by text;
begin
  -- s9c-hardening
  IF NOT is_founder() THEN
    IF (SELECT count(*) FROM public.security_events
          WHERE zone = 'kill_switch_unauthorized_attempt' AND created_at > now() - interval '1 hour'
            AND (detail->>'caller') IS NOT DISTINCT FROM auth.uid()::text) < 3
       AND (SELECT count(*) FROM public.security_events
          WHERE zone = 'kill_switch_unauthorized_attempt' AND created_at > now() - interval '1 hour') < 20 THEN
      INSERT INTO security_events (tier, zone, description, detail)
      VALUES ('T2', 'kill_switch_unauthorized_attempt', 'Non-founder attempted to toggle the Sovereign Pause',
              jsonb_build_object('caller', auth.uid(), 'attempted_engaged', p_engaged));
    END IF;
    RETURN NULL;
  END IF;
  IF NOT is_founder_aal2() THEN
    INSERT INTO security_events (tier, zone, description, detail)
    VALUES ('T3', 'kill_switch_aal_insufficient', 'Founder attempted Sovereign Pause without AAL2 (MFA) step-up',
            jsonb_build_object('caller', auth.uid(), 'attempted_engaged', p_engaged));
    RETURN NULL;
  END IF;

  v_by := coalesce(auth.uid()::text, 'unknown')
          || CASE WHEN nullif(btrim(p_engaged_by), '') IS NOT NULL THEN ' (' || left(btrim(p_engaged_by), 80) || ')' ELSE '' END;

  update public.siindex_kill_switch
  set engaged = p_engaged,
      engaged_by = case when p_engaged then v_by else null end,
      engaged_at = case when p_engaged then now() else null end,
      reason = case when p_engaged then p_reason else null end
  where id = 1
  returning * into v_row;

  insert into public.security_events (tier, zone, description, detail)
  values (case when p_engaged then 'T4' else 'T0' end, 'siindex_orchestrator',
    case when p_engaged then 'SIINDEX Sovereign Pause engaged' else 'SIINDEX Sovereign Pause released' end,
    jsonb_build_object('engaged', p_engaged, 'by', v_by, 'caller', auth.uid(), 'reason', p_reason, 'aal', 'aal2'));

  return v_row;
end; $function$;

-- F3: require aal2 on six functions that were is_founder()-only.
DO $mig$
DECLARE
  fn text; d text; n text;
  sigs text[] := ARRAY[
    'public.read_session_messages_under_investigation(uuid,uuid)',
    'public.assign_incident_commander(uuid,text,text)',
    'public.review_reported_indicator(uuid,text,text)',
    'public.sweep_expired_test_actors()',
    'public.record_positive_test_step(text,integer,text,text,text,boolean,jsonb)'];
BEGIN
  FOREACH fn IN ARRAY sigs LOOP
    d := pg_get_functiondef(fn::regprocedure);
    IF d LIKE '%s9c-aal2%' THEN CONTINUE; END IF;
    n := replace(d, E'IF NOT is_founder() THEN RAISE EXCEPTION ''not_authorized''; END IF;',
                    E'IF NOT is_founder_aal2() THEN RAISE EXCEPTION ''step_up_required: requires an MFA-verified (AAL2) session''; END IF; -- s9c-aal2');
    IF n = d THEN RAISE EXCEPTION 'pattern not found in %', fn; END IF;
    EXECUTE n;
  END LOOP;

  -- request_investigation_access keeps its jsonb failure shape.
  fn := 'public.request_investigation_access(text,text,uuid,uuid,text[],text,numeric)';
  d := pg_get_functiondef(fn::regprocedure);
  IF d NOT LIKE '%s9c-aal2%' THEN
    n := replace(d, 'IF NOT is_founder() THEN', 'IF NOT is_founder_aal2() THEN -- s9c-aal2');
    n := replace(n, '''reason'', ''not_authorized''', '''reason'', ''step_up_required''');
    IF n = d THEN RAISE EXCEPTION 'pattern not found in %', fn; END IF;
    EXECUTE n;
  END IF;
END
$mig$;

-- F4: no direct write privileges for API roles on the two founder-control tables.
-- SELECT is kept (the founder-read RLS policies need it); writes go only through SECURITY DEFINER functions.
REVOKE INSERT, UPDATE ON public.founder_authority FROM anon, authenticated;
REVOKE INSERT, UPDATE ON public.siindex_kill_switch FROM anon, authenticated;
