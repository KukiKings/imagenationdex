# Twilio

**Type:** SMS / voice messaging provider (OTP delivery)
**Relevance to IN$DEX:** Backs phone OTP for Supabase Auth — the entry point of the entire Tier 0 onboarding path. Since the 2026-07-27 founder decision that **Tier 0 is phone + contact + OTP only** (no face scan, no liveness check), SMS OTP is the *sole* verification step at Tier 0, which makes Twilio a single point of failure for citizen signup.

**Status / open items**
- **RULED OUT 2026-09-17 — AJ decision: "we are no longer using twilio... it's not user friendly."**
  Twilio is no longer the intended SMS OTP provider for Tier 0. Same-day follow-up from AJ:
  "we are using supabase" — read as staying inside Supabase Auth's own native phone-provider
  support rather than building a bespoke SMS integration outside it.
- Supabase Auth natively supports three other built-in phone/SMS providers besides Twilio:
  **MessageBird, Vonage, and TextLocal** (community-supported) — each configured the same simple
  way Twilio was, via Authentication → Providers → Phone in the Supabase dashboard, no custom
  code required. (Supabase also offers a "Send SMS Hook" for a fully custom provider if none of
  the four built-ins work out, e.g. Africa's Talking — more setup, but no vendor lock to the
  built-in list.)
- No provider has been chosen yet. **Open decision for AJ**, not made unilaterally here — this
  is a real vendor/cost/deliverability choice, not a code change. MessageBird and Vonage are the
  most direct like-for-like replacements (both are established global CPaaS players, both often
  cited as simpler to onboard than Twilio's business/A2P verification flow, which may be exactly
  what "not user friendly" was pointing at). Neither has confirmed Pacific-corridor deliverability
  data from a quick check (2026-09-17) — the risk flag below still applies to whichever is chosen.
- **Blocked Part Sixteen Stage C** (Session 121 x74, 18 Jul 2026) — staging positive-test sequence
  could not complete the phone-OTP path. Still blocked until a provider is chosen and configured.
- Supabase built-in mailer (2 emails/hour) is still the email fallback and has not been replaced.

**Risk flag (still applies to whatever replaces Twilio):** deliverability and per-message cost in
Pacific corridors (Samoa, Fiji, Vanuatu, RMI) has not been tested for any provider, including the
ones proposed above. A corridor where OTP SMS doesn't land is a corridor where nobody can onboard
— this was true of Twilio and remains true of MessageBird/Vonage/TextLocal until tested for real.

## Orphan note
Created by nightly brain pass (2026-07-29) — mentioned across 10 files (company-context.md, part16-staging-positive-test-sequence.md, dev-plan-phase1-4.md, stage1-marketing-community-plan.md and others) since at least Session 121, no dedicated file existed.
