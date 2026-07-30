-- ============================================================================
-- PQSI v1 — Threat Classifier & Active Containment
-- Physical Quantum Synthetic Intelligence · IN$DEX
--
-- Written 2026-07-30. NOT YET APPLIED to any Supabase project.
--
-- WHAT THIS REPLACES
--   Until now PQSI existed as a written design (pqsi-citizen-protection-spec.md,
--   security-canon.md) plus hardcoded "✓ pass" rows in transaction-confirm.html.
--   Nothing computed a threat tier. This file is the first executable PQSI.
--
-- WHAT IT DELIBERATELY DOES NOT DO
--   It does not counter-attack, retaliate against, probe, or disable an attacker's
--   system. See the ACTIVE DEFENCE note below — that boundary is deliberate and
--   is a licence-risk decision, not a technical shortcut.
--
-- TABLES USED (all pre-existing — verified against live schema 2026-07-30)
--   security_events            append-only, UPDATE/DELETE blocked (Security Law 7)
--   known_malicious_indicators blocklist  (was empty)
--   citizens                   account_frozen, totp_enabled, security_prefs, kyc_tier
--   transactions               velocity source
--   siindex_kill_switch        global halt (Security Law 6)
--   shield_checks              citizen-facing scam checks
--
-- TABLES CREATED
--   pqsi_policy                threshold config, one row
--   pqsi_protected_addresses   addresses a citizen must never be asked to pay
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. POLICY  (single row, id=1 — same pattern as siindex_kill_switch)
-- ---------------------------------------------------------------------------
create table if not exists pqsi_policy (
  id                        integer primary key default 1 check (id = 1),
  twofa_threshold_usd       numeric not null default 500,      -- canon 2FA_DEFAULT
  daily_outflow_cap_usd     numeric not null default 2000,
  travel_rule_threshold_usd numeric not null default 1000,     -- FATF, canon
  velocity_window_minutes   integer not null default 10,
  velocity_max_txns         integer not null default 5,
  new_payee_review_usd      numeric not null default 100,
  civilisation_fee_bps      integer not null default 200,      -- 2% — 98/2 Law
  civilisation_fee_tolerance_bps integer not null default 1,   -- rounding only
  allowed_chains            text[]  not null default '{solana}',
  updated_at                timestamptz not null default now(),
  updated_by                text
);

insert into pqsi_policy (id) values (1) on conflict (id) do nothing;

comment on column pqsi_policy.civilisation_fee_bps is
  '200 bps = 2%. Security Law 2: any deviation is T4 auto-block, no override.';

-- ---------------------------------------------------------------------------
-- 2. PROTECTED ADDRESSES
--    A citizen should never be instructed to send funds to a platform-owned
--    address. Every legitimate citizen payment goes to another citizen or a
--    merchant. So: outbound + platform-owned destination = the transaction is
--    either a scam page or a compromised screen. Block, do not warn.
-- ---------------------------------------------------------------------------
create table if not exists pqsi_protected_addresses (
  address     text primary key,
  label       text not null,
  chain       text not null default 'solana',
  note        text,
  added_at    timestamptz not null default now()
);

insert into pqsi_protected_addresses (address, label, note) values
  ('8HxNac3HAT56gJk3LRdGqiwq6DgciGK4cnaVMUNZaMZt',
   'IN$DEX treasury / Grid wallet',
   'Was published as a copyable address, a PayID line and a scannable Solana Pay QR on buy-indx.html until 2026-07-29, and as a dead JS constant until 2026-07-30. Any citizen-initiated outbound transfer to this address is T4.')
on conflict (address) do nothing;

