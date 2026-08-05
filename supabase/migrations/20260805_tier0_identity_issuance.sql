-- IN$DEX Tier 0 identity issuance
-- Real phone OTP is handled by Supabase Auth. This migration makes the
-- post-verification name.IN$DEX claim atomic, unique and auditable.

begin;

create table if not exists public.index_reserved_handles (
  handle text primary key,
  reason text not null default 'reserved',
  created_at timestamptz not null default now(),
  constraint index_reserved_handle_format check (
    handle = lower(handle)
    and char_length(handle) between 2 and 32
    and handle ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
  )
);

insert into public.index_reserved_handles (handle, reason)
values
  ('admin', 'system'),
  ('api', 'system'),
  ('founder', 'protected role'),
  ('governance', 'system'),
  ('help', 'system'),
  ('index', 'brand protection'),
  ('indx', 'brand protection'),
  ('marketplace', 'system'),
  ('official', 'brand protection'),
  ('root', 'system'),
  ('security', 'system'),
  ('siindex', 'brand protection'),
  ('support', 'system'),
  ('team', 'protected role'),
  ('treasury', 'system'),
  ('wallet', 'system'),
  ('www', 'system')
on conflict (handle) do nothing;

alter table public.index_reserved_handles enable row level security;
revoke all on table public.index_reserved_handles from anon, authenticated;

create table if not exists public.tier0_auth_receipts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  terms_version text not null,
  created_at timestamptz not null default now(),
  constraint tier0_auth_receipt_event check (event_type = 'phone_auth_consent')
);

alter table public.tier0_auth_receipts enable row level security;
revoke all on table public.tier0_auth_receipts from anon, authenticated;
grant select on table public.tier0_auth_receipts to authenticated;

drop policy if exists tier0_auth_receipts_select_own on public.tier0_auth_receipts;
create policy tier0_auth_receipts_select_own
on public.tier0_auth_receipts
for select
to authenticated
using ((select auth.uid()) = auth_user_id);

create or replace function public.record_tier0_phone_consent(p_terms_version text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_phone_confirmed_at timestamptz;
  v_receipt_id uuid;
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;

  if coalesce(p_terms_version, '') <> 'tier0-identity-v1' then
    return jsonb_build_object('ok', false, 'code', 'CONSENT_REQUIRED');
  end if;

  select u.phone_confirmed_at
    into v_phone_confirmed_at
    from auth.users u
   where u.id = v_uid;

  if v_phone_confirmed_at is null then
    return jsonb_build_object('ok', false, 'code', 'PHONE_NOT_VERIFIED');
  end if;

  insert into public.tier0_auth_receipts (auth_user_id, event_type, terms_version)
  values (v_uid, 'phone_auth_consent', p_terms_version)
  returning id into v_receipt_id;

  return jsonb_build_object('ok', true, 'receipt_id', v_receipt_id, 'recorded_at', now());
end;
$$;

revoke all on function public.record_tier0_phone_consent(text) from public, anon;
grant execute on function public.record_tier0_phone_consent(text) to authenticated;

create table if not exists public.citizen_identity_claims (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  citizen_id uuid not null references public.citizens(id) on delete cascade,
  display_name text not null,
  handle text not null,
  domain text not null,
  status text not null default 'active',
  issued_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint citizen_identity_auth_unique unique (auth_user_id),
  constraint citizen_identity_citizen_unique unique (citizen_id),
  constraint citizen_identity_handle_unique unique (handle),
  constraint citizen_identity_domain_unique unique (domain),
  constraint citizen_identity_handle_format check (
    handle = lower(handle)
    and char_length(handle) between 3 and 32
    and handle ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
    and handle !~ '--'
  ),
  constraint citizen_identity_domain_matches check (domain = handle || '.IN$DEX'),
  constraint citizen_identity_status_check check (status in ('active', 'suspended', 'revoked'))
);

alter table public.citizen_identity_claims enable row level security;
revoke all on table public.citizen_identity_claims from anon, authenticated;
grant select on table public.citizen_identity_claims to authenticated;

-- Preserve valid, already-linked legacy identities. Conflicting or malformed
-- legacy rows remain unclaimed for manual reconciliation instead of being
-- silently renamed or assigned to the wrong person.
insert into public.citizen_identity_claims (
  auth_user_id,
  citizen_id,
  display_name,
  handle,
  domain,
  issued_at
)
select
  c.auth_user_id,
  c.id,
  c.citizen_name,
  regexp_replace(lower(c.web3_domain), '\.in\$dex$', ''),
  regexp_replace(lower(c.web3_domain), '\.in\$dex$', '') || '.IN$DEX',
  coalesce(c.created_at, now())
from public.citizens c
where c.auth_user_id is not null
  and c.citizen_name is not null
  and c.web3_domain is not null
  and char_length(regexp_replace(lower(c.web3_domain), '\.in\$dex$', '')) between 3 and 32
  and regexp_replace(lower(c.web3_domain), '\.in\$dex$', '') ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
  and regexp_replace(lower(c.web3_domain), '\.in\$dex$', '') !~ '--'
  and not exists (
    select 1
      from public.index_reserved_handles r
     where r.handle = regexp_replace(lower(c.web3_domain), '\.in\$dex$', '')
  )
on conflict do nothing;

drop policy if exists citizen_identity_claims_select_own on public.citizen_identity_claims;
create policy citizen_identity_claims_select_own
on public.citizen_identity_claims
for select
to authenticated
using ((select auth.uid()) = auth_user_id);

create table if not exists public.citizen_identity_receipts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  citizen_id uuid not null references public.citizens(id) on delete cascade,
  event_type text not null,
  terms_version text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint citizen_identity_receipt_event check (
    event_type in ('tier0_identity_issued', 'tier0_identity_reused')
  )
);

