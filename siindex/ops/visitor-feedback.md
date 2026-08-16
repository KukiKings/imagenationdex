# Visitor feedback aggregation (Task 4)

**Status (2026-08-16):**
- Client dual-write **1.1.1** live (localStorage always; remote best-effort with `Authorization: Bearer` + `apikey`).
- Edge Function `siindex-visitor-feedback` **deployed** (origin allowlist, 30/hr hash rate limit via `security_events`).
- **AJ action required:** apply migration `supabase/migrations/20260816_siindex_visitor_feedback_v1.sql` (table missing → remote returns `store_unavailable`). Set GitHub secret `SUPABASE_DB_PASSWORD` for future auto-push, or paste SQL into Supabase SQL Editor once.

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

## Deploy (AJ / ops)
1. **Required now:** Run SQL in Supabase SQL Editor:
   `supabase/migrations/20260816_siindex_visitor_feedback_v1.sql`
2. Function already deployed via Actions (workflow includes `siindex-visitor-feedback`).
3. Optional: set `SUPABASE_DB_PASSWORD` GitHub secret so future `db push` runs automatically.
4. Confirm `security_events` table exists (already used by voice TTS).

## Verify after migration
```bash
# From browser origin imagenationdex.com (or curl with Origin + Bearer anon):
# Expect {"ok":true,"stored":"remote",...}
```

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
