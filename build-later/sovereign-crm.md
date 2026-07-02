# IN$DEX Sovereign CRM — Build Brief
**Status:** Ready to build
**Priority:** High
**Date logged:** 2026-06-25
**Estimated build time:** 1–2 Claude Code sessions for MVP

---

## What it is

A sovereign CRM for Pacific merchants and IN$DEX ecosystem businesses. Replaces HubSpot/GoHighLevel. Built on IN$DEX infrastructure. Free to use — pays for itself via 2% SovereignPay fee on closed deals.

---

## Why now

- HubSpot: $900/month for 10-person team. Too expensive, too complex.
- GoHighLevel: $1,164/year solo. Clunky UI, no blockchain.
- Neither is mobile-first, offline-capable, or sovereign.
- Web3 CRM market: $2.91B in 2026, growing at 27% CAGR.
- Pacific mobile broadband coverage: 86%, usage: 27% — 59% gap = underserved market.

---

## The 5 features that drive mass adoption (research-backed)

1. **WhatsApp-first contact capture** — 98% open rate. Only 40% of businesses have it integrated with CRM. Every WhatsApp message auto-creates/updates a contact record.
2. **.IN$DEX sovereign login** — your domain IS your CRM profile. No forms, no passwords. SovereignPay transactions auto-create contacts.
3. **SIINDEX AI next-action engine** — tells merchant exactly who to follow up with and when. 5-min response = 21x higher qualification rate.
4. **SovereignPay deal closing** — one button to close and collect. 2% fee pays for the CRM.
5. **Offline-first + SMS fallback** — works without data. Syncs on reconnect.

---

## The 3 market segments (in attack order)

1. **Pacific sovereign merchants** (weeks 1–12) — market stalls, tour operators, craftspeople. Free tier. WhatsApp-first. SMS fallback.
2. **IN$DEX ecosystem businesses** (months 3–6) — on-chain transaction history becomes CRM data automatically.
3. **Global sovereign agency market** (months 6–18) — people escaping HubSpot. Data sovereign, no per-seat pricing, white-label-capable.

---

## Stack

- **Frontend:** React / Next.js (IN$DEX style — dark, cyan, mobile-first)
- **Database:** Supabase (already connected to IN$DEX)
- **Hosting:** Vercel (already connected to IN$DEX)
- **Messaging:** WhatsApp Business API (Twilio or WATI) + SMS (Africa's Talking for Pacific reach)
- **AI:** SIINDEX agent
- **Payments:** SovereignPay (INDX token, 2% fee)
- **Identity:** .IN$DEX domains
- **Offline:** PWA with service workers

---

## MVP screens to build

- [ ] Pipeline board (5 stages: New → Contacted → Proposal → Negotiation → Closed)
- [ ] Contact profile (linked to .IN$DEX domain, on-chain history, WhatsApp thread)
- [ ] Company profile
- [ ] Deal detail (with SovereignPay close button)
- [ ] SIINDEX next-action feed (AI prompts panel)
- [ ] Analytics dashboard (pipeline value, close rate, deal velocity)
- [ ] WhatsApp inbox (conversations as CRM records)
- [ ] Offline mode + sync status indicator

---

## How to kick off

Open Claude Code and paste this:

> "Build me an IN$DEX Sovereign CRM. Mobile-first, dark theme (cyan #00D4FF, black #090A10). Stack: React frontend, Supabase for database, deploy to Vercel. Core features: lead pipeline with 5 stages (New Lead, Contacted, Proposal Sent, Negotiating, Closed Won), contact profiles linked to .IN$DEX domains, company profiles, WhatsApp message log per contact, deal value tracking with SovereignPay integration placeholder, and an analytics dashboard. Start from scratch, no dummy data. Single-file components where possible."

Then add features one at a time after MVP is live.

---

## Source research

Session date: 2026-06-25
Research covered: Web3 CRM market data, Pacific digital economy gap, HubSpot/GHL weaknesses, WhatsApp business economy, AI CRM ROI data, decentralised identity market.
