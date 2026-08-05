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
- Publication status: not pushed
- Production impact: none
- Publication blocker: GitHub CLI is unavailable in the Codex workspace

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

Read `CLAUDE_AGENT_PROTOCOL.md` and the protected Master Mega-Prompt before acting. Daily checks remain read-only unless AJ gives a separate implementation or publication instruction.

Use `QUALITY_RECOVERY_PROTOCOL.md` for any supervised defect repair. Codex and Claude must follow its one-writer rule and use `QUALITY_RECOVERY_REPORT_TEMPLATE.md` for evidence.
