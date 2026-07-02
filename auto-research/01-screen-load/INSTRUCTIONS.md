# Experiment 01 — Screen Load Speed
## STATUS: LOCKED — Do not modify. Human eyes only.

---

## Objective

Reduce the load time of `asset.html` (the IN$DEX DEX Swap screen) as measured by the composite load score in SCORING.py.

The current baseline is a 48 KB single-file HTML app. The goal is to make it load faster without breaking functionality or visual fidelity.

---

## What you are allowed to change

- Inline CSS: minify, remove unused rules, consolidate duplicate declarations
- JavaScript: minify, defer non-critical scripts, remove unused functions, combine event listeners
- HTML structure: remove unnecessary wrapper divs, consolidate repeated markup
- Inline SVGs: optimise paths, remove unnecessary attributes
- Font loading: ensure fonts use `font-display: swap` or are subset
- Images: ensure all `<img>` tags have `loading="lazy"` where appropriate

## What you must NOT change

- The visual design: colors, layout, component positions stay the same
- The IN$DEX brand: cyan (#00D4FF), dark backgrounds (#090A10, #111318), the logo
- Functionality: all interactive elements (swap, token selectors, slippage controls) must remain working
- The IN$DEX canonical price of $0.35 per INDX must not appear anywhere in the file
- No AUD or A$ currency symbols (USD only)
- The file must remain a single self-contained HTML file (no splitting into separate CSS/JS files)

---

## Strategy hints for the AI (non-binding)

- Start with CSS: large inline stylesheets are the #1 load blocker in single-file apps
- Look for duplicate CSS rules (same property declared multiple times for same selector)
- JavaScript animations running on load slow first paint — consider deferring
- Unused CSS variables defined in `:root` can be pruned
- Repeated gradient/shadow declarations can be extracted to CSS classes
- Script tags without `defer` or `async` block HTML parsing

---

## Target

Score > 75. Current baseline score will be established on first run.
Improvement of even 5 points per overnight session compounds dramatically over a week.
