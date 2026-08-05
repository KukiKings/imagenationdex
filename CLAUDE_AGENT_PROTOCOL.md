# IN$DEX Claude Agent Protocol

**Owner:** AJ  
**Applies to:** every Claude agent, daily checker, sub-agent and browser session  
**Mode:** read first, evidence first, deny by default

## First instruction

Before analysing, changing or publishing anything, read the controlling instructions in this order:

1. AJ's latest explicit instruction for the current task.
2. The protected parent `CLAUDE.md` loaded by the workspace.
3. The current IN$DEX Master Mega-Prompt referenced by that protected file.
4. This protocol.
5. Current repository canon, tests and verified deployment evidence.

If the Master Mega-Prompt is missing, inaccessible, duplicated or contradictory, stop consequential work. Report `MISSING_OR_CONFLICTING_AUTHORITY`. Do not recreate its contents from memory and do not silently choose an older copy.

## Source hierarchy

When sources disagree, use this order:

1. AJ's current explicit decision.
2. Protected constitutional and security canon.
3. Current Master Mega-Prompt.
4. Verified production state.
5. Current merged repository state.
6. Approved private-test branch state.
7. Research, prototypes, memory files and historical plans.

Historical files never override current canon merely because they contain more detail.

## Workspace identity check

Never assume two clones, branches or browser sessions represent the same state.

At the start of every check, record:

- Absolute repository path.
- Remote URL.
- Current branch.
- Current HEAD commit.
- Remote `main` commit after a read-only fetch when authorised by the environment.
- Ahead and behind counts.
- Staged, unstaged and untracked file counts.

If the working tree is dirty, do not pull with rebase. Do not stash, reset, discard, stage or commit files unless AJ authorised the exact scope.

## Permanent Git rules

- Never run `git add -A` in a mixed or unexplained working tree.
- Never push directly to `main` unless AJ explicitly authorises that exact push.
- Never force-push.
- Never use destructive reset or checkout commands.
- Never combine separate clones or workstreams into one commit.
- Never rebase a dirty working tree.
- Never claim a push, merge or fetch occurred without verifying the resulting commit IDs.
- Use one branch and one reviewed pull request per coherent workstream.
- Preserve unrelated user changes.

## IN$DEX canon

- IN$DEX is a Sovereign Digital Civilization and Sovereign Opportunity Economy.
- SIINDEX is Synthetic Intelligence and the permanent civilization intelligence layer.
- The six civilization pillars are Learn, Create, Earn, Own, Govern and Legacy.
- Every feature must increase citizen capability, trust, opportunity, sovereignty or simplicity.
- The public product must never present planned, mocked, sandboxed or private-test utility as live.
- USD $0.24 is the founder-selected launch and genesis reference. It is not a live market price or a purchasable offer today.
- Build all committed utilities now for private testing. August through October are testing and acceptance windows.
- November is for stabilization, evidence and pre-launch preparation.
- Solana is the settlement and attestation layer. Consent, authentication, private data, storage, policy and media services remain appropriately off-chain.
- No SI agent owns private keys, wallets or citizen assets.
- No unattended mainnet signing, trading, lending, borrowing, bridging, airdrops, token launch, treasury rebalancing, governance voting or public media publication.
- Identity, likeness, funds, governance execution and public publication require matching consent or approval evidence.
- Tier 0 uses phone verification, one-time code, name.IN$DEX selection and portal activation. No face scan is required.
- Website SIINDEX communication is limited to typed chat and the website microphone.

## Daily check scope

Daily checks are read-only unless AJ separately requests a change.

Check and report:

1. Repository path, branch, HEAD and working-tree state.
2. Remote drift and pull-request state.
3. Production commit versus merged `main`.
4. Supabase function versions and source drift when access exists.
5. Vercel production and preview status when access exists.
6. Canon test results.
7. Tier 0, voice, public-surface and swarm test results.
8. Dependency audit results for changed packages.
9. Missing credentials, approvals, consent media or physical-device tests.
10. Exact blockers and the safest next action.

Do not turn a daily check into an automatic repair, commit, push, merge or deployment.

## Required stop conditions

Stop and report before acting when:

- The workspace differs from the expected clone or branch.
- The working tree contains unexplained changes.
- A protected file would be edited.
- The Master Mega-Prompt is unavailable or conflicts with canon.
- A command would stage more files than the approved scope.
- A rebase or merge reports conflicts.
- Remote history moved unexpectedly.
- A deployment target or project identity is uncertain.
- Credentials, consent, legal authority or signing authority are missing.
- Tests or dependency audits fail.

## Status language

Use only evidence-backed states:

- `LIVE`: deployed and verified on the intended production surface.
- `PRIVATE TESTING`: functional in an isolated environment with no public or real-value authority.
- `BUILT LOCALLY`: committed locally but not published or deployed.
- `PLANNED`: specified but not implemented end to end.
- `BLOCKED`: waiting on a named dependency or approval.
- `UNKNOWN`: not verified from an authoritative source.

Never use `complete` without naming the boundary, such as code-complete, private-test complete or release-complete.

## Required handoff

Every Claude agent finishes with:

- Workspace path and branch.
- Starting and ending commit IDs.
- Files changed, or `none` for a daily check.
- Commands executed.
- Tests run and their exact outcomes.
- External writes performed, or `none`.
- Production impact, or `none`.
- Unresolved blockers.
- Recommended next action.

If an action failed, state the first failing command and its error. Never describe later chained actions as completed.
