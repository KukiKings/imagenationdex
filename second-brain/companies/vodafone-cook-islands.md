# Vodafone Cook Islands

**Type:** Telecommunications carrier — the mobile network for IN$DEX's home jurisdiction.
**Relationship to IN$DEX:** None yet. **A conversation AJ needs to have.**

**Why it's in the record (2026-07-30):**
Tier 0 identity is a phone number and nothing else (founder decision 2026-07-27, correctly made for financial inclusion). That makes **the SIM the single point of failure for the entire account**, and SIM swap is the most common route to consumer crypto theft — it defeats phone-based recovery completely.

`pqsi-hardening-research-2026-07-30.md` Addition 9 treats this as *the* structural gap, and lists it as decision **#6 that only AJ can make**: a **port-out lock conversation with Vodafone Cook Islands.** Code-side mitigations (cooling-off period on device/SIM change, guardian approval) are drafted in `supabase/migrations/20260730_pqsi_g5_simswap.sql` — written, **not applied**.

**Supporting figures (FBI IC3):** most SIM swapping is done to steal cryptocurrency — 982 complaints / ~$26M (2024), 1,075 attacks / ~$50M (2023). IDCARE reported a 240% surge in 2024.

**Status:** ⏳ No contact made. Carrier-side control is the half of the mitigation that code cannot supply.
