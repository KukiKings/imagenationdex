# IN$DEX Agent Framework Stack (research-corrected)

**Status:** Lab research map — **not public product**  
**Rule:** Build → test → complete. No autonomous spend without AJ.  
**Date:** 2026-08-18  
**Related:** `HYBRID-ARCHITECTURE.md` · `DEPIN-AGENT-STACK.md` · `siindex-lab/depin/`

---

## Layer map (truthful)

| Layer | Technology | Status in world | IN$DEX today |
|-------|------------|-----------------|--------------|
| Agent runtime | **DeepSeek Harness (dsh)** | Real — MIT, **developer preview** (Aug 13 2026) | Not installed |
| Self-improving harness | **Prime Agent** | Real — MIT (≈Aug 5–6 2026) | Not installed |
| Solana actions | **Solana Agent Kit** | Production toolkit | Lab Phase D pending |
| Agent identity | **Metaplex MPL Agent Registry** | Live on Solana | Not registered |
| Tools | **MCP** | Open standard (AAIF stack) | Partial (ops tools) |
| Agent↔agent | **A2A** | Open standard; joined AAIF Aug 2026 | Not wired |
| Agent wallets | **MoonPay Agents** / OWS (Exodus partner) | Real products | Not product-live |
| Agent payments | **x402** | Real protocol | Not product-live |
| Skills | **Solana Agent Skills** | Real (Apr 2026) | Official skills only in lab |
| Compute | Aethir / io.net / Mesh / Claw | Real | Lab only |
| Public answers | On-device knowledge | — | **Live** |

---

## 1. DeepSeek Harness — verified

- **Formula:** Model + Harness = Agent  
- **License:** MIT  
- **Release:** 2026-08-13 developer preview  
- **Install:** `npx @deepseek-ai/dsh web` → http://127.0.0.1:3080  
- **Requires:** Node.js ^22.19 or ≥24  
- **Reality check:** npm is **0.1.0-rc.*** — **breaking changes expected**. Append-only session logs are useful for governance *when* adopted.  
- **IN$DEX use:** Lab coding/ops agent only — **not** citizen-facing SIINDEX until policy + tests PASS.

## 2. Prime Agent — verified with caveat

- **Release:** ≈2026-08-05/06, MIT, Prime Intellect  
- **Install:** `curl -fsSL https://app.primeintellect.ai/prime-agent/install.sh | sh`  
- **RLM + Continual Harness + `/refine`:** real architecture claims  
- **ARC-AGI-3 95.5% with Opus 5:** reported by vendor; treat as **vendor benchmark**, not automatic proof SIINDEX should self-modify Canon  
- **IN$DEX use:** Optional research harness **behind** fixed system refusals. **Never** let `/refine` rewrite public knowledge or legal claims without AJ review.

## 3. Solana Agent Kit — verified

- 60+ actions, plugins, multi-AI adapters  
- **IN$DEX:** Phase D under `siindex-lab/depin/policy.mjs` — **devnet first**

## 4. MCP + A2A — verified

- **MCP:** agent↔tools  
- **A2A:** agent↔agent; v1.0 2026; moved toward **AAIF** (Aug 2026) alongside MCP  
- **IN$DEX:** Align subagent cards with A2A later; keep M2M runner as interim coordination

## 5. Wallets & payments — corrected

| Claim in brief | Correction |
|----------------|------------|
| “Exodus AgentKit one API call” | Prefer **MoonPay Agents** / CLI / PayBox narrative; Exodus is a **partner** on agent spend rails, not the sole “AgentKit” brand |
| “x402 acquired BVNK for $1.8B” | **False.** **Mastercard** acquired **BVNK** (~$1.8B). x402 is a **protocol**, not the acquirer |
| “200M tx / $50B volume” | Marketing-scale figures — **verify** before any public IN$DEX claim |
| Autonomous agent spend | **Blocked** by lab policy until `ajAuthorized=true` |

## 6. Compute — unchanged from DEPIN doc

Aethir / Claw / Mesh / io.net remain **lab**. Public SIINDEX does not run on Mesh today.

---

## Recommended stack for IN$DEX (not “install everything”)

```
Citizen-facing (LIVE)
  on-device knowledge + speak-core + Interview/FAQ/Jarvis

Lab orchestration (next builds)
  policy.mjs gates
  → optional dsh OR Prime Agent (offline/lab machines only)
  → Solana Agent Kit (devnet)
  → Mesh API key in secrets (not browser)
  → Claw instance (AJ account)

Future settlement (AJ)
  Metaplex agent identity (devnet → mainnet)
  x402 with spend caps
  MoonPay Agents only if non-custodial + human limits
```

**Do not** make DeepSeek Harness or Prime Agent the public SIINDEX runtime until:

1. Session logs export to governance audit path  
2. Refusals cannot be refined away  
3. Smoke tests pass  
4. AJ authorizes

---

## Build order (tested units)

| Unit | Test | Status |
|------|------|--------|
| DEPIN Phase A policy | `node siindex-lab/depin/smoke.mjs` | **PASS** |
| Hybrid architecture doc | Exists | **PASS** |
| This framework map | Exists | **PASS** |
| Phase D Agent Kit scaffold | Install + policy-wrapped balance read | Pending |
| Optional dsh lab | `npx` boots UI, no keys in git | Pending (local) |
| Claw / Mesh | Instance + completion | Pending AJ |
| A2A subagent cards | Card validate | Later |
| x402 / wallets | Devnet pay + human approve | Later |

---

*SIINDEX — SI not AI · frameworks are tools · Canon is not auto-refined*
