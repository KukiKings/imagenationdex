-- SIINDEX private-test swarm control plane
-- This migration stores manifests, routed work, approvals and append-only receipts.
-- It contains no private keys and grants no mainnet, signing or publication authority.

begin;

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.siindex_agent_manifests (
  agent_id text primary key,
  role text not null,
  version integer not null default 1,
  capabilities text[] not null,
  networks text[] not null default array['sandbox', 'solana-devnet']::text[],
  prohibited text[] not null,
  owns_keys boolean not null default false,
  status text not null default 'private_testing',
  updated_at timestamptz not null default now(),
  constraint siindex_agent_id_check check (
    agent_id in ('siindex', 'citizen', 'payments', 'membership', 'media', 'scheduling', 'fulfilment', 'marketing', 'analytics', 'reputation')
  ),
  constraint siindex_agent_no_keys check (owns_keys = false),
  constraint siindex_agent_status_check check (status in ('private_testing', 'paused', 'revoked')),
  constraint siindex_agent_network_check check (not ('solana-mainnet' = any(networks)))
);

alter table public.siindex_agent_manifests enable row level security;
revoke all on table public.siindex_agent_manifests from anon, authenticated;
grant select on table public.siindex_agent_manifests to authenticated;

drop policy if exists siindex_manifests_authenticated_read on public.siindex_agent_manifests;
create policy siindex_manifests_authenticated_read
on public.siindex_agent_manifests
for select to authenticated
using (true);

insert into public.siindex_agent_manifests (agent_id, role, capabilities, prohibited)
values
  ('siindex', 'Orchestrates bounded workflows and records decisions', array['swarm.route','swarm.pause','swarm.resume','swarm.status.read'], array['wallet.export','wallet.sign.unattended','solana.trade','solana.lend','solana.borrow','solana.bridge','solana.airdrop','solana.token.launch','treasury.rebalance','governance.vote.execute']),
  ('citizen', 'Prepares onboarding and verified identity work', array['citizen.onboarding.prepare','citizen.phone.verify','citizen.identity.issue','citizen.recovery.prepare'], array['wallet.export','wallet.sign.unattended','solana.trade','solana.lend','solana.borrow','solana.bridge','solana.airdrop','solana.token.launch','treasury.rebalance','governance.vote.execute']),
  ('payments', 'Prepares payment requests and verifies receipts', array['payments.solana_pay.prepare','payments.receipt.verify','payments.x402.prepare','payments.x402.execute'], array['wallet.export','wallet.sign.unattended','solana.trade','solana.lend','solana.borrow','solana.bridge','solana.airdrop','solana.token.launch','treasury.rebalance','governance.vote.execute']),
  ('membership', 'Prepares tiers and renewal decisions', array['membership.activate.prepare','membership.renewal.evaluate','membership.tier.update.prepare'], array['wallet.export','wallet.sign.unattended','solana.trade','solana.lend','solana.borrow','solana.bridge','solana.airdrop','solana.token.launch','treasury.rebalance','governance.vote.execute']),
  ('media', 'Creates consent-bound private media drafts', array['media.avatar.profile.prepare','media.video.render.draft','media.video.publish'], array['wallet.export','wallet.sign.unattended','solana.trade','solana.lend','solana.borrow','solana.bridge','solana.airdrop','solana.token.launch','treasury.rebalance','governance.vote.execute']),
  ('scheduling', 'Prepares bookings and reminders', array['scheduling.availability.read','scheduling.booking.prepare','scheduling.reminder.prepare'], array['wallet.export','wallet.sign.unattended','solana.trade','solana.lend','solana.borrow','solana.bridge','solana.airdrop','solana.token.launch','treasury.rebalance','governance.vote.execute']),
  ('fulfilment', 'Prepares merchant fulfilment work', array['fulfilment.order.prepare','fulfilment.delivery.update.prepare','fulfilment.dispute.hold'], array['wallet.export','wallet.sign.unattended','solana.trade','solana.lend','solana.borrow','solana.bridge','solana.airdrop','solana.token.launch','treasury.rebalance','governance.vote.execute']),
  ('marketing', 'Prepares truthful campaign drafts', array['marketing.campaign.prepare','marketing.content.prepare','marketing.distribution.publish'], array['wallet.export','wallet.sign.unattended','solana.trade','solana.lend','solana.borrow','solana.bridge','solana.airdrop','solana.token.launch','treasury.rebalance','governance.vote.execute']),
  ('analytics', 'Reads evidence and prepares analysis', array['analytics.metrics.read','analytics.proposal.assess','analytics.report.prepare'], array['wallet.export','wallet.sign.unattended','solana.trade','solana.lend','solana.borrow','solana.bridge','solana.airdrop','solana.token.launch','treasury.rebalance','governance.vote.execute']),
  ('reputation', 'Prepares evidence-based trust updates', array['reputation.evidence.read','reputation.score.prepare','reputation.flag.prepare'], array['wallet.export','wallet.sign.unattended','solana.trade','solana.lend','solana.borrow','solana.bridge','solana.airdrop','solana.token.launch','treasury.rebalance','governance.vote.execute'])
