# IN$DEX Codex Agent Instructions

These instructions apply to every Codex session working in this repository.

## Mandatory reading

Before consequential work, read in this order:

1. AJ's current explicit instruction.
2. `INDEX_SIINDEX_LIVING_BUILD_DIRECTIVE_V4_3.md`.
3. `project-status/living-verified-status.json`.
4. The protected parent `CLAUDE.md`, when available, for safety and workspace instructions only.
5. `CLAUDE_AGENT_PROTOCOL.md`.
6. `QUALITY_RECOVERY_PROTOCOL.md`.
7. `CLAUDE_AGENT_FLEET_BLUEPRINT.md` and `claude-agent-responsibility-registry.json` when scheduled-agent work is involved.
8. `CLAUDE_CURRENT_HANDOFF.md`.
9. Current repository tests and verified deployment evidence relevant to the task.

The historical Mega-Prompt is not required and does not control product scope.

If the Living Build Directive or Living Verified Status is missing, contradictory, expired for the requested action or inconsistent with AJ's current instruction, stop consequential work and report `BLOCKED_BY_SOURCE`.

## Required behaviour

- Use SI or Synthetic Intelligence for SIINDEX.
- Treat IN$DEX as a Sovereign Digital Civilization and Sovereign Opportunity Economy.
- Keep product scope open and expandable. Do not freeze new utilities behind a permanent feature list.
- Prove the repository path, remote, branch, HEAD and working-tree state before edits.
- Follow the one-writer rule in `QUALITY_RECOVERY_PROTOCOL.md`.
- Reproduce a defect before repairing it.
- Make the smallest complete repair within AJ's approved scope.
- Run targeted tests and all affected cross-cutting gates before handoff.
- Preserve unrelated user changes.
- Leave the evidence-backed handoff required by `CLAUDE_AGENT_PROTOCOL.md`.

## Permanent boundaries

- Do not change protected safety, security, privacy, consent or approval controls, or `CLAUDE.md`, without AJ's explicit approval for the exact change.
- Do not stage unexplained files or use `git add -A` in a mixed working tree.
- Do not rebase a dirty working tree.
- Do not delete `.git/index.lock` automatically. Prove no Git process is active and obtain approval for the exact recovery action.
- Do not commit, push, merge, deploy, migrate data or modify production unless AJ's current instruction explicitly authorises that action.
- Do not weaken tests to make a failure disappear.
- Do not expose secrets, citizen data, credentials or private keys.
- Do not give an SI agent custody of keys, funds, identities, votes or public publication authority.

The daily checker remains read-only. It reports defects as `REPAIR_REQUIRED`. The Quality and Recovery Agent performs supervised repairs only after the current task authorises implementation.
