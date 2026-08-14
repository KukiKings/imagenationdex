-- SIINDEX Agent Bus v1 (Stage 1)
-- Internal M2M only. No public visitor access.
-- AJ gate: publish, contact_citizens, move_funds, issue_identity, legal_commit → needs_aj

do $$ begin
  create type public.agent_task_status as enum (
    'queued','running','awaiting_next','needs_aj','blocked','done','failed','expired'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.agent_data_class as enum (
    'internal_draft','internal_ops','campaign_approved','public_candidate','restricted'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.campaign_mandates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  audience_bounds jsonb not null default '{}'::jsonb,
  wording_bounds jsonb not null default '{}'::jsonb,
  time_window_start timestamptz,
  time_window_end timestamptz,
  allowed_actions text[] not null default '{}',
  prohibited_actions text[] not null default array[
    'publish','contact_citizens','move_funds','issue_identity','legal_commit'
  ],
  active boolean not null default false,
  authorized_by text,
  authorized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_tasks (
  id text primary key,
  parent_task_id text references public.agent_tasks(id) on delete set null,
  directed_by text not null default 'SIINDEX',
  type text not null,
  priority int not null default 10,
  status public.agent_task_status not null default 'queued',
  chain text[] not null default '{}',
  step_index int not null default 0,
  current_agent text,
  payload jsonb not null default '{}'::jsonb,
  envelope jsonb not null default '{}'::jsonb,
  requires_aj_for text[] not null default array[
    'publish','contact_citizens','move_funds','issue_identity','legal_commit',
    'ops.deploy','ops.secret_write'
  ],
  aj_authorized boolean not null default false,
  campaign_mandate_id uuid references public.campaign_mandates(id) on delete set null,
  visibility_timeout_at timestamptz,
  claimed_by text,
  claim_token uuid,
  retry_count int not null default 0,
  retry_limit int not null default 3,
  cost_limit_usd numeric(10,4) default 2.0000,
  cost_spent_usd numeric(10,4) not null default 0,
  blocked_reason text,
  gate text,
  last_result jsonb,
  error text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_tasks_status_priority_idx
  on public.agent_tasks (status, priority, created_at);
create index if not exists agent_tasks_claim_idx
  on public.agent_tasks (status, visibility_timeout_at)
  where status in ('queued', 'awaiting_next', 'running');

create table if not exists public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  task_id text not null references public.agent_tasks(id) on delete cascade,
  parent_task_id text,
  sender text not null,
  recipient text not null,
  message_type text not null default 'handoff',
  goal text not null,
  source_refs text[] not null default '{}',
  allowed_actions text[] not null default '{}',
  prohibited_actions text[] not null default array[
    'publish','contact_citizens','move_funds','issue_identity','legal_commit'
  ],
  output_format text,
  data_classification public.agent_data_class not null default 'internal_draft',
  approval_class text,
  evidence_required boolean not null default true,
  deadline timestamptz,
  cost_limit_usd numeric(10,4),
  retry_limit int default 3,
  expires_at timestamptz,
  nonce text not null,
  body jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (task_id, nonce)
);

create index if not exists agent_messages_task_idx on public.agent_messages (task_id, created_at);
create index if not exists agent_messages_recipient_idx on public.agent_messages (recipient, created_at desc);

create table if not exists public.agent_evidence (
  id uuid primary key default gen_random_uuid(),
  task_id text not null references public.agent_tasks(id) on delete cascade,
  agent text not null,
  kind text not null default 'artifact',
  summary text,
  source_refs text[] not null default '{}',
  content_hash text,
  storage_path text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists agent_evidence_task_idx on public.agent_evidence (task_id, created_at);

create table if not exists public.agent_audit (
  id uuid primary key default gen_random_uuid(),
  task_id text,
  agent text,
  action text not null,
  ok boolean not null default true,
  detail jsonb not null default '{}'::jsonb,
  correlation_id text,
  created_at timestamptz not null default now()
);

create index if not exists agent_audit_task_idx on public.agent_audit (task_id, created_at desc);
create index if not exists agent_audit_created_idx on public.agent_audit (created_at desc);

create or replace function public.siindex_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists agent_tasks_set_updated_at on public.agent_tasks;
create trigger agent_tasks_set_updated_at
  before update on public.agent_tasks
  for each row execute function public.siindex_set_updated_at();

drop trigger if exists campaign_mandates_set_updated_at on public.campaign_mandates;
create trigger campaign_mandates_set_updated_at
  before update on public.campaign_mandates
  for each row execute function public.siindex_set_updated_at();

alter table public.campaign_mandates enable row level security;
alter table public.agent_tasks enable row level security;
alter table public.agent_messages enable row level security;
alter table public.agent_evidence enable row level security;
alter table public.agent_audit enable row level security;

insert into public.agent_tasks (
  id, type, priority, status, chain, payload, envelope, expires_at
) values (
  'task-stage1-demo-001',
  'stage1-demo-draft-chain',
  1,
  'queued',
  array['knowledge','policy_gate','evidence','verify'],
  jsonb_build_object(
    'goal', 'Stage 1 demo: knowledge → policy_gate → evidence → verify (draft only)',
    'note', 'No publish. No citizen contact. Internal collaboration proof.'
  ),
  jsonb_build_object(
    'allowed_actions', jsonb_build_array('read_knowledge','check_policy','write_evidence','verify_draft'),
    'prohibited_actions', jsonb_build_array('publish','contact_citizens','move_funds','issue_identity','legal_commit'),
    'data_classification', 'internal_draft',
    'evidence_required', true
  ),
  now() + interval '7 days'
) on conflict (id) do nothing;
