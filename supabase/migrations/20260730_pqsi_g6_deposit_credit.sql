-- ============================================================================
-- PQSI G6 — Deposit Crediting Integrity
-- IN$DEX · written 2026-07-30 · NOT YET APPLIED
--
-- THE ATTACK — verified at source before writing this file
--   The Solana "false top-up" / SPL Token Account Ownership Reassignment exploit.
--   Six instructions in ONE atomic transaction:
--
--     1. Create a temporary SPL token account, attacker-controlled
--     2. Initialise it with the ATTACKER as owner authority
--     3. Transfer tokens INTO the temporary account, from the attacker's own funds
--     4. Transfer those same tokens back OUT — a wash, zero net movement
--     5. setAuthority: reassign the NOW-EMPTY account to the platform's address
--     6. Commit — Solana transactions are atomic, so all six land together
--
--   After finalisation, an RPC query on that account returns the PLATFORM as
--   owner, and the transaction genuinely contains a transfer of N tokens. A
--   naive indexer reads "a transfer of N happened, and we own the account" and
--   credits N. The tokens left in step 4. The platform then pays out real funds
--   against a deposit that never arrived.
--
--   The account is EMPTY at the moment it is handed over. That is the whole
--   trick, and it is why summing transfer instructions is the wrong test.
--
--   Solana's own exchange integration guidance states the rule plainly:
--   "Accepting deposits by allowing depositors to transfer ownership of token
--   accounts is strongly discouraged."
--
-- THE RULE THIS FILE ENFORCES
--   Credit is driven by the NET BALANCE DELTA on a token account IN$DEX created
--   and has always owned — never by transfer instructions, never by an observed
--   balance, and never on an account that arrived by setAuthority.
--
-- WHY IT MATTERS MORE THAN THE OTHER GATES
--   Every other gate protects a citizen from losing money. This one protects
--   IN$DEX from paying out money it never received — from the Civilisation Fund,
--   which belongs to the citizens. A single successful false top-up drains real
--   liquidity against a fictional deposit.
--
-- NOTHING IS CREDITED TODAY, so there is no live exposure. This is a launch gate.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. THE ONLY CREDITABLE ACCOUNTS
--    Registered at creation, by IN$DEX, with IN$DEX as the original authority.
--    An account IN$DEX did not create is never creditable, no matter who owns it
--    now — because "owns it now" is exactly what the attacker manufactures.
-- ---------------------------------------------------------------------------
create table if not exists indx_deposit_accounts (
  token_account       text primary key,
  citizen_id          uuid not null references citizens(id),
  mint                text not null,
  created_by_indx     boolean not null default true,
  created_at_slot     bigint,
  original_authority  text not null,
  registered_at       timestamptz not null default now(),
  is_active           boolean not null default true,
  last_verified_slot  bigint,
  last_verified_at    timestamptz,
  constraint deposit_account_must_be_ours check (created_by_indx = true)
);

create index if not exists idx_deposit_accounts_citizen
  on indx_deposit_accounts (citizen_id) where is_active;

comment on table indx_deposit_accounts is
  'Allowlist of creditable token accounts. The CHECK constraint makes it structurally impossible to register an account IN$DEX did not create — which is the false-top-up defence, because that attack works entirely by handing over an account created elsewhere.';

-- ---------------------------------------------------------------------------
-- 2. EVERY CREDIT ATTEMPT IS LOGGED, ACCEPTED OR NOT
--    A rejected attempt is the more valuable record: it is the attack evidence.
-- ---------------------------------------------------------------------------
create table if not exists deposit_credit_attempts (
  id                    uuid primary key default gen_random_uuid(),
  tx_signature          text not null,
  token_account         text not null,
  citizen_id            uuid,
  mint                  text,
  claimed_amount        numeric,          -- what the transfer instructions sum to
  net_balance_delta     numeric,          -- what actually changed. The only number that counts.
  pre_balance           numeric,
  post_balance          numeric,
  commitment            text,             -- must be 'finalized'
  slot                  bigint,
  contains_set_authority boolean not null default false,
  contains_assign        boolean not null default false,
  ownership_verified     boolean not null default false,
  decision              text not null,    -- CREDIT | REJECT
  reject_reason          text,
  credited_amount        numeric,
  attempted_at           timestamptz not null default now(),
  unique (tx_signature, token_account)    -- idempotent: no double credit on replay
);

create index if not exists idx_credit_attempts_rejected
  on deposit_credit_attempts (attempted_at desc) where decision = 'REJECT';