-- ---------------------------------------------------------------------------
-- 3. EVENT WRITER
--    security_events blocks UPDATE and DELETE, so this only ever appends.
-- ---------------------------------------------------------------------------
create or replace function pqsi_log_event(
  p_tier        text,
  p_zone        text,
  p_description text,
  p_detail      jsonb  default '{}'::jsonb,
  p_correlation uuid   default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  insert into security_events (tier, zone, description, detail, correlation_id)
  values (p_tier, p_zone, p_description, p_detail, p_correlation)
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. THE CLASSIFIER
--
--    Evaluates every rule, collects findings, and returns the HIGHEST tier
--    reached. It never short-circuits: a T4 transaction still reports its T2
--    findings, because the audit record has to show everything that was seen,
--    not just the first thing that tripped.
--
--    Tier → decision
--      T0 ALLOW · T1 ALLOW (logged) · T2 REQUIRE_2FA · T3 HOLD · T4 BLOCK
-- ---------------------------------------------------------------------------
create or replace function pqsi_classify(
  p_citizen_id        uuid,
  p_amount_usd        numeric,
  p_counterparty      text    default null,
  p_direction         text    default 'out',
  p_chain             text    default 'solana',
  p_fee_usd           numeric default null,   -- for the 98/2 check
  p_channel           text    default 'app',
  p_dry_run           boolean default false   -- true = classify without logging
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  pol            pqsi_policy;
  cz             citizens;
  v_findings     jsonb := '[]'::jsonb;
  v_tier_num     integer := 0;
  v_tier         text;
  v_decision     text;
  v_event_id     uuid;
  v_halt         boolean;
  v_indicator    record;
  v_protected    record;
  v_recent_count integer;
  v_daily_total  numeric;
  v_seen_payee   integer;
  v_expected_fee numeric;
  v_fee_bps      numeric;
  v_threshold    numeric;
begin
  if p_amount_usd is null or p_amount_usd < 0 then
    raise exception 'pqsi_classify: amount_usd must be >= 0 (got %)', p_amount_usd;
  end if;

  select * into pol from pqsi_policy where id = 1;
  if not found then
    raise exception 'pqsi_classify: pqsi_policy row missing — refusing to classify blind';
  end if;

  select * into cz from citizens where id = p_citizen_id;
  -- cz may be null: an unknown citizen_id is itself a finding, handled below.

  -- ===== T4 =====================================================

  -- 4.1 Global halt (Security Law 6)
  select engaged into v_halt from siindex_kill_switch where id = 1;
  if coalesce(v_halt, false) then
    v_tier_num := 4;
    v_findings := v_findings || jsonb_build_object(
      'check','global_halt','tier','T4','result','fail',
      'detail','SIINDEX kill switch engaged. No transaction proceeds until AJ releases it in writing.');
  else
    v_findings := v_findings || jsonb_build_object(
      'check','global_halt','tier','T0','result','pass','detail','Kill switch clear.');
  end if;

  -- 4.2 Unknown citizen
  if cz.id is null then
    v_tier_num := greatest(v_tier_num, 4);
    v_findings := v_findings || jsonb_build_object(
      'check','citizen_exists','tier','T4','result','fail',
      'detail','No citizen row for the supplied id. Refusing to classify an unidentified actor as safe.');
  else
    v_findings := v_findings || jsonb_build_object(
      'check','citizen_exists','tier','T0','result','pass');
  end if;

  -- 4.3 Frozen account
  if coalesce(cz.account_frozen, false) then
    v_tier_num := greatest(v_tier_num, 4);
    v_findings := v_findings || jsonb_build_object(
      'check','account_frozen','tier','T4','result','fail',
      'detail', coalesce(cz.account_frozen_reason, 'Account frozen.'));
  end if;

  -- 4.4 98/2 Civilisation Law (Security Law 2 — no override)
  if p_fee_usd is not null and p_amount_usd > 0 then
    v_fee_bps := round((p_fee_usd / p_amount_usd) * 10000);
    if abs(v_fee_bps - pol.civilisation_fee_bps) > pol.civilisation_fee_tolerance_bps then
      v_tier_num := greatest(v_tier_num, 4);
      v_expected_fee := round(p_amount_usd * pol.civilisation_fee_bps / 10000.0, 6);
      v_findings := v_findings || jsonb_build_object(
        'check','civilisation_law_98_2','tier','T4','result','fail',
        'detail', format('Fee is %s bps, must be %s bps. Expected $%s on $%s, got $%s. 98/2 bypass is an automatic block with no override.',
                         v_fee_bps, pol.civilisation_fee_bps, v_expected_fee, p_amount_usd, p_fee_usd));
    else
      v_findings := v_findings || jsonb_build_object(
        'check','civilisation_law_98_2','tier','T0','result','pass',
        'detail', format('Fee %s bps within tolerance of %s bps.', v_fee_bps, pol.civilisation_fee_bps));
    end if;
  else
    v_findings := v_findings || jsonb_build_object(
      'check','civilisation_law_98_2','tier','T1','result','not_evaluated',
      'detail','No fee supplied. Fee split not verified for this call.');
    v_tier_num := greatest(v_tier_num, 1);
  end if;

  -- 4.5 Protected-address guard  ← the failure mode that prompted this build
  if p_counterparty is not null and lower(p_direction) = 'out' then
    select * into v_protected from pqsi_protected_addresses where address = p_counterparty;
    if found then
      v_tier_num := greatest(v_tier_num, 4);
      v_findings := v_findings || jsonb_build_object(
        'check','protected_address','tier','T4','result','fail',
        'detail', format('Destination is %s — a platform-owned address. Citizens are never asked to send funds to IN$DEX. This transaction originates from a scam page or a compromised screen.', v_protected.label));
    else
      v_findings := v_findings || jsonb_build_object(
        'check','protected_address','tier','T0','result','pass');
    end if;
  end if;

  -- 4.6 / 3.1 / 2.1  Blocklist, severity-graded
  if p_counterparty is not null then
    select * into v_indicator
      from known_malicious_indicators
     where indicator_value = p_counterparty
       and status = 'active'
     order by case severity when 'critical' then 4 when 'high' then 3
                            when 'medium' then 2 else 1 end desc
     limit 1;
    if found then
      v_tier_num := greatest(v_tier_num,
        case v_indicator.severity
          when 'critical' then 4 when 'high' then 3
          when 'medium'   then 2 else 1 end);
      v_findings := v_findings || jsonb_build_object(
        'check','blocklist','tier',
          case v_indicator.severity when 'critical' then 'T4' when 'high' then 'T3'
                                    when 'medium' then 'T2' else 'T1' end,
        'result','fail',
        'detail', format('Counterparty is a known %s indicator: %s (source: %s)',
                         v_indicator.severity, v_indicator.reason, v_indicator.source));
    else
      v_findings := v_findings || jsonb_build_object(
        'check','blocklist','tier','T0','result','pass');
    end if;
  end if;

  -- ===== T3 =====================================================

  -- 3.2 Chain allowed
  if not (p_chain = any (pol.allowed_chains)) then
    v_tier_num := greatest(v_tier_num, 3);
    v_findings := v_findings || jsonb_build_object(
      'check','chain_allowed','tier','T3','result','fail',
      'detail', format('Chain "%s" is not in the allowed set %s.', p_chain, pol.allowed_chains));
  else
    v_findings := v_findings || jsonb_build_object(
      'check','chain_allowed','tier','T0','result','pass','detail',p_chain);
  end if;

  -- 3.3 Daily outflow cap
  select coalesce(sum(amount_usd), 0) into v_daily_total
    from transactions
   where citizen_id = p_citizen_id
     and direction = 'out'
     and status <> 'failed'
     and created_at >= now() - interval '24 hours';

  if (v_daily_total + p_amount_usd) > pol.daily_outflow_cap_usd then
    v_tier_num := greatest(v_tier_num, 3);
    v_findings := v_findings || jsonb_build_object(
      'check','daily_outflow_cap','tier','T3','result','fail',
      'detail', format('$%s already sent in 24h; this $%s would reach $%s against a $%s cap.',
                       v_daily_total, p_amount_usd, v_daily_total + p_amount_usd, pol.daily_outflow_cap_usd));
  else
    v_findings := v_findings || jsonb_build_object(
      'check','daily_outflow_cap','tier','T0','result','pass',
      'detail', format('$%s of $%s cap.', v_daily_total + p_amount_usd, pol.daily_outflow_cap_usd));
  end if;

  -- 3.4 Velocity
  select count(*) into v_recent_count
    from transactions
   where citizen_id = p_citizen_id
     and direction = 'out'
     and created_at >= now() - (pol.velocity_window_minutes || ' minutes')::interval;

  if v_recent_count >= pol.velocity_max_txns then
    v_tier_num := greatest(v_tier_num, 3);
    v_findings := v_findings || jsonb_build_object(
      'check','velocity','tier','T3','result','fail',
      'detail', format('%s outbound transfers in %s minutes (limit %s). Consistent with a drained or remote-controlled device.',
                       v_recent_count, pol.velocity_window_minutes, pol.velocity_max_txns));
  else
    v_findings := v_findings || jsonb_build_object(
      'check','velocity','tier','T0','result','pass',
      'detail', format('%s recent outbound.', v_recent_count));
  end if;

  -- 3.5 Travel Rule (FATF, >$1,000)
  if p_amount_usd > pol.travel_rule_threshold_usd then
    if coalesce(cz.kyc_tier, 0) < 1 then
      v_tier_num := greatest(v_tier_num, 3);
      v_findings := v_findings || jsonb_build_object(
        'check','travel_rule','tier','T3','result','fail',
        'detail', format('$%s exceeds the $%s Travel Rule threshold but citizen is KYC tier %s. A ZK originator/beneficiary proof is required before this can settle.',
                         p_amount_usd, pol.travel_rule_threshold_usd, coalesce(cz.kyc_tier,0)));
    else
      v_findings := v_findings || jsonb_build_object(
        'check','travel_rule','tier','T1','result','pass',
        'detail','Above threshold; citizen holds a tier sufficient to produce a ZK proof.');
      v_tier_num := greatest(v_tier_num, 1);
    end if;
  end if;

  -- ===== T2 =====================================================

  -- 2.2 2FA threshold (citizen override honoured if lower — never higher)
  v_threshold := least(
    pol.twofa_threshold_usd,
    coalesce((cz.security_prefs->>'twofa_threshold_usd')::numeric, pol.twofa_threshold_usd)
  );

  if p_amount_usd > v_threshold then
    v_tier_num := greatest(v_tier_num, 2);
    if coalesce(cz.totp_enabled, false) then
      v_findings := v_findings || jsonb_build_object(
        'check','twofa_required','tier','T2','result','escalate',
        'detail', format('$%s is above the $%s 2FA threshold. Citizen has TOTP enabled — prompt for the code.',
                         p_amount_usd, v_threshold));
    else
      v_tier_num := greatest(v_tier_num, 3);
      v_findings := v_findings || jsonb_build_object(
        'check','twofa_required','tier','T3','result','fail',
        'detail', format('$%s is above the $%s 2FA threshold and this citizen has no TOTP enrolled. Security Law 5: 2FA is non-negotiable above the threshold, so this cannot proceed — it holds until enrolment.',
                         p_amount_usd, v_threshold));
    end if;
  else
    v_findings := v_findings || jsonb_build_object(
      'check','twofa_required','tier','T0','result','pass',
      'detail', format('$%s within the $%s threshold.', p_amount_usd, v_threshold));
  end if;

  -- 2.3 First payment to a new payee
  if p_counterparty is not null and lower(p_direction) = 'out' then
    select count(*) into v_seen_payee
      from transactions
     where citizen_id = p_citizen_id
       and counterparty_address = p_counterparty
       and status = 'confirmed';

    if v_seen_payee = 0 then
      if p_amount_usd > pol.new_payee_review_usd then
        v_tier_num := greatest(v_tier_num, 2);
        v_findings := v_findings || jsonb_build_object(
          'check','new_payee','tier','T2','result','escalate',
          'detail', format('First ever payment to this address and $%s is above the $%s new-payee review line. Confirm the recipient out of band.',
                           p_amount_usd, pol.new_payee_review_usd));
      else
        v_tier_num := greatest(v_tier_num, 1);
        v_findings := v_findings || jsonb_build_object(
          'check','new_payee','tier','T1','result','advisory',
          'detail','First payment to this address, small amount. Logged.');
      end if;
    else
      v_findings := v_findings || jsonb_build_object(
        'check','new_payee','tier','T0','result','pass',
        'detail', format('%s previous confirmed payments to this address.', v_seen_payee));
    end if;
  end if;

  -- ===== RESOLVE ================================================
  v_tier := 'T' || v_tier_num;
  v_decision := case v_tier_num
    when 0 then 'ALLOW'
    when 1 then 'ALLOW'
    when 2 then 'REQUIRE_2FA'
    when 3 then 'HOLD'
    when 4 then 'BLOCK'
  end;

  -- Every classification is recorded, including clean ones. A security log that
  -- only contains failures cannot prove the system was watching.
  if not p_dry_run then
    v_event_id := pqsi_log_event(
      v_tier,
      'TRANSACTION',
      format('PQSI %s %s — $%s %s', v_tier, v_decision, p_amount_usd, coalesce(p_direction,'?')),
      jsonb_build_object(
        'citizen_id',   p_citizen_id,
        'amount_usd',   p_amount_usd,
        'counterparty', p_counterparty,
        'direction',    p_direction,
        'chain',        p_chain,
        'channel',      p_channel,
        'tier',         v_tier,
        'decision',     v_decision,
        'findings',     v_findings,
        'policy_version', pol.updated_at,
        'classifier',   'pqsi_v1'
      )
    );
  end if;

  -- A T4 arms the global halt automatically. Security Law 6: only AJ releases it.
  if v_tier_num = 4 and not p_dry_run then
    update siindex_kill_switch
       set engaged = true,
           engaged_by = 'pqsi_classify',
           engaged_at = now(),
           reason = format('T4 auto-halt. Event %s.', v_event_id)
     where id = 1 and engaged = false;
  end if;

  return jsonb_build_object(
    'tier',       v_tier,
    'decision',   v_decision,
    'event_id',   v_event_id,
    'findings',   v_findings,
    'checks_run', jsonb_array_length(v_findings),
    'classified_at', now()
  );
end;
$$;

comment on function pqsi_classify is
  'PQSI v1 threat classifier. Returns the highest tier reached across all rules and appends the full finding set to security_events. Never short-circuits — a T4 still reports its lower findings so the audit record is complete.';

-- ---------------------------------------------------------------------------
-- 5. ACTIVE DEFENCE  (containment — deliberately not counter-attack)
--
--    AJ's requirement: the system must act decisively against malicious
--    activity, not merely warn about it. These functions do that.
--
--    What they do: freeze, blocklist, halt, and propagate a block to every
--    citizen at once. pqsi_classify reads known_malicious_indicators live, so
--    the moment an address is contained, every citizen in the network is
--    protected on their very next transaction. No update to ship, no app
--    release, no citizen action required. That is the fast, aggressive part.
--
--    What they deliberately do not do: reach out to an attacker's system to
--    disable, probe, overload or damage it. Three reasons, in order of weight —
--      1. Under a Cook Islands FSC licence, unauthorised access to a third
--         party's computer is a criminal offence and a licence-condition
--         breach. It would put the licence, not just the transaction, at risk.
--      2. Attribution on-chain is unreliable. Attacks commonly route through
--         compromised machines belonging to innocent people. Retaliation hits
--         the victim, not the attacker.
--      3. Outbound attack code is itself an attack surface — it is a privileged
--         path into IN$DEX that an attacker can bait and turn around.
--
--    Containment is the aggressive option that survives contact with a
--    regulator. If AJ wants this boundary revisited it is a founder decision
--    requiring Cook Islands legal advice first, not a code change.
-- ---------------------------------------------------------------------------

-- 5.1 Contain an indicator — propagates to every citizen immediately
create or replace function pqsi_contain(
  p_indicator_type  text,
  p_indicator_value text,
  p_severity        text,
  p_reason          text,
  p_source          text default 'pqsi_auto'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid; v_event uuid;
begin
  if p_severity not in ('low','medium','high','critical') then
    raise exception 'pqsi_contain: severity must be low|medium|high|critical (got %)', p_severity;
  end if;

  insert into known_malicious_indicators
    (indicator_type, indicator_value, severity, reason, source, status)
  values (p_indicator_type, p_indicator_value, p_severity, p_reason, p_source, 'active')
  returning id into v_id;

  v_event := pqsi_log_event(
    case p_severity when 'critical' then 'T4' when 'high' then 'T3'
                    when 'medium' then 'T2' else 'T1' end,
    'CONTAINMENT',
    format('Contained %s: %s', p_indicator_type, p_indicator_value),
    jsonb_build_object('indicator_id', v_id, 'severity', p_severity,
                       'reason', p_reason, 'source', p_source));

  return jsonb_build_object('contained', true, 'indicator_id', v_id, 'event_id', v_event);
end;
$$;

-- 5.2 Freeze a citizen's account (compromise response)
create or replace function pqsi_freeze_citizen(
  p_citizen_id uuid,
  p_reason     text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_event uuid; v_rows integer;
begin
  update citizens
     set account_frozen = true,
         account_frozen_at = now(),
         account_frozen_reason = p_reason
   where id = p_citizen_id and account_frozen = false;
  get diagnostics v_rows = row_count;

  v_event := pqsi_log_event('T3','CONTAINMENT',
    format('Account frozen: %s', p_citizen_id),
    jsonb_build_object('citizen_id', p_citizen_id, 'reason', p_reason,
                       'already_frozen', v_rows = 0));

  return jsonb_build_object('frozen', true, 'newly_frozen', v_rows > 0, 'event_id', v_event);
end;
$$;

-- 5.3 Citizen-reported indicator — the swarm. Citizens defend each other.
--     Enters at 'medium' pending review: a citizen report is a real signal but
--     not proof, and an unreviewed critical would let one citizen block the
--     whole network.
create or replace function pqsi_report_indicator(
  p_citizen_id      uuid,
  p_indicator_type  text,
  p_indicator_value text,
  p_reason          text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid; v_event uuid;
begin
  insert into known_malicious_indicators
    (indicator_type, indicator_value, severity, reason, source,
     reported_by_citizen_id, status)
  values (p_indicator_type, p_indicator_value, 'medium', p_reason,
          'citizen_report', p_citizen_id, 'active')
  returning id into v_id;

  v_event := pqsi_log_event('T2','CITIZEN_REPORT',
    format('Citizen reported %s: %s', p_indicator_type, p_indicator_value),
    jsonb_build_object('indicator_id', v_id, 'reported_by', p_citizen_id,
                       'reason', p_reason, 'review_required', true));

  return jsonb_build_object('reported', true, 'indicator_id', v_id,
                            'severity','medium','event_id', v_event);
end;
$$;

-- 5.4 Release the halt — founder only (Security Law 6)
create or replace function pqsi_release_halt(
  p_authorisation text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_event uuid; v_founder integer;
begin
  select count(*) into v_founder from founder_authority;
  if v_founder = 0 then
    raise exception 'pqsi_release_halt: no founder_authority row. Refusing to release a halt with no authority to point at.';
  end if;

  if p_authorisation is null or length(trim(p_authorisation)) < 20 then
    raise exception 'pqsi_release_halt: Security Law 6 requires explicit written authorisation from AJ. Supply the authorisation text.';
  end if;

  update siindex_kill_switch
     set engaged = false, engaged_by = null, engaged_at = null,
         reason = format('Released. Authorisation: %s', p_authorisation)
   where id = 1;

  v_event := pqsi_log_event('T1','HALT_RELEASE',
    'Global halt released under founder authorisation',
    jsonb_build_object('authorisation', p_authorisation));

  return jsonb_build_object('released', true, 'event_id', v_event);
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. GRANTS — citizens may report and classify; they may not contain or release.
-- ---------------------------------------------------------------------------
revoke all on function pqsi_contain        from public, anon, authenticated;
revoke all on function pqsi_freeze_citizen from public, anon, authenticated;
revoke all on function pqsi_release_halt   from public, anon, authenticated;
revoke all on function pqsi_log_event      from public, anon, authenticated;

grant execute on function pqsi_classify         to authenticated;
grant execute on function pqsi_report_indicator to authenticated;

alter table pqsi_policy              enable row level security;
alter table pqsi_protected_addresses enable row level security;

-- Protected addresses are readable so a client can refuse a bad destination
-- before it ever submits. Nobody but service_role may write.
drop policy if exists pqsi_protected_read on pqsi_protected_addresses;
create policy pqsi_protected_read on pqsi_protected_addresses
  for select to authenticated using (true);

drop policy if exists pqsi_policy_read on pqsi_policy;
create policy pqsi_policy_read on pqsi_policy
  for select to authenticated using (true);

commit;
