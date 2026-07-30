-- ============================================================================
-- PQSI v1 — Red-team test suite
--
-- Purpose: prove the classifier assigns the correct tier under attack, not just
-- that it runs. 17 cases across all five tiers.
--
-- RUN ON A BRANCH OR STAGING ONLY. It creates test citizens, engages and
-- releases the kill switch, and writes to security_events (which is append-only
-- and cannot be cleaned up afterwards — that is the point of Law 7, and it is
-- exactly why this must not run against production).
--
-- Every case declares its expected tier. The run FAILS LOUDLY on mismatch
-- rather than printing a result for a human to skim. A test suite that reports
-- its own success without asserting is how v1 of the screen audit reported
-- "0 violations — CLEAN" over a 41.7x return calculator.
-- ============================================================================

\set ON_ERROR_STOP on

begin;

-- ---------------------------------------------------------------------------
-- Assertion helper
-- ---------------------------------------------------------------------------
create or replace function pqsi_assert_tier(
  p_case      text,
  p_result    jsonb,
  p_expected  text
) returns void
language plpgsql
as $$
declare v_actual text := p_result->>'tier';
begin
  if v_actual is distinct from p_expected then
    raise exception E'FAIL [%]\n  expected %, got %\n  findings: %',
      p_case, p_expected, v_actual,
      jsonb_pretty(p_result->'findings');
  end if;
  raise notice 'PASS [%] %  (%s checks)', p_case, v_actual,
    p_result->>'checks_run';
end;
$$;

-- ---------------------------------------------------------------------------
-- Fixtures
-- ---------------------------------------------------------------------------
create temporary table t_ids (label text primary key, id uuid);

-- A: ordinary citizen, TOTP on, KYC tier 1
insert into citizens (citizen_name, phone_number, kyc_tier, totp_enabled,
                      is_test_actor, account_type)
values ('REDTEAM Ordinary','+68200000001',1,true,true,'citizen')
returning id \gset a_
insert into t_ids values ('ordinary', :'a_id');

-- B: no TOTP, KYC tier 0 — the Mama Noe case, brand new
insert into citizens (citizen_name, phone_number, kyc_tier, totp_enabled,
                      is_test_actor, account_type)
values ('REDTEAM NoTOTP','+68200000002',0,false,true,'citizen')
returning id \gset b_
insert into t_ids values ('no_totp', :'b_id');

-- C: frozen account
insert into citizens (citizen_name, phone_number, kyc_tier, totp_enabled,
                      is_test_actor, account_type, account_frozen,
                      account_frozen_at, account_frozen_reason)
values ('REDTEAM Frozen','+68200000003',1,true,true,'citizen',true,now(),
        'Frozen by red-team fixture')
returning id \gset c_
insert into t_ids values ('frozen', :'c_id');

-- D: citizen with a LOWER self-chosen 2FA threshold ($50)
insert into citizens (citizen_name, phone_number, kyc_tier, totp_enabled,
                      is_test_actor, account_type, security_prefs)
values ('REDTEAM Cautious','+68200000004',1,true,true,'citizen',
        '{"twofa_threshold_usd": 50}'::jsonb)
returning id \gset d_
insert into t_ids values ('cautious', :'d_id');


-- ===========================================================================
-- T0 — clean
-- ===========================================================================

-- 1. Small payment, known-good stranger address, correct 2% fee.
select pqsi_assert_tier('01 clean small payment',
  pqsi_classify(:'a_id', 12.00, 'RedTeamPayee111111111111111111111111111111',
                'out','solana', 0.24, 'app'),
  'T1');   -- T1 not T0: first payment to a new payee is always advisory-logged

-- 2. Same payee, second time — now genuinely T0.
insert into transactions (citizen_id, amount_indx, amount_usd, direction,
                          counterparty_address, status, token)
values (:'a_id', 50, 12.00, 'out',
        'RedTeamPayee111111111111111111111111111111', 'confirmed', 'INDX');

select pqsi_assert_tier('02 clean repeat payee',
  pqsi_classify(:'a_id', 12.00, 'RedTeamPayee111111111111111111111111111111',
                'out','solana', 0.24, 'app'),
  'T0');


-- ===========================================================================
-- T4 — the attacks that must never get through
-- ===========================================================================

-- 3. THE ONE THAT PROMPTED THIS BUILD.
--    A citizen is instructed to send funds to the IN$DEX treasury wallet.
--    Everything else about this transaction is normal: small, correct fee,
--    right chain, unfrozen citizen, address not on any blocklist.
--    It must still be blocked outright.
select pqsi_assert_tier('03 citizen told to pay the treasury wallet',
  pqsi_classify(:'a_id', 25.00, '8HxNac3HAT56gJk3LRdGqiwq6DgciGK4cnaVMUNZaMZt',
                'out','solana', 0.50, 'app'),
  'T4');

