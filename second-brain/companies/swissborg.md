# SwissBorg

**Type:** Swiss crypto wealth-management platform.
**Relationship to IN$DEX:** None. Case study only.

**Why it's in the record (2026-07-30):**
The canonical `setAuthority` loss case in `pqsi-hardening-research-2026-07-30.md` §1.3. SwissBorg lost **192,600 SOL (~$41M)** to an SPL token-account authority reassignment sequenced inside a single atomic transaction that presented as a routine unstake. The attacker then **waited eight days** before draining.

**Two design consequences for IN$DEX, both now in PQSI v2:**
1. Zero-balance-movement transactions can be total-loss events — classify **instructions**, not amounts (Addition 1).
2. A classification at approval time is worthless if execution is days later — **re-classify at execution, never trust a prior approval** (Addition 2). SwissBorg's gap was eight days; Drift's was over a week.

**Status:** Case study. No relationship.