on conflict (agent_id) do update set
  role = excluded.role,
  capabilities = excluded.capabilities,
  prohibited = excluded.prohibited,
  version = public.siindex_agent_manifests.version + 1,
  updated_at = now();

create table if not exists public.siindex_swarm_runs (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  status text not null default 'prepared',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint siindex_swarm_event_check check (
    event_type in ('citizen.signup','governance.proposal','commerce.payment_requested','commerce.payment_received','membership.renewal','media.welcome_requested')
  ),
  constraint siindex_swarm_run_status_check check (status in ('prepared','awaiting_approval','denied','completed','cancelled')),
  constraint siindex_swarm_data_size check (octet_length(data::text) <= 32768)
);

create table if not exists public.siindex_swarm_tasks (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.siindex_swarm_runs(id) on delete cascade,
  agent_id text not null references public.siindex_agent_manifests(agent_id),
  capability text not null,
  mode text not null default 'prepare',
  network text not null default 'sandbox',
  status text not null,
  required_approval text,
  idempotency_key text not null unique,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint siindex_swarm_task_mode_check check (mode in ('read','prepare','execute')),
  constraint siindex_swarm_task_network_check check (network in ('sandbox','solana-devnet')),
  constraint siindex_swarm_task_status_check check (status in ('prepared','awaiting_approval','denied','completed','cancelled')),
  constraint siindex_swarm_task_detail_size check (octet_length(detail::text) <= 16384)
);

create table if not exists public.siindex_swarm_approvals (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.siindex_swarm_runs(id) on delete cascade,
  subject_id uuid not null references auth.users(id) on delete cascade,
  approved_by uuid not null references auth.users(id) on delete cascade,
  approval_kind text not null,
  evidence_hash text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint siindex_approval_kind_check check (
    approval_kind in ('citizen-consent','subject-consent','publication-approval','payment-approval','chain-registration-approval','governance-execution-approval')
  ),
  constraint siindex_approval_hash_check check (evidence_hash ~ '^[a-f0-9]{64}$'),
  constraint siindex_approval_expiry_check check (expires_at > created_at)
);

create table if not exists public.siindex_media_consents (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'heygen',
  provider_profile_id text,
  consent_evidence_hash text not null,
  permitted_uses text[] not null default array['private-draft']::text[],
  status text not null default 'pending_provider_verification',
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint siindex_media_provider_check check (provider = 'heygen'),
  constraint siindex_media_consent_hash_check check (consent_evidence_hash ~ '^[a-f0-9]{64}$'),
  constraint siindex_media_consent_status_check check (status in ('pending_provider_verification','active','revoked','expired')),
  constraint siindex_media_private_default check (permitted_uses <@ array['private-draft','approved-publication']::text[])
);

create table if not exists public.siindex_swarm_receipts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.siindex_swarm_runs(id) on delete cascade,
  task_id uuid references public.siindex_swarm_tasks(id) on delete set null,
  event_type text not null,
  status text not null,
  detail jsonb not null default '{}'::jsonb,
  previous_hash text,
  receipt_hash text not null unique,
  created_at timestamptz not null default now(),
  constraint siindex_receipt_status_check check (status in ('prepared','awaiting_approval','denied','completed','cancelled')),
  constraint siindex_receipt_hash_check check (receipt_hash ~ '^[a-f0-9]{64}$'),
  constraint siindex_receipt_previous_hash_check check (previous_hash is null or previous_hash ~ '^[a-f0-9]{64}$'),
  constraint siindex_receipt_detail_size check (octet_length(detail::text) <= 16384)
);

alter table public.siindex_swarm_runs enable row level security;
alter table public.siindex_swarm_tasks enable row level security;
alter table public.siindex_swarm_approvals enable row level security;
alter table public.siindex_media_consents enable row level security;
alter table public.siindex_swarm_receipts enable row level security;

revoke all on table public.siindex_swarm_runs, public.siindex_swarm_tasks, public.siindex_swarm_approvals, public.siindex_media_consents, public.siindex_swarm_receipts from anon, authenticated;
grant select on table public.siindex_swarm_runs, public.siindex_swarm_tasks, public.siindex_swarm_approvals, public.siindex_media_consents, public.siindex_swarm_receipts to authenticated;

