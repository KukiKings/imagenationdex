# IN$DEX Sovereign CRM — Phase 2 Advanced Features
**Status:** Build after MVP is live
**Priority:** Medium — MVP first, then layer these in
**Date logged:** 2026-06-25

---

## Context

Phase 1 MVP is specced in `sovereign-crm.md`. These are the features to add once the core pipeline, contacts, companies, and analytics are live. Each one is a separate Claude Code session.

---

## Feature A — Fathom Meeting Notes Integration

**What it does:** Automatically pulls meeting notes and transcripts from Fathom into CRM contact/company records. Every call AJ has with a merchant, partner, or investor auto-logs to their CRM profile.

**From the video:** The agency CRM in the video had Fathom connected directly. Meeting notes flowed into lead records automatically. Zero manual entry.

**How to build:**
- Connect Fathom API (or Zapier webhook if no direct API)
- Parse transcript → extract action items, decisions, attendees
- Match attendee email/name to existing CRM contact
- Auto-create contact if not exists
- Add transcript + AI summary to contact activity log

**Scoring:** Time saved on manual note entry per week (should eliminate ~2hrs/week)

---

## Feature B — AI Lead Enrichment + Scoring

**What it does:** When a new lead is added, SIINDEX automatically enriches the record (company size, industry, social presence, on-chain activity) and scores it warm/hot/cold.

**From the video:** The agency CRM had automatic AI enrichment and automatic AI scoring visible on the lead cards. "Warm lead, cold lead" — visible at a glance.

**Data sources for Pacific merchants:**
- .IN$DEX domain lookup → on-chain transaction history → estimate deal size
- Facebook Business page (if public) → follower count, engagement, activity
- WhatsApp business profile → verified business status
- SovereignPay history → volume of transactions on IN$DEX

**Scoring model:**
```
lead_score = (transaction_volume × 0.4) + (engagement_recency × 0.3) + (profile_completeness × 0.3)
```

**SIINDEX output:** "maria.IN$DEX — 847 transactions in last 90 days. High-value merchant. Contact priority: HIGH."

---

## Feature C — Per-Contact SIINDEX Chatbot

**What it does:** Every company/contact profile has a chat window where AJ can ask SIINDEX questions about that specific contact. "What did we discuss last time?" "What's their average deal value?" "Are they at risk of churning?"

**From the video:** The agency CRM had a chatbot that was specific to each company, answering questions about "any information we need" about that company.

**How to build:**
- Feed SIINDEX the contact's full history: notes, emails, WhatsApp logs, transaction data, meeting transcripts, deal history
- System prompt: "You are SIINDEX, the CRM intelligence for IN$DEX. You know everything about {contact_name}. Answer questions accurately based only on their record."
- Build as a slide-out panel on the contact profile page

---

## Feature D — Project Flow Diagram Generator

**What it does:** From a deal record, SIINDEX auto-generates a visual project flow diagram showing the workflow, milestones, and deliverables for that deal.

**From the video:** The agency CRM had a system to automatically generate a project flow diagram using AI, built directly into the company profile.

**How to build:**
- Trigger: when deal moves to "Closed Won"
- SIINDEX takes deal type, value, notes → generates a Mermaid.js diagram
- Diagram shows: kickoff → milestones → deliverables → payment gates → completion
- Rendered in deal record as a visual flowchart
- Exportable as PDF for client delivery

---

## Feature E — Background Automation Workflows

**What it does:** Server-side cron jobs that run automatically in the background, no user action needed.

**From the video:** The CRM was hosted on Railway (24/7 server). A cron job moved leads to next stage after 60 seconds (demo). The real power: any time-based workflow runs automatically.

**Automations to build for IN$DEX:**

| Trigger | Action |
|---|---|
| Lead in "New" stage for 48hrs with no activity | SIINDEX sends follow-up reminder to AJ on WhatsApp |
| Deal moved to "Closed Won" | Auto-send payment request via SovereignPay to client |
| Contact hasn't been contacted in 30 days | Flag as "at-risk" in pipeline |
| New lead created with .IN$DEX domain | Auto-enrich from on-chain data |
| SovereignPay payment received | Move deal to "Closed Won", log payment amount |
| Meeting transcript arrives from Fathom | Auto-update contact record, extract next actions |

**How to build:** Node.js cron jobs on Vercel (or Railway if needed for persistent background jobs). Each automation is a separate function triggered by time or webhook event.

---

## Feature F — Resend Email Notifications

**What it does:** Automated transactional emails triggered by CRM events. Built with Resend (same as the video).

**From the video:** When a deal moved to "Closed Won", an automatic email was sent to the team. Resend handled the delivery from a custom domain.

**Events to notify:**
- Deal closed → email AJ + team with deal summary
- New high-value lead added (score > 80) → email AJ immediately
- SovereignPay payment confirmed → email client with receipt
- 7 days without contact on active deal → email AJ with "deal at risk" warning

**How to build:** Install Resend SDK, connect IN$DEX domain (imagenationdex.com), add notification functions to each pipeline stage change event.

---

## Feature G — WhatsApp Inbox Integration

**What it does:** All WhatsApp conversations with contacts are visible inside the CRM contact profile. Reply directly from CRM. Conversations auto-link to contact records.

**Why this is the most important Phase 2 feature:** 98% WhatsApp open rate. Pacific merchants communicate exclusively on WhatsApp. Without this, the CRM is missing its primary communication channel.

**How to build:**
- WhatsApp Business API via Twilio or WATI
- Webhook: incoming WhatsApp message → match sender number to CRM contact → append to conversation log
- Reply from CRM: compose message in contact profile → send via WhatsApp API
- Auto-create contact if number not in CRM

**Note:** Needs verified WhatsApp Business account for IN$DEX. Apply for API access before building.
