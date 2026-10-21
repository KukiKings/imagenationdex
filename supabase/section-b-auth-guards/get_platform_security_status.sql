-- S9 Section B auth guard: public.get_platform_security_status()
-- Applied to project zljgthfzbalsunuoohcd. LANGUAGE sql converted to plpgsql so it can raise. Anon EXECUTE grant intentionally kept; service_role passes.
CREATE OR REPLACE FUNCTION public.get_platform_security_status()
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
  RETURN (SELECT jsonb_build_object('tier', COALESCE((SELECT tier FROM public.security_events WHERE resolved = false ORDER BY CASE tier WHEN 'T4' THEN 4 WHEN 'T3' THEN 3 WHEN 'T2' THEN 2 WHEN 'T1' THEN 1 ELSE 0 END DESC, created_at DESC LIMIT 1), 'T0'), 'clear', NOT EXISTS (SELECT 1 FROM public.security_events WHERE resolved = false AND tier <> 'T0'), 'open_count', (SELECT COUNT(*) FROM public.security_events WHERE resolved = false AND tier <> 'T0'), 'last_scan_at', (SELECT MAX(created_at) FROM public.security_events WHERE description ILIKE '%Security Scan%')));
END
$function$;
