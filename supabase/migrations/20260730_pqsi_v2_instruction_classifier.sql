-- ============================================================================
-- PQSI v2 — Instruction-Level Threat Classifier
-- Launch gates G1 + G2 + G7 · IN$DEX · written 2026-07-30 · NOT YET APPLIED
--
-- WHY v1 WAS ABANDONED
--   v1 (20260730_pqsi_v1_classifier.sql) classified `amount_usd` and
--   `counterparty`. Research the same day established that the three
--   highest-loss Solana attack classes all move ZERO tokens at the moment of
--   signing, so v1 scored every one of them T0 — ALLOW:
--
--     assign          System Program instruction that reassigns the OWNER of an
--                     account. No balance change, so wallet simulation reports a
--                     clean result. The victim's private key becomes irrelevant.
--     setAuthority    SPL Token equivalent, one layer up. SwissBorg lost 192,600
--                     SOL (~$41M) to a transaction that presented as a routine
--                     unstake; the attacker waited eight days, then drained.
--     durable nonce   A transaction that never expires. Drift Protocol, April
--                     2026, $270M+ — the largest Solana exploit of the year —
--                     against a Squads multisig, separating approval from
--                     execution by more than a week.
--
--   Do not apply v1. This file replaces it. The function signature changes.
--
-- WHAT v2 ADDS
--   G1  Instruction-level classification. Refuses to run without the decoded
--       instruction list rather than returning a falsely clean tier.
--   G2  Execution-time re-verification. Fails closed if program code, the
--       instruction set, or the blocklist changed between approval and broadcast.
--   G7  Address-poisoning defence — lookalike detection and dust suppression.
--
-- Depends on v1 for: pqsi_policy, pqsi_protected_addresses, pqsi_log_event,
-- pqsi_contain, pqsi_freeze_citizen, pqsi_report_indicator, pqsi_release_halt.
-- Apply v1's table/helper section first, or run both together on a branch.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. PROGRAM ALLOWLIST
--    Solana's runtime grants every program in a signed transaction write access
--    to every writable account in it. So an unknown program is not a minor
--    unknown — it is unbounded authority over the accounts in that transaction.
-- ---------------------------------------------------------------------------
create table if not exists pqsi_program_allowlist (
  program_id      text primary key,
  label           text not null,
  is_upgradeable  boolean,
  deployment_slot bigint,
  last_verified   timestamptz,
  notes           text
);

insert into pqsi_program_allowlist (program_id, label, is_upgradeable, notes) values
  ('11111111111111111111111111111111','System Program', false,
   'Native. Contains `assign` — see pqsi_dangerous_instructions.'),
  ('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA','SPL Token Program', false,
   'INDX canonical standard. Contains `setAuthority` and `approve`.'),
  ('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL','Associated Token Account', false, null),
  ('ComputeBudget111111111111111111111111111111','Compute Budget', false, null)
on conflict (program_id) do nothing;

comment on table pqsi_program_allowlist is
  'Any program NOT listed here raises the tier. Absence is the signal — an unrecognised program in a signed transaction holds write access to every writable account in it.';

-- ---------------------------------------------------------------------------
-- 2. DANGEROUS INSTRUCTION REGISTRY
--    Each row is an instruction that is legitimate in operator hands and never
--    legitimate in a citizen-initiated transfer.
-- ---------------------------------------------------------------------------
create table if not exists pqsi_dangerous_instructions (
  program_id       text not null,
  instruction_name text not null,
  tier             integer not null check (tier between 1 and 4),
  reason           text not null,
  primary key (program_id, instruction_name)
);

