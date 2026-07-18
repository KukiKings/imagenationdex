# Media, Design, Communication & Publishing — Reality Ledger
> 18 Jul 2026. Maps the SIINDEX Sovereign Media, Design, Communication, and Publishing Operating System (`siindex-media-design-publishing-constitution.md`) against real research and the current IN$DEX codebase. Written before any build, per the project's standing pattern (see Presence Layer, Citizen Shield, Financial/Institutional Survival ledgers).

---

## 1. Current build reality — honest baseline

Grepped the full project for every system this doctrine says it "connects to": **App Factory, Generative Interface OS, Product Truth Registry, Cultural Rights Review, Sovereign Avatar Presence Layer.** None exist as code. There is no render pipeline, no publishing-account integration, no brand-token file (colours live only as a hex list in `CLAUDE.md`), no Media Mission Contract schema, no Claim Ledger, no Content Atom Graph, no Secrets Broker for publishing credentials, and no C2PA signing capability anywhere in this repo.

This doctrine is 56 sections describing a mature media operating system. As of today, IN$DEX's actual media capability is: hand-written HTML screens, a fixed brand palette, and no automated content generation, rendering, or publishing pipeline of any kind. That gap is the single most important fact in this ledger — everything below should be read against it.

---

## 2. Research findings — verified, corrected, or extended

### 2.1 C2PA Content Credentials (doc §19, §21, §46)
Verified accurate as far as it goes: C2PA has moved from niche standard to production infrastructure in 2026 — Adobe, OpenAI, Google Search, and major newsrooms (BBC, Reuters, AP, NYT) now sign or surface Content Credentials. The doc's own caveat is correct: "a valid credential does not prove the image is fair, accurate, legally owned, or shown in the right context, and missing credentials are not proof of AI generation."

**Crucial addition:** what the doc doesn't say — Content Credentials are commonly stripped by re-encoding, screenshotting, or re-uploading through most social platforms. This is a known, documented limitation, not a hypothetical. Law 69/§21 should not treat a C2PA credential as a durable authenticity guarantee on anything that leaves IN$DEX's own domain — it should be one signal among several (publisher signature + IN$DEX-hosted publication receipt + asset digest lookup), with the IN$DEX-hosted verification page as the actual source of truth, since the embedded credential may not survive the trip through Instagram/TikTok/WhatsApp.

**Crucial addition #2 (operationally urgent, not just theoretical):** TikTok in 2026 runs automated C2PA-based synthetic-media detection and labels content as AI-generated even when the creator does not self-disclose. If IN$DEX ever publishes official media to TikTok without embedding Content Credentials, TikTok's own system may auto-flag legitimate SIINDEX-made content as "undisclosed AI" — a reputational and possibly platform-penalty risk. This means Phase 10 ("Provenance and receipts") in the doc's own sequence is listed too late — basic Content Credential embedding should move into Phase 4 (static carousel factory), not wait until after animation and publishing are already live.

### 2.2 WCAG 2.2 (doc §14, §15)
Verified accurate. WCAG 2.2 (October 2023) adds nine success criteria on top of 2.1 — focus visibility, target size, dragging alternatives, accessible authentication, consistent help — plus the existing 1.1.1 (non-text content / alt text), 1.2.4 (captions), and the 4.5:1 text-contrast / 3:1 non-text-contrast thresholds the doc cites. No correction needed; this section can be adopted as written, and the specific numeric thresholds (4.5:1, 3:1) are worth pulling into the condensed law text since they're testable.

### 2.3 Australian synthetic-media / deepfake law (doc §17, §20, §64, §66 — not otherwise cited)
This is the doctrine's biggest gap. AJ is a sole trader operating from Australia, and Australia has real, current, criminal-level deepfake legislation the doc never names:

- Nation-leading Commonwealth changes now make it an offence to create invasive, humiliating, or degrading AI/digitally-generated images resembling a real person — penalties up to $20,000 or four years' imprisonment.
- NSW amended the Crimes Act 1900 (effective from 16 Feb 2026) to cover deepfakes regardless of how they were made.
- South Australia closed a gap so fully AI-generated deepfakes (not just edited real images) are captured.
- A federal bill (Online Safety and Other Legislation Amendment — "My Face, My Rights" — introduced by Senator Pocock) would broadly prohibit digitally altered or AI-generated face/voice content without consent, beyond the current sexually-explicit focus.

**Crucial addition:** Law 64 (impersonation) and Law 17 (likeness/voice rights) currently read as internal policy. They should explicitly cite this as binding Australian law, not just good practice — meaning the "likeness_consents" table (§49) needs to record consent in a form that would hold up as evidence of authorisation under these statutes (verified identity, explicit scope, revocation), because the honest legal exposure here is real and current, not hypothetical. This is the single most concrete, actionable legal-risk finding in this research pass.

### 2.4 Platform AI-disclosure policies (doc §12, §20 — not otherwise cited)
- TikTok (2026): requires visible labels on AI-generated visuals/audio depicting realistic people or scenes, and auto-detects via C2PA even without creator disclosure.
- YouTube: requires manual creator disclosure for "realistic altered or synthetic content" since 2024/2025, with enforcement penalties for repeated non-disclosure.
- Meta: relies on self-declaration plus third-party embedded metadata; no automated detection yet.

