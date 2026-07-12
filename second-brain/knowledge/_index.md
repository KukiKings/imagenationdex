# Knowledge

Extracted insights, frameworks, and non-obvious observations that make SIINDEX what it is.

## Core Frameworks

### The Mama Noe Test
If an 80-year-old woman in Mele Village, Vanuatu — 50% smartphone confidence, no bank account, sells tuluk for $1.50 — can use this feature, it works. If she can't, rebuild it.

### Grand Synchronicity
24 September 2026. AJ's birthday. INDX target price $2.50 (from $0.24 genesis = ~10x). This is not just a launch date — it's the civilisational alignment point the whole product is built toward.

### Civilisation Law
2% fee on every transaction. Not for the platform. For the civilisation. Funds the public goods layer. Immutable and non-negotiable.

### The Cybertron Pattern
Every screen gets: hex canvas (22 nodes, 22fps, velocity 0.36) + 3 genuinely interactive JS features. Pattern A for screens with .shell, Pattern B for screens without. Canvas always at z-index:0, content at z-index:1.

### Digital Feudalism
The problem IN$DEX solves. Platforms that extract value from users rather than returning it. Centralised exchanges, mandatory KYC, walled gardens. SIINDEX is the antidote.

### Sovereign by Default
Citizens own their identity (Web3 domain), their assets (non-custodial wallet), and the value they create (INDX rewards, MemeDAO governance). Nobody can take it away.

### Macro Validation — Why Now (Session 87, Jul 2026)
External institutional signals used to validate launch timing, not just internal conviction: Larry Fink (BlackRock CEO) quote, OUSD-on-Solana consortium launch (13+ partners), X Money APY comparison (22.4% vs 6%), crypto cycle-bottom timing, 1.54B unbanked TAM. Deployed identically across home-v2.html, siindex-brief.html, and whitepaper-v1.md as a convergence argument pointing at Grand Synchronicity (24 Sep 2026).

## Technical Knowledge

### JS Audit Rules
- Never 0.35 in JS price/value context → use 0.36
- Never A$ or AUD in display strings → USD only
- Never "seed phrase" → "recovery words"
- localStorage namespace: `indx_[screen]_[purpose]`
- INDX_PRICE_USD = 0.24 (constant, never hardcode 0.35)

### Screen Architecture
- All screens: mobile-first, 430px max-width
- Brand CSS vars: --cyan, --blue, --purple, --green, --gold, --red, --surface, --surface2, --border
- sessionStorage: citizen_id, citizen_name, citizen_wisdom, citizen_balance, citizen_web3_domain
- Toast: existing showToast() — never duplicate

## Strategic Insights

- The coconut girl / Mama Noe framing is the most powerful pitch tool — use it in all external comms
- Web3 domain on signup (yourname.IN$DEX) is the killer differentiator vs all competitors
- SIINDEX QPSI (autonomous AI layer) running 24/7 is a competitive moat — no competitor has this
- Grand Synchronicity creates urgency without artificial scarcity — it's a date, not a countdown clock
