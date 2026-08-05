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