-- 3a. That T4 must have armed the global halt automatically.
do $$
declare v boolean;
begin
  select engaged into v from siindex_kill_switch where id = 1;
  if not v then
    raise exception 'FAIL [03a] T4 did not arm the global halt';
  end if;
  raise notice 'PASS [03a] T4 armed the global halt';
end $$;

-- 3b. And while halted, even a perfect transaction is refused.
select pqsi_assert_tier('03b halted refuses clean txn',
  pqsi_classify(:'a_id', 12.00, 'RedTeamPayee111111111111111111111111111111',
                'out','solana', 0.24, 'app'),
  'T4');

-- 3c. Release requires real authorisation. A short string must be rejected.
do $$
begin
  begin
    perform pqsi_release_halt('ok');
    raise exception 'FAIL [03c] halt released on a 2-character authorisation';
  exception when others then
    if position('Security Law 6' in sqlerrm) = 0 then raise; end if;
    raise notice 'PASS [03c] weak authorisation refused';
  end;
end $$;

select pqsi_release_halt(
  'AJ Henry, 2026-07-30: red-team suite complete, releasing test halt.');

-- 4. 98/2 bypass — fee is 1% instead of 2%. Security Law 2, no override.
select pqsi_assert_tier('04 98/2 bypass low fee',
  pqsi_classify(:'a_id', 100.00, 'RedTeamPayee111111111111111111111111111111',
                'out','solana', 1.00, 'app'),
  'T4');
select pqsi_release_halt('AJ Henry, 2026-07-30: red-team, clearing case 04.');

-- 5. 98/2 bypass the other way — platform skimming 5%.
select pqsi_assert_tier('05 98/2 bypass high fee',
  pqsi_classify(:'a_id', 100.00, 'RedTeamPayee111111111111111111111111111111',
                'out','solana', 5.00, 'app'),
  'T4');
select pqsi_release_halt('AJ Henry, 2026-07-30: red-team, clearing case 05.');

-- 6. Rounding must NOT trip the 98/2 check. $33.33 * 2% = $0.6666.
select pqsi_assert_tier('06 98/2 rounding tolerance',
  pqsi_classify(:'a_id', 33.33, 'RedTeamPayee111111111111111111111111111111',
                'out','solana', 0.6666, 'app'),
  'T0');

-- 7. Frozen account.
select pqsi_assert_tier('07 frozen account',
  pqsi_classify(:'c_id', 10.00, 'RedTeamPayee111111111111111111111111111111',
                'out','solana', 0.20, 'app'),
  'T4');
select pqsi_release_halt('AJ Henry, 2026-07-30: red-team, clearing case 07.');

-- 8. Unknown citizen id — must not be treated as safe.
select pqsi_assert_tier('08 unknown citizen',
  pqsi_classify('00000000-0000-0000-0000-000000000000'::uuid, 10.00,
                'RedTeamPayee111111111111111111111111111111','out','solana',0.20,'app'),
  'T4');
select pqsi_release_halt('AJ Henry, 2026-07-30: red-team, clearing case 08.');

-- 9. Critical blocklist hit.
select pqsi_contain('solana_address','RedTeamDrainer99999999999999999999999999',
                    'critical','Known drainer contract — red-team fixture','redteam');
select pqsi_assert_tier('09 critical blocklist',
  pqsi_classify(:'a_id', 10.00, 'RedTeamDrainer99999999999999999999999999',
                'out','solana', 0.20, 'app'),
  'T4');
select pqsi_release_halt('AJ Henry, 2026-07-30: red-team, clearing case 09.');


-- ===========================================================================
-- T3 — hold
-- ===========================================================================

-- 10. Wrong chain.
select pqsi_assert_tier('10 disallowed chain',
  pqsi_classify(:'a_id', 10.00, 'RedTeamPayee111111111111111111111111111111',
                'out','ethereum', 0.20, 'app'),
  'T3');

-- 11. Above 2FA threshold with no TOTP enrolled — Security Law 5 means this
--     cannot simply prompt, it must hold.
select pqsi_assert_tier('11 above threshold, no TOTP',
  pqsi_classify(:'b_id', 600.00, 'RedTeamPayee222222222222222222222222222222',
                'out','solana', 12.00, 'app'),
  'T3');

-- 12. Travel Rule — over $1,000 at KYC tier 0.
select pqsi_assert_tier('12 travel rule tier 0',
  pqsi_classify(:'b_id', 1500.00, 'RedTeamPayee222222222222222222222222222222',
                'out','solana', 30.00, 'app'),
  'T3');

