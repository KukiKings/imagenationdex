# IN$DEX Sovereign Embedded Connectivity System

> Canonical doctrine — dictated by AJ, researched and structured 2026-07-16. Not yet built (beyond the sandboxed, non-production adapter contract noted in Build Status below). This document supersedes the "build our own eSIM" framing from `roadmap-v2.md`'s earlier Wave 2 entry with the correct architecture: IN$DEX owns the citizen connectivity experience; licensed telecom partners supply the regulated network capacity underneath it. See `sovereign-access-network-v1.md` for the wider 35-point connectivity doctrine this sits inside, and `sovereign-connectivity-pilot-spec.md` for what's software-buildable today.

## The correct framing

IN$DEX does not need to wait for its own towers, satellites, or spectrum before it owns the citizen connectivity experience. It needs to control the **service architecture** while licensed providers supply the regulated network capacity. This is not a referral model — the citizen never leaves IN$DEX to obtain, activate, manage, recover, change, or terminate a mobile connection. The citizen says *"SIINDEX, connect me,"* SIINDEX checks device, location, coverage, price, eligibility, and risk, the citizen approves, and IN$DEX activates the connection through licensed infrastructure underneath — invisible to the citizen.

Industry already has a name for this: **embedded telecommunications** — plans, eSIM provisioning, and subscription management integrated directly inside another product, with the customer remaining inside the original platform.

## What IN$DEX must own

The citizen relationship, the IN$DEX connectivity brand, SIINDEX onboarding, device compatibility checks, plan presentation, citizen consent, subscription orchestration, billing presentation, sponsorship, the Connectivity Wallet, profile-change receipts, risk rules, recovery, support, provider switching, data export, service termination, the right to introduce additional providers, and the right to remove a failing provider.

The partner supplies the licensed telecom infrastructure. The citizen experiences IN$DEX.

## Research conclusion: the vision is achievable with existing technology

Verified this is real, existing infrastructure, not speculative: GSMA's consumer eSIM architecture (specifications **SGP.21** for architecture/requirements, **SGP.22** for the technical spec, **SGP.23** for interoperability testing) defines exactly the flow AJ describes — a secure eUICC inside the device, an **SM-DP+** server that creates, delivers, and remotely manages profiles, an **SM-DS** discovery service, and an **LPA** (Local Profile Assistant) that runs on the handset. GSMA also runs a real Compliance Process and **SAS-SM/SAS-UP** security accreditation for SM-DP+ operators and eUICC production sites. This confirms AJ's instinct precisely: IN$DEX should build against certified infrastructure, not invent a private provisioning protocol — that protocol already exists, is standardised, and is independently security-audited.

Three embedded-telecom vendors were named as candidates. All three were independently verified as real, currently operating businesses with the specific capabilities claimed:

- **1GLOBAL** — confirmed a GSMA-certified telco, operating as a full MVNO in 10 countries and regulated in 42, with 190+ country coverage. Its Connect API genuinely supports single-tap in-app eSIM install. This is not a hypothetical model — 1GLOBAL already powers exactly this embedded pattern for real, named companies: Revolut (40M+ customers), freenet (7.5M users), N26, and Odido's SimWallet product. This is meaningfully *stronger* evidence than the original doctrine assumed — IN$DEX would be adopting a proven pattern, not pioneering one.
- **Mobilise (HERO platform)** — confirmed its SDK is described in its own technical materials as "carrier and SM-DP+ agnostic," built as TM Forum Open API-compliant microservices, and explicitly supports bringing your own carrier/SM-DP+ providers rather than locking to one. This matches the "provider-neutral" role AJ assigned it.
- **Gigs** — confirmed real: a single API covering carrier access (including AT&T in the US), eSIM provisioning, billing (via Gigs Payments, 200+ currencies), number porting, and usage analytics across 195+ countries. **One correction to the record:** Gigs' current public materials state most customers launch in **3–6 weeks**, not the "six to eight weeks" in the original draft — a minor discrepancy, and if anything makes Gigs look more attractive on speed, not less; still confirm directly for IN$DEX's specific target countries, legal structure, and Pacific coverage before relying on that figure.

## What IN$DEX should own vs. what the partner supplies

**IN$DEX Connectivity Core** (owned by IN$DEX): Citizen Connectivity Wallet, Provider Capability Registry, Plan Catalogue, Subscription Orchestrator, Consent Engine, Disclosure Engine, Sponsorship Engine, Billing Ledger, Risk Engine, Recovery Engine, Immutable Event Ledger, Provider Routing Engine, Support and Dispute System, Export and Exit System.

