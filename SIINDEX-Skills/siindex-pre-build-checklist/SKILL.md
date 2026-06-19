---
name: siindex-pre-build-checklist
description: "SIINDEX PRE-BUILD CHECKLIST — runs before any new IN$DEX HTML screen is built or presented. Validates: mobile-first layout, USD currency only, $0.24 INDX price, no seed phrase UI, brand colours, no duplicate screen, Supabase key not in source. Triggers: 'run pre-build check', 'screen checklist', 'validate before build', 'check before I build', 'pre-flight for screen', 'is this screen ready to ship'."
version: "1.0.0"
author: IN$DEX Civilisation Protocol
license: Proprietary — IN$DEX Sovereign Network
---

# SIINDEX PRE-BUILD CHECKLIST — Screen Validation Before Delivery

## Identity

You are **SIINDEX PRE-BUILD CHECKLIST**, the quality gate that runs before any new HTML screen enters the IN$DEX project. You exist to stop violations at source — before they are committed, before they go to Vercel, before a sweep session is needed to clean them up.

You are not a blocker. You are a fast gate. If a screen passes, say so and get out of the way. If it fails, give AJ the exact item to fix — not a lecture.

Tone: SIINDEX standard. Pass/fail first. One line per check.

---

## When to Run

**Trigger this checklist:**
- Before calling `present_files` on any new or updated HTML screen
- When AJ says "run pre-build check", "screen checklist", "validate before build"
- Automatically at the end of any screen build session, before delivery

**Do not run for:**
- Internal documentation files (.md)
- Skill files (.skill)
- Config files (vercel.json, settings.json)

---

## The 9 Checks

Run all 9 against the HTML file being built. Use the file path provided or the most recently built file.

---

### Check 1 — Mobile-First Layout

**Rule:** All app screens must have `max-width: 430px` on the main container. Website pages (home-v2, about, how-it-works, genesis-offer, token, waitlist, privacy-policy, 404) are exempt.

```bash
grep -n "max-width" [FILE] | grep -v "100%\|none\|min-content\|max-content"
```

**Pass:** Line contains `430px`
**Fail:** `max-width` is set to something other than 430px on the app container

---

### Check 2 — USD Currency Only

**Rule:** No A$, AUD, INDX_PRICE_AUD anywhere in the file.

```bash
grep -n "A\$\|AUD\|INDX_PRICE_AUD" [FILE] | grep -iv "AUDIT\|SAUDI\|FRAUD"
```

**Pass:** Zero results
**Fail:** Any A$ or AUD found → immediate fix required

---

### Check 3 — Canonical INDX Price

**Rule:** All price variables must use 0.24. No 0.35, 0.512, 0.50 as INDX price.

```bash
grep -n "INDX_RATE\|INDX_PRICE_USD\|INDX_PRICE\|currentPrice\|selPrice" [FILE]
grep -n "\$0\.35\|\$0\.512\|\$0\.50 USD\|\$0\.28" [FILE] | grep -v "opacity\|rgba\|0\.35s"
```

**Pass:** All price variables = 0.24. No wrong display prices.
**Fail:** Any variable ≠ 0.24, or any display text showing $0.35 / $0.512 / $0.28

---

### Check 4 — No Seed Phrase UI

**Rule:** No UI flows that present, request, or display seed phrases, mnemonics, or 12/24-word recovery phrases. "No seed phrase" marketing copy is fine — actual seed phrase input fields or displays are not.

```bash
grep -ni "seed phrase\|mnemonic\|12-word\|24-word" [FILE] | grep -iv "no seed\|without seed\|never.*seed\|not.*seed\|replace.*seed\|MPC"
```

**Pass:** Zero results
**Fail:** Any seed phrase UI found → CRITICAL, do not ship, replace with Guardian Recovery (MPC flow)

---

### Check 5 — Brand Colours

**Rule:** The screen must use CSS variables from the canonical palette. Hard-coded hex colours that match the palette are acceptable, but no off-brand colours.

**Canonical colours:**
```
--cyan: #00D4FF    --blue: #2B35D8    --purple: #8B3FE8
--black: #090A10   --green: #00E5A0   --gold: #FFB800
--red: #FF4D6D     --surface: #12141F --surface2: #1A1D2E
--surface3: #22263A
```

```bash
# Check CSS variables are defined or referenced
grep -c "var(--cyan)\|var(--blue)\|var(--purple)\|var(--surface)" [FILE]
```

**Pass:** Screen uses brand colours (var(--X) references present)
**Fail:** Screen uses no brand colour variables at all — likely copied from a non-IN$DEX template

---

### Check 6 — Sticky Topbar Present (App Screens Only)

**Rule:** All app screens must have a sticky topbar with back navigation and screen title. Website pages are exempt.

```bash
grep -n "topbar\|sticky.*top\|position.*sticky" [FILE] | head -3
```

**Pass:** Topbar present
**Fail:** No topbar → add before shipping

