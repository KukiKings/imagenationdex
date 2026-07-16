# IN$DEX Sovereign Access Network

> Canonical doctrine — dictated by AJ, researched and structured 2026-07-16. Not yet built. This document replaces "build an eSIM feature" as the connectivity frame for IN$DEX. See Research Grounding Notes at the end before making any partnership or infrastructure commitment, and see the companion `sovereign-connectivity-pilot-spec.md` before writing a line of code.

## Why this replaces the eSIM plan

An eSIM feature makes one technology the gateway to citizenship. That is a single point of failure: it excludes citizens on older or incompatible devices, breaks when an operator changes terms, and quietly turns a connectivity vendor into a gatekeeper of identity.

The Sovereign Access Network is the architecture above the eSIM layer. eSIM is one access rail among many. The core rule governing all twenty of the rails below:

**Access must survive changes in device, network, operator, and technology.**

## 1. The access rails

The network supports — and treats as equally legitimate — eSIM, physical SIM, Wi-Fi, community networks, broadband, USSD, SMS, offline QR, local Bluetooth transfer, community kiosks, satellite broadband, direct-to-device satellite, assisted human access, and printable recovery packs. No single rail is required for citizenship. A citizen who has none of the "modern" rails — no eSIM-capable phone, no data plan, no smartphone at all — must still have a path in through at least one of the others (assisted human access, community kiosk, printable pack, USSD/SMS).

## 2. Citizen Connectivity Entitlement

Connectivity becomes a defined citizen entitlement inside IN$DEX — not an unrestricted promise of free internet, which would be financially unsustainable and legally complicated with carrier partners. Every citizen retains access to essential civilisation functions even with zero paid data balance: identity recovery, emergency alerts, credential access, consent records, dispute submission, fraud reporting, support, record export, provider switching, account closure, disaster assistance, and essential SIINDEX guidance.

A citizen may lose general browsing or premium services when a plan expires. They must never lose essential identity and sovereignty functions.

## 3. Zero-Balance Civilisation Mode

An ultra-low-data operating mode, available without a normal data balance where carrier agreements permit: view Grid Account status, present offline credentials, receive emergency messages, read important notices, contact citizen support, approve or deny credential requests, report a stolen device, freeze sensitive actions, access basic financial-literacy guidance, generate an identity recovery code.

This is deliberately not the same claim as "zero-rated services." Zero-rating favours whichever services a carrier chooses to exempt and risks locking citizens into that carrier's walled garden. IN$DEX should negotiate essential-service access while citizens stay free to use the wider internet through any provider.

## 4. Connectivity Wallet

A non-financial control centre inside the Grid Account, separate from the INDX wallet: current plan, remaining data, expiry, operator, coverage, active profiles, backup profile, sponsored allowance, education allowance, merchant allowance, emergency allowance, roaming status, usage consent, provider terms, service complaints, renewal options.

## 5. Data Voucher and Sponsorship Engine

Approved sponsors — family, diaspora members, employers, schools, universities, nonprofits, governments, community funds, disaster organisations, IN$DEX programmes — fund connectivity without controlling the citizen. A sponsor can provide 30 days of essential access, a learning package, a merchant package, a job-seeker package, a disaster package, a worker-mobility package, or a child-education package.

A sponsor must never receive browsing history, wallet activity, location history, private credentials, SIINDEX conversations, or marketplace activity unrelated to the sponsorship.

**Core rule: sponsor the connection. Do not purchase surveillance rights.**

## 6. Data-for-Purpose Controls

Allowances are assigned by purpose — education, commerce, emergency, healthcare, worker support, general access — without invasive monitoring. The system records the allowance type and duration. It does not record every page, conversation, or transaction.

## 6a. eSIM strategy: build, not just partner (AJ's decision, 2026-07-16)

Rather than defaulting to a third-party telecom/eSIM partnership as the only path, IN$DEX is targeting its **own** eSIM/MVNO-style system once better financing is available — roadmapped for **2027** (Wave 2, `roadmap-v2.md`). This does not change the core doctrine: the eSIM remains one access rail among many, never the gateway to citizenship, whether IN$DEX owns the rail or a partner operates it. It does change the pilot sequencing — see `sovereign-connectivity-pilot-spec.md`, which now flags the telecom/eSIM decision itself (partner vs. build) as gated on financing, not yet resolved either way.

