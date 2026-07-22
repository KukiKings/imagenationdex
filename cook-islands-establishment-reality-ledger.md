# Cook Islands Establishment — Reality Ledger
> Written 2026-07-19. Companion to the pasted "IMAGENATIONDEX.COM Build Status" deep-research report AJ shared the same day. This doc separates what's actually true (checked against the live project and real web sources) from what that report got wrong or invented, then lays out the real regulatory path for establishing IN$DEX in the Cook Islands.

## Part 1 — Fact-Checking the Pasted Report

The pasted report was AI-generated and says so at the bottom ("for reference only"). Several of its "critical observations" are wrong, and one is a genuinely risky claim to carry into a government meeting. Checked against the actual project files and the open web before anything in that report gets acted on.

### 1.1 SIINDEX pronunciation — report is WRONG, do not change it
The report claims the site "currently says 'sin-dex'" and this "must be updated to 'Sighn-dex.'" Checked: "sin-dex" is the pronunciation in home-v2.html, how-it-works.html, siindex.html, contact.html, siindex-voice-terminal.html, siindex-command-center.html, whitepaper-v1.md, and every SIINDEX skill file — ten-plus files, all consistent, all matching the canonical instruction in CLAUDE.md itself. "Sighn-dex" appears nowhere in the actual project. The report invented a discrepancy that doesn't exist. **No change made.**

### 1.2 "Mana Intelligence" — not found anywhere in canon
The report presents "Mana Intelligence" as an existing, missing-but-crucial framing for SIINDEX. It does not appear in the whitepaper, CLAUDE.md, security-canon.md, or any SIINDEX skill or master-prompt file. This looks like an invention of whatever tool produced the report, not an existing part of IN$DEX's doctrine. **Not adopted.** If AJ wants this as new terminology, it should be a deliberate decision, not a retrofit based on an unverifiable claim that it was "always" part of the vision.

### 1.3 "140+ partners — Visa, Mastercard, Stripe, BlackRock, Coinbase, BNY Mellon..." — likely a misattribution, do not repeat this to anyone
This is the most important correction. Nothing in the project shows IN\$DEX has partnerships with any of these companies. The whitepaper's "Macro Moment" section (Section on external validation, July 2026) discusses Larry Fink/BlackRock and the wider Open USD (OUSD) stablecoin ecosystem as **industry-wide signals that validate the market IN\$DEX is building into** — not as IN\$DEX's own partners. The pasted report appears to have collapsed "these companies are active in the space IN\$DEX operates in" into "these companies partner with IN\$DEX." Those are completely different claims. Repeating the second version to a Cook Islands regulator, bank, or the Chamber of Commerce would be a false claim of affiliation — exactly the kind of thing that damages credibility with a regulator who is already nervous about crypto-sector reputational risk (see Part 2). **Do not use this claim anywhere outside of citing it as "industry signals," which is what the whitepaper actually supports.**

### 1.4 "2,847 citizens waiting from 23 countries" — this is a seeded marketing counter, not a verified user count
Checked the actual code: home-v2.html, genesis-offer.html, waitlist.html, and token.html all hard-code `base = 2847` (or `BASE=2847`) as the starting point for a JavaScript counter that increments over time for display purposes (`HOURLY_GROWTH=7` in genesis-offer.html). This is confirmed directly in the project's own planning doc, `second-brain/decisions/grand-synchronicity-plan.md`, which lists "Waitlist signups: ~2,847 (seeded) / 500 real" as separate figures — meaning the project's own internal record treats 2,847 as a display device, not a count of real people, and puts the actual real number at a different (lower, and possibly stale) figure. **Do not state "2,847 citizens across 23 countries" as a real, verifiable fact to any government body.** If BTIB, FSC, or CAWG ask for actual user numbers as part of an application or submission, AJ needs the real current figure — pulled from Supabase's `citizens` table — not the marketing counter. I can pull that real number in a few minutes if useful before any meeting.

### 1.5 What checked out as accurate
"Swiss Verein with Wyoming DAO LLC" as the legal structure is real and consistent across home-v2.html, how-it-works.html, kyc-compliance.html, business-plan-v12-SEALED.md, and what-we-build-on.md. The 98/2 Civilisation Law, Grid Account MPC structure, PQSI tiers, and the 90-second onboarding flow all match the actual build. The report's inventory of what's live (SIINDEX pre-flight checks, Genesis Offer mechanics, Sovereign Social 0% fee, Opportunity Feed) is broadly consistent with the real site.

