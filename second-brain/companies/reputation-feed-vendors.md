# Address / Transaction Reputation Feeds — vendor shortlist (UNDECIDED)

**Type:** Commercial security + compliance data vendors.
**Relationship to IN$DEX:** **Open founder decision.** None engaged, none priced.

**Shortlist named in `pqsi-hardening-research-2026-07-30.md` (Addition 6, decision #3):**
- **Blockaid** — transaction simulation + malicious-address feed
- **GoPlus** — open security intelligence
- **TRM Labs** — compliance/sanctions + risk scoring
- **Chainalysis** — compliance/sanctions + risk scoring

**The requirement:** an external reputation feed as an additional threat-tier-raising input, with the **local blocklist retained as an override that can always be stricter** — never looser. Separately, sanctions screening (OFAC/UN/EU) needs a real list behind it: `transaction-confirm.html` currently renders that check as a **hardcoded pass**, honestly labelled `EXAMPLE` since 2026-07-29.

**Why this can't drift:** a live AUSTRAC VASP/RSP registration is under assessment. A sanctions check that is a hardcoded `✓` is exactly the class of claim the 22 Jul fabrication sweep was called for.

**The decision AJ owes:** pick one and fund it — **or be able to name the choice and the date in December.** All four are commercial; there is no free path.

**Related:** [[chainalysis]] and [[elliptic]] also appear as FATF Recommendation 15 / Travel Rule sources in the same document.

**Status:** ⏳ UNDECIDED. Launch gate.
