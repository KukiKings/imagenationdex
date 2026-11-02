-- Hardened public.get_citizen_by_phone(text).
-- NOT APPLIED to any database by committing this file. Test on staging first.
--
-- Behaviour change vs the live function: no founder branch, no genesis_citizen,
-- no {id}-only answer. Anonymous callers lose EXECUTE. Callers get a row only
-- for their own citizen, and only when the phone on the citizen row and the
-- phone on the caller's auth.users row both equal the input phone after digit
-- normalization. Missing and non-owned return the same null.
--
-- PERFORMANCE: this compares regexp_replace(...) on every citizens row, so it
-- cannot use an index. Before citizens grows past a few thousand rows, add a
-- persisted normalized phone column (or a trigram index on the normalized
-- expression) and compare against that instead.
create or replace function public.get_citizen_by_phone(p_phone text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  calling_user uuid;
  norm_in text;
  result json;
begin
  -- belt and braces: the SET clause above already pins this for the call
  perform pg_catalog.set_config('search_path', '', true);

  calling_user := auth.uid();
  if calling_user is null then
    raise exception 'not authenticated';
  end if;

  norm_in := pg_catalog.regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  -- empty or short input is "no match", never a wildcard
  if pg_catalog.length(norm_in) < 10 then
    return null;
  end if;

  select pg_catalog.json_build_object(
           'id', c.id,
           'citizen_name', c.citizen_name,
           'wisdom_score', c.wisdom_score,
           'indx_balance', c.indx_balance,
           'web3_domain', c.web3_domain)
    into result
    from public.citizens c
    join auth.users u on u.id = c.auth_user_id
   where c.auth_user_id = calling_user
     and pg_catalog.regexp_replace(coalesce(c.phone_number, ''), '[^0-9]', '', 'g') = norm_in
     and pg_catalog.regexp_replace(coalesce(u.phone, ''), '[^0-9]', '', 'g') = norm_in
   limit 1;

  return result;
end;
$$;

revoke execute on function public.get_citizen_by_phone(text) from public, anon, authenticated;
grant execute on function public.get_citizen_by_phone(text) to authenticated;
