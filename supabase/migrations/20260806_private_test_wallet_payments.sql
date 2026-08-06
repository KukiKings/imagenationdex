-- IN$DEX private-test wallet and everyday payments core
--
-- This migration creates an authenticated, double-entry sandbox ledger for
-- TEST_USDC and TEST_INDX. It stores no private key, recovery credential,
-- access token, card PAN, CVV or real-value balance. It never signs or submits
-- a Solana transaction. Solana Pay and external settlement remain separate,
-- approval-gated adapters.

begin;

create table if not exists public.private_test_wallets (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  citizen_id uuid not null references public.citizens(id) on delete cascade,
  environment text not null default 'private_testing',
  network text not null default 'sandbox',
  status text not null default 'active',
  terms_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint private_test_wallet_auth_unique unique (auth_user_id),
  constraint private_test_wallet_citizen_unique unique (citizen_id),
  constraint private_test_wallet_environment_check check (environment = 'private_testing'),
  constraint private_test_wallet_network_check check (network = 'sandbox'),
  constraint private_test_wallet_status_check check (status in ('active', 'suspended', 'closed'))
);

create table if not exists public.private_test_ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid references public.private_test_wallets(id) on delete cascade,
  account_code text not null unique,
  account_kind text not null,
  asset text not null,
  balance_atomic bigint not null default 0,
  daily_outflow_limit_atomic bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint private_test_ledger_kind_check check (account_kind in ('citizen', 'faucet', 'biller_clearing', 'card_clearing')),
  constraint private_test_ledger_asset_check check (asset in ('TEST_USDC', 'TEST_INDX')),
  constraint private_test_ledger_balance_check check (balance_atomic >= 0),
  constraint private_test_ledger_limit_check check (daily_outflow_limit_atomic >= 0),
  constraint private_test_ledger_owner_check check (
    (account_kind = 'citizen' and wallet_id is not null)
    or (account_kind <> 'citizen' and wallet_id is null)
  )
);

create unique index if not exists private_test_ledger_wallet_asset_unique
  on public.private_test_ledger_accounts (wallet_id, asset)
  where wallet_id is not null;

create table if not exists public.private_test_transactions (
  id uuid primary key default gen_random_uuid(),
  actor_auth_user_id uuid not null references auth.users(id) on delete cascade,
  from_wallet_id uuid references public.private_test_wallets(id) on delete set null,
  to_wallet_id uuid references public.private_test_wallets(id) on delete set null,
  transaction_type text not null,
  asset text not null,
  amount_atomic bigint not null,
  status text not null default 'settled',
  idempotency_key uuid not null,
  reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint private_test_transaction_actor_idempotency_unique unique (actor_auth_user_id, idempotency_key),
  constraint private_test_transaction_type_check check (
    transaction_type in ('faucet', 'transfer', 'payment_request', 'remittance', 'bill', 'card_purchase', 'refund')
  ),
  constraint private_test_transaction_asset_check check (asset in ('TEST_USDC', 'TEST_INDX')),
  constraint private_test_transaction_amount_check check (amount_atomic > 0),
  constraint private_test_transaction_status_check check (status = 'settled'),
  constraint private_test_transaction_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index if not exists private_test_transactions_from_wallet_created_idx
  on public.private_test_transactions (from_wallet_id, created_at desc);
create index if not exists private_test_transactions_to_wallet_created_idx
  on public.private_test_transactions (to_wallet_id, created_at desc);

create table if not exists public.private_test_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.private_test_transactions(id) on delete restrict,
  account_id uuid not null references public.private_test_ledger_accounts(id) on delete restrict,
  entry_type text not null,
  asset text not null,
  amount_atomic bigint not null,
  balance_after_atomic bigint not null,
  created_at timestamptz not null default now(),
  constraint private_test_ledger_entry_unique unique (transaction_id, account_id, entry_type),
  constraint private_test_ledger_entry_type_check check (entry_type in ('debit', 'credit')),
  constraint private_test_ledger_entry_asset_check check (asset in ('TEST_USDC', 'TEST_INDX')),
  constraint private_test_ledger_entry_amount_check check (amount_atomic > 0),
  constraint private_test_ledger_entry_balance_check check (balance_after_atomic >= 0)
);

create table if not exists public.private_test_faucet_claims (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null unique references public.private_test_wallets(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key uuid not null,
  test_usdc_atomic bigint not null,
  test_indx_atomic bigint not null,
  created_at timestamptz not null default now(),
  constraint private_test_faucet_claim_actor_key_unique unique (auth_user_id, idempotency_key),
  constraint private_test_faucet_amount_check check (test_usdc_atomic > 0 and test_indx_atomic > 0)
);

create table if not exists public.private_test_payment_requests (
  id uuid primary key default gen_random_uuid(),
  creator_auth_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_wallet_id uuid not null references public.private_test_wallets(id) on delete cascade,
  payer_wallet_id uuid references public.private_test_wallets(id) on delete set null,
  asset text not null,
  amount_atomic bigint not null,
  purpose text not null,
  status text not null default 'open',
  idempotency_key uuid not null,
  expires_minutes integer not null,
  transaction_id uuid unique references public.private_test_transactions(id) on delete set null,
  expires_at timestamptz not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  constraint private_test_payment_request_creator_key_unique unique (creator_auth_user_id, idempotency_key),
  constraint private_test_payment_request_asset_check check (asset in ('TEST_USDC', 'TEST_INDX')),
  constraint private_test_payment_request_amount_check check (amount_atomic > 0),
  constraint private_test_payment_request_expiry_check check (expires_minutes between 5 and 1440),
  constraint private_test_payment_request_purpose_length check (char_length(purpose) between 1 and 120),
  constraint private_test_payment_request_status_check check (status in ('open', 'paid', 'cancelled', 'expired'))
);

create table if not exists public.private_test_billers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  clearing_code text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint private_test_biller_name_length check (char_length(name) between 1 and 80),
  constraint private_test_biller_category_check check (category in ('utilities', 'connectivity', 'community'))
);

create table if not exists public.private_test_bill_schedules (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references public.private_test_wallets(id) on delete cascade,
  biller_id uuid not null references public.private_test_billers(id) on delete restrict,
  asset text not null,
  amount_atomic bigint not null,
  reference text,
  cadence text not null default 'monthly_manual_approval',
  status text not null default 'active',
  next_due_on date not null,
  source_transaction_id uuid not null unique references public.private_test_transactions(id) on delete restrict,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  constraint private_test_bill_schedule_asset_check check (asset in ('TEST_USDC', 'TEST_INDX')),
  constraint private_test_bill_schedule_amount_check check (amount_atomic > 0),
  constraint private_test_bill_schedule_cadence_check check (cadence = 'monthly_manual_approval'),
  constraint private_test_bill_schedule_status_check check (status in ('active', 'cancelled')),
  constraint private_test_bill_schedule_reference_length check (reference is null or char_length(reference) <= 80)
);

create table if not exists public.private_test_merchants (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  wallet_id uuid not null unique references public.private_test_wallets(id) on delete cascade,
  display_name text not null,
  status text not null default 'active',
  terms_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint private_test_merchant_name_length check (char_length(display_name) between 2 and 80),
  constraint private_test_merchant_status_check check (status in ('active', 'suspended'))
);

create table if not exists public.private_test_merchant_orders (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.private_test_merchants(id) on delete cascade,
  creator_auth_user_id uuid not null references auth.users(id) on delete cascade,
  payment_request_id uuid not null unique references public.private_test_payment_requests(id) on delete restrict,
  order_reference text not null,
  asset text not null,
  amount_atomic bigint not null,
  status text not null default 'awaiting_payment',
  settlement_transaction_id uuid unique references public.private_test_transactions(id) on delete restrict,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  constraint private_test_merchant_order_reference_length check (char_length(order_reference) between 1 and 80),
  constraint private_test_merchant_order_asset_check check (asset in ('TEST_USDC', 'TEST_INDX')),
  constraint private_test_merchant_order_amount_check check (amount_atomic > 0),
  constraint private_test_merchant_order_status_check check (status in ('awaiting_payment', 'settled', 'cancelled', 'expired'))
);

