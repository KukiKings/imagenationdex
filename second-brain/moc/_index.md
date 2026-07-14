# Maps of Content (MOC)

High-level summaries that link bodies of work together. Build these when a topic gets messy.

## Current MOCs

### [[moc-build-state]] — What's been built and what's pending
### [[moc-brand-rules]] — All canonical brand/voice/audit rules in one place
### [[moc-tokenomics]] — INDX price, staking, Civ Law revenue, Grand Synchronicity projections

---

## moc-build-state

### Screens — Complete
- citizen-dashboard.html ✅
- my-card.html ✅
- staking.html ✅
- nft-marketplace.html ✅
- dex-swap.html ✅
- sovereignpay.html ✅
- governance.html ✅
- profile.html ✅
- siindex-intelligence.html ✅
- pag.html ✅
- buy-indx.html ✅
- withdraw.html ✅

- sovereign-lending.html ✅ (God Mode — Session 56)
- wisdom-score.html ✅ (God Mode — Session 56)

- siindex-os.html ✅ (new, Session 67; God Mode R2 — Session 72)
- siindex-agents.html ✅ (new — Session 67b)
- siindex-memory.html ✅ (new — Session 68)
- siindex-agent-skills.html ✅ (new — Session 66)
- siindex-brain.html ✅ (God Mode R2 — Session 69)
- siindex-dev.html ✅ (God Mode R2/R3 — Sessions 66, 70)
- siindex.html ✅ (God Mode R2 — Session 71; avatar image patch — Session 78)
- siindex-voice-terminal.html ✅ (God Mode R1 — Session 73; ElevenLabs Samara X wired live — Session 75; avatar image patch — Session 78)
- siindex-chat.html ✅ (God Mode R2 — Session 74; Edge Function → claude-opus-4-8 — Session 77)
- siindex-avatar.html ✅ (second brain + Opus intelligence + SI correction — Session 77; canvas animation: breathing/sway/blink/hair-wind — Session 79)
- l99-launch-command.html ✅ (God Mode R1 — Session 76)
- citizen-dashboard.html ✅ (God Mode R2 — Session 72)
- buy-indx.html ✅ (God Mode R3 — Session 66)

