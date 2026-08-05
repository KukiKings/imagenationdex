# IN$DEX Current Claude Handoff

**Recorded:** 5 August 2026  
**Purpose:** prevent daily agents from mixing the clean Codex build with other local clones

## Verified Codex workspace

- Repository: `KukiKings/imagenationdex`
- Branch: `codex/tier0-real-otp-identity`
- Verified protocol baseline: `54daac3`
- Base: `78fb06b`
- Working tree at protocol baseline: clean
- Local product commits ahead of `origin/main`: two
  - `66dd2cf` Build verified Tier 0 identity issuance
  - `ec21d1c` Build policy-bound SIINDEX swarm and Solana adapters
- Local governance commit ahead of `origin/main`: one
  - `54daac3` Add Claude daily agent protocol
- Local quality-control commit ahead of `origin/main`: one
  - `98657c2` Add supervised quality recovery agent
- Scheduled-agent fleet update: built and verified locally after `98657c2`; included in the same commit as this handoff
- Publication status: not pushed
- Production impact: none
- Publication blocker: GitHub CLI is unavailable in the Codex workspace

## Scheduled Claude agent fleet

- Source of truth: `CLAUDE_AGENT_FLEET_BLUEPRINT.md`
- Machine registry: `claude-agent-responsibility-registry.json`
- Shared prompt guardrails: `CLAUDE_SCHEDULED_AGENT_SHARED_PREAMBLE.md`
- Fleet size: 17 scheduled agents
- Default authority: `CHECK_ONLY`
- Sole supervised local repair writer: `indx_daily_bugfix`
- Recommended cadence corrections:
  - IN$DEX Repair Queue: daily queue check and `REPAIR_REQUIRED` event
  - SIINDEX Security Monitor: daily and provider-alert event
  - SIINDEX Weekly COO Audit: weekly, with the misleading daily name retired
- Live Claude scheduler status: unchanged. Claude's human-verification screen blocked the controlled browser on 5 August 2026.
- Do not report these cadence or prompt updates as live until each scheduled task has been updated and re-read from Claude.

## Separately reported Mac workspace

AJ reported another clone at:

`/Users/arthurjohnhenry/CoWork/Projects/ImageNation DEX`

Claude reported that clone at commit `5e8d784` with 139 unstaged files and six canon fixes mixed into other work. Treat those details as reported, not verified from this workspace.

Do not run `git add -A`, rebase, push `main` or combine this Mac worktree with the clean Codex branch. Inspect and branch the Mac work separately before any write.

## Next approved product sequence

1. Publish the clean Codex branch without altering its two existing commits.
2. Open a draft pull request into `main`.
3. Run pull-request and preview checks.
4. Merge only after AJ approves the verified preview.
5. Apply the Tier 0 and swarm Supabase migrations in the private environment.
6. Deploy the private swarm runtime.
7. Run authenticated Tier 0, command-centre, Solana Pay, x402 and media workflow tests.

## Daily-agent reminder

Read `CLAUDE_AGENT_PROTOCOL.md`, `CLAUDE_AGENT_FLEET_BLUEPRINT.md`, the agent's exact registry record and the protected Master Mega-Prompt before acting. Scheduled checks remain read-only unless AJ gives a separate implementation or publication instruction.

Use `QUALITY_RECOVERY_PROTOCOL.md` for any supervised defect repair. Codex and Claude must follow its one-writer rule and use `QUALITY_RECOVERY_REPORT_TEMPLATE.md` for evidence.
