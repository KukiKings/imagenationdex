-- IN$DEX persistent citizen accounts and recovery
--
-- Supabase Auth owns refresh tokens and session revocation. These tables keep
-- citizen-visible device evidence and recovery receipts. They never store an
-- access token, refresh token, OTP, raw phone number or browser fingerprint.

begin;

create table if not exists public.citizen_account_devices (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  citizen_id uuid not null references public.citizens(id) on delete cascade,
  device_key uuid not null,
  display_label text not null,
  device_family text not null,
  shared_device boolean not null default false,
  first_verified_at timestamptz not null default now(),
  last_verified_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoke_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint citizen_account_device_owner_key_unique unique (auth_user_id, device_key),
  constraint citizen_account_device_label_length check (char_length(display_label) between 1 and 80),
  constraint citizen_account_device_family_check check (
    device_family in ('mobile', 'tablet', 'desktop', 'unknown')
  ),
  constraint citizen_account_device_revoke_reason_length check (
    revoke_reason is null or char_length(revoke_reason) <= 120
  )
);

create index if not exists citizen_account_devices_owner_active_idx
  on public.citizen_account_devices (auth_user_id, last_verified_at desc)
  where revoked_at is null;

alter table public.citizen_account_devices enable row level security;
revoke all on table public.citizen_account_devices from anon, authenticated;
grant select on table public.citizen_account_devices to authenticated;

drop policy if exists citizen_account_devices_select_own on public.citizen_account_devices;
create policy citizen_account_devices_select_own
on public.citizen_account_devices
for select
to authenticated
using ((select auth.uid()) = auth_user_id);

create table if not exists public.citizen_account_receipts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  citizen_id uuid not null references public.citizens(id) on delete cascade,
  device_id uuid references public.citizen_account_devices(id) on delete set null,
  event_type text not null,
  terms_version text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint citizen_account_receipt_event_check check (
    event_type in (
      'account_recovered',
      'other_sessions_secured',
      'global_sign_out_requested'
    )
  ),
  constraint citizen_account_receipt_details_object check (jsonb_typeof(details) = 'object')
);

create index if not exists citizen_account_receipts_owner_created_idx
  on public.citizen_account_receipts (auth_user_id, created_at desc);

alter table public.citizen_account_receipts enable row level security;
revoke all on table public.citizen_account_receipts from anon, authenticated;
grant select on table public.citizen_account_receipts to authenticated;

drop policy if exists citizen_account_receipts_select_own on public.citizen_account_receipts;
create policy citizen_account_receipts_select_own
on public.citizen_account_receipts
for select
to authenticated
using ((select auth.uid()) = auth_user_id);

create or replace function public.get_my_citizen_account()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_result jsonb;
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;

  select jsonb_build_object(
           'ok', true,
           'citizen_id', c.id,
           'display_name', c.citizen_name,
           'domain', c.web3_domain,
           'identity_status', coalesce(i.status, 'legacy'),
           'account_security_hold', coalesce((to_jsonb(c)->>'account_frozen')::boolean, false),
           'card_security_hold', coalesce((to_jsonb(c)->>'card_frozen')::boolean, false),
           'created_at', c.created_at,
           'last_seen_at', c.last_seen_at
         )
    into v_result
    from public.citizens c
    left join public.citizen_identity_claims i
      on i.citizen_id = c.id and i.auth_user_id = v_uid
   where c.auth_user_id = v_uid
   limit 1;

  if v_result is null then
    return jsonb_build_object('ok', false, 'code', 'ACCOUNT_NOT_FOUND');
  end if;

  return v_result;
end;
$$;

revoke all on function public.get_my_citizen_account() from public, anon;
grant execute on function public.get_my_citizen_account() to authenticated;

