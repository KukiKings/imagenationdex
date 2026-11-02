-- pgTAP tests for the hardened public.get_citizen_by_phone(text).
-- RUN ON A BRANCH OR STAGING ONLY, after the migration is applied there.
-- Everything runs inside a transaction that is rolled back.
--   psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/get_citizen_by_phone_hardening.sql

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_temp;

select plan(15);

-- fixtures: two auth users, two citizens
insert into auth.users (id, aud, role, email, phone) values
  ('00000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', 'owner-test@example.invalid', '61400000001'),
  ('00000000-0000-0000-0000-0000000000a2', 'authenticated', 'authenticated', 'other-test@example.invalid', ''),
  ('00000000-0000-0000-0000-0000000000a3', 'authenticated', 'authenticated', 'short-test@example.invalid', '12345'),
  ('00000000-0000-0000-0000-0000000000a4', 'authenticated', 'authenticated', 'plus-test@example.invalid', '+61400000004');

insert into public.citizens (id, citizen_name, phone_number, auth_user_id, wisdom_score, indx_balance, web3_domain) values
  ('00000000-0000-0000-0000-0000000000c1', 'Owner Test', '+61400000001', '00000000-0000-0000-0000-0000000000a1', 7, 12.5, 'ownertest.INDEX'),
  ('00000000-0000-0000-0000-0000000000c2', 'Other Test', '+61400000002', '00000000-0000-0000-0000-0000000000a2', 3, 1, 'othertest.INDEX'),
  ('00000000-0000-0000-0000-0000000000c3', 'Short Test', '12345', '00000000-0000-0000-0000-0000000000a3', 1, 1, 'shorttest.INDEX'),
  ('00000000-0000-0000-0000-0000000000c4', 'Plus Test', '61400000004', '00000000-0000-0000-0000-0000000000a4', 2, 2, 'plustest.INDEX');

-- let the test roles use pgTAP's temp tables
grant all on all tables in schema pg_temp to anon, authenticated;

-- 1-2. function shape
select ok(
  (select prosecdef from pg_proc where oid = 'public.get_citizen_by_phone(text)'::regprocedure),
  'get_citizen_by_phone is SECURITY DEFINER');
select ok(
  (select coalesce(proconfig, '{}') @> array['search_path=""'] from pg_proc where oid = 'public.get_citizen_by_phone(text)'::regprocedure),
  'search_path is the empty string');

-- 3. privileges: anon and public cannot execute, authenticated can
select ok(
  not has_function_privilege('anon', 'public.get_citizen_by_phone(text)', 'execute')
  and has_function_privilege('authenticated', 'public.get_citizen_by_phone(text)', 'execute'),
  'anon has no EXECUTE, authenticated has EXECUTE');

-- 4. anon cannot call it at all (permission denied, so no enumeration signal)
set local role anon;
select throws_ok(
  $$select public.get_citizen_by_phone('+61400000001')$$,
  '42501',
  null,
  'anon is denied on a registered number');
select throws_ok(
  $$select public.get_citizen_by_phone('+61499999999')$$,
  '42501',
  null,
  'anon is denied on an unregistered number (same result)');
reset role;

-- 5. authenticated owner gets their row, with the five columns only
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is(
  (select public.get_citizen_by_phone('+61400000001')::jsonb),
  '{"id":"00000000-0000-0000-0000-0000000000c1","citizen_name":"Owner Test","wisdom_score":7,"indx_balance":12.5,"web3_domain":"ownertest.INDEX"}'::jsonb,
  'owner gets exactly their own row');

-- 6. authenticated non-owner: someone else's number and an unknown number both return null
select is(
  public.get_citizen_by_phone('+61400000002')::text, null,
  'owner asking for another citizen''s number gets null');
select is(
  public.get_citizen_by_phone('+61499999999')::text, null,
  'unknown number gets the same null');

-- 7. authenticated role with no user in the JWT is rejected
select set_config('request.jwt.claims', '{"role":"authenticated"}', true);
select throws_ok(
  $$select public.get_citizen_by_phone('+61400000001')$$,
  'P0001',
  'not authenticated',
  'no auth.uid() raises not authenticated');


-- 10. plus-form vs no-plus: citizen '+61400000001' vs auth '61400000001' matched in test 6;
--     reverse direction (citizen no-plus, auth plus), input in plus form
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
select is(
  (select public.get_citizen_by_phone('+61400000004')::jsonb ->> 'citizen_name'),
  'Plus Test', 'reverse plus-form (citizen no-plus, auth plus) matches');
-- 11. formatted input still matches
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is(
  (select public.get_citizen_by_phone('+61 400-000-001')::jsonb ->> 'citizen_name'),
  'Owner Test', 'spaces and dashes in input are normalized');
-- 12. empty-string auth phone returns null even for the owner and the right number
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select is(public.get_citizen_by_phone('+61400000002')::text, null,
  'empty auth phone returns null');
-- 13. sub-ten-digit input returns null even when citizen and auth phones both equal it
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
select is(public.get_citizen_by_phone('12345')::text, null,
  'sub-ten-digit input returns null');
-- 14. empty input is not a wildcard
select is(public.get_citizen_by_phone('')::text, null,
  'empty input returns null, not a wildcard');
-- 15. non-owner still gets null for another citizen's number
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
select is(public.get_citizen_by_phone('+61400000001')::text, null,
  'non-owner gets null for someone else''s number');
reset role;

select * from finish();
rollback;
