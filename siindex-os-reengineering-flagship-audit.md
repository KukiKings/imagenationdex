# SIINDEX Operating-System Audit — "Redesign how we build IN$DEX"
> Flagship request per the SIINDEX Sovereign OS Re-Engineering Constitution, §19. This is an AUDIT AND PROPOSAL ONLY — per Law 53/54, no redesign is implemented until AJ chooses. Grounded in this project's own gotchas.md (89 entries), memory.md (121+ session log), security-canon.md, whitepaper-v1.md Appendix A/B, and direct verification run today (2026-07-18) — not re-derived from scratch, reused from the second-brain as the Constitution itself demands.

---

## 1. Current-state map

**Objective (what result is expected):** Ship a working, honest, secure sovereign DeFi platform for the unbanked by L99 (24 Sep 2026), with SIINDEX operating it day-to-day and AJ confirming/authorising only what needs his own identity or judgment.

**Current workflow (how the build actually happens today):**
1. AJ pastes a directive (constitution, spec, or "god mode, proceed") in chat.
2. SIINDEX reads relevant docs, researches external claims, writes/edits files or Supabase migrations directly.
3. SIINDEX runs a price/currency/seed-phrase audit on any touched HTML.
4. SIINDEX commits via bash `git commit` (works — sandboxed, no network needed).
5. **AJ must push from his own Terminal** — the sandbox proxy blocks all outbound network (confirmed again today: `curl` to github.com, supabase.com, and even google.com all return `403 from proxy`, not GitHub-specific).
6. Vercel auto-deploys `main` to `imagenationdex.com` and `imagenation-dex.vercel.app` (two separate projects — see Duplication below).
7. SIINDEX appends memory.md + whitepaper Appendix B entries.

**Actors:** AJ (sole human — founder, sole developer-by-proxy, sole compliance officer, sole tester). SIINDEX (sole executor). No other team member, contractor, or reviewer exists anywhere in this build.

**Systems in use:** Supabase (Postgres + Auth + Edge Functions + Storage), Vercel (2 projects, both pointed at variants of the same GitHub repo), GitHub (`KukiKings/imagenationdex`), Anthropic API (via `siindex-runtime`), ElevenLabs (`siindex-voice-tts`), Twilio (SMS OTP — configured), Supabase built-in mailer (2 emails/hour — not yet replaced), AUSTRAC's Pega-based filing portal (manual, browser-driven).

---

## 2. Friction (§3 — where work stalls)

