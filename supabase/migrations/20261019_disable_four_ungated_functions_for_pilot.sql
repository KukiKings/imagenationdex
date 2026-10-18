-- Disable four ungated money-moving functions for the December pilot (fail closed).
-- Does not touch agent_registry or threshold_approvals. Re-enable by restoring the prior function bodies.
DO $mig$
DECLARE r record; v_def text; v_new text; v_guard text;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'
      AND p.proname IN ('purchase_listing','repay_loan','unstake_position','claim_staking_rewards')
  LOOP
    v_def := pg_get_functiondef(r.oid);
    IF v_def LIKE '%DISABLED_FOR_PILOT%' THEN CONTINUE; END IF;
    v_guard := format('  RAISE EXCEPTION %L;', 'DISABLED_FOR_PILOT: ' || r.proname || ' is not enabled in the December pilot.');
    v_new := regexp_replace(v_def, '(\mBEGIN\M[[:space:]]*\n)', E'\\1' || replace(v_guard, '\', '\\') || E'\n', 'i');
    IF v_new = v_def OR position(v_guard in v_new) = 0 THEN
      RAISE EXCEPTION 'guard injection failed for %', r.proname;
    END IF;
    EXECUTE v_new;
  END LOOP;
END
$mig$;
