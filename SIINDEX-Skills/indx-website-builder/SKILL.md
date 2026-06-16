# SKILL: IN$DEX Website Page Builder
> Built from: Session 4 validated workflow (home-v2, about, how-it-works, genesis-offer)
> Use when: AJ asks to build or update a public marketing page for IN$DEX

---

## What This Skill Does

Builds high-converting, brand-correct public marketing pages for IN$DEX. Every page must pass the verification checklist before being marked complete.

---

## Trigger Phrases

- "build a [page name] page"
- "create the [X] website page"
- "add a page about [topic]"
- "we need a [X] page on the website"

---

## Before Building — Interview Checklist

If requirements are unclear, ask AJ these questions first (Power Phrase #3):

1. What is the primary conversion goal of this page? (Sign up / learn more / trust / sell)
2. Who is the primary reader? (Pacific Islander unbanked / diaspora / investor / press)
3. What is the ONE thing they should feel when they leave? (Relief / possibility / trust / urgency)
4. What's the primary CTA? (Join waitlist / claim genesis / open wallet / read more)
5. Any sections required or forbidden?

---

## Build Protocol

### Step 1 — Spec first (Power Phrase #2)
Write a one-paragraph spec covering: page goal, reader, feel, CTA, sections. Confirm with AJ before building.

### Step 2 — Structure
Every public page uses this base structure:
```
<nav> sticky, logo + links + CTA button
<section class="page-hero"> eyebrow + H1 + lead + CTA
[content sections]
<section> final CTA (gradient background, centered)
<footer> links, copyright
```

### Step 3 — Design rules (all mandatory)
- Background: `#090A10` (--black)
- Dark theme — no light mode
- Max-width: `1160px` for desktop layout
- Responsive: single column below 680px
- Font: system-ui / -apple-system stack
- Gradient text: `linear-gradient(135deg, #00D4FF, #8B3FE8)`
- Cards: `background: #12141F` border `rgba(255,255,255,0.06)`
- Hover: border-color change or `translateY(-1px)`

### Step 4 — Copy rules (all mandatory)
- Lead with the PERSON'S PROBLEM, not the product feature
- Short sentences. One idea per sentence.
- Mama Noe test: would a 60-year-old Pacific Islander understand this in 2 minutes?
- USD ($) everywhere — never AUD, never A$
- INDX price = $0.35 USD always
- 98/2 Civilisation Law: mention it on every page that discusses transactions
- No seed phrase — Grid Account uses MPC only

### Step 5 — Required elements
Every page must include:
- `<meta charset="UTF-8">` and viewport meta
- `<meta name="description">` — under 160 chars, conversion-focused
- `<meta property="og:title">` and `<meta property="og:description">`
- `<title>` — includes IN$DEX + page keyword + hook
- Canonical link
- Sticky nav with: logo (gradient), nav links, "Open Wallet" ghost + "Join the Republic →" primary
- Footer with: logo, 5 link columns, copyright line

### Step 6 — SIINDEX integration
If the page includes any AI/COO reference:
- She is female, pronounced "sin-dex"
- Voice: "Done. [summary]. Standing by."
- Never: "Great question!" / "Of course!" / "Happy to help"
- Terminal UI: black bg, purple border, courier new font, t0 CLEAR signoff

---

## Verification Checklist (run before marking complete)

- [ ] No A$ or AUD anywhere on the page
- [ ] INDX price is $0.35 USD (not $0.512, not any other number)
- [ ] No seed phrase mentioned
- [ ] 98/2 Law referenced correctly if transactions are discussed
- [ ] Primary CTA links to correct destination (waitlist.html or app-lock.html)
- [ ] Mobile layout works below 680px (no horizontal overflow)
- [ ] Countdown (if present) uses `new Date('2026-09-24T10:00:00+10:00')`
- [ ] SIINDEX voice is correct (female, JARVIS-style, correct phrases)
- [ ] SEO meta description under 160 chars
- [ ] File saved to /Users/arthurjohnhenry/CoWork/Projects/ImageNation DEX/
- [ ] Card added to index.html navigator

---

## Page Inventory (already built — check before creating new)

| File | Purpose |
|---|---|
| home-v2.html | Primary conversion home page |
| about.html | AJ's story, 14 Pillars, SIINDEX, MemeDAO, Civilisation Fund |
| how-it-works.html | 5-step walkthrough, INDX token, security, Wisdom Score |
| genesis-offer.html | Single-page Genesis Package conversion |
| waitlist.html | Pre-launch signup + countdown + referral |
| landing-page.html | Original landing (superseded by home-v2) |
| indx-website-strategy.html | 6-layer site architecture reference doc |

---

## Gotchas (edge cases found in validated builds)

1. **`clamp()` on font-size** — always use `clamp(min, preferred, max)` for responsive headings. Don't use fixed px for H1/H2 on marketing pages.
2. **Countdown timezone** — always `+10:00` (AEST). If you write `+11:00` it will be wrong half the year. Lock to `+10:00` always.
3. **Live counter increment** — use `Math.random() < 0.25` check inside setInterval. Don't increment every tick or it looks fake.
4. **Gradient text on Safari** — must use both `-webkit-background-clip: text` AND `background-clip: text` together or it breaks on mobile Safari.
5. **Nav hamburger** — always add `aria-expanded` toggle and close on outside click for accessibility.
6. **Footer link columns** — use `grid-template-columns: 2fr 1fr 1fr 1fr 1fr` for desktop, collapse to `1fr 1fr` on mobile.
7. **98/2 visual** — when showing the law as a bar chart, the 2% bar is short (16px height). 98% bar is tall (160px). Don't accidentally show them equal height.
8. **SIINDEX terminal** — always include `.t-blink` cursor at end of last line. Counts as a trust signal — users notice if it's missing.
9. **Genesis spots** — base count 2847, spots remaining = 5000 - base. Show BOTH the count and the progress bar together for urgency.
10. **`vercel.json` route** — new pages need a route entry if they use a clean URL (e.g. /join → waitlist.html). Add to vercel.json when creating new public pages.

---

## Output Format

```
File: /Users/arthurjohnhenry/CoWork/Projects/ImageNation DEX/[page-name].html
Verification: [checklist items confirmed]
Index update: [card added to index.html]
```

Always present the file with `mcp__cowork__present_files` when complete.
