# SlowMist

**Type:** Blockchain security firm / incident research (not a partner — a source).
**Relationship to IN$DEX:** Cited source, not a vendor. No contact, no engagement.

**Why it's in the record (2026-07-30):**
Source for the Solana `assign` owner-reassignment drain pattern in `pqsi-hardening-research-2026-07-30.md` §1.2 — reported by SlowMist as mirroring the "malicious multisig" pattern previously seen on TRON. That finding is the reason **PQSI v1 was abandoned before it was ever applied**: `assign` moves zero tokens at signing, so v1 scored it T0 — ALLOW.

**Caveat carried from the research doc:** the mechanism is verified from Solana's own documentation; the end-to-end drain has **not** been independently reproduced by SIINDEX. Exact exploitation conditions need a devnet reproduction before being presented externally.

**Status:** Source of record. No relationship.
