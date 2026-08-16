# Visitor feedback aggregation (Task 4)

**Status (2026-08-16): 100% complete.**
- Client dual-write **1.1.1** live (localStorage always; remote best-effort with `Authorization: Bearer` + `apikey`).
- Edge Function `siindex-visitor-feedback` **deployed** (origin allowlist, 30/hr hash rate limit via `security_events`).
- Table `public.visitor_feedback` + view `visitor_feedback_daily` **live** (RLS on, zero policies = default-deny for anon).
- Live probe returns `{"ok":true,"stored":"remote"}`.

## What visitors see
Thumbs on SIINDEX replies (homepage / presence). Always stored on-device first. UI never breaks if remote is down.

## Device buffer
- Key: `localStorage.siindex_feedback_v1`
- Shape: `{ t, vote: "up"|"down", text, page, knowledge_version, synced }`
- Cap: last 100 entries

## Remote store
- Table: `public.visitor_feedback`
- Write path: Edge Function `siindex-visitor-feedback` (service role)
- Public Data API: **no** anon SELECT/INSERT (RLS on, no policies)
- Rate limit: 30 votes / visitor hash / hour (`security_events` zone `siindex_visitor_feedback`)
- Origin allowlist: imagenationdex.com + Vercel previews + localhost

## Ops queries (service role / SQL editor)
```sql
-- Totals
select vote, count(*) from public.visitor_feedback group by vote;

-- Daily
select * from public.visitor_feedback_daily limit 30;

-- Recent downs (improve answers)
select created_at, page_path, knowledge_version, left(answer_snippet, 120)
from public.visitor_feedback
where vote = 'down'
order by created_at desc
limit 50;
```

## Boundaries
- Not an account system
- No email, no identity issuance
- Snippet max 280 chars (answer text only)
- AJ gate still applies for any publish of feedback-derived content
