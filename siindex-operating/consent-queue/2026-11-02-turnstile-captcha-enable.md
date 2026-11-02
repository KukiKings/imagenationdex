# Consent Decision: Enable Turnstile CAPTCHA on Supabase Auth (SAMPLE ENTRY)

Sample entry reconstructed from the 2026-11-02 session. Fields marked "not recorded" were not captured at the time.

- **Decision ID:** 2026-11-02-001
- **UTC timestamp:** 2026-11-02T07:19:00Z (18:19 Melbourne time, minute precision)
- **Agent run ID:** session_01R7MFwq8m75fGcSzYWCcuV9
- **Hash of output shown to Arthur:** not recorded
- **Approver identity:** Arthur John Henry (AJ), answering in chat
- **Decision with short rationale:** Yes. Run both tests and report the responses verbatim. Rationale: closes the open phone-OTP send gap.
- **Seconds taken to decide:** about 60 (approximate, from chat timestamps)

## Proposed change

Turn on CAPTCHA protection in Supabase Auth (Attack Protection) using Cloudflare Turnstile, with the Turnstile secret saved as the CAPTCHA secret.

## Before and after

| Setting | Before | After |
|---|---|---|
| Enable Captcha protection | off | on |
| Captcha provider | none | Turnstile by Cloudflare |
| Captcha secret | unset | set (35 characters, not recorded here) |

## Read-back after execution

OTP request with no token: 400 captcha_failed, "captcha protection: request disallowed (no captcha_token found)". OTP request with a valid Turnstile token: 200, empty body.