**Provider Adapter Layer** — every provider connects through one standard internal interface so no single vendor (1GLOBAL, Gigs, Mobilise, or any future company) defines IN$DEX's architecture. Required commands: `list_plans`, `check_coverage`, `check_device`, `create_subscription`, `issue_activation`, `confirm_installation`, `get_usage`, `top_up`, `renew_plan`, `suspend_subscription`, `resume_subscription`, `transfer_device`, `check_number`, `check_sim_swap`, `terminate_subscription`, `export_subscription`.

**Licensed network layer** (the partner): eSIM profile creation, SM-DP+ infrastructure, core mobile network, roaming, wholesale data, spectrum access, network authentication, numbers/voice/SMS where supported, emergency telecommunications obligations, lawful telecom compliance.

## Recommended provider architecture

1GLOBAL powers the first licensed connectivity rail. Mobilise supplies an embedded activation and multi-provider orchestration layer, reducing lock-in to any one network supplier. Gigs remains in the competitive process alongside both. Starlink supplies location-based broadband and disaster backhaul — **not** the mobile eSIM profile itself. The relationship in every case is the same: *the provider powers a licensed connectivity rail; IN$DEX owns the citizen connectivity system.* Not: *IN$DEX resells the provider.*

## Regulatory route — research findings

This is the part of the plan most dependent on jurisdiction-specific facts, and where getting it wrong is costly, so it was checked carefully rather than assumed.

**Cook Islands** — confirmed real: the **Competition and Regulatory Authority (CRA)** has held jurisdiction over telecommunications since the **Telecommunications Act 2019**, and has already issued four internet service provider licences, establishing real precedent for licensing new entrants rather than protecting an incumbent monopoly. One practical detail worth knowing before engagement: as of the most recent public reporting, the Authority is very small — one Chair (Bernard Hill) and one staff member. That cuts both ways: a small regulator may be more reachable for a direct conversation, but may also move slower on a novel embedded-telecom proposition than a larger, more resourced authority would. Early, direct engagement remains the right call — just don't assume a fast turnaround.

**Australia** — confirmed the key structural fact AJ needed: under the Telecommunications Act 1997, a **carrier licence** (from the ACMA) is only required if an entity owns network units used to supply carriage services to the public. A **Carriage Service Provider (CSP)** — an entity that supplies telecom services *over* someone else's network, without owning network infrastructure — does **not** need an ACMA carrier licence. This is good news for the embedded model: an IN$DEX-branded service built on top of a licensed partner's network would most plausibly sit in the CSP category, not the carrier category. CSPs do still carry real obligations, though — notably mandatory membership in the **Telecommunications Industry Ombudsman (TIO)** scheme and service-provider-rule compliance. This needs direct telecom counsel to confirm for IN$DEX's specific structure, but the CSP/carrier distinction itself is real and correctly identified in the original doctrine.

IN$DEX needs a **Telecom Regulatory Boundary Engine** — before activating any citizen, the system should resolve: citizen country, service country, applicable legal role (software platform / sales agent / reseller / CSP / MVNO / MVNE / managed connectivity provider / licensed network operator), applicable telecom licence, subscriber-registration and identity requirements, emergency-service limitations, number regulations, data-retention obligations, consumer complaint route, tax, sanctions/restricted-territory screening, and permanent-roaming limits. The answer may differ by country and must not be assumed to transfer from one jurisdiction to another.

## Security architecture — building on what Phase 0 already shipped

Session 121 x20 already built real foundations this system extends rather than replaces: the Connectivity Wallet, immutable Connectivity Change Receipts, real citizen risk self-reports, real freeze capability, Zero-Balance Mode, the SIINDEX provider-disclosure component, and real credential access. This confirms the earlier work was pointed in the right direction — it becomes the substrate the fuller embedded system builds on, not a detour to be replaced.

New pieces this charter adds:

**Network Signal Gateway** — GSMA's Open Gateway Number Verification and SIM Swap APIs (confirmed real and live in the x19 research pass — already used commercially via Telefónica and national rollouts in Brazil/Uruguay/Spain) are the real signal source for SIM/profile change, device change, number change/port, country change, repeated failed activation, profile re-download, subscription suspension, abnormal usage, and provider outage — once a partner exposing these APIs is actually connected. Until then, only the citizen-initiated self-report path (already real, built x20) exists.