**Crucial addition:** the Platform Adapter Registry (§12) should carry a per-platform "AI disclosure requirement" field (mandatory label, manual self-disclosure, or none) as a first-class adapter property, not something the Content Role Council figures out per-post. Getting this wrong on TikTok specifically risks automated, not just policy, consequences.

### 2.5 Indigenous Cultural and Intellectual Property — True Tracks (doc §16, §38, §54)
The doc's Law 65 and Cultural Media Constitution are correct in spirit but generic ("appropriate rights path"). The concrete, authoritative framework for exactly this — used across Australia and referenced in Pacific traditional-knowledge work (Terri Janke, who also worked on WIPO's Pacific Traditional Knowledge Action Plan) — is the **True Tracks** framework: ten principles built on self-determination, prior informed consent, respect, recognition and protection of ICIP, secrecy and privacy for sacred/restricted material, attribution, benefit-sharing, and control over commercial use.

**Crucial addition:** name True Tracks (or an equivalent Pacific-specific protocol if AJ has a preferred Cook Islands authority) as the actual operative standard behind Law 65, rather than leaving "cultural rights path" undefined. This matters directly for the project's own example content (Cook Islands Māori carousel, §3) and gives Cultural Reviewer (§9) and Cultural Rights Review a real external standard to check against instead of ad hoc internal judgment.

### 2.6 Australian advertising/consumer law (doc §7 Brand Truth, §61-63 Claim Ledger — not otherwise cited)
- ACCC: advertising claims must be true, accurate, and based on reasonable grounds — businesses must be able to *prove* any claim, with real penalties (up to millions per contravention for corporations).
- AANA Children's Advertising Code (effective 1 Dec 2023): governs advertising/marketing to children — no undue purchase pressure, no exploiting naivety, no unsafe behaviour.
- Spam Act 2003: any commercial electronic message (email, SMS — directly relevant to the doc's "newsletters" media type) requires consent and a working unsubscribe mechanism.

**Crucial addition #1:** the Claim Ledger (§6) evidence-strength grading should explicitly target the ACCC's "reasonable grounds" evidentiary bar as its minimum acceptable standard for any claim used in external/public content — not just an internal confidence score. This is the same substantiation standard IN$DEX would be held to if the ACCC investigated a claim.

**Crucial addition #2:** the doctrine never mentions the Spam Act's consent/unsubscribe requirement even though "newsletters" is explicitly listed as a supported media type (canonical purpose list) and Section 34 covers merchant/customer communication. Any email or SMS output from this system needs a consent record and unsubscribe mechanism as a hard publication gate — this is a real omission, not a style choice.

**Crucial addition #3:** Law 66 (children) should cite the AANA Children's Advertising Code by name as the concrete enforceable standard, since IN$DEX's own use cases include "Teacher OS," "parent updates," and "student activities" (§36) that could plausibly cross into advertising-adjacent content.

---

## 3. Recommended honest buildable subset

Given the 0%-built baseline (Section 1), adopting all 56 sections and 12 phases at once would repeat a pattern this project has already corrected for in every prior doctrine intake (Presence Layer, Citizen Shield, Financial/Institutional Survival): treating an aspirational doctrine as current fact. Recommend the same approach used there:

1. **Adopt the doctrine and the 12 constitutional laws now** (already done — see companion canon doc), with an explicit honest caveat that zero supporting infrastructure exists.
2. **Do not start Phase 1-12 build work without a separate go-ahead.** This ledger is research and canon-adoption only, not a build authorization.
3. **If/when AJ wants to start building**, the doc's own Phase 0 (Truth foundation) is the correct starting point, and should absorb the crucial additions above before Phase 1 begins: Product Truth Registry, brand tokens formalised as a real file (not just CLAUDE.md hex codes), and — new, from this research — a minimal Consent & Rights ledger covering both likeness (Australian deepfake-law-grade consent) and cultural rights (True Tracks-aligned) before any citizen or cultural image is ever touched by a generation pipeline.

---

## 4. Proposed law additions for security-canon.md

Beyond the doc's own 12 laws (61-72, already condensed as Laws 22-33 in the companion proposal), this research surfaces one additional standalone law worth proposing, since it isn't really "media policy" — it's a hard legal-exposure fact about the founder's current sole-trader status:

**Proposed Law 34 — Likeness and Cultural Rights Require Evidentiary-Grade Consent.** Any media depicting an identifiable person or cultural material must record consent sufficient to stand as evidence under applicable law (Australian Commonwealth/NSW/SA deepfake statutes for likeness; True Tracks principles for Indigenous/Pacific cultural material) — not merely an internal checkbox. HONEST CAVEAT: no `likeness_consents` or `cultural_permissions` table exists yet; this law states the required standard for when that table is built, not current practice, since the system has generated zero media of any kind to date.

This keeps the "crucial additions" grounded in what the research actually found, rather than inventing new doctrine.
