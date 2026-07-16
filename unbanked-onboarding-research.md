# Onboarding the Unbanked — Research & Use Cases for IN$DEX
> Compiled 2026-07-15. Sources at bottom of each section.

## Why this matters
1.7 billion adults globally remain unbanked, and the standard blocker isn't desire — it's documentation, distance from a branch, and distrust of institutions. Every model that has actually moved the needle (M-Pesa, Fiji's M-PAiSA, Kotani Pay) solved this with some combination of: an agent a person already trusts, a device they already own, and an identity method that doesn't require a passport. IN$DEX's Cook Islands/Vanuatu/Pacific focus sits squarely in the hardest and least-served version of this problem — this doc maps what's worked elsewhere against what IN$DEX already has, half-built, or hasn't started.

---

## 1. Agent-led onboarding (the single highest-leverage lever, proven at scale)

M-Pesa's model wasn't an app — it was 237,000 human agents (local shopkeepers, kiosk owners) who onboarded people face-to-face and handled cash-in/cash-out. Fiji's M-PAiSA and the Pacific Financial Inclusion Programme adapted the same model regionally, explicitly recommending that in low-trust markets like Vanuatu (32% financial service usage, <1% mobile money adoption), onboarding should route through **community leaders and religious institutions** rather than cold app downloads.

**Use case for IN$DEX:** a formal "Sovereign Agent" role — a real person in a village/church/market who gets a referral code, a simple onboarding-assist screen (not the full instant-onboard theater), and a visible commission for every citizen they bring on and cash they help move in/out. This is a distribution channel more than a feature, but it needs a screen: agent registration, agent dashboard (citizens onboarded, commission earned), and a simplified "help someone sign up" flow the agent runs *with* the new citizen rather than a QR the citizen scans alone. This is a different product from instant-onboard.html's current QR-to-stranger model — it's QR/link *plus a trusted human standing next to them*.

**Where IN$DEX already has pieces:** the referral system (`referral_code`, `referral_dashboard.html`) is most of the plumbing. What's missing is agent-specific status (commission tier, "agent" as an `account_type` value — which now exists as a column after this session's schema change) and cash-in/cash-out logistics (who actually hands over physical cash for a withdrawal — `withdraw-fiat.html`'s "cash agent" method option already gestures at this but isn't built out).