### 1.6 The named contact and trip details — not something I can or should verify
"Tayla Jayne Beddoes," "Secure Pacific Group," and the specific 6–17 December Rarotonga itinerary don't appear anywhere in the project files, which likely just means they live outside this workspace (a real relationship AJ has, discussed elsewhere) rather than being fabricated. I'm not going to run a web search on a named private individual to try to verify them — that's not an appropriate use of search, and a public-web result (or lack of one) wouldn't tell you anything reliable about a real business relationship anyway. Treat that part of the report as AJ's own information, not something this research confirmed.

---

## Part 2 — The Real Cook Islands Regulatory Picture (verified via web search, 2026-07-19)

### 2.1 The crypto policy environment is genuinely tense right now — worth knowing before any meeting
The Cook Islands government has a **Crypto Assets Working Group (CAWG)**, co-chaired by the Office of the Prime Minister and the Financial Intelligence Unit, formed to advise PM Mark Brown on how to handle crypto — but it exists because of a **draft Cryptocurrency (Ransomware Suppression) Bill 2025** that is still under review, not yet enacted, and has drawn public pushback from the **Bankers Association of the Cook Islands** and the **Cook Islands Chamber of Commerce**, both warning about economic and reputational risk if it's rushed. This is not a friendly, settled licensing regime waiting for applicants — it's an active, contested policy debate about crime suppression, and IN\$DEX would be entering it as a live example of the exact kind of business the bill is trying to get a handle on. That's a materially different context than "submit CAWG submission — shape the regulatory framework" makes it sound. A submission is a real and available step, but it should be framed carefully — as a compliance-forward, remittance-for-the-unbanked business voluntarily seeking a constructive regulatory relationship, not as a generic crypto pitch.

### 2.2 Two separate regulators, two separate questions
**FSC (Financial Supervisory Commission, fsc.gov.ck)** licenses financial services, including remittance businesses, under the **Money Changing & Remittance Businesses Act 2009**. There is no Cook Islands-specific virtual-asset/digital-asset licensing framework yet — the crypto-specific regulation that exists is the ransomware bill above, still in draft.

**BTIB (Business Trade and Investment Board, btib.gov.ck)** is the separate agency that approves any foreign-owned business operating in the Cook Islands at all — this is required regardless of what FSC does, if AJ (a non-citizen) wants IN\$DEX to actually operate there rather than just be a paper entity.

### 2.3 The remittance license — real requirements, more demanding than "register a company"
Under the 2009 Act: a local office in the Cook Islands, sufficient local staff, all remittance operations actually performed from the Cook Islands, an appointed auditor before lodging the application, and a **required face-to-face meeting in the Cook Islands with both the FSC and BTIB**. The Act doesn't fix a minimum capital figure, but the Commission decides case-by-case and industry guidance suggests **not less than USD $100,000**. Licenses renew annually on 1 April.

### 2.4 Foreign investment approval — the capital number that matters most
Separately from any FSC licence, BTIB approval is required for any foreign-owned business, with a **minimum capital injection of NZD $1,000,000 for a business based in Rarotonga** (NZD $500,000 for the outer islands). Application fee NZD $750 (standard, ~30 working days) or NZD $850 (express, ~5 working days). This is the single most important number in this whole exercise — it's a real capital commitment, not a formality, and it applies before the remittance-specific licensing questions even come into play.

### 2.5 Company formation itself is the easy, fast part — and doesn't solve the above
A Cook Islands **International Business Company (IBC)**, under the International Companies Act 1981, can be formed in about four days: one director, one shareholder (can be the same person), 100% foreign ownership allowed, no local residency requirement, notarized KYC documents, a registered agent and resident secretary required. This is the standard offshore/asset-protection vehicle — it is cheap and fast, but it is not, by itself, a licence to run a remittance business or operate physically in the Cook Islands. It solves "AJ owns a Cook Islands legal entity." It does not solve "IN\$DEX is licensed to move citizens' money through the Cook Islands" or "IN\$DEX has BTIB approval to operate there." Those are the two things that actually matter for the mission and both carry the requirements in 2.3/2.4.