drop policy if exists siindex_runs_read_own on public.siindex_swarm_runs;
create policy siindex_runs_read_own on public.siindex_swarm_runs for select to authenticated
using ((select auth.uid()) = requested_by);

drop policy if exists siindex_tasks_read_own on public.siindex_swarm_tasks;
create policy siindex_tasks_read_own on public.siindex_swarm_tasks for select to authenticated
using (exists (
  select 1 from public.siindex_swarm_runs r
  where r.id = run_id and r.requested_by = (select auth.uid())
));

drop policy if exists siindex_approvals_read_own on public.siindex_swarm_approvals;
create policy siindex_approvals_read_own on public.siindex_swarm_approvals for select to authenticated
using ((select auth.uid()) = subject_id or (select auth.uid()) = approved_by);

drop policy if exists siindex_media_consents_read_own on public.siindex_media_consents;
create policy siindex_media_consents_read_own on public.siindex_media_consents for select to authenticated
using ((select auth.uid()) = subject_id);

drop policy if exists siindex_receipts_read_own on public.siindex_swarm_receipts;
create policy siindex_receipts_read_own on public.siindex_swarm_receipts for select to authenticated
using (exists (
  select 1 from public.siindex_swarm_runs r
  where r.id = run_id and r.requested_by = (select auth.uid())
));

create or replace function public.prevent_siindex_receipt_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  raise exception using errcode = '42501', message = 'SIINDEX_RECEIPTS_ARE_APPEND_ONLY';
end;
$$;

drop trigger if exists siindex_receipts_no_update on public.siindex_swarm_receipts;
create trigger siindex_receipts_no_update
before update or delete on public.siindex_swarm_receipts
for each row execute function public.prevent_siindex_receipt_mutation();

