# Auth email: custom SMTP setup (manual)

Status: NOT DONE. Nothing here is changed by code. Enter these settings by hand in the Supabase dashboard.

Why: Supabase's default sender is `noreply@mail.app.supabase.io`. Sign-in links should come from the IN$DEX domain so citizens recognise them. The default sender is also rate limited and is not meant for production.

Project: `zljgthfzbalsunuoohcd`

## Before you start

1. Choose an SMTP provider and create an account (AJ decision; not chosen yet).
2. Pick the sender address on the IN$DEX domain, for example `no-reply@<your-domain>`. The domain and address are not confirmed in this repo.
3. At your DNS host, add the records your SMTP provider gives you for the sending domain: SPF, DKIM and DMARC. Wait until the provider shows the domain as verified.

## Dashboard steps

1. Open the Supabase dashboard, project `zljgthfzbalsunuoohcd`.
2. Go to **Authentication > Emails > SMTP Settings** (the exact menu label can differ by dashboard version).
3. Turn on **Enable custom SMTP**.
4. Enter:
   - **Sender email:** the address on the IN$DEX domain, from step 2 above.
   - **Sender name:** `IN$DEX`
   - **Host:** your provider's SMTP host.
   - **Port number:** `587`
   - **Minimum interval between emails to the same user:** leave the default unless you have a reason to change it.
   - **Username:** the SMTP username from your provider.
   - **Password:** the SMTP password or API key from your provider. Enter it only in the dashboard. Never put it in the repo, a chat, or a page.
5. Click **Save**.
6. Check **Authentication > Emails > Templates**. The "Magic link" and "Confirm signup" templates should read as IN$DEX. Use plain wording and no jargon.
7. Check **Authentication > URL Configuration**. Confirm the Site URL is `https://imagenationdex.com` and that `https://imagenationdex.com/onboard` is in the Redirect URLs list. The onboard page asks for this redirect.
8. Test: open `https://imagenationdex.com/onboard`, request a sign-in email to an address you own, and check that the sender shows as IN$DEX on the new domain and the email does not land in spam.

## Also check in the dashboard before launch

1. **OTP expiry is one hour or lower.**
   - Where: **Authentication > Sign In / Providers**, then open the **Email** provider (and **Phone** if used). The setting is "Email OTP Expiration" (seconds). Set 3600 or lower.
   - Current state: the Supabase security advisor (run 2026-10-30) reports `auth_otp_long_expiry`: "OTP expiry set to more than an hour". So the live value is above one hour. This is not fixed.
2. **No test phone numbers remain.**
   - Where: **Authentication > Sign In / Providers > Phone**, section "Phone numbers for testing" (if shown). Remove every entry.
   - Current state: not checked. The dashboard asked for a sign-in when this was attempted, and nothing was entered. Treat as unknown until someone looks.
3. **Leaked password protection:** the advisor also reports it disabled. It only matters if password sign-in is used. IN$DEX onboarding uses email link and code, so this is for awareness.

## Record when done

Date, who did it, the sender address now in use, and a screenshot of the Email OTP Expiration setting. The FSC pack can refer to this file.