create table if not exists public.private_test_cards (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  wallet_id uuid not null unique references public.private_test_wallets(id) on delete cascade,
  test_reference text not null unique,
  status text not null default 'active',
  asset text not null default 'TEST_USDC',
  daily_limit_atomic bigint not null default 50000000,
  issued_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_used_at timestamptz,
  constraint private_test_card_reference_check check (test_reference ~ '^TEST-[0-9]{4}$'),
  constraint private_test_card_status_check check (status in ('active', 'frozen')),
  constraint private_test_card_asset_check check (asset = 'TEST_USDC'),
  constraint private_test_card_limit_check check (daily_limit_atomic between 1000000 and 1000000000)
);

create table if not exists public.private_test_remittances (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  sender_wallet_id uuid not null references public.private_test_wallets(id) on delete cascade,
  recipient_wallet_id uuid not null references public.private_test_wallets(id) on delete restrict,
  destination_country text not null,
  asset text not null,
  send_amount_atomic bigint not null,
  receive_amount_atomic bigint not null,
  fee_atomic bigint not null default 0,
  note text,
  transaction_id uuid not null unique references public.private_test_transactions(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint private_test_remittance_asset_check check (asset in ('TEST_USDC', 'TEST_INDX')),
  constraint private_test_remittance_amount_check check (
    send_amount_atomic > 0 and receive_amount_atomic = send_amount_atomic and fee_atomic = 0
  ),
  constraint private_test_remittance_country_length check (char_length(destination_country) between 2 and 60),
  constraint private_test_remittance_note_length check (note is null or char_length(note) <= 120)
);

create table if not exists public.private_test_refund_requests (
  id uuid primary key default gen_random_uuid(),
  original_transaction_id uuid not null unique references public.private_test_transactions(id) on delete restrict,
  requester_auth_user_id uuid not null references auth.users(id) on delete cascade,
  requester_wallet_id uuid not null references public.private_test_wallets(id) on delete restrict,
  refunding_wallet_id uuid not null references public.private_test_wallets(id) on delete restrict,
  asset text not null,
  amount_atomic bigint not null,
  reason text not null,
  status text not null default 'pending',
  refund_transaction_id uuid unique references public.private_test_transactions(id) on delete restrict,
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint private_test_refund_asset_check check (asset in ('TEST_USDC', 'TEST_INDX')),
  constraint private_test_refund_amount_check check (amount_atomic > 0),
  constraint private_test_refund_reason_length check (char_length(reason) between 1 and 120),
  constraint private_test_refund_status_check check (status in ('pending', 'approved', 'declined')),
  constraint private_test_refund_wallets_check check (requester_wallet_id <> refunding_wallet_id)
);

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'private_test_wallets',
    'private_test_ledger_accounts',
    'private_test_transactions',
    'private_test_ledger_entries',
    'private_test_faucet_claims',
    'private_test_payment_requests',
    'private_test_billers',
    'private_test_bill_schedules',
    'private_test_merchants',
    'private_test_merchant_orders',
    'private_test_cards',
    'private_test_remittances',
    'private_test_refund_requests'
  ] loop
    execute format('alter table public.%I enable row level security', v_table);
    execute format('revoke all on table public.%I from anon, authenticated', v_table);
  end loop;
end;
$$;

insert into public.private_test_ledger_accounts (
  wallet_id, account_code, account_kind, asset, balance_atomic, daily_outflow_limit_atomic
) values
  (null, 'faucet:TEST_USDC', 'faucet', 'TEST_USDC', 1000000000000000000, 0),
  (null, 'faucet:TEST_INDX', 'faucet', 'TEST_INDX', 1000000000000000000, 0),
  (null, 'biller_clearing:TEST_USDC', 'biller_clearing', 'TEST_USDC', 0, 0),
  (null, 'biller_clearing:TEST_INDX', 'biller_clearing', 'TEST_INDX', 0, 0),
  (null, 'card_clearing:TEST_USDC', 'card_clearing', 'TEST_USDC', 0, 0)
on conflict (account_code) do nothing;

insert into public.private_test_billers (name, category, clearing_code) values
  ('Test Island Electricity', 'utilities', 'TEST-ELECTRICITY'),
  ('Test Pacific Connectivity', 'connectivity', 'TEST-CONNECTIVITY'),
  ('Test Community Services', 'community', 'TEST-COMMUNITY')
on conflict (name) do nothing;

create or replace function public.private_test_post_ledger_transaction(
  p_actor_auth_user_id uuid,
  p_actor_wallet_id uuid,
  p_source_account_id uuid,
  p_destination_account_id uuid,
  p_transaction_type text,
  p_amount_atomic bigint,
  p_idempotency_key uuid,
  p_reference text,
  p_metadata jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_source public.private_test_ledger_accounts%rowtype;
  v_destination public.private_test_ledger_accounts%rowtype;
  v_transaction_id uuid;
  v_existing public.private_test_transactions%rowtype;
  v_daily_spent bigint := 0;
  v_source_after bigint;
  v_destination_after bigint;
  v_reference text;
  v_metadata jsonb;
  v_citizen_json jsonb;
begin
  if v_uid is null or v_uid is distinct from p_actor_auth_user_id then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;
  if p_idempotency_key is null then
    return jsonb_build_object('ok', false, 'code', 'INVALID_IDEMPOTENCY_KEY');
  end if;
  if p_source_account_id is null or p_destination_account_id is null
     or p_source_account_id = p_destination_account_id then
    return jsonb_build_object('ok', false, 'code', 'INVALID_LEDGER_ACCOUNTS');
  end if;
  if p_transaction_type not in ('faucet', 'transfer', 'payment_request', 'remittance', 'bill', 'card_purchase', 'refund') then
    return jsonb_build_object('ok', false, 'code', 'INVALID_TRANSACTION_TYPE');
  end if;
  if p_amount_atomic is null or p_amount_atomic <= 0 then
    return jsonb_build_object('ok', false, 'code', 'INVALID_AMOUNT');
  end if;

  v_reference := nullif(left(trim(regexp_replace(coalesce(p_reference, ''), '[[:cntrl:]]', ' ', 'g')), 120), '');
  v_metadata := case when jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) = 'object'
    then coalesce(p_metadata, '{}'::jsonb) else '{}'::jsonb end;

  perform pg_advisory_xact_lock(
    hashtextextended('private-test-idempotency:' || v_uid::text || ':' || p_idempotency_key::text, 0)
  );

  perform pg_advisory_xact_lock(
    hashtextextended(
      'private-test-ledger:' || least(p_source_account_id::text, p_destination_account_id::text)
      || ':' || greatest(p_source_account_id::text, p_destination_account_id::text),
      0
    )
  );

  select * into v_source
    from public.private_test_ledger_accounts a where a.id = p_source_account_id for update;
  select * into v_destination
    from public.private_test_ledger_accounts a where a.id = p_destination_account_id for update;

  if v_source.id is null or v_destination.id is null then
    return jsonb_build_object('ok', false, 'code', 'INVALID_LEDGER_ACCOUNTS');
  end if;
  if v_source.asset <> v_destination.asset then
    return jsonb_build_object('ok', false, 'code', 'ASSET_MISMATCH');
  end if;

  select * into v_existing
    from public.private_test_transactions t
   where t.actor_auth_user_id = v_uid and t.idempotency_key = p_idempotency_key
   limit 1;
  if found then
    if v_existing.transaction_type = p_transaction_type
       and v_existing.asset = v_source.asset
       and v_existing.amount_atomic = p_amount_atomic
       and v_existing.from_wallet_id is not distinct from v_source.wallet_id
       and v_existing.to_wallet_id is not distinct from v_destination.wallet_id
       and v_existing.reference is not distinct from v_reference
       and v_existing.metadata = v_metadata then
      return jsonb_build_object(
        'ok', true,
        'duplicate', true,
        'transaction_id', v_existing.id,
        'asset', v_existing.asset,
        'amount_atomic', v_existing.amount_atomic,
        'created_at', v_existing.created_at
      );
    end if;
    return jsonb_build_object('ok', false, 'code', 'IDEMPOTENCY_CONFLICT');
  end if;

  if v_source.asset = 'TEST_USDC' and p_amount_atomic > 10000000000 then
    return jsonb_build_object('ok', false, 'code', 'AMOUNT_LIMIT_EXCEEDED');
  end if;
  if v_source.asset = 'TEST_INDX' and p_amount_atomic > 100000000000 then
    return jsonb_build_object('ok', false, 'code', 'AMOUNT_LIMIT_EXCEEDED');
  end if;

  if v_source.account_kind = 'citizen' then
    if v_source.wallet_id is distinct from p_actor_wallet_id then
      raise exception using errcode = '42501', message = 'WALLET_OWNERSHIP_REQUIRED';
    end if;
    select to_jsonb(c) into v_citizen_json
      from public.private_test_wallets w
      join public.citizens c on c.id = w.citizen_id
     where w.id = v_source.wallet_id and w.auth_user_id = v_uid
     limit 1;
    if v_citizen_json is null then
      raise exception using errcode = '42501', message = 'WALLET_OWNERSHIP_REQUIRED';
    end if;
    if coalesce((v_citizen_json->>'account_frozen')::boolean, false) then
      return jsonb_build_object('ok', false, 'code', 'ACCOUNT_SECURITY_HOLD');
    end if;
  elsif p_transaction_type <> 'faucet' or v_destination.wallet_id is distinct from p_actor_wallet_id then
    raise exception using errcode = '42501', message = 'SYSTEM_ACCOUNT_USE_DENIED';
  end if;

  if v_source.balance_atomic < p_amount_atomic then
    return jsonb_build_object('ok', false, 'code', 'INSUFFICIENT_TEST_BALANCE');
  end if;

  if v_source.account_kind = 'citizen' then
    select coalesce(sum(t.amount_atomic), 0) into v_daily_spent
      from public.private_test_transactions t
     where t.from_wallet_id = v_source.wallet_id
       and t.asset = v_source.asset
       and t.status = 'settled'
       and t.created_at >= date_trunc('day', now());
    if v_daily_spent + p_amount_atomic > v_source.daily_outflow_limit_atomic then
      return jsonb_build_object('ok', false, 'code', 'DAILY_LIMIT_EXCEEDED');
    end if;
  end if;

  insert into public.private_test_transactions (
    actor_auth_user_id,
    from_wallet_id,
    to_wallet_id,
    transaction_type,
    asset,
    amount_atomic,
    idempotency_key,
    reference,
    metadata
  ) values (
    v_uid,
    v_source.wallet_id,
    v_destination.wallet_id,
    p_transaction_type,
    v_source.asset,
    p_amount_atomic,
    p_idempotency_key,
    v_reference,
    v_metadata
  ) returning id into v_transaction_id;

  update public.private_test_ledger_accounts
     set balance_atomic = balance_atomic - p_amount_atomic, updated_at = now()
   where id = v_source.id
  returning balance_atomic into v_source_after;

  update public.private_test_ledger_accounts
     set balance_atomic = balance_atomic + p_amount_atomic, updated_at = now()
   where id = v_destination.id
  returning balance_atomic into v_destination_after;

  insert into public.private_test_ledger_entries (
    transaction_id, account_id, entry_type, asset, amount_atomic, balance_after_atomic
  ) values
    (v_transaction_id, v_source.id, 'debit', v_source.asset, p_amount_atomic, v_source_after),
    (v_transaction_id, v_destination.id, 'credit', v_source.asset, p_amount_atomic, v_destination_after);

  return jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'transaction_id', v_transaction_id,
    'asset', v_source.asset,
    'amount_atomic', p_amount_atomic,
    'source_balance_atomic', v_source_after,
    'destination_balance_atomic', v_destination_after,
    'created_at', now()
  );
