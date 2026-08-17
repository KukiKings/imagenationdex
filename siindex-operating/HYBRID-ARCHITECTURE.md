# IN$DEX Hybrid Architecture (research-corrected)

**Status:** Architecture target — **not fully live**  
**Rule:** Build → test → complete. Public site stays Visitor Mode until each layer passes tests.  
**Date:** 2026-08-18  
**Related:** `DEPIN-AGENT-STACK.md` · `RESEARCH-solana-agent-stack-2026.md` · `/status.json`

---

## Recommended model: Hybrid

```
IN$DEX Architecture — Hybrid (target)
│
├── Sovereign Core (IN$DEX-controlled)
│   ├── Citizen / visitor data (Supabase — existing path)
│   ├── Governance records (Vault — planned)
│   ├── Treasury ops (multi-sig — planned, AJ gate)
│   └── Identity (DID issuer — planned, not live)
│
├── Compute (split by sensitivity)
│   ├── Lab / burst: Aethir Mesh + Aethir Claw + io.net
│   ├── Optional on-prem starter: Mac Mini M4 Pro 48GB+ and/or RTX 5090
│   └── Public answers today: on-device knowledge (no Mesh in browser)
│
└── Solana settlement (devnet first)
    ├── Agent identity: Metaplex MPL Agent Registry
    ├── Agent payments: x402 (HTTP 402)
    ├── Citizen payments: Solana Pay (not live)
    └── Assets: SOL / USDC (+ ATH / $IO only if treasury policy allows)
```

**Why hybrid wins for IN$DEX**

| Approach | Sovereignty | Upfront | Effort | Fit |
|----------|-------------|---------|--------|-----|
| Full self-host | Max | High | High | Long-term core only |
| All decentralized | Medium | Low | Low | Burst / agents |
| **Hybrid** | **High** | **Medium** | **Medium** | **Recommended** |

You do **not** need 435k GPUs. Own the critical core; rent burst compute.

---

## Fact corrections vs marketing brief

| Brief claim | Corrected |
|-------------|-----------|
| Mac Mini M4 **8GB** for SIINDEX | **Too small.** Prefer **M4 Pro 48GB** (or 32GB+). Base M4 16–24GB is OK for small models only (≈9B–27B class). |
| RTX 5090 runs DeepSeek V4 at **12.8M tokens/min** | **Not credible for one card.** 5090 = 32GB VRAM; realistic single-stream ≈ tens–hundreds **tok/s** on models that fit. Full DeepSeek V4-class MoE needs **multi-GPU / Mesh**. |
| Starter kit ~$6–8k | **Plausible band** if M4 Pro + one 5090 + power; street 5090 ≈ $2k MSRP class, Mac Mini AI-useful configs often **$1.6k–$2k+**. |
| Aethir / Mesh / Claw / io.net | **Real products** — lab only until Phase B–E tests PASS |
| Metaplex Agent Registry | **Live protocol** on Solana — IN$DEX registration **not done** |
| x402 agent payments | **Real protocol** — IN$DEX integration **not live** |
| SIINDEX inference on Mesh today | **False** — public uses `siindex-public-knowledge.js` |

---

## Layer detail

### 1. Sovereign Core (own this)

| Component | Today | Target |
|-----------|-------|--------|
| Visitor / feedback DB | Supabase path exists | Harden RLS, fact_id later |
| Public knowledge | On-device JS | Keep as citizen source of truth until pilot |
| Governance vault | Not product-live | Document + multi-sig design |
| DID / residency | Not live | Partner + legal before claims |

**Test bar:** data never leaves controlled systems without policy; no invented licences.

### 2. Compute (rent + optional own)

| Workload | Preferred path | Why |
|----------|----------------|-----|
| Public Q&A | On-device knowledge | Offline-capable, honest, no key leak |
| Lab SI reasoning | Aethir Mesh API | Open models on Aethir GPUs, no browser keys |
| Agent host | Aethir Claw (SG region) | Isolated VPS, low ops |
| Burst / Foundry GPU | io.net or Aethir | Cost vs AWS; Solana-native option |
| Air-gapped experiments | On-prem M4 Pro / 5090 | Data never leaves office |

**On-prem starter (corrected)**

| Component | Spec | Notes |
|-----------|------|-------|
| Always-on node | Mac Mini **M4 Pro 48GB** | Quiet, efficient, 14B–35B MoE class |
| CUDA workstation | **1× RTX 5090 32GB** | 70B Q4-class; not full V4 alone |
| Power | Size for 575W card + PSU headroom | Ops cost real |
| Cloud fallback | Mesh / Claw | When on-prem saturates |

### 3. Solana settlement (devnet → AJ mainnet)

| Component | Protocol | Gate |
|-----------|----------|------|
| Agent identity | Metaplex MPL Agent Registry | Devnet register first |
| Agent↔API pay | x402 (HTTP 402) | Spend caps + AJ |
| Citizen pay | Solana Pay | **Not live** product |
| Kit | Solana Agent Kit | Policy in `siindex-lab/depin` |

---

## What is live vs not (2026-08-18)

| Surface | Live? |
|---------|-------|
| Website + SIINDEX Visitor Mode | **Yes** |
| Interview / FAQ / Present / Jarvis UI | **Yes** |
| Hybrid Mesh inference for citizens | **No** |
| Agent Registry identity for SIINDEX | **No** |
| x402 / Solana Pay product | **No** |
| On-prem GPU core | **No** (optional purchase) |
| DEPIN lab Phase A policy smoke | **Yes** (`siindex-lab/depin`) |

---

## Build order (tested units only)

1. **Keep public stack green** (test board)  
2. **DEPIN Phase A** — policy smoke PASS (done)  
3. **Phase B/C** — Claw + Mesh lab (AJ credentials)  
4. **Phase D** — Agent Kit devnet under policy  
5. **Optional** — on-prem M4 Pro / 5090 only if air-gap requirement is real  
6. **Metaplex + x402** — after D, still AJ gate  
7. **Never** claim hybrid compute on marketing pages until tests PASS

---

## Conclusion

Hybrid is the right strategic answer for IN$DEX: **sovereign core + decentralized burst + Solana settlement**.  
Correct the hardware fantasy numbers. Start small. Test each layer. Scale with the network — without owning 435,000 GPUs.

*SIINDEX — SI not AI · truth as you build*
