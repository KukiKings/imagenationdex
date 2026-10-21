# Canon utilities mined — security-canon.md, god-mode-canon-v12.md, god-mode-canon-v13.md

**Created:** 2026-10-21 · **Owner:** AJ Henry · **Status:** working reference. Nothing here changes code, canon or public wording.
**Sources read in full:** the Desktop copies at `imagenationdex-push/` (security-canon.md 52,094 bytes; god-mode-canon-v12.md 7,950 bytes; god-mode-canon-v13.md 21,586 bytes). They match `8fdb9f5^` on main; the copies on `origin/rescue/mac-canon-fixes-20260806` are older (security-canon.md 54,021 bytes, v12 7,793 bytes). The three files were deleted from main on 2026-08-29 (8fdb9f5).
**Checked against:** origin/main at 4e2e7fc, the live Supabase project (read-only SQL, advisors, function list), the GitHub workflows, and Supabase and SNS public documentation, all on 2026-10-21.

**Ratings.** `still-valid` = the rule is correct for the current build and should be kept. `needs-build` = correct, but not live (or live only in part); the note says what is missing. `obsolete` = tied to a structure that does not exist in the current build. "Live today" states what I observed, not what the canon claims.

**Left out on purpose (per the order):** launch dates (v12 and the security constants say 24 January 2027; the current target is 24 February 2027), the 14 or 15 Pillar count, the "Forty-Eight" law count, v12 Parts 0 to 6 (vision, token-economics and 1000-year material), v13 Parts 1 to 8 (voice spec, marketplace, Vanuatu and Cook Islands product modules). The voice spec stays out because the voice lock is on HOLD.

---

## 1. Security utilities