end;
$$;

revoke all on function public.private_test_post_ledger_transaction(uuid, uuid, uuid, uuid, text, bigint, uuid, text, jsonb) from public, anon, authenticated;

create or replace function public.ensure_my_private_test_wallet(p_terms_version text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_phone_confirmed_at timestamptz;
  v_citizen_id uuid;
  v_wallet_id uuid;
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;
  if coalesce(p_terms_version, '') <> 'private-test-wallet-v1' then
    return jsonb_build_object('ok', false, 'code', 'CONSENT_REQUIRED');
  end if;

  select u.phone_confirmed_at into v_phone_confirmed_at from auth.users u where u.id = v_uid;
  if v_phone_confirmed_at is null then
    return jsonb_build_object('ok', false, 'code', 'PHONE_NOT_VERIFIED');
  end if;
  select c.id into v_citizen_id from public.citizens c where c.auth_user_id = v_uid limit 1;
  if v_citizen_id is null then
    return jsonb_build_object('ok', false, 'code', 'ACCOUNT_NOT_FOUND');
  end if;

  insert into public.private_test_wallets (auth_user_id, citizen_id, terms_version)
  values (v_uid, v_citizen_id, p_terms_version)
  on conflict (auth_user_id) do update set updated_at = now()
  returning id into v_wallet_id;

  insert into public.private_test_ledger_accounts (
    wallet_id, account_code, account_kind, asset, balance_atomic, daily_outflow_limit_atomic
  ) values
    (v_wallet_id, 'wallet:' || v_wallet_id::text || ':TEST_USDC', 'citizen', 'TEST_USDC', 0, 100000000),
    (v_wallet_id, 'wallet:' || v_wallet_id::text || ':TEST_INDX', 'citizen', 'TEST_INDX', 0, 1000000000)
  on conflict (account_code) do nothing;

  return jsonb_build_object(
    'ok', true,
    'wallet_id', v_wallet_id,
    'environment', 'private_testing',
    'network', 'sandbox',
    'real_world_effect', false,
    'created_at', now()
  );
end;
$$;

revoke all on function public.ensure_my_private_test_wallet(text) from public, anon;
grant execute on function public.ensure_my_private_test_wallet(text) to authenticated;

create or replace function public.claim_my_private_test_funds(
  p_terms_version text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_wallet_id uuid;
  v_claim public.private_test_faucet_claims%rowtype;
  v_usdc_source uuid;
  v_indx_source uuid;
  v_usdc_destination uuid;
  v_indx_destination uuid;
  v_usdc_result jsonb;
  v_indx_result jsonb;
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;
  if coalesce(p_terms_version, '') <> 'private-test-wallet-v1' then
    return jsonb_build_object('ok', false, 'code', 'CONSENT_REQUIRED');
  end if;
  if p_idempotency_key is null then
    return jsonb_build_object('ok', false, 'code', 'INVALID_IDEMPOTENCY_KEY');
  end if;

  select w.id into v_wallet_id
    from public.private_test_wallets w where w.auth_user_id = v_uid and w.status = 'active' limit 1;
  if v_wallet_id is null then
    return jsonb_build_object('ok', false, 'code', 'WALLET_NOT_READY');
  end if;

  select * into v_claim from public.private_test_faucet_claims f where f.wallet_id = v_wallet_id limit 1;
  if found then
    return jsonb_build_object(
      'ok', true,
      'duplicate', true,
      'test_usdc_atomic', v_claim.test_usdc_atomic,
      'test_indx_atomic', v_claim.test_indx_atomic,
      'claimed_at', v_claim.created_at
    );
  end if;

  perform pg_advisory_xact_lock(hashtextextended('private-test-faucet:' || v_wallet_id::text, 0));
  if exists (select 1 from public.private_test_faucet_claims f where f.wallet_id = v_wallet_id) then
    select * into v_claim from public.private_test_faucet_claims f where f.wallet_id = v_wallet_id;
    return jsonb_build_object('ok', true, 'duplicate', true, 'claimed_at', v_claim.created_at);
  end if;

  select id into v_usdc_source from public.private_test_ledger_accounts where account_code = 'faucet:TEST_USDC';
  select id into v_indx_source from public.private_test_ledger_accounts where account_code = 'faucet:TEST_INDX';
  select id into v_usdc_destination from public.private_test_ledger_accounts where wallet_id = v_wallet_id and asset = 'TEST_USDC';
  select id into v_indx_destination from public.private_test_ledger_accounts where wallet_id = v_wallet_id and asset = 'TEST_INDX';

  v_usdc_result := public.private_test_post_ledger_transaction(
    v_uid, v_wallet_id, v_usdc_source, v_usdc_destination, 'faucet', 1000000000,
    p_idempotency_key, 'One-time private-test TEST_USDC allocation', jsonb_build_object('real_world_effect', false)
  );
  if not coalesce((v_usdc_result->>'ok')::boolean, false) then return v_usdc_result; end if;

  v_indx_result := public.private_test_post_ledger_transaction(
    v_uid, v_wallet_id, v_indx_source, v_indx_destination, 'faucet', 10000000000,
    gen_random_uuid(), 'One-time private-test TEST_INDX allocation', jsonb_build_object('real_world_effect', false)
  );
  if not coalesce((v_indx_result->>'ok')::boolean, false) then return v_indx_result; end if;

  insert into public.private_test_faucet_claims (
    wallet_id, auth_user_id, idempotency_key, test_usdc_atomic, test_indx_atomic
  ) values (v_wallet_id, v_uid, p_idempotency_key, 1000000000, 10000000000)
  returning * into v_claim;

  return jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'test_usdc_atomic', v_claim.test_usdc_atomic,
    'test_indx_atomic', v_claim.test_indx_atomic,
    'claimed_at', v_claim.created_at,
    'real_world_effect', false
  );
end;
$$;

revoke all on function public.claim_my_private_test_funds(text, uuid) from public, anon;
grant execute on function public.claim_my_private_test_funds(text, uuid) to authenticated;

create or replace function public.resolve_private_test_recipient(p_domain text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_domain text;
  v_result jsonb;
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;
  v_domain := lower(trim(coalesce(p_domain, '')));
  if right(v_domain, 7) <> '.in$dex' then v_domain := v_domain || '.in$dex'; end if;

  select jsonb_build_object(
    'ok', true,
    'display_name', i.display_name,
    'domain', i.domain,
    'wallet_ready', w.id is not null
  ) into v_result
    from public.citizen_identity_claims i
    left join public.private_test_wallets w on w.citizen_id = i.citizen_id and w.status = 'active'
   where lower(i.domain) = v_domain and i.status = 'active'
   limit 1;

  return coalesce(v_result, jsonb_build_object('ok', false, 'code', 'RECIPIENT_NOT_FOUND'));
end;
$$;

revoke all on function public.resolve_private_test_recipient(text) from public, anon;
grant execute on function public.resolve_private_test_recipient(text) to authenticated;

create or replace function public.send_my_private_test_transfer(
  p_recipient_domain text,
  p_asset text,
  p_amount_atomic bigint,
  p_memo text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_wallet_id uuid;
  v_recipient_wallet_id uuid;
  v_recipient_domain text;
  v_source_account_id uuid;
  v_destination_account_id uuid;
  v_asset text := upper(trim(coalesce(p_asset, '')));
  v_memo text;
begin
  if v_uid is null then raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED'; end if;
  if v_asset not in ('TEST_USDC', 'TEST_INDX') then return jsonb_build_object('ok', false, 'code', 'INVALID_ASSET'); end if;

  select w.id into v_wallet_id from public.private_test_wallets w where w.auth_user_id = v_uid and w.status = 'active';
  if v_wallet_id is null then return jsonb_build_object('ok', false, 'code', 'WALLET_NOT_READY'); end if;

  v_recipient_domain := lower(trim(coalesce(p_recipient_domain, '')));
  if right(v_recipient_domain, 7) <> '.in$dex' then v_recipient_domain := v_recipient_domain || '.in$dex'; end if;
  select w.id into v_recipient_wallet_id
    from public.citizen_identity_claims i
    join public.private_test_wallets w on w.citizen_id = i.citizen_id and w.status = 'active'
   where lower(i.domain) = v_recipient_domain and i.status = 'active' limit 1;
  if v_recipient_wallet_id is null then return jsonb_build_object('ok', false, 'code', 'RECIPIENT_WALLET_NOT_READY'); end if;
  if v_recipient_wallet_id = v_wallet_id then return jsonb_build_object('ok', false, 'code', 'SELF_TRANSFER_NOT_ALLOWED'); end if;

  select id into v_source_account_id from public.private_test_ledger_accounts where wallet_id = v_wallet_id and asset = v_asset;
  select id into v_destination_account_id from public.private_test_ledger_accounts where wallet_id = v_recipient_wallet_id and asset = v_asset;
  v_memo := nullif(left(trim(regexp_replace(coalesce(p_memo, ''), '[[:cntrl:]]', ' ', 'g')), 120), '');

  return public.private_test_post_ledger_transaction(
    v_uid, v_wallet_id, v_source_account_id, v_destination_account_id,
    'transfer', p_amount_atomic, p_idempotency_key, v_memo,
    jsonb_build_object('recipient_domain', v_recipient_domain, 'real_world_effect', false)
  );
end;
$$;

revoke all on function public.send_my_private_test_transfer(text, text, bigint, text, uuid) from public, anon;
grant execute on function public.send_my_private_test_transfer(text, text, bigint, text, uuid) to authenticated;

create or replace function public.create_my_private_test_payment_request(
  p_asset text,
  p_amount_atomic bigint,
  p_purpose text,
  p_expires_minutes integer,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_wallet_id uuid;
  v_asset text := upper(trim(coalesce(p_asset, '')));
  v_purpose text;
  v_expiry integer;
  v_request public.private_test_payment_requests%rowtype;
begin
  if v_uid is null then raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED'; end if;
  if v_asset not in ('TEST_USDC', 'TEST_INDX') then return jsonb_build_object('ok', false, 'code', 'INVALID_ASSET'); end if;
  if p_amount_atomic is null or p_amount_atomic <= 0 then return jsonb_build_object('ok', false, 'code', 'INVALID_AMOUNT'); end if;
  if p_idempotency_key is null then return jsonb_build_object('ok', false, 'code', 'INVALID_IDEMPOTENCY_KEY'); end if;
  if (v_asset = 'TEST_USDC' and p_amount_atomic > 10000000000)
     or (v_asset = 'TEST_INDX' and p_amount_atomic > 100000000000) then
    return jsonb_build_object('ok', false, 'code', 'AMOUNT_LIMIT_EXCEEDED');
  end if;
  v_purpose := left(trim(regexp_replace(coalesce(p_purpose, ''), '[[:cntrl:]]', ' ', 'g')), 120);
  if v_purpose = '' then return jsonb_build_object('ok', false, 'code', 'INVALID_PURPOSE'); end if;
  v_expiry := greatest(5, least(coalesce(p_expires_minutes, 60), 1440));

  select w.id into v_wallet_id from public.private_test_wallets w where w.auth_user_id = v_uid and w.status = 'active';
  if v_wallet_id is null then return jsonb_build_object('ok', false, 'code', 'WALLET_NOT_READY'); end if;

  perform pg_advisory_xact_lock(hashtextextended('private-test-payment-create:' || v_uid::text || ':' || p_idempotency_key::text, 0));
  select * into v_request from public.private_test_payment_requests r
   where r.creator_auth_user_id = v_uid and r.idempotency_key = p_idempotency_key limit 1;
  if found then
    if v_request.asset <> v_asset or v_request.amount_atomic <> p_amount_atomic
       or v_request.purpose <> v_purpose or v_request.expires_minutes <> v_expiry then
      return jsonb_build_object('ok', false, 'code', 'IDEMPOTENCY_CONFLICT');
    end if;
    return jsonb_build_object('ok', true, 'duplicate', true, 'request_id', v_request.id, 'expires_at', v_request.expires_at);
  end if;

  insert into public.private_test_payment_requests (
    creator_auth_user_id, recipient_wallet_id, asset, amount_atomic, purpose,
    idempotency_key, expires_minutes, expires_at
  ) values (
    v_uid, v_wallet_id, v_asset, p_amount_atomic, v_purpose,
    p_idempotency_key, v_expiry, now() + make_interval(mins => v_expiry)
  ) returning * into v_request;

  return jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'request_id', v_request.id,
    'asset', v_request.asset,
    'amount_atomic', v_request.amount_atomic,
    'purpose', v_request.purpose,
    'expires_at', v_request.expires_at,
    'real_world_effect', false
  );
end;
$$;

revoke all on function public.create_my_private_test_payment_request(text, bigint, text, integer, uuid) from public, anon;
grant execute on function public.create_my_private_test_payment_request(text, bigint, text, integer, uuid) to authenticated;

create or replace function public.register_my_private_test_merchant(
  p_display_name text,
  p_terms_version text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_wallet_id uuid;
  v_name text;
  v_merchant public.private_test_merchants%rowtype;
begin
  if v_uid is null then raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED'; end if;
  if coalesce(p_terms_version, '') <> 'private-test-merchant-v1' then return jsonb_build_object('ok', false, 'code', 'CONSENT_REQUIRED'); end if;
  v_name := left(trim(regexp_replace(coalesce(p_display_name, ''), '[[:cntrl:]]', ' ', 'g')), 80);
  if char_length(v_name) < 2 then return jsonb_build_object('ok', false, 'code', 'INVALID_MERCHANT'); end if;
  select w.id into v_wallet_id from public.private_test_wallets w
   where w.auth_user_id = v_uid and w.status = 'active' limit 1;
  if v_wallet_id is null then return jsonb_build_object('ok', false, 'code', 'WALLET_NOT_READY'); end if;

  insert into public.private_test_merchants (auth_user_id, wallet_id, display_name, terms_version)
  values (v_uid, v_wallet_id, v_name, p_terms_version)
  on conflict (auth_user_id) do update
    set display_name = excluded.display_name, terms_version = excluded.terms_version, updated_at = now()
  returning * into v_merchant;

  return jsonb_build_object(
    'ok', true,
    'merchant_id', v_merchant.id,
    'display_name', v_merchant.display_name,
    'status', v_merchant.status,
    'settlement_wallet_id', v_merchant.wallet_id,
    'external_settlement', false,
    'real_world_effect', false
  );
end;
$$;

revoke all on function public.register_my_private_test_merchant(text, text) from public, anon;
grant execute on function public.register_my_private_test_merchant(text, text) to authenticated;

create or replace function public.create_my_private_test_merchant_order(
  p_order_reference text,
  p_asset text,
  p_amount_atomic bigint,
  p_expires_minutes integer,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_merchant public.private_test_merchants%rowtype;
  v_reference text;
  v_request jsonb;
  v_order public.private_test_merchant_orders%rowtype;
begin
  if v_uid is null then raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED'; end if;
  select * into v_merchant from public.private_test_merchants m
   where m.auth_user_id = v_uid and m.status = 'active' limit 1;
  if v_merchant.id is null then return jsonb_build_object('ok', false, 'code', 'MERCHANT_NOT_READY'); end if;
  v_reference := left(trim(regexp_replace(coalesce(p_order_reference, ''), '[[:cntrl:]]', ' ', 'g')), 80);
  if v_reference = '' then return jsonb_build_object('ok', false, 'code', 'INVALID_ORDER_REFERENCE'); end if;

  v_request := public.create_my_private_test_payment_request(
    p_asset, p_amount_atomic, 'Merchant order: ' || v_reference,
    p_expires_minutes, p_idempotency_key
  );
  if not coalesce((v_request->>'ok')::boolean, false) then return v_request; end if;

  insert into public.private_test_merchant_orders (
    merchant_id, creator_auth_user_id, payment_request_id,
    order_reference, asset, amount_atomic
  ) values (
    v_merchant.id, v_uid, (v_request->>'request_id')::uuid,
    v_reference, upper(trim(coalesce(p_asset, ''))), p_amount_atomic
  ) on conflict (payment_request_id) do update set payment_request_id = excluded.payment_request_id
  returning * into v_order;

  return v_request || jsonb_build_object(
    'merchant_order_id', v_order.id,
    'merchant_name', v_merchant.display_name,
    'order_reference', v_order.order_reference,
    'settlement', 'internal_private_test_wallet',
    'external_settlement', false
  );
end;
$$;

revoke all on function public.create_my_private_test_merchant_order(text, text, bigint, integer, uuid) from public, anon;
grant execute on function public.create_my_private_test_merchant_order(text, text, bigint, integer, uuid) to authenticated;

create or replace function public.get_private_test_payment_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_result jsonb;
begin
  if v_uid is null then raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED'; end if;
  update public.private_test_payment_requests
     set status = 'expired'
   where id = p_request_id and status = 'open' and expires_at <= now();

  select jsonb_build_object(
    'ok', true,
    'request_id', r.id,
    'recipient_name', i.display_name,
    'recipient_domain', i.domain,
    'asset', r.asset,
    'amount_atomic', r.amount_atomic,
    'purpose', r.purpose,
    'status', r.status,
    'expires_at', r.expires_at,
    'real_world_effect', false
  ) into v_result
    from public.private_test_payment_requests r
    join public.private_test_wallets w on w.id = r.recipient_wallet_id
    left join public.citizen_identity_claims i on i.citizen_id = w.citizen_id
   where r.id = p_request_id
   limit 1;

  return coalesce(v_result, jsonb_build_object('ok', false, 'code', 'REQUEST_NOT_FOUND'));
end;
$$;

revoke all on function public.get_private_test_payment_request(uuid) from public, anon;
grant execute on function public.get_private_test_payment_request(uuid) to authenticated;

create or replace function public.pay_private_test_payment_request(
  p_request_id uuid,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_wallet_id uuid;
  v_request public.private_test_payment_requests%rowtype;
  v_source_account_id uuid;
  v_destination_account_id uuid;
  v_result jsonb;
begin
  if v_uid is null then raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED'; end if;
  select w.id into v_wallet_id from public.private_test_wallets w where w.auth_user_id = v_uid and w.status = 'active';
  if v_wallet_id is null then return jsonb_build_object('ok', false, 'code', 'WALLET_NOT_READY'); end if;

  perform pg_advisory_xact_lock(hashtextextended('private-test-request:' || coalesce(p_request_id::text, ''), 0));
  select * into v_request from public.private_test_payment_requests r where r.id = p_request_id for update;
  if v_request.id is null then return jsonb_build_object('ok', false, 'code', 'REQUEST_NOT_FOUND'); end if;
  if v_request.status = 'paid' and v_request.payer_wallet_id = v_wallet_id then
    return jsonb_build_object('ok', true, 'duplicate', true, 'transaction_id', v_request.transaction_id, 'paid_at', v_request.paid_at);
  end if;
  if v_request.status <> 'open' then return jsonb_build_object('ok', false, 'code', 'REQUEST_ALREADY_PAID'); end if;
  if v_request.expires_at <= now() then
    update public.private_test_payment_requests set status = 'expired' where id = v_request.id;
    return jsonb_build_object('ok', false, 'code', 'REQUEST_EXPIRED');
  end if;
  if v_request.recipient_wallet_id = v_wallet_id then return jsonb_build_object('ok', false, 'code', 'SELF_TRANSFER_NOT_ALLOWED'); end if;

  select id into v_source_account_id from public.private_test_ledger_accounts where wallet_id = v_wallet_id and asset = v_request.asset;
  select id into v_destination_account_id from public.private_test_ledger_accounts where wallet_id = v_request.recipient_wallet_id and asset = v_request.asset;
  v_result := public.private_test_post_ledger_transaction(
    v_uid, v_wallet_id, v_source_account_id, v_destination_account_id,
    'payment_request', v_request.amount_atomic, p_idempotency_key, v_request.purpose,
    jsonb_build_object('payment_request_id', v_request.id, 'real_world_effect', false)
  );
  if not coalesce((v_result->>'ok')::boolean, false) then return v_result; end if;

  update public.private_test_payment_requests
     set status = 'paid', payer_wallet_id = v_wallet_id,
         transaction_id = (v_result->>'transaction_id')::uuid, paid_at = now()
   where id = v_request.id;
  update public.private_test_merchant_orders
     set status = 'settled', settlement_transaction_id = (v_result->>'transaction_id')::uuid, paid_at = now()
   where payment_request_id = v_request.id and status = 'awaiting_payment';
  return v_result || jsonb_build_object('request_id', v_request.id, 'paid_at', now());
end;
$$;

revoke all on function public.pay_private_test_payment_request(uuid, uuid) from public, anon;
grant execute on function public.pay_private_test_payment_request(uuid, uuid) to authenticated;

create or replace function public.cancel_my_private_test_payment_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
begin
  if v_uid is null then raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED'; end if;
  update public.private_test_payment_requests
     set status = 'cancelled'
   where id = p_request_id and creator_auth_user_id = v_uid and status = 'open';
  get diagnostics v_count = row_count;
  return case when v_count = 1
    then jsonb_build_object('ok', true, 'request_id', p_request_id)
    else jsonb_build_object('ok', false, 'code', 'REQUEST_NOT_FOUND') end;
end;
$$;

revoke all on function public.cancel_my_private_test_payment_request(uuid) from public, anon;
grant execute on function public.cancel_my_private_test_payment_request(uuid) to authenticated;

create or replace function public.send_my_private_test_remittance(
  p_recipient_domain text,
  p_destination_country text,
  p_asset text,
  p_amount_atomic bigint,
  p_note text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_wallet_id uuid;
  v_recipient_wallet_id uuid;
  v_domain text;
  v_country text;
  v_asset text := upper(trim(coalesce(p_asset, '')));
  v_source_account_id uuid;
  v_destination_account_id uuid;
  v_result jsonb;
  v_note text;
begin
  if v_uid is null then raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED'; end if;
  v_country := trim(coalesce(p_destination_country, ''));
  if lower(v_country) not in (
    'cook islands','fiji','tonga','samoa','papua new guinea','solomon islands','vanuatu',
    'australia','new zealand','philippines','india','indonesia','malaysia','thailand','vietnam',
    'united kingdom','united states'
  ) then return jsonb_build_object('ok', false, 'code', 'INVALID_COUNTRY'); end if;
  if v_asset not in ('TEST_USDC', 'TEST_INDX') then return jsonb_build_object('ok', false, 'code', 'INVALID_ASSET'); end if;

  select w.id into v_wallet_id from public.private_test_wallets w where w.auth_user_id = v_uid and w.status = 'active';
  if v_wallet_id is null then return jsonb_build_object('ok', false, 'code', 'WALLET_NOT_READY'); end if;
  v_domain := lower(trim(coalesce(p_recipient_domain, '')));
  if right(v_domain, 7) <> '.in$dex' then v_domain := v_domain || '.in$dex'; end if;
  select w.id into v_recipient_wallet_id
    from public.citizen_identity_claims i join public.private_test_wallets w on w.citizen_id = i.citizen_id and w.status = 'active'
   where lower(i.domain) = v_domain and i.status = 'active' limit 1;
  if v_recipient_wallet_id is null then return jsonb_build_object('ok', false, 'code', 'RECIPIENT_WALLET_NOT_READY'); end if;
  if v_recipient_wallet_id = v_wallet_id then return jsonb_build_object('ok', false, 'code', 'SELF_TRANSFER_NOT_ALLOWED'); end if;

  select id into v_source_account_id from public.private_test_ledger_accounts where wallet_id = v_wallet_id and asset = v_asset;
  select id into v_destination_account_id from public.private_test_ledger_accounts where wallet_id = v_recipient_wallet_id and asset = v_asset;
  v_note := nullif(left(trim(regexp_replace(coalesce(p_note, ''), '[[:cntrl:]]', ' ', 'g')), 120), '');
  v_result := public.private_test_post_ledger_transaction(
    v_uid, v_wallet_id, v_source_account_id, v_destination_account_id,
    'remittance', p_amount_atomic, p_idempotency_key, v_note,
    jsonb_build_object('recipient_domain', v_domain, 'destination_country', v_country, 'fee_atomic', 0, 'fx_applied', false, 'real_world_effect', false)
  );
  if not coalesce((v_result->>'ok')::boolean, false) then return v_result; end if;

  insert into public.private_test_remittances (
    auth_user_id, sender_wallet_id, recipient_wallet_id, destination_country,
    asset, send_amount_atomic, receive_amount_atomic, fee_atomic, note, transaction_id
  ) values (
    v_uid, v_wallet_id, v_recipient_wallet_id, v_country,
    v_asset, p_amount_atomic, p_amount_atomic, 0, v_note, (v_result->>'transaction_id')::uuid
  ) on conflict (transaction_id) do nothing;

  return v_result || jsonb_build_object(
    'destination_country', v_country,
    'receive_amount_atomic', p_amount_atomic,
    'fee_atomic', 0,
    'fx_applied', false
  );
end;
$$;

revoke all on function public.send_my_private_test_remittance(text, text, text, bigint, text, uuid) from public, anon;
grant execute on function public.send_my_private_test_remittance(text, text, text, bigint, text, uuid) to authenticated;

create or replace function public.pay_my_private_test_bill(
  p_biller_id uuid,
  p_asset text,
  p_amount_atomic bigint,
  p_reference text,
  p_create_monthly_schedule boolean,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_wallet_id uuid;
  v_biller public.private_test_billers%rowtype;
  v_asset text := upper(trim(coalesce(p_asset, '')));
  v_source_account_id uuid;
  v_destination_account_id uuid;
  v_reference text;
  v_result jsonb;
  v_schedule_id uuid;
begin
  if v_uid is null then raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED'; end if;
  if v_asset not in ('TEST_USDC', 'TEST_INDX') then return jsonb_build_object('ok', false, 'code', 'INVALID_ASSET'); end if;
  select * into v_biller from public.private_test_billers b where b.id = p_biller_id and b.active limit 1;
  if v_biller.id is null then return jsonb_build_object('ok', false, 'code', 'INVALID_BILLER'); end if;
  select w.id into v_wallet_id from public.private_test_wallets w where w.auth_user_id = v_uid and w.status = 'active';
  if v_wallet_id is null then return jsonb_build_object('ok', false, 'code', 'WALLET_NOT_READY'); end if;
  select id into v_source_account_id from public.private_test_ledger_accounts where wallet_id = v_wallet_id and asset = v_asset;
  select id into v_destination_account_id from public.private_test_ledger_accounts where account_code = 'biller_clearing:' || v_asset;
  v_reference := nullif(left(trim(regexp_replace(coalesce(p_reference, ''), '[[:cntrl:]]', ' ', 'g')), 80), '');

  v_result := public.private_test_post_ledger_transaction(
    v_uid, v_wallet_id, v_source_account_id, v_destination_account_id,
    'bill', p_amount_atomic, p_idempotency_key, v_reference,
    jsonb_build_object('biller_id', v_biller.id, 'biller_name', v_biller.name, 'clearing_code', v_biller.clearing_code, 'create_monthly_schedule', coalesce(p_create_monthly_schedule, false), 'real_world_effect', false)
  );
  if not coalesce((v_result->>'ok')::boolean, false) then return v_result; end if;

  if coalesce(p_create_monthly_schedule, false) then
    insert into public.private_test_bill_schedules (
      auth_user_id, wallet_id, biller_id, asset, amount_atomic, reference, next_due_on, source_transaction_id
    ) values (
      v_uid, v_wallet_id, v_biller.id, v_asset, p_amount_atomic, v_reference,
      (current_date + interval '1 month')::date, (v_result->>'transaction_id')::uuid
    ) on conflict (source_transaction_id) do update set source_transaction_id = excluded.source_transaction_id
    returning id into v_schedule_id;
  end if;

  return v_result || jsonb_build_object(
    'biller_name', v_biller.name,
    'schedule_id', v_schedule_id,
    'schedule_requires_manual_approval', v_schedule_id is not null
  );
end;
$$;

revoke all on function public.pay_my_private_test_bill(uuid, text, bigint, text, boolean, uuid) from public, anon;
grant execute on function public.pay_my_private_test_bill(uuid, text, bigint, text, boolean, uuid) to authenticated;

create or replace function public.cancel_my_private_test_bill_schedule(p_schedule_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
begin
  if v_uid is null then raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED'; end if;
  update public.private_test_bill_schedules
     set status = 'cancelled', cancelled_at = now()
   where id = p_schedule_id and auth_user_id = v_uid and status = 'active';
  get diagnostics v_count = row_count;
  return case when v_count = 1
    then jsonb_build_object('ok', true, 'schedule_id', p_schedule_id)
    else jsonb_build_object('ok', false, 'code', 'SCHEDULE_NOT_FOUND') end;
end;
$$;

revoke all on function public.cancel_my_private_test_bill_schedule(uuid) from public, anon;
grant execute on function public.cancel_my_private_test_bill_schedule(uuid) to authenticated;

create or replace function public.issue_my_private_test_card(p_terms_version text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_wallet_id uuid;
  v_card public.private_test_cards%rowtype;
  v_reference text;
begin
  if v_uid is null then raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED'; end if;
  if coalesce(p_terms_version, '') <> 'private-test-card-v1' then return jsonb_build_object('ok', false, 'code', 'CONSENT_REQUIRED'); end if;
  select w.id into v_wallet_id from public.private_test_wallets w where w.auth_user_id = v_uid and w.status = 'active';
  if v_wallet_id is null then return jsonb_build_object('ok', false, 'code', 'WALLET_NOT_READY'); end if;
  perform pg_advisory_xact_lock(hashtextextended('private-test-card-issue:' || v_uid::text, 0));
  select * into v_card from public.private_test_cards c where c.auth_user_id = v_uid limit 1;
  if found then
    return jsonb_build_object('ok', true, 'duplicate', true, 'card_id', v_card.id, 'test_reference', v_card.test_reference, 'status', v_card.status);
  end if;

  loop
    v_reference := 'TEST-' || lpad(((hashtextextended(gen_random_uuid()::text, 0) & 2147483647) % 10000)::text, 4, '0');
    exit when not exists (select 1 from public.private_test_cards c where c.test_reference = v_reference);
  end loop;
  insert into public.private_test_cards (auth_user_id, wallet_id, test_reference)
  values (v_uid, v_wallet_id, v_reference)
  returning * into v_card;
  return jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'card_id', v_card.id,
    'test_reference', v_card.test_reference,
    'status', v_card.status,
    'asset', v_card.asset,
    'daily_limit_atomic', v_card.daily_limit_atomic,
    'real_card_issued', false
  );
end;
$$;

revoke all on function public.issue_my_private_test_card(text) from public, anon;
grant execute on function public.issue_my_private_test_card(text) to authenticated;

create or replace function public.set_my_private_test_card_frozen(p_frozen boolean)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_card public.private_test_cards%rowtype;
begin
  if v_uid is null then raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED'; end if;
  update public.private_test_cards
     set status = case when coalesce(p_frozen, true) then 'frozen' else 'active' end,
         updated_at = now()
   where auth_user_id = v_uid
  returning * into v_card;
  if v_card.id is null then return jsonb_build_object('ok', false, 'code', 'CARD_NOT_ISSUED'); end if;
  return jsonb_build_object('ok', true, 'card_id', v_card.id, 'status', v_card.status, 'updated_at', v_card.updated_at);
end;
$$;

revoke all on function public.set_my_private_test_card_frozen(boolean) from public, anon;
grant execute on function public.set_my_private_test_card_frozen(boolean) to authenticated;

create or replace function public.authorize_my_private_test_card_purchase(
  p_merchant_label text,
  p_amount_atomic bigint,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_wallet_id uuid;
  v_citizen public.citizens%rowtype;
  v_card public.private_test_cards%rowtype;
  v_source_account_id uuid;
  v_destination_account_id uuid;
  v_spent bigint := 0;
  v_merchant text;
  v_result jsonb;
begin
  if v_uid is null then raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED'; end if;
  select w.id into v_wallet_id
    from public.private_test_wallets w
   where w.auth_user_id = v_uid and w.status = 'active'
   limit 1;
  if v_wallet_id is null then return jsonb_build_object('ok', false, 'code', 'WALLET_NOT_READY'); end if;
  select c.* into v_citizen
    from public.private_test_wallets w
    join public.citizens c on c.id = w.citizen_id
   where w.id = v_wallet_id
   limit 1;
  if coalesce((to_jsonb(v_citizen)->>'account_frozen')::boolean, false) then return jsonb_build_object('ok', false, 'code', 'ACCOUNT_SECURITY_HOLD'); end if;
  if coalesce((to_jsonb(v_citizen)->>'card_frozen')::boolean, false) then return jsonb_build_object('ok', false, 'code', 'CARD_SECURITY_HOLD'); end if;
  select * into v_card from public.private_test_cards c where c.auth_user_id = v_uid for update;
  if v_card.id is null then return jsonb_build_object('ok', false, 'code', 'CARD_NOT_ISSUED'); end if;
  if v_card.status = 'frozen' then return jsonb_build_object('ok', false, 'code', 'CARD_FROZEN'); end if;
  if p_amount_atomic is null or p_amount_atomic <= 0 then return jsonb_build_object('ok', false, 'code', 'INVALID_AMOUNT'); end if;

  select coalesce(sum(t.amount_atomic), 0) into v_spent
    from public.private_test_transactions t
   where t.from_wallet_id = v_wallet_id and t.transaction_type = 'card_purchase'
     and t.created_at >= date_trunc('day', now());
  if v_spent + p_amount_atomic > v_card.daily_limit_atomic then return jsonb_build_object('ok', false, 'code', 'DAILY_LIMIT_EXCEEDED'); end if;
  v_merchant := left(trim(regexp_replace(coalesce(p_merchant_label, ''), '[[:cntrl:]]', ' ', 'g')), 80);
  if v_merchant = '' then return jsonb_build_object('ok', false, 'code', 'INVALID_MERCHANT'); end if;

  select id into v_source_account_id from public.private_test_ledger_accounts where wallet_id = v_wallet_id and asset = 'TEST_USDC';
  select id into v_destination_account_id from public.private_test_ledger_accounts where account_code = 'card_clearing:TEST_USDC';
  v_result := public.private_test_post_ledger_transaction(
    v_uid, v_wallet_id, v_source_account_id, v_destination_account_id,
    'card_purchase', p_amount_atomic, p_idempotency_key, v_merchant,
    jsonb_build_object('merchant_label', v_merchant, 'card_reference', v_card.test_reference, 'real_card_network', false, 'real_world_effect', false)
  );
  if coalesce((v_result->>'ok')::boolean, false) then
    update public.private_test_cards set last_used_at = now(), updated_at = now() where id = v_card.id;
  end if;
  return v_result || jsonb_build_object('merchant_label', v_merchant, 'test_reference', v_card.test_reference);
end;
$$;

revoke all on function public.authorize_my_private_test_card_purchase(text, bigint, uuid) from public, anon;
grant execute on function public.authorize_my_private_test_card_purchase(text, bigint, uuid) to authenticated;

create or replace function public.request_my_private_test_refund(
  p_transaction_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_wallet_id uuid;
  v_original public.private_test_transactions%rowtype;
  v_request public.private_test_refund_requests%rowtype;
  v_reason text;
begin
  if v_uid is null then raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED'; end if;
  select w.id into v_wallet_id from public.private_test_wallets w
   where w.auth_user_id = v_uid and w.status = 'active' limit 1;
  if v_wallet_id is null then return jsonb_build_object('ok', false, 'code', 'WALLET_NOT_READY'); end if;

  select * into v_original from public.private_test_transactions t
   where t.id = p_transaction_id and t.actor_auth_user_id = v_uid and t.from_wallet_id = v_wallet_id
     and t.to_wallet_id is not null and t.transaction_type in ('transfer', 'payment_request', 'remittance')
   limit 1;
  if v_original.id is null then return jsonb_build_object('ok', false, 'code', 'REFUND_NOT_ELIGIBLE'); end if;

  perform pg_advisory_xact_lock(hashtextextended('private-test-refund-create:' || v_original.id::text, 0));
  select * into v_request from public.private_test_refund_requests r
   where r.original_transaction_id = v_original.id limit 1;
  if found then
    return jsonb_build_object('ok', true, 'duplicate', true, 'refund_request_id', v_request.id, 'status', v_request.status);
  end if;

  v_reason := left(trim(regexp_replace(coalesce(p_reason, ''), '[[:cntrl:]]', ' ', 'g')), 120);
  if v_reason = '' then return jsonb_build_object('ok', false, 'code', 'INVALID_REFUND_REASON'); end if;

  insert into public.private_test_refund_requests (
    original_transaction_id, requester_auth_user_id, requester_wallet_id,
    refunding_wallet_id, asset, amount_atomic, reason
  ) values (
    v_original.id, v_uid, v_original.from_wallet_id,
    v_original.to_wallet_id, v_original.asset, v_original.amount_atomic, v_reason
  ) returning * into v_request;

  return jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'refund_request_id', v_request.id,
    'status', v_request.status,
    'requires_recipient_approval', true,
    'real_world_effect', false
  );
end;
$$;

revoke all on function public.request_my_private_test_refund(uuid, text) from public, anon;
grant execute on function public.request_my_private_test_refund(uuid, text) to authenticated;

create or replace function public.decide_my_private_test_refund(
  p_refund_request_id uuid,
  p_approve boolean,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_wallet_id uuid;
  v_request public.private_test_refund_requests%rowtype;
  v_source_account_id uuid;
  v_destination_account_id uuid;
  v_result jsonb;
begin
  if v_uid is null then raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED'; end if;
  select w.id into v_wallet_id from public.private_test_wallets w
   where w.auth_user_id = v_uid and w.status = 'active' limit 1;
  if v_wallet_id is null then return jsonb_build_object('ok', false, 'code', 'WALLET_NOT_READY'); end if;

  perform pg_advisory_xact_lock(hashtextextended('private-test-refund:' || coalesce(p_refund_request_id::text, ''), 0));
  select * into v_request from public.private_test_refund_requests r
   where r.id = p_refund_request_id and r.refunding_wallet_id = v_wallet_id for update;
  if v_request.id is null then return jsonb_build_object('ok', false, 'code', 'REFUND_REQUEST_NOT_FOUND'); end if;
  if v_request.status = 'approved' then
    return jsonb_build_object('ok', true, 'duplicate', true, 'refund_request_id', v_request.id, 'status', v_request.status, 'transaction_id', v_request.refund_transaction_id);
  end if;
  if v_request.status <> 'pending' then return jsonb_build_object('ok', false, 'code', 'REFUND_ALREADY_DECIDED'); end if;

  if not coalesce(p_approve, false) then
    update public.private_test_refund_requests set status = 'declined', decided_at = now() where id = v_request.id;
    return jsonb_build_object('ok', true, 'refund_request_id', v_request.id, 'status', 'declined', 'real_world_effect', false);
  end if;

  select id into v_source_account_id from public.private_test_ledger_accounts
   where wallet_id = v_request.refunding_wallet_id and asset = v_request.asset;
  select id into v_destination_account_id from public.private_test_ledger_accounts
   where wallet_id = v_request.requester_wallet_id and asset = v_request.asset;
  v_result := public.private_test_post_ledger_transaction(
    v_uid, v_wallet_id, v_source_account_id, v_destination_account_id,
    'refund', v_request.amount_atomic, p_idempotency_key, 'Approved private-test refund',
    jsonb_build_object('refund_request_id', v_request.id, 'original_transaction_id', v_request.original_transaction_id, 'real_world_effect', false)
  );
  if not coalesce((v_result->>'ok')::boolean, false) then return v_result; end if;

  update public.private_test_refund_requests
     set status = 'approved', refund_transaction_id = (v_result->>'transaction_id')::uuid, decided_at = now()
   where id = v_request.id;
  return v_result || jsonb_build_object('refund_request_id', v_request.id, 'status', 'approved');
end;
$$;

revoke all on function public.decide_my_private_test_refund(uuid, boolean, uuid) from public, anon;
grant execute on function public.decide_my_private_test_refund(uuid, boolean, uuid) to authenticated;

create or replace function public.get_my_private_test_wallet_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_wallet public.private_test_wallets%rowtype;
  v_identity jsonb;
  v_balances jsonb;
  v_card jsonb;
  v_billers jsonb;
  v_merchant jsonb;
  v_merchant_orders jsonb;
  v_requests jsonb;
  v_schedules jsonb;
  v_transactions jsonb;
  v_refunds jsonb;
  v_faucet_claimed boolean;
begin
  if v_uid is null then raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED'; end if;
  select * into v_wallet from public.private_test_wallets w where w.auth_user_id = v_uid and w.status = 'active' limit 1;
  if v_wallet.id is null then return jsonb_build_object('ok', false, 'code', 'WALLET_NOT_READY'); end if;

  select jsonb_build_object('display_name', i.display_name, 'domain', i.domain)
    into v_identity from public.citizen_identity_claims i where i.citizen_id = v_wallet.citizen_id limit 1;
  select coalesce(jsonb_agg(jsonb_build_object(
      'asset', a.asset,
      'balance_atomic', a.balance_atomic,
      'daily_outflow_limit_atomic', a.daily_outflow_limit_atomic
    ) order by a.asset), '[]'::jsonb)
    into v_balances from public.private_test_ledger_accounts a where a.wallet_id = v_wallet.id;
  select coalesce(jsonb_build_object(
      'id', c.id,
      'test_reference', c.test_reference,
      'status', c.status,
      'asset', c.asset,
      'daily_limit_atomic', c.daily_limit_atomic,
      'issued_at', c.issued_at,
      'last_used_at', c.last_used_at,
      'real_card_issued', false
    ), 'null'::jsonb) into v_card
    from public.private_test_cards c where c.wallet_id = v_wallet.id limit 1;
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', b.id, 'name', b.name, 'category', b.category
    ) order by b.name), '[]'::jsonb)
    into v_billers from public.private_test_billers b where b.active;
  select jsonb_build_object(
      'id', m.id,
      'display_name', m.display_name,
      'status', m.status,
      'settlement', 'internal_private_test_wallet',
      'external_settlement', false
    ) into v_merchant
    from public.private_test_merchants m where m.wallet_id = v_wallet.id limit 1;
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', o.id,
      'payment_request_id', o.payment_request_id,
      'order_reference', o.order_reference,
      'asset', o.asset,
      'amount_atomic', o.amount_atomic,
      'status', o.status,
      'created_at', o.created_at,
      'paid_at', o.paid_at
    ) order by o.created_at desc), '[]'::jsonb)
    into v_merchant_orders
    from public.private_test_merchant_orders o
    join public.private_test_merchants m on m.id = o.merchant_id
   where m.wallet_id = v_wallet.id;
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', r.id, 'asset', r.asset, 'amount_atomic', r.amount_atomic,
      'purpose', r.purpose, 'status', r.status, 'expires_at', r.expires_at,
      'paid_at', r.paid_at, 'created_at', r.created_at
    ) order by r.created_at desc), '[]'::jsonb)
    into v_requests from (
      select * from public.private_test_payment_requests
       where creator_auth_user_id = v_uid order by created_at desc limit 10
    ) r;
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', s.id, 'biller_name', b.name, 'asset', s.asset,
      'amount_atomic', s.amount_atomic, 'reference', s.reference,
      'status', s.status, 'next_due_on', s.next_due_on,
      'requires_manual_approval', true
    ) order by s.created_at desc), '[]'::jsonb)
    into v_schedules
    from public.private_test_bill_schedules s
    join public.private_test_billers b on b.id = s.biller_id
   where s.auth_user_id = v_uid;
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', t.id,
      'transaction_type', t.transaction_type,
      'direction', case when t.from_wallet_id = v_wallet.id then 'out' else 'in' end,
      'asset', t.asset,
      'amount_atomic', t.amount_atomic,
      'reference', t.reference,
      'metadata', t.metadata,
      'created_at', t.created_at
    ) order by t.created_at desc), '[]'::jsonb)
    into v_transactions from (
      select * from public.private_test_transactions
       where from_wallet_id = v_wallet.id or to_wallet_id = v_wallet.id
       order by created_at desc limit 30
    ) t;
  select exists(select 1 from public.private_test_faucet_claims f where f.wallet_id = v_wallet.id) into v_faucet_claimed;
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', r.id,
      'original_transaction_id', r.original_transaction_id,
      'direction', case when r.requester_wallet_id = v_wallet.id then 'requested' else 'received' end,
      'asset', r.asset,
      'amount_atomic', r.amount_atomic,
      'reason', r.reason,
      'status', r.status,
      'requested_at', r.requested_at,
      'decided_at', r.decided_at
    ) order by r.requested_at desc), '[]'::jsonb)
    into v_refunds
    from public.private_test_refund_requests r
   where r.requester_wallet_id = v_wallet.id or r.refunding_wallet_id = v_wallet.id;

  return jsonb_build_object(
    'ok', true,
    'wallet', jsonb_build_object(
      'id', v_wallet.id,
      'environment', v_wallet.environment,
      'network', v_wallet.network,
      'status', v_wallet.status,
      'real_world_effect', false,
      'stores_private_keys', false
    ),
    'identity', coalesce(v_identity, '{}'::jsonb),
    'balances', v_balances,
    'faucet_claimed', v_faucet_claimed,
    'card', v_card,
    'billers', v_billers,
    'merchant', coalesce(v_merchant, 'null'::jsonb),
    'merchant_orders', v_merchant_orders,
    'payment_requests', v_requests,
    'bill_schedules', v_schedules,
    'transactions', v_transactions,
    'refund_requests', v_refunds
  );
end;
$$;

revoke all on function public.get_my_private_test_wallet_dashboard() from public, anon;
grant execute on function public.get_my_private_test_wallet_dashboard() to authenticated;

commit;
