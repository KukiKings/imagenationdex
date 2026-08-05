# Where IN$DEX canon actually lives

**Created 2026-07-31.** Written because two consecutive audits reached opposite conclusions about whether `CLAUDE.md` exists, and both were right. This file exists so the next audit does not spend a third cycle on it.

---

## The short answer

`CLAUDE.md` is **real**, and it is **not in this repository**.

It lives at **`/Users/arthurjohnhenry/CoWork/CLAUDE.md`** — the CoWork root, one directory *above* this project folder.

This is stated, and has been since 17 June 2026, in `.claude/protection-check.py`:

```python
# CLAUDE.md is in CoWork root, not DEX project — protect by path substring
PROTECTED_SUBSTRINGS = ["CLAUDE.md"]
```

## Why the audits disagreed

| Observation | Verdict |
|---|---|
| 2026-07-29 nightly pass: *"no CLAUDE.md exists in the repo"* | **Correct.** `git log --all --diff-filter=A -- CLAUDE.md` returns nothing. It has never been added to this repository in any commit, ever. It was not deleted — it was never here. |
| 2026-07-30 audit: reads CLAUDE.md as present and cites its LP_LOCK constant | **Also correct.** It is readable when the CoWork parent folder is in scope. |

Neither was wrong. They were describing different filesystems.

## Why this matters, and it is not a filing quibble

**1. It is invisible to every audit run inside the project.** Only the project folder is mounted in a normal working session. Every `grep -rn`, every sweep, every fabrication audit, and every `git` command silently excludes the primary canon file. An audit can return "ALL CLEAN" having never opened it.

**2. It is not under version control.** No history, no diffs, no backup, no way to see what changed or when. These are precisely the conditions that destroyed `indx-launch-strategy-sep24.md` on 2026-07-30 — gitignored location, no history, no backup, 346 lines gone on a single mistaken deletion. That file at least had whitepaper Appendix B to rebuild from. **CLAUDE.md is the thing other documents are rebuilt *from*.**

**3. A skill claims to read it as source of truth and cannot.** `SIINDEX-Skills/siindex-canonical-guard/SKILL.md` line 264: *"Does not change canonical values — reads them from CLAUDE.md as source of truth."* The skill whose entire purpose is preventing canon drift cannot see its own source of truth from inside the project. Same failure class as the stale-date bug of 2026-07-27, where `indx-website-builder/SKILL.md` was checking countdowns *against* the stale constant — a skill reinforcing the error it existed to catch.

**4. Two operational skills instruct writing to it at the exact moment that matters.** `siindex-token-launch/SKILL.md` (lines 250, 288): *"Copy the mint address and paste it into CLAUDE.md security constants immediately."* `siindex-lp-manager/SKILL.md` (line 114): same for the Raydium Pool ID and LP Token address. The mint happened 2026-07-12. Whether that paste ever happened cannot be verified from inside the repo.

**5. Live code cites it as pricing authority.** `transaction-confirm.html:309` — *"INDX is fixed at $0.24 USD per CLAUDE.md canon."*

## Recommendation for AJ (not actioned — requires your call)

CLAUDE.md is a **protected file** under `.claude/protection-check.py`, so changes need your sign-off and I have not touched it.

The cheap fix is to bring it under version control in this repo — move it to the project root and leave a pointer at the CoWork root, or keep the working copy where it is and commit a synced copy here. Either way it gains history, diffs, backup, and visibility to audits. Right now the single most authoritative document in the project has none of those, and yesterday demonstrated what that costs.

Worth deciding alongside it: whether `siindex-canonical-guard` should fail loudly when it cannot reach canon, rather than proceeding as though it checked.

## Other canon, for completeness

| File | Location | In git? | Protected? |
|---|---|---|---|
| `CLAUDE.md` | CoWork root — **outside this repo** | ❌ never | ✅ |
| `security-canon.md` | project root | ✅ | ✅ |
| `god-mode-canon-v12.md` | project root | ✅ | ✅ |
| `whitepaper-v1.md` (Appendix A/B) | project root | ✅ | ❌ |
| `memory.md` | project root — moved here deliberately because *"parent CoWork/ folder not always mounted"* (Jun 2026 decision) | ✅ | ❌ |
| `tokenomics-v1.md` | project root | ✅ | ❌ — and still marked **DRAFT**, never advisor-reviewed |
| `second-brain/` | project root | ✅ | ❌ |

The `memory.md` row is the precedent: this exact problem was identified and solved for memory.md in June. CLAUDE.md never got the same treatment.