| ID | Utility (canon source) | Live today | Rating |
|---|---|---|---|
| S1 | Append-only security event log (Law 7) | Yes. `security_events` has trigger `enforce_immutable_security_events`; 875 rows. | still-valid |
| S2 | Threat tiers T0 to T4 recorded on every event (Tier Matrix) | Yes. Rows by tier: T0 772, T1 70, T2 24, T3 8, T4 1. | still-valid |
| S3 | Automatic responses by tier (T2 pause and draft, T3 halt all, T4 full halt) | No automation. `pqsi_contain`, `pqsi_freeze_citizen` and `pqsi_release_halt` exist only in `20260730_pqsi_v1_classifier.sql`, whose header says NOT YET APPLIED; no `pqsi_*` function exists in the live database. | needs-build |
| S4 | Global halt (Law 6) | Table `siindex_kill_switch` exists (1 row, engaged = false). Nothing in `supabase/functions/` or `siindex-m2m/` reads it; only the unapplied PQSI SQL, `siindex-console.html` and `ai-oversight.html` mention it. | needs-build |
| S5 | Per-visitor rate limiting (Layer 3; Section B 100 per minute rule) | Yes, in five functions: website-runtime 6 per minute and 60 per day; website-voice-tts 6 and 60; website-transcribe 8 and 80; realtime-token 3 and 20; visitor-feedback 30 per window. No limiter code in the other eight repo functions (agent-*, voice-setup, payment and webhook stubs, remittance, lending webhook). Client cooldown of 60 s in siindex-realtime-voice.js. | still-valid |
| S6 | Origin allow-list and provider-consent header before any paid provider call (Section H origin rule; Law 13 consent) | Yes. `isAllowedOrigin` plus `x-siindex-provider-consent: accepted` on runtime, tts, transcribe and realtime-token. | still-valid |
| S7 | Consent specific per category (Law 13) | Yes. `consent_grants`, `consent_receipts` (immutable trigger), `consent_snapshots`, `has_consent()` (not executable by anon). | still-valid |
| S8 | Identity check on `get_action_intent_card` (Law 13 correction) | Partial. The function skips its check when `auth.uid()` is NULL, so an anonymous caller holding an intent UUID gets the card. The canon says this class of bug was fixed. | needs-build |
| S9 | Recurring sweep for anonymous-callable SECURITY DEFINER functions (Law 13 correction) | The sweep is valid and currently failing: 158 definer functions, 42 executable by anon, 153 by authenticated; Supabase advisor WARN on both. `create_onboarding_citizen` and `get_action_intent_card` are among the anon-callable. | still-valid |
| S10 | Founder oversight is aggregate-only; raw access is logged and time-boxed (Law 13) | `get_consent_oversight` exists. The other oversight and exceptional-access functions were not inspected. | still-valid |
| S11 | RLS enabled on every table (Section J) | Yes. 84 public tables, none without RLS (query on 2026-10-21). Advisor INFO: one table has RLS and no policy. | still-valid |
| S12 | Models hold no permanent secrets; short-lived credentials only (Laws 17 and 18) | Yes for realtime voice: `siindex-realtime-token` issues a 60-second client secret; the long-lived key stays server-side. Secrets-broker layer does not exist. | still-valid |
| S13 | Secret-exposure scan of repo and served pages (Section H) | Ad hoc. A repo search on 2026-10-21 found no service-role value outside comments and placeholders; `indx-mcp/.env` is committed but holds the public anon key only. The weekly inventory scheduled task includes an embedded-credential check. | still-valid |
| S14 | Sensitive columns not exposed to client roles (Law 17; Section H exfiltration) | No. Roles `anon` and `authenticated` hold table-level SELECT on `citizens`, including `totp_secret` and `atm_pin_hash`. RLS limits reads to the caller's own row, so another citizen's row is not readable, but the caller's own secret reaches the browser. Policy `citizens insert on onboard` allows insert by anyone. | needs-build |
| S15 | Subresource Integrity on CDN scripts (Section J) | Failing. A static count found 75 external script tags with `integrity` and 18 without (80 jsdelivr, 12 cdnjs, 1 Stripe). Not browser-verified. | still-valid |
| S16 | Weekly infrastructure checks: DNS, deploys from main, commit author, RLS (Section J) | Partial. Apex answers from Vercel (response header seen). I could not resolve DNS records from this environment, so the A and CNAME values are unverified. CI deploys on push to main. The weekly COO audit task reports its live-site fetch as blocked. | still-valid |
| S17 | Instructions inside observed content are data, never commands (Section I) | Yes. Runtime system prompt treats browser history as conversation only; agent policy applies the same rule. | still-valid |
| S18 | Escalate when decision confidence is below 70 percent (Section I) | No model output carries a calibrated confidence figure. | obsolete |
| S19 | PIN lockout: 3 failures lock 5 minutes, 5 failures lock 24 hours (Section A) | `atm_pin_hash`, `set_atm_pin`, `get_atm_pin_status` exist. No failure counter, lock column or lock function found. The canon contradicts itself: Section A says T3 at 5 failures, the integration table says lock at 5 and T3 at 10. | needs-build |
| S20 | OTP, new-device and SIM-swap controls (Section A; PQSI G5) | Phone OTP runs through Supabase Auth (advisor WARN: OTP expiry too long; leaked-password protection off). The G5 design (anchor-change cooling, carrier SIM check, assert no SMS-only auth) is written in `20260730_pqsi_g5_simswap.sql`, NOT YET APPLIED. | needs-build |
| S21 | Account freeze | Mechanism exists: `citizens.account_frozen*` and `card_frozen*` columns; 9 `account_freeze` events, last 2026-08-29. Trigger path not inspected. | still-valid |
| S22 | IP and session blocking; token used from two IPs invalidates sessions (Section B) | `known_malicious_indicators` exists with 0 rows. No IP block or session-invalidation logic found. | needs-build |
| S23 | Instruction-level transaction classifier, execution-time re-verification, deposit-credit integrity (PQSI v2 and G6) | Written 2026-07-30, NOT YET APPLIED. Relevant only when pay or wallets go live. Gated: pay stays off. | needs-build |
| S24 | Money-movement gates: velocity above 10 per hour, above 50 percent of balance, new recipient, sanctions screening, Travel Rule at USD 1,000, 2FA threshold, monthly cover (Sections C and H) | Not live. Pay is off; `20261019_disable_four_ungated_functions_for_pilot.sql` disables `purchase_listing`, `repay_loan`, `unstake_position`, `claim_staking_rewards` for the pilot. Gated. | needs-build |
| S25 | Seven-point pre-flight before any transaction (Law 1) | Not live. A skill spec exists (`siindex-agent-wallet`). Gated. | needs-build |
| S26 | Block any bypass of the 98/2 split (Law 2) | Not enforced anywhere. DEPLOYMENT.md states the split is calculated off-chain, where applied at all. | needs-build |
| S27 | No seed phrase, ever; Tier 0 copy says nothing to write down (Section D) | Live as an audit check (weekly inventory and COO audit tasks). | still-valid |
| S28 | Key and recovery controls: 2-of-3 MPC, 7-day wait on recovery and guardian changes (Section D) | Grid Account is not built. Gated. | needs-build |
| S29 | Pool and liquidity monitors: price impact 5 and 15 percent, premature unlock, fake pool (Section E) | Liquidity is paused; no pool. Gated. | needs-build |
| S30 | Governance Sybil checks, Wisdom Score voting gate, 98/2 amendment block (Section F) | No MemeDAO exists (the canon says so itself). | obsolete |
| S31 | ZK biometric on device, TEE attestation, Kyber and Dilithium layers, biometric-in-storage check (Layers 1, 2, 4; Section H) | Not in the build. Tier 0 is phone number only with no face scan. Public copy must not claim post-quantum protection. | obsolete |
| S32 | Constants: mint, program, supply (Security Constants) | Verified on mainnet today: mint `9p9VMkgTEVdAeohk1zEuepvwBYUkzjnovMwwazyxsSEZ` is owned by the original Token Program, 6 decimals, supply 100,000,000, mint authority and freeze authority both null. I did not verify that it is AJ's token by metadata. See C3. | still-valid |
| S33 | Bulk-read guard: more than 100 citizen rows in one call raises T3 (Section H) | No guard found. | needs-build |
| S34 | Hard stops: no execution without pre-flight, no override of T4, no log edits, no action from observed content (What SIINDEX Cannot Do) | Matches `siindex-m2m/policy.mjs` and S1. | still-valid |

