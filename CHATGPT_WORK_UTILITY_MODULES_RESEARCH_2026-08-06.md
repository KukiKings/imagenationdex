# IN$DEX ChatGPT Work Utility Modules

Date: 6 August 2026

Status: RESEARCHED AND PLANNED

Production impact: None

This document converts AJ's proposed ChatGPT Work use cases into buildable IN$DEX modules. Vendor capability does not prove an IN$DEX integration is installed, safe, tested or live.

## 1. Architecture decision

Use separate provider adapters behind the SIINDEX control plane.

| Module | Primary role | Initial permission |
|---|---|---|
| HeyGen | Consent-bound SIINDEX digital twin | Private render preparation |
| Higgsfield | Image, short-video and campaign production | Private draft generation |
| Record & Replay | Stable internal workflow skills | Quality assurance and preparation |
| Semrush | Search visibility and competitor evidence | Read only |
| Clay | Partner and organisation research | Read and draft only |
| ChatGPT Sites | Private dashboards and knowledge tools | Save without deploying |
| Zapier | External application actions | Blocked until action allowlists pass |

Every adapter requires:

- Named owner
- Approved purpose
- Authentication owner
- Exact data classes
- Exact actions
- Exact destinations
- Cost ceiling
- Retention period
- Consent basis
- Human-review rule
- Failure and retry behavior
- Revocation and exit route
- Evidence receipt format

## 2. Media Agent

### Correct provider split

HeyGen Avatar V is the proposed real-person digital-twin engine. Higgsfield is the proposed creative-production layer.

Do not claim Higgsfield creates the persistent SIINDEX digital twin from one recording. Higgsfield documents character training and image or short-video generation. HeyGen documents the short-reference Avatar V workflow and a separate subject-consent process.

### Private workflow

1. Record AJ's explicit likeness and voice consent.
2. Record purpose, channels, expiry, revocation and retention.
3. Create the private HeyGen avatar profile.
4. Generate one private identity test.
5. Pass the approved identity reference to the creative adapter only where provider terms and consent permit it.
6. Generate campaign and educational drafts through Higgsfield.
7. Verify script facts, likeness, voice, captions, disclosure, provenance, cultural rights and accessibility.
8. Obtain AJ's final-file publication approval.
9. Publish through an approved human-controlled channel.
10. Retain generation, consent, approval and takedown receipts.

### Acceptance gates

- The subject and permitted purpose match the consent record.
- A revoked consent record blocks new renders.
- Draft output is private by default.
- No public destination exists inside the render tool manifest.
- Every public file carries synthetic-media disclosure.
- Captions and a readable transcript exist.
- One person's data never appears in another person's video.
- Vendor failure produces a recoverable draft state.

## 3. Partner research and outreach

Clay enters as a partner-research tool, not an automatic mass-contact system.

Initial approved scope:

- Research organisations relevant to Cook Islands and Pacific participation.
- Research SAS Foundry partner candidates after SAS Foundry has a current definition.
- Research Wave 3 audiences after Wave 3 has a current definition.
- Deduplicate organisations and contacts.
- Record source, timestamp and confidence.
- Prepare outreach drafts for AJ's review.

Held scope:

- Sending email or social messages.
- Bulk enrichment of citizens.
- Importing sensitive personal data.
- Contacting children.
- Contacting people without a lawful basis and consent process where required.
- Adding a person to a marketing sequence without suppression and opt-out controls.

Required controls:

- Purpose limitation
- Jurisdiction and privacy review
- Data minimization
- Do-not-contact and suppression list
- Duplicate prevention
- Source and freshness evidence
- Credit ceiling
- AJ approval before external contact
- Reply, correction and deletion handling

## 4. Record & Replay

Use Record & Replay for stable, visible workflows with clear success criteria.

Good first recordings:

- Walk through Tier 0 acceptance testing with designated test accounts.
- Capture a public-page visual regression checklist.
- Prepare a weekly evidence report.
- Triage support requests into draft categories.
- Prepare moderation flags and response drafts.

Do not use recorded browser steps as the production engine for:

- OTP delivery or verification
- Identity issuance
- Account recovery
- Wallet creation
- Payment signing
- Governance execution
- Citizen record deletion
- Public media publication