### 2.6 Trademark — the pasted report's claim was wrong
The report says to "register trademark in New Zealand (effective in Cook Islands)." Checked: this is not correct under current law. New Zealand trademark protection under the current Trade Marks Act 2002 does **not** extend to the Cook Islands. (Only trademarks originally registered in NZ under the old, repealed 1953 Act carry over — not relevant to a new registration today.) The Cook Islands has its own Trade Marks Act 2003, administered by the Ministry of Justice IP Office — a direct Cook Islands registration is what's actually needed, 10-year term, renewable indefinitely.

### 2.7 Other practical constraints worth knowing
Foreigners cannot own land in the Cook Islands, only lease it, up to 60 years — relevant if a physical office is part of the plan. Retail, agriculture, manufacturing, and tourism accommodation are sectors reserved for Cook Islanders only — not directly relevant to IN\$DEX's business, but worth confirming a fintech/platform business isn't caught by any adjacent reserved-sector rule specific to financial services.

---

## Part 3 — What This Means for the Rarotonga Trip

The trip itself, meeting the regulators, and submitting to the CAWG consultation are all real, available, sensible things to do — nothing here says don't go. What changes is the framing and the preparation:

1. **Get the real citizen number before any meeting.** Whatever gets said in Rarotonga about scale should come from the live Supabase count, not the seeded waitlist counter.
2. **Drop the "140+ partners" claim entirely** from any meeting materials — it isn't true as stated and is the kind of claim that would specifically damage credibility with a regulator already worried about crypto-sector overstatement.
3. **Understand the actual cost of "established there" before committing to it.** An IBC is ~days and low cost. Actually operating (BTIB foreign investment approval + FSC remittance licence) is a NZD $500K–$1M capital commitment plus a local office, local staff, an auditor, and annual relicensing. Worth deciding explicitly which of these AJ is actually pursuing — a light-touch legal presence, or a fully operating licensed local entity — since the report blurred them together as one "get established" step.
4. **Treat the CAWG submission as entering a live, contested policy debate**, not a settled application process — the Bankers Association and Chamber of Commerce are already on record with concerns. A submission framed around financial inclusion for the unbanked, compliance-by-design (the ZK-proof KYC, Travel Rule, PQSI controls already in the whitepaper's Section 8/11), and a willingness to be a constructive example is a stronger position than presenting IN\$DEX as an already-arrived, partner-backed platform.
5. **Register the trademark directly with the Cook Islands IP Office**, not via New Zealand.
6. Do not rely on this doc or the pasted report as legal advice — I'm not a lawyer, and Cook Islands financial-services and foreign-investment law specifically should be checked with Cook Islands counsel (likely the same firm handling the FSC/BTIB face-to-face meetings) before any capital commitment or licence application is filed.

---

## Part 4 — Verifying AJ's Follow-Up "Complete Cook Islands Additions Compilation" (2026-07-19, same day)

AJ pasted a second, much more detailed Cook Islands document. Unlike the first report, several of its most specific claims check out against real, current sources — this one is materially more trustworthy. Verified via live web search:

**Tayla Jayne Beddoes / Pacific Group AI — real, confirmed.** She is a real, publicly documented figure: Cook Islander with Fijian/Samoan/Tahitian roots, founder of Pacific Group AI (formerly TaysMedia AI), and she really did build "INA" and "Tumutoa," the Cook Islands Parliament's first AI agents — reported directly by RNZ and Cook Islands News. This is not something I fabricated or guessed at; it's public reporting on a named professional and her published work, which is different from trying to verify a private individual (which I still wouldn't do). AJ having a real meeting lined up with her is still something only he can confirm — the news coverage confirms she's real and does this work, not that a specific meeting is scheduled.

**CAWG's exact name — corrected.** The verified, official name (per the Cook Islands Office of the Prime Minister's own website) is **"Cryptocurrency Advisory Working Group,"** not "Crypto Assets Working Group" as I had it in Part 2 above. Co-chaired by the Office of the PM and the Financial Intelligence Unit of the FSC, as AJ's document states.

**NZ aid suspension — real, but the framing needs a nuance.** New Zealand did suspend roughly NZD $30 million in aid to the Cook Islands. But the trigger was the Cook Islands signing undisclosed deals with China without the required consultation as a Realm country — the crypto bill is a real, additional NZ concern layered on top of an already-strained relationship, not the original cause of the aid suspension. Both are real risks; they shouldn't be presented as one single cause.

**Cook Islands citizens are NZ citizens — real**, under NZ's Citizenship Act 1977, which applies across the Realm of New Zealand including the Cook Islands. The NZD $75 company-registration fee (vs. NZD $750 for foreign enterprises via BTIB) is independently confirmed via the Ministry of Justice registry.

**Confirmed by AJ directly (2026-07-19): AJ holds Cook Islands/New Zealand citizenship.** The citizen registration pathway in Section 7 of the follow-up document applies: NZD $75 company registration fee (not $750), no BTIB foreign-investment approval step, no NZD $500K–$1M capital injection requirement, full local work rights, and resident tax status (20%, not the 28% non-resident rate) become the real, applicable path — not the foreign-investor path modelled in Part 2/3 above. The foreign-investor figures in this doc (BTIB approval, $1M/$500K capital injection) remain accurate background for context but no longer describe AJ's actual situation. A licensed trustee company is still standard practice even for citizens per the follow-up document, and the ~NZD $1,600–$3,200 year-one cost estimate (trustee company + registration + registered agent) is the more realistic budget line now.

**The "Sighn-dex" pronunciation and "Mana Intelligence" framing** — reversing my earlier caution. My earlier read (Part 1.1/1.2 above) was based on there being zero support for either in the actual project files, which was true at the time. AJ's follow-up document makes clear these are a deliberate, deeply-reasoned creative and strategic decision for the Cook Islands positioning specifically (SIINDEX as Mana Intelligence, "the vaka," Te Moana-nui-a-Kiwa framing), not an invented error to correct. Adopting it for real means: (a) changing the pronunciation in 10+ files that currently say "sin-dex" and in CLAUDE.md's own SIINDEX Voice canon, and (b) introducing "Mana Intelligence" into the whitepaper, SIINDEX skill prompts, and screen copy consistently. That's a genuine brand-level change on the scale of the launch-date sweep, and CLAUDE.md changes need AJ's explicit sign-off per his own standing rule — flagged, not yet executed.

## Sources (2026-07-19 web search)
- FSC — https://www.fsc.gov.ck/
- FSC Money Changing licensing — https://www.fsc.gov.ck/public/content.aspx?cn=MoneyChanging
- BTIB Foreign Investment — https://btib.gov.ck/foreign-investment/
- BTIB FAQ — https://btib.gov.ck/foreign-investment/frequently-asked-questions/
- Cook Islands News — crypto working group — https://www.cookislandsnews.com/internal/national/economy/government-establishes-crypto-working-group-to-guide-policy/
- Cook Islands News — draft crypto bill under review — https://www.cookislandsnews.com/internal/national/economy/draft-crypto-bill-under-review-as-concerns-loom/
- Cook Islands News — Bankers Association — https://www.cookislandsnews.com/internal/national/economy/cook-islands-bankers-association-urges-consultation-on-cryptocurrency-bill/
- RNZ — Draft Crypto Bill under review — https://www.rnz.co.nz/international/pacific-news/579813/draft-crypto-bill-under-review-as-concerns-loom-in-cook-islands
- PMN — Chamber warns on crypto bill's economic risks — https://pmn.co.nz/read/pacific-region/cook-islands-chamber-warns-on-crypto-bill-s-economic-risks
- Offshore Protection — Cook Islands IBC formation — https://www.offshore-protection.com/cook-islands-international-company-formation
- Cook Islands Trade Portal — business approval procedure — https://cook-islands.tradeportal.org/procedure/22?l=en
- Trademark registration Cook Islands — https://www.applytm.com/trademark-registration/cook-islands/
- RNZ — Cook Islands parliament launches AI agents — https://www.rnz.co.nz/news/pacific/593589/cook-islands-parliament-launches-ai-agents-to-support-operations
- Cook Islands News — Beddoes brings global AI best practice home — https://www.cookislandsnews.com/internal/national/technology/beddoes-brings-global-ai-best-practice-home/
- Office of the PM Cook Islands — CAWG establishment (official) — https://www.pmoffice.gov.ck/2026/03/09/government-establishes-cryptocurrency-advisory-working-group/
- PINA — NZ suspends ~$30m aid to Cook Islands — https://pina.com.fj/2025/11/10/new-zealand-suspends-nearly-30m-in-aid-to-cook-islands/
- 1News — NZ suspends aid, China deals context — https://www.1news.co.nz/2025/11/09/new-zealand-suspends-nearly-30m-in-aid-to-cook-islands/
- BTIB — registering your business — https://btib.gov.ck/business-one-stop-shop/registering-your-business/
- Cook Islands Ministry of Justice registry — https://registry.justice.gov.ck/public/howto.aspx?cn=SetupClient
