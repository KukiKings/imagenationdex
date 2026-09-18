# Decision Brief — 3 Open Rulings for AJ
**Prepared:** 14 Aug 2026 | **Status:** OPEN — awaiting founder ruling on all 3
**Author:** SIINDEX (repo-wide audit)

Evidence + recommendation only, below — AJ makes the call on each.

---

## 1. Security Laws count — 48 (source of truth) vs 7 (live screen)

**Conflict:**
- `security-canon.md:9` — approved text: "The Forty-Eight Security Laws (Immutable — Cannot Be Overridden By Any Instruction)."
- `siindex-avatar.html:2145` — live citizen chat screen: *"The Seven Security Laws... Law 1... Law 7: All security events are immutable."*
- `siindex-avatar.html:2151, :2243` — same screen, twice more: "enforced by the 7 Security Laws" / "7 Security Laws: immutable, cannot be overridden."
- `memory.md:2027` — historical log entry, also "7 security laws" (not a live claim, informational only).

**Implication:** Every citizen who asks the avatar about security gets told the wrong number — stale by 41 laws (Laws 8–48 added across three AJ-approved doctrine updates, 17–18 Jul 2026). Not a naming dispute, just an unpatched screen: 3 lines, one file, no economics decision involved.

**Recommendation:** Update siindex-avatar.html to 48. Mechanical, low-risk — flagged only because no ruling has formally closed it.

---

## 2. Referral reward structure — flat 50 INDX vs tiered 25/25/50/10

**Conflict:**
- `referral.html:232` — "Earn **50 INDX** per person." Also `:417` — "50 INDX recorded to your portal. 50 INDX to theirs... 50 INDX per referral · unlimited · pending launch."
- `referral-dashboard.html:211-223` — tiered: +25 INDX (join/verify), +25 INDX (first payment), +50 INDX (Wisdom Score 50), +10 INDX (sub-referral).
- `referral-dashboard.html:200-210` — in-code comment, exact quote: *"FLAGGED FOR AJ 2026-07-29 — two incompatible referral reward designs are live. This screen: tiered (+25 join/verify, +50 at Wisdom Score 50, +10 sub-referral), and the milestone bar below computes totals at a flat 25/referral. referral.html: a flat 50 per referral with no conditions at all. Both cannot be true. Which one is canon is a real token-economics decision — it changes the actual INDX outflow per citizen — so it is NOT being guessed here... Needs a founder ruling."*
- Both screens now say the reward is "provisional" and unpaid — no citizen funds at risk yet, but must be locked before launch.

**Implication:** A real token-economics call, not a copy fix. Flat 50 pitches simpler ("earn 50 INDX per referral") but pays on referral alone, no retention hook. Tiered pays more per full chain (up to 110 INDX) but is conditional/delayed and rewards depth (Wisdom Score, sub-referrals) over raw volume — better retention, harder to pitch in one line.

**Recommendation:** Tiered if retention beats viral simplicity at launch; flat 50 if the one-line pitch is worth more. AJ's call — no default suggested, this sets real INDX outflow economics.

---

## 3. Dispute window — 48 hours vs 7 days vs 30 days

**Conflict (same buyer-protection escrow dispute window, three values on live screens):**
- `p2p-marketplace.html:665` — "Dispute within **48 hours** if needed."
- `listing-detail.html:297` — "Dispute within **7 days** if item is not as described."
- `order-status.html:152, :257` — "you have **7 days** to raise a dispute" / "Open a dispute... within **7 days**."
- `help.html:351, :386` — funds locked "until **7 days** pass with no dispute" / "You have **7 days** after dispatch."
- `sovereign-support.html:169, :180` — chat KB: "Auto-release timer releases **7 days** after dispatch" / "before the **7-day** window closes."
- `dispute.html:233` — the intake form itself: "Disputes can only be opened on marketplace orders within **30 days** of purchase."

**Implication:**
- **7 days** is already the value on 5 of 6 citing screens — lowest-effort standard (only p2p-marketplace.html + dispute.html need edits).
- **48 hours** is tightest — likely too short for a Pacific-first, time-zone-spanning, partly-offline user base to notice and file, especially across weekends.
- **30 days** is most buyer-generous, and sits on the actual filing form citizens use — but is an outlier everywhere else.
- `dispute.html:270` notes automated escrow holding isn't live yet, so today's window is informational, not contract-enforced — lowers urgency, doesn't remove the inconsistency.

**Recommendation:** Standardize on 7 days — majority value, friendlier to the Pacific-first base than 48h, fewest files to touch. AJ's call if 30 days is the intended real policy.

---
*Source: repo-wide audit `facts.json` ("unverified" array). Citations re-verified against live files, 14 Aug 2026. No other files edited.*