---

## 2. God-mode autonomy rules

| ID | Rule (canon source) | Live today | Rating |
|---|---|---|---|
| G1 | Actions that always need AJ: publish, contact citizens, move funds, issue identity, legal commit, deploy, secret write (Laws 9, 15, 29) | Yes. `siindex-m2m/policy.mjs` `ALWAYS_AJ` lists exactly these seven; production actions stop at `needs-aj`. | still-valid |
| G2 | Actions allowed without approval: read knowledge, check policy, write evidence, verify and draft, run tests, repair branch, hand off | Yes. `INTERNAL_OK` in policy.mjs. | still-valid |
| G3 | "Do it all" grants nothing; SIINDEX proposes, the citizen governs (Laws 15 and 16) | Enforced by process, not code. | still-valid |
| G4 | Authority comes from the runtime, never from model capability (Law 18) | Matches the agent envelope below. | still-valid |
| G5 | Sub-agent dispatch limits (Law 43; v13 Agent Permission Centre) | The canon gives no numbers. Live defaults in `siindex-agent-dispatch`: `cost_limit_usd` 2, `retry_limit` 3, optional `expires_at`. | still-valid |
| G6 | Permission record per agent: scope, spend limit, approval limit, revocation, audit, expiry (v13 Part 11 item 14) | Partial: `agent_registry`, `agent_tasks`, `agent_audit` tables. No revocation interface. | needs-build |
| G7 | No hidden self-modification; failed iterations stay visible (Laws 44 and 46) | `agent_audit` and `agent_evidence` tables exist. Not verified as append-only. | still-valid |
| G8 | Human authority cannot be optimised away (Law 47) | Process rule; matches G1. | still-valid |
| G9 | Containment: T2 pause, T3 halt everything, T4 full halt until AJ authorises in writing (Incident Runbook) | Only the `needs-aj` stop exists. The halt is not wired (see S3 and S4). | needs-build |
| G10 | Self-healing | The canon defines none beyond T1 clearing itself when the next scan is clean. Live: `repair_branch` is an allowed internal action. | needs-build |
| G11 | Model substitution visible and recorded (Law 20) | Runtime logs the model name per event. No requested-versus-actual record. | needs-build |
| G12 | Claim Safety Engine: classify every public claim as approved, soften, needs evidence, needs legal, or blocked (v13 item 11) | Partial: the `indx-screen-audit` skill, `scripts/verify-public-surface.mjs` in CI, banned-phrase lists. No per-claim classifier. | needs-build |
| G13 | Launch Readiness Gate: nothing goes live until review, testing and a support path pass (v13 item 12) | Partly served by the phase exit checks in docs/prelaunch-roadmap-2026.md. | needs-build |
| G14 | Universal safety-gate list: publishing, payments, refunds, cultural material, child content, treasury, remittance, token utility, wallet connection, income claims (v13 Part 9) | Superset of G1; no code. | still-valid |
| G15 | Authenticity Shield, Memory Permission levels, Citizen Exit rights, Founder Command Centre (v13 Part 11 items 2, 3, 4, 17) | `siindex-founder-os.html` is a partial Founder Command Centre. Others not built. | needs-build |
| G16 | Remaining v13 Part 11 layers: legal architecture, child guardian, dispute repair, care, localisation, steward network, harm dashboard, disaster mode, reputation, data covenant, canonization lifecycle | Not built. Not required for 6 December. | needs-build |

