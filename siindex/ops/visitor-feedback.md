# Visitor feedback aggregation (Task 4)

**Status:** dual-write live on client; remote requires migration + Edge Function deploy (AJ/ops).

## What visitors see
Thumbs on SIINDEX replies (homepage / presence). Always stored on-device first.

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

## Deploy (AJ / ops)
1. Run SQL: `supabase/migrations/20260816_siindex_visitor_feedback_v1.sql`
2. Deploy function:
   ```bash
   supabase functions deploy siindex-visitor-feedback --project-ref <ref>
   ```
3. Confirm `security_events` table exists (already used by voice TTS).

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
