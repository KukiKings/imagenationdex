# Spawning model

How the dispatcher uses a named skill to help a citizen build more than one income stream around a free web3 domain. This file adds to `DISPATCHER-MODEL.md`. It changes no tier, no gate and no consent rule. The word is **spawn**, not promotion: a skill is a fixed charter, and the dispatcher creates a temporary instance of it for one task.

Status: a documented convention. Nothing here is built, and no part of it is live. IN$DEX is at pilot-preparation stage; payments and wallets are not live.

## 1. Spawning

- **A skill is a fixed charter.** It is a directory under `SIINDEX-Skills/` with a `SKILL.md`. Its charter does not grow, does not learn and does not rewrite itself. Only AJ changes a charter, through a normal reviewed commit.
- **A spawn is a temporary instance.** The dispatcher (`assignSkill()` in `agents/orchestrator.js`) instantiates one named skill with a tight brief. The instance ends when the task ends. It keeps nothing.
- **Tiers and gates still apply.** Tier 1 is `auto`, tier 2 is `auto_notify`, tier 3 needs a complete consent record, tier 4 is blocked, and a missing or invalid tier counts as tier 3. Every skill added under this model is tier 1, read-only.
- **A spawn returns its result only to SIINDEX.** It writes no files, sends no messages, signs no transaction, collects no identity documents and changes no other skill.
- **Solana is the settlement layer only.** No spawn moves funds.

## 2. Experience log (convention only)

An append-only log of what spawned instances reported. Fields, one entry each:

| Field | Content |
| --- | --- |
| skill name | the directory name of the skill that was spawned |
| task brief | the brief the dispatcher gave it |
| claim or output summary | one or two sentences |
| primary source + date | the primary source and the date checked, or the word `speculative` |
| verdict | `agree`, `disagree`, `cannot be confirmed` or `insight` |
| timestamp | UTC, when the entry was made |

Rules:

- **Append-only.** An entry is never edited or deleted. A correction is a new entry that says what it corrects.
- **Filtered view for a later spawn.** A later spawn of the same skill may be given a filtered view of earlier entries as context. The view never expands the charter, never grants a power, and never replaces a missing primary source. A log entry is not a primary source. A claim with no primary source stays `cannot be confirmed` however many times it was logged.
- **`insight` is not a fact.** An `insight` entry is labelled as such wherever it is shown, and carries no weight as evidence.
- **No skill writes to the log.** For now the log is a documented convention only. A skill never writes to it. A logging step will be defined in a separate, reviewed change, and until it exists nothing writes the log automatically. Nothing in this file creates a logging step.
- **The log does not grant new powers.** It does not raise a tier, widen a charter, waive a consent gate or change what a skill may read.

## 3. First three spawnable skills (tier 1, read-only)

- `elite-mastery-roadmap`: a sourced mastery roadmap for using a free web3 domain, an SAS-style attestation and a fee-sponsored USDC path without holding SOL.
- `thinking-beyond-human-limits`: bias-minimised, practical options for unbanked or under-banked citizens on the SIINDEX path, grounded in current Solana primitives or labelled speculative.
- `forbidden-wisdom-decoder`: lesser-known but sourced patterns in remittances, attestations, fee sponsorship and citizen tools, each with its primary-source context and a real example.

## 4. Future spawnable roles (not implemented)

Listed so the shape is agreed. None exists as a directory, so none is assignable. Each would be tier 1, read-only, under the same rules, and would be added only through its own reviewed change.

- `time-bending-knowledge`: twenty-year-forward insights, always labelled speculative.
- `parallel-realities-insight`: pattern extrapolations only, never factual claims.
- `reverse-engineer-genius`: documented historical methods turned into exercises.
- `lost-knowledge-revival`: documented ancient practices set against modern constraints, with fact and synthesis kept separate.

## 5. Constraints that apply to every spawn

- No skill collects identity documents or signs transactions.
- Solana is the settlement layer only.
- The December one-pager, the December spoken script and `DECEMBER-2026-DELIVERY-LOCK.md` are not edited by any spawn or by this change.
- Primary sources only. If a primary source cannot be reached or does not contain the claim, the answer is `cannot be confirmed`. Speculative or future-oriented output is labelled `speculative`.
- The experience log does not grant new powers.