alter table public.citizen_identity_receipts enable row level security;
revoke all on table public.citizen_identity_receipts from anon, authenticated;
grant select on table public.citizen_identity_receipts to authenticated;

drop policy if exists citizen_identity_receipts_select_own on public.citizen_identity_receipts;
create policy citizen_identity_receipts_select_own
on public.citizen_identity_receipts
for select
to authenticated
using ((select auth.uid()) = auth_user_id);

create or replace function public.check_name_indx_availability(p_handle text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_handle text;
  v_uid uuid := auth.uid();
  v_owner uuid;
begin
  v_handle := lower(trim(coalesce(p_handle, '')));
  if right(v_handle, 7) = '.in$dex' then
    v_handle := left(v_handle, char_length(v_handle) - 7);
  end if;

  if char_length(v_handle) < 3 or char_length(v_handle) > 32
     or v_handle !~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
     or v_handle ~ '--' then
    return jsonb_build_object(
      'available', false,
      'handle', v_handle,
      'reason', 'invalid_format'
    );
  end if;

  if exists (select 1 from public.index_reserved_handles r where r.handle = v_handle) then
    return jsonb_build_object(
      'available', false,
      'handle', v_handle,
      'reason', 'reserved'
    );
  end if;

  select c.auth_user_id
    into v_owner
    from public.citizen_identity_claims c
   where c.handle = v_handle
     and c.status <> 'revoked'
   limit 1;

  if v_owner is not null then
    return jsonb_build_object(
      'available', v_uid is not null and v_owner = v_uid,
      'handle', v_handle,
      'domain', v_handle || '.IN$DEX',
      'reason', case when v_uid is not null and v_owner = v_uid then 'owned_by_you' else 'taken' end
    );
  end if;

  if exists (
    select 1
      from public.citizens c
     where lower(coalesce(c.web3_domain, '')) = lower(v_handle || '.IN$DEX')
  ) then
    return jsonb_build_object(
      'available', false,
      'handle', v_handle,
      'reason', 'taken'
    );
  end if;

  return jsonb_build_object(
    'available', true,
    'handle', v_handle,
    'domain', v_handle || '.IN$DEX',
    'reason', 'available'
  );
end;
$$;

revoke all on function public.check_name_indx_availability(text) from public;
grant execute on function public.check_name_indx_availability(text) to anon, authenticated;

create or replace function public.get_my_tier0_identity()
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
           'citizen_id', c.id,
           'display_name', c.citizen_name,
           'domain', c.web3_domain,
           'handle', replace(lower(coalesce(c.web3_domain, '')), '.in$dex', ''),
           'identity_status', coalesce(i.status, 'legacy'),
           'issued_at', i.issued_at,
           'complete', c.citizen_name is not null and c.web3_domain is not null
         )
    into v_result
    from public.citizens c
    left join public.citizen_identity_claims i on i.citizen_id = c.id
   where c.auth_user_id = v_uid
   limit 1;

  return coalesce(v_result, jsonb_build_object('complete', false));
