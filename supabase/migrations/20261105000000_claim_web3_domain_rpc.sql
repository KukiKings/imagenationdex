-- claim_web3_domain: authenticated user sets web3_domain + citizen_name on their own citizens row.
create or replace function public.claim_web3_domain(p_domain text, p_citizen_name text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_current text;
  v_clean text;
  v_target text;
  v_name text;
  v_has_own_res boolean;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'sign_in_required');
  end if;

  select c.id, c.web3_domain into v_id, v_current
    from public.citizens c
    where c.auth_user_id = v_uid
    for update;
  if v_id is null then
    return jsonb_build_object('ok', false, 'error', 'no_citizen_record');
  end if;

  v_clean := lower(regexp_replace(coalesce(p_domain, ''), '[^a-z0-9]', '', 'gi'));
  if length(v_clean) < 3 or length(v_clean) > 30 then
    return jsonb_build_object('ok', false, 'error', 'invalid_length');
  end if;
  v_target := v_clean || '.IN$DEX';

  v_name := left(nullif(btrim(coalesce(p_citizen_name, '')), ''), 60);

  if v_current is not null then
    if lower(v_current) = lower(v_target) then
      if v_name is not null then
        update public.citizens set citizen_name = v_name, updated_at = now() where id = v_id;
      end if;
      return jsonb_build_object('ok', true, 'domain', v_current, 'already_set', true);
    end if;
    return jsonb_build_object('ok', false, 'error', 'already_set', 'domain', v_current);
  end if;

  if exists (select 1 from public.citizens c where lower(c.web3_domain) = lower(v_target) and c.id <> v_id)
     or exists (select 1 from public.domain_reservations r where r.domain = v_clean and r.citizen_id <> v_id) then
    return jsonb_build_object('ok', false, 'error', 'taken');
  end if;

  select exists (select 1 from public.domain_reservations r where r.domain = v_clean and r.citizen_id = v_id)
    into v_has_own_res;
  if not v_has_own_res then
    insert into public.domain_reservations (citizen_id, domain) values (v_id, v_clean);
  end if;

  update public.citizens
     set web3_domain = v_target,
         citizen_name = coalesce(v_name, citizen_name),
         updated_at = now()
   where id = v_id;

  return jsonb_build_object('ok', true, 'domain', v_target, 'claimed_from_reservation', v_has_own_res);
exception when unique_violation then
  return jsonb_build_object('ok', false, 'error', 'taken');
end;
$function$;

revoke all on function public.claim_web3_domain(text, text) from public;
revoke all on function public.claim_web3_domain(text, text) from anon;
grant execute on function public.claim_web3_domain(text, text) to authenticated;
