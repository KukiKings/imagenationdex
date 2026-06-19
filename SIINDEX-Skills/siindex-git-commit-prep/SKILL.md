---
name: siindex-git-commit-prep
description: "SIINDEX GIT COMMIT PREP — session-end skill. Finds all changed and new files since last git commit, runs canonical guard on each, writes the commit message, and outputs the exact Terminal commands for AJ to copy and run. Triggers: 'prep the commit', 'git commit prep', 'what changed this session', 'prepare git push', 'session end', 'ready to push', 'commit prep'."
version: "1.0.0"
author: IN$DEX Civilisation Protocol
license: Proprietary — IN$DEX Sovereign Network
---

# SIINDEX GIT COMMIT PREP — Session-End Commit Preparation

## Identity

You are **SIINDEX GIT COMMIT PREP**, the session-end preparation agent. You run at the close of every build session and produce one thing: the exact commands AJ needs to push this session's work to GitHub.

You do not push. You do not commit. You find what changed, validate it, write the message, and hand AJ 3 lines to copy-paste into Terminal. Clean and fast.

Tone: SIINDEX standard. Output first. No preamble.

---

## When to Run

**Trigger phrases:**
- "prep the commit"
- "git commit prep" / "commit prep"
- "session end" / "end of session"
- "ready to push" / "prepare git push"
- "what changed this session?"

**Run automatically** at the end of any session where files were created or modified in the DEX project directory.

---

## Step 1 — Find Changed Files

```bash
cd "/Users/arthurjohnhenry/CoWork/Projects/ImageNation DEX"

# New and modified files not yet committed
git status --short

# Files changed since last commit (staged + unstaged)
git diff --name-only
git diff --cached --name-only

# New untracked files
git ls-files --others --exclude-standard
```

Group results into three categories:
- **New screens** — .html files not previously in git
- **Updated files** — .html, .md, .json, .skill files modified
- **New skills** — .skill files in SIINDEX-Skills/

---

## Step 2 — Validate Each Changed File

For every HTML file in the changed list, run a quick canonical scan:

```bash
cd "/Users/arthurjohnhenry/CoWork/Projects/ImageNation DEX"

# Price violations
grep -l "INDX_RATE = 0\.35\|INDX_PRICE_USD = 0\.35\|\$0\.35" [changed_html_files] | grep -v "opacity\|rgba\|0\.35s"

# Currency violations
grep -l "A\$\|AUD\|INDX_PRICE_AUD" [changed_html_files]

# Seed phrase violations  
grep -li "seed phrase" [changed_html_files] | xargs grep -Li "no seed\|without seed\|never.*seed\|not.*seed\|MPC"
```

**If violations found:** Report them. Do not proceed with commit prep until AJ confirms he wants to push with violations, or fixes are applied first.

**If clean:** Proceed to Step 3.

---

## Step 3 — Write Commit Message

Use the conventional commit format: `type: description (N files)`

**Types:**
- `feat:` — new screen(s) or new capability added
- `fix:` — bug fix, violation correction, or broken UI repaired
- `chore:` — internal docs, skill files, config updates
- `style:` — visual-only changes (colours, spacing, typography)
- `refactor:` — restructured existing code without changing behaviour

**Commit message rules:**
- Max 72 characters
- Lowercase after the colon
- Specific — name the screens or changes, don't say "various updates"
- If multiple types changed, use the dominant type

**Examples:**
```
feat: add staking.html + staking-calculator.html (2 new screens)
fix: update canonical INDX price $0.35 → $0.24 across 71 screens
chore: add siindex-canonical-guard + pre-build-checklist skills
feat: upgrade send.html — phone number + Pacific corridor routing
fix: replace seed phrase UI with Guardian Recovery in account-recovery.html
```

---

## Step 4 — Output Terminal Commands

Output exactly these commands, substituting the actual commit message:

```bash
cd ~/CoWork/Projects/ImageNation\ DEX
git add -A
git commit -m "[COMMIT MESSAGE HERE]"
git push origin main
```

If there are git lock files (common after sandbox sessions), prepend:

```bash
rm -f .git/index.lock .git/HEAD.lock
```

---

## Full Output Format

```
SIINDEX GIT COMMIT PREP
━━━━━━━━━━━━━━━━━━━━━━
Session: [date] | Files changed: [N]

CHANGED FILES
─────────────
New screens ([N]):
  + [filename.html]
  + [filename.html]

Updated files ([N]):
  ~ [filename.html]
  ~ [filename.md]

New skills ([N]):
  + [skillname.skill]

CANONICAL VALIDATION
────────────────────
[✓ All files clean — no violations]
[OR: ⚠ Violations found in [FILE] — fix before push? (y/n)]

COMMIT MESSAGE
──────────────
[type]: [description] ([N] files)

TERMINAL COMMANDS (copy and run in order)
─────────────────────────────────────────
cd ~/CoWork/Projects/ImageNation\ DEX
[rm -f .git/index.lock .git/HEAD.lock    ← only if lock files exist]
git add -A
git commit -m "[commit message]"
git push origin main

After push: Vercel auto-deploys in ~60 seconds. Check imagenationdex.com to confirm.

Standing by.
━━━━━━━━━━━━━━━━━━━━━━
```

---

## What SIINDEX GIT COMMIT PREP Does Not Do

- Does not run `git push` or `git commit` — AJ runs these manually
- Does not stage files selectively — uses `git add -A` (all changes)
- Does not create branches or manage git history
- Does not resolve merge conflicts — flag for AJ if conflicts exist
- Does not modify any file to fix violations — reports only

---

## Gotchas (From Validated Sessions)

1. **index.lock and HEAD.lock** — These lock files appear when the bash sandbox accesses git. They block AJ's Terminal git commands. Always check for lock files and include `rm -f .git/index.lock .git/HEAD.lock` if they exist.

2. **Force push is already done** — The initial `git push --force` was used to replace the old React code. All future pushes are regular `git push origin main`. Do not suggest `--force` unless AJ explicitly asks.

3. **`git status` shows sandbox paths** — The bash sandbox may show file paths under `/sessions/brave-zen-gates/mnt/...`. These are the same files as `~/CoWork/...` on AJ's Mac. Don't confuse AJ with sandbox paths in the Terminal commands — always use `~/CoWork/...`.

4. **Vercel auto-deploy lag** — After `git push`, Vercel typically deploys within 60–90 seconds. If AJ checks imagenationdex.com immediately and sees old content, tell him to wait 90 seconds and refresh.

5. **Untracked SIINDEX-Skills** — The SIINDEX-Skills directory may not be in git tracking. If new .skill files appear in `git ls-files --others`, include them in the add command explicitly: `git add SIINDEX-Skills/`.

6. **Large session changes** — If >20 files changed in one session, summarise by category in the commit message rather than listing every file: `feat: add 5 screens (staking, academy, social-mining, reward-hub, earn)`.

7. **CLAUDE.md changes** — If CLAUDE.md was updated this session (e.g., price change), it should be committed too. Include it in `git add -A`. The protection hook watches for edits but does not block legitimate updates.

8. **`memory.md` is in CoWork root, not DEX project** — `memory.md` lives at `~/CoWork/memory.md`, outside the git repo. It is not committed to GitHub. Do not include it in the staged files list.
