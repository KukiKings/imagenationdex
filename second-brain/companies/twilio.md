# Twilio

**Type:** SMS / voice messaging provider (OTP delivery)
**Relevance to IN$DEX:** Backs phone OTP for Supabase Auth — the entry point of the entire Tier 0 onboarding path. Since the 2026-07-27 founder decision that **Tier 0 is phone + contact + OTP only** (no face scan, no liveness check), SMS OTP is the *sole* verification step at Tier 0, which makes Twilio a single point of failure for citizen signup.

**Status / open items**
- Configured as the SMS OTP provider in the Supabase Auth stack (per `company-context.md` systems inventory).
- **Blocked Part Sixteen Stage C** (Session 121 x74, 18 Jul 2026) — staging positive-test sequence could not complete the phone-OTP path.
- Pacific-reach question unresolved: several planning docs propose Africa's Talking (or WhatsApp Business API via Twilio/WATI) as an alternative/parallel gateway for Pacific corridor deliverability. No decision recorded.
- Supabase built-in mailer (2 emails/hour) is still the email fallback and has not been replaced.

**Risk flag:** deliverability and per-message cost in Pacific corridors (Samoa, Fiji, Vanuatu, RMI) has not been tested. A corridor where Twilio SMS doesn't land is a corridor where nobody can onboard.

## Orphan note
Created by nightly brain pass (2026-07-29) — mentioned across 10 files (company-context.md, part16-staging-positive-test-sequence.md, dev-plan-phase1-4.md, stage1-marketing-community-plan.md and others) since at least Session 121, no dedicated file existed.
