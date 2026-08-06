# IN$DEX Tier 0 identity activation

Status: implemented on an isolated branch. Not deployed.

## What this slice delivers

- Real SMS OTP through Supabase Auth and the configured Twilio provider.
- Explicit phone-use consent before an SMS is requested.
- E.164 phone normalization for the supported launch countries.
- A verified Supabase Auth session before identity issuance.
- Separate display name and unique `name.IN$DEX` handle.
- Atomic, server-side identity issuance.
- Case-insensitive collision checks against new claims and legacy citizen records.
- Protected system and brand names.
- An append-only issuance receipt visible only to its authenticated citizen.
- No wallet, token, balance, public DNS name or blockchain asset created by Tier 0.

## Required activation order

1. Back up the production database and record the current Auth configuration.
2. Review legacy duplicate phone and `web3_domain` rows.
3. Apply `supabase/migrations/20260805_tier0_identity_issuance.sql` to a non-production Supabase branch or test project.
4. Confirm the new RPC grants and RLS policies. Verify `get_citizen_by_phone(text)` is not executable by `public`, `anon` or `authenticated`.
5. Confirm Twilio sender coverage for every supported country.
6. Set SMS rate limits, OTP expiry and a monthly spend ceiling in Supabase Auth.
7. Configure CAPTCHA before any public opening. Do not place CAPTCHA or Twilio secrets in this repository.
8. Deploy the branch to a protected preview.
9. Run the acceptance cases below with designated test phone numbers.
10. Review receipts and database rows before considering a production release.

## Acceptance cases

| Case | Expected result |
|---|---|
| Valid phone and consent | One real SMS request is accepted |
| Invalid local number | No SMS request is sent |
| Missing consent | Send button stays disabled |
| Incorrect or expired OTP | No authenticated identity is issued |
| Valid OTP | Authenticated Tier 0 session is created |
| Available handle | One identity and one receipt are created atomically |
| Two simultaneous claims for one handle | One succeeds and one returns `HANDLE_TAKEN` |
| Reserved handle | Issuance is rejected |
| Repeated submission by the same citizen | Existing identity is returned without a duplicate |
| Legacy phone-lookup RPC | Execution is denied for anonymous and authenticated browser roles |
| Legacy unverified onboarding route | Redirects to the canonical OTP flow |
| Lost network during issuance | No success message appears without a server response |
| Returning verified citizen | Existing identity is shown without reissuing it |

## Evidence to retain

- Migration version and database backup identifier.
- Supabase Auth settings with secrets redacted.
- Test phone country, carrier and delivery time.
- OTP success, expiry, resend and rate-limit results.
- Identity claim and receipt IDs with phone numbers redacted.
- Collision, reserved-name and retry results.
- Mobile, keyboard and screen-reader results.

Real phone numbers, OTP values, Twilio credentials and Supabase service-role keys must never be committed or included in screenshots.
