# Loop Engineering, Continuous Verification & Evaluator Council — Reality Ledger
> 18 Jul 2026. Maps the SIINDEX Sovereign Loop Engineering, Continuous Verification, and Evaluator Council Constitution (`siindex-loop-engineering-evaluator-constitution.md`) against real research and current IN$DEX/codebase reality, per the project's standing intake pattern.

---

## 1. Current build reality — honest baseline

Grepped the project for every piece of infrastructure this doctrine assumes: `loop_contracts`, `judge_registry`, `evaluation_rubrics`, "Loop Assurance," "Definition of Done" as a formal artifact. None exist as tables, services, or schemas — only informal "Definition of Done"-style language in planning docs (e.g. `part16-staging-positive-test-sequence.md`), not a governed system. There is no Judge Registry, no calibration dataset, no deterministic-grader service, no Loop Assurance Receipt, no Failure Library. This doctrine, like the two before it, describes a mature governance layer; today IN$DEX has none of its supporting infrastructure built.

**One genuinely relevant fact this doc's own Phase 0 gets to reference honestly for the first time:** Phase 0 lists "Arthur must have a real authenticated account, founder authority must be claimed, bootstrap must close" as prerequisites — and as of this session (Task #184), that specific blocker is real and closed: `founder_authority` has AJ's row, `security_events` logged the `founder_bootstrap_claimed` event, confirmed via direct SQL. The remaining Phase 0 items — "a controlled citizen must authenticate," "Citizen SIINDEX must respond privately," "cross-mode and cross-citizen isolation must pass" — map directly to the still-pending Tasks #153/#154, not yet proven (see Session x68/x69 notes in memory.md). So Phase 0 is roughly half-satisfied, not fully, and this doctrine's own gating logic should not be treated as cleared until #153/#154 close.

---

## 2. Research findings — the doctrine's cited claims checked out

Unlike the Media/Design doctrine (which had real gaps — Spam Act, ACCC standard, True Tracks, Australian deepfake law all missing), this document's specific attributed claims verify accurately against real, current sources:

**§13 (reference solutions) —** Anthropic's actual published guidance ("Demystifying evals for AI agents") states close to verbatim what the doc claims: create reference solutions to prove a task is solvable, and "a 0% pass rate across many trials usually signals a broken task, not an incapable agent." Confirmed accurate, not paraphrased loosely.

**§27 (long-running agent state) —** Confirmed against Anthropic's 2026 engineering work: Claude Opus 4.6 (March 2026) introduced a Compaction API and "Adaptive Thinking" specifically to address context rot in long-running agents; separate Anthropic engineering posts describe context resets with structured handoff versus in-place compaction. The doc's summary is accurate and, notably, describes work that only shipped this year — this is current, not dated, doctrine.

**§34 (OpenAI 2026 tax-agent) —** This is a real, named OpenAI publication ("Building self-improving tax agents with Codex," with Thrive). Verified real production numbers: launched at 25% of returns reaching 75% field-completion accuracy, rising to 86% within six weeks; final drafts reached up to 97% accuracy; practitioners saved roughly one-third of prep time; throughput up 50% across ~7,000 returns processed. The doc's characterization (practitioner corrections + production traces → new evals, not "unguided recursive self-improvement") matches the actual published methodology.

**§8, §80 (judge bias/calibration) —** Confirmed as an active, well-documented 2026 research area: position bias, verbosity bias, self-preference bias, format bias, and calibration drift are all named and measured in current literature.

**Crucial addition — the one concrete number missing from the doc:** research quantifies self-preference bias at roughly **10-25% uniform bias** when a model judges its own output family. The doc's Law 77 (cross-family independence) and Law 80 (judge must be evaluated) state the qualitative rule correctly but give no threshold. Recommend adding this figure directly to the condensed law so "different model families do not guarantee independence" has a concrete number attached — e.g. "same-family judging measurably inflates scores; never use the same model as both builder and sole judge on consequential work."

No other correction or omission was found in this doctrine — it is the most externally well-grounded of the three constitution documents adopted this session.

---

## 3. Recommended honest buildable subset

Same pattern as the prior two ledgers: adopt the doctrine and laws now with an honest caveat that no supporting infrastructure exists; do not start Phase 1-9 build work without a separate go-ahead. If/when AJ wants to start building, the doc's own Phase 0 is already partially satisfied (founder bootstrap done) — the realistic next increment is finishing Phase 0 properly (Tasks #153/#154: prove one real citizen positive path + siindex-runtime session) before touching Phase 1's Judge Registry, since Phase 0 is explicitly gating in the source doctrine itself.

---

## 4. Proposed law additions for security-canon.md

Fold the doctrine's 14 laws (73-86) in as Laws 35-48, using the same format/precedent as Laws 8-34. Recommend Law 41 (cross-family independence) explicitly cite the 10-25% self-preference bias figure from research, since that's the one concrete strengthening this ledger found. No additional standalone law is proposed this time (unlike the Media doctrine, which needed a new Law 34) — this document's own 14 laws are complete and well-supported as written.
