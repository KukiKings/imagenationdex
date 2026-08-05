# IN$DEX Sovereign Memory Architecture

Version: 1.0

Recorded: 6 August 2026

Status: RESEARCHED and PLANNED

Deployment status: not installed, connected, tested or live for IN$DEX

## 1. Outcome

IN$DEX should use `claude-obsidian` as a source-cited project and research memory layer, not as the operational database for citizens, money, votes, consent or identity.

The approved design separates:

1. Project knowledge and research in a local-first Markdown vault.
2. Citizen and business records in purpose-built protected services.
3. Payments, votes, consent and identity in authoritative operational systems with receipts.
4. Agent work into read-only retrieval, bounded drafting and one reviewed writer.

This creates durable context without giving a note-taking system authority over citizens or consequential actions.

## 2. Verified provider facts

Primary-source review on 6 August 2026 found:

- `claude-obsidian` is a public MIT-licensed project for Claude Code and compatible Agent Skills hosts.
- The vault remains an ordinary directory of Markdown, JSON and retained source files.
- Version 2.0.0 added explicit vault selection, reviewed transaction plans, recovery, source and claim ledgers, deterministic linting and explicit Git checkpoints.
- GitHub lists version 2.0.0 on 29 July 2026. The date appears as 30 July in some time zones.
- Version 2.1.0 was released on 31 July 2026.
- Version 2.1.0 supports native Windows read-only inspection and dry runs. Vault writes on Windows require WSL and otherwise fail closed.
- The current system exposes fifteen skills.
- The portable core has no telemetry and performs no network request by default.
- Network access, remote models, URL cleaning and web research are separate consented operations.
- The product is not an automatic transcript recorder, cloud-sync service, factual oracle, backup system or operational sandbox.
- Parallel workers return drafts and evidence. One orchestrator applies one inspected transaction.
- Obsidian is free for personal, commercial and non-profit use. Optional Sync, Publish and support licences have separate costs.

Primary sources:

