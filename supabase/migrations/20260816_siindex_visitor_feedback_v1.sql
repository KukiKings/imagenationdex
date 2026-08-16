-- SIINDEX Visitor Feedback v1
-- Aggregate thumbs beyond localStorage. No accounts. No PII required.
-- Writes only via Edge Function (service role). Anon cannot SELECT.

create table if not exists public.visitor_feedback (
  id uuid primary key default gen_random_uuid(),
  vote text not null check (vote in ('up', 'down')),
  answer_snippet text not null default '',
  page_path text not null default '/',
  knowledge_version text,
  source text not null default 'presence-thumbs',
  visitor_hash text not null,
  correlation_id text,
  user_agent_hash text,
  created_at timestamptz not null default now()
);

create index if not exists visitor_feedback_created_idx
  on public.visitor_feedback (created_at desc);

create index if not exists visitor_feedback_vote_day_idx
  on public.visitor_feedback (vote, created_at desc);

create index if not exists visitor_feedback_hash_created_idx
  on public.visitor_feedback (visitor_hash, created_at desc);

alter table public.visitor_feedback enable row level security;

-- No policies for anon/authenticated: public cannot read or write via Data API.
-- Edge Function uses service role (bypasses RLS).

comment on table public.visitor_feedback is
  'Visitor Mode thumbs (up/down). Aggregated for SIINDEX ops. Not a live account system.';

-- Optional daily rollup view (service role / dashboard only)
create or replace view public.visitor_feedback_daily as
select
  date_trunc('day', created_at at time zone 'UTC') as day_utc,
  vote,
  count(*)::int as n,
  count(distinct visitor_hash)::int as distinct_visitors
from public.visitor_feedback
group by 1, 2
order by 1 desc, 2;

comment on view public.visitor_feedback_daily is
  'Daily up/down counts for AJ/ops review. Query with service role only.';
