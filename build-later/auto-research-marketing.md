# IN$DEX Auto Research — Marketing Experiments
**Status:** Framework built. These are the next experiments to add.
**Priority:** Medium — add when each asset is stable
**Date logged:** 2026-06-25

---

## Context

The Auto Research system is already live in `/auto-research/`. It has 4 experiments running:
- `01-screen-load` — dex-swap.html load speed (52.3/100 baseline)
- `02-onboarding-copy` — onboarding copy clarity (90.0/100 baseline)
- `03-agent-policy` — SIINDEX agent wallet skill (63.6/100 baseline)
- `04-pqsi-thresholds` — PQSI threat detection (94.7/100 baseline)

These are the next experiments to build when the relevant assets are stable. Each needs the same three-file structure: `INSTRUCTIONS.md` (locked), `asset.*` (AI optimises), `SCORING.py` (locked).

---

## Experiment 05 — Facebook / Meta Ads

**When to build:** When IN$DEX has an active ad budget and Meta Business account connected
**Asset:** `asset.json` — ad copy variations (headline, body, CTA, image description)
**Score:** Cost-per-click (lower = better). Pull from Meta Ads API after each $10 test spend.
**Loop:** Post variation → wait for $10 spend → pull CPC → keep if better → generate next
**Feedback loop:** 2–4 hours per experiment (needs real spend)
**From the video:** Toby Lutke ran this exact setup overnight. The runner tests $10 per variation, kills losers, keeps winners.

---

## Experiment 06 — YouTube Titles & Thumbnails

**When to build:** When IN$DEX YouTube channel is active with consistent uploads
**Asset:** `asset.json` — title variants + thumbnail text overlay + colour scheme
**Score:** Click-through rate (CTR) pulled from YouTube Studio API. Target > 6% CTR.
**Loop:** A/B test two titles on same video (YouTube allows title updates) → 24hr data → keep winner
**Note:** Thumbnail requires image generation model in the loop (DALL-E 3 or Flux)

---

## Experiment 07 — Cold Outreach Subject Lines

**When to build:** When IN$DEX is running B2B outreach to merchants, investors, or partners
**Asset:** `asset.json` — email subject lines + opening sentences
**Score:** 24-hour open rate pulled from email sending platform (Resend or Instantly)
**Loop:** Send 100 emails per variation → 24hrs → measure open rate → keep winner
**Note:** Must send to fresh cold lists each time — do not re-test on same audience (list fatigue)
**Feedback loop:** 24 hours minimum

---

## Experiment 08 — Instagram / TikTok DM Scripts

**When to build:** When IN$DEX is running outbound DM campaigns (Manychat or similar)
**Asset:** `asset.md` — the DM opener, follow-up sequence, and call-to-action
**Score:** Reply rate + booking rate per template (pulled from Manychat analytics)
**Loop:** Test new opener → measure reply rate over 48hrs → keep if reply rate improves
**Instructions constraint:** Must stay human, no spam triggers, must pass platform DM limits

---

## Experiment 09 — Landing Page / Sales Page Copy

**When to build:** When `landing-page.html` or `launch.html` is traffic-tested
**Asset:** `landing-page.html` (or a copy of it)
**Score:** Conversion rate (sign-ups / visitors) via Vercel Analytics or Supabase events
**Loop:** Change one section at a time (hero headline, subheading, CTA button text, social proof section)
**Note:** Needs meaningful traffic volume (500+ visitors/day) for statistical significance

---

## Experiment 10 — Waitlist Email Sequence

**When to build:** When IN$DEX waitlist is live and emailing regularly
**Asset:** `asset.json` — email sequence (subject, preview text, body, CTA for each email in sequence)
**Score:** Open rate + click rate + conversion to wallet creation per email
**Loop:** Split test sequence variations on new waitlist cohorts → 48hr data → keep winner

---

## When NOT to run Auto Research

Per Karpathy's rules — skip these, feedback loop is too slow:
- SEO rankings (10+ day reindex lag)
- Pricing changes (churn effect takes months to measure)
- Brand positioning (no objective scoring possible)
- PR/press outreach (no fast, consistent signal)

---

## How to add a new experiment

```bash
cd auto-research
mkdir 05-your-experiment
# Create INSTRUCTIONS.md, asset.*, SCORING.py
# Add experiment name to EXPERIMENTS list in runner.py
python runner.py --experiment 05-your-experiment --dry-run  # verify it scores
```