## 7. Device Access Programme

This is the highest-leverage item on the list, and research confirms why: eSIM activation still requires a compatible device and typically a QR code or operator app to provision it — a process that is unfamiliar friction for non-technical users even where the network side works perfectly. Removing the physical trip to a SIM counter doesn't help a citizen who doesn't own a compatible phone at all.

IN$DEX needs: refurbished phones, low-cost smartphone partnerships, device leasing, interest-free payment plans where lawful, community-owned devices, school tablets, merchant terminals, device donation, repair services, battery replacement, solar charging, device recycling, and physical-SIM compatibility as a permanent fallback, not a legacy option to be phased out.

The project must measure the total cost of participation — device plus connectivity plus literacy — not just the cost of the eSIM.

## 8. Shared-Device Sovereignty Mode

Several people sharing one phone is normal in many of the households IN$DEX serves. The phone owner must never automatically control every citizen who uses the device: separate citizen profiles, rapid sign-in/sign-out, protected PINs, voice identification only as a supporting signal (never sole authentication), hidden private records, automatic session expiry, safe browsing reset, restricted guardian access, no visible wallet balance by default, notification privacy, emergency logout.

**Core rule: shared device does not mean shared identity.**

## 9. Phone-Number Independence

Phone numbers are recycled, reassigned, lost, changed, ported, suspended, stolen, and ultimately controlled by an operator, not the citizen. The Grid Account and Sovereign Life Domain must stay stable while the number underneath changes. The phone number functions as a contact route, a network attribute, an optional recovery factor, and a transaction-notification route. It must never become the Root Identity.

## 10. Silent Network Authentication

Confirmed real and shipping: GSMA's Open Gateway Number Verification API (built on CAMARA, the Linux Foundation/GSMA open API standard) lets an application confirm the number tied to a connected device through the operator's network rather than an SMS code. It is live with expanding carrier participation — Malaysia's five major operators federated access to it, and major US carriers expose CAMARA-aligned silent-auth APIs as of 2026.

This is real infrastructure IN$DEX can eventually integrate with — but only where the citizen's operator has joined Open Gateway, which is not universal. It must remain one signal in a layered system, never the sole check, and the citizen-facing copy should say exactly what it does and doesn't reveal: *"Your mobile provider confirmed this device is currently connected through the number ending in 214. This does not reveal your calls, messages, or browsing activity."*

## 11. SIM-Swap Defence Protocol

Also confirmed real: GSMA's Open Gateway SIM Swap API (again CAMARA-based, already live through operators like Telefónica and in national rollouts across Brazil, Uruguay, and Spain) detects whether a number has recently moved to a different SIM — a leading indicator of a SIM-swap attack — without needing an extra SMS round-trip.

IN$DEX should automatically raise protection after a SIM change, number port, device change, eSIM download, operator change, unusual country change, or a recovery attempt: temporary transfer delay, reduced payment limits, alerts to existing trusted devices, guardian confirmation, biometric or passkey requirement, human review, withdrawal hold, delegate-change restriction. A legitimate citizen must never be permanently locked out — a suspicious change triggers protection, not identity destruction.

## 12. Connectivity Change Receipt

Every important telecom event generates a citizen receipt — eSIM installed, physical SIM replaced, number changed, operator changed, plan renewed, backup profile activated, sponsor added or ended, international roaming enabled, emergency profile activated, device removed — showing what changed, who requested it, provider, time, cost, permissions, recovery path, effect on authentication, and whether sensitive actions are temporarily restricted. This is the same receipt discipline IN$DEX already applies to consent and security events (`consent_receipts`, `security_events`) — connectivity events should live in the same immutable-receipt pattern, not a separate one.

## 13. Provider Portability Protocol

A citizen changes telecom providers the way anyone changes providers — routinely, not as an act of leaving the civilisation. The protocol preserves the Grid Account, Sovereign Life Domain, credentials, SIINDEX profile, marketplace page, financial relationships, consent records, learning records, contacts, recovery rights, and merchant history across the switch.

