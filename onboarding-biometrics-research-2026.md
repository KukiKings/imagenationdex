# Should Tier 0 Onboarding Use a Face Scan?

**Created:** 2026-07-29
**Question:** AJ asked whether a face scan at onboarding is a security risk, and what the best option is.
**Short answer:** your 27 July decision to remove it was right, and better-founded than the record shows. **Keep phone-only.** The evidence has moved decisively against face scan at onboarding in the last eighteen months.

---

## 1. Face liveness is the attack surface now, not the defence

The threat model changed. These are current, sourced figures:

| Finding | Source |
|---|---|
| Injection attacks against face liveness rose **783% in 2024** alone | Industry benchmark |
| Injection attacks surged **ninefold year-on-year** from early 2024 to early 2026 | Benchmark spanning the period |
| **8,065 documented attempts** to bypass a *single* financial institution's liveness checks using AI-generated deepfakes, Jan–Aug 2025 | Group-IB *Weaponized AI* report, Jan 2026 |
| **FATF's own December 2025 Horizon Scan** explicitly names deepfakes as capable of bypassing AML controls, CDD systems and **digital ID verification at onboarding** | FATF |
| Gartner predicted that by 2026, **30% of enterprises** would consider standalone identity verification unreliable in isolation because of AI-generated deepfakes | Gartner, Feb 2024 |

**Why this is worse than it sounds.** The dominant attack is *injection*, not presentation. It doesn't hold a photo up to a camera — it **bypasses the camera entirely**, feeding a synthetic video stream directly into the verification API between the device and the server. Blink-detection, head-turn prompts and challenge-response do nothing against it, because there is no real camera in the loop.

**Most liveness systems built before 2022 have no injection-attack detection at all.** It wasn't in the design. Any face-scan flow specified before then — including the one previously described in IN$DEX's screens — is defending against the wrong attack.

---

## 2. Biometrics are the one credential that cannot be reset

A leaked password is changed in ten seconds. A leaked phone number is replaced in a day.

**A leaked face is permanent.** The citizen carries that exposure for life, across every other service that ever uses face verification. For a platform whose stated purpose is protecting people the financial system already failed, collecting an irrevocable credential is a materially different undertaking from collecting a phone number — and the liability does not expire.

This also inverts a claim IN$DEX has been making. The screens said *"your face never leaves your phone."* On-device processing genuinely reduces exposure, but it does not eliminate it: the template still has to be transmitted or attested somewhere to be useful, and the injection attack above happens **before** any on-device protection applies.

---

## 3. FATF does not require biometrics — and its guidance points the other way

This is the finding that settles it, because it removes the "we have to" argument entirely.

FATF's *Guidance on Digital Identity* is explicit:

- CDD follows a **risk-based approach**. No specific verification technology is mandated, and biometrics are nowhere required.
- **Non-face-to-face onboarding** using reliable digital ID with appropriate mitigation *"may present a standard level of risk, and may even be lower-risk."*
- Digital ID systems with different assurance levels *"can be used to implement **tiered CDD**, allowing clients a range of account functionalities depending on the extent of CDD performed, particularly in situations of lower risk."*
- The guidance explicitly supports **financial inclusion**, in line with FATF's 2017 supplement on CDD and financial inclusion.
- Accepting lower assurance levels, **delayed verification**, and digital copies are all named as legitimate parts of the risk-based approach.

**That is a precise description of Progressive KYC: Tier 0 phone-only, with verification deepening as balances and risk grow.** The architecture already in canon is not a compromise against FATF — it is what FATF describes.

Worth carrying into the FSC meeting on 10 December: *"we deliberately collect no biometrics at onboarding, under a tiered risk-based CDD model, consistent with FATF's digital identity guidance"* is a stronger position than *"we scan every face"* — and it is a much better answer than having to explain a deepfake bypass later.

---

## 4. For IN$DEX's actual users, face scan is exclusionary

The demographic is the point. Unbanked Pacific citizens, often on low-end Android phones, frequently on poor connectivity, sometimes with poor lighting, sometimes elderly.

Face scan fails these users disproportionately: weak front cameras, bandwidth cost of uploading video, failure rates for darker skin tones in many commercial liveness systems, and outright exclusion for some disabilities.

**A verification step that fails Mama Noe is not a security control — it is a door she cannot open.** Every failed scan is a citizen who does not onboard. That is the opposite of the mission, and it is a cost paid entirely by the people IN$DEX exists to serve.

---

## 5. The honest case *for* biometrics, and why it doesn't apply here

Being fair to the other side. Face verification genuinely helps with:

- **Higher-value accounts**, where the assurance justifies the friction and cost
- **Duplicate/sybil prevention** — stopping one person opening many accounts

The second is a real gap and deserves a straight answer, because **the Genesis recognition is 50 INDX per citizen for the first 5,000**. What stops one person farming 5,000 accounts?

Three things, none of which is biometrics:

1. **Phone-number uniqueness.** Not perfect — SIM farms exist — but it is real friction at scale.
2. **Rate limiting and device signals**, which are already implemented in the deployed edge functions.
3. **The recognition is `pending_review` and is not automatically transferred.** This is the strongest control and it already exists by design. A farmed account gets a ledger row, not spendable INDX. Fraud that yields nothing is not worth committing.

**Sybil resistance is a treasury-controls problem, not an identity-proofing problem.** Solving it with face scans would mean collecting irrevocable biometrics from 100% of citizens to defend against a subset who would gain nothing anyway.

---

## Recommendation

**Keep Tier 0 as phone number only. Do not reinstate face scan at onboarding.**

Your 27 July decision holds, and the research strengthens it on four independent grounds: the attack surface has moved decisively against liveness, biometrics are irrevocable, FATF does not require them and its guidance actively describes the tiered model you already have, and face scan excludes the exact people IN$DEX is for.

**If a face-verified credential is ever wanted**, the conditions should be:

- **Optional, never required to start** — a Tier 1+ step tied to higher limits, exactly as the current code comments already describe
- **Only with injection-attack detection (IAD)** — a vendor capability, not something to build. Anything without IAD is defending against a 2019 threat model.
- **Only when there is budget for it.** Real IAD-capable verification is a recurring per-check vendor cost. Against ~USD $2,000 of total available capital, this is not affordable now, and a cheap liveness check is worse than none — it creates the *appearance* of security while being the specific thing attackers have automated.

**What to keep saying, because it is true and defensible:** no documents, no face scan, no biometrics at Tier 0 — just a phone number, with verification deepening only as balances and risk grow, under a risk-based model consistent with FATF digital identity guidance.

---

## Consequence for the record

The Uncle Mac letter previously read *"just a phone and a face scan to open an account."* That described the flow removed on 27 July. Corrected to phone-only — which this research confirms is both the shipped behaviour and the right one.

No files need reverting. The 15 corrections made on 2026-07-29 stand.
