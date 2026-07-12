# Decisions

Format: Date | Decision | Why | Alternatives considered

## 2026

**Jun 2026** | INDX genesis price locked at $0.24 | AJ birthday = 24 Sep → $0.24 | Other price points considered but 24 is canonical

**Jun 2026** | Grand Synchronicity target = $2.50 on 24 Sep 2026 | 10x from genesis, meaningful milestone, AJ birthday | Other targets discussed

**Jun 2026** | Civilisation Law = 2% fee immutable | Platform sustainability + citizen fairness | Variable fee rejected — complexity, trust issues

**Jun 2026** | "Recovery words" not "seed phrase" | Approachable for non-crypto users (Mama Noe test) | "Secret phrase", "backup phrase" considered

**Jun 2026** | Currency = USD only in app | Global-first product, avoid AUD bias | AUD display rejected for all markets

**Jun 2026** | God Mode = Cybertron hex canvas + 3 JS features per screen | Consistent visual identity + genuine UX value | Per-screen custom animations rejected (inconsistent)

**Jun 2026** | memory.md lives inside ImageNation DEX project folder | Parent CoWork/ folder not always mounted | Separate notes app rejected (no persistence)

**Jun 2026** | Velocity constant 0.36 (not 0.35) | 0.35 triggers price audit false positive | No perceptible visual difference

**Jun 2026 (Session 61)** | Supabase CDN pinned to @2.108.2 with SHA-384 SRI | Supply-chain hardening following Dan Tentler attack surface framework | Floating @2 tag rejected — unpinned CDN is attack vector

**Jun 2026 (Session 61)** | Stripe JS (js.stripe.com/v3/) excluded from SRI | Stripe's explicit policy — they continuously patch this file; SRI would cause breaks | No alternative: Stripe requires this exception

**Jun 2026 (Session 61)** | dynamic script injection in citizen-dashboard.html not SRI-eligible | SRI requires static src attribute; dynamic injection is incompatible | Accepted risk: version-pinned as mitigation

**Jun 2026 (Session 62)** | Founders Circle runs as Telegram supergroup | Required for bot admin — Telegram auto-upgrades basic group → supergroup on bot promotion | Basic group rejected: cannot add bot as admin

**Jun 2026 (Session 62)** | Both Telegram chat IDs recorded | Original -5512185356 → supergroup -1004372531753 | Single ID rejected: old ID may appear in logs

**Jun 2026 (Session 63)** | INDX/USDC LP pairing confirmed (not SOL) | USDC is stable reference for genesis price; SOL volatility creates pricing instability | SOL pairing rejected

**Jun 2026 (Session 63)** | Raydium CPMM Standard AMM chosen for LP | Solana-native, deep liquidity, compatible with INDX SPL token | Other AMMs not evaluated

**Jun 2026 (Session 63)** | LP tokens burned post-launch | Credibility signal — no rug-pull risk | Retaining LP tokens rejected for trust reasons

**Jun 2026 (Session 63)** | PIN gate removed permanently from founders-pool.html | File is admin-only — no gate needed; PIN was unnecessary friction | Retained for security rejected (no real threat model)

**Jun 2026 (Session 63)** | Vercel chosen for hosting (kukikings/imagenation-dex) | One-command deploys, global CDN, free tier adequate | Self-hosted rejected (ops overhead)

**1 Jul 2026 (Session 65e)** | Samara X (Smooth Classy British) locked as SIINDEX voice, Multilingual v2 model, Stability 0.74 | British accent = Jarvis-quality authority; v2 more reliable than v3 for this voice; 0.74 stability eliminates instability warning while keeping naturalness | Aria (unavailable), Alice, and others considered; edge-tts en-AU-NatashaNeural replaced

**2 Jul 2026 (Session 77)** | SI = Synthetic Intelligence, never "Sovereign Intelligence" or "AI"; PQSI = Physical Quantum Synthetic Intelligence | AJ flagged mislabeling as a critical error — identity precision matters for brand and legal positioning | "Sovereign Intelligence" and generic "AI" rejected outright

**2 Jul 2026 (Session 77)** | `siindex-chat` Edge Function model upgraded to `claude-opus-4-8` (fallback `claude-sonnet-4-6`) | Was running `claude-haiku-4-5-20251001`, the smallest model — AJ: "you're building her to be the dumbest thing ever" | Sonnet-only rejected — Opus needed for quality, Sonnet kept only as fallback

