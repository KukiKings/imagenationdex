# Pre-launch roadmap — 21 October to 6 December 2026

**Target:** every live screen and page tested, documented and running before Arthur arrives in the Cook Islands on **6 December 2026** for government and digital-organisation preview sessions.
**Owner:** AJ Henry · **Executor:** Claude (SIINDEX coordinating agent) · **Created:** 21 October 2026

## Rules

1. Update this file daily: what was done, what is next.
2. Never tick a box without verification evidence. Put the evidence (commit hash, HTTP status, test note) beside it.
3. Flag any blocker immediately. Do not work around it silently.
4. Push to origin/main after each meaningful update.
5. Do not start a phase until the previous phase's critical tasks (marked **CRITICAL**) are verified.
6. No new features after the 48-hour freeze. Only fixes.

**Standing locks (unchanged by this roadmap):** pay stays off; voice ID `iBEZxKDWKDCs8WbjiLKK` is on HOLD and must not change; secrets, tokens and FSC correspondence are AJ-only; AllDomains and send stay off until the Cook Islands certificate exists and AJ says PROCEED. A task marked **AJ-ONLY** or **GATED** is prepared by Claude but not executed without AJ.

**Locked facts for every test:** INDEX LIMITED: Form A-1 in progress, fee paid, no certificate, not registered. Pilot target 24 February 2027. Pay, wallets, remittance, token distribution and domain issuance are not live. `.INDX` names are reserved, not issued. AUSTRAC does not apply. Esther is a story, not a customer.

## Log format

`- [x] task — PASS/FAIL — YYYY-MM-DD — evidence`. A failed test stays unticked and is carried into Phase 7.

---

## Phase 1 — 21 to 27 October: finish current blockers

**Wed 21 Oct**
- [x] Brand rename, 28 files, one commit each — DONE 2026-10-21 — commits f7242fe…29856ec on origin/main; final repo-wide search found zero survivors of the old company name in text files and the white paper .docx; "Image Nation Decentralised Exchange" untouched.
- [x] Deploy siindex-website-runtime with INDEX LIMITED — DONE 2026-10-21 — CI deployed v31 at 03:45 UTC after commit 8467f19; live request returned "The intended legal company name is INDEX LIMITED…".
- [x] Reword unverified lines — DONE 2026-10-21 — 15f51e7 (what-we-build-on.md), f7e71c7 (cook-islands-registration-prep.md).
- [ ] Re-run `REALTIME_API_KEY` token check: curl siindex-realtime-token, record exact status and body shape.