## 14. Multi-Operator Connectivity Orchestrator

SIINDEX compares approved connectivity offers against the citizen's real needs — island/region, actual coverage, data cost, call cost, roaming, network reliability, device compatibility, expiry rules, top-up availability, privacy terms, support quality, backup options, emergency capability — and must disclose if IN$DEX earns commission from a provider. It never presents a sponsored provider as objectively best.

## 15. Pacific Roaming Passport

A connectivity passport for citizens moving between Cook Islands, New Zealand, Australia, Vanuatu, Fiji, and other Pacific nations: active network profile, home profile, destination profile, roaming prices, worker-rights access, emergency contacts, remittance access, employer communication, return-home planning, expiry reminders. One IN$DEX identity persists while connectivity changes by country.

## 16. PALM Worker Arrival Mode

Research note: the Pacific Australia Labour Mobility (PALM) scheme is real — it's the Australian government programme (run by DEWR/DFAT) that lets Australian employers hire seasonal and longer-term workers from nine Pacific nations and Timor-Leste, with its own worker-protection framework and a support-service phone line already in place. PALM itself does not currently provide SIM or connectivity arrangements as part of the scheme — that gap is exactly the opening for IN$DEX to add value on top of a real, existing programme rather than compete with or duplicate it.

Before departure: destination eSIM or activation instructions, Australian emergency numbers, employer contact, accommodation address, worker-rights information, remittance routes, wage record, contract, support contacts, family-communication allowance, recovery profile. On arrival, SIINDEX checks the worker is connected and can reach support. On return, the connectivity passport moves the citizen back to their home-country profile without losing records or contacts. This should be pitched to PALM-approved employers and the existing PALM support service as a complementary layer, not pitched as replacing anything PALM already runs.

## 17. Mama Noe Connectivity Kit

The merchant use case as a formal package: an affordable compatible phone or merchant terminal, eSIM or physical SIM, solar charger, printed QR sign, low-data merchant mode, voice-led sales recording, simple stock recording, cash-and-digital payment recording, preorder notifications, a customer reorder page, support contact, a business-education allowance, fraud warnings, and a disaster-recovery profile. This turns connectivity into productive infrastructure rather than a consumer add-on — and it's aimed squarely at the demographic GSMA's own 2025/2026 mobile money research flags as most underserved in this region: Pasifika women, who are disproportionately unbanked because of distance to agents and social/economic constraints, not lack of desire to participate.

## 18. Local Cash Network Integration

The unbanked still need physical cash-in/cash-out points: shops, post offices, community agents, banks, credit unions, remittance agents, telecom agents, merchant agents providing cash-in, cash-out, identity assistance, device activation, eSIM installation, account recovery, bill payment, support, credential printing. Agents receive verified authority, defined limits, fraud training, privacy training, transaction receipts, complaint oversight, and cash-management controls. Mobile money's actual growth pattern over the last decade — $2 trillion moved through mobile wallets globally in 2025, more than doubling since 2021 — has consistently been driven by agent networks as much as by the technology itself; Fiji is already cited as a regional benchmark for this model. IN$DEX should plan to extend an existing agent pattern in the Pacific, not invent one from scratch.

## 19. Community Steward Connectivity Stations

Verified local access points for citizens without a device, data, or confidence: Wi-Fi, charging, satellite backup, device assistance, eSIM installation, physical-SIM support, credential access, assisted SIINDEX sessions, printing, merchant registration, disaster updates, education access. The steward never gets unrestricted account access — every assisted action requires citizen approval, a visible screen or spoken explanation, a session receipt, automatic logout, and restricted steward permissions.

## 20. Local-Language Connectivity Guide

SIINDEX explains connectivity in Cook Islands Māori, Bislama, English, French, and other relevant Pacific languages, translating concepts like data allowance, roaming, expiry, network, eSIM, device, recovery, SIM swap, privacy, top-up, and recurring payment for comprehension, not literal word substitution.

## 21. Connectivity Literacy Credential

