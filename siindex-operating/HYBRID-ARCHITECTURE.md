# IN$DEX Hybrid Architecture (research-corrected)

**Status:** Architecture target — **not fully live**  
**Rule:** Build → test → complete. Public site stays Visitor Mode until each layer passes tests.  
**Payments:** **Solana only.** MoonPay and similar centralized payment SDKs are **not** in the stack.  
**Date:** 2026-08-18  
**Related:** `DEPIN-AGENT-STACK.md` · `AGENT-FRAMEWORK-STACK.md` · `/status.json`

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
│   ├── Optional on-prem: Mac Mini M4 Pro 48GB+ and/or RTX 5090
│   └── Public answers today: on-device knowledge (no Mesh in browser)
│
└── Solana settlement (devnet first) — NO MOONPAY
    ├── Agent identity: Metaplex MPL Agent Registry
    ├── Agent payments: x402 on Solana (HTTP 402)
    ├── Citizen payments: Solana Pay
    ├── Wallets: Solana Wallet Standard / keypair
    └── Assets: SOL / USDC (+ ATH / $IO only if treasury policy allows)
```

**Why hybrid:** Own critical data and identity; rent burst GPUs; settle money on **Solana** — not through a centralized payments company.

---

## Payments doctrine

| In | Out |
|----|-----|
| Solana Pay | MoonPay (Agents, PayBox, CLI as rail) |
| x402 on Solana | Other centralized on-ramp SDKs as core path |
| Solana Agent Kit transfers/swaps | Custodial “agent wallet” products that hold keys for you |
| Metaplex agent identity | — |

MoonPay is **too centralized** for IN$DEX’s sovereign / Pacific citizen design. Settlement stays on-chain Solana under AJ gates.

---

## Layer detail (summary)

1. **Sovereign core** — Supabase visitor path exists; vault/DID planned.  
2. **Compute** — public = on-device knowledge; lab = Mesh/Claw/io.net; optional on-prem M4 Pro / 5090.  
3. **Solana settlement** — Metaplex + x402 + Solana Pay + Agent Kit; **devnet → AJ mainnet**.

Hardware fantasy numbers (M4 8GB, “12.8M tok/min on one 5090”) remain **rejected** — see prior research.

---

## Live vs not (2026-08-18)

| Surface | Live? |
|---------|-------|
| Website + SIINDEX Visitor Mode | **Yes** |
| Solana Pay / x402 product | **No** |
| MoonPay integration | **No — and not planned** |
| DEPIN Phase A policy smoke | **Yes** |

---

## Build order

1. Public test board green  
2. DEPIN Phase A — PASS  
3. Phase D — Solana Agent Kit devnet  
4. Metaplex + x402 + Solana Pay (AJ)  
5. Never claim payments live until tests PASS  

*SIINDEX — SI not AI · Solana settlement · no centralized payment rail*