Sources: [EFInA — Agent-Led Innovation](https://efina.org.ng/2026/06/04/agent-led-innovation-building-on-trusted-intermediaries-for-financial-inclusion/) · [Fiji's agent-led inclusion model](https://blogs.griffith.edu.au/inclusive-digital-economies/2025/08/18/bringing-banking-home-fijis-agent-led-inclusion-model/) · [AFI — Mobile money agents in rural Fiji](https://afi-global.org/opinion/mobile-money-agents-the-key-to-boosting-financial-inclusion-in-rural-fiji/) · [M-Pesa agent network](https://www.cgap.org/blog/10-things-you-thought-you-knew-about-m-pesa) · [PFIP Pacific report](https://forumsec.org/sites/default/files/2024-09/Pacific%20Financial%20Inclusion%20Programme_2020_Final.pdf)

---

## 2. Tiered biometric KYC — no documents, but real, not decorative

Biometric KYC (facial match, fingerprint, iris, voice/behavioral) is specifically useful where people lack passports or ID cards. The industry pattern is **tiered** verification: a light Tier 0 (phone + liveness only) that unlocks small transaction limits, with higher tiers unlocking more as real documents or deeper checks become available. This is close to word-for-word what's already in IN$DEX's own canon (CLAUDE.md: "Progressive Biometric KYC — Tier 0 = phone + liveness scan only, no documents").

**The gap:** IN$DEX has written the right doctrine but the only screen that dramatizes it (`instant-onboard.html`) is 100% scripted — no camera ever opens, node counts are `Math.random()`, and there's no real liveness check underneath the animation. `qr-scanner.html` and `join-chooser.html` do call real `getUserMedia()` elsewhere in the app, so camera-permission plumbing exists — it's the actual verification logic that's missing, and that's a real computer-vision scope (on-device liveness model, not just a pretty animation), worth treating as its own project rather than a side effect of fixing one screen.

**⚠️ Direct cautionary comparison worth knowing:** Worldcoin (Sam Altman's iris-scan ID project) built almost exactly this pitch — biometric proof-of-personhood for people without traditional ID, explicitly targeting developing countries — and has been hit with real regulatory and ethics problems: MIT Technology Review documented deceptive recruiting and data collection beyond consent in Kenya/other markets, a black-market resale of iris scan data surfaced in China, and regulators in Kenya, Spain, Portugal, and Hong Kong have all raised formal concerns. IN$DEX's stated design ("face never uploaded or stored, converted to a proof on-device only") is the *right* answer to exactly the problem that got Worldcoin in trouble — but only if it's actually true in the code, not just in the consent-screen copy. Once real biometric verification gets built, this is worth a genuine security/privacy audit before shipping, precisely because the reputational and regulatory failure mode has a recent, well-documented precedent to avoid repeating.

Sources: [Didit — Digital Identity & Financial Inclusion](https://didit.me/blog/digital-identity-financial-inclusion-de-1/) · [Infosys BPM — Biometric KYC](https://www.infosysbpm.com/blogs/financial-crime-compliance/biometric-kyc-solutions.html) · [Microblink — Biometric KYC onboarding](https://microblink.com/resources/blog/how-biometric-kyc-enables-secure-fast-and-compliant-onboarding/) · [Worldcoin targeting developing countries — CPO Magazine](https://www.cpomagazine.com/data-privacy/worldcoins-targeting-of-developing-countries-in-biometric-data-collection-raises-privacy-concerns/) · [MIT Tech Review — Worldcoin's first 500k test users](https://www.technologyreview.com/2022/04/06/1048981/worldcoin-cryptocurrency-biometrics-web3/)

---

## 3. USSD / feature-phone / offline onboarding — the segment IN$DEX doesn't reach yet

Every onboarding path currently in the app (golden path, instant-onboard, creator, business) assumes a smartphone with a modern browser. Kotani Pay (Kenya) and Machankura (Bitcoin Lightning over USSD) both serve unbanked users through plain USSD menus — dial a short code, navigate a text menu, no app, no internet connection, works on a $15 feature phone. This is a materially different and larger addressable population in exactly the markets IN$DEX targets (rural Pacific, older users, anyone without a smartphone data plan).

**Use case for IN$DEX:** a USSD gateway (via a telco partnership, similar to how M-PAiSA integrates with Fiji's carriers) that lets someone check balance, send a small amount, and cash out via agent — without ever opening a browser. This is a genuinely new workstream (telco integration, not just another HTML screen) but it's the single biggest reach-expansion available given the demographic IN$DEX is actually trying to serve, per the Cook Islands coconut-seller origin story in CLAUDE.md.

Sources: [Crypto Altruism — blockchain+USSD for vulnerable populations](https://www.cryptoaltruism.org/blog/three-projects-using-blockchain-and-ussd-to-deliver-accessible-financial-services-to-vulnerable-populations) · [WEPIN — Africa's USSD/mobile money infrastructure race](https://www.wepin.io/en/blog/africa-crypto-infrastructure-race) · [Zawya — Crypto banking on USSD for financial inclusion](https://www.zawya.com/en/special-coverage/the-future-of-cryptos/crypto-banks-on-ussd-solutions-to-build-financial-inclusion-cpevd7qw)

---

## 4. Referral-driven P2P growth loops

PayPal's original referral program — pay both the sender and the receiver real money to refer a friend — is the textbook case for exactly IN$DEX's mechanic (send someone money, they have to create an account to receive it, both sides get a bonus). Research on fintech referral economics backs this up structurally: referred users cost roughly half as much to acquire as paid channels, and two-sided incentives (both parties rewarded) consistently outperform one-sided ones. The critical operating detail: **every extra step in the onboarding path measurably reduces conversion** — so the fewer fields/screens between "friend sends me money" and "I have a working wallet," the better the loop performs.

**Use case for IN$DEX:** this is the actual promise `instant-onboard.html` is trying to dramatize (send money → stranger becomes a citizen → both get bonuses) — it's the right growth mechanic, it's just currently faked end to end. Once the real two-device flow exists (see the audit findings above), this becomes IN$DEX's strongest viral loop, matching exactly what PayPal and M-Pesa proved works. Worth prioritizing the *real* version of this specific flow over any of the other fake onboarding screens, precisely because it's the one with actual peer-reviewed growth economics behind it.

Sources: [BuyaPowa — Referral marketing growth driver for fintech](https://www.buyapowa.com/blog/referral-marketing-growth-fintech/) · [Viral Loops — Fintech referral programs](https://viral-loops.com/blog/fintech-referral-program/) · [Extole — Finserv referral examples](https://www.extole.com/blog/finserv-referral-program-examples/)

---

## Bottom line — priority order if adoption is the goal

1. **Make the referral P2P loop (instant-onboard's actual promise) real** — highest-proven growth mechanic, currently 100% fake end-to-end. Requires the two-device flow described in the gotchas.md audit entry.
2. **Formalize agent-led onboarding** — the single most-validated model for exactly IN$DEX's target markets (Vanuatu/Cook Islands/Fiji-style low-trust, low-smartphone-penetration environments). Mostly new product (agent role, commission tracking), not a bug fix.
3. **Build real Tier 0 biometric liveness** — the canon already describes this correctly; it just doesn't exist yet under the animation. Do this as its own scoped computer-vision project, and run a privacy/security review against it before shipping, given the Worldcoin precedent.
4. **USSD/feature-phone access** — biggest reach expansion, but a telco-integration project, not an app feature; likely a later-phase initiative once the smartphone-based flows are actually solid.
