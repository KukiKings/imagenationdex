# Dispatcher Model for IN$DEX

Status: operating rule. Owner: Arthur (AJ). Extends [SUB-AGENT-CONSENT-MODEL.md](SUB-AGENT-CONSENT-MODEL.md).

## Role

The dispatcher sits above all specialist agents: security, auth, SMS, registry, deploy, and the monitors. It:

1. Reads incoming tasks and alerts.
2. Routes each one to the right specialist.
3. Filters specialist output before it reaches Arthur, so he sees decisions and exceptions, not raw noise.

The dispatcher does not hold standing Supabase, Cloudflare, or SMSGlobal credentials with autonomous judgment (see the consent model, section 3). It routes and gates; the change itself runs only after the gate for its tier is met.

## 1. Risk-tiered gates

Approval is matched to risk, not applied to everything.

| Tier | Kind of work | Gate |
| --- | --- | --- |
| 1 | Read-only: audits, log checks, config reads, verifying a setting stuck | Auto-execute. Log only. |
| 2 | Reversible writes | Auto-execute, then notify Arthur. |
| 3 | Irreversible or financial changes | Explicit yes from Arthur before execution. |
| 4 | Anything outside policy | Blocked at the gateway. No approval path. |

Rules that fix the tier:

- **Security settings are tier 3 even when reversible.** Rate limits, CAPTCHA, redirect allow-lists, templates, secrets, auth providers, DNS and domain records, and function deploys that change auth or SMS behaviour all need a yes first, as the consent model already requires. Tier 2 never covers them.
- **When unsure of the tier, take the higher one.**
- **Tier 4 has no override.** A request cannot be promoted to tier 3 by asking more firmly or by Arthur's say-so in the same message that proposed it; policy has to change first, in this repo.

## 2. Review packets for tier 3 and tier 4

Every tier-3 or tier-4 item reaches Arthur as a review packet that answers four questions:

1. **What the agent wants to do.** The change in one sentence, with before and after values.
2. **Why it thinks that is right.** The evidence and reasoning.
3. **What could go wrong.** Failure modes, blast radius, and how to roll back, if it can be rolled back.
4. **Alternatives considered.** At least one other option, including doing nothing.

A bare yes or no is forbidden. The one-tap yes or no from the consent model is allowed only attached to a complete packet, never in place of one. A packet with any of the four answers missing is returned to the agent, not sent on.

Tier 4 packets are informational: they say what was blocked and why. They carry no yes button.

Each tier-3 packet is filed as a dated entry in the consent queue before execution, with the seven fields filled and the agent run ID recorded (see the consent model, section 4, and consent-queue/TEMPLATE.md).

## 3. Timeout: do nothing and escalate

If Arthur does not respond within the packet's stated window:

- The action does **not** run. No answer means no.
- The dispatcher escalates: it re-surfaces the packet on a second channel and marks the entry in the queue as unanswered.
- Silence, delay, or a late answer never counts as approval. A yes given after the window applies only if the packet is re-issued with current values.
- There is no default-approve path for any tier-3 item, and no timeout can lower an item's tier.

## 4. What the dispatcher prioritizes now

The open findings in [security-audits/README.md](security-audits/README.md) (2026-11-02 audit) come first. As of that audit:

- Finding 2: account-recovery phone lookup (get_citizen_by_phone via the anon key).
- Finding 3: PKCE missing on every OTP client except onboard.html (since then partly addressed in code; confirm the audit status before routing).
- Finding 5: shouldCreateUser true on public email sends.
- Finding 6: Content-Security-Policy, now report-only; enforcement is blocked by inline scripts.
- Finding 7: session stored in localStorage.

Read the README's current status column before routing; it is the source of truth, not this list.

## 5. Skill assignment

Skills under `SIINDEX-Skills/` can be assigned by name. This is wiring only: no new skills, no change to any skill's own text, no new credentials, no daemon, no auto-hire.

1. **SIINDEX names the skill.** She gives the orchestrator the skill's directory name (for example `siindex-devops`), the tier of the task, and, for tier 3, the consent record.
2. **The orchestrator looks it up.** `assignSkill()` in `agents/orchestrator.js` matches the name against the directories that actually contain a `SKILL.md`. The name is never used to build a path. Anything else, including an empty name, `../x` or an archive-only skill, returns `skill_not_registered`.
3. **The skill runs under the consent model.** The tier gate in section 1 and the review packet in section 2 apply unchanged:
   - Tier 1: proceeds, logged.
   - Tier 2: proceeds, with `notify_required` set so Arthur is told.
   - Tier 3: refused (`consent_required`, `consent_incomplete` or `consent_expired`) unless the record shows a yes from Arthur for **that skill**, a filed consent-queue entry, a run ID, all four packet answers, and an answer given inside the window.
   - Tier 4: `blocked_tier_4`, no override.
   - A missing or invalid tier counts as tier 3, and a task marked `security_setting` is at least tier 3.
4. **The filtered result returns to SIINDEX.** The orchestrator returns the skill's `SKILL.md` text and a short description to SIINDEX, not to Arthur and not to a citizen. SIINDEX is the only voice; she decides what to say.

Where it stops:

- Assigning a skill reads one file. It makes no network call and builds no Supabase client. An `agent_audit` row is written only when the caller passes its own client.
- A skill's `SKILL.md` is instructions, not code. The orchestrator runs none of it. Any change a skill describes still goes through the gates above, one change at a time.
- Skills do not hold standing Supabase, Cloudflare or SMSGlobal credentials with autonomous judgment (consent model, section 3).
- Skills that mention live money, tokens, wallets or pool actions describe plans. They are not evidence that any of that is live.

