# IN$DEX citizen accounts and recovery activation

Status: implemented on an isolated branch. Not deployed and not migrated.

## What this slice delivers

- Persistent Supabase Auth sessions with automatic token refresh.
- Recovery for an existing citizen account through its verified phone number.
- No new account creation from the recovery screen.
- Provider-level sign-out for other sessions before recovery is reported complete.
- Citizen-visible device evidence without browser fingerprinting.
- Local, other-session and global sign-out controls.
- Recovery and session-security receipts protected by row level security.
- Existing account and card security holds remain active.
- No wallet, token, payment, balance or identity record is changed by recovery.

## Security model

Supabase Auth owns access tokens, refresh tokens and session revocation. IN$DEX does not copy those secrets into citizen tables.

The device registry is evidence only. It stores a random browser identifier, a short browser label, a device family, a shared-device flag and verification times. It stores no OTP, raw phone number, access token, refresh token, IP address or raw user-agent string.

Individual remote-device sign-out is not claimed because the current client provider supports local, other-session and global scopes, not revocation of one selected refresh token. The interface offers only actions that the provider can enforce.

Supabase session revocation prevents a revoked session from refreshing. An access token that was already issued can remain valid until its configured expiry. Keep the access-token lifetime short and use the separate account security hold for an immediate server-side block on consequential actions.

## Required activation order

1. Back up the target database and record the current Supabase Auth configuration.
2. Confirm `20260805_tier0_identity_issuance.sql` has already been reviewed and applied in the same test environment.
3. Apply `supabase/migrations/20260806_citizen_accounts_recovery.sql` to a non-production Supabase branch or test project.
4. Confirm RLS is enabled on both new tables.
5. Confirm `anon` cannot execute any new account RPC.
6. Confirm only authenticated citizens can read their own device and receipt rows.
7. Review SMS expiry, resend limits, CAPTCHA, access-token lifetime and abuse protections.
8. Deploy the code to a protected preview.
9. Run every acceptance case below with designated test accounts and devices.
10. Complete privacy, accessibility and security review before production approval.

## Acceptance cases

| Case | Expected result |
|---|---|
| Existing phone and consent | Recovery SMS request is accepted |
| Unknown phone | No citizen account is created |
| Missing consent | Send button stays disabled |
| Incorrect or expired OTP | Recovery does not complete |
| Valid OTP | Current session remains active and other provider sessions are signed out |
| Backend receipt failure after provider sign-out | Interface reports the partial result and does not claim full completion |
| Existing account hold | Hold remains active and visible after recovery |
| Existing card hold | Hold remains active and visible after recovery |
| Recovery completion | No wallet, token, balance or identity record changes |
| Account security opened | Current browser is registered as verified device evidence |
| Secure other sessions | Provider revocation succeeds before the evidence receipt is written |
| Sign out this device | Only this browser session is removed |
| Sign out everywhere | Request receipt is recorded before provider global sign-out |
| One citizen reads another citizen's records | RLS denies access |
| Shared-device recovery | Device is marked shared and citizen is prompted to sign out |
| Keyboard and screen reader | All fields, errors, dialogs and actions are operable and announced |

## Evidence to retain

- Migration version and database backup identifier.
- RLS and function-grant inspection with identifiers redacted.
- SMS delivery, expiry, resend and rate-limit results.
- Two-device session-revocation evidence.
- Recovery and security receipt identifiers.
- Proof that security holds remain unchanged.
- Mobile, keyboard, screen-reader and reduced-motion results.
- Privacy and abuse-review sign-off.

Never store or publish real phone numbers, OTP values, tokens, raw session data, Twilio credentials or Supabase service-role keys.
