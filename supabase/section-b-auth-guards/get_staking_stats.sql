-- S9 Section B auth guard: public.get_staking_stats()
-- Applied to project zljgthfzbalsunuoohcd. LANGUAGE sql converted to plpgsql so it can raise. Anon EXECUTE grant intentionally kept; service_role passes.
CREATE OR REPLACE FUNCTION public.get_staking_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- s9-auth-guard: reject calls with no session (service_role passes). S9 Section B.
  IF auth.uid() IS NULL AND coalesce(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000';
  END IF;
  RETURN (SELECT jsonb_build_object('total_staked', coalesce((SELECT SUM(amount_indx) FROM public.staking_positions WHERE status = 'active'), 0), 'total_stakers', coalesce((SELECT COUNT(DISTINCT citizen_id) FROM public.staking_positions WHERE status = 'active'), 0), 'total_rewards_paid', coalesce((SELECT SUM(rewards_claimed) FROM public.staking_positions), 0)));
END
$function$;
