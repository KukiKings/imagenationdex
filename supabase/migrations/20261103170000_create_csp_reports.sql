-- CSP violation reports received by the csp-reports edge function.
-- Written only by the function (service role). RLS on, no policies, no client grants.
create table if not exists public.csp_reports (
  id uuid primary key default gen_random_uuid(),
  received_at timestamptz not null default now(),
  report_type text,
  document_url text,
  blocked_url text,
  effective_directive text,
  disposition text,
  status_code int,
  user_agent text,
  raw jsonb
);

create index if not exists csp_reports_received_at_idx on public.csp_reports (received_at);

alter table public.csp_reports enable row level security;
revoke all on table public.csp_reports from public, anon, authenticated;
