# Squads Protocol

**Type:** Solana-native multisig / smart account protocol (squads.so) — v4 protocol underpins programmable multi-party account control; Squads Labs also ships the "Grid" account/API product line
**Relevance to IN$DEX:** Named custody architecture for the citizen **Grid Account** (declared in AUSTRAC compliance drafts, 14 Jul 2026):
- Grid Account = Squads Protocol v4 multisig with **2-of-3 MPC keys** (device, cloud, recovery)
- No seed phrases exist for citizens; no single party — including the platform — can move funds alone
- Cited in `compliance-readiness/01-aml-ctf-program-part-a.md` (service line 3: custody/administration of virtual assets) and `03-business-description.md`
- Front-end: `grid-account-onboarding.html` (Grid Account onboarding flow)
**Status:** Declared custody model in AUSTRAC enrolment documents. On-chain implementation status unconfirmed — verify whether Squads v4 integration is built or planning-only before regulator follow-up.

## Orphan note
Created by nightly brain pass (2026-07-14) — first canonical mention in the compliance-readiness folder and grid-account-onboarding.html, no dedicated file existed.

---

## 2026-07-30 — features already paid for and switched off

Squads v4 ships **time locks** and **spending limits** natively, audited by **Neodyme** and **OtterSec**. Neither is configured on IN$DEX. Per `pqsi-hardening-research-2026-07-30.md` Addition 4, this is one of the two highest-value / near-zero-cost security wins currently available (the other is making stable INDX programs immutable with `--final`).

Related open founder decision (#1 of six): **confirm the citizen Grid Account stays 2-of-3, set the treasury multisig threshold higher, and correct canon to distinguish the two.** They are currently described as if they were the same thing.

Standing caveat, unchanged: the Squads v4 2-of-3 MPC model was **declared to AUSTRAC on 14 Jul 2026** as IN$DEX's custody arrangement. On-chain implementation status remains unconfirmed — the declared model must be built before launch.