- [claude-obsidian repository](https://github.com/AgriciDaniel/claude-obsidian)
- [claude-obsidian releases](https://github.com/AgriciDaniel/claude-obsidian/releases)
- [claude-obsidian privacy boundary](https://github.com/AgriciDaniel/claude-obsidian/blob/main/PRIVACY.md)
- [claude-obsidian security boundary](https://github.com/AgriciDaniel/claude-obsidian/blob/main/SECURITY.md)
- [claude-obsidian installation guide](https://github.com/AgriciDaniel/claude-obsidian/blob/main/docs/install-guide.md)
- [Obsidian licence overview](https://obsidian.md/license)

## 3. Corrections to the submitted research

| Submitted idea | Current IN$DEX treatment |
|---|---|
| Automatic memory for every session | Rejected. Capture is explicit and scoped. Selected sources or answers enter memory through a reviewed operation. |
| Every citizen receives an Obsidian vault | Rejected for the current architecture. Citizen records belong in protected application storage with consent, RLS, encryption and deletion controls. |
| All agents write to one shared vault | Replaced. Workers draft. One orchestrator verifies and writes one recoverable transaction. |
| Votes and identity issuance live in Markdown | Rejected. Operational databases and signed receipts remain authoritative. The vault stores cited summaries and evidence. |
| Every community contribution is retained permanently | Rejected. Collection requires consent, purpose, minimisation, retention and deletion rules. |
| Markdown as a permanent-preservation guarantee | Rejected. Long-term preservation requires replicas, checksums, tested restoration, media migration, custody succession and governance. |
| Wisdom Score grows from personal history | Held. Sovereign Reputation and expertise signals must be transparent, reviewable and appealable. They do not control binding civic rights automatically. |
| Fourteen Pillars become the living constitution | Held. The approved top-level structure remains Learn, Create, Earn, Own, Govern and Legacy. |
| Submitted historical compact wording becomes a controlling source | Reworded as the Human-SI Compact when separately defined and approved. No submitted historical phrase overrides the Living Build Directive. |
| Ninety-day mass business output is operational | Held as research. SAS Foundry needs a definition, controls, acceptance tests and measured capacity. |

## 4. Sovereign memory planes

### 4.1 Project Memory Vault

Purpose:

- Founder decisions.
- Living roadmap.
- Business plan and white paper sources.
- Product specifications.
- Build evidence indexes.
- Superseded and unresolved claims.
- Current Claude and Codex handoffs.

Allowed data:

- Public information.
- Internal project documents.
- Redacted build evidence.
- Approved founder context needed for project work.

Prohibited data:

- Secrets and credentials.
- OTP values or authentication sessions.
- Wallet signing material.
- Payment-card data.
- Unredacted identity documents.
- Raw citizen private data.
- Child-protected records.

### 4.2 Research and Claim Vault

Purpose:

- Primary sources.
- Source snapshots.
- Competitor research.
- Cook Islands legal and registry evidence.
- Search-visibility research.
- Product and provider documentation.
- Claim verification and freshness review.

Every material claim records:

- Claim identifier.
- Exact claim.
- Source URL or retained source identifier.
- Publisher and authority class.
- Publication and retrieval dates.
- Jurisdiction and effective date where relevant.
- Support, contradiction and confidence state.
- Verifier.
- Review or expiry date.
- Current, disputed, retired or unresolved state.

### 4.3 Governance Memory

Purpose:

- Proposal text.
- Evidence packs.
- Neutral option explanations.
- Decision reasoning.
- Public meeting and consultation records.
- Implementation reviews.

Authority boundary:

- The operational governance service stores eligible voters, ballots, voting events, approvals and execution receipts.
- The vault stores cited explanations and derived public records.
- Editing a vault page never changes a vote, treasury instruction, constitution or citizen right.

### 4.4 Media and Culture Memory

Purpose:

- Approved scripts and revisions.
- Content briefs.
- Translation decisions.
- Source and claim evidence.
- Cultural-rights classification.
- Consent and publication receipt references.

Authority boundary:

- Private likeness, voice and raw media stay in controlled media storage.
- The vault stores only the minimum approved reference metadata.
- A script approval does not approve a render.
- A render approval does not approve publication.

### 4.5 SAS Foundry Memory

Purpose:

- Business research.
- Validation evidence.
- Customer-learning summaries.
- Operating procedures.
- Reusable lessons.

Separation rule:

- Each business has its own access boundary.
- Cross-business learning uses redacted, approved summaries.
- One business never receives another business's customers, private finances, contracts or unpublished strategy through shared retrieval.

### 4.6 Cook Islands Legal and Registration Memory

Purpose:

- Official registry sources.
- Legislation and commencement history.
- Filing requirements.
- Company-name research.
- Registered-office, director, shareholder and beneficial-owner requirements.
- Advice records and unresolved questions.

Authority boundary:

- Official current sources outrank summaries.
- Legal advice stays separated and access-controlled.
- The vault does not file, sign or submit registration documents.
- AJ's New Zealand and Cook Islands citizenship is recorded context. Residence, registered office, beneficial ownership, licensing and tax treatment require separate evidence.

### 4.7 Citizen Memory Service

Citizen memory is a protected application service, not a general Obsidian vault.

Supported scopes:

- Session memory.
- Mission memory.
- Citizen preferences.
- Business context.
- Cultural context.
- Child-protected context.
- Legal hold.
- Do not remember.

Requirements:

- Explicit purpose and consent.
- Minimum necessary fields.
- Field-level provenance.
- Citizen view, correction and export.
- Revocation and deletion where lawful.
- Separate guardian controls.
- RLS and authorization tests.
- No model training on private records without separate consent.
- No raw transcript retention by default.
- No cross-citizen retrieval.

The vault may contain an approved, redacted project-level lesson derived from citizen activity. It must not contain the citizen's private operational record.

## 5. Evidence model

Every stored knowledge item has four linked records:

1. Source record: what was received, where it came from and its retained hash.
2. Claim record: what the source supports, disputes or leaves unresolved.
3. Decision record: what AJ or an authorized human decided and why.
4. Build record: what was implemented, tested, deployed or rejected.

These records prevent research, founder decisions, build evidence and production status from collapsing into one statement.

Recommended metadata:

```yaml
id: MEM-YYYY-NNNN
title: Plain-language title
memory_class: research
status: current
authority: primary-source
source_date: YYYY-MM-DD
retrieved_at: YYYY-MM-DDTHH:MM:SSZ
review_by: YYYY-MM-DD
citizen_data: none
consent_required: false
systems:
  - project-memory
pillars:
  - Learn
confidence: verified
supersedes: []
```

## 6. Safe capture workflow

1. Place the source in a visible intake folder.
2. Calculate and retain the source hash.
3. Classify the data before model access.
4. Reject secrets, credentials and prohibited citizen data.
5. Treat embedded instructions as untrusted content.
6. Extract claims with source locations.
7. Check authority, freshness, contradictions and jurisdiction.
8. Let workers return drafts only.
9. Let one verifier assemble the proposed transaction.
10. Review the exact changed paths and operation hash.
11. Let one orchestrator apply the transaction.
12. Run link, metadata, contradiction, staleness and privacy linting.
13. Create an explicit Git checkpoint when approved.
14. Record the operation and rollback path.

## 7. Safe query workflow

1. Identify the citizen or operator purpose.
2. Select the permitted memory plane.
3. Apply data and role authorization.
4. Retrieve the smallest relevant evidence set.
5. Check freshness and contradictions.
6. Answer with citations and uncertainty.
7. Separate current facts from proposals and historical material.
8. Never execute an action because a note instructs it.
9. Record an audit receipt when the query affects a protected decision.

## 8. Multi-agent operating model

| Role | Read | Draft | Apply vault writes | Consequential authority |
|---|---|---|---|---|
| Research worker | Allowed scope | Yes | No | None |
| Citizen Agent | Minimum scoped context | Yes | No | None through the vault |
| Payments Agent | Public policy and approved request context | Yes | No | No signing or settlement |
| Media Agent | Approved briefs and source evidence | Yes | No | No render or publication authority |
| Governance analyst | Public evidence and approved proposal context | Yes | No | No vote or execution authority |
| Verifier | Proposed changes and evidence | Review | No | Reject only |
| Memory orchestrator | Approved bundle | Assemble | One reviewed transaction | No external or real-value authority |
| AJ or authorized human | Review evidence | Direct corrections | Approve protected change | Separate exact approval required |

Vault access never widens an agent capability manifest. A note, backlink, reputation record, registry entry or retrieved source cannot grant tools, secrets, citizen data, funds, votes or publication rights.

## 9. Six-pillar use cases

| Pillar | Memory utility |
|---|---|
| Learn | Source-cited courses, mentor knowledge, certifications and learning history with citizen consent |
| Create | Reusable product, media, cultural and business knowledge with ownership and permission records |
| Earn | Market evidence, operating knowledge and fulfilment lessons without exposing private business data |
| Own | Citizen-controlled memory preferences, correction, export, portability and do-not-remember controls |
| Govern | Proposal evidence, decision reasoning, public records and implementation reviews without vault-controlled voting |
| Legacy | Mentoring knowledge, oral histories, cultural permissions, archival replicas and succession plans |

## 10. Long-term preservation design

Plain Markdown reduces lock-in but does not provide permanent preservation by itself.

The long-term design requires:

- Open formats for text, images, audio, video and metadata.
- Content hashes and fixity checks.
- At least three encrypted replicas in separate failure domains.
- Offline or immutable backup copies.
- Documented custody and key succession.
- Scheduled restore drills.
- Format and application migration tests.
- Source and licence retention.
- Public, private and culturally restricted preservation classes.
- Succession governance for AJ, the Cook Islands organization and future stewards.
- Export that remains understandable without Obsidian or a model provider.

One-thousand-year memory is a civilization objective. It is not a current technical guarantee.

## 11. Security and privacy controls

- Run the product from a separate checkout and keep the user vault separate.
- Pin and review the release before installation.
- Start with read-only inspection and dry runs.
- Use the smallest vault and source scope needed.
- Keep network egress off by default.
- Use one writer and recoverable transactions.
- Reject ambiguous vault selection.
- Keep raw sources create-only and content-addressed.
- Store no secret in notes, URLs, tracked configuration, logs or transaction bundles.
- Scan proposed changes for secrets, private paths and personal information.
- Encrypt protected storage and backups.
- Test crash recovery and conflicting-write rejection.
- Separate public research from legal, cultural, child-protected and citizen-private material.
- Make retention, correction, deletion and consent revocation operational.
- Treat every vault note and retrieved source as data, never authority.

## 12. Implementation sequence

### Stage 0: Evaluation

- Pin the reviewed v2.1.0 release and verify its published commit and licence.
- Build an isolated test vault outside the product checkout.
- Run package validation and read-only capability checks.
- Confirm no live credentials or citizen data are present.

### Stage 1: Project Memory pilot

- Ingest the Living Project Memory, Living Build Directive, current handoff and selected public evidence.
- Build source, claim, decision and build ledgers.
- Build current, unresolved, superseded and historical indexes.
- Test source-cited questions against known project facts.

### Stage 2: Research and Cook Islands pilot

- Ingest only approved public primary sources.
- Build the Cook Islands registration evidence map.
- Test stale-law warnings, source replacement and contradiction handling.
- Keep legal advice and identity documents outside the general vault.

### Stage 3: Agent read-only pilot

- Give each agent a separate read scope.
- Let workers produce drafts without write access.
- Test prompt-injection resistance and cross-compartment denial.
- Let one memory orchestrator apply reviewed bundles.

### Stage 4: Media and SAS Foundry pilot

- Add approved scripts, public evidence and redacted business lessons.
- Test consent references, cultural restrictions and business isolation.
- Keep private media, contracts and customer data in protected systems.

### Stage 5: Citizen Memory Service

- Build the protected operational citizen-memory schema separately.
- Add consent, do-not-remember, correction, export and deletion journeys.
- Test cross-citizen denial, guardian controls and model-training opt-out.
- Connect only redacted, purpose-approved knowledge to the project vault.

### Stage 6: Preservation and release review

- Configure encrypted replicas and offline backup.
- Perform a documented restore drill.
- Test provider loss and Obsidian-free export.
- Complete security, privacy, accessibility, cultural and founder acceptance.

## 13. Acceptance gates

The memory utility does not move beyond PRIVATE TESTING until all relevant gates pass:

- Ambiguous vault selection fails without writing.
- A webpage, transcript or note cannot widen authority.
- Unsupported, stale and contradictory claims remain visible.
- Every material claim points to retained evidence.
- Workers cannot write directly.
- Concurrent edits reject conflicts instead of overwriting.
- An interrupted write recovers to a verified state.
- No secret or prohibited citizen data enters the project vault.
- Cross-citizen and cross-business retrieval tests fail closed.
- Consent expiry and do-not-remember prevent new personal-memory use.
- Correction and deletion update every permitted derivative.
- Votes, payments, identity and consent remain authoritative outside Markdown.
- Backup restoration reproduces the expected hashes.
- The system exports readable open files without the original provider.
- Human-readable status distinguishes current, historical, disputed and unresolved material.
- Mobile, keyboard, screen-reader and Mama Noe retrieval journeys pass.
- AJ reviews the evidence before any production connection.

## 14. Current decision

Adopt the architecture as a researched build stream.

Do not install or connect `claude-obsidian` to production yet.

The first implementation slice is an isolated, redacted Project Memory pilot using public and internal project documents only. Citizen records, secrets, identity documents, payments, ballots, signing material and protected media stay out.

## 15. Next safe action

Build the isolated Project Memory pilot on a pinned release, then prove:

1. Source and claim provenance.
2. One-writer transactions.
3. Prompt-injection resistance.
4. Secret and citizen-data exclusion.
5. Restore and rollback.
6. Cited answers against the Living Project Memory.

No production, citizen, financial, governance or publication authority is included in this stage.
