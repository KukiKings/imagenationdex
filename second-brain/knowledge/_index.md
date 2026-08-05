# Knowledge

Extracted insights, frameworks, and non-obvious observations that make SIINDEX what it is.

---

## ⚠️ CANON CORRECTION — added 2026-08-05 by nightly pass. Read before anything below.

**Three entries in this file still carry canon that was withdrawn from every citizen
surface between 22 and 31 July 2026.** The 29 and 30 July purges swept HTML and citizen
files; they did not sweep `second-brain/`. Original lines are left unaltered per standing
convention — these supersede them.

1. The target-price line under *Grand Synchronicity*, which previously read "INDX target
   price $2.50 (from $0.24 genesis = ~10x)" — **[WITHDRAWN, quoted as historical record]**.
   No public price target exists. The $2.50 / 10.4× figure was removed from
   48 instances across 25 files on 29 Jul and from 17 more on 30 Jul. It is retained **only**
   in `decisions/grand-synchronicity-plan.md` as a conditional internal target. `$0.24` is a
   genesis **planning reference** only — not a live price, not a promise of value. There is
   no market and INDX cannot be bought. **This file is now the only place in the project
   still restating the target as canon.**

2. **"Civilisation Law … Immutable and non-negotiable"** — the 2% fee is **protocol policy**,
   not immutable. It is not enforced by deployed contract code, and "immutable law/protocol"
   is a failing claim under screen-audit Check 4.

3. **"Never 'seed phrase' → 'recovery words'"** under *JS Audit Rules* — **this rule is now a
   trap.** The Grid Account is MPC 2-of-3 via Squads v4 and has **no phrase of any kind**, so
   "recovery words" is a second forbidden claim, not the approved synonym. Both terms fail.
   The correct statement is *there is nothing to write down*. See Check 6a, 31 Jul.

Also noted, lower severity: *Grand Synchronicity* correctly carries 24 Jan 2027, but the
numerology framing no longer applies — the date no longer coincides with AJ's birthday.
And "MemeDAO governance" under *Sovereign by Default* is a superseded term (→ IN$DEX
Citizen Governance) per the God Mode Audit Doctrine, 13 Jul.

**Standing gap this exposes: no audit or purge has ever been run against `second-brain/`.**
Every sweep to date has targeted citizen-facing screens. ⏳ Flagged for AJ.

---

## Core Frameworks

### The Mama Noe Test
If an 80-year-old woman in Mele Village, Vanuatu — 50% smartphone confidence, no bank account, sells tuluk for $1.50 — can use this feature, it works. If she can't, rebuild it.

### Grand Synchronicity
24 January 2027. AJ's actual birthday is 24 September; the two dates no longer coincide, but "24" — his personally meaningful number — carries over. **[SUPERSEDED 2026-08-05 — a target price of $2.50 / ~10x was stated here and is withdrawn. No public price target exists. Original wording retained per the 2026-07-27 traceability convention; see CANON CORRECTION at the top of this file.]** This is not just a launch date — it's the civilisational alignment point the whole product is built toward.

### Civilisation Law
2% fee on every transaction. Not for the platform. For the civilisation. Funds the public goods layer. **[SUPERSEDED 2026-08-05 — this line read "Immutable and non-negotiable". The 2% fee is a permanent commitment and protocol policy, but it is NOT enforced by deployed contract code, so "immutable" must not be stated. See CANON CORRECTION at the top of this file.]**

### The Cybertron Pattern
Every screen gets: hex canvas (22 nodes, 22fps, velocity 0.36) + 3 genuinely interactive JS features. Pattern A for screens with .shell, Pattern B for screens without. Canvas always at z-index:0, content at z-index:1.

### Digital Feudalism
The problem IN$DEX solves. Platforms that extract value from users rather than returning it. Centralised exchanges, mandatory KYC, walled gardens. SIINDEX is the antidote.

### Sovereign by Default
Citizens own their identity (Web3 domain), their assets (non-custodial wallet), and the value they create (INDX rewards, MemeDAO governance). Nobody can take it away.

### Macro Validation — Why Now (Session 87, Jul 2026)
External institutional signals used to validate launch timing, not just internal conviction: Larry Fink (BlackRock CEO) quote, OUSD-on-Solana consortium launch (13+ partners), X Money APY comparison (22.4% vs 6%), crypto cycle-bottom timing, 1.54B unbanked TAM. Deployed identically across home-v2.html, siindex-brief.html, and whitepaper-v1.md as a convergence argument pointing at Grand Synchronicity (24 Jan 2027).

## Technical Knowledge

### JS Audit Rules
- Never 0.35 in JS price/value context → the canonical INDX price is 0.24 (the old "use 0.36"
  here was a transcription error: 0.36 is the Cybertron canvas velocity, never a price)
- Never A$ or AUD in display strings → USD only
- Never "seed phrase" — and never "recovery words" either. **[SUPERSEDED 2026-08-05 — this
  line read `Never "seed phrase" → "recovery words"`. Both terms are forbidden: the Grid
  Account is MPC 2-of-3 via Squads v4 and has no phrase of any kind. Say "2-of-3 MPC keys,
  nothing to write down".]**
- localStorage namespace: `indx_[screen]_[purpose]`
- INDX_PRICE_USD = 0.24 (constant, never hardcode 0.35)

### Screen Architecture
- All screens: mobile-first, 430px max-width
- Brand CSS vars: --cyan, --blue, --purple, --green, --gold, --red, --surface, --surface2, --border
- sessionStorage: citizen_id, citizen_name, citizen_wisdom, citizen_balance, citizen_web3_domain
- Toast: existing showToast() — never duplicate

### The local repo is not evidence of what production runs (2026-08-05)
See [[production-vs-repo-drift]]. Third recorded instance. An instruction to a model is a request; a server-side transform is a guarantee. Fetch the deployed artifact before diagnosing it, and pull any production-only fix back into the repo the same day.

## Strategic Insights

- The coconut girl / Mama Noe framing is the most powerful pitch tool — use it in all external comms
- Web3 domain on signup (yourname.IN$DEX) is the killer differentiator vs all competitors
- SIINDEX PQSI (Synthetic Intelligence layer) operating continuously is a competitive moat — no competitor has this
- Grand Synchronicity creates urgency without artificial scarcity — it's a date, not a countdown clock
