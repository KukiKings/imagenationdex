# IN$DEX Quality and Recovery Protocol

**Owner:** AJ

**Applies to:** Codex, Claude, daily checkers and repair agents

**Operating model:** supervised repair, one writer, deny by default

## Purpose

Detect, reproduce, repair and verify project defects without changing protected safety controls, production, citizen data or financial authority silently.

This protocol does not create an unattended self-modifying system. It creates one controlled repair path shared by Codex and Claude.

## Trigger conditions

Start this workflow when one of these conditions occurs:

- A build, test, audit, type check or deployment verification fails.
- A browser, device or accessibility journey produces a reproducible defect.
- The daily checker reports `REPAIR_REQUIRED`.
- AJ asks Codex or Claude to diagnose, fix, repair or continue an approved implementation.
- A newly completed work batch needs its mandatory post-change verification.

Do not treat a scheduled daily check as permission to edit code.

## Authority modes

### CHECK_ONLY

Allowed:

- Read files and repository state.
- Fetch read-only remote metadata where access exists.
- Run non-mutating tests, builds, audits and diagnostics.
- Record evidence and recommend a repair.

Not allowed:

- File edits.
- Dependency installation or lockfile changes.
- Commit, rebase, push, merge, deployment or migration.

### LOCAL_REPAIR

Active only when AJ's current request asks for a fix, implementation or continuation of a defined build scope.

Allowed:

- Edit unprotected files inside the approved scope.
- Add or update tests that preserve intended behaviour.
- Run local verification.
- Prepare a focused local commit only when the current request includes committing or the established task explicitly requires a checkpoint.

Not allowed without separate exact approval:

- Protected-file changes.
- Remote writes.
- Production changes.
- Real-value transactions.
- Identity issuance to real citizens.

### RELEASE

Active only when AJ explicitly approves the named branch, commit, pull request, environment and action.

Release approval for one action does not approve later actions. A push does not approve a merge. A merge does not approve a deployment. A deployment does not approve a database migration.

## Risk classes

| Class | Examples | Agent response |
|---|---|---|
| R0 Observe | Status, logs, tests, diffs, audits | Run read-only and record evidence |
| R1 Local repair | Scoped UI, logic, test or documentation defect | Repair under `LOCAL_REPAIR`, then verify |
| R2 Sensitive | Authentication, identity, payments, wallets, governance, privacy, dependencies, database schema, agent permissions | Repair locally only within exact scope; require focused review and expanded tests |
| R3 Protected or external | Safety controls, protected instructions, secrets, production, remote Git, deployments, migrations, real funds, public publication | Stop for exact AJ approval |
| R4 Prohibited autonomous action | Force push, destructive reset, bypassed tests, secret exposure, unattended signing, uncontrolled agent custody or self-expanded permissions | Refuse the action and report the safe alternative |

## One-writer rule

Only one agent writes to a repository worktree at a time.

Before the first edit, the active writer records:

- Agent name.
- Absolute repository path.
- Branch.
- Starting commit.
- Approved scope.
- Expected files or directories.
- Existing staged, unstaged and untracked files.

If another Codex or Claude session is writing to the same worktree, stop. Use a separate branch and worktree or wait for its handoff. Never let two agents resolve the same dirty tree independently.

The daily checker never becomes the writer. It reports `REPAIR_REQUIRED` and hands the evidence to the repair agent.

## Repair workflow

### 1. Establish authority

- Read the mandatory sources, including the Living Build Directive and Living Verified Status.
- State the active authority mode.
- Confirm the requested outcome and boundaries.
- Stop on missing or conflicting authority.

### 2. Prove workspace identity

Record the path, remote, branch, HEAD, ahead and behind counts, and working-tree counts.

If unexplained changes exist, do not stage, stash, reset, rebase or overwrite them. Isolate the approved work or ask AJ.

### 3. Capture the failure

Record:

- Exact failing command or user journey.
- Exact error or incorrect result.
- Expected result.
- Environment and relevant commit.
- Whether the failure is reproducible.

Do not change code before obtaining a reproducible case unless the defect is an urgent security exposure. Security containment still requires a precise evidence record.

### 4. Classify the root cause

Use one primary class:

- Code defect.
- Test defect.
- Configuration defect.
- Dependency defect.
- Environment defect.
- Data or migration defect.
- Living-status or specification conflict.
- External-provider failure.
- Device-specific failure.
- Unknown.

Do not disguise an environment or authority failure as a code repair.

### 5. Define the smallest complete repair

- Name the files in scope.
- Identify affected citizen journeys.
- Identify security, privacy, identity, financial and publication effects.
- Define the tests that prove the repair.
- Preserve unrelated work.

### 6. Repair

- Prefer root-cause fixes over symptom suppression.
- Keep public status truthful.
- Preserve the USD $0.24 launch and genesis boundary.
- Preserve the build-now and private-testing boundaries.
- Preserve deny-by-default agent capabilities.
- Never weaken or delete a valid test merely to obtain a green result.

### 7. Verify in layers

Run, where relevant:

1. Reproduction test.
2. Focused unit or behavioural tests.
3. Type and syntax checks.
4. Integration tests for the affected journey.
5. Living-status and public-surface checks.
6. Security and dependency checks for changed packages.
7. Browser or device tests when the defect depends on rendering, permissions or hardware.
8. `git diff --check` and focused diff review.

An unavailable browser, physical device, credential or provider leaves the matching acceptance gate `BLOCKED`. It does not become a pass.

### 8. Handoff

Report:

- Issue ID or concise title.
- Authority mode and risk class.
- Workspace, branch, starting and ending commits.
- Reproduction evidence.
- Root cause.
- Files changed.
- Tests and exact outcomes.
- External writes, or `none`.
- Production impact, or `none`.
- Remaining risks and blocked acceptance gates.
- Rollback path.
- Safest next action.

## Required stop conditions

Stop before editing or continuing when:

- The Living Build Directive or Living Verified Status is missing, contradictory or stale for the requested action.
- The requested repair would change protected files without exact AJ approval.
- The worktree contains unexplained changes in the proposed scope.
- Another agent is writing to the same worktree.
- The branch, remote, deployment project or database target is uncertain.
- Reproduction would require real citizen data, real funds or unsafe credentials.
- A merge or rebase reports conflicts.
- A Git mutation is blocked by `index.lock` or another interrupted-operation marker.
- A test exposes a broader security, privacy, identity or financial risk than the approved scope.
- The proposed fix changes product policy instead of implementing current policy.

## Daily-check handoff contract

When the read-only checker finds a defect, it emits:

```text
REPAIR_REQUIRED
Issue:
Evidence:
Reproduction:
Affected surface:
Risk class:
Authority needed:
Suggested tests:
Current workspace and commit:
```

The repair agent must repeat the reproduction. It never accepts another agent's diagnosis as proof.

## Git lock containment

Run `node scripts/git-lock-preflight.mjs` before a Git mutation.

If it reports `GIT_LOCK_BLOCKED` or `GIT_OPERATION_IN_PROGRESS`:

1. Stop the intended Git action.
2. Record the repository, branch, HEAD, lock path, size and age.
3. Check for an active Git process and identify the interrupted operation.
4. Never delete a lock automatically or merely because it is inconvenient.
5. Obtain approval for the exact recovery action.
6. Verify the branch, HEAD, worktree counts and operation markers after recovery.

A stale lock is a workflow incident. Repeated stale locks require a root-cause report, not repeated silent deletion.
