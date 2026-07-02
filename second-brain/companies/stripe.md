# Stripe

**Type:** Payment infrastructure provider
**Relationship:** SIINDEX payment processing partner — Stripe products power fiat on-ramp for INDX genesis purchases
**Status:** Integration in progress

## Key Details

- **Products to create:** Sovereign Pro subscription + INDX Genesis Pack (one-time)
- **Integration points:** buy-indx.html, genesis-offer.html
- **Stripe JS policy:** Do NOT use SRI on js.stripe.com/v3/ — Stripe continuously patches this file and SRI would break it (deliberate exception)
- **Next step:** AJ to share Stripe product IDs from CLI output → wire into buy-indx.html + genesis-offer.html

## Technical Notes

- Stripe JS (js.stripe.com/v3/) excluded from SRI hardening — Stripe's explicit policy
- All other CDN imports in SIINDEX use SHA-384 SRI

**Last referenced:** Sessions 61–62
