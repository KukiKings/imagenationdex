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

## R015 hold

The external Mac checker was reported to fall from 27 enforced claims to 26 when `R015` disappeared. Its definition is not present in this repository.

Until the definition is recovered independently:

- `R015` remains explicitly required and unresolved;
- the legacy claim checker and public-claim audit must not report `CLEAN`;
- unrelated builds and read-only monitors continue when their own required sources are current;
- no agent may invent a replacement definition;
- recovery requires source evidence and a focused review.