create or replace function public.register_my_citizen_device(
  p_device_key uuid,
  p_display_label text,
  p_device_family text,
  p_shared_device boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_citizen_id uuid;
  v_phone_confirmed_at timestamptz;
  v_label text;
  v_family text;
  v_device_id uuid;
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;

  if p_device_key is null then
    return jsonb_build_object('ok', false, 'code', 'INVALID_DEVICE');
  end if;

  select u.phone_confirmed_at into v_phone_confirmed_at
    from auth.users u where u.id = v_uid;

  if v_phone_confirmed_at is null then
    return jsonb_build_object('ok', false, 'code', 'PHONE_NOT_VERIFIED');
  end if;

  select c.id into v_citizen_id
    from public.citizens c where c.auth_user_id = v_uid limit 1;

  if v_citizen_id is null then
    return jsonb_build_object('ok', false, 'code', 'ACCOUNT_NOT_FOUND');
  end if;

  v_label := trim(regexp_replace(coalesce(p_display_label, ''), '[[:cntrl:]]', '', 'g'));
  if char_length(v_label) < 1 or char_length(v_label) > 80 then
    return jsonb_build_object('ok', false, 'code', 'INVALID_DEVICE_LABEL');
  end if;

  v_family := lower(trim(coalesce(p_device_family, 'unknown')));
  if v_family not in ('mobile', 'tablet', 'desktop', 'unknown') then
    v_family := 'unknown';
  end if;

  insert into public.citizen_account_devices (
    auth_user_id,
    citizen_id,
    device_key,
    display_label,
    device_family,
    shared_device
  ) values (
    v_uid,
    v_citizen_id,
    p_device_key,
    v_label,
    v_family,
    coalesce(p_shared_device, false)
  )
  on conflict (auth_user_id, device_key) do update
    set display_label = excluded.display_label,
        device_family = excluded.device_family,
        shared_device = excluded.shared_device,
        last_verified_at = now(),
        revoked_at = null,
        revoke_reason = null,
        updated_at = now()
  returning id into v_device_id;

  update public.citizens
     set last_seen_at = now()
   where id = v_citizen_id;

  return jsonb_build_object(
    'ok', true,
    'device_id', v_device_id,
    'device_key', p_device_key,
    'verified_at', now()
  );
end;
$$;

revoke all on function public.register_my_citizen_device(uuid, text, text, boolean) from public, anon;
grant execute on function public.register_my_citizen_device(uuid, text, text, boolean) to authenticated;

create or replace function public.get_my_citizen_devices()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_devices jsonb;
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;

  select coalesce(
           jsonb_agg(
             jsonb_build_object(
               'id', d.id,
               'device_key', d.device_key,
               'display_label', d.display_label,
               'device_family', d.device_family,
               'shared_device', d.shared_device,
               'first_verified_at', d.first_verified_at,
               'last_verified_at', d.last_verified_at,
               'revoked_at', d.revoked_at,
               'revoke_reason', d.revoke_reason
             ) order by d.last_verified_at desc
           ),
           '[]'::jsonb
         )
    into v_devices
    from public.citizen_account_devices d
   where d.auth_user_id = v_uid;

  return jsonb_build_object('ok', true, 'devices', v_devices);
end;
$$;

revoke all on function public.get_my_citizen_devices() from public, anon;
grant execute on function public.get_my_citizen_devices() to authenticated;

create or replace function public.secure_my_other_device_records(
  p_current_device_key uuid,
  p_reason text default 'citizen_secured_account'
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_citizen_id uuid;
  v_current_device_id uuid;
  v_reason text;
  v_count integer := 0;
  v_receipt_id uuid;
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;

  select c.id into v_citizen_id
    from public.citizens c where c.auth_user_id = v_uid limit 1;

  if v_citizen_id is null then
    return jsonb_build_object('ok', false, 'code', 'ACCOUNT_NOT_FOUND');
  end if;

  select d.id into v_current_device_id
    from public.citizen_account_devices d
   where d.auth_user_id = v_uid and d.device_key = p_current_device_key
   limit 1;

  if v_current_device_id is null then
    return jsonb_build_object('ok', false, 'code', 'CURRENT_DEVICE_NOT_REGISTERED');
  end if;

  v_reason := left(trim(regexp_replace(coalesce(p_reason, ''), '[[:cntrl:]]', '', 'g')), 120);
  if v_reason = '' then v_reason := 'citizen_secured_account'; end if;

  update public.citizen_account_devices
     set revoked_at = now(),
         revoke_reason = v_reason,
         updated_at = now()
   where auth_user_id = v_uid
     and device_key <> p_current_device_key
     and revoked_at is null;
  get diagnostics v_count = row_count;

  insert into public.citizen_account_receipts (
    auth_user_id,
    citizen_id,
    device_id,
    event_type,
    details
  ) values (
    v_uid,
    v_citizen_id,
    v_current_device_id,
    'other_sessions_secured',
    jsonb_build_object('device_records_revoked', v_count)
  ) returning id into v_receipt_id;

  return jsonb_build_object(
    'ok', true,
    'device_records_revoked', v_count,
    'receipt_id', v_receipt_id,
    'recorded_at', now()
  );
end;
$$;

revoke all on function public.secure_my_other_device_records(uuid, text) from public, anon;
grant execute on function public.secure_my_other_device_records(uuid, text) to authenticated;

create or replace function public.record_my_global_sign_out(p_current_device_key uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_citizen_id uuid;
  v_device_id uuid;
  v_count integer := 0;
  v_receipt_id uuid;
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;

  select c.id into v_citizen_id
    from public.citizens c where c.auth_user_id = v_uid limit 1;

  if v_citizen_id is null then
    return jsonb_build_object('ok', false, 'code', 'ACCOUNT_NOT_FOUND');
  end if;

  select d.id into v_device_id
    from public.citizen_account_devices d
   where d.auth_user_id = v_uid and d.device_key = p_current_device_key
   limit 1;

  update public.citizen_account_devices
     set revoked_at = now(),
         revoke_reason = 'citizen_global_sign_out',
         updated_at = now()
   where auth_user_id = v_uid and revoked_at is null;
  get diagnostics v_count = row_count;

  insert into public.citizen_account_receipts (
    auth_user_id,
    citizen_id,
    device_id,
    event_type,
    details
  ) values (
    v_uid,
    v_citizen_id,
    v_device_id,
    'global_sign_out_requested',
    jsonb_build_object('device_records_revoked', v_count)
  ) returning id into v_receipt_id;

  return jsonb_build_object(
    'ok', true,
    'device_records_revoked', v_count,
    'receipt_id', v_receipt_id
  );
end;
$$;

revoke all on function public.record_my_global_sign_out(uuid) from public, anon;
grant execute on function public.record_my_global_sign_out(uuid) to authenticated;

create or replace function public.complete_my_account_recovery(
  p_terms_version text,
  p_device_key uuid,
  p_display_label text,
  p_device_family text,
  p_shared_device boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_phone_confirmed_at timestamptz;
  v_citizen public.citizens%rowtype;
  v_identity public.citizen_identity_claims%rowtype;
  v_label text;
  v_family text;
  v_device_id uuid;
  v_revoked integer := 0;
  v_receipt_id uuid;
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;

  if coalesce(p_terms_version, '') <> 'citizen-account-recovery-v1' then
    return jsonb_build_object('ok', false, 'code', 'CONSENT_REQUIRED');
  end if;

  select u.phone_confirmed_at into v_phone_confirmed_at
    from auth.users u where u.id = v_uid;

  if v_phone_confirmed_at is null then
    return jsonb_build_object('ok', false, 'code', 'PHONE_NOT_VERIFIED');
  end if;

  select * into v_citizen
    from public.citizens c where c.auth_user_id = v_uid limit 1 for update;

  if v_citizen.id is null then
    return jsonb_build_object('ok', false, 'code', 'ACCOUNT_NOT_FOUND');
  end if;

  select * into v_identity
    from public.citizen_identity_claims i
   where i.auth_user_id = v_uid limit 1;

  v_label := trim(regexp_replace(coalesce(p_display_label, ''), '[[:cntrl:]]', '', 'g'));
  if p_device_key is null or char_length(v_label) < 1 or char_length(v_label) > 80 then
    return jsonb_build_object('ok', false, 'code', 'INVALID_DEVICE');
  end if;

  v_family := lower(trim(coalesce(p_device_family, 'unknown')));
  if v_family not in ('mobile', 'tablet', 'desktop', 'unknown') then
    v_family := 'unknown';
  end if;

  perform pg_advisory_xact_lock(hashtext('account-recovery:' || v_uid::text));

  insert into public.citizen_account_devices (
    auth_user_id,
    citizen_id,
    device_key,
    display_label,
    device_family,
    shared_device
  ) values (
    v_uid,
    v_citizen.id,
    p_device_key,
    v_label,
    v_family,
    coalesce(p_shared_device, false)
  )
  on conflict (auth_user_id, device_key) do update
    set display_label = excluded.display_label,
        device_family = excluded.device_family,
        shared_device = excluded.shared_device,
        last_verified_at = now(),
        revoked_at = null,
        revoke_reason = null,
        updated_at = now()
  returning id into v_device_id;

  update public.citizen_account_devices
     set revoked_at = now(),
         revoke_reason = 'account_recovery',
         updated_at = now()
   where auth_user_id = v_uid
     and device_key <> p_device_key
     and revoked_at is null;
  get diagnostics v_revoked = row_count;

  update public.citizens set last_seen_at = now() where id = v_citizen.id;

  insert into public.citizen_account_receipts (
    auth_user_id,
    citizen_id,
    device_id,
    event_type,
    terms_version,
    details
  ) values (
    v_uid,
    v_citizen.id,
    v_device_id,
    'account_recovered',
    p_terms_version,
    jsonb_build_object(
      'other_device_records_revoked', v_revoked,
      'account_security_hold_preserved', coalesce((to_jsonb(v_citizen)->>'account_frozen')::boolean, false),
      'card_security_hold_preserved', coalesce((to_jsonb(v_citizen)->>'card_frozen')::boolean, false),
      'wallet_or_token_changed', false
    )
  ) returning id into v_receipt_id;

  return jsonb_build_object(
    'ok', true,
    'citizen_id', v_citizen.id,
    'display_name', v_citizen.citizen_name,
    'domain', v_citizen.web3_domain,
    'identity_status', coalesce(v_identity.status, 'legacy'),
    'account_security_hold', coalesce((to_jsonb(v_citizen)->>'account_frozen')::boolean, false),
    'card_security_hold', coalesce((to_jsonb(v_citizen)->>'card_frozen')::boolean, false),
    'other_device_records_revoked', v_revoked,
    'receipt_id', v_receipt_id,
    'recovered_at', now()
  );
end;
$$;

revoke all on function public.complete_my_account_recovery(text, uuid, text, text, boolean) from public, anon;
grant execute on function public.complete_my_account_recovery(text, uuid, text, text, boolean) to authenticated;

commit;
