# The local repo is not evidence of what production runs

**Filed:** 2026-08-05, on the third recorded instance.

---

## The pattern

A defect is observed on production. The diagnosis is made by reading the local repo copy.
The local copy is stale. The diagnosis is wrong, and the fix that follows from it would
have changed nothing.

**Rule: fetch the deployed artifact before diagnosing it.** A grep of the working tree
tells you what *would* deploy, never what *is* deployed.

## Instances

| Date | What happened |
|---|---|
| 27–29 Jul 2026 | A zero-byte `.git/index.lock` silently rejected every git write for two days. ~30 files of work were described as delivered with nothing behind them. The repo *looked* correct locally |
| 31 Jul 2026 | Waitlist signup routed through `join_waitlist()` RPC (`61a6282`) — the DB-side half is not verifiable from repo source |
| 5 Aug 2026 | SIINDEX rendered raw Markdown on the homepage. First diagnosis: `SYSTEM_PROMPT` lacks a formatting instruction — **wrong**. The grep hit a repo copy dated 29 Jul, four days stale. Deployed v6 already carried *"Use plain text only…"*. The model simply was not obeying it. A stronger instruction would have fixed nothing |

## The second-order lesson

The 5 Aug case is the sharper one, because it also settles a design question:
**an instruction to a model is a request; a server-side transform is a guarantee.** Where
a rule must hold on a public surface, enforce it in code after generation, not in the
prompt before it.

This rhymes with the 29/30 Jul finding filed twice already — *a text-level sweep does not
fix behaviour-level code*. Same shape, one layer further out: a prompt-level instruction
does not fix a generation-level behaviour.

## Standing check

Before recording any production defect as diagnosed:

1. Retrieve the deployed artifact (`supabase functions download …`, deployed commit SHA,
   live page source — whichever applies).
2. Diff it against the working tree. Note the drift explicitly.
3. Only then state a cause.

And symmetrically: **after any fix applied directly to production, the deployed source must
be pulled back into the repo the same day**, or the next deploy from repo source silently
reverts it. As of 5 Aug the `siindex-website-runtime` v7 source has **not** been pulled
back — see [[siindex-website-runtime]]. ⏳

## Related

[[siindex-website-runtime]] · `canon-locations.md` · `second-brain/knowledge/error-prevention.md`