create or replace function public.enqueue_siindex_swarm_event(
  p_event_type text,
  p_subject_id uuid,
  p_data jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_run_id uuid;
  v_waiting boolean := false;
  v_task_id uuid;
  v_index integer := 0;
  v_task record;
  v_previous_hash text;
  v_receipt_hash text;
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;
  if p_subject_id is distinct from v_uid then
    raise exception using errcode = '42501', message = 'CROSS_SUBJECT_ROUTING_DENIED';
  end if;
  if p_event_type not in ('citizen.signup','governance.proposal','commerce.payment_requested','commerce.payment_received','membership.renewal','media.welcome_requested') then
    raise exception using errcode = '22023', message = 'UNSUPPORTED_SWARM_EVENT';
  end if;
  if octet_length(coalesce(p_data, '{}'::jsonb)::text) > 32768 then
    raise exception using errcode = '22001', message = 'EVENT_DATA_TOO_LARGE';
  end if;
  if coalesce(p_data, '{}'::jsonb)::text ~* '(private[_ -]?key|recovery words|password|secret key)' then
    raise exception using errcode = '22023', message = 'SENSITIVE_DATA_REJECTED';
  end if;

  insert into public.siindex_swarm_runs (requested_by, subject_id, event_type, data)
  values (v_uid, p_subject_id, p_event_type, coalesce(p_data, '{}'::jsonb))
  returning id into v_run_id;

  for v_task in
    select * from (
      select 'citizen.signup'::text event_type, 'citizen'::text agent_id, 'citizen.onboarding.prepare'::text capability, 'prepare'::text mode, 'sandbox'::text network, null::text approval, 1 sort_order
      union all select 'citizen.signup','membership','membership.activate.prepare','prepare','sandbox',null,2
      union all select 'citizen.signup','media','media.video.render.draft','prepare','sandbox','subject-consent',3
      union all select 'governance.proposal','analytics','analytics.proposal.assess','read','sandbox',null,1
      union all select 'governance.proposal','reputation','reputation.evidence.read','read','sandbox',null,2
      union all select 'governance.proposal','media','media.video.render.draft','prepare','sandbox','subject-consent',3
      union all select 'commerce.payment_requested','payments','payments.solana_pay.prepare','prepare','sandbox',null,1
      union all select 'commerce.payment_received','payments','payments.receipt.verify','read','sandbox',null,1
      union all select 'commerce.payment_received','fulfilment','fulfilment.order.prepare','prepare','sandbox',null,2
      union all select 'commerce.payment_received','reputation','reputation.score.prepare','prepare','sandbox',null,3
      union all select 'membership.renewal','membership','membership.renewal.evaluate','read','sandbox',null,1
      union all select 'membership.renewal','payments','payments.x402.prepare','prepare','solana-devnet',null,2
      union all select 'media.welcome_requested','media','media.video.render.draft','prepare','sandbox','subject-consent',1
    ) routes
    where routes.event_type = p_event_type
    order by sort_order
  loop
    v_index := v_index + 1;
    v_waiting := v_waiting or v_task.approval is not null;
    insert into public.siindex_swarm_tasks (
      run_id, agent_id, capability, mode, network, status, required_approval, idempotency_key, detail
    ) values (
      v_run_id,
      v_task.agent_id,
      v_task.capability,
      v_task.mode,
      v_task.network,
      case when v_task.approval is null then 'prepared' else 'awaiting_approval' end,
      v_task.approval,
      v_run_id::text || ':' || v_index::text || ':' || v_task.agent_id || ':' || v_task.capability,
      jsonb_build_object('private_test', true, 'real_world_effect', false)
    ) returning id into v_task_id;

    select receipt_hash into v_previous_hash
    from public.siindex_swarm_receipts
    where run_id = v_run_id
    order by created_at desc, id desc
    limit 1;

    v_receipt_hash := encode(extensions.digest(
      v_run_id::text || '|' || v_task_id::text || '|' || p_event_type || '|' || v_task.capability || '|' || coalesce(v_previous_hash, ''),
      'sha256'
    ), 'hex');

    insert into public.siindex_swarm_receipts (
      run_id, task_id, event_type, status, detail, previous_hash, receipt_hash
    ) values (
      v_run_id,
      v_task_id,
      p_event_type,
      case when v_task.approval is null then 'prepared' else 'awaiting_approval' end,
      jsonb_build_object('agent_id', v_task.agent_id, 'capability', v_task.capability, 'network', v_task.network),
      v_previous_hash,
      v_receipt_hash
    );
  end loop;

  update public.siindex_swarm_runs
  set status = case when v_waiting then 'awaiting_approval' else 'prepared' end
  where id = v_run_id;

  return jsonb_build_object(
    'ok', true,
    'run_id', v_run_id,
    'status', case when v_waiting then 'awaiting_approval' else 'prepared' end,
    'task_count', v_index,
    'private_test', true,
    'real_world_effect', false
  );
end;
$$;

revoke all on function public.enqueue_siindex_swarm_event(text, uuid, jsonb) from public, anon;
grant execute on function public.enqueue_siindex_swarm_event(text, uuid, jsonb) to authenticated;

create or replace function public.approve_siindex_swarm_task(
  p_run_id uuid,
  p_approval_kind text,
  p_evidence_hash text,
  p_expires_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_subject_id uuid;
  v_updated integer;
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;
  select subject_id into v_subject_id
  from public.siindex_swarm_runs
  where id = p_run_id and requested_by = v_uid;
  if v_subject_id is null then
    raise exception using errcode = '42501', message = 'RUN_NOT_OWNED';
  end if;
  if p_approval_kind not in ('citizen-consent','subject-consent','publication-approval','payment-approval','chain-registration-approval','governance-execution-approval') then
    raise exception using errcode = '22023', message = 'INVALID_APPROVAL_KIND';
  end if;
  if p_evidence_hash !~ '^[a-f0-9]{64}$' or p_expires_at <= now() then
    raise exception using errcode = '22023', message = 'INVALID_APPROVAL_EVIDENCE';
  end if;

  insert into public.siindex_swarm_approvals (
    run_id, subject_id, approved_by, approval_kind, evidence_hash, expires_at
  ) values (p_run_id, v_subject_id, v_uid, p_approval_kind, p_evidence_hash, p_expires_at);

  update public.siindex_swarm_tasks
  set status = 'prepared', updated_at = now()
  where run_id = p_run_id
    and status = 'awaiting_approval'
    and required_approval = p_approval_kind;
  get diagnostics v_updated = row_count;

  if not exists (select 1 from public.siindex_swarm_tasks where run_id = p_run_id and status = 'awaiting_approval') then
    update public.siindex_swarm_runs set status = 'prepared' where id = p_run_id;
  end if;

  return jsonb_build_object('ok', true, 'run_id', p_run_id, 'tasks_released', v_updated);
end;
$$;

revoke all on function public.approve_siindex_swarm_task(uuid, text, text, timestamptz) from public, anon;
grant execute on function public.approve_siindex_swarm_task(uuid, text, text, timestamptz) to authenticated;

comment on table public.siindex_agent_manifests is 'Canonical deny-by-default capability manifests. No agent owns keys.';
comment on table public.siindex_swarm_receipts is 'Append-only private-test action evidence. Never stores secrets or private keys.';
comment on function public.enqueue_siindex_swarm_event(text, uuid, jsonb) is 'Routes authenticated private-test events into bounded SIINDEX tasks. It does not execute external actions.';

commit;