insert into pqsi_dangerous_instructions values
  ('11111111111111111111111111111111','assign',4,
   'Reassigns the OWNER of an account to another program. Moves no tokens, so wallet simulation shows nothing. Once reassigned the original keyholder has no recovery path. No legitimate citizen flow reassigns account ownership.'),
  ('11111111111111111111111111111111','assignWithSeed',4,
   'Same as assign, seed-derived.'),
  ('11111111111111111111111111111111','advanceNonce',3,
   'Durable nonce. The transaction no longer expires — a signed blank cheque. Drift Protocol, April 2026, $270M+. No citizen transaction needs one.'),
  ('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA','setAuthority',4,
   'Transfers control of a token account. SwissBorg: 192,600 SOL (~$41M) via a transaction that looked like a routine unstake. Operator-side only.'),
  ('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA','approve',3,
   'Delegates spend authority. The permit-signature class — 38% of 2025 incidents above $1M.'),
  ('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA','approveChecked',3,'As approve.'),
  ('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA','closeAccount',2,
   'Closes a token account and reclaims rent. Legitimate, but bundled with a drain it destroys the audit trail.'),
  ('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA','freezeAccount',4,
   'INDX freeze authority is burned — this instruction cannot legitimately appear.')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 3. G7 — lookalike address detection
