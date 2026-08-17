# Un-canonise worktree (AJ directive 2026-08-18)

## Policy

- **Nothing is locked “canon”** for marketing or agent doctrine until it is **committed, tested, and intentionally published**.
- Mid-flight **canon → facts** renames on a local worktree are **working drafts**, not law.
- Prefer **`facts.json` / retired facts** over folders or files labelled “canon” when both exist.
- **January 2027** pilot language stays **retired**. **`public_pilot_date`: 24 February 2027** when present in facts.
- Public SIINDEX pages and `status.json` remain the **testable** source for what loads today — not uncommitted local trees.

## What this session can see

- **`origin/main` (GitHub):** no `canon/` tree in path filter; no `facts.json` hit in code search from this connection.
- The reported **~130 modified files + 3 ahead / 3 behind** live in the **local Cowork worktree**, not as a completed push this agent can rewrite blindly.

## Commands on the machine that has the 130 files

Inspect only:

```bash
cd /path/to/imagenationdex   # your real worktree
git status -sb
git fetch origin
git log --oneline HEAD...origin/main | head -20
git status --porcelain | wc -l
git status --porcelain | head -40
```

Safe options (pick one — do not invent):

**A — Park the mid-flight (recommended before testing)**

```bash
git stash push -u -m "canon-facts-midflight-$(date +%Y%m%d)"
git pull --rebase origin main
# test against clean main
```

**B — Finish rename on a branch (no force to main until tested)**

```bash
git checkout -b wip/facts-rename
git add -A
git status
# review; commit only when paths are intentional
git commit -m "wip: canon to facts rename (not public doctrine yet)"
git push -u origin wip/facts-rename
# open PR; do not treat as canon
```

**C — Discard local mid-flight (destructive)**

```bash
# ONLY if you are sure you do not need the 130 changes
git reset --hard origin/main
git clean -fd   # careful: deletes untracked
```

## Agent rule

Until **A, B, or C** is done on the worktree host:

- Agents must **not** treat uncommitted canon paths as sealed doctrine.
- Agents must **not** claim the 130-file rename is live on production.
- Testing continues against **deployed main** (Home / Talk / Interview / FAQ / Present / Speak / Jarvis — live).

*SIINDEX — SI not AI · facts over labels · no false canon*