---

## 3. Operational doctrine

The three canon files do not define a machine-to-machine heartbeat, board logging standards, mission queue rules or daily brief generation. What they do define is below; the live mechanisms were found in the repo and database, not in the canon.

| ID | Item | Live today | Rating |
|---|---|---|---|
| O1 | Security scan every 6 hours; treasury scan Monday 09:00 AEST (Security Constants) | Not running as written. Scheduled tasks seen: weekly COO audit (Mon 06:00), weekly screen inventory (Mon 08:30), weekly CAWG watch (Mon 08:00), weekly readiness briefing (Mon 10:00), monthly metrics. No 6-hour scan in the first page of tasks; I did not read the rest. | needs-build |
| O2 | T0 stays silent: log only, no notice (Incident Runbook) | Matches how events are written. | still-valid |
| O3 | Machine heartbeat | Live: `.github/workflows/siindex-m2m-heartbeat.yml` runs `siindex-m2m/heartbeat.mjs once` every 30 minutes. | still-valid |
| O4 | Five loops: dispatch, execute, result bus, auto-pickup, AJ gate (`siindex-m2m/README.md`) | Live as a runnable scaffold ("not unlimited autonomous production"). | still-valid |
| O5 | Agent bus in the database: dispatch, claim, complete (`20260814_siindex_agent_bus_v1.sql`) | Live: three edge functions with JWT required; tables `agent_tasks`, `agent_messages`, `agent_evidence`, `agent_audit`. | still-valid |
| O6 | Mission queue and ledger | `mission_ledger` table and `siindex-mission-ledger` function exist. Queue rules are in `siindex-m2m/STAGE1.md` and `schema.md`, not in the canon. | still-valid |
| O7 | Approvals: `approval_gates`, `pending_approvals`, `threshold_approvals` and sign-offs | Tables exist. | still-valid |
| O8 | Board logging standard | No board-log table or standard found. | needs-build |
| O9 | Daily brief generation | `siindex-brief.html` exists as a page. No generator found. | needs-build |
| O10 | Alert routing: dashboard banner, Gmail draft, chat post, MemeDAO notice (Incident Runbook) | Drafts and chat are possible by hand. The MemeDAO notice does not apply. | obsolete |

