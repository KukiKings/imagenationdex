# IN$DEX Living Verified Status

`living-verified-status.json` is the shared current-fact register for Codex, Claude and scheduled checks.

It is not a permanent product constitution. Product scope stays open and expandable.

The register:

- records current decisions, evidence, historical distinctions and unresolved questions;
- identifies the source, owner and review condition for every entry;
- grants no permission to edit, contact, publish, deploy, sign or move value;
- fails closed as `BLOCKED_BY_SOURCE` when required evidence is missing, contradictory or expired;
- never lets an agent change its own authority or approve its own work.

Safety, consent, credentials, funds, identity, legal claims, production, citizen contact, publication and destructive actions retain their separate approval controls.

## Update rule

1. Record AJ's current decision or fresh evidence.
2. Update only the affected entry.
3. Preserve history in Git.
4. Run `node scripts/verify-living-verified-status.mjs`.
5. Review the focused diff.
6. Keep release actions separately approved.

## R015 supersession

Claude recovered `R015` from external registry v13 at `/Users/arthurjohnhenry/CoWork/second-brain/canon/retired.json`. The registry still contains 27 claims.

`R015` historically prohibited the pronunciation `sin-dex`. AJ's later `R027` decision restored Syn-dex or Sin-dex. The two rules cannot be enforced together, so `R015` is deliberately retained as superseded evidence and skipped by the external checker.

Required coverage reporting:

- 27 claims registered;
- 26 claims enforced;
- 1 claim deliberately superseded;
- `R015` superseded by `R027` on 6 August 2026;
- no report may describe `R015` as missing or unresolved;
- no check may silently drop the registry total or re-enable both conflicting rules.

This evidence was reported by Claude and supplied by AJ. Codex has not independently read the external Mac registry.