Practical, non-mandatory learning: recognising scams, protecting PINs, avoiding fake QR codes, understanding data costs, managing updates, protecting shared devices, using public Wi-Fi safely, recovering a lost phone, checking payment recipients, spotting false support agents. GSMA already runs a proven version of exactly this — the Mobile Internet Skills Training Toolkit (MISTT) has reportedly taught over 70 million people across 40+ countries, and GSMA's separate Digital Literacy Training Guide is specifically designed to be delivered by local mobile money agents and community influencers. IN$DEX's literacy credential should be built to complement or adapt this existing toolkit rather than compete with it, and completion must remain a capability credential, never a mandatory barrier to essential access.

## 22. Direct-to-Device Satellite Roadmap

Research correction to keep front and centre: standard Starlink satellite broadband (not direct-to-ordinary-phone) is already live and proven across the Pacific — Fiji since May 2024, Vanuatu since October 2024 (used in real cyclone disaster-response communications), Tonga with a full operating licence since July 2025. That's the resilience rail IN$DEX can actually reference and plan around today.

True direct-to-device (an ordinary phone talking straight to a satellite with no special hardware) is real but earlier-stage and not confirmed available in any Pacific nation yet: Starlink's Direct to Cell has SMS live with voice/data phasing in through 2025–2026; AST SpaceMobile only received FCC authorisation for its 248-satellite constellation in April 2026 (partnered with AT&T, Verizon, and FirstNet in the US) and is targeting 45–60 satellites in orbit by the end of 2026. Neither has a confirmed Pacific-market DTC deployment as of this writing.

So: plan Pacific resilience today around standard Starlink-class satellite broadband at community stations and vessels. Treat true phone-native direct-to-device as a genuine future rail worth tracking, not something to promise citizens now. Emergency alerts, disaster check-in, maritime safety, outer-island communication, worker location check-in with consent, emergency text, basic identity recovery, disaster assistance, and critical merchant communication are all reasonable target uses once DTC matures for this region — just not yet.

## 23. Maritime Citizen Mode

Pacific economic life extends beyond land. Fishers, boat operators, inter-island traders, and tourism crews need departure check-in, vessel identity, crew credentials, weather alerts, emergency contacts, citizen-controlled location sharing, product and catch records, payment continuity, offline invoices, return confirmation, and an emergency satellite path.

## 24. Energy Resilience Layer

Connectivity fails when devices and towers lose power. Solar chargers, community charging stations, power banks, battery health, low-power mode, offline-first operation, delayed synchronisation, local data caching, emergency charging priority, backup power for community stations. Track hours of service maintained during a power failure as a real metric.

## 25. Local Edge and Offline Synchronisation

Important data stays usable when international connectivity fails: merchant catalogue, essential credentials, emergency contacts, recent transaction receipts, disaster instructions, learning content, approved community directory, local marketplace listings — all locally cached, safely synchronised when connectivity returns. This reduces dependence on overseas cloud infrastructure during exactly the moments citizens need the system most.

## 26. Network Quality Proof

Measure actual citizen experience, not plan descriptions: coverage, connection failures, successful voice calls, data speed, latency, outages, recharge failures, emergency accessibility, complaint resolution, provider-switch success. Publish aggregate provider performance without exposing individual citizen activity, giving citizens real evidence when choosing a provider.

## 27. Telecom Complaint and Repair System

A clear process for unauthorised charges, lost credit, failed eSIM installation, wrongful disconnection, poor coverage, number theft, SIM swap, misleading plan terms, roaming charges, inaccessible support, and sponsor interference. SIINDEX explains the issue, collects evidence, contacts the provider, tracks the response, escalates to the relevant authority, records the outcome, and restores citizen access where possible.

## 28. Child Connectivity Protection

Separate rules for children: guardian-approved activation, education access, emergency contact, private identity, restricted public discovery, no targeted advertising, no sponsor surveillance, no public wallet balance, safe messaging, age-appropriate SIINDEX, guardian permissions with defined limits, a defined child-to-adult transition, and the right to remove unnecessary childhood records. A school-sponsored eSIM must never become a permanent monitoring tool.

## 29. Domestic Abuse and Coercion Protection

A controlling partner or employer may control the phone plan. A private eSIM profile where lawful, hidden emergency access, safe number change, confidential recovery, notification concealment, delegate review, forced-disclosure support, a trusted support contact, quick removal of an abusive payer or sponsor, and safe migration to a new operator. The person paying for connectivity must never automatically own the citizen's identity or communications.