---

## 4. Conflicts with the live app (flagged, not dropped)

- **C1 Launch date.** Canon: 24 January 2027 (v12 header, Security Constants). Live: controlled pilot target 24 February 2027, stability freeze 30 November 2026, Cook Islands demonstration 6 December 2026.
- **C2 Law and pillar counts.** The canon files disagree with each other and with `about.html`. Ignored here per the order.
- **C3 Token status.** The canon records a mainnet mint with authorities revoked, and the on-chain read today agrees (S32). But DEPLOYMENT.md section 5 says no mint exists, `js/indx-wallet.js` line 28 still holds the placeholder `INDXmintAddressPlaceholderReplaceAtTGE`, `about.html` says not deployed, and the persona treats it as not deployed. The public wording is AJ's decision.
- **C4 98/2.** Canon calls it untouchable with an automatic T4 block. No code enforces it. It must not be described as immutable or on-chain.
- **C5 Company and regulator.** Law 8's caveat describes a sole-trader AUSTRAC enrolment and a plan to withdraw it after Cook Islands registration. Locked facts now say AUSTRAC does not apply and the company is INDEX LIMITED (no certificate). The caveat is out of date.
- **C6 Stale caveats.** Canon says `auth.users` has zero rows (now 5), that the command centre has no authentication gate, and that no session was ever bound. None was re-verified here beyond the row count.
- **C7 Authority of canon.** Section I says canon wins over in-context reasoning. The canon was deleted from main as unreconciled; the working authority is AJ's chat instruction. Do not cite this rule as enforced.
- **C8 PIN lockout.** Canon contradicts itself (see S19).
- **C9 Pay-linked figures.** The USD 500 default 2FA threshold and the USD 10,000 monthly "Transaction Protection" cover describe features that are not live. The cover wording is a financial-protection claim and must not appear publicly.
- **C10 Quantum and biometric layers.** Layers 1 and 2 are not built (S31).
- **C11 MemeDAO.** The T4 runbook and Law 7 notify or defer to a MemeDAO that does not exist.
- **C12 v13 Vanuatu module.** No legal or partner groundwork exists. Out of scope for 6 December.
- **C13 v13 voice spec.** Conflicts with the voice HOLD. Not mined.
- **C14 Deployment doc.** DEPLOYMENT.md section 5 (token not deployed) is stale; its function list omits `siindex-realtime-token`. The CI steps for `siindex-website-runtime` and `siindex-website-transcribe` end in `|| true`, so a failed deploy of either would not fail the workflow. Verify the live version after every push.
- **C15 Scheduled-task prompt.** The "Siindex grand sync briefing" task prompt still carries the previous company name and "Registration has not been filed". It is outside the repo, so I did not change it.
- **C16 Unconditional name claims.** Public pages state "no renewal", "no expiry" or "yours forever" for `yourname.IN$DEX` names: genesis-offer.html (lines 335, 397, 450), claim-domain.html (148, 266), launch.html (176, 323, 397), siindex-avatar.html (2117, 2228), siindex-web3-identity.html (584), quickstart-onboarding.html (166, 276), home-v2.html (1252, 1669), sovereign-academy.html (1367), pay.html (276). Issuance is not live, and renewal terms of any registry that carries these names are unconfirmed (see P3).

---

## 5. Platform findings evaluated

