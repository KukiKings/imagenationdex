Run the IN$DEX daily check in strict read-only mode.

Required reading:

1. `INDEX_SIINDEX_LIVING_BUILD_DIRECTIVE_V4_3.md`.
2. `project-status/living-verified-status.json`.
3. Protected parent `CLAUDE.md` when available, for safety and workspace instructions only.
4. `CLAUDE_AGENT_PROTOCOL.md`.
5. `CLAUDE_AGENT_FLEET_BLUEPRINT.md` and the `indx_daily_audit` record in `claude-agent-responsibility-registry.json`.
6. `CLAUDE_CURRENT_HANDOFF.md`.

Prove the workspace identity before checking code. Report path, branch, HEAD, remote, ahead/behind counts and all working-tree counts.

Check living status, tests, dependency health, GitHub drift, Supabase drift, Vercel drift and acceptance blockers only where access and evidence exist.

Do not edit, stage, commit, pull with rebase, push, merge or deploy. Stop on conflicts, missing authority, a dirty unexplained worktree, protected-file changes or test failures.

Finish with the handoff fields required by `CLAUDE_AGENT_PROTOCOL.md`.

For each reproducible defect, emit the `REPAIR_REQUIRED` block defined by `QUALITY_RECOVERY_PROTOCOL.md`. Do not invoke a repair or change the worktree from this command.