## 30. Citizen Location Constitution

Define, in the open: when location is collected, who requested it, why, accuracy, duration, whether it's stored, whether it's shared, emergency-override rules, revocation, and dispute rights. Location is off by default except where necessary and approved. No employer, sponsor, school, or community authority gets continuous location access by default.

## 31. Connectivity Data Firewall

Technically and legally separate telecom identity, citizen identity, payment identity, wallet, education, health, marketplace, location, governance, and SIINDEX memory. No operator should be able to reconstruct a citizen's complete life from IN$DEX data. No central IN$DEX administrator should have unrestricted visibility across every category either.

## 32. Operator Failure Continuity

Answer, in writing, before it happens: what happens if an operator becomes insolvent, leaves a country, suffers a cyberattack, loses its licence, changes pricing, blocks IN$DEX, experiences a prolonged outage, or ends an eSIM partnership. Citizens need a backup profile, provider migration, contact continuity, offline identity, emergency access, data export, public status updates, and complaint support ready before any of that happens, not designed after.

## 33. Connectivity Anti-Capture Rule

No mobile operator may gain exclusive control over IN$DEX citizens, exclusive rights to citizen data, control over Grid Accounts, control over IN$DEX governance, authority to suspend citizen identity, exclusive payment routing, permanent preferred-provider status, or rights to advertise through SIINDEX without consent. Partnership must never become capture.

## 34. Telecom Neutral SIINDEX

Every SIINDEX connectivity recommendation states the available providers, the reason for the recommendation, coverage evidence, total cost, restrictions, whether IN$DEX is compensated, alternatives, and the switching process. The citizen chooses.

## 35. Connectivity Proof of Usefulness

Do not measure eSIM downloads, data consumed, or active subscriptions alone. Measure: previously disconnected citizens activated, first payment received, merchant sales enabled, lessons completed, jobs applied for, credentials accessed, disasters survived with continuity, workers supported overseas, families reconnected, fraud attempts stopped, provider changes completed, cost saved, income created, citizens retaining access during zero balance, offline transactions synchronised, complaints repaired.

---

## Canonised statement — IN$DEX Sovereign Access Network

The IN$DEX Sovereign Access Network provides every eligible citizen with a safe and resilient path to the civilisation. The network is not limited to eSIM. It may include eSIM, physical SIM, Wi-Fi, USSD, SMS, broadband, community access points, offline credentials, local networks, satellite connectivity, direct-to-device communication, and assisted access.

Connectivity is infrastructure. It is not identity. The device is not the citizen. The phone number is not the citizen. The SIM is not the citizen. The mobile operator is not the citizen. The wallet is not the citizen.

The Grid Account connects the citizen to the civilisation while allowing every underlying provider and device to change. The citizen may change their phone, number, SIM, eSIM, operator, wallet, blockchain, and country without losing their identity, credentials, assets, permissions, history, or Sovereign Life Domain.

Every citizen retains access to essential sovereignty functions: identity recovery, credential access, fraud reporting, dispute submission, emergency information, consent history, record export, provider migration, and the right to leave. Loss of paid data must not erase essential citizen rights.

Connectivity may be sponsored by families, diaspora members, schools, employers, nonprofits, governments, community funds, or IN$DEX programmes. A sponsor purchases access. A sponsor does not purchase surveillance, identity ownership, location access, browsing history, wallet visibility, or control over the citizen.

IN$DEX must support citizens who use shared devices. Shared device does not mean shared identity. IN$DEX must support citizens who cannot afford eSIM-compatible devices — no citizen should be excluded because they require a physical SIM, shared device, assisted service, low-data mode, offline record, or community access point.

High-risk actions must not rely on SMS alone. IN$DEX should use passkeys, device-bound credentials, SIM-swap detection, recovery guardians, waiting periods, transaction limits, independent alerts, and human review according to risk.

Every connectivity change must create a receipt: what changed, who requested it, what it cost, what permissions changed, and how to reverse or challenge it.

