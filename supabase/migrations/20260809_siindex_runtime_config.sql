-- SIINDEX runtime config (voice identity Path A)
create table if not exists public.siindex_runtime_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

comment on table public.siindex_runtime_config is
  'Non-secret runtime switches for SIINDEX website (e.g. elevenlabs_voice_id from intro clone)';

alter table public.siindex_runtime_config enable row level security;

-- No public policies: only service role (edge functions) reads/writes.