- **Every deploy has a hard human-in-the-loop step** (git push) that has now failed silently **three consecutive times tonight** because a leftover `python3 -m http.server 8000` process occupied the same terminal window and swallowed every subsequent command as inert text. This one friction point has cost more back-and-forth this session than any single technical fix.
- **Sandbox network isolation** (gotcha #3, #3c, #4) means SIINDEX cannot verify its own pushes, live-test Edge Functions, or hit any external API from bash — every "did it work" question requires either an MCP tool detour (Vercel API, Claude-in-Chrome) or AJ's own eyes.
- **Zero real users have ever existed.** `auth.users` and `founder_authority` are both still empty. Every "positive path" test this entire project has been blocked on this one fact, repeatedly, across dozens of session segments (Parts 3/4/5/16 all state this identically).

## 3. Duplication (§3 — confirmed today, not assumed)

- **Two live Vercel projects** for the same site: `imagenation-dex` (domains: `imagenation-dex.vercel.app`) and `imagenationdex` (domains: `imagenationdex.com`, `www.imagenationdex.com`, `imagenationdex.vercel.app`). Both show `"live": false` and both have deployment history — meaning build minutes, and possibly domain/DNS attention, are split across two projects with no clear record of why the second one exists or whether the first is dead weight.
- **Six separate founder/admin-facing console screens**: `founder-command-center.html`, `indx-build-console.html`, `merchant-command-center.html`, `siindex-civilization-admin-console.html`, `siindex-command-center.html`, `siindex-console.html`. Some may be intentionally distinct (merchant vs founder vs civilization-governance audiences) but this has never been audited as a set — exactly the "Mission Control should not be a static grid of hundreds of screens" problem the new Constitution names in §10.
- **Seven onboarding entry points** (`business-`, `creator-`, `grid-account-`, `instant-`, `quickstart-onboarding.html` plus `onboarding-choice.html`/`onboarding-flow.html`) — each independently wired to Supabase in separate sessions (tasks #29, #37, #40, #44), each with its own bugs found and fixed independently. No shared onboarding core exists; every fix this project has made to one path had to be manually checked against the other six.
- **Two parallel TOTP/2FA systems** discovered *this session* (gotcha #89): a citizen-facing custom TOTP (`setup_totp`/`verify_totp_setup` RPCs, `security-settings.html`) and Supabase's own native `auth.mfa.*` (just wired into `siindex-command-center.html` for founder AAL2). These solve different problems (citizen preference toggle vs. session assurance level) but were never documented as separate systems until today — a new engineer (or SIINDEX in a future session) could easily conflate them again.
- **260 total HTML screens.** Per `whitepaper-v1.md`'s own Appendix B history, dozens of these were built with zero backend and fixed one at a time over ~15 separate sweep sessions (x13 queue, x18-x37, the 190-screen sweep, etc.) — the fake-claims problem was never systemic-fixed, it was found and patched screen-by-screen, repeatedly, because no single audit ever ran across the whole set at once until asked to now.

## 4. Failure modes already logged (§3 — not hypothetical)

Per gotchas.md, the recurring failure *classes* (not just individual bugs) are:
1. **Body-level fix without grant-level fix** (gotchas #84, #87 — happened twice in one session).
2. **Registry/reality drift** — a security rule declared but not actually enforced in code (gotcha #88, #89 — happened twice, caught only because Part Thirteen built an automated check for exactly this pattern).
3. **Claimed-done without independent verification** — "pushed" said three times tonight with nothing landing; git commits from bash needing Terminal-side completion (gotcha #4) is a known, recurring, still-unsolved friction point.
4. **Fake financial claims** shipped and only caught in a later sweep, repeated across at least 6 distinct sweep sessions this project.

## 5. Risk (§3)

- **Single point of failure: AJ.** Every push, every AUSTRAC filing, every MFA enrolment, every SMTP vendor decision requires him personally, with no backup human and no second reviewer — which is appropriate for a sovereign identity/founder-authority action, but means the *build pipeline itself* has no redundancy either.
- **No independent reviewer of SIINDEX's own work.** Every fix this project has made was verified by SIINDEX itself (audits, exposure scans) — there is no second model or human checking SIINDEX's own claims before they ship, which is precisely what the new Constitution's Law 59/Challenge Council/Review-test (§20) are designed to close.
- **Deployment ambiguity** (two Vercel projects) is a live risk: a future push could target the wrong project, or DNS/domain configuration could silently diverge between them.

## 6. Authority map (§3 / §15)

| Decision | Who holds it today |
|---|---|
| What gets built next | AJ (via directive) |
| Whether a fix is "done" | SIINDEX claims it; **no independent check exists** |
| Push to production | AJ's Terminal only (network-isolated sandbox) |
| Founder identity / MFA / bootstrap | AJ alone (correct — identity-gated) |
| SMTP vendor / billing | AJ alone (correct — billing decision) |
| Model choice for a given task | Implicit, undocumented — always Claude Sonnet 5, never recorded as a *choice* among alternatives |

## 7. Evidence / Exit (§3)

- **Evidence of completion** today = migration receipts (`security_migration_receipts`), gotchas.md entries, memory.md entries, exposure-scan baselines, and (as of tonight) independent GitHub/Vercel checks via Claude-in-Chrome — genuinely strong for the *database* layer, still weak for the *deploy* layer (three false "pushed" claims tonight before the actual blocker was found by screenshot, not by asking again).
- **Exit/portability:** the whole stack is already provider-flexible in principle (Supabase, Vercel, GitHub, Anthropic are all swappable in theory) but nothing today *records* that as a live capability — no Model Passport, no substitution log, no "what if Anthropic changes retention policy tomorrow" answer on file.

---

## 8. Three proposed designs (§19 step 7)

### Design A — "Single Source of Truth" console consolidation
Merge the 6 founder/admin console screens into one Mission-Control-style page (per Constitution §10) driven by live Mission Workspaces, with the existing `founder-command-center.html`/`siindex-console.html` split preserved only if a genuine audience difference is confirmed (otherwise merged). Lowest engineering cost, immediate friction reduction, no new infrastructure.

### Design B — "Deploy Integrity Loop" (Specify/Build/Verify/Release, §5)
Formalize the push/deploy step so a claim of "shipped" is never accepted without an independent, automatic check — extend what was improvised tonight (Claude-in-Chrome checking GitHub + Vercel) into a standing `verify_deployment()` step that runs after every claimed push, before SIINDEX ever says "done." Directly closes the exact failure that cost the most time this session.

### Design C — "Model Portfolio + Secrets Broker" foundation (§6, §7, §13)
Build the Model Registry, Model Passport for Claude Sonnet 5 (the only model in use today, so this starts as a registry of one), and a minimal Secrets Broker wrapping the Anthropic/Supabase/ElevenLabs credentials already in use, so future model or provider changes are visible and swappable rather than hardcoded. Highest long-term value, highest effort, no immediate friction relief.

## 9. Challenge Council (§4 — disagreement, not consensus)

- **Citizen Advocate:** Design B helps AJ most *right now* — tonight's actual pain was a false "done" claim, not console sprawl or model portability.
- **Operations Reviewer:** Design A removes the most day-to-day friction (6 screens → 1) with the least new surface area.
- **Security Reviewer:** None of the three fixes a live vulnerability — the 89 gotchas are already closed; this audit is about process, not a new hole.
- **Sovereignty Reviewer:** Design C is the only one that reduces provider dependence; A and B both leave IN$DEX exactly as tied to Anthropic/Supabase/Vercel as today.
- **Human Responsibility Reviewer:** All three preserve AJ's exclusive authority over push/identity/billing decisions — none proposes taking that away, correctly.
- **Commercial Reviewer:** Design C is speculative infrastructure for a problem (model/provider switching) that hasn't happened yet; A and B pay for themselves in saved session time starting immediately.

## 10. Recommendation (§19 step 9)

**Design B first, Design A second, Design C deferred.** Reasoning: Design B is the cheapest to build (it mostly formalizes a check I already improvised tonight), has the highest immediate value (stops the exact "pushed" ×3 failure from recurring), and doesn't require AJ to make any new infrastructure decisions. Design A is a close second — real, measurable friction, moderate cost. Design C is genuinely valuable but is insurance against a problem (provider/model change) that hasn't occurred yet, and building it now would be exploring, not fixing — which is exactly the distinction Law 58 draws.

---

## 11. Stopping point

Per Law 54 ("SIINDEX Proposes, the Citizen Governs") and the flagship sequence's own step 10: **this is where SIINDEX stops and waits for AJ's decision.** Nothing above has been implemented. If AJ picks a design (or a different one, or a blend), the next step is a formal Objective Contract for that specific design before any Specify/Build/Verify/Release loop starts.
