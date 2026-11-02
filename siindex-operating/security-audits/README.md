# Security Audits

## 2026-11-02: Auth and OTP audit

Audit of the magic-link and OTP flow (PKCE bypass and token-stealing paths). Findings and status as of 2026-11-02, end of day.

| # | Finding | Where | Status |
|---|---|---|---|
| 1 | Open phone OTP sends with no CAPTCHA, reachable by anyone on seven public pages | join.html, quickstart-onboarding.html, grid-account-onboarding.html, biometric-kyc.html, account-recovery.html (phone); tier0.html, onboard.html (email) | **Fixed.** Shared indx-captcha.js (Cloudflare Turnstile) sends a captchaToken on every signInWithOtp. Supabase CAPTCHA is on and rejects tokenless requests (tested: 400 captcha_failed without a token, 200 with one). Tested by direct API call and the onboard page, not by clicking through each of the other six pages. Commits 34a354b to b3f4a69, 4449441, 5f1d069. |
| 1a | Pump surface on SMS and OTP sends | Supabase Auth rate limits | **Mitigated.** SMS sent 30 to 10 per hour (project-wide). OTP 30 to 3 per 5 minutes. Not per-number caps. |
| 2 | account-recovery phone lookup calls get_citizen_by_phone with the anon key, which may let anyone check whether a number is registered | account-recovery.html (rpc call) | **Open.** Function grants not yet read. Planned fix: move the lookup behind an edge function with service-role access. |
| 3 | PKCE missing on every OTP client except onboard | tier0.html, join.html, quickstart-onboarding.html, grid-account-onboarding.html, biometric-kyc.html, account-recovery.html (createClient has no flowType) | **Open.** Only onboard.html sets flowType: 'pkce'. |
| 4 | token_hash redemption took the type parameter from the URL | onboard.html (consumeLink) | **Fixed.** type is allow-listed to email or phone, anything else is rejected without calling verifyOtp. Commit a376e66. Note: a custom template emitting type=signup would now be rejected. Supabase email templates are locked to defaults (no custom SMTP). |
| 5 | shouldCreateUser true on public email sends | onboard.html, tier0.html | **Open, partly mitigated.** CAPTCHA and the rate limits now cover these sends. The flag itself is unchanged. |
| 6 | No Content-Security-Policy header | vercel.json | **Open.** Only nosniff, X-Frame-Options and Referrer-Policy are set. Turnstile needs challenges.cloudflare.com allowed when a CSP is added. |
| 7 | Session stored in localStorage (Supabase default key sb-<project>-auth-token), readable by any XSS | all createClient pages | **Open.** persistSession is on by default. No CSP yet (item 6). |

## Not checked

- Supabase Auth redirect allow-list (URL Configuration).
- Grants on get_citizen_by_phone and related RPCs.
- create_user:false on phone OTP calls (not applied).
- Per-number SMS limits (Supabase exposes project-wide caps only).

## Related

- ../SUB-AGENT-CONSENT-MODEL.md (changes to these settings need Arthur's consent)
- ../consent-queue/ (dated consent entries)