**Risk policy** — a network event should trigger *proportionate* protection, never automatic identity destruction: normal installation records a receipt; a new device requires stronger authentication; a recent profile change temporarily restricts high-risk actions; a number port alerts trusted channels; a citizen theft report freezes sensitive actions immediately (already real); a confirmed takeover suspends profile and financial permissions; cleared risk restores access through documented review.

**Activation Intent Proof** — before any eSIM profile is downloaded, installed, replaced, transferred, suspended, or deleted, IN$DEX records: citizen request, SIINDEX's explanation, provider, plan, device, time, permissions, citizen approval, activation result, and a receipt hash.

**Separation of connectivity from citizenship** — even if a telecom account is suspended, the citizen retains Root Identity, Sovereign Life Domain, credentials, recovery, dispute rights, record export, offline proof, and the right to leave. Non-negotiable, matching the existing platform-wide rule that the device/number/SIM/wallet/blockchain address is never the citizen.

## Roadmap (folds into `roadmap-v2.md`)

**2026 (before 31 July):** canonise this system (this document), define the first citizen journey and first three plan types, complete the provider-neutral data model and provider adapter contract, complete plan/provider disclosure records, subscription lifecycle states, recovery rules, and provider exit rules. Business track: issue RFIs to 1GLOBAL, Mobilise, and Gigs; request Starlink enterprise discussion for a community-access pilot; contact the Cook Islands CRA; obtain Cook Islands telecom counsel; begin Australia and Vanuatu regulatory mapping. Technical track (sandboxed, non-production only): build the provider sandbox adapter, add webhook signature verification, idempotent provider-event handling, event reconciliation, a subscription export format, and failed-provider fallback; extend immutable receipts to every lifecycle event.

**2026 (August–October):** score RFI responses, select two finalists, run sandbox tests (activation time, profile deletion, device replacement, top-up, suspend/restore, record export). September: sign a limited non-exclusive pilot agreement, complete privacy/regulatory review, connect one live provider, recruit 10–25 test citizens, run supported-device testing, integrate live usage and real provider webhooks. October: run the first controlled pilot — no plastic SIM, no external provider portal, no fake plan data, no manual database activation, every event recorded, every citizen able to recover and exit.

**2027 launch target — IN$DEX Sovereign eSIM**, launched as an embedded service powered by certified licensed providers. Initial products: **IN$DEX Citizen Connect** (basic personal data), **IN$DEX Learning Connect** (sponsored education access), **IN$DEX Merchant Connect** (merchant page, QR commerce, sales tools), **IN$DEX Mobility Connect** (travel/diaspora/worker connectivity), **IN$DEX Resilience Connect** (emergency/disaster connectivity), **IN$DEX Visitor Connect** (tourist access to the local marketplace). First market selected on regulatory clarity, provider coverage, device compatibility, wholesale pricing, support capability, and pilot demand — the Cook Islands remains home base, but the first commercial launch market must be operationally viable, not chosen for emotional reasons alone.

**2028 target — IN$DEX Sovereign Mobile Federation**: multiple telecom providers, automatic provider routing, no single SM-DP+ dependency, regional Pacific plans (Cook Islands/Vanuatu/Australia/New Zealand routes), sponsored citizen access, full device transfer, network-security signals, Starlink community integration, local edge nodes, satellite fallback, merchant/education bundles, citizen-controlled provider migration, dedicated telecom compliance operations, and an MVNO/joint-venture assessment.

## Non-negotiable partnership terms

No provider agreement should be signed without: in-app activation, API access, signed webhooks, live usage, top-ups, suspension, restoration, device transfer, subscription termination, full event export, clear data-processing boundaries, security incident notification, regulatory-role clarity, provider migration rights, non-exclusive rights, no claim over citizen identity, no access to SIINDEX private memory, no sale of citizen data, no hidden plan substitution, no silent price changes, defined service levels, and defined termination assistance.

## The proof standard

The system is not complete when IN$DEX displays an eSIM purchase page. It is complete when a citizen can join IN$DEX, ask SIINDEX for connectivity, understand the plan, approve it, install the profile, connect, monitor usage, top up, change device, report theft, recover safely, change provider, export their history, cancel, and retain their IN$DEX identity throughout — a full mobile-service lifecycle, no plastic SIM, no external provider portal, no fake connectivity data, no manual database simulation.