Recorded workflows must contain no passwords, API secrets, OTP values, identity documents, wallet credentials or private citizen records.

## 5. Semrush research

Start with a read-only baseline for `imagenationdex.com`.

Evidence outputs:

- Crawl and indexing defects
- Broken links and redirect chains
- Metadata and structured-data defects
- Mobile and performance findings
- Search demand themes
- Competitor and content-gap evidence
- Public-claim conflicts
- Pacific and Cook Islands relevance

Do not promise ranking outcomes. Convert findings into reviewed issues. Code changes follow branch, test, preview and deployment approval.

## 6. Sites

The first Site should be a private Build Evidence and Governance Dashboard.

Views:

- Utility status
- Acceptance windows
- Build evidence
- Defects and owners
- Provider register
- Consent and approval status
- Governance proposals
- Cook Islands registration readiness
- Founder decisions

Sites deployments are production deployments. Save the first version without deploying. Review authentication, data retention, privacy, access control and displayed claims before any shareable URL is created.

Sites is a presentation and workflow surface. Supabase and the approved IN$DEX services remain the system of record.

## 7. Zapier

Zapier documents thousands of connected applications and real external actions. Dynamic tool discovery creates a conflict with the IN$DEX deny-by-default manifest.

Before connection:

1. Select one low-risk action.
2. Name one account and destination.
3. Restrict the service credential.
4. Disable or contain undeclared actions.
5. Add idempotency and rollback.
6. Test in a private environment.
7. Record an evidence receipt.

No Zapier workflow handles identity issuance, funds, governance execution, citizen-wide messages or public publication in the first release.

## 8. Scheduled work

Scheduled tasks start with read-only monitoring and draft preparation.

Approved initial jobs:

- Weekly search-visibility evidence report
- Weekly provider quota and failure report
- Daily private build-evidence refresh
- Weekly partner-research draft queue
- Daily defect triage with no automatic merge or deployment

Rules:

- Test every task manually first.
- Use an isolated worktree for repository changes.
- Keep durable instructions in the task prompt or attached skill.
- Give the task the narrowest filesystem and network access.
- No external communication or production mutation from an unattended run.
- Review the first three runs before enabling the steady schedule.

## 9. Recommended order

| Priority | Build | Exit evidence |
|---|---|---|
| P0 | Connector registry and permission manifests | Every provider has an owner, purpose, data scope and revocation path |
| P0 | Private SIINDEX media proof | Consent, draft, disclosure, captions and takedown pass |
| P0 | Private Build Evidence and Governance Site | Saved without deployment and reviewed against source data |
| P1 | Semrush read-only baseline | Findings converted into reviewed issues |
| P1 | Record & Replay quality-assurance skill | Replays with test data and no secrets |
| P1 | Clay partner-research pilot | Ten deduplicated organisations with sources and no outreach |
| P2 | Zapier single-action pilot | One allowlisted reversible action with receipt and rollback |

## 10. Source register

- OpenAI Record & Replay: https://learn.chatgpt.com/docs/extend/record-and-replay
- OpenAI scheduled tasks: https://learn.chatgpt.com/docs/automations
- OpenAI Sites: https://learn.chatgpt.com/docs/sites
- OpenAI plugins: https://learn.chatgpt.com/docs/plugins
- Higgsfield MCP: https://higgsfield.ai/mcp
- HeyGen Avatar V: https://help.heygen.com/en/articles/14602974-avatar-v-is-now-available-on-heygen
- HeyGen consent video: https://help.heygen.com/en/articles/12092609-recording-your-consent-video
- Clay in ChatGPT: https://university.clay.com/docs/using-clay-in-chatgpt
- Semrush MCP: https://developer.semrush.com/api/v4/introduction/semrush-mcp/
- Zapier MCP: https://docs.zapier.com/mcp/home

## 11. Current boundary

These modules are researched and planned. None is recorded as installed, connected, tested or live for IN$DEX.

Installing a plugin, authenticating a provider, sending outreach, publishing media or deploying a Site requires its own scoped action and evidence.

## 12. Sovereign-civilization framework intake

AJ submitted a broader governance, commerce, media, data, Cook Islands and Sites service framework on 6 August 2026. The useful modules enter the living build. Conflicting claims remain research items until resolved.

