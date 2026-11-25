# Skill Hiring Roadmap for IN$DEX

Status: plan only, as of 2026-11-24. Owner: Arthur (AJ). Extends [DISPATCHER-MODEL.md](DISPATCHER-MODEL.md) (section 5, "Skill assignment") and [SUB-AGENT-CONSENT-MODEL.md](SUB-AGENT-CONSENT-MODEL.md). Nothing in this file creates a skill, changes code or grants anything. Each step below needs AJ's go-ahead as a normal repo change before its directory exists.

## 1. Current state

Eighteen skills can be named through `assignSkill()` in `agents/orchestrator.js`. The consent gates are unchanged: tier 1 runs and is logged, tier 2 runs and notifies, tier 3 needs a complete consent record, tier 4 is blocked, and an unknown tier counts as tier 3. `presentation-materials` is the first concrete hire: read-only, tier 1, and it reports findings on the December Cook Islands one-pager and spoken script.

## 2. Crucial roles still missing or thin

- **Knowledge refresh.** No skill checks whether public facts in our materials are still true: the CAWG silence line, the status of the bill under review, and other regulatory updates. `presentation-materials` covers only two documents.
- **Security-audit remediation tracker.** The open findings in `security-audits/README.md` are tracked by hand. Nothing reports which are closed, with evidence.
- **Cook Islands registration status.** The steps are written down in `docs/legal/cook-islands-registration-steps.md`. Nothing reports where each step stands.
- **SMSGlobal and Cannon follow-up.** SMS is a live service. The order names "Cannon" but I found no definition of it in this repo, so its scope is for AJ to state. There is no skill for it and none is proposed below.
- **Multi-agent verification.** Findings from one skill are not independently re-checked by another. A verification workflow exists outside this repo as a user skill; it is not assignable because there is no directory under `SIINDEX-Skills/`.
- **Privacy-pill demo readiness.** The pill demo is checked by scripts run by hand (`verify-public-surface`, `verify-siindex-voice`). No skill reports readiness before a meeting.

## 3. Hiring order for December readiness

Every step is tier 1 and read-only. A step stays tier 1 until AJ explicitly raises it. Each skill reports findings only and never writes a file, sends a message or changes another skill.

1. **`knowledge-refresh`** (new, tier 1). Checks each public fact claimed in the one-pager and spoken script against primary sources, with the source and the retrieval date. Done: a report that lists every claim as current, changed or unverifiable, with a link for each, and nothing guessed.
2. **`cook-islands-registration-status`** (new, tier 1). Reads `docs/legal/cook-islands-registration-steps.md` and the correspondence drafts, and reports where each step stands. Done: a table of steps with a state and the evidence for it, with "unknown" wherever there is no evidence, and a list of what only AJ can confirm.
3. **`demo-readiness`** (new, tier 1). Reads the live public pages and runs the existing verifiers, then reports whether the privacy pill shows the right text in the three scenarios and whether the voice endpoint answers. It makes no change and sends no test data to citizens. Done: a pass or fail line for each scenario and each verifier, the console and CSP errors found, and the things it cannot test (a real iPhone, a real microphone).
4. **`multi-agent-verify`** (new, tier 1). Takes a findings report from another skill and re-checks each claim independently against its primary source. Done: agree or disagree for every claim, with evidence, run once on the step 1 report before the meetings.
5. **`security-audit-tracker`** (new, tier 1). Reads `security-audits/README.md` and the repo code, and reports each finding as open, closed or partly addressed, with file and line evidence. It reads code only. Done: one line per finding with its current status and the evidence, and a note where the audit's own status column disagrees with the code.

The SMSGlobal and Cannon follow-up is not in the five. It touches a live service, so no skill is proposed until AJ states its scope.

### Optional external fact-check tools (secondary signals only)

No external fact-check service is required for the December materials. These tools do not replace primary-source checks or AJ's final judgment. The rule stays: primary source, plus the date checked, and "cannot be confirmed" when the source does not support the claim. They can flag that a public claim has already been reviewed or may have changed.

- Google Fact Check Tools API (Claim Search), optional: existing fact-checks from 800+ publishers.
- ClaimBuster, optional: scores sentences for check-worthiness (triage only).
- Verity MCP / Parallel Decisions, optional: structured agent-native verdicts (CURRENT/OUTDATED/DISPUTED or supported/contradicted).

Use only after the primary source is fetched. List every external call in the skill report. Return results only to SIINDEX. No standing credentials or automatic spend.

### Solana December demo path (live)

`solana-sas-onboarding`, `solana-usdc-routing`, `solana-compliance-attest` and `solana-mobile-wallet-status` are now live tier-1, read-only skills, on main and assignable by name.

They form the primary December demo path, in this order: progressive SAS KYC, then a cost and path quote, then compliance status, then mobile wallet readiness (Samsung Wallet, keyless model).

Solana remains the settlement layer only. No funds move. Primary sources are required. "Cannot be confirmed" stays the default for any claim that is not verified. These are instruction files only: they run no code and cannot check anything that needs a real device.

## 4. Rules that never change

- Naming a skill is not consent. A yes covers one skill and one change.
- No standing credentials. No skill holds Supabase, Cloudflare or SMSGlobal credentials with autonomous judgment.
- Silence is no. A late or missing answer never counts as approval.
- SIINDEX is the only voice. Skills return findings to SIINDEX, not to a citizen or an outside party.

## 5. Out of scope until after the December meetings

- A continuous daemon, or any skill that polls or schedules itself.
- Auto-hire: an agent creating a skill directory on its own.
- Any skill that writes files or sends messages without a fresh tier-3 packet.

SIINDEX prepares · AJ authorizes