Do not claim physical SIM cards are universally unnecessary — many existing devices and operators still depend on them, and the doctrine's own Device Access Programme (`sovereign-access-network-v1.md` §7) keeps physical-SIM support as a permanent fallback, not a legacy path to retire. The provable claim is narrower and still powerful: *a complete mobile subscription can be discovered, purchased, activated, managed, transferred, recovered, and terminated inside a sovereign digital ecosystem without distributing a plastic SIM card.* The pilot should be intentionally eSIM-only to prove exactly that, nothing broader.

---

## Canonical execution charter

**IN$DEX SOVEREIGN EMBEDDED CONNECTIVITY EXECUTION CHARTER**

**Mission.** IN$DEX will make mobile connectivity a native civilisation service. A citizen must not leave IN$DEX to obtain, activate, manage, recover, change, or terminate their mobile connection. The citizen speaks to SIINDEX. SIINDEX understands the citizen's location, device, purpose, eligibility, affordability, and risk. SIINDEX presents suitable connection options. The legal provider, underlying network, cost, data, duration, restrictions, privacy terms, and recovery process are explained. The citizen chooses. The citizen approves. IN$DEX activates the connection through licensed infrastructure. IN$DEX records the proof. The citizen enters the civilisation.

**Product.** The first product is the IN$DEX Sovereign eSIM. The long-term system is the IN$DEX Sovereign Embedded Connectivity System. It will support eSIM first, expanding to iSIM, satellite-to-device, community broadband, private networks, local Wi-Fi, IoT, and future embedded connectivity technologies. IN$DEX will not build its future around plastic SIM-card distribution — physical SIM support, where temporarily required for inclusion, remains an external partner fallback, not the strategic system.

**Ownership.** IN$DEX owns the citizen relationship, the brand, SIINDEX onboarding, plan presentation, consent, the Connectivity Wallet, subscription orchestration, billing presentation, sponsorship, risk rules, recovery, support, disputes, provider choice, provider migration, records, receipts, export, and exit. Licensed providers supply regulated telecom infrastructure. They do not own the citizen, the Grid Account, the Sovereign Life Domain, citizen credentials, citizen reputation, SIINDEX memory, or IN$DEX governance.

**Citizen experience.** The citizen must be able to say "SIINDEX, connect me" and never be required to visit a telecom shop, wait for a plastic SIM, open a separate provider account, use a separate provider application, or understand SM-DP+ systems, roaming agreements, telecom provisioning, or network architecture. The infrastructure works behind IN$DEX. The terms and risks remain visible.

**Provider architecture.** A provider-neutral adapter layer. No individual provider may define the IN$DEX citizen model or become an irreversible dependency. Every integration must support plan discovery, coverage checks, device checks, subscription creation, secure activation, usage reporting, top-up, renewal, suspension, restoration, device transfer, risk signals, termination, record export, and provider migration.

**Standards.** The eSIM service must use recognised GSMA consumer remote-provisioning standards and certified infrastructure — confirmed real (SGP.21/22/23, SAS-SM/SAS-UP). IN$DEX will not create a private, incompatible eSIM protocol. IN$DEX may later own or jointly control certified provisioning and telecom-core infrastructure when scale, security, regulation, and economics justify it.

**Security.** Every important connectivity action creates an immutable Connectivity Change Receipt (already real, built x20). No eSIM profile is installed, transferred, suspended, restored, or deleted without recorded authority. SMS is not the sole protection for high-risk actions — layered controls include passkeys, device-bound keys, citizen PINs, biometric approval where appropriate, SIM-swap signals, device-change signals, waiting periods, transaction limits, independent alerts, trusted recovery contacts, and human review. Network changes trigger proportionate protection; they do not destroy citizen identity.

**Identity separation.** The device, phone number, eSIM, telecom subscription, wallet, and blockchain address are not the citizen. The citizen may change every provider, profile, network, device, number, and wallet without losing identity, credentials, assets, permissions, history, or the Sovereign Life Domain.

**Access rights.** Loss of a paid telecom plan must not remove identity recovery, credential access, fraud reporting, dispute submission, emergency information, consent history, record export, provider migration, or the right to leave.