end;
$$;

revoke all on function public.get_my_tier0_identity() from public, anon;
grant execute on function public.get_my_tier0_identity() to authenticated;

create or replace function public.claim_tier0_identity(
  p_display_name text,
  p_handle text,
  p_terms_version text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_phone text;
  v_phone_confirmed_at timestamptz;
  v_display_name text;
  v_handle text;
  v_domain text;
  v_citizen_id uuid;
  v_existing_domain text;
  v_existing_claim public.citizen_identity_claims%rowtype;
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;

  if coalesce(p_terms_version, '') <> 'tier0-identity-v1' then
    return jsonb_build_object('ok', false, 'code', 'CONSENT_REQUIRED');
  end if;

  select u.phone, u.phone_confirmed_at
    into v_phone, v_phone_confirmed_at
    from auth.users u
   where u.id = v_uid;

  if v_phone is null or v_phone_confirmed_at is null then
    return jsonb_build_object('ok', false, 'code', 'PHONE_NOT_VERIFIED');
  end if;

  v_display_name := trim(regexp_replace(coalesce(p_display_name, ''), '[[:cntrl:]]', '', 'g'));
  if char_length(v_display_name) < 2 or char_length(v_display_name) > 80 then
    return jsonb_build_object('ok', false, 'code', 'INVALID_DISPLAY_NAME');
  end if;

  v_handle := lower(trim(coalesce(p_handle, '')));
  if right(v_handle, 7) = '.in$dex' then
    v_handle := left(v_handle, char_length(v_handle) - 7);
  end if;

  if char_length(v_handle) < 3 or char_length(v_handle) > 32
     or v_handle !~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
     or v_handle ~ '--' then
    return jsonb_build_object('ok', false, 'code', 'INVALID_HANDLE');
  end if;

  if exists (select 1 from public.index_reserved_handles r where r.handle = v_handle) then
    return jsonb_build_object('ok', false, 'code', 'HANDLE_RESERVED');
  end if;

  v_domain := v_handle || '.IN$DEX';
  perform pg_advisory_xact_lock(hashtext('name-index:' || v_handle));

  select *
    into v_existing_claim
    from public.citizen_identity_claims i
   where i.auth_user_id = v_uid
   for update;

  if found then
    insert into public.citizen_identity_receipts (
      auth_user_id, citizen_id, event_type, terms_version, details
    ) values (
      v_uid,
      v_existing_claim.citizen_id,
      'tier0_identity_reused',
      p_terms_version,
      jsonb_build_object('domain', v_existing_claim.domain)
    );

    return jsonb_build_object(
      'ok', true,
      'status', 'existing',
      'citizen_id', v_existing_claim.citizen_id,
      'display_name', v_existing_claim.display_name,
      'handle', v_existing_claim.handle,
      'domain', v_existing_claim.domain,
      'issued_at', v_existing_claim.issued_at
    );
  end if;

  if exists (
    select 1 from public.citizen_identity_claims i
     where i.handle = v_handle and i.status <> 'revoked'
  ) or exists (
    select 1 from public.citizens c
     where lower(coalesce(c.web3_domain, '')) = lower(v_domain)
       and c.auth_user_id is distinct from v_uid
  ) then
    return jsonb_build_object('ok', false, 'code', 'HANDLE_TAKEN');
  end if;

  select c.id, c.web3_domain
    into v_citizen_id, v_existing_domain
    from public.citizens c
   where c.auth_user_id = v_uid
   limit 1
   for update;

  if v_citizen_id is null then
    select c.id, c.web3_domain
      into v_citizen_id, v_existing_domain
      from public.citizens c
     where c.auth_user_id is null
       and c.phone_number = v_phone
     limit 1
     for update;
  end if;

  if v_citizen_id is null then
    insert into public.citizens (
      auth_user_id,
      phone_number,
      citizen_name,
      web3_domain,
      last_seen_at
    ) values (
      v_uid,
      v_phone,
      v_display_name,
      v_domain,
      now()
    )
    returning id into v_citizen_id;
  else
    if v_existing_domain is not null and lower(v_existing_domain) <> lower(v_domain) then
      return jsonb_build_object(
        'ok', false,
        'code', 'IDENTITY_ALREADY_ISSUED',
        'domain', v_existing_domain
      );
    end if;

    update public.citizens
       set auth_user_id = v_uid,
           phone_number = v_phone,
           citizen_name = v_display_name,
           web3_domain = v_domain,
           last_seen_at = now()
     where id = v_citizen_id;
  end if;

  insert into public.citizen_identity_claims (
    auth_user_id,
    citizen_id,
    display_name,
    handle,
    domain
  ) values (
    v_uid,
    v_citizen_id,
    v_display_name,
    v_handle,
    v_domain
  );

  insert into public.citizen_identity_receipts (
    auth_user_id,
    citizen_id,
    event_type,
    terms_version,
    details
  ) values (
    v_uid,
    v_citizen_id,
    'tier0_identity_issued',
    p_terms_version,
    jsonb_build_object(
      'domain', v_domain,
      'phone_verified', true,
      'token_or_wallet_issued', false
    )
  );

  return jsonb_build_object(
    'ok', true,
    'status', 'issued',
    'citizen_id', v_citizen_id,
    'display_name', v_display_name,
    'handle', v_handle,
    'domain', v_domain,
    'issued_at', now()
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'code', 'HANDLE_TAKEN');
end;
$$;

revoke all on function public.claim_tier0_identity(text, text, text) from public, anon;
grant execute on function public.claim_tier0_identity(text, text, text) to authenticated;

-- All browser-side citizen creation now goes through claim_tier0_identity().
-- Existing authenticated profile updates remain available under their RLS rules.
revoke insert, update, delete on table public.citizens from anon;
revoke insert on table public.citizens from authenticated;

-- Retire the anonymous bonus path and stop unauthenticated phone lookups.
do $retire_legacy$
begin
  if to_regprocedure('public.create_onboarding_citizen(jsonb)') is not null then
    execute 'revoke all on function public.create_onboarding_citizen(jsonb) from public, anon, authenticated';
  end if;
  if to_regprocedure('public.claim_genesis_signup_bonus_anon(uuid)') is not null then
    execute 'revoke all on function public.claim_genesis_signup_bonus_anon(uuid) from public, anon, authenticated';
  end if;
  if to_regprocedure('public.claim_creator_signup_bonus(uuid)') is not null then
    execute 'revoke all on function public.claim_creator_signup_bonus(uuid) from public, anon, authenticated';
  end if;
  if to_regprocedure('public.get_citizen_by_phone(text)') is not null then
    execute 'revoke all on function public.get_citizen_by_phone(text) from public, anon';
    execute 'grant execute on function public.get_citizen_by_phone(text) to authenticated';
  end if;
end;
$retire_legacy$;

commit;
