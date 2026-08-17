# IN$DEX Agent Framework Stack (research-corrected)

**Status:** Lab research map — **not public product**  
**Rule:** Build → test → complete. No autonomous spend without AJ.  
**Payments policy:** **Solana-native only.** MoonPay is **out** — too centralized for IN$DEX sovereignty.  
**Date:** 2026-08-18  
**Related:** `HYBRID-ARCHITECTURE.md` · `DEPIN-AGENT-STACK.md` · `siindex-lab/depin/`

---

## Layer map (truthful)

| Layer | Technology | Status in world | IN$DEX today |
|-------|------------|-----------------|--------------|
| Agent runtime | **DeepSeek Harness (dsh)** | Real — MIT, developer preview | Not installed |
| Self-improving harness | **Prime Agent** | Real — MIT | Not installed |
| Solana actions | **Solana Agent Kit** | Production toolkit | Lab Phase D pending |
| Agent identity | **Metaplex MPL Agent Registry** | Live on Solana | Not registered |
| Tools | **MCP** | Open standard | Partial |
| Agent↔agent | **A2A** | Open standard (AAIF) | Not wired |
| Agent wallets | **Solana Wallet Standard / keypair** | Ecosystem standard | Not product-live |
| Agent payments | **x402 on Solana** | Open protocol | Not product-live |
| Citizen payments | **Solana Pay** | Solana standard | Not product-live |
| Skills | **Solana Agent Skills** | Real | Official only in lab |
| Compute | Aethir / io.net / Mesh / Claw | Real | Lab only |
| Public answers | On-device knowledge | — | **Live** |

**Rejected path:** MoonPay Agents, PayBox, MoonPay CLI as payment or wallet rail — centralized intermediary; not aligned with Pacific sovereign settlement.

---

## Payments doctrine (locked)

Everything money-touching for IN$DEX settles on **Solana**:

| Use | Rail |
|-----|------|
| Citizen / merchant checkout | **Solana Pay** |
| Agent↔API micropay | **x402 (SVM / Solana)** |
| Transfers, swaps, on-chain ops | **Solana Agent Kit** (policy-gated) |
| Agent identity | **Metaplex Agent Registry** |
| Wallets | Solana keypair / Wallet Standard — **no MoonPay** |

Autonomous spend stays **blocked** until `ajAuthorized=true` in lab policy.

---

## Framework notes (lab only)

**DeepSeek Harness** — MIT preview; `npx @deepseek-ai/dsh web`; not public SIINDEX.  
**Prime Agent** — optional research harness; `/refine` must never rewrite public refusals without AJ.  
**Solana Agent Kit** — Phase D under `siindex-lab/depin/policy.mjs`, **devnet first**.  
**MCP + A2A** — tool and agent coordination standards; wire later.

---

## Recommended stack

```
Citizen-facing (LIVE)
  on-device knowledge + speak-core + Interview/FAQ/Jarvis

Lab
  policy.mjs → Solana Agent Kit (devnet) → optional dsh/Prime
  Mesh/Claw secrets only — not browser

Settlement (AJ) — SOLANA ONLY
  Metaplex identity · x402 · Solana Pay · Solana wallets
  NO MoonPay
```

---

## Build order

| Unit | Status |
|------|--------|
| DEPIN Phase A policy | **PASS** |
| Hybrid + this map | **PASS** |
| Phase D Agent Kit (devnet) | Pending |
| Solana Pay + x402 (no MoonPay) | Later, AJ gate |

*SIINDEX — SI not AI · Solana payments · decentralized settlement*
