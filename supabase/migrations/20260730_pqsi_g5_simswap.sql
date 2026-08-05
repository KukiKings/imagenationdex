-- ============================================================================
-- PQSI G5 — SIM-Swap & Device-Change Controls
-- IN$DEX · written 2026-07-30 · NOT YET APPLIED
--
-- THE PROBLEM THIS EXISTS FOR
--   Tier 0 identity is a phone number. That is the right call for financial
--   inclusion — Mama Noe has no documents and no bank — but it makes the SIM
--   the single point of failure for the whole account.
--
--   FBI IC3 states plainly that most SIM swapping is done to steal
--   cryptocurrency: 982 complaints / ~$26M in 2024, 1,075 attacks / ~$50M in
--   2023. IDCARE reported a 240% surge in 2024 with 90% of cases occurring
--   WITHOUT ANY VICTIM INTERACTION. The mechanism is always the same: attacker
--   receives the victim's SMS, triggers account recovery, resets access.
--
--   The absolute dollar figures are modest next to phishing. That is not why
--   this matters. It matters because for IN$DEX the phone IS the identity, so a
--   SIM swap is not one attack vector among many — it is a total account
--   compromise that no transaction-level control can detect, because every
--   request genuinely comes from the registered number.
--
--   Pacific-specific aggravation, for the risk register: small-island telcos
--   have small counter-staff teams and high-trust local culture. Social
--   engineering a SIM reissue is plausibly EASIER in Rarotonga than in Sydney.
--   And Genesis Citizens are by design the earliest and most publicly
--   identifiable holders — public identifiability plus a phone-anchored account
--   is the textbook SIM-swap targeting profile.
--
-- THE CONTROL
--   A cooling-off window. This is the standard retail-bank control and it works
--   because it defeats the only thing the attacker actually has: a short window
--   of exclusive SMS access before the victim notices their phone is dead.
--
-- WHAT THIS DOES NOT DO
--   It does not prevent the SIM swap. That is the telco's control, not ours.
--
-- ⚠️ CRITICAL LIMITATION FOUND 2026-07-30, AFTER THIS FILE WAS FIRST WRITTEN
--   pqsi_record_anchor_change() only fires when a citizen changes their number
--   THROUGH THE IN$DEX APP. A real SIM swap does not do that. The phone NUMBER
--   stays identical — only the SIM/IMSI pairing changes, at the carrier, with no
--   IN$DEX involvement at all.
--
--   So the cooling-off window below WOULD NEVER TRIGGER FOR THE ACTUAL ATTACK.
--   It covers a citizen who deliberately switches numbers or devices in-app,
--   which is the benign case. The hostile case was invisible to it.
--
--   That gap is closed by section 7 — the CAMARA SIM Swap API — which is the
--   only way IN$DEX can see a carrier-side swap. Section 7 is the primary
--   control. Everything above it is secondary.
--
-- ON eSIM (AJ's proposal, 2026-07-30) — HALF RIGHT, AND THE OTHER HALF IS
-- DOCUMENTED AT $38M
--   eSIM does NOT solve SIM swap. Used via a third-party carrier it makes the
--   attack FASTER: remote QR provisioning cut the attack cycle from hours to
--   under five minutes (Q1 2025 incident analyses). In March 2025 a California
--   arbitrator ordered T-Mobile to pay $33M after attackers stole ~$38M in
--   crypto — they bypassed T-Mobile's own "NOPORT" protection by persuading a
--   call-centre agent to issue a REMOTE eSIM QR CODE. eSIM was the vector that
--   defeated the existing control, not the fix.
--
--   The failure in every documented case is the CARRIER'S human override, not
--   the SIM hardware. Which is exactly why AJ's underlying instinct is right in
--   the case that matters: if IN$DEX ISSUES the eSIM (Sovereign eSIM, Wave 2),
--   IN$DEX owns the re-provisioning policy and there is no third-party call
--   centre to socially engineer. That is genuinely strong — but it is a 2027+
--   partner-dependent roadmap item, not available for launch, and it transfers
--   the SIM-swap liability onto IN$DEX. See roadmap-v2.md Wave 2.
--
--   Interim: CAMARA (section 7) plus a telco port-out lock. AJ's Vodafone Cook
--   Islands contact is the right conversation for both.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. IDENTITY-ANCHOR CHANGE LOG (append-only)
--    Every change to the thing that IS the identity gets a permanent record.
-- ---------------------------------------------------------------------------
create table if not exists identity_anchor_changes (
  id                  uuid primary key default gen_random_uuid(),
  citizen_id          uuid not null references citizens(id),
  change_type         text not null check (change_type in
                        ('phone_number','device','sim','totp_reset','email','guardian_set')),
  previous_value_hash text,          -- hashed; never store the old number in clear
  new_value_hash      text,
  changed_at          timestamptz not null default now(),
  initiated_from_ip   inet,
  initiated_from_device text,
  notified_previous_channel boolean not null default false,
  notified_at         timestamptz,
  cooling_off_until   timestamptz,
  citizen_confirmed   boolean not null default false,
  citizen_confirmed_at timestamptz,
  guardian_confirmed  boolean not null default false,
  guardian_confirmed_at timestamptz,
  disputed            boolean not null default false,
  disputed_at         timestamptz
);

create index if not exists idx_anchor_changes_citizen
  on identity_anchor_changes (citizen_id, changed_at desc);

-- Append-only, same discipline as security_events (Security Law 7).
create or replace function block_anchor_change_delete() returns trigger
language plpgsql as $$
begin
  raise exception 'identity_anchor_changes is append-only. An identity-change record is the evidence trail for a SIM-swap dispute — it cannot be deleted or rewritten. Set disputed=true via pqsi_dispute_anchor_change() instead.';
end;
$$;

drop trigger if exists trg_anchor_no_delete on identity_anchor_changes;
create trigger trg_anchor_no_delete
  before delete on identity_anchor_changes
  for each row execute function block_anchor_change_delete();

comment on table identity_anchor_changes is
  'Append-only log of every change to a Tier 0 identity anchor. Values are HASHED — the old phone number is never retained in clear, because a stored list of previous numbers is itself a target.';

-- ---------------------------------------------------------------------------
-- 2. POLICY
-- ---------------------------------------------------------------------------
alter table pqsi_policy
  add column if not exists simswap_cooling_hours integer not null default 72,
  add column if not exists simswap_floor_usd     numeric not null default 20,
  add column if not exists simswap_guardian_usd  numeric not null default 200;

comment on column pqsi_policy.simswap_cooling_hours is
  '72h default. Long enough that a victim notices a dead SIM and disputes; short enough not to strand a citizen who genuinely changed phones. Retail-bank practice is 24-72h.';
comment on column pqsi_policy.simswap_floor_usd is
  'Outbound at or below this passes during cooling-off. A citizen who legitimately changed phones must still be able to buy food. Blocking everything is what makes people route around the control.';

-- ---------------------------------------------------------------------------
-- 3. RECORD A CHANGE — opens the window and notifies the OLD channel
-- ---------------------------------------------------------------------------
create or replace function pqsi_record_anchor_change(
  p_citizen_id      uuid,
  p_change_type     text,
  p_previous_value  text default null,
  p_new_value       text default null,
  p_ip              inet default null,
  p_device          text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare pol pqsi_policy; v_id uuid; v_until timestamptz; v_event uuid;
begin
  select * into pol from pqsi_policy where id = 1;
  v_until := now() + (pol.simswap_cooling_hours || ' hours')::interval;

  insert into identity_anchor_changes
    (citizen_id, change_type, previous_value_hash, new_value_hash,
     initiated_from_ip, initiated_from_device, cooling_off_until)
  values
    (p_citizen_id, p_change_type,
     -- extensions.digest() — pgcrypto is installed in the `extensions` schema on this
     -- project, NOT public. Verified 2026-07-30 via pg_extension. Because this function
     -- pins `search_path = public` for security, digest() MUST be schema-qualified or it
     -- raises "function digest(text, unknown) does not exist" at runtime.
     case when p_previous_value is null then null else encode(extensions.digest(p_previous_value,'sha256'),'hex') end,
     case when p_new_value      is null then null else encode(extensions.digest(p_new_value,'sha256'),'hex') end,
     p_ip, p_device, v_until)
  returning id into v_id;

  v_event := pqsi_log_event('T2','IDENTITY_ANCHOR',
    format('%s changed for citizen %s — %sh cooling-off opened',
           p_change_type, p_citizen_id, pol.simswap_cooling_hours),
    jsonb_build_object('change_id',v_id,'change_type',p_change_type,
                       'cooling_off_until',v_until,'ip',p_ip,'device',p_device));

  -- The notification to the PREVIOUS channel is the control that actually
  -- catches a swap: a victim whose SIM was stolen still has email, and the
  -- attacker cannot suppress a message already sent elsewhere.
  return jsonb_build_object(
    'change_id', v_id,
    'cooling_off_until', v_until,
    'cooling_off_hours', pol.simswap_cooling_hours,
    'event_id', v_event,
    'MUST_NOTIFY_PREVIOUS_CHANNEL', true,
    'note','Send to the PREVIOUS phone/email now, not the new one. Then call pqsi_mark_anchor_notified(). If the citizen did not make this change, pqsi_dispute_anchor_change() freezes the account immediately.');
end;
$$;

create or replace function pqsi_mark_anchor_notified(p_change_id uuid)
returns void language sql security definer set search_path = public as $$
  update identity_anchor_changes
     set notified_previous_channel = true, notified_at = now()
   where id = p_change_id;
$$;

-- ---------------------------------------------------------------------------
-- 4. DISPUTE — the victim's emergency stop
-- ---------------------------------------------------------------------------
create or replace function pqsi_dispute_anchor_change(
  p_change_id uuid,
  p_reason    text default 'Citizen states they did not make this change'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_citizen uuid; v_event uuid;
begin
  update identity_anchor_changes
     set disputed = true, disputed_at = now()
   where id = p_change_id
  returning citizen_id into v_citizen;

  if v_citizen is null then
    raise exception 'pqsi_dispute_anchor_change: no such change record';
  end if;

  -- A disputed identity change is an active compromise. Freeze first.
  perform pqsi_freeze_citizen(v_citizen,
    format('Identity anchor change disputed (%s). %s', p_change_id, p_reason));

  v_event := pqsi_log_event('T4','IDENTITY_ANCHOR_DISPUTE',
    format('DISPUTED identity change %s — account frozen', p_change_id),
    jsonb_build_object('change_id',p_change_id,'citizen_id',v_citizen,'reason',p_reason));

  return jsonb_build_object('disputed',true,'account_frozen',true,'event_id',v_event,
    'note','Account frozen and the halt armed. Recovery requires 2-of-3 MPC keys — a SIM alone cannot restore access. Security Law 4.');
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. THE CHECK — call from the classifier
-- ---------------------------------------------------------------------------
create or replace function pqsi_check_anchor_cooling(
  p_citizen_id uuid,
  p_amount_usd numeric
) returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare pol pqsi_policy; ch identity_anchor_changes; hrs numeric;
begin
  select * into pol from pqsi_policy where id = 1;

  select * into ch from identity_anchor_changes
   where citizen_id = p_citizen_id
     and change_type in ('phone_number','device','sim','totp_reset')
     and cooling_off_until > now()
     and disputed = false
   order by changed_at desc limit 1;

  if not found then
    return jsonb_build_object('tier',0,'in_cooling_off',false);
  end if;

  hrs := round(extract(epoch from (ch.cooling_off_until - now()))/3600, 1);

  -- Under the floor: always allowed. A citizen who really did change phones
  -- must still be able to buy food.
  if p_amount_usd <= pol.simswap_floor_usd then
    return jsonb_build_object('tier',1,'in_cooling_off',true,'hours_remaining',hrs,
      'detail', format('%s changed %sh ago; $%s is within the $%s cooling-off floor. Allowed and logged.',
                       ch.change_type, round(extract(epoch from (now()-ch.changed_at))/3600,1),
                       p_amount_usd, pol.simswap_floor_usd));
  end if;

  -- Guardian band: a second human channel the attacker does not control.
  if p_amount_usd <= pol.simswap_guardian_usd
     and exists (select 1 from citizen_guardians where citizen_id = p_citizen_id) then
    if ch.guardian_confirmed then
      return jsonb_build_object('tier',1,'in_cooling_off',true,'hours_remaining',hrs,
        'detail','Guardian confirmed this identity change. Proceeding.');
    end if;
    return jsonb_build_object('tier',2,'in_cooling_off',true,'hours_remaining',hrs,
      'require','guardian_confirmation',
      'detail', format('$%s during a %sh cooling-off after a %s change. A guardian can release it now — a second human channel the attacker does not control. Culturally this is how Pacific families already operate.',
                       p_amount_usd, hrs, ch.change_type));
  end if;

  -- Above the guardian band: hold for the window.
  return jsonb_build_object('tier',3,'in_cooling_off',true,'hours_remaining',hrs,
    'detail', format('HOLD — $%s exceeds the cooling-off allowance and the %s change was %sh ago. %sh remaining. This is the control that defeats SIM swap: the attacker has a short window of exclusive SMS access, and this outlasts it. Notified to the previous channel; if the citizen did not make this change they can dispute and freeze the account.',
                     p_amount_usd, ch.change_type,
                     round(extract(epoch from (now()-ch.changed_at))/3600,1), hrs));
end;
$$;

comment on function pqsi_check_anchor_cooling is
  'G5. Graduated: under the floor always passes, the guardian band can be released by a second human, above it holds for the window. Blocking everything outright is what makes citizens route around a control.';

-- ---------------------------------------------------------------------------
-- 6. SMS MUST NEVER AUTHORISE
--    SMS may confirm. It may never be the factor that permits a transfer,
--    because in a SIM swap the attacker holds SMS by definition.
-- ---------------------------------------------------------------------------
create or replace function pqsi_assert_no_sms_auth(p_factors text[])
returns void language plpgsql immutable as $$
begin
  if 'sms' = any (p_factors) or 'otp_sms' = any (p_factors) then
    raise exception 'PQSI: SMS may confirm but may never authorise a transfer. In a SIM swap the attacker holds SMS by definition, so an SMS-authorised transfer is an attacker-authorised transfer. Use TOTP (citizens.totp_enabled) or guardian confirmation.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. CAMARA SIM SWAP API — THE PRIMARY CONTROL
--
--    This is the only mechanism that lets IN$DEX see a carrier-side SIM swap,
--    which is the attack that never touches our app.
--
--    GSMA Open Gateway / CAMARA exposes a standardised `SIM Swap` API: given a
--    phone number it returns the timestamp of the last SIM-IMSI pairing change,
--    or a yes/no for a window you specify. Backed by 73 operator groups covering
--    roughly 80% of global mobile connections. Production-ready today across the
--    UK, Europe and India. Banks already use it exactly this way: at the moment
--    of a transaction, ask "has this number's SIM changed recently?" and decide.
--
--    OPEN QUESTION FOR AJ — Pacific coverage. CAMARA is production-ready in
--    UK/EU/India. Vodafone Cook Islands, Digicel Pacific and Telstra Pacific
--    coverage is UNVERIFIED. If the Pacific operators are not Open Gateway
--    participants this control does not reach the citizens who need it most,
--    and the fallback is a per-operator agreement. This is the single most
--    important question to put to Vodafone Cook Islands, ahead of port-out locks.
-- ---------------------------------------------------------------------------
create table if not exists carrier_sim_swap_checks (
  id             uuid primary key default gen_random_uuid(),
  citizen_id     uuid not null references citizens(id),
  checked_at     timestamptz not null default now(),
  provider       text not null,                 -- 'camara_open_gateway' | operator name
  swapped_within_hours integer,                 -- the window asked about
  swap_detected  boolean,
  last_swap_at   timestamptz,                   -- if the operator returns a timestamp
  raw_response   jsonb,
  check_failed   boolean not null default false,
  failure_reason text
);

create index if not exists idx_sim_swap_checks_citizen
  on carrier_sim_swap_checks (citizen_id, checked_at desc);

-- Record the result of an external CAMARA lookup and return a tier.
create or replace function pqsi_record_carrier_sim_check(
  p_citizen_id   uuid,
  p_provider     text,
  p_window_hours integer,
  p_swap_detected boolean,
  p_last_swap_at timestamptz default null,
  p_raw          jsonb default null,
  p_failed       boolean default false,
  p_failure      text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid; v_tier integer; v_event uuid; v_detail text;
begin
  insert into carrier_sim_swap_checks
    (citizen_id, provider, swapped_within_hours, swap_detected,
     last_swap_at, raw_response, check_failed, failure_reason)
  values (p_citizen_id, p_provider, p_window_hours, p_swap_detected,
          p_last_swap_at, p_raw, p_failed, p_failure)
  returning id into v_id;

  if p_failed then
    -- FAIL CLOSED, not open. An unavailable check is an unknown, and an unknown
    -- on the identity anchor is not the same as a clear.
    v_tier := 2;
    v_detail := format('Carrier SIM-swap check FAILED (%s). Treated as unknown, not clear — escalating to 2FA. An outage must never silently downgrade to "no swap detected".', coalesce(p_failure,'no reason given'));
  elsif p_swap_detected then
    v_tier := 3;
    v_detail := format('Carrier reports the SIM changed within the last %sh%s. The phone number is unchanged, so nothing in the app would show this — the number now answers on a different SIM. HOLD.',
                       p_window_hours,
                       case when p_last_swap_at is null then '' else format(' (last change %s)', p_last_swap_at) end);
  else
    v_tier := 0;
    v_detail := format('Carrier confirms no SIM change in the last %sh.', p_window_hours);
  end if;

  v_event := pqsi_log_event('T'||v_tier,'CARRIER_SIM_CHECK',
    format('SIM-swap check for citizen %s — %s', p_citizen_id,
           case when p_failed then 'UNAVAILABLE' when p_swap_detected then 'SWAP DETECTED' else 'clear' end),
    jsonb_build_object('check_id',v_id,'provider',p_provider,'window_hours',p_window_hours,
                       'swap_detected',p_swap_detected,'failed',p_failed));

  return jsonb_build_object('check_id',v_id,'tier',v_tier,'detail',v_detail,'event_id',v_event);
end;
$$;

-- Read the most recent check when classifying. Staleness matters: a check from
-- last week says nothing about today.
create or replace function pqsi_carrier_sim_status(
  p_citizen_id uuid,
  p_max_age_minutes integer default 15
) returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare c carrier_sim_swap_checks;
begin
  select * into c from carrier_sim_swap_checks
   where citizen_id = p_citizen_id
   order by checked_at desc limit 1;

  if not found then
    return jsonb_build_object('tier',2,'status','never_checked',
      'detail','No carrier SIM-swap check has ever run for this citizen. Not the same as clear.');
  end if;

  if c.checked_at < now() - (p_max_age_minutes||' minutes')::interval then
    return jsonb_build_object('tier',2,'status','stale',
      'detail', format('Last check was %s minutes ago (max %s). Re-check before deciding.',
                       round(extract(epoch from (now()-c.checked_at))/60), p_max_age_minutes));
  end if;

  if c.check_failed then
    return jsonb_build_object('tier',2,'status','failed','detail',coalesce(c.failure_reason,'check failed'));
  end if;

  if c.swap_detected then
    return jsonb_build_object('tier',3,'status','swap_detected','last_swap_at',c.last_swap_at,
      'detail','Carrier reports a recent SIM change. HOLD.');
  end if;

  return jsonb_build_object('tier',0,'status','clear');
end;
$$;

comment on function pqsi_carrier_sim_status is
  'PRIMARY SIM-swap control. Fails closed on never-checked, stale and unavailable — because an absent answer about the identity anchor is an unknown, never a clear. This catches the carrier-side swap that pqsi_check_anchor_cooling structurally cannot see.';

alter table carrier_sim_swap_checks enable row level security;

revoke all on function pqsi_record_anchor_change, pqsi_mark_anchor_notified from public, anon;
grant execute on function pqsi_dispute_anchor_change to authenticated;  -- victims need this
grant execute on function pqsi_check_anchor_cooling  to authenticated;
alter table identity_anchor_changes enable row level security;
drop policy if exists anchor_own_read on identity_anchor_changes;
create policy anchor_own_read on identity_anchor_changes for select to authenticated
  using (citizen_id in (select id from citizens where auth_user_id = auth.uid()));

commit;

-- ============================================================================
-- STILL REQUIRED, NOT CODE
--   1. Wire pqsi_record_anchor_change() into every phone/device/TOTP change path.
--      A control that is not called is not a control.
--   2. Send the notification to the PREVIOUS channel. That single message is
--      what turns this from a delay into a detection.
--   3. Confirm no MPC key path is recoverable by SMS possession alone, or the
--      2-of-3 multisig is theatre (Security Law 4).
--   4. AJ: ask Vodafone Cook Islands about port-out locks for IN$DEX citizens.
--      A telco-side lock is worth more than everything above.
--
-- NOT VERIFIED — no Postgres in the sandbox. Needs a Supabase dev branch.
-- Depends on pqsi_policy, pqsi_log_event, pqsi_freeze_citizen (v1 file) and
-- pgcrypto for digest() — INSTALLED, in schema `extensions` (verified 2026-07-30),
-- which is why every digest() call above is written as extensions.digest().
-- ============================================================================