**Thu 22 Oct**
- [ ] Read DEPLOYMENT.md (repo root) and list every deployment step; fold the list into Phase 7.
- [ ] **GATED (voice HOLD, needs AJ's explicit order):** trace the ElevenLabs consent-header bug in siindex-speak-core.js and siindex-founder-os.html. Voice ID stays `iBEZxKDWKDCs8WbjiLKK`.

**Fri 23 Oct**
- [ ] Decide with AJ: ship OpenAI "marin" realtime or park it. Record the decision and the date here.
- [ ] Check the Supabase plan tier (organisation/project plan) and record it.

**Sat 24 Oct**
- [ ] Record the actual limits for the current plan: egress, edge function invocations, auth emails per hour, function memory, CPU time, wall clock. Source: Supabase plan page, not memory. (AJ's brief cites free-tier caps of 5 GB egress, 500,000 invocations, 2 auth emails per hour, 256 MB memory, 2 s CPU, 150 s wall clock; verify each.)

**Sun 25 Oct**
- [ ] Load-test plan written for siindex-website-voice-tts, siindex-website-runtime and siindex-realtime-token: request counts, concurrency, pass line (no 5xx, no 546, no 504).

**Mon 26 Oct**
- [ ] Run the load test against siindex-website-runtime (respect its own rate limit of 6 per minute per visitor; log what the limiter does under load).
- [ ] Run the load test against siindex-realtime-token and siindex-website-voice-tts.

**Tue 27 Oct**
- [ ] **AJ-ONLY:** Supabase Pro upgrade decision, based on the Oct 24 and Oct 26 results. Claude records the numbers; AJ buys.
- [ ] **GATED:** AllDomains `.index` application. Draft is at docs/alldomains-tld-application.md. Not submitted. Submission, wallet connection and payment are AJ-only, and only after the Cook Islands certificate exists and AJ says PROCEED. Record the blocker status here.
- [ ] **CRITICAL** — Phase 1 exit check: rename verified, token check recorded, load-test results recorded, plan tier recorded, DEPLOYMENT.md steps listed.

---

## Phase 2 — 28 October to 3 November: core surface testing

For each page: load, interact, confirm output, log PASS or FAIL with date and notes below.

**Wed 28 Oct**
- [ ] Home (index.html)
- [ ] Talk to SIINDEX / Visitor Mode (typed and spoken)

**Thu 29 Oct**
- [ ] Jarvis (siindex-jarvis.html)
- [ ] Voice Command OS (siindex-os.html)

**Fri 30 Oct**
- [ ] Interview Mode (siindex-interview.html)
- [ ] Presentation Mode (siindex-present.html)

**Sat 31 Oct**
- [ ] Government and PM Q&A
- [ ] Operator proof (siindex-operator.html)

**Sun 1 Nov**
- [ ] FAQ (siindex-faq.html)
- [ ] Guided Speak
- [ ] System Card (siindex-system-card.html)

**Mon 2 Nov**
- [ ] Media kit (siindex-media-kit.html)
- [ ] October test board
- [ ] status.json accuracy check against what each page actually does today

**Tue 3 Nov**
- [ ] **CRITICAL** — Citizen dry-run: first-time visitor with zero context. No prior localStorage, no consent key, cold load. Run on mobile Safari and mobile Chrome. Log every step a stranger would hit.
- [ ] **CRITICAL** — Phase 2 exit check: every Live page logged, every FAIL listed.

---

## Phase 3 — 4 to 10 November: voice layer completion

**Wed 4 Nov**
- [ ] Verify whichever voice path won in Phase 1 on mobile Safari.

**Thu 5 Nov**
- [ ] Verify the same path on mobile Chrome and desktop.

**Fri 6 Nov**
- [ ] Test barge-in (interrupting a spoken reply).
- [ ] Test mute.

**Sat 7 Nov**
- [ ] Test STOP ALL.
- [ ] Test session teardown (mic released, audio element removed) on /os and on the public page.

**Sun 8 Nov**
- [ ] Test the mic-failure fallback on /os (permission denied, no device, device unplugged).

**Mon 9 Nov**
- [ ] **CRITICAL** — Payments hard gate: search every page for a pay button, wallet-connect control, Solana Pay prompt or token-distribution control. Confirm none is exposed. Log each page checked.

**Tue 10 Nov**
- [ ] **CRITICAL** — Phase 3 exit check: voice verified on both browsers, payment gate clean.

---

## Phase 4 — 11 to 17 November: integration flows

**Wed 11 Nov**
- [ ] Onboarding: phone OTP end to end.

**Thu 12 Nov**
- [ ] Onboarding: consent header and the `auth_user_id` link via the citizens-link migration.

**Fri 13 Nov**
- [ ] Board logging.

**Sat 14 Nov**
- [ ] mailto PROCEED loop.

**Sun 15 Nov**
- [ ] Sub-agent dispatch.

**Mon 16 Nov**
- [ ] Edge function health: siindex-website-voice-tts, siindex-website-runtime and siindex-realtime-token each return the expected codes under load.

**Tue 17 Nov**
- [ ] **CRITICAL** — Phase 4 exit check: all flows verified, health results logged.

---

## Phase 5 — 18 to 24 November: security and doctrine

**Wed 18 Nov**
- [ ] Locate security-canon.md and god-mode-canon-v12.md. Neither file was found in the repo on 2026-10-21. If they live elsewhere, AJ supplies them.

**Thu 19 Nov**
- [ ] Review security-canon.md against the protections actually implemented. List gaps.

**Fri 20 Nov**
- [ ] Review god-mode-canon-v12.md against actual implementation. List gaps.

**Sat 21 Nov**
- [ ] Test rate limiting and consent gates on every public endpoint.

**Sun 22 Nov**
- [ ] Test any anomaly detection that exists. Record what does not exist.

**Mon 23 Nov**
- [ ] Confirm no secrets are exposed client-side (scan the repo and the served pages again, since new commits have landed).
- [ ] Code scanning: zero open alerts.

**Tue 24 Nov**
- [ ] **CRITICAL** — Phase 5 exit check: gaps listed, scans clean. No new code-scanning alerts allowed by Phase 7.

---

## Phase 6 — 25 November to 1 December: demo preparation

**Wed 25 Nov**
- [ ] Finalise docs/sin-dex-ceo-persona.md with sample answers for government questions.

**Thu 26 Nov**
- [ ] Dry-run the 6 December opening: AJ introduces Sin-Dex, she answers as CEO. Log the run.

**Fri 27 Nov**
- [ ] Write fallback paths for live voice failing in the room.

**Sat 28 Nov**
- [ ] Test every media kit asset.

**Sun 29 Nov**
- [ ] Export offline copies: CEO persona, key docs, roadmap, pre-recorded intro video. **AJ-ONLY:** the intro video itself.

**Mon 30 Nov**
- [ ] Rehearse the full 6 December sequence with Wi-Fi off, using only the cached copies.

**Tue 1 Dec**
- [ ] **CRITICAL** — Phase 6 exit check: rehearsal passed offline, fallback paths written.

---

## Phase 7 — 2 to 6 December: final polish and contingency

**Wed 2 Dec**
- [ ] Re-test everything that failed in Phases 2 to 6.
- [ ] Walk through the DEPLOYMENT.md steps listed on 22 October.

**Thu 3 Dec**
- [ ] Re-test again. Anything still failing gets a written workaround.

**Fri 4 Dec**
- [ ] **Freeze** non-critical changes (48 hours before departure). Only fixes after this point.
- [ ] Pack offline copies of key docs and the roadmap.

**Sat 5 Dec**
- [ ] Connectivity stack for Rarotonga: eSIM primary, venue Wi-Fi secondary, offline cache last resort. **AJ-ONLY:** confirm the eSIM is active and tested before any meeting.
- [ ] Confirm AllDomains TLD application status before the meetings (expected: not submitted, gated).

**Sun 6 Dec**
- [ ] **CRITICAL** — Arrival check: live site up, voice path tested from the venue, offline pack opens with Wi-Fi off.

---

## Daily log

*(One line per day: date — done — next — blockers.)*

- 2026-10-21 — Rename, runtime deploy, two line fixes verified and pushed. Next: token check, DEPLOYMENT.md. Blockers: none logged. Open: security-canon.md and god-mode-canon-v12.md not found in repo.