**2 Jul 2026 (Session 77)** | SIINDEX knowledge base rebuilt from real second-brain/canon source files (100+ entries, 15 categories) | Previous KB was 17 hardcoded generic Q&A lines disconnected from actual project memory | Keeping hardcoded KB rejected — no genuine second-brain connection

**2 Jul 2026 (Session 75/79)** | ElevenLabs Samara X wired live into siindex-voice-terminal.html and siindex-chat.html, with graceful fallback to browser speechSynthesis | Voice was locked in Session 65e but never actually connected — screens were still using browser TTS | No fallback rejected — API key activation timing is uncertain, degradation must be graceful

**2 Jul 2026 (Session 79)** | SIINDEXbot Telegram token (shared in session chat) must be revoked via BotFather and reissued into Supabase secret `TELEGRAM_BOT_TOKEN` | Token was never written to any file, but chat exposure is still a leak vector | Leaving token as-is rejected — security risk

**3 Jul 2026 (Session 83)** | lp-manager.html ships with illustrative/demo data only — real on-chain integration (Meteora/Jito/Kamino/Jupiter, Supabase + wallet connect) deferred to Phase 2 | New Treasury & LP Command Center screen needed to exist for demo/pitch purposes before real integration work is scheduled | Waiting for full on-chain wiring before shipping any UI rejected — blocks demoability

**3 Jul 2026 (Session 87)** | "Macro Validation — Why Now" section (Fink quote, OUSD-on-Solana, X Money APY, cycle timing, unbanked TAM) added identically to home-v2.html, siindex-brief.html, and whitepaper-v1.md | External validation signals strengthen the urgency case ahead of Grand Synchronicity | Internal-only conviction narrative rejected — institutional signals are more persuasive to investors/citizens

**4 Jul 2026 (Session 100)** | `js/indx-db.js` and `js/indx-wallet.js` created as canonical shared modules (singleton Supabase client; Phantom/Backpack/xNFT wallet adapter) | Prevents per-screen duplicate wallet/DB boilerplate; pre-TGE balance reads from sessionStorage, post-TGE from Solana RPC | Per-screen inline wallet code rejected — inconsistent, harder to audit

**4 Jul 2026 (Session 100)** | `audit.sh` automated 6-check audit pipeline built (price/currency/recovery-words/hex-colour/brand/expired-key), installable as git pre-commit hook | Manual per-screen audits were slow and inconsistent; first run immediately found 25 real violations across 25 files | Continuing manual `indx-screen-audit` skill-only checks rejected — doesn't scale across 180+ files

**4 Jul 2026 (Session 101)** | SIINDEX canonized as **Chief PQSI Officer** — a Sovereign Marketplace Intelligence Platform across 11 intelligence domains, never a trading bot/price predictor/hype generator; fixed 12-part output format (Executive Summary → Unknowns and Assumptions) | AJ mandate — SIINDEX must never encourage gambling, leverage, pump-and-dump, FOMO, panic selling, manipulation, or unrealistic returns; needed one canonical system prompt (`js/siindex-system.js`) instead of drift across screens | Freeform per-screen prompts rejected — inconsistent tone and compliance risk

**4 Jul 2026 (Session 104)** | 25 hard violations (seed phrase, SIINDEX AI, Sovereign Intelligence) found by audit.sh fixed in a single pass — 54 changes across 22 files | Canonical terms (recovery words, SIINDEX, Synthetic Intelligence) must hold platform-wide before next audit/commit | Piecemeal per-screen fixes rejected — audit.sh enables fix-all-at-once workflow

**8 Jul 2026 (Session 114)** | Two-Phase Launch Architecture for Grand Synchronicity Day: Meteora Alpha Vault citizen pre-allocation (Sep 10–17) → Raydium LaunchLab Virtual-CPMM public curve (Sep 24, 150 SOL threshold, LP burn) | Alpha Vault gives anti-bot/anti-sniper citizen-first allocation at uniform average price; LaunchLab Virtual-CPMM gives smoother price continuity at graduation than quadratic curves; LP burn is the highest-trust credibility signal | Single-phase public launch rejected — no anti-bot protection, no citizen pre-commitment mechanism

**8 Jul 2026 (Session 114)** | Streamflow adopted (planning-only) for team/treasury vesting, 12-month founder cliff | Now baseline expectation at any credible 2026 Solana token launch; strengthens trust signal alongside LP burn | No vesting rejected — would signal low credibility to sophisticated investors