--    Address poisoning: seed a victim's history with an address matching the
--    first and last characters of one they trust, then wait for them to copy the
--    wrong row. 270M attempts documented across two chains, Jul 2022 – Jun 2024.
-- ---------------------------------------------------------------------------
create or replace function pqsi_is_lookalike(
  p_citizen_id  uuid,
  p_candidate   text,
  p_prefix_len  integer default 4,
  p_suffix_len  integer default 4
) returns table (matched_address text, prefix text, suffix text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct t.counterparty_address,
         left(p_candidate, p_prefix_len),
         right(p_candidate, p_suffix_len)
    from transactions t
   where t.citizen_id = p_citizen_id
     and t.status = 'confirmed'
     and t.counterparty_address is not null
     and t.counterparty_address <> p_candidate
     and left(t.counterparty_address, p_prefix_len) = left(p_candidate, p_prefix_len)
     and right(t.counterparty_address, p_suffix_len) = right(p_candidate, p_suffix_len);
$$;

comment on function pqsi_is_lookalike is
  'Same first-4 and last-4 as an address the citizen has actually paid, but a different address. That is the exact signature of address poisoning — the two rows are visually identical in any truncated UI.';

-- ---------------------------------------------------------------------------
-- 4. THE v2 CLASSIFIER
--
--    p_instructions is REQUIRED and must be the decoded instruction list:
--      [{"program_id":"...","name":"transfer","accounts":[...],"data":"..."}, ...]
--
--    If it is absent the function RAISES. It does not fall back to an
--    amount-only judgement. A classifier that returns T0 because it was handed
--    too little information is the false-confidence failure that let v1 of the
--    screen audit report "260 files, 0 violations — CLEAN" over a live 41.7x
--    return calculator.
-- ---------------------------------------------------------------------------
create or replace function pqsi_classify_v2(
  p_citizen_id   uuid,
  p_amount_usd   numeric,
  p_instructions jsonb,                     -- REQUIRED
  p_counterparty text    default null,
  p_direction    text    default 'out',
  p_chain        text    default 'solana',
  p_fee_usd      numeric default null,
  p_channel      text    default 'app',
  p_dry_run      boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  pol        pqsi_policy;
  cz         citizens;
  f          jsonb := '[]'::jsonb;          -- findings
  tier       integer := 0;
  ix         jsonb;
  danger     record;
  look       record;
  v_event    uuid;
  v_halt     boolean;
  v_ind      record;
  v_recent   integer;
  v_daily    numeric;
  v_seen     integer;
  v_bps      numeric;
  v_thresh   numeric;
  v_unknown  text[] := '{}';
  v_nonce    boolean := false;
  v_ixcount  integer;
  v_hash     text;
begin
  -- ===== G1 GATE: refuse to classify blind =====
  if p_instructions is null or jsonb_typeof(p_instructions) <> 'array' then
    raise exception 'pqsi_classify_v2: p_instructions is required and must be a JSON array of decoded instructions. Refusing to return a tier from amount alone — assign, setAuthority and durable-nonce attacks all move zero tokens at signing and would score T0.';
  end if;
  if jsonb_array_length(p_instructions) = 0 then
    raise exception 'pqsi_classify_v2: instruction list is empty. A transaction with no instructions cannot be classified.';
  end if;
  if p_amount_usd is null or p_amount_usd < 0 then
    raise exception 'pqsi_classify_v2: amount_usd must be >= 0 (got %)', p_amount_usd;
  end if;

  select * into pol from pqsi_policy where id = 1;
  if not found then
    raise exception 'pqsi_classify_v2: pqsi_policy row missing — refusing to classify against unknown thresholds';
  end if;
  select * into cz from citizens where id = p_citizen_id;

  v_ixcount := jsonb_array_length(p_instructions);
  v_hash    := md5(p_instructions::text);

  -- ===== INSTRUCTION SWEEP (G1) =====
  for ix in select * from jsonb_array_elements(p_instructions) loop
    -- dangerous instruction?
    select * into danger from pqsi_dangerous_instructions
     where program_id = (ix->>'program_id')
       and lower(instruction_name) = lower(coalesce(ix->>'name',''));
    if found then
      tier := greatest(tier, danger.tier);
      f := f || jsonb_build_object(
        'check','instruction:'||danger.instruction_name,
        'tier','T'||danger.tier,'result','fail',
        'program', danger.program_id,
        'detail', danger.reason);
      if lower(danger.instruction_name) = 'advancenonce' then v_nonce := true; end if;
    end if;

    -- unknown program?
    if not exists (select 1 from pqsi_program_allowlist
                    where program_id = (ix->>'program_id')) then
      v_unknown := v_unknown || (ix->>'program_id');
    end if;
  end loop;

  if array_length(v_unknown,1) > 0 then
    tier := greatest(tier, 2);
    f := f || jsonb_build_object(
      'check','unknown_program','tier','T2','result','fail',
      'detail', format('%s program(s) not on the allowlist: %s. Solana grants every program in a signed transaction write access to every writable account in it, so an unrecognised program holds unbounded authority here. Verify the program is immutable and audited before allowlisting.',
                       array_length(v_unknown,1), array_to_string(v_unknown, ', ')));
  else
    f := f || jsonb_build_object('check','unknown_program','tier','T0','result','pass',
                                 'detail', format('%s instruction(s), all programs allowlisted.', v_ixcount));
  end if;

  -- durable nonce reaching a citizen wallet from outside IN$DEX = T4
  if v_nonce and p_channel <> 'indx_internal' then
    tier := greatest(tier, 4);
    f := f || jsonb_build_object(
      'check','durable_nonce_external','tier','T4','result','fail',
      'detail','A non-expiring transaction arriving from outside IN$DEX is a signed blank cheque — the attacker chooses when it executes, and can upgrade the target program first. No citizen flow needs one.');
  end if;

  -- atomic bundling: many instructions + an unknown program is the delivery
  -- shape used in the SwissBorg setAuthority drain.
  if v_ixcount > 6 and array_length(v_unknown,1) > 0 then
    tier := greatest(tier, 3);
    f := f || jsonb_build_object(
      'check','atomic_bundle','tier','T3','result','fail',
      'detail', format('%s instructions including %s unknown program(s). Solana transactions are all-or-nothing, so bundling hides a hostile instruction among routine ones.',
                       v_ixcount, array_length(v_unknown,1)));
  end if;

  -- ===== T4: halt, identity, freeze, 98/2, protected address =====
  select engaged into v_halt from siindex_kill_switch where id = 1;
  if coalesce(v_halt,false) then
    tier := 4;
    f := f || jsonb_build_object('check','global_halt','tier','T4','result','fail',
      'detail','Kill switch engaged. Nothing proceeds until AJ releases it in writing.');
  end if;

  if cz.id is null then
    tier := greatest(tier,4);
    f := f || jsonb_build_object('check','citizen_exists','tier','T4','result','fail',
      'detail','No citizen row for the supplied id. An unidentified actor is never classified safe.');
  end if;

  if coalesce(cz.account_frozen,false) then
    tier := greatest(tier,4);
    f := f || jsonb_build_object('check','account_frozen','tier','T4','result','fail',
      'detail', coalesce(cz.account_frozen_reason,'Account frozen.'));
  end if;

  if p_fee_usd is not null and p_amount_usd > 0 then
    v_bps := round((p_fee_usd / p_amount_usd) * 10000);
    if abs(v_bps - pol.civilisation_fee_bps) > pol.civilisation_fee_tolerance_bps then
      tier := greatest(tier,4);
      f := f || jsonb_build_object('check','civilisation_law_98_2','tier','T4','result','fail',
        'detail', format('Fee %s bps, must be %s bps. Security Law 2 — automatic block, no override.',
                         v_bps, pol.civilisation_fee_bps));
    else
      f := f || jsonb_build_object('check','civilisation_law_98_2','tier','T0','result','pass');
    end if;
  else
    tier := greatest(tier,1);
    f := f || jsonb_build_object('check','civilisation_law_98_2','tier','T1','result','not_evaluated',
      'detail','No fee supplied — split not verified.');
  end if;

  if p_counterparty is not null and lower(p_direction) = 'out'
     and exists (select 1 from pqsi_protected_addresses where address = p_counterparty) then
    tier := greatest(tier,4);
    f := f || jsonb_build_object('check','protected_address','tier','T4','result','fail',
      'detail','Destination is a platform-owned address. Citizens are never asked to send funds to IN$DEX, so this originates from a scam page or a compromised screen.');
  end if;

  -- blocklist, severity-graded
  if p_counterparty is not null then
    select * into v_ind from known_malicious_indicators
     where indicator_value = p_counterparty and status = 'active'
     order by case severity when 'critical' then 4 when 'high' then 3
                            when 'medium' then 2 else 1 end desc limit 1;
    if found then
      tier := greatest(tier, case v_ind.severity when 'critical' then 4
                                                 when 'high' then 3
                                                 when 'medium' then 2 else 1 end);
      f := f || jsonb_build_object('check','blocklist','tier','T'||
        (case v_ind.severity when 'critical' then 4 when 'high' then 3
                             when 'medium' then 2 else 1 end),
        'result','fail','detail', format('Known %s indicator: %s', v_ind.severity, v_ind.reason));
    end if;
  end if;

  -- ===== G7: lookalike address =====
  if p_counterparty is not null and lower(p_direction) = 'out' then
    select * into look from pqsi_is_lookalike(p_citizen_id, p_counterparty) limit 1;
    if look.matched_address is not null then
      tier := greatest(tier,3);
      f := f || jsonb_build_object('check','lookalike_address','tier','T3','result','fail',
        'detail', format('Destination shares its first 4 and last 4 characters with %s, an address this citizen has paid before, but is not that address. This is the signature of address poisoning — the two are indistinguishable in a truncated display. Confirm out of band.',
                         look.matched_address));
    else
      f := f || jsonb_build_object('check','lookalike_address','tier','T0','result','pass');
    end if;
  end if;

  -- ===== T3: chain, cap, velocity, travel rule =====
  if not (p_chain = any (pol.allowed_chains)) then
    tier := greatest(tier,3);
    f := f || jsonb_build_object('check','chain_allowed','tier','T3','result','fail',
      'detail', format('Chain "%s" not in %s.', p_chain, pol.allowed_chains));
  end if;

  select coalesce(sum(amount_usd),0) into v_daily from transactions
   where citizen_id = p_citizen_id and direction='out' and status <> 'failed'
     and created_at >= now() - interval '24 hours';
  if (v_daily + p_amount_usd) > pol.daily_outflow_cap_usd then
    tier := greatest(tier,3);
    f := f || jsonb_build_object('check','daily_outflow_cap','tier','T3','result','fail',
      'detail', format('$%s in 24h + $%s exceeds the $%s cap.', v_daily, p_amount_usd, pol.daily_outflow_cap_usd));
  end if;

  select count(*) into v_recent from transactions
   where citizen_id = p_citizen_id and direction='out'
     and created_at >= now() - (pol.velocity_window_minutes||' minutes')::interval;
  if v_recent >= pol.velocity_max_txns then
    tier := greatest(tier,3);
    f := f || jsonb_build_object('check','velocity','tier','T3','result','fail',
      'detail', format('%s outbound in %s min (limit %s) — consistent with a drained or remote-controlled device.',
                       v_recent, pol.velocity_window_minutes, pol.velocity_max_txns));
  end if;

  if p_amount_usd > pol.travel_rule_threshold_usd and coalesce(cz.kyc_tier,0) < 1 then
    tier := greatest(tier,3);
    f := f || jsonb_build_object('check','travel_rule','tier','T3','result','fail',
      'detail', format('$%s exceeds the $%s FATF threshold at KYC tier %s. A ZK originator/beneficiary proof is required first.',
                       p_amount_usd, pol.travel_rule_threshold_usd, coalesce(cz.kyc_tier,0)));
  end if;

  -- ===== T2: 2FA, new payee, proportional risk =====
  v_thresh := least(pol.twofa_threshold_usd,
    coalesce((cz.security_prefs->>'twofa_threshold_usd')::numeric, pol.twofa_threshold_usd));
  if p_amount_usd > v_thresh then
    if coalesce(cz.totp_enabled,false) then
      tier := greatest(tier,2);
      f := f || jsonb_build_object('check','twofa_required','tier','T2','result','escalate',
        'detail', format('$%s above the $%s threshold. TOTP enrolled — prompt for the code.', p_amount_usd, v_thresh));
    else
      tier := greatest(tier,3);
      f := f || jsonb_build_object('check','twofa_required','tier','T3','result','fail',
        'detail', format('$%s above the $%s threshold with no TOTP enrolled. Security Law 5 — holds until enrolment.', p_amount_usd, v_thresh));
    end if;
  end if;

  -- Proportional risk: size to the citizen, not the dollar. Average drainer loss
  -- in 2025 was $790 — trivial to an analyst, catastrophic to a Pacific vendor.
  if coalesce(cz.indx_balance,0) > 0 and p_amount_usd > 0 then
    declare v_share numeric := p_amount_usd / (cz.indx_balance * 0.24);
    begin
      if v_share >= 0.80 then
        tier := greatest(tier,2);
        f := f || jsonb_build_object('check','balance_share','tier','T2','result','escalate',
          'detail', format('This moves %s%% of everything the citizen holds. Absolute size is not the right test for a citizen whose whole balance is small.',
                           round(v_share*100)));
      end if;
    end;
  end if;

  if p_counterparty is not null and lower(p_direction)='out' then
    select count(*) into v_seen from transactions
     where citizen_id=p_citizen_id and counterparty_address=p_counterparty and status='confirmed';
    if v_seen = 0 and p_amount_usd > pol.new_payee_review_usd then
      tier := greatest(tier,2);
      f := f || jsonb_build_object('check','new_payee','tier','T2','result','escalate',
        'detail','First payment to this address above the review line. Confirm the recipient out of band.');
    end if;
  end if;

  -- ===== RESOLVE =====
  declare
    v_tier text := 'T'||tier;
    v_dec  text := case tier when 0 then 'ALLOW' when 1 then 'ALLOW'
                             when 2 then 'REQUIRE_2FA' when 3 then 'HOLD' else 'BLOCK' end;
  begin
    if not p_dry_run then
      v_event := pqsi_log_event(v_tier,'TRANSACTION',
        format('PQSI v2 %s %s — $%s %s', v_tier, v_dec, p_amount_usd, p_direction),
        jsonb_build_object(
          'classifier','pqsi_v2','citizen_id',p_citizen_id,'amount_usd',p_amount_usd,
          'counterparty',p_counterparty,'direction',p_direction,'chain',p_chain,
          'channel',p_channel,'tier',v_tier,'decision',v_dec,'findings',f,
          'instruction_count',v_ixcount,'instruction_hash',v_hash,
          'unknown_programs',to_jsonb(v_unknown),'policy_version',pol.updated_at));

      if tier = 4 then
        update siindex_kill_switch
           set engaged=true, engaged_by='pqsi_classify_v2', engaged_at=now(),
               reason=format('T4 auto-halt. Event %s.', v_event)
         where id=1 and engaged=false;
      end if;
    end if;

    return jsonb_build_object(
      'tier',v_tier,'decision',v_dec,'event_id',v_event,'findings',f,
      'checks_run',jsonb_array_length(f),
      'instruction_count',v_ixcount,'instruction_hash',v_hash,
      'classified_at',now());
  end;
end;
$$;

comment on function pqsi_classify_v2 is
  'PQSI v2. Classifies decoded instructions, not just amounts. RAISES rather than returning a tier if the instruction list is absent — the three highest-loss Solana attack classes move zero tokens at signing and any amount-only classifier scores them T0.';

-- ---------------------------------------------------------------------------
-- 5. G2 — EXECUTION-TIME RE-VERIFICATION
--
--    A classification is a snapshot. Drift's attacker separated approval from
--    execution by over a week; SwissBorg's by eight days. Blockaid documents
--    TOCTOU drains where the state changed seven blocks after simulation.
--    So: re-check immediately before broadcast, and FAIL CLOSED.
-- ---------------------------------------------------------------------------
create or replace function pqsi_reverify(
  p_event_id     uuid,
  p_instructions jsonb,
  p_program_slots jsonb default '{}'::jsonb   -- {"<program_id>": <deployment_slot>}
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  ev        security_events;
  d         jsonb;
  age_s     numeric;
  ttl       integer := 90;      -- seconds; a citizen payment needing longer is not a payment
  fails     jsonb := '[]'::jsonb;
  prog      text;
  rec_slot  bigint;
  now_slot  bigint;
begin
  select * into ev from security_events where id = p_event_id;
  if not found then
    return jsonb_build_object('ok',false,'reason','no such classification event — refusing to broadcast');
  end if;
  d := ev.detail;

  -- 1. staleness
  age_s := extract(epoch from (now() - ev.created_at));
  if age_s > ttl then
    fails := fails || jsonb_build_object('check','ttl','detail',
      format('Classified %ss ago; TTL is %ss. Re-classify.', round(age_s), ttl));
  end if;

  -- 2. instruction set identical
  if md5(p_instructions::text) is distinct from (d->>'instruction_hash') then
    fails := fails || jsonb_build_object('check','instruction_hash','detail',
      'The instruction set changed between classification and broadcast. This is the TOCTOU signature — the transaction being sent is not the one that was approved.');
  end if;

  -- 3. no program upgraded underneath us
  for prog in select jsonb_object_keys(p_program_slots) loop
    now_slot := (p_program_slots->>prog)::bigint;
    select deployment_slot into rec_slot from pqsi_program_allowlist where program_id = prog;
    if rec_slot is not null and now_slot is not null and now_slot <> rec_slot then
      fails := fails || jsonb_build_object('check','program_upgraded','program',prog,'detail',
        format('Deployment slot moved %s → %s. The program was upgraded after approval. No simulation can predict what a program will become — this is the nonce+upgrade attack.',
               rec_slot, now_slot));
    end if;
  end loop;

  -- 4. destination not contained since approval
  if (d->>'counterparty') is not null
     and exists (select 1 from known_malicious_indicators
                  where indicator_value = (d->>'counterparty') and status='active'
                    and created_at > ev.created_at) then
    fails := fails || jsonb_build_object('check','contained_since','detail',
      'The destination was blocklisted after this transaction was approved. Containment propagates immediately and retroactively.');
  end if;

  -- 5. halt engaged since approval
  if exists (select 1 from siindex_kill_switch where id=1 and engaged=true) then
    fails := fails || jsonb_build_object('check','halt_engaged','detail','Global halt engaged since approval.');
  end if;

  if jsonb_array_length(fails) > 0 then
    perform pqsi_log_event('T4','REVERIFY_FAIL',
      format('Re-verification FAILED for event %s — broadcast refused', p_event_id),
      jsonb_build_object('original_event',p_event_id,'failures',fails));
    return jsonb_build_object('ok',false,'decision','BLOCK','failures',fails);
  end if;

  perform pqsi_log_event('T0','REVERIFY_PASS',
    format('Re-verified event %s — cleared to broadcast', p_event_id),
    jsonb_build_object('original_event',p_event_id,'age_seconds',round(age_s)));
  return jsonb_build_object('ok',true,'decision','PROCEED','age_seconds',round(age_s));
end;
$$;

comment on function pqsi_reverify is
  'G2. Call immediately before broadcast. FAILS CLOSED on: stale classification, changed instruction set, upgraded program, destination contained since approval, or halt engaged. Never broadcast without a PROCEED.';

-- ---------------------------------------------------------------------------
-- 6. G7 — dust suppression
--    Poisoning depends on polluting the citizen's own address history. If dust
--    and zero-value inbound never enter the picker, the attack has no surface.
-- ---------------------------------------------------------------------------
create or replace view pqsi_citizen_payees as
select t.citizen_id,
       t.counterparty_address,
       max(t.created_at)  as last_paid_at,
       count(*)           as payment_count,
       max(c.web3_domain) as display_name
  from transactions t
  left join citizens c on c.wallet_address = t.counterparty_address
 where t.status = 'confirmed'
   and t.direction = 'out'                -- only addresses the citizen CHOSE to pay
   and coalesce(t.amount_usd,0) >= 1.00   -- dust never creates payee history
 group by t.citizen_id, t.counterparty_address;

comment on view pqsi_citizen_payees is
  'G7. The ONLY source for a recipient picker. Outbound-confirmed and above dust, so an attacker cannot inject a lookalike by sending dust. display_name surfaces web3_domain first — a human-readable name cannot be character-matched.';

-- ---------------------------------------------------------------------------
-- 7. GRANTS
-- ---------------------------------------------------------------------------
revoke all on function pqsi_reverify from public, anon, authenticated;
grant execute on function pqsi_classify_v2  to authenticated;
grant execute on function pqsi_is_lookalike to authenticated;
grant select  on pqsi_citizen_payees        to authenticated;
grant select  on pqsi_program_allowlist     to authenticated;

alter table pqsi_program_allowlist      enable row level security;
alter table pqsi_dangerous_instructions enable row level security;
drop policy if exists pqsi_allowlist_read on pqsi_program_allowlist;
create policy pqsi_allowlist_read on pqsi_program_allowlist for select to authenticated using (true);

commit;

-- ============================================================================
-- STILL NOT MET BY THIS FILE
--   G3 program immutability — one CLI command, AJ's call, one-way door
--   G4 Squads time lock + spending limits + treasury threshold — AJ's ruling (U4)
--   G5 SIM-swap cooling-off — needs a phone-change event to hang off
--   G6 deposit crediting — verify the false-top-up mechanism BEFORE building
--   G8 remove or build the sanctions/MEV/simulation rows
--
-- NOT VERIFIED. No Postgres in the sandbox (not root, no pip network). This has
-- not been executed. Needs a Supabase development branch — production untouched.
-- Do not report it working until a real run says so.
-- ============================================================================
