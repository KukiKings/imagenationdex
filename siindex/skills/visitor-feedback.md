# Skill: Visitor feedback

**Mode:** Visitor Mode only. No accounts.

**Device:** `localStorage.siindex_feedback_v1`  
**Remote:** Edge Function `siindex-visitor-feedback` → table `visitor_feedback`

When analysing product quality:
1. Prefer remote aggregates when migration is applied.
2. Treat localStorage as single-device samples only.
3. Downvotes on live-status / pronunciation answers → check knowledge + SOUL parity (Task 3 smoke).
4. Never claim feedback implies live wallets/payments.

Ops detail: `siindex/ops/visitor-feedback.md`
