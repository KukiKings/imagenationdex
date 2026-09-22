# Tier-0 start (2026-09-22)

**What this is:** email OTP → signed-in user → `citizens` row (`tier0_info`, `status=preview`).

**What this is not:** wallet, payments, domain issuance, token, KYC selfie.

## AJ must do in Supabase (this session cannot)

1. Run SQL: `supabase/migrations/20260922_tier0_citizens_v1.sql`
2. Auth → Providers → Email → enable magic link / OTP
3. Auth → URL config: add `https://imagenationdex.com/tier0.html` and `https://imagenationdex.com/tier0`
4. Confirm public anon key is the same one already on `/waitlist.html`
5. Test: you sign in once → Table Editor → `citizens` has your row

## Public URL

- `/tier0.html` (route `/tier0` after Vercel rewrite)

## Children

If date of birth is under 18, `guardian_email` is required. Parent holds recovery doctrine until 18. No keys are created in this slice.

## Next slice (not this one)

Signed-in call to `reserve_domain()` — reservation only, still not issuance.