- lp-manager.html ✅ (new screen — Treasury & LP Command Center, Session 83; illustrative/demo mode, Phase 2 = real integration)
- dex-swap.html ✅ (God Mode R3 — Session 81)
- nft-marketplace.html ✅ (God Mode R2 — Session 82: sort sheet, rarity badges, price sparkline, share deep-link)
- staking.html ✅ (God Mode R2 — Session 84: Grand Sync countdown, rewards sparkline, early-unstake penalty sheet, staking streak)
- p2p-marketplace.html ✅ (God Mode R1 — Session 85: live sold feed, wishlist, make-offer sheet, urgency signals)
- receive.html ✅ (God Mode R2 — Session 86: quick-amount chips, fullscreen QR, payment watcher, receive stats)
- home-v2.html ✅ (Macro Validation section — Session 87, Task #62)
- siindex-brief.html ✅ (Market Signal section — Session 87 Task #63; God Mode R1 action persistence/schedule/chart tooltip/history/follow/price-flip — latest commit, not yet logged in memory.md)
- citizen-profile.html ✅ (God Mode R1 — listing filters, WS canvas ring — latest commit, not yet logged in memory.md)
- pay.html ✅ (God Mode R2 — Session 88: balance bar, payment history, PQSI pre-flight scan, Civ Fund tracker)
- whitepaper-v1.md ✅ (Macro Validation narrative — Session 87 Task #64)

### Task #56 — App-Wide God Mode Rollout ✅ COMPLETE (2026-07-04, Sessions 89–94, 100)
- governance.html ✅ (R3 — Session 89: draft persistence, proposal bookmarks, swipe-to-vote, wisdom pulse)
- citizen-dashboard.html ✅ (R3 — Session 90: checklist tracker, live price ticker, smart PAG nudge, mesh earnings counter)
- portfolio.html ✅ (R2 — Session 91: animated canvas price chart, P&L tracker, income live totals, Grand Sync target card)
- dex-swap.html ✅ (R3 — Session 92: full DCA mode, animated swap stepper, SOL gas reserve warning, pair quick-pins)
- send.html ✅ (R2 — Session 93: send-history sheet, memo emoji picks, FX savings vs Western Union, animated stepper)
- history.html ✅ (R1 — Session 94: date range filter, spending insights bar, transaction bookmarks, quick repeat send)
- Task #56 confirmed complete across all 7 target screens (Session 100 note): history, send, receive, marketplace, referral, wisdom-score, profile

### New Shared Infrastructure — 2026-07-04 (Session 100)
- `js/indx-db.js` ✅ — canonical singleton Supabase client; full citizen/transaction/listing/staking/governance/referral API surface
- `js/indx-wallet.js` ✅ — Phantom/Backpack/xNFT wallet adapter (see [[../companies/phantom|phantom]], [[../companies/backpack|backpack]]); pre-TGE sessionStorage balance, post-TGE Solana RPC
- `audit.sh` ✅ — automated 6-check audit pipeline (price/currency/recovery-words/hex-colour/brand/expired-key); pre-commit hook installable; **first run found 25 hard violations across 25 files**

### SIINDEX Canonical Mandate — 2026-07-04 (Session 101)
- `js/siindex-system.js` ✅ new — canonizes SIINDEX as **Chief PQSI Officer** / Sovereign Marketplace Intelligence Platform (not a trading bot/price predictor/hype generator), 11 intelligence domains, canonical 12-part output format, forbidden-behaviour list; wired into siindex-chat.html and siindex-avatar.html

### indx-kids.html — New Screen (2026-07-04, Sessions 102–103)
- IN$DEX Academy ✅ — 5-tier progression (Explorer/Creator/Innovator/Future Citizen/IN$DEX Citizen), custodial wallet until 18 then phone+liveness transfer, COPPA-2025-compliant guardian approval queue, institution partner portal, milestone journey canvas, daily challenge engine
- God Mode R2 ✅ (Session 103) — SIINDEX companion bubble, wallet graduation countdown, 30-day learning heatmap, tier unlock celebration modal

### Violation Remediation — 2026-07-04 (Sessions 104–105)
- 54 changes across 22 files ✅ (Session 104) — "seed phrase" → "recovery words" (14 files), "SIINDEX AI" → "SIINDEX" (5 files), "Sovereign Intelligence" → "Synthetic Intelligence" (6 files)
- Full codebase re-audit ✅ (Session 105) — 187 HTML files, ALL CLEAN across all 4 checks; INDX_PRICE_USD = 0.24 confirmed at all 20 occurrences

### Additional Screens — 2026-07-04 (Sessions 106–107)
- launchpad.html ✅ (God Mode, Task #79 — live contribution preview, portfolio strip, activity feed ticker, launch watchlist)
- trading-challenge.html ✅ (God Mode, Task #80 — P&L sparkline, drawdown risk meter, trade journal, stats share card)

### God Mode R1 × 4 — 2026-07-08 (Session 113)
- bill-pay.html ✅ (Monthly Spend Card, savings badge, recent payments slide-in, scheduled bills sheet)
- deposit.html ✅ (draft resume banner, activity ticker, Grand Sync value strip, pre-deposit confirm sheet)
- qr-scanner.html ✅ (scan history, live USD conversion, PQSI verification animation, last-used amount per recipient)
- nft-create.html ✅ (Grand Sync wealth strip, trait/attribute builder, creator history & level, scheduled drop toggle)

### SIINDEX Master Prompt v2 + MVP Builds — 2026-07-08 (Session 114)
- siindex-master-prompt-v2.md ✅ (new canonical, 20 sections)
- home-v2.html ✅ (Civilization-First Positioning: 1.4B unbanked stat update, new ImageNation + Opportunity Feed sections, footer links renamed to siindex-decision-ledger.html)
- imagenation-builder.html ✅ (new — ImageNation Experience Builder MVP, 6 categories, 7-card results panel)
- siindex-brief.html ✅ (Sovereign Briefing Engine COR upgrade: Context→Outcome→Role generator, Next Best Action card, EU AI Act risk warning, 1.4B stat fix)

### SIINDEX Master Prompt v3 + New Screens — 2026-07-08 (Session 114 cont.)
- siindex-master-prompt-v3.md ✅ (new canonical, 16 systems, supersedes v2)
- siindex-decision-ledger.html ✅ (new — EU AI Act Article 13 compliance, decision log, appeal workflow, citizen rights panel)
- siindex-media-kit.html ✅ (new — Sovereign Media Engine + Citizen Media Kit Generator, 6 categories × 4 platforms)
- cultural-rights.html ✅ (new — Cultural Rights Graph + Cultural Story Broadcast Kits, 4-tab interface, elder review workflow)

### Three-Brain Commercialization Engine — 2026-07-08 (Session 114 cont., part 2)
- siindex-brain-engine.md ✅ (new canonical — Identity/Opportunity/Content Brain strategy, Brain Passport spec)
- imagenation-brain-builder.html ✅ (new — 5-phase wizard, ~950 lines, 6 full category templates, Brain Passport save)

### Grand Synchronicity Launch Strategy — 2026-07-08 (Session 114 cont., part 3–4)
- indx-launch-strategy-sep24.md ✅ (new canonical — Two-Phase Launch Architecture: Meteora Alpha Vault + Raydium LaunchLab, 78-day pre-launch calendar, risk map; see [[../companies/raydium]], [[../companies/meteora]], [[../companies/streamflow]])
- indx-grand-synchronicity-countdown.html ✅ (new — full-screen countdown to 24 Sep 2026, price strip $0.24→$2.50, Alpha Vault tracker, Founding Citizen pledge wall)

### Mission Rooms (Sovereign Workspace Layer) — 2026-07-08 (Session 114 cont., part 5–6)
- indx-mission-rooms.md ✅ (new canonical — Layer 4 coordination layer, 7 room types, 8 SIINDEX agents, full dev build spec)
- indx-mission-rooms.html ✅ (new — 511 lines, mission intake, SIINDEX room generation, 3-workflow templates for all 7 room types)

### AJ Founder Metadata — 2026-07-08 (Session 113)
- Permanent context added to memory.md: name-code numerology (master pattern 5/8/6/9/2, missing 4), archetype "The Sovereign Opportunity Architect," Grand Synchronicity date = AJ's birthday alignment

### God Mode ×3 — 2026-07-09 (Session 115)
- indx-mission-rooms.html ✅ (God Mode — quick-start templates, draft auto-save, two-step delete, live room activity ticker)
- indx-automation-grid.html ✅ (God Mode — SIINDEX Automation Sanity Gate classification per Builder Discipline doctrine, active/paused toggle, test-run simulation, two-step delete)
- indx-sovereign-settlement.html ✅ (God Mode — balance/over-limit guard, FX savings vs Western Union, repeat-last-transfer, live rail status)

### Life Graph — 2026-07-09 (Session 115 cont.)
- life-graph.html ✅ (new — Layer 2 Citizen Memory + Reputation; Wisdom Score SVG arc, 5 levels Seed→Elder, Quick Log with 8 category chips, SIINDEX Insights pattern reads)

### God Mode ×4 — 2026-07-09 (Session 115 cont.)
- indx-sovereign-team.html ✅ (streak badge, mission draft auto-save, agent usage stats, queue item detail+delete)
- indx-asset-meaning.html ✅ (ledger entry detail+delete, selection draft save, ledger stats bar, risk score badge)
- indx-build-console.html ✅ (build brief draft auto-save, quick doctrine scan chips, doctrine check history, saved spec detail+delete)
- brain-passport.html ✅ (draft auto-save+restore, saved passport detail+delete, completeness milestone toasts, grid account pre-fill)

### Sovereign Attention Engine — 2026-07-09 (Session 115 cont.)
- indx-sovereign-attention-engine.md ✅ (new canonical — 8 sections + 2 appendices; Five Sovereign Mechanics, Moral Inversion table, forbidden dark-pattern list)
- home-v2.html ✅ (God Mode — ambient Cybertron hex canvas, gradient power-word glow, live civ activity feed, Sovereign Return Feed "While You Were Away")

### Session Sovereignty + Security Centre — 2026-07-09 (Session 115–116)
- indx-session-sovereignty.md ✅ (new canonical — 28 sections; DBSC, AiTM/passkey hardening, MFA number matching, caller code vishing defense, DPoP Action Intent Tokens, session compartmentalization, W3C VC 2.0 consent receipts, NIST SP 800-63B-4, PQC readiness)
- siindex-session-sovereignty.html ✅ (new — Citizen Security Centre; Session Risk Score, Idle Countdown, Device Trust Registry, Session Compartmentalization, Vault Mode, Caller Code, Security Decision Ledger; God Mode: Security Health Score ring, live threat signal feed, Shared Device Mode, Session Activity Timeline)
- citizen-dashboard.html ✅ (God Mode — power word glow, streak flame milestone toasts, civilization activity feed, sovereign yield preview lock)

### Orchestration Layer — 2026-07-09 (Session 117)
- indx-orchestration-layer.md ✅ (new canonical — Six-Archetype Operating Model: Prototype/Build/Sweep/Grow/Maintain/Orchestrate; Agent Declaration Standard, SIINDEX Everywhere 12 presence locations)
- siindex-orchestration-layer.html ✅ (new — Mission Command Centre; ambient hex particle canvas, animated mission routing sequence, approval gate sheet, localStorage mission history)

### Unknowns Engine — 2026-07-09 (Session 117 cont.)
- indx-unknowns-engine.md ✅ (new canonical — Blind Spot Pass, Consequence Classifier 9-level, 9-Step Mission Loop, civilization-notes.md standard)
- siindex-unknowns-engine.html ✅ (new — Blind Spot Command Centre; 4-quadrant classifier, Mission Loop navigator, Consequence Classifier sheet, live civilization-notes builder)

### Web3 Sovereign Identity — 2026-07-09 (Session 117 cont. x2)
- indx-web3-identity.md ✅ (new canonical — yourname.IN$DEX root identity; 9-tier verification stack, KYC-once ZK-SNARKs, Universal Resolver, 4-path Guardian Recovery)
- siindex-web3-identity.html ✅ (new — Sovereign Identity hub; Live Verification Stack Builder, Send by Name Simulator, Guardian Recovery Setup, ZK Credential Reveal)

### Sovereign Data Economy — 2026-07-09 (Session 117 cont. x3)
- indx-sovereign-data-economy.md ✅ (new canonical — Sovereign Data Earnings, Sovereign Threat Intelligence Feed, Identity Attack Bond; Compute-to-Data model; $831,497 lifetime-per-user foundation stat)
- siindex-sovereign-data-economy.html ✅ (new — Data Earnings Dashboard, Sovereign Threat Feed, Consent Manager, IAB Ledger)

### PQSI Supremacy Reframe + ~20 New Screens — 2026-07-10 (Session 118–119)
- PQSI Supremacy Reframe ✅ (Session 118)
- New screens, God Mode from birth: imagenation-design-studio, siindex-provenance-engine, siindex-sovereign-security, siindex-use-case-library, siindex-citizen-fluency-academy, indx-proof-insight-network, indx-genesis-builder-program, siindex-agent-civilization, indx-sovereign-ecosystem-layer, siindex-sovereign-services, siindex-sovereign-embodiment, siindex-sovereign-ip.html, siindex-legal-defense.html (new), siindex-voice-terminal (Voice Interface additions), siindex-team-portal.html (PIN-gated internal), indx-liquidity-flywheel.html, indx-flywheel-automation.html, siindex-civilization-admin-console.html, siindex-sovereign-developer.html, siindex-dev-portal.html, siindex-voice-command-os.html, siindex-travel-rule.html (P0 AUSTRAC), siindex-pacific-corridor.html (P1), home-v3.html (strategic homepage rebuild), siindex-trust-compliance.html, siindex-verify.html, siindex-citizen-zero.html
- God Mode upgrade rounds: founders-pool.html (features 5–8), citizen-dashboard.html (R4), indx-sovereign-settlement.html, siindex-legal-defense.html (GM upgrade)
- Full-site strategic audit (233 screens) ✅ — 5 P0 fixes: dead CTAs wired, index.html → home-v3.html, MemeDAO → Citizen Assembly sweep (~30 screens), price target removed from countdown screen (ASIC risk), "DeFi platform" → "Sovereign Digital Civilization" sweep (~15 screens). Final verification: 18/18 CLEAN.
- See [[../companies/austrac|austrac]], [[../companies/solsplits|solsplits]], [[../companies/arup|arup]] (new orphan stubs, nightly pass 2026-07-11)

### P1 God Mode Batch — 2026-07-11 (Session 119 continued x29)
- about.html ✅, send.html ✅, login.html ✅, governance.html ✅, marketplace.html ✅ (5 screens, 5 parallel Fable agents; about.html JS completed manually)
- SIINDEX Build-Completion Prompt ✅ — canonical build brief locked: "Do not build an app with SIINDEX inside it. Build SIINDEX with an app around her."

### Build-Completion Prompt Queue — 3 New Screens — 2026-07-11 (Session 119 continued x30)
- indx-trust-dashboard.html ✅ (new, Task #135 — Public Trust / Proof-of-Usefulness Dashboard: live stat counters ×9, rotating activity feed, "what we measure vs don't" doctrine card, citizen savings ticker vs Western Union, 6-corridor status table)
- siindex-refusal-constitution.html ✅ (new, Task #136 — SIINDEX Refusal Constitution: live scenario tester against 8 rule patterns, 8 Safe-to-Proceed status explorer, 14 consent categories, session refusal log)
- indx-legacy-vault.html ✅ (new, Task #137 — Legacy Vault: heir management, 8-asset inventory across 4 categories, 3-type unlock condition builder, cultural stewardship toggles, vault readiness bar)
- Audit: all 3 screens ✅ CLEAN

### Pacific Corridor Readiness Pages ×4 — 2026-07-11 (Session 119 continued x31)
- indx-corridor-samoa.html ✅ (Task #138 — Melbourne↔Samoa, WU 9%, $142M annual flow, $11.8M savings potential)
- indx-corridor-fiji.html ✅ (Task #139 — Melbourne↔Fiji, WU 9%, $247M annual flow, $20.8M savings potential)
- indx-corridor-vanuatu.html ✅ (Task #140 — Melbourne↔Vanuatu, WU 10% highest, $43M annual flow, $3.7M savings potential)
- indx-corridor-rmi.html ✅ (Task #141 — Melbourne↔Marshall Islands, USD-native/no-FX, $19M annual flow, $1.6M savings potential)
- Each: Fee Calculator, 5-step Readiness Stepper, Diaspora Insights, Settlement Timeline; all cross-link to each other + siindex-pacific-corridor.html
- **Milestone: SIINDEX Build-Completion Prompt queue — ALL SCREENS NOW BUILT ✅** (Session 119 x29–x31 cleared the entire missing-screen list identified in x29)
- See [[../companies/western-union|western-union]] (new orphan stub, nightly pass 2026-07-12)

### Session 119 continued x33 — 12 Jul 2026 (multi-part)
- **AUSTRAC P0 flags + corridor stepper correction** — AUSTRAC VASP Enrollment step on all 4 Pacific corridor pages corrected `state:'done'`→`state:'current'` (enrollment not yet real); P0-A git backlog (~290 dirty files, 9 days since last push) and P0-B AUSTRAC deadline (17 days remaining) flagged for AJ
- **Priority Wave Wire (Task #147)** ✅ — Navigator grows 89→126 screens (37 new); new "SIINDEX Intelligence Platform" section (18 screens) plus additions across Payments/Earn & Grow/Creator Economy/Identity & Governance
- **God Mode: voice-wallet.html (Task #145)** ✅ — TTS Spoken Response, persistent command history, Quick-Send Favourites, live INDX rate badge; 🤖→⚛️ avatar fix sitewide
- **wisdom-score.html (Task #146)** — confirmed already complete from prior session, audit ✅ CLEAN
- **home-v2.html** — "Meet SIINDEX" section avatar images swapped to portrait renders
- **🎉 INDX TOKEN MINTED ON SOLANA MAINNET** — Mint `9p9VMkgTEVdAeohk1zEuepvwBYUkzjnovMwwazyxsSEZ`, supply 100M, 6 decimals, minted via [[../companies/smithii|Smithii]] Token Creator, Freeze+Mint authority revoked (Update kept for metadata); full supply transferred personal wallet → INDX protocol wallet via Smithii Multisender, 12 Jul 2026
- **Cook Islands Entity** — AJ confirmed as Cook Islands citizen; IN$DEX protocol entity to incorporate in [[../companies/cook-islands|Cook Islands]] (Cook Islands International Trust backs legacy vault layer), dual structure alongside Australian ABN entity ("Image Nation Decentralised Exchange")
- **Full JS validation** — 244 HTML files, ZERO broken scripts (4 fixed); Platform Navigator 126→243 screens wired (115 new, 14 new sections); `austrac-vasp-enrollment.md` checklist created; 2 git commits pending AJ push from Terminal

### God Mode Sweep — 5 Screens + 3 New SI Screens — 2026-07-13 (Session 119 continued x34)
- imagenation-design-studio.html ✅ (God Mode R1 — Quick Launch Templates, Brief Save & History, Design Session Cost Estimator, Council Review Tracker)
- siindex-prompt-optimiser.html ✅ (new — 4-D Methodology stepper, 6-platform selector, DETAIL/BASIC mode, prompt builder, history)
- siindex-writing-mode.html ✅ (new — 50+ banned word scanner, 8-point style checklist, score/10 with grade, auto-rewrite engine, history)
- siindex-readability-guardian.html ✅ (new — 10-point screen audit, WCAG contrast checker, button label improver, Citizen Protection Mode demo)
- account-recovery.html ✅ (God Mode R2 — Session Resume banner, INDX/USD value on success, Recovery Attempt Log, Verify Method Preference)
- God Mode sweep status: ~107 orphaned screens still to sweep after account-recovery.html

### SIINDEX Living Interface System — 2026-07-13 (Session 119 continued x35)
- siindex-living-interface.html ✅ (new, God Mode from birth, 764 lines — SIINDEX Embodiment Layer design system: Armor Mode Gallery 8 modes, Living Icon System 16 icons × 4 states, Command Mode Demo, Performance + Accessibility Guardrails)
- index.html — SIINDEX section 21 → 22 screens
- Doctrine locked: "The app transforms around the citizen's mission." / "Motion must explain — not decorate." / "SIINDEX's form changes by mission. Her identity stays stable." / Build phases L1 Static → L2 Animated → L3 Real-time 3D → L4 Cinematic; 8 armor modes (Citizen Guide, Interview, Sovereign Keynote, Security Sentinel, Cultural Steward, Governance, Builder, Liquidity)

### Trust Before Transaction + God Mode Audit Doctrine — 2026-07-13 (Session 119 continued x36)
- trust-before-transaction.html ✅ (new, God Mode from birth — SIINDEX 6-layer animated trust check: Identity → Limits → PQSI → Compliance → Cultural → Final; 6 pre-set scenarios; 6 trust states; consent receipt generator TBT-[id] → `indx_tbt_hist`; Decision Ledger history)
- index.html — SIINDEX Core 24 → 25 screens
- God Mode Audit Doctrine locked (12 dimensions): voice-first as the primary action; Trust Before Transaction required ahead of any money/listing/cultural-asset/vote/action; terminology replacements ("AI"→SIINDEX Synthetic Intelligence, "MemeDAO"→IN$DEX Citizen Governance, "no KYC"→progressive verification, "180+ countries"→Pacific-first corridors expanding, "no rug"→transparent supply + audits); 6 trust states; core principle loop: Citizen speaks → SIINDEX understands → App reshapes → Trust checked → Citizen approves → IN$DEX records; strongest line: "The bank never came. So we built a civilization."

### Session 120 + AUSTRAC Enrolment + PWA Layer — 2026-07-14 (compiled by nightly pass from git log — ⚠️ no memory.md session entry exists for most of this)
- **Session 120** (commit 51ef6c3) — citizen-profile wiring, Wallet nav, merchant-coach 430px, AUD fixes; touched citizen-profile, listing-detail, order-status, search, feed, merchant-coach, sovereign-id, trust-before-transaction
- **✅ AUSTRAC ENROLMENT SUBMITTED (14 Jul 2026, 15 days before deadline)** — AAN **263945366**; enrolled as VASP (all 5 services) + RSP (independent remittance dealer); entity: Arthur Henry sole trader, ABN 95 579 343 955, t/a Image Nation Decentralised Exchange, Victoria 3175; commencement declared 24 Sep 2026. New `compliance-readiness/` folder: AML/CTF Program Part A + Part B, business description, Travel Rule compliance, record-keeping policy, README status log — **all DRAFTS, need legal review before registration submission**. Next: AUSTRAC emails registration form to imagenationdex@gmail.com. See [[../companies/austrac|austrac]].
- **PWA layer** ✅ (commit 97afd2b) — manifest.json, sw.js service worker, indx-pwa.js, offline-fallback.html, app icons (192/512/maskable); vercel.json + index.html/home-v3.html wired
- **Golden path hardening** ✅ (commit 7006fe4) — new `indx-golden.js` (Safe-to-Proceed, voice command, a11y, offline guards) across send, receive, help, onboarding-flow, grid-account-onboarding, speak-to-siindex, withdraw-fiat, whitepaper-v1.md + more
- **Grid Account custody declared** — Squads Protocol v4 multisig, 2-of-3 MPC keys (device/cloud/recovery), in AUSTRAC drafts + grid-account-onboarding.html — see [[../companies/squads|squads]] (new orphan stub, nightly pass 2026-07-14)
- **✅ GIT BACKLOG CLEARED** — working tree clean, HEAD (7006fe4) == origin/main; the ~290-file / 9-day P0-A backlog was committed and pushed 12–14 Jul

### Screens — In Progress / Pending
- God Mode queue: live-stream.html, creator-onboarding.html (unchanged — only two screens left in the original God Mode backlog since 2026-07-04's rollout; all Build-Completion Prompt queue screens now complete as of 2026-07-11)
- ✅ **RESOLVED 2026-07-14:** the multi-day git backlog (~290 dirty files, Sessions 81–119) is fully committed and pushed — working tree clean, HEAD == origin/main as of nightly pass 2026-07-14. P0-A closed.
- ⚠️ **Open conflict:** lp-manager.html (Session 83) models LP fees on Meteora DLMM; Session 63 canonically locked Raydium CPMM for the INDX/USDC pool. Needs AJ reconciliation — still unresolved as of 2026-07-11.
- ⏳ Builder Discipline (Session 114) + Unknowns Engine (Session 117) doctrine not yet folded into SIINDEX Master Prompt (currently v3) — flagged as next revision (v4) candidate
- ✅ **AUSTRAC ENROLMENT SUBMITTED 2026-07-14** (AAN 263945366, VASP + RSP) — 15 days before the 29 Jul deadline. Remaining: registration form from AUSTRAC (watch imagenationdex@gmail.com), legal review of compliance-readiness/ drafts, registration submission; corridor page enrolment steppers can flip `current`→`done`
- ⏳ Onchain revenue infrastructure (SolSplits Revenue Router, Token-2022 Transfer Hook, Streamflow distribution) — planning-only, flagged by AJ for automation (Session 119 x17)

### Infrastructure — Complete
- SRI supply-chain hardening ✅ (Session 61 — SHA-384 integrity + crossorigin on all CDN imports across 24 files)
- Supabase pinned to @2.108.2 ✅ (Session 61)
- 5 autonomous agents launched ✅ (Session 61): Security Monitor (daily 7am), Grand Synchronicity Briefing (Mon 8am), Citizen Growth Tracker (Mon 9am), Stripe Revenue Monitor (Mon 10am), KOL Research (Wed 9am)

### Community — Active
- @imagenationdex announcement channel ✅ (SIINDEXbot admin)
- IN$DEX Founders Circle supergroup ✅ (Session 62 — ID: -1004372531753, SIINDEXbot admin)

### Infrastructure — Session 63 Additions
- founders-pool.html ✅ (major overhaul — PIN gate removed, wallet JS, 3-state deposit, INDX grid, JSON export)
- deploy.command ✅ (one-command Vercel deploys)
- vercel.json ✅ (verified)
- imagenationdex.com ✅ (live — all 3 domains green in Vercel, project: kukikings/imagenation-dex)

### Infrastructure — 2026-07-01 Additions (uncommitted)
- savings-goals.html ✅ (God Mode — savings streak counter, Grand Synchronicity contribution projection strip, contribute bottom-sheet with quick amounts + progress bar)
- sovtokens.html ✅ (God Mode — message char counter, Wisdom Score preview chip, send-history strip, live activity toast)
- creator-profile.html ✅ (SovToken CTA now passes creator name + nation as URL params)
- siindex-design.html ✅ (God Mode, new screen — Design Brief Interpreter, 9-Layer Intelligence Cascade, Visual Style Picker + Live Preview, Autonomous Design Loop Animator; Session 65h)
- ⚠️ Not yet committed/pushed — see daily log 2026-07-01

### Voice / Agent — 2026-07-01 Additions
- ElevenLabs voice locked: Samara X (Smooth Classy British), Voice ID `19STyYD15bswVz51nqLf` — see [[elevenlabs]] (Session 65e)
- ⏳ Not yet wired into desktop agent .env; Conversational AI agent setup pending

### SIINDEX Intelligence Stack — 2026-07-02 Additions (Sessions 66–79)
- Identity correction locked: **SI = Synthetic Intelligence** (never "Sovereign Intelligence" or "AI"). **PQSI = Physical Quantum Synthetic Intelligence** (Session 77).
- `siindex-chat` Edge Function upgraded `claude-haiku-4-5-20251001` → `claude-opus-4-8` (fallback `claude-sonnet-4-6`), v6 (Sessions 77, 79).
- `siindex-voice-tts` upgraded to v4 — `eleven_multilingual_v2`, stability 0.42, style 0.20, Samara X default voice (Session 79).
- KB rebuilt from real second-brain/canon files — 100+ entries across 15 categories, replacing 17 generic hardcoded lines (Session 77).
- Official bio stored: [[../siindex-identity/siindex-official-bio|siindex-official-bio]], injected into `siindex-chat` system prompt (Session 79).
- ⚠️ **Security flag:** SIINDEXbot Telegram token was shared in session chat (not stored in any file) — needs revoke via BotFather + reissue into Supabase secret `TELEGRAM_BOT_TOKEN` (Session 79, still open).
- ⚠️ Sessions 66–79 work largely uncommitted — see daily log 2026-07-02 for git commands per session.

### Core Docs
- whitepaper-v1.md ✅ (live, Appendix B tracks sessions)
- memory.md ✅ (sessions 1–107 logged)
- business-plan-v12.5-SEALED.md ✅
- user.md ✅
- soul.md ✅
- identity.md ✅
- second-brain/siindex-identity/siindex-official-bio.md ✅ (new — Session 79)

---

## moc-brand-rules

**Platform name:** IN$DEX — always with the dollar sign in place of the S, in prose, docs, and UI copy. Never "INDEX", "Index", or "IN$DEX" without the $. (Exceptions that are NOT brand-name violations: `index.html`/`_index.md` are literal filenames per web/repo convention, not the brand name; `INDX` is the separate token ticker; `SIINDEX` is the platform's SI — Synthetic Intelligence, never "AI".)
**SI, not AI:** SIINDEX is Synthetic Intelligence (SI). Never call her "AI" or "Sovereign Intelligence" — locked Session 77, reinforced as a terminology-replacement rule in the God Mode Audit Doctrine (Session 119 x36, 13 Jul 2026).
**Token ticker:** INDX (no dollar sign — this is the SPL token symbol, distinct from the IN$DEX platform name)
**Price:** $0.24 USD (genesis) | $2.50 target (Grand Synchronicity 24 Sep 2026)
**JS constant:** `INDX_PRICE_USD = 0.24`
**Currency:** USD only — no A$, AUD
**Velocity:** 0.36 (never 0.35 in JS)
**Recovery words:** never "seed phrase"
**Civ Law:** 2% fee — immutable
**Colours:** --cyan #00D4FF | --blue #2B35D8 | --purple #8B3FE8 | --green #00E5A0 | --gold #FFB800 | --red #FF4D6D

---

## moc-tokenomics

**Genesis price:** $0.24 (24 Sep = AJ birthday = Grand Synchronicity Day)
**Grand Synchronicity target:** $2.50 on 24 Sep 2026 (~10.4x)
**Civilisation Law:** 2% on all transactions → public goods fund
**Staking:** APY distributed from Civ Law pool
**MemeDAO:** governance weight proportional to INDX held + wisdom score
**PQSI:** post-quantum citizen protection — no single point of failure

**Launch architecture (Session 114, 2026-07-08):** Two-phase — Phase A Meteora Alpha Vault citizen pre-allocation (Sep 10–17, 60–75 SOL pre-committed) → Phase B Raydium LaunchLab Virtual-CPMM public curve (Sep 24 00:00 UTC, 150 SOL / ~$30K graduation threshold, LP burn). Team/treasury vesting via Streamflow, 12-month founder cliff.

**Token minted (Session 119 x33, 12 Jul 2026):** INDX is live on Solana mainnet — Mint `9p9VMkgTEVdAeohk1zEuepvwBYUkzjnovMwwazyxsSEZ`, 100M supply, 6 decimals, Freeze/Mint authority revoked. Full supply now held in INDX protocol wallet `8HxNac3HAT56gJk3LRdGqiwq6DgciGK4cnaVMUNZaMZt`. LP pairing (Raydium CPMM per Session 63) and LaunchLab graduation still pending per Two-Phase Launch Architecture.