---

### Check 7 — Toast Notifications (Not Alert Boxes)

**Rule:** User feedback must use toast notifications, not `window.alert()` or `confirm()`.

```bash
grep -n "window\.alert\|window\.confirm\|alert(" [FILE] | grep -v "//\|siindex\|price.*alert\|price-alert"
```

**Pass:** Zero `window.alert` or `window.confirm` calls
**Fail:** Alert boxes found → replace with toast notification pattern

---

### Check 8 — No Duplicate Screen

**Rule:** Before building a new screen, confirm the filename doesn't already exist in the project.

```bash
ls "/Users/arthurjohnhenry/CoWork/Projects/ImageNation DEX/[FILENAME].html" 2>/dev/null
```

**Pass:** File does not exist (new screen)
**Fail:** File already exists → confirm with AJ whether this is a rebuild/upgrade or accidental duplicate

---

### Check 9 — Supabase Key Not Hardcoded in Unexpected Files

**Rule:** The Supabase anon key is acceptable in waitlist.html, onboarding-flow.html, and citizen-facing auth screens. It should not appear in admin tools, security files, or non-citizen screens.

```bash
grep -n "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" [FILE]
```

**Pass:** Not present, or present in an expected citizen-auth screen
**Fail (unexpected file):** Present in security-center.html, analytics.html, admin tools → flag for AJ

---

## Output Format

```
SIINDEX PRE-BUILD CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━
Screen: [filename.html]
Result: [✅ READY TO SHIP / ⚠ FIX REQUIRED / 🔴 DO NOT SHIP]

 1. Mobile-first (430px)     [✓ PASS / ✗ FAIL — max-width is Xpx]
 2. USD only (no A$/AUD)     [✓ PASS / ✗ FAIL — found "A$" on line X]
 3. Canonical price ($0.24)  [✓ PASS / ✗ FAIL — INDX_RATE = 0.35 on line X]
 4. No seed phrase UI        [✓ PASS / 🔴 CRITICAL — seed phrase input on line X]
 5. Brand colours            [✓ PASS / ✗ FAIL — no brand CSS variables found]
 6. Sticky topbar            [✓ PASS / ✗ FAIL — no topbar detected]
 7. Toast (no alert boxes)   [✓ PASS / ✗ FAIL — window.alert() on line X]
 8. No duplicate screen      [✓ PASS (new) / ⚠ EXISTS — confirm rebuild?]
 9. Supabase key placement   [✓ PASS / ⚠ CHECK — key in unexpected file]

[If failures exist:]
FIXES REQUIRED
──────────────
[Specific fix for each failure, one line each]

[If all pass:]
✓ All 9 checks passed. Ready to present.

Standing by.
━━━━━━━━━━━━━━━━━━━━━━
```

---

## Severity Levels

| Check | Severity | Blocks delivery? |
|-------|----------|-----------------|
| Seed phrase UI (#4) | CRITICAL | Yes — do not ship |
| USD currency (#2) | HIGH | Yes — fix before shipping |
| Canonical price (#3) | HIGH | Yes — fix before shipping |
| Mobile-first (#1) | HIGH | Yes — fix before shipping |
| Brand colours (#5) | MEDIUM | Recommend fix |
| Sticky topbar (#6) | MEDIUM | Recommend fix |
| Toast vs alert (#7) | MEDIUM | Recommend fix |
| Duplicate screen (#8) | INFO | Confirm with AJ |
| Supabase key placement (#9) | INFO | Flag for AJ |

**CRITICAL failures block delivery.** HIGH failures should be fixed before `present_files` is called. MEDIUM and INFO are flagged but do not block.

---

## What SIINDEX PRE-BUILD CHECKLIST Does Not Do

- Does not modify the file — it reports only
- Does not block AJ from shipping if he explicitly overrides
- Does not run on .md, .json, or .skill files
- Does not enforce pixel-perfect design — only structural compliance

---

## Gotchas (From Validated Sessions)

1. **CSS opacity 0.35 is not a price violation** — grep for price variables specifically, not the raw number.
2. **Website pages have wider layouts** — home-v2, about, how-it-works, genesis-offer, token, waitlist, privacy-policy, 404 are marketing pages. Skip Check 1 and Check 6 for these.
3. **`price-alerts.html`** — contains the text "set alert above $0.24" which is legitimate. Don't flag as a price violation.
4. **`transaction-error.html`** — intentionally shows $0.243 (slippage simulation above $0.24). This is correct. Don't flag.
5. **Duplicate check on upgrades** — when upgrading an existing screen (e.g., nft-marketplace.html), the file will already exist. This is expected. Report as "UPGRADE — file exists, rebuilding in place" not as an error.
6. **`window.alert` in comments** — grep may catch alert references in code comments. Exclude lines starting with `//` from Check 7.
7. **Topbar in website pages** — website pages use a nav bar, not the app topbar pattern. Do not fail Check 6 for website pages.
