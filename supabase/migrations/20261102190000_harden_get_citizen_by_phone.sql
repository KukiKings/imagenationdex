-- Harden public.get_citizen_by_phone(text).
--
-- Before: SECURITY DEFINER, EXECUTE granted to anon, authenticated and service_role.
--   Any caller with the anon key got {id} for a registered phone and null otherwise
--   (phone enumeration), and the founder / owner branches returned full rows.
-- After:  signed-in callers only. A caller gets a row only for a citizens row whose
--   phone_number matches the input AND whose auth_user_id is the caller. A missing
--   number and a number owned by someone else take the same code path and return the
--   same null.
--
-- Behaviour change for callers (not edited here): login.html, send.html,
-- biometric-kyc.html, account-recovery.html and agents/kyc-agent.js. See the
-- accompanying report. Not applied to production by this file being committed.

create or replace function public.get_citizen_by_phone(p_phone text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  calling_user uuid;
  result json;
begin
  calling_user := auth.uid();

  if calling_user is null then
    raise exception 'not authenticated';
  end if;

  select json_build_object(
           'id', c.id,
           'citizen_name', c.citizen_name,
           'wisdom_score', c.wisdom_score,
           'indx_balance', c.indx_balance,
           'web3_domain', c.web3_domain
         )
    into result
    from public.citizens c
   where c.phone_number = p_phone
     and c.auth_user_id = calling_user
   limit 1;

  -- null when no row, or when the row belongs to someone else: same path, same return.
  return result;
end;
$$;

revoke execute on function public.get_citizen_by_phone(text) from public, anon, authenticated;
grant execute on function public.get_citizen_by_phone(text) to authenticated;
