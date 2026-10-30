-- Applied to project zljgthfzbalsunuoohcd on 2026-10-30 as migration onboarding_evidence_and_kyc_gate.
-- 2026-10-30  Onboarding evidence chain + KYC step-up gate
-- Gap 1: public.onboarding_events (append-only evidence log) + log_onboarding_events() RPC + trigger logging
-- Gap 2: citizens.kyc_status + require_kyc_tier1() gate + protect_kyc_status() guard trigger
-- No existing citizens data is modified. New rows in citizens.kyc_status take the column default 'tier0'.

-- ===== Gap 1: evidence log =====
create table if not exists public.onboarding_events (
  id            uuid primary key default gen_random_uuid(),
  citizen_id    uuid not null references public.citizens(id),
  event_type    text not null,
  event_payload jsonb not null default '{}'::jsonb,
  ip_address    text,
  user_agent    text,
  created_at    timestamptz not null default now()
);
create index if not exists onboarding_events_citizen_idx on public.onboarding_events (citizen_id, created_at);

alter table public.onboarding_events enable row level security;
revoke all on public.onboarding_events from public, anon, authenticated;
grant select on public.onboarding_events to authenticated;
grant all on public.onboarding_events to service_role;

create policy "citizens read own onboarding events" on public.onboarding_events
  for select to authenticated
  using (citizen_id in (select c.id from public.citizens c where c.auth_user_id = auth.uid()));

create policy "service role full access onboarding events" on public.onboarding_events
  for all to service_role using (true) with check (true);

-- Clients cannot insert directly. They call this RPC, which takes the citizen from the session,
-- records IP and user agent from the request headers, and stamps created_at on the server.
-- Events the browser reports are flagged client_reported = true in the payload.
create or replace function public.log_onboarding_events(p_events jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_cid  uuid;
  v_hdr  jsonb;
  v_ip   text;
  v_ua   text;
  e      jsonb;
  v_type text;
  v_pay  jsonb;
  v_n    int := 0;
  v_ok   text[] := array['name_reserved','email_sent','otp_verified','details_provided','details_skipped','signup_completed','auth_user_created'];
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'sign_in_required');
  end if;
  if p_events is null or jsonb_typeof(p_events) <> 'array'
     or jsonb_array_length(p_events) = 0 or jsonb_array_length(p_events) > 20 then
    return jsonb_build_object('ok', false, 'error', 'bad_events');
  end if;

  select id into v_cid from public.citizens where auth_user_id = v_uid limit 1;
  if v_cid is null then
    return jsonb_build_object('ok', false, 'error', 'no_citizen');
  end if;

  -- validate everything first so a bad batch writes nothing
  for e in select * from jsonb_array_elements(p_events) loop
    v_type := e->>'event_type';
    v_pay  := coalesce(e->'payload', '{}'::jsonb);
    if v_type is null or not (v_type = any (v_ok)) then
      return jsonb_build_object('ok', false, 'error', 'bad_event_type');
    end if;
    if jsonb_typeof(v_pay) <> 'object' or length(v_pay::text) > 2000 then
      return jsonb_build_object('ok', false, 'error', 'bad_payload');
    end if;
  end loop;

  begin
    v_hdr := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    v_hdr := null;
  end;
  v_ip := nullif(btrim(split_part(coalesce(v_hdr->>'x-forwarded-for', ''), ',', 1)), '');
  v_ua := nullif(left(coalesce(v_hdr->>'user-agent', ''), 300), '');

  for e in select * from jsonb_array_elements(p_events) loop
    insert into public.onboarding_events (citizen_id, event_type, event_payload, ip_address, user_agent)
    values (
      v_cid,
      e->>'event_type',
      coalesce(e->'payload', '{}'::jsonb)
        || jsonb_build_object('client_reported', true, 'client_ts', left(coalesce(e->>'client_ts', ''), 40)),
      v_ip,
      v_ua
    );
    v_n := v_n + 1;
  end loop;

  return jsonb_build_object('ok', true, 'logged', v_n);
end;
$$;
revoke all on function public.log_onboarding_events(jsonb) from public, anon;
grant execute on function public.log_onboarding_events(jsonb) to authenticated, service_role;

-- Server-side event from the auth trigger. Same behaviour as before; logging can never block a signup.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_existing citizens%rowtype;
  v_new_id   uuid;
begin
  select * into v_existing from public.citizens where phone_number = new.phone for update;

  if v_existing.id is not null then
    if v_existing.auth_user_id is null then
      -- Pre-existing unlinked citizen row (created via phone-first Tier 0 onboarding) --
      -- legitimate first-time link.
      update public.citizens set auth_user_id = new.id, last_seen_at = now() where id = v_existing.id;
      begin
        insert into public.onboarding_events (citizen_id, event_type, event_payload)
        values (v_existing.id, 'auth_user_created', jsonb_build_object('source', 'auth_trigger', 'linked_existing_row', true));
      exception when others then null;
      end;
    elsif v_existing.auth_user_id <> new.id then
      -- Phone number collision against an ALREADY-linked citizen -- do not reassign.
      insert into public.security_events (tier, zone, description, detail)
      values ('T2', 'account_takeover_attempt_blocked',
        'New auth signup used a phone number already linked to a different citizen -- reassignment blocked',
        jsonb_build_object('existing_citizen_id', v_existing.id, 'existing_auth_user_id', v_existing.auth_user_id, 'new_auth_user_id', new.id, 'phone_number', new.phone));
      -- Do not touch the existing row. The new auth.users row exists with no citizen row of
      -- its own; onboarding flow is responsible for creating one with a distinct phone/contact.
    else
      update public.citizens set last_seen_at = now() where id = v_existing.id;
    end if;
  else
    insert into public.citizens (auth_user_id, phone_number, wisdom_score, genesis_citizen, indx_balance)
    values (new.id, new.phone, 10, true, 50)
    returning id into v_new_id;
    begin
      insert into public.onboarding_events (citizen_id, event_type, event_payload)
      values (v_new_id, 'auth_user_created', jsonb_build_object('source', 'auth_trigger', 'linked_existing_row', false));
    exception when others then null;
    end;
  end if;

  return new;
end;
$function$;

-- ===== Gap 2: KYC step-up gate =====
alter table public.citizens add column if not exists kyc_status text not null default 'tier0';
alter table public.citizens add constraint citizens_kyc_status_check
  check (kyc_status in ('tier0','tier1_pending','tier1_verified','tier1_rejected'));

-- citizens can update their own row, so without this guard a citizen could set their own kyc_status.
-- Only service_role or direct database sessions may change it; anon and authenticated sessions cannot.
create or replace function public.protect_kyc_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.kyc_status := 'tier0';
    else
      new.kyc_status := old.kyc_status;
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_protect_kyc_status before insert or update on public.citizens
  for each row execute function public.protect_kyc_status();

-- The gate. True only for a citizen whose kyc_status is tier1_verified.
-- Callers that get false must stop and return: "Identity verification required before this action."
create or replace function public.require_kyc_tier1(p_citizen_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select c.kyc_status = 'tier1_verified' from public.citizens c where c.id = p_citizen_id), false);
$$;
revoke all on function public.require_kyc_tier1(uuid) from public, anon, authenticated;
grant execute on function public.require_kyc_tier1(uuid) to service_role;
comment on function public.require_kyc_tier1(uuid) is 'KYC step-up gate. Returns true only when citizens.kyc_status = tier1_verified. On false, callers return: Identity verification required before this action.';
