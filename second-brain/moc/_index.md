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

### Screens — In Progress / Pending
- God Mode queue (Session 65h): citizen-profile.html, live-stream.html, creator-onboarding.html — not yet started

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
- memory.md ✅ (sessions 1–79 logged)
- business-plan-v12.5-SEALED.md ✅
- user.md ✅
- soul.md ✅
- identity.md ✅
- second-brain/siindex-identity/siindex-official-bio.md ✅ (new — Session 79)

---

## moc-brand-rules

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
