# IN$DEX Sovereign CRM — As a Standalone Product
**Status:** Build after internal CRM is battle-tested
**Priority:** High (revenue opportunity)
**Date logged:** 2026-06-25

---

## What it is

Take the internal IN$DEX Sovereign CRM and package it as a B2B SaaS product sold to Pacific sovereign businesses, agencies, and anyone wanting to escape HubSpot/GoHighLevel. Built on IN$DEX infrastructure. Payments via INDX token.

---

## The market opportunity

- HubSpot charges $900/month for a 10-person team
- GoHighLevel charges $1,164/year for a solo operator
- Neither is built for mobile-first, unbanked, Pacific markets
- Web3 CRM market: $2.91B in 2026, 27.2% CAGR
- Decentralised identity market: $2.56B → $4.62B in one year (80% CAGR)
- 80% of business leaders cite data sovereignty as a strategic priority
- Target customers include: agencies, consultants, Pacific merchants, sovereign businesses, crypto-native companies

---

## The killer differentiator vs HubSpot/GHL

| Feature | HubSpot | GoHighLevel | IN$DEX Sovereign CRM |
|---|---|---|---|
| Price | $900/mo (10 users) | $1,164/yr | Free (2% on deals closed) |
| Mobile-first | No | No | Yes |
| Offline mode | No | No | Yes |
| WhatsApp native | Add-on | Add-on | Built-in |
| Sovereign identity | No | No | .IN$DEX domain |
| On-chain customer data | No | No | Yes |
| Payments built in | No | No | SovereignPay |
| AI agent | Breeze (basic) | Basic | SIINDEX |
| Data ownership | Theirs | Theirs | Yours |
| Per-seat pricing | Yes (punishing) | Yes | No |

---

## Revenue model

**Primary:** 2% SovereignPay fee on every deal closed through the CRM. CRM is free to use — it earns on outcomes, not subscriptions.

**Secondary:** INDX token staking for premium features (advanced analytics, white-label, API access, unlimited contacts).

**Tertiary:** White-label licensing to agencies who want to offer their own branded CRM to clients.

---

## Go-to-market

1. **Use it internally first.** IN$DEX uses its own CRM for merchant/partner pipeline. Every time it works, it's proof.
2. **Pacific first.** Partner with UNCDF, ADB Pacific, and Go Digital Pacific programmes — they are actively funding digital tools for Pacific businesses. IN$DEX Sovereign CRM is exactly what they're trying to build.
3. **Agency channel.** Target digital agencies who currently pay GoHighLevel. Offer white-label at a flat fee. They resell to their clients.
4. **Crypto-native market.** Any Web3 project that needs to manage wallet-based users rather than email addresses. This is the Formo/Holder.xyz market ($2.91B).

---

## Product tiers

| Tier | Who | Price | Features |
|---|---|---|---|
| Sovereign Free | Pacific merchants, solo operators | Free + 2% on deals | Pipeline, contacts, WhatsApp, SIINDEX basic |
| Sovereign Pro | Growing businesses, agencies | 500 INDX/month | Everything + advanced analytics, Fathom, automations, API |
| Sovereign Enterprise | Large orgs, white-label | Custom | White-label, dedicated SIINDEX, SLA |

---

## What needs to be true before launching as a product

- [ ] Internal CRM built and battle-tested for 90 days (see `sovereign-crm.md`)
- [ ] WhatsApp Business API verified for IN$DEX
- [ ] SovereignPay deal-closing flow working end-to-end
- [ ] SIINDEX next-action engine live
- [ ] Offline PWA working on Pacific mobile devices
- [ ] At least 3 Pacific merchant case studies documented
- [ ] Stripe/INDX token billing infrastructure for paid tiers

---

## How to kick off (when ready)

1. Complete and battle-test the internal CRM first
2. White-label the frontend (swap IN$DEX branding for configurable brand settings)
3. Add multi-tenant Supabase schema (each customer = isolated org)
4. Build onboarding flow for new CRM customers (ironic: use the CRM to onboard CRM customers)
5. List on Product Hunt, crypto forums, Pacific business networks
