# IN$DEX Autonomous Content Engine — Build Brief
**Status:** Ready to spec, build when video model is integrated
**Priority:** High
**Date logged:** 2026-06-25
**Estimated build time:** 2–3 Claude Code sessions

---

## What it is

An overnight content machine that creates, posts, learns, and improves IN$DEX social content autonomously — using Auto Research as the intelligence loop. No human edits between iterations. By morning, it has run 100+ experiments and knows exactly what content format, hook, and length performs best.

Chimath Palihapitiya identified this as one of the biggest threats to social media platforms: "an incredible video model + TTS + auto research" pointed at a TikTok or Instagram account, constantly producing content, learning from results, improving overnight.

---

## How it works (the loop)

1. **Generate** — video model (Sora / Runway / Kling) + TTS creates a short-form video from a text brief
2. **Post** — auto-posts to TikTok, Instagram Reels, YouTube Shorts via API
3. **Measure** — after X hours, pulls performance data (views, watch time, shares, comments)
4. **Score** — Auto Research scoring function: watch-through rate × engagement rate × shares
5. **Learn** — keeps the hook, format, or CTA that performed best
6. **Iterate** — generates next variation with the winning elements kept, one variable changed
7. **Loop** — repeat overnight, 100x per night if needed

---

## IN$DEX content angles to optimise

- **Hooks** — "The bank is dead. Here's what replaced it." vs "Send money to Vanuatu in 3 taps." vs "Your wallet address is your name."
- **Format** — talking head vs screen recording vs animation vs text-on-screen
- **Length** — 15s vs 30s vs 60s
- **CTA** — "Join free" vs "Claim your domain" vs "Send your first payment"
- **Audience** — Pacific diaspora vs crypto-native vs fintech mainstream vs sovereign movement

---

## Scoring function (what "better" means)

```
score = (watch_through_rate × 0.4) + (share_rate × 0.4) + (click_rate × 0.2)
```

Watch-through rate is weighted highest because it signals the algorithm to push the content further. Shares are the organic growth multiplier.

---

## What this needs

- Video generation API (Sora, Runway Gen-3, or Kling) — pick whichever is live when building
- TTS (ElevenLabs for Pacific-accented voice, or OpenAI TTS)
- TikTok Business API (content posting + analytics)
- Instagram Graph API (Reels posting + insights)
- YouTube Data API (Shorts upload + analytics)
- Auto Research runner (already built in `/auto-research/`)

---

## Stack

Build as a new experiment inside the existing `/auto-research/` folder:
- `05-content-engine/INSTRUCTIONS.md` — what type of content, rules, brand voice
- `05-content-engine/asset.json` — the current best-performing content template (hook, body, CTA, format)
- `05-content-engine/SCORING.py` — pulls real performance data from platform APIs

---

## How to kick off

1. Pick one platform first (TikTok recommended — fastest feedback loop, highest organic reach)
2. Connect TikTok Business API to the runner
3. Define 5 seed content templates in `asset.json`
4. Set scoring threshold (watch-through > 40% = keeper)
5. Run overnight

---

## Why this matters for IN$DEX

IN$DEX needs 10M+ sovereign citizens. Paid ads won't get you there — organic content will. This system compounds: every night it gets better, every week the best content is 10x more optimised than what any human team could manually produce. Competitors running manual social teams will be 701x slower (Eric Siu's number from today's research).