SIINDEX compares providers through cost, coverage, reliability, privacy, accessibility, support, and citizen need, and discloses commercial relationships. The citizen chooses the provider. No operator receives permanent control over the citizen or unrestricted access to citizen identity, payments, education, health, reputation, culture, governance, or SIINDEX memory.

Location remains purpose-limited, permissioned, and revocable. A school must not use sponsored connectivity to monitor a student's complete life. An employer must not use connectivity to control a worker outside the lawful employment relationship. A partner paying for a plan does not own the citizen.

The Sovereign Access Network must remain functional through device loss, phone-number change, SIM replacement, operator failure, power failure, internet outage, natural disaster, international travel, worker migration, IN$DEX service interruption, and SIINDEX downtime — supported by local caching, offline credentials, delayed synchronisation, emergency access, solar charging, backup profiles, and provider migration.

Satellite connectivity is a future resilience rail for outer islands, maritime communities, disaster response, and regions outside terrestrial coverage. It must not be presented as universally available before operator, device, spectrum, and regulatory support exists for this region specifically.

The success of the Sovereign Access Network is not measured by subscriptions. It is measured by what connectivity lets citizens do: receive value, send value, learn, prove identity, verify capability, find work, build a business, sell a product, reach customers, access support, protect culture, respond to disaster, stay connected across borders, recover from loss, retain their records, leave with dignity.

The eSIM is one rail. The Sovereign Access Network is the system. The Grid Account is the gateway. The Sovereign Life Domain is the citizen interface. SIINDEX is the guide, translator, and protection layer. The citizen remains sovereign.

---

## Research Grounding Notes (2026-07-16)

Verified real and directly usable when the time comes to build:
- **GSMA Open Gateway Number Verification API** (silent network auth) — live, CAMARA-standard, expanding operator participation (e.g. Malaysia's five carriers federated in 2026, major US carriers exposing it). Real, but operator-dependent — never treat as universally available.
- **GSMA Open Gateway SIM Swap API** — live and already used commercially (Telefónica, national rollouts in Brazil/Uruguay/Spain) for exactly the fraud-defence use case described in section 11.
- **Standard Starlink satellite broadband in the Pacific** — confirmed live in Fiji (since May 2024), Vanuatu (since October 2024, with real cyclone-response use), and Tonga (full licence since July 2025). This is the resilience rail to plan around now.
- **Mobile money agent networks** — real, mature, and specifically documented as the growth driver in this region; Fiji is cited as a regional benchmark. GSMA's own 2025/2026 research also flags Pasifika women as the most underserved demographic due to agent distance and social/economic barriers — directly relevant to prioritising the Mama Noe Connectivity Kit and Local Cash Network Integration.
- **GSMA digital/financial literacy programmes (MISTT, Digital Literacy Training Guide)** — real, large-scale (70M+ people, 40+ countries), and purpose-built to be delivered through community/agent networks. Worth exploring as a partner or template rather than building the Connectivity Literacy Credential from nothing.

Confirmed real but earlier-stage than the original draft implied — corrected in section 22 above:
- **True direct-to-device satellite** (ordinary phone, no special hardware) — both Starlink Direct to Cell (SMS live, voice/data phasing in through 2025–2026) and AST SpaceMobile (FCC authorisation for its full constellation only granted April 2026, targeting 45–60 satellites by end of 2026) are real programmes, but neither has a confirmed Pacific-market deployment yet. Do not promise this to citizens today.

Confirmed real but requires reframing — corrected in section 16 above:
- **PALM scheme** — a real, established Australian government programme with its own worker protections and support line. It does not currently include SIM/connectivity provisioning. IN$DEX's "PALM Worker Arrival Mode" is a genuine value-add layered on top of a real programme, not an existing PALM deliverable — pitch it to PALM-approved employers and the existing support service as a complement, not a replacement.

Not independently verifiable via research (regional-specific, no public data found):
- Pacific-islands-specific eSIM device-compatibility statistics. General developing-market barriers (unfamiliar QR/app-based provisioning, uneven device compatibility) are well documented and transfer directly to the reasoning in section 7, but no Pacific-specific numbers exist publicly yet — this is itself an argument for IN$DEX to start measuring its own data here rather than relying on outside figures.