| Submitted concept | Build decision |
|---|---|
| `Sovereign Republic` | Hold as an unresolved brand concept. Never imply a legally sovereign state or government. |
| `14 Pillars` | Hold until AJ supplies the fourteen names and maps them to Learn, Create, Earn, Own, Govern and Legacy. |
| 4.2-second biometric onboarding | Reject as a current Tier 0 claim. Tier 0 remains phone consent, real SMS OTP, name.IN$DEX and portal activation with no face scan. |
| Wisdom-weighted voting | Research for advisory expertise and proposal review. Do not use an opaque score to control binding citizen rights. |
| SovereignPay performance | Treat sub-cent and sub-second behavior as a network reference and private-test target, not an IN$DEX guarantee. |
| 100 businesses in 90 days | Treat as a proposed SAS Foundry experiment, not verified capacity or a public promise. |
| Autonomous commerce | Keep preparation and verification automatic. Identity, funds, refunds, public communications and binding governance stay policy and approval controlled. |
| Self-optimizing swarm | Limit to measured recommendations and versioned proposals. Agents do not expand their own permissions or deploy their own changes. |
| Unlimited digital-twin videos | Reject. Current HeyGen plans use quotas or credits. |
| 175+ languages | Record as a current HeyGen plan claim. Test every chosen language, accent, script, caption and lip-sync result before publication. |
| Sites funds the IN$DEX liquidity pool | Hold. Sites service revenue and INDX liquidity are separate financial decisions. |

## 13. Sites commercial-service experiment

Sites supports hosted full-stack applications, lightweight D1 structured storage, R2 object storage, private access, public sharing where enabled and custom domains where available.

Limits that govern every client offer:

- Every deployment URL is production.
- Availability depends on plan, region and workspace settings.
- Usage and storage limits apply.
- Sites does not provide data or inference residency at launch.
- Sites must not process payment-card data or protected health information.
- Sites must not enable financial transactions.
- Sites must not target children below the applicable digital-consent age.
- A separate scheduled task refreshes approved data. The Site does not schedule itself.
- The client offer must disclose hosting, access, storage, retention and platform dependency.

### Offer A: Lead-form website

Initial scope:

- Public service information
- Contact or booking request form
- Private submission view
- Spam controls
- Consent notice
- Export and deletion path
- Mobile and accessibility checks

Do not promise a finished client site in ten minutes. Measure discovery, copy, design, domain, privacy, testing, revisions, deployment and handover time.

### Offer B: Search-visibility audit

Initial scope:

- Semrush evidence
- Technical findings
- Content gaps
- Prioritized ninety-day work plan
- Private client dashboard
- Source freshness and limitations

Do not promise rankings, traffic or revenue. Separate audit fees from implementation fees.

### Offer C: Private operational dashboard

Initial scope:

- Approved business metrics
- Source freshness
- Filters and calculations
- Data-quality warnings
- Scheduled draft refresh

Exclude protected health data, payment-card data and regulated financial processing. Email, calendar and task connections require the client's exact permission.

### Offer D: Partner-research campaign

Initial scope:

- Client-approved ideal organisation profile
- Deduplicated companies and professional contacts
- Source and freshness evidence
- Draft outreach only
- Suppression and opt-out controls

No bulk sending, hidden scraping, purchased lists without provenance or contact with children.

### Offer E: Member portal

Initial scope:

- Authenticated access where supported
- Member resources
- Progress or request tracking
- Admin review
- Export and deletion path

Do not claim Sites replaces a regulated identity, payment, learning-management or community-safety system.

## 14. Commercial evidence gates

Prices in the submitted framework are hypotheses with unspecified currency.

Before publishing a service package:

1. Select AUD or NZD.
2. Record provider credits and subscriptions.
3. Measure discovery, build, testing, revisions, deployment, support and handover time.
4. Define included pages, forms, storage, integrations and revision count.
5. Define domain, hosting and data ownership.
6. Prepare terms, privacy notice, consent wording and refund rules.
7. Calculate tax, payment fees, refund reserve and support margin.
8. Complete one consenting pilot.
9. Record the result and client feedback.
10. Price from evidence.