**8 Jul 2026 (Session 114)** | "Build brains before output" — SIINDEX must construct Identity Brain + Opportunity Brain + Content Brain per citizen before generating any content or automation | Faster/cheaper models can execute reliably from a well-built brain; skipping straight to content generation produces generic, low-trust output | Direct content-automation-first approach rejected — no differentiation, no defensible moat (Brain Passport)

**8 Jul 2026 (Session 114)** | Product named "Mission Rooms" (not Sovereign Workspaces, Civilization Hubs, etc.) for the Layer 4 coordination product | Action-based and citizen-friendly naming; distinguishes from generic "workspace" SaaS framing | Sovereign Workspaces / Civilization Hubs rejected — less citizen-friendly, more corporate-sounding

**9 Jul 2026 (Session 115)** | Sovereign Attention Engine doctrine locked — IN$DEX uses the same neurological mechanisms as social media (variable reward, dopamine pre-loading, streaks, social proof) but routes them to real sovereign outcomes, never empty engagement | Family user-testing showed the app felt static and didn't grab attention; AJ: same dopamine loop that built TikTok should build the first sovereign economy for the unbanked | Empty engagement metrics, manufactured urgency, dark patterns, and anxiety-as-retention explicitly forbidden

**9 Jul 2026 (Session 115)** | Session Sovereignty Layer v1.0 locked — passkeys/WebAuthn non-negotiable (defeats AiTM/Evilginx phishing), Device Bound Session Credentials (DBSC) as Phase 2 build item, DPoP-bound Action Intent Tokens (RFC 9700), session compartmentalization by context (Browse/Marketplace/Financial/Identity/Cultural/Governance/Admin), pre-shared caller verification code against AI-voice vishing | 28-section doctrine draft expanded with critical 2025/2026 research gaps (AiTM, MFA push bombing, NIST SP 800-63B-4 session monitoring, PQC readiness) before canonizing | Password-only / SMS-only recovery rejected as primary anchors — phone numbers are not identity anchors (cites FTX SIM-swap, $447M loss)

**9 Jul 2026 (Session 117)** | Six-Archetype Operating Model locked — Prototype / Build / Sweep / Grow / Maintain / Orchestrate — as SIINDEX's standing internal build-process review for all agent/automation work | Citizens declare missions, SIINDEX assembles the sovereign team; needed one canonical routing frame instead of ad hoc agent assignment | Single generic "AI agent" model rejected — no archetype specialization, no build-process discipline

**9 Jul 2026 (Session 117)** | Unknowns Engine doctrine locked as mandatory pre-build discipline — Blind Spot Pass auto-triggers for 11 sensitive mission types, 9-Step Mission Loop (Discover→Plan→Prototype→Interview→Build→Note→Explain→Quiz→Remember), civilization-notes.md required per serious task | Quality of agentic work is bottlenecked by how well unknowns are discovered before/during/after implementation, not just execution speed | Ship-first-ask-later rejected for sensitive mission types (cultural, child, governance, financial, security, legal)

**9 Jul 2026 (Session 117)** | yourname.IN$DEX canonized as the root identity object — all credentials (passkey, biometric, phone, email, KYC) are keys to it, never the other way round; KYC-once via ZK-SNARKs | Phone-number-as-identity model is fragile (SIM swap risk) and excludes the 1.4B unbanked without formal ID; a Web3 domain-first identity serves both | Phone-number-primary identity rejected as root anchor — kept only as one of several verification paths

**9 Jul 2026 (Session 117)** | Sovereign Data Economy doctrine locked — citizens earn INDX per credential access (Sovereign Data Earnings), get a citizen-facing Sovereign Threat Intelligence Feed, and attackers post a slashable Identity Attack Bond (IAB, tiers 1/5/20/50 INDX, 80% slashed to citizen on provable abuse) | Foundation stat: Big Tech earns $831,497 lifetime per US user from data, citizens earn $0 — IN$DEX ends that; positions IN$DEX ahead of Brazil's June 2025 dWallet and the EU's eIDAS 2.0 end-2026 mandate | Protocol-level-only threat monitoring (industry status quo) rejected — first citizen-facing implementation

**10 Jul 2026 (Session 119)** | home-v3.html replaces home-v2.html as the canonical public homepage (index.html repointed) | Top-1% strategic audit found the public site read as three different companies; new build leads with civilization/voice not DeFi/token | Iterating further on home-v2.html rejected — needed a full strategic rebuild, not a patch