-- 13. Velocity — 5 outbound inside the window.
insert into transactions (citizen_id, amount_indx, amount_usd, direction,
                          counterparty_address, status, token, created_at)
select :'a_id', 10, 5.00, 'out',
       'RedTeamPayee' || lpad(g::text, 30, '3'), 'confirmed', 'INDX',
       now() - interval '2 minutes'
from generate_series(1,5) g;

select pqsi_assert_tier('13 velocity breach',
  pqsi_classify(:'a_id', 5.00, 'RedTeamPayee111111111111111111111111111111',
                'out','solana', 0.10, 'app'),
  'T3');

-- 14. Daily outflow cap.
insert into transactions (citizen_id, amount_indx, amount_usd, direction,
                          counterparty_address, status, token, created_at)
values (:'d_id', 8000, 1950.00, 'out',
        'RedTeamPayee444444444444444444444444444444','confirmed','INDX',
        now() - interval '3 hours');

select pqsi_assert_tier('14 daily cap breach',
  pqsi_classify(:'d_id', 200.00, 'RedTeamPayee444444444444444444444444444444',
                'out','solana', 4.00, 'app'),
  'T3');


-- ===========================================================================
-- T2 — 2FA
-- ===========================================================================

-- 15. Above threshold, TOTP enrolled → prompt for the code.
select pqsi_assert_tier('15 above threshold with TOTP',
  pqsi_classify(:'a_id', 600.00, 'RedTeamPayee111111111111111111111111111111',
                'out','solana', 12.00, 'app'),
  'T2');

-- 16. Citizen's own lower threshold ($50) must be honoured. $75 > $50 → T2,
--     even though $75 is well under the $500 platform default.
select pqsi_assert_tier('16 citizen lower threshold honoured',
  pqsi_classify(:'d_id', 75.00, 'RedTeamPayee444444444444444444444444444444',
                'out','solana', 1.50, 'app'),
  'T2');

-- 17. A citizen cannot raise their own threshold above the platform default.
--     $600 with a self-set $5,000 preference must still be T2, not T0.
update citizens set security_prefs = '{"twofa_threshold_usd": 5000}'::jsonb
 where id = :'a_id';

select pqsi_assert_tier('17 citizen cannot raise own threshold',
  pqsi_classify(:'a_id', 600.00, 'RedTeamPayee111111111111111111111111111111',
                'out','solana', 12.00, 'app'),
  'T2');


-- ===========================================================================
-- Integrity — Security Law 7
-- ===========================================================================

-- 18. security_events must reject DELETE even from a privileged session.
do $$
begin
  begin
    delete from security_events where zone = 'TRANSACTION';
    raise exception 'FAIL [18] security_events allowed a DELETE — Security Law 7 is not enforced';
  exception when others then
    if position('FAIL [18]' in sqlerrm) > 0 then raise; end if;
    raise notice 'PASS [18] security_events refused DELETE: %', sqlerrm;
  end;
end $$;

-- 19. And UPDATE.
do $$
begin
  begin
    update security_events set description = 'tampered' where zone = 'TRANSACTION';
    raise exception 'FAIL [19] security_events allowed an UPDATE — Security Law 7 is not enforced';
  exception when others then
    if position('FAIL [19]' in sqlerrm) > 0 then raise; end if;
    raise notice 'PASS [19] security_events refused UPDATE: %', sqlerrm;
  end;
end $$;

-- 20. Containment propagates with no deploy: the address blocked in case 09 is
--     live for a DIFFERENT citizen immediately.
select pqsi_assert_tier('20 containment propagates to all citizens',
  pqsi_classify(:'d_id', 10.00, 'RedTeamDrainer99999999999999999999999999',
                'out','solana', 0.20, 'app'),
  'T4');
select pqsi_release_halt('AJ Henry, 2026-07-30: red-team, clearing case 20.');


-- ---------------------------------------------------------------------------
-- Fixture teardown. security_events rows CANNOT be removed — by design.
-- ---------------------------------------------------------------------------
delete from transactions where citizen_id in (select id from t_ids);
delete from known_malicious_indicators where source = 'redteam';
delete from citizens where id in (select id from t_ids);
drop function pqsi_assert_tier(text, jsonb, text);

do $$
declare n integer;
begin
  select count(*) into n from security_events
   where zone in ('TRANSACTION','CONTAINMENT','HALT_RELEASE')
     and created_at > now() - interval '10 minutes';
  raise notice '--- Red-team complete. % immutable security_events written and retained. ---', n;
end $$;

commit;