**P1 `withSupabase` wrapper with four auth modes.** Confirmed in Supabase's "Securing Edge Functions" guide: package `@supabase/server`; modes `user` (valid user JWT), `secret` (secret key), `publishable` (publishable key), `none` (any caller; for signed webhooks); modes can be combined in an array. Fit with the live functions:
- Functions that require a JWT today (siindex-runtime, model-canary, founder-voice-tts, website-voice-setup, agent-dispatch, agent-claim, agent-complete, visitor-feedback, remittance-agent) would gain from declaring `auth: 'user'` or `'secret'` in place of hand-rolled header checks.
- The public browser endpoints (website-runtime, voice-tts, transcribe, realtime-token) use `verify_jwt = false` with their own origin, consent and rate-limit gates. `none` would add nothing and removes no risk; keep the custom gates.
- Webhooks (stripe-webhook, lending-collateral-webhook) already verify a signature or shared secret, which is the `none` pattern.
- Timing: any refactor lands inside the roadmap's change freeze (4 December). Recommend doing it after 6 December, or before the Phase 5 exit at the latest, and not for the public voice path.

**P2 Per-trace limit of 30 nested calls per 60 seconds.** I could not confirm that figure. The current Supabase page "Recursive / Nested Function Calls" says each request chain has a budget of at least 5,000 requests per minute, on all plans, counting only outbound `fetch()` from one edge function to another. Nothing in the live repo does that: the only `/functions/v1/` reference in `supabase/functions/` is a comment in stripe-webhook, and the machine-to-machine runner calls from GitHub Actions, outside the edge runtime. The canon describes no function-to-function fan-out. No batching or pacing is needed on the documented limit. If AJ has a source for 30 per 60 s, send it and I will re-check.

**P3 Renewable versus "no renewals".** I don't know. The AllDomains launch page and protocol docs I could read say nothing about renewals, expiry or fees. Search returned only third-party price listings. The SNS upgrade page (sns.id, dated 3 August 2026) also does not say whether the new `.sol` names are renewable. C16 lists the public pages that state "no renewal". Until terms are confirmed in writing, those lines are unsupported. The AllDomains draft already keeps this on its verify list (item 4).

**P4 `.sol` migration and December.** Source: sns.id, "The .sol Upgrade" (dated 3 August 2026, all dates targets): registrations paused 17 August; mid to late October `.sol` resolution pauses in official SDKs; new `.sol` names activate Q4 2026 into Q1 2027; existing names display as `.sns`. That page does not mention the Cook Islands or AllDomains, so I found no Cook Islands link. Impact on this app: no citizen-facing flow resolves `.sol` names. The only `.sol` strings in the repo are a read-only demo placeholder in siindex-readability-guardian.html and fictional handles (token-detail.html, business-network.html). `yourname.IN$DEX` / `.INDX` is IN$DEX's own namespace, reserved and not issued. Risk for the room: if a wallet or explorer is shown live, show raw addresses, not `.sol` names, because resolution may differ between apps.

**P5 DEPLOYMENT.md (12,440 bytes).** Read in full; its steps are folded into Phase 7 of docs/prelaunch-roadmap-2026.md (2 December block). Stale parts are listed in C14.

---

## 6. Counts

34 security items (S1 to S34), 16 god-mode items (G1 to G16), 10 operational items (O1 to O10): **60 rated items**.
Ratings: still-valid 31, needs-build 25, obsolete 4 (S18, S30, S31, O10).
Plus 16 conflicts (C1 to C16) and 5 platform findings (P1 to P5).

**Top three still-valid utilities for the current build:**
1. **G1 Always-AJ boundary.** Publish, contact citizens, move funds, issue identity, legal commit, deploy and secret writes stop at AJ. It is live in `policy.mjs` and underpins every "nothing moves money" statement on 6 December.
2. **S5 Per-visitor rate limiting** (with the S6 consent and origin gates). These protect the only public paid endpoints from abuse and cost overrun during a live demo.
3. **S9 Sweep for anonymous-callable SECURITY DEFINER functions.** It is the check that is failing today (42 anon-callable); S8 and S14 are its first concrete fixes.