Revenue projections of USD 2,000 to 10,000 per month are not forecasts. They are scenarios requiring lead volume, close rate, delivery capacity, churn, support and margin evidence.

## 15. Revenue and liquidity boundary

Service income does not flow automatically to an INDX liquidity pool.

Required order:

1. Receive revenue through the approved legal business channel.
2. Record tax and accounting treatment.
3. Cover direct provider costs, refunds and support obligations.
4. Maintain an operating and incident reserve.
5. Keep repayable family or friend capital separate.
6. Obtain legal, token, custody, accounting, allocation, multisignature and founder approval for liquidity.
7. Transfer only an approved amount through an auditable treasury process.

No Site, scheduled task, agent or connector performs the transfer.

## 16. Cook Islands corrections

- The Ministry of Justice registry lists NZD 75 for a Cook Islands company-incorporation application.
- The Incorporated Societies Act requires at least 15 people and a purpose not for pecuniary gain.
- The current society-incorporation fee is NZD 50, not NZD 30.
- The general election is scheduled for 12 August 2026.
- No reviewed official source makes the election a prerequisite for ordinary company registration.
- Image Nation Dex Limited registration preparation should continue now.
- Civilisation Fund structure needs Cook Islands legal and tax advice before choosing a society, company or another vehicle.

## 17. Revised thirty-day evidence plan

| Week | Core build | Commercial experiment |
|---|---|---|
| 1 | Continue Tier 0 private-environment preparation | Define one lead-form offer, currency, contract, privacy and demo acceptance tests |
| 2 | Continue wallet and Media Agent private testing | Build one private demo and measure total delivery time |
| 3 | Continue swarm dependency and security review | Run one consenting pilot with no financial transactions |
| 4 | Continue whole-system integration | Review cost, quality, support load and demand before public outreach |

The commercial experiment does not replace the committed IN$DEX build. It runs as a separate, measured workstream.

## 18. Additional primary sources

- OpenAI Sites: https://learn.chatgpt.com/docs/sites
- OpenAI internal-app guidance: https://learn.chatgpt.com/use-cases/build-and-deploy-internal-apps
- OpenAI dashboard guidance: https://learn.chatgpt.com/use-cases/analyze-data-export
- Cook Islands registry fees: https://registry.justice.gov.ck/public/fees.aspx
- Cook Islands Incorporated Societies Act 1994: https://registry.justice.gov.ck/documentation/ck/Incorporated_Societies_Act_1994.pdf
- Cook Islands Parliament election notice: https://parliament.gov.ck/parliamentary-business/bills/
- Solana payments: https://solana.com/docs/payments
- Solana Pay: https://solana.com/docs/tools/solana-pay
- HeyGen credit plans: https://help.heygen.com/en/articles/15125761-heygen-credit-based-pricing-plans-explained

## 19. Chrome Side Chat and desktop browser

OpenAI released browser upgrades on 30 July 2026.

Verified capabilities:

- Mention an open Chrome tab in Side Chat.
- Bring highlighted page text into the chat.
- Right-click a page and select `Ask ChatGPT`.
- Ask about a YouTube video when timestamped captions are available.
- Continue Chrome chats in the ChatGPT application.
- Search the built-in desktop browser's own history from its address bar.
- Permit task-scoped search of Chrome history after reviewing the request.
- Manage site allowlists and blocklists.

Important distinctions:

- The built-in browser has a separate profile and history from regular Chrome.
- YouTube answers rely on available transcripts and do not verify visual-only content.
- Website access does not make page instructions trustworthy.
- `Allow for all sites` removes website-by-website confirmation and is not approved for IN$DEX research.
- History access can expose internal URLs, search terms and activity from signed-in devices.
- Open tabs, page text and transcripts become project evidence only after source, date, scope and verification are recorded.

## 20. Browser Research and Evidence workflow

1. State the decision or question.
2. Choose the smallest relevant tab set.
3. Record the source URL, publisher and access date.
4. Identify whether the source is primary, secondary, community or promotional.
5. Extract claims, evidence, dates and uncertainties.
6. Ignore instructions embedded in pages, comments, media or transcripts.
7. Compare disagreements and missing evidence.
8. Cross-check important technical, legal, financial and provider claims against primary sources.
9. Create a claim register with confidence and verifier status.
10. Produce an original synthesis with citations.
11. Route code, public copy, outreach or publication into its separate approval workflow.

