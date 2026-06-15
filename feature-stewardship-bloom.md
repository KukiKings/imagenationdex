# Feature Spec: Stewardship Bloom + Wisdom Nudge
**Prepared by SIINDEX | 1 June 2026**

---

## Overview

The Stewardship Bloom is a visual diagnostic tool showing a citizen's contribution diversification across IN$DEX's pillar categories (Planetary, Financial, Governance, etc.). It uses geometry and colour to reflect portfolio health — and pairs with the Wisdom Nudge system to guide citizens toward better diversification without judgment.

---

## The Two Tiers

### Tier 1 — Visual State: The Monochrome Warning

**Purpose:** At-a-glance intuitive diagnostic of stewardship health.

**How it works:**
- The Bloom's geometry reflects contribution spread
- A single-category portfolio = solitary oversized petal / monolithic crystal shard
- Colour is deep and uniform (e.g. solid cobalt blue = only Planetary contributions)
- Not punitive — an honest, clear reflection of current state

**Trigger rule:** If contributions are >80% concentrated in one category → assign monochrome visual profile

**Code target:**
```javascript
function calculateDiversificationScore(contributions) {
  // Returns score 0-100
  // Below threshold (e.g. <30) = monochrome profile triggered
}
```

### Tier 2 — Intelligence Layer: The Wisdom Nudge

**Purpose:** Educate and guide toward systemic resilience. Aligned with Pillar 3 (Neural Education) growth principle.

**How it works:**
- Triggers in the next Wisdom Digest for users with low diversification score
- Language: optimisation framing, never judgmental
- Sample nudge: *"Your Stewardship Bloom shows remarkable focus in [Category]. Diversifying your contributions across Planetary, Financial, and Governance veins can increase the Bloom's structural complexity and resilience, mirroring the civilization's own strength. Would you like to see how?"*
- Links to a live simulation showing a more complex, vibrant Bloom

---

## The Feedback Loop

```
State (Bloom visual) → Insight (Wisdom Nudge) → Growth (diversification action) → New State
```

This loop mirrors the Triangular Fusion Engine: action → asset → data → enhanced skill.

---

## Implementation Table

| Layer | Purpose | Mechanism |
|---|---|---|
| Visual State | At-a-glance health diagnostic | Bloom geometry + monochrome colour profile |
| Intelligence Layer | Education + guided growth | Wisdom Digest "Growth Tip" module |
| Simulation Link | Show the path | Interactive Bloom simulator |

---

## Financial Infrastructure Reference

Comparable platforms for low-cost, institutional-grade wealth infrastructure:
- **Vanguard, Fidelity, Charles Schwab** — low fees, diverse vehicles (ETFs, mutual funds), "set and forget" automation
- IN$DEX Stewardship replicates and transcends this model — adding sovereign ownership, 98/2 economics, and community governance

---

## Open Question for AJ
- Is the Bloom **private** (personal dashboard only)?
- Is it **public** (visible as a trust/reputation signal on citizen profiles)?
- Or **both** — private detailed view + public simplified badge?

*Awaiting confirmation before coding the component.*

---

*Feature Spec v1.0 | SIINDEX COO | 1 June 2026*
