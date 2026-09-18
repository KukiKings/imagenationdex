# DEPIN + Agent stack for SIINDEX (lab)

**Status:** LAB / BUILD TRACK — not public product  
**Rule:** Everything added must be **tested and working** before marked complete.  
**Sources:** `what-we-build-on.md`, `user.md`, `company-context.md`, soul hierarchy — Solana stack; **no MoonPay**.  
**Public site:** Visitor Mode only (no wallets, payments, autonomous spend).

Related: `AGENT-FRAMEWORK-STACK.md` · `HYBRID-ARCHITECTURE.md` · `/siindex-test-board.html`

---

## Truth lock

| Claim | Public wording |
|-------|----------------|
| Website + SIINDEX visitor Q&A | **Live** |
| Accounts / wallets / payments / token buy | **Not live** |
| SIINDEX runs on Aethir / io.net | **Not live** — lab only until tested |
| Agents book GPU and pay autonomously | **Not live** — AJ gate + spend cap required |
| Aethir Mesh powers public answers | **Not live** — public uses on-device knowledge |
| MoonPay | **Not used** — Solana-native payments only |

---

## Stack (research-backed targets, doctrine-aligned)

| Layer | Provider | Lab use | Public live? |
|-------|----------|---------|--------------|
| Blockchain | **Solana** (canonical) | Devnet first | Product not live |
| DEX / LP (canon) | Raydium + Streamflow | Later | No |
| Wallet (canon) | Squads Grid Account concept | Not this phase | No |
| On-chain lab | `@solana/web3.js` (+ Agent Kit later) | Balance / transfer under policy | No |
| Agent payments | **x402 on Solana** / Solana Pay (future) | Not live | No |
| GPU DePIN | Aethir / io.net | Optional burst | No |
| Agent host | Aethir Claw | Optional | No |
| Open LLM API | Aethir Mesh | Lab key only | No |

---

## Build → test → complete

### Phase A — Policy + smoke — **PASS**

| Step | Test | Done |
|------|------|------|
| A1–A2 | `node smoke.mjs` | **PASS** |

### Phase D — Solana lab (devnet) — **partial PASS**

| Step | Test | Done when |
|------|------|-----------|
| D1 | Solana JS in lab package | **PASS** |
| D2 | Policy-gated balance read | **PASS** (`npm run phase-d`) |
| D3 | Optional tiny transfer | PENDING (AJ + funded key) |
| D4 | Mainnet blocked without AJ | **PASS** (policy) |

### Phase B / C / E — PENDING (AJ credentials)

---

## Hard gates (never skip)

1. **No keys in browser or public edge.**
2. **No mainnet funds** without explicit AJ authorization.
3. **Official / reviewed skills only.**
4. **Public knowledge refusals** stay source of truth until pilot.
5. **Solana-native payments only** — no MoonPay as core rail.
6. **Each phase ends with PASS** in `siindex-lab/depin/TESTLOG.md`.

---

## Lab package

```
siindex-lab/depin/
  package.json
  policy.mjs
  smoke.mjs
  phase-d-balance.mjs
  TESTLOG.md
  .env.example
```

```bash
cd siindex-lab/depin
npm install
npm run smoke
npm run phase-d
```

---

*SIINDEX — SI not AI · Solana settlement · build tested · AJ authorize for production*