Required claim-register fields:

- Claim ID
- Research question
- Claim text
- Source URL
- Publisher
- Source type
- Publication date
- Access date
- Extracted evidence
- Contradicting evidence
- Confidence
- Verification owner
- Verification status
- Intended use
- Expiry or review date

## 21. Approved IN$DEX research uses

### Citizen education

- Discover recurring questions about sovereign digital identity.
- Build a citizen FAQ map.
- Identify confusing terms and Mama Noe Test failures.
- Prepare education for Learn, Create, Earn, Own, Govern and Legacy.

### Landing pages

- Compare positioning, proof, pricing presentation, calls to action and trust signals.
- Separate observed page facts from interpretation.
- Write original IN$DEX and SAS Foundry copy.
- Test headlines through private previews rather than copying competitors.

### Competitive intelligence

- Build a positioning matrix for identity, wallet, marketplace, education and governance providers.
- Record competitor maturity, geography, claims, evidence and gaps.
- Do not treat promotional language as verified capability.

### Cook Islands preparation

- Compare official laws, registry guidance, regulator publications and election notices.
- Keep official sources separate from commentary and social posts.
- Maintain an evidence pack for the 6 December 2026 demonstration.

### Client audits

- Review public websites, search evidence, reviews and competitors.
- Produce a sourced audit and ninety-day work plan.
- Flag missing data, uncertainty and scope limits.
- Keep client credentials and private analytics outside the browser workflow unless separately approved.

### Partner and investor preparation

- Research organisations, mandates, public portfolio evidence and meeting context.
- Prepare internal briefing notes and draft questions.
- No automated contact, investment claim, token promotion or liquidity discussion.

## 22. Submitted claims held or retired

| Submitted claim | Current decision |
|---|---|
| Side Chat reads every open tab automatically | Correct to selected or task-relevant tab context with website permissions. |
| YouTube answers require no viewing | Correct to transcript-based answers when captions are available. |
| Twenty or more tabs always synthesize reliably | Unverified. Start small and retain source evidence. |
| Content research saves 80 percent | Unverified until measured. |
| Competitor analysis saves 75 percent | Unverified until measured. |
| Landing-page analysis saves 70 percent | Unverified until measured. |
| Market intelligence saves 70 percent | Unverified until measured. |
| SEO audits save 65 percent | Unverified until measured. |
| The Chrome extension is free with Work | Not established by the reviewed OpenAI documentation. |
| Clay includes a fixed 2,000-credit free tier | Current offers vary. Verify the connected account. |
| Semrush includes a fixed fourteen-day trial | Current offer varies. Verify before public pricing. |
| Three to five clients create USD 2,000 to 10,000 monthly | Scenario only, not a forecast. |
| Service income automatically funds INDX liquidity | Held under the protected liquidity boundary. |
| DUNA governance education | Rejected as current IN$DEX structure. Historical comparison only. |
| Fourteen Pillars content | Held until AJ defines and maps the structure. |
| Wisdom-Weighted Voting education | Hold binding-vote claims. Advisory Wisdom Score research only. |
| Grand Synchronicity | Undefined in the current living build. Do not use publicly without AJ's current definition. |

DUNA remains rejected. It may appear only in a clearly labelled historical or comparative analysis.

## 23. Research service acceptance gates

Before selling a competitor, landing-page or multi-source research service:

- Define the currency and scope.
- Define the number and type of sources as a service limit, not a quality guarantee.
- Obtain client permission for non-public sources.
- Use a domain allowlist.
- Retain citations and access dates.
- Check important claims against primary sources.
- Separate observed facts, inference and recommendations.
- Run originality and confidential-data checks.
- Disclose tool and source limitations.
- Measure total delivery and review time.
- Define revisions, support, data deletion and refund terms.
- Keep output draft-only until client review.

## 24. Additional OpenAI primary sources

- OpenAI Chrome extension: https://learn.chatgpt.com/docs/chrome-extension
- OpenAI built-in browser: https://learn.chatgpt.com/docs/browser
- OpenAI 30 July 2026 changelog: https://learn.chatgpt.com/docs/changelog