**Business model.** Revenue may come from connectivity margin, subscription administration, merchant/education/worker-mobility/tourist packages, sponsored access, enterprise plans, and community-connectivity management. Connectivity must not become an extraction system — prices, margins, renewal, expiry, throttling, and restrictions stay transparent. The unbanked must be able to receive sponsored access or pay through suitable lawful methods without requiring a crypto wallet.

**Starlink's role.** Connectivity infrastructure partner supplying community broadband, outer-island access, merchant hubs, schools, disaster centres, maritime access, and backhaul. Starlink does not own IN$DEX citizen identity or access governance. IN$DEX retains terrestrial, satellite, and offline alternatives.

**Proof.** The first proof is an eSIM-only citizen pilot demonstrating in-app plan discovery, citizen approval, real profile installation, real network connection, real usage reporting, top-up, renewal, device replacement, risk reporting, suspension, restoration, provider disclosure, immutable receipts, record export, and termination — no plastic SIM, no external provider portal, no fake connectivity data, no manual database simulation. The pilot succeeds when the citizen completes the entire mobile-service lifecycle inside IN$DEX.

**Roadmap.** 2026: architecture, regulatory mapping, partner selection, sandbox integration, controlled pilot. 2027: launch IN$DEX Sovereign eSIM through licensed embedded-telecom partners. 2028: expand into the IN$DEX Sovereign Mobile Federation.

**Long-term direction.** IN$DEX will progressively own more of the connectivity control plane where ownership strengthens citizen sovereignty, lowers cost, improves resilience, or prevents capture — never ownership for its own sake.

**Final doctrine.** Physical SIM cards belong to the old distribution model. IN$DEX Sovereign eSIM belongs to a software-defined civilisation. The citizen does not search for connectivity or assemble disconnected services. The citizen speaks. SIINDEX understands. SIINDEX prepares the path. The citizen approves. IN$DEX activates the connection. IN$DEX records the proof. The citizen enters the civilisation. Everything the citizen needs is available through IN$DEX. Everything underneath remains interoperable, regulated, replaceable, and accountable. The citizen remains sovereign.

---

## Immediate decision (AJ, 2026-07-16)

IN$DEX will launch its own eSIM citizen experience using licensed, replaceable telecom infrastructure. It will not operate as an affiliate or redirect service. Build the first adapter for 1GLOBAL, designed so Mobilise, Gigs, or another provider can replace or supplement it. Use Starlink for community broadband and resilience, not as the mobile-profile system. Run an eSIM-only proof before claiming physical SIM distribution is obsolete — the claim becomes evidence, not prediction, once a citizen completes the entire lifecycle without leaving IN$DEX.

---

## Research Grounding Notes (2026-07-16)

Confirmed real and accurately described in the original draft:
- GSMA consumer eSIM remote-provisioning architecture (SGP.21/22/23) and SAS-SM/SAS-UP certification for SM-DP+ and eUICC production.
- 1GLOBAL's embedded telco model, GSMA certification, MVNO status in 10 countries, and real named clients (Revolut, freenet, N26, Odido) already running this exact pattern.
- Mobilise's HERO platform being genuinely carrier- and SM-DP+-agnostic, TM Forum Open API-based.
- Gigs' single-API model covering carrier access, eSIM, billing, and number porting across 195+ countries.
- The Cook Islands Competition and Regulatory Authority's real jurisdiction under the Telecommunications Act 2019, with real precedent (4 ISP licences already issued).
- The Australian CSP-vs-carrier licensing distinction — a CSP built on a licensed partner's network plausibly does not need its own ACMA carrier licence, though CSP obligations (including mandatory TIO membership) still apply.

Corrected from the original draft:
- Gigs' stated typical integration timeline is **3–6 weeks** in current public materials, not "six to eight weeks" — a minor, favourable correction. Confirm directly with Gigs for IN$DEX's specific markets regardless.
- The Cook Islands CRA is a very small body (one Chair, one staff member as of the most recent public reporting) — real precedent for licensing exists, but capacity for a fast, novel-proposition review process should not be assumed.

Not independently verified (requires direct confirmation, not public research):
- Exact wholesale pricing, roaming-agreement terms, and Pacific-specific coverage maps for 1GLOBAL, Mobilise, and Gigs — all three companies' Pacific Island coverage specifically needs direct RFI confirmation, not assumption from general marketing claims.
- Vanuatu's telecom regulatory framework — not researched this pass; needed before the "Australia and Vanuatu regulatory mapping" action item can be considered started.
