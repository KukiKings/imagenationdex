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

## Template

```
**[Date]** | [Decision] | [Why] | [Alternatives]
```