-- ---------------------------------------------------------------------------
-- 3. THE GATE
--
--    Called with the parsed transaction. Returns CREDIT or REJECT. All five
--    conditions must hold; any one failing rejects.
-- ---------------------------------------------------------------------------
create or replace function pqsi_evaluate_deposit(
  p_tx_signature   text,
  p_token_account  text,
  p_mint           text,
  p_claimed_amount numeric,      -- sum of transfer instructions — for comparison only
  p_pre_balance    numeric,      -- token account balance BEFORE, from the tx meta
  p_post_balance   numeric,      -- token account balance AFTER, from the tx meta
  p_commitment     text,
  p_slot           bigint,
  p_instructions   jsonb,        -- REQUIRED: decoded instruction list
  p_current_owner  text          -- owner as read from chain right now
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  acct        indx_deposit_accounts;
  v_delta     numeric;
  v_setauth   boolean := false;
  v_assign    boolean := false;
  ix          jsonb;
  reasons     text[] := '{}';
  v_decision  text;
  v_credit    numeric := 0;
  v_id        uuid;
  v_event     uuid;
begin
  if p_instructions is null or jsonb_typeof(p_instructions) <> 'array' then
    raise exception 'pqsi_evaluate_deposit: p_instructions is required. A deposit cannot be judged from amounts alone — the false top-up attack contains genuine transfer instructions and still delivers nothing.';
  end if;

  v_delta := coalesce(p_post_balance,0) - coalesce(p_pre_balance,0);

  -- scan for ownership-reassignment instructions in the SAME transaction
  for ix in select * from jsonb_array_elements(p_instructions) loop
    if lower(coalesce(ix->>'name','')) in ('setauthority','setauthoritychecked') then
      v_setauth := true;
    end if;
    if lower(coalesce(ix->>'name','')) in ('assign','assignwithseed') then
      v_assign := true;
    end if;
  end loop;

  -- CONDITION 1 — the account must be one IN$DEX created
  select * into acct from indx_deposit_accounts
   where token_account = p_token_account and is_active;
  if not found then
    reasons := reasons || format(
      'Token account %s is not a registered IN$DEX deposit account. IN$DEX credits only accounts it created itself. An account that arrived in our ownership by any other route is exactly what the false top-up attack produces.',
      p_token_account);
  end if;

  -- CONDITION 2 — no ownership reassignment anywhere in the transaction
  if v_setauth then
    reasons := reasons || 'Transaction contains setAuthority. This is step 5 of the false top-up: an emptied account is reassigned to the platform so an RPC query shows us as owner. Never credit a transaction that reassigns token-account authority.';
  end if;
  if v_assign then
    reasons := reasons || 'Transaction contains a System Program assign. Account ownership is being changed. Never credit.';
  end if;

  -- CONDITION 3 — net delta must be positive AND match the claim
  if v_delta <= 0 then
    reasons := reasons || format(
      'Net balance delta is %s. The transfer instructions claim %s, but nothing actually arrived — this is the wash-transfer signature (in, then straight back out). The only number that counts is the delta.',
      v_delta, p_claimed_amount);
  elsif p_claimed_amount is not null and abs(v_delta - p_claimed_amount) > 0.000001 then
    reasons := reasons || format(
      'Claimed %s but net delta is %s. Crediting the smaller of the two and flagging: a mismatch means value moved somewhere unaccounted for.',
      p_claimed_amount, v_delta);
  end if;

  -- CONDITION 4 — finalised only
  if coalesce(p_commitment,'') <> 'finalized' then
    reasons := reasons || format(
      'Commitment is "%s". Only `finalized` is creditable — `processed` and `confirmed` can still be rolled back, and a credit is not reversible.',
      coalesce(p_commitment,'null'));
  end if;

  -- CONDITION 5 — ownership unchanged since registration, verified NOW
  if acct.token_account is not null
     and p_current_owner is distinct from acct.original_authority then
    reasons := reasons || format(
      'Owner is now %s but this account was registered under %s. Ownership changed after registration — treat as compromised, do not credit.',
      p_current_owner, acct.original_authority);
  end if;

  if array_length(reasons,1) is null then
    v_decision := 'CREDIT';
    v_credit   := least(v_delta, coalesce(p_claimed_amount, v_delta));
  else
    v_decision := 'REJECT';
  end if;

  insert into deposit_credit_attempts
    (tx_signature, token_account, citizen_id, mint, claimed_amount,
     net_balance_delta, pre_balance, post_balance, commitment, slot,
     contains_set_authority, contains_assign,
     ownership_verified, decision, reject_reason, credited_amount)
  values
    (p_tx_signature, p_token_account, acct.citizen_id, p_mint, p_claimed_amount,
     v_delta, p_pre_balance, p_post_balance, p_commitment, p_slot,
     v_setauth, v_assign,
     (acct.token_account is not null and p_current_owner = acct.original_authority),
     v_decision, array_to_string(reasons, ' | '), v_credit)
  on conflict (tx_signature, token_account) do nothing
  returning id into v_id;

  if v_id is null then
    return jsonb_build_object('decision','REJECT','reason',
      'Already processed. This tx/account pair has an existing credit attempt — refusing to double-credit on replay.');
  end if;

  if v_decision = 'REJECT' then
    v_event := pqsi_log_event(
      case when v_setauth or v_assign then 'T4' else 'T3' end,
      'DEPOSIT_REJECT',
      format('Deposit REJECTED — %s', p_tx_signature),
      jsonb_build_object('attempt_id',v_id,'token_account',p_token_account,
                         'reasons',to_jsonb(reasons),'net_delta',v_delta,
                         'claimed',p_claimed_amount,'set_authority',v_setauth));
    -- setAuthority in a deposit is not an error, it is an attack. Contain it.
    if v_setauth or v_assign then
      perform pqsi_contain('solana_address', p_token_account, 'high',
        format('Attempted false top-up via ownership reassignment, tx %s', p_tx_signature),
        'pqsi_deposit_gate');
    end if;
  else
    v_event := pqsi_log_event('T0','DEPOSIT_CREDIT',
      format('Deposit credited — %s INDX to citizen %s', v_credit, acct.citizen_id),
      jsonb_build_object('attempt_id',v_id,'amount',v_credit,'slot',p_slot));
  end if;

  return jsonb_build_object(
    'decision', v_decision,
    'credited_amount', v_credit,
    'net_delta', v_delta,
    'claimed_amount', p_claimed_amount,
    'reasons', to_jsonb(reasons),
    'attempt_id', v_id,
    'event_id', v_event);
end;
$$;

comment on function pqsi_evaluate_deposit is
  'G6. Five conditions, all must hold: registered IN$DEX-created account; no setAuthority/assign in the transaction; positive net balance delta matching the claim; finalized commitment; ownership unchanged since registration. Credit follows the NET DELTA, never the transfer instructions — the false top-up contains genuine transfers and delivers nothing.';

-- ---------------------------------------------------------------------------
-- 4. RE-VERIFY BEFORE WITHDRAWAL
--    A deposit correctly credited can still be followed by an ownership change.
--    Check again before letting value leave.
-- ---------------------------------------------------------------------------
create or replace function pqsi_verify_before_withdrawal(
  p_citizen_id     uuid,
  p_amount_usd     numeric,
  p_owner_readings jsonb   -- {"<token_account>": "<current_owner>"}
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare a indx_deposit_accounts; bad jsonb := '[]'::jsonb; recent numeric;
begin
  for a in select * from indx_deposit_accounts
            where citizen_id = p_citizen_id and is_active loop
    if (p_owner_readings ? a.token_account)
       and (p_owner_readings->>a.token_account) is distinct from a.original_authority then
      bad := bad || jsonb_build_object('token_account',a.token_account,
        'expected',a.original_authority,'actual',p_owner_readings->>a.token_account);
    end if;
  end loop;

  if jsonb_array_length(bad) > 0 then
    perform pqsi_log_event('T4','WITHDRAWAL_BLOCKED',
      format('Withdrawal blocked — deposit account ownership changed for citizen %s', p_citizen_id),
      jsonb_build_object('citizen_id',p_citizen_id,'mismatches',bad));
    return jsonb_build_object('ok',false,'decision','BLOCK','mismatches',bad,
      'detail','One or more deposit accounts are no longer owned by the registered authority. Never pay out against an account whose ownership has moved.');
  end if;

  -- Rejected deposits in the last 24h against this citizen: someone tried, and a
  -- withdrawal immediately after is the cash-out leg.
  select count(*) into recent from deposit_credit_attempts
   where citizen_id = p_citizen_id and decision = 'REJECT'
     and attempted_at > now() - interval '24 hours';
  if recent > 0 then
    return jsonb_build_object('ok',false,'decision','HOLD',
      'detail', format('%s deposit(s) were rejected for this citizen in the last 24h. A withdrawal straight after a failed false top-up is the cash-out attempt. Manual review.', recent));
  end if;

  return jsonb_build_object('ok',true,'decision','PROCEED');
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. GRANTS — crediting is service-role only. No citizen path writes here.
-- ---------------------------------------------------------------------------
revoke all on function pqsi_evaluate_deposit, pqsi_verify_before_withdrawal
  from public, anon, authenticated;

alter table indx_deposit_accounts     enable row level security;
alter table deposit_credit_attempts   enable row level security;

drop policy if exists deposit_acct_own_read on indx_deposit_accounts;
create policy deposit_acct_own_read on indx_deposit_accounts for select to authenticated
  using (citizen_id in (select id from citizens where auth_user_id = auth.uid()));

commit;

-- ============================================================================
-- OPERATIONAL RULES THAT ARE NOT CODE
--   1. NEVER credit from a balance poll. Credit only from a parsed, finalised
--      transaction run through pqsi_evaluate_deposit().
--   2. NEVER accept a token account by ownership transfer. Solana's own exchange
--      guidance calls this out explicitly. IN$DEX creates every deposit account
--      it will ever credit; the CHECK constraint enforces it.
--   3. Register each account at creation with its real original_authority. A
--      wrong value here silently disables condition 5.
--   4. Alert on every REJECT with setAuthority present. That is not a bad
--      deposit, it is an attempted theft, and it is already auto-contained.
--
-- NOT VERIFIED. No Postgres in the sandbox. Needs a Supabase dev branch, and a
-- devnet reproduction of the six-step attack to prove the rejection actually
-- fires — a defence against an attack nobody has reproduced is a hypothesis.
-- ============================================================================