**10 Jul 2026 (Session 119)** | "MemeDAO" renamed to "Citizen Assembly / Citizen Governance" platform-wide (~30 screens) | "MemeDAO" undercuts the civilization-first, regulator-ready positioning | Keeping MemeDAO branding rejected — reads as a meme-coin project, not sovereign infrastructure

**10 Jul 2026 (Session 119)** | Price target ($2.50 Grand Synchronicity) removed from public-facing countdown display | ASIC risk — implied investment-return projection; genesis price ($0.24) + "not financial advice" retained instead | Keeping the public target rejected — regulatory exposure under Australian financial services law

**10 Jul 2026 (Session 119)** | "DeFi platform" retired platform-wide (~15 screens) in favour of "Sovereign Digital Civilization" | Consistent with civilization-first repositioning; "DeFi platform" invites securities/financial-product scrutiny | Keeping DeFi framing rejected — audit flagged as compliance and brand risk

**10 Jul 2026 (Session 119)** | AUSTRAC VASP Travel Rule enrollment (deadline 29 Jul 2026) elevated to P0 across the platform | Travel Rule mandatory from 31 Mar 2026; enrollment deadline is the nearest hard regulatory date on the roadmap | Deferring compliance build rejected — legal exposure if unenrolled past deadline

**10 Jul 2026 (Session 119)** | Internal/team screens (team-portal, civ-admin-console, dev-portal, legal-defense) formally split from public citizen screens and PIN-gated | Prevents internal ops/financial detail from being publicly reachable; team-portal is front door to all internal ops | Single unified screen set rejected — no separation between citizen-facing and operator-facing surfaces

**11 Jul 2026 (Session 119)** | SIINDEX Build-Completion Prompt locked: "Do not build an app with SIINDEX inside it. Build SIINDEX with an app around her" | Canonizes SIINDEX as the platform's core intelligence layer, not a bolted-on feature — governs all future build sequencing | App-first, SIINDEX-as-feature approach rejected — inverts the intended architecture

**11 Jul 2026 (Session 119 x31)** | Build-Completion Prompt missing-screen queue closed out — 7 screens shipped (Trust Dashboard, Refusal Constitution, Legacy Vault, 4× Pacific corridor readiness pages) — no screens remain outstanding from the x29 queue | Completes the canonical build brief received in x29; corridor pages needed for AUSTRAC-adjacent Pacific remittance go-to-market | Partial rollout (corridors only, or trust/legal screens only) rejected — brief called for the full set before moving to next phase

**12 Jul 2026 (Session 119 x33)** | AUSTRAC VASP Enrollment step reverted from `state:'done'` to `state:'current'` on all 4 Pacific corridor pages | Actual enrollment not yet confirmed as of 12 Jul 2026; showing a false checkmark to citizens would be misleading ahead of the real 29 Jul 2026 deadline | Leaving `done` unchanged rejected — misrepresents compliance status to citizens

**12 Jul 2026 (Session 119 x33)** | INDX token minted live on Solana mainnet via Smithii Token Creator — 100M supply, 6 decimals, Freeze + Mint authority revoked, Update authority retained for metadata edits — then full supply transferred to the INDX protocol wallet via Smithii Multisender | Genesis mint needed to happen on real infrastructure ahead of Grand Synchronicity Day (24 Sep 2026) LP/LaunchLab work | Keeping Update authority live (vs. also revoking) accepted as a deliberate tradeoff — allows metadata fixes, standard practice pre-LP

**12 Jul 2026 (Session 119 x33 part 4)** | IN$DEX protocol entity to incorporate in the Cook Islands (AJ holds Cook Islands citizenship), with a parallel Australian ABN entity ("Image Nation Decentralised Exchange") handling AUSTRAC-regulated AU operations | Citizenship enables domestic (non-foreign-investor) incorporation; Cook Islands tax structure benefits IN$DEX; Cook Islands International Trust is a best-in-class offshore asset protection vehicle that backs the legacy vault / sovereign wealth layer | Single-jurisdiction (Australia-only) structure rejected — loses tax and trust-structure advantages; foreign-investor Cook Islands registration rejected — AJ's citizenship allows domestic incorporation instead

## Template

```
**[Date]** | [Decision] | [Why] | [Alternatives]
```