### Hiring a new position

A "hire" is a new skill directory. Nothing else registers it.

1. **SIINDEX prepares the skill.** She drafts `SIINDEX-Skills/<name>/SKILL.md`. The directory name is the name she will use to assign it: lowercase letters, digits and hyphens. The file states its goal, what it reads, what it may and may not do, the highest tier it asks for, and what done looks like.
2. **Arthur authorizes it.** The new directory is a normal repo change. It enters main only when Arthur has asked for it or approved it. This is the same "SIINDEX prepares · AJ authorizes" rule as everything else here, and a hire is never made by an agent on its own.
3. **The orchestrator finds it by scanning.** `assignSkill()` lists the directories under `SIINDEX-Skills/` and accepts a name only if a directory of exactly that name holds a regular file called `SKILL.md`. There is no registration table, no list to edit and no code change.
4. **It runs under the existing rules.** The tier of each task is set when the task is assigned, not by the skill. A skill cannot raise its own tier or lower the tier of a task. Tier 3 still needs a consent record and a four-answer packet for that skill, tier 4 is still blocked, and an unknown tier counts as tier 3.
5. **Being registered grants nothing.** A new skill gets no credentials, no write path and no outbound channel from being listed. Anything it describes that changes something still goes through the gates in sections 1 and 2.
6. **No continuous running.** A hire is assigned a task one call at a time. It does not start a daemon, poll, schedule itself or hire another skill.

To take a skill out of service, remove or rename its directory by the same route. The name then returns `skill_not_registered`.

Example: `presentation-materials` is a read-only skill that checks the December Cook Islands one-pager and spoken script and reports findings. It is tier 1 and changes no file.

`multi-agent-verify` is now a named skill: it is read-only, tier 1, and re-checks each claim in another skill's findings report against its primary source, returning the result only to SIINDEX.

`knowledge-refresh` is now a named skill: it is read-only, tier 1, and re-checks public facts against their primary official sources, returning the result only to SIINDEX.

`cook-islands-registration-status` is now a named skill: it is read-only, tier 1, and checks Cook Islands registration and legal status facts against their primary official sources, returning the result only to SIINDEX.

`demo-readiness` is now a named skill: it is read-only, tier 1, and checks pre-meeting readiness for the December presentation, returning the result only to SIINDEX.

`solana-sas-onboarding` is now a named skill: it is read-only, tier 1, and checks progressive KYC and Solana Attestation Service status against primary sources, returning the result only to SIINDEX.

`solana-usdc-routing` is now a named skill: it is read-only, tier 1, and reports a current total-cost quote and recommended path for a USDC transfer on Solana (including fee-sponsorship and Token-2022 options), returning the result only to SIINDEX.

`solana-compliance-attest` is now a named skill: it is read-only, tier 1, and reports current sanctions and Travel Rule status for a Solana wallet or corridor against primary sources, returning the result only to SIINDEX.

`solana-mobile-wallet-status` is now a named skill: it is read-only, tier 1, and reports current readiness of mobile wallet paths (Samsung Wallet, Seeker, MWA) for keyless Solana USDC use, returning the result only to SIINDEX.

### Presentation-critical skills assignable now

| Area | Skill (directory name) |
| --- | --- |
| Materials and status | `presentation-materials`, `siindex-community-report`, `siindex-pre-build-checklist` |
| Security | `pqsi-compliance` |
| Knowledge | none: no knowledge skill directory exists |
| DevOps | `siindex-devops` |
| Citizen ops | `siindex-citizen-ops` |
| Coordination | `siindex-coo-orchestrator` |

Not assignable by name today: `pqsi-security`, `siindex-ops-brief`, `siindex-market-intel`, `siindex-anomaly` and `siindex-support`, which exist only as packaged `.skill` archives with no directory. They become assignable when a directory with a `SKILL.md` exists. Unpacking them is a separate change.

All assignable directory names (26): `cook-islands-registration-status`, `demo-readiness`, `indx-onboarding-concierge`, `indx-website-builder`, `knowledge-refresh`, `multi-agent-verify`, `pqsi-compliance`, `presentation-materials`, `siindex-agent-wallet`, `siindex-citizen-ops`, `siindex-community-report`, `siindex-coo-orchestrator`, `siindex-devops`, `siindex-git-commit-prep`, `siindex-lending-monitor`, `siindex-lp-manager`, `siindex-memedao-governance`, `siindex-pre-build-checklist`, `siindex-referral-engine`, `siindex-token-launch`, `siindex-treasury`, `siindex-waitlist-ops`, `solana-compliance-attest`, `solana-mobile-wallet-status`, `solana-sas-onboarding`, `solana-usdc-routing`.

Run `node --test agents/orchestrator.test.js` (after `npm install` in `agents/`) to check the lookup and the gates.

## 6. References

- [SUB-AGENT-CONSENT-MODEL.md](SUB-AGENT-CONSENT-MODEL.md): autonomous versus consent-required work, credentials rule, consent queue mechanics, skills.
- `SIINDEX-Skills/<name>/SKILL.md` and `agents/orchestrator.js` (`assignSkill`): the skills that can be named and how they are looked up.
- [security-audits/README.md](security-audits/README.md): open findings to prioritize.
- consent-queue/: dated consent entries and TEMPLATE.md.

*SIINDEX prepares · AJ authorizes*
