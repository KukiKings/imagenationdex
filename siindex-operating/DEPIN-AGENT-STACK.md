# DEPIN + Agent stack for SIINDEX (lab)

**Status:** LAB / BUILD TRACK — not public product  
**Rule:** Everything added must be **tested and working** before marked complete.  
**Public site:** Visitor Mode only (no wallets, payments, autonomous spend).

Related: `RESEARCH-solana-agent-stack-2026.md` · live board: `/siindex-test-board.html`

---

## Truth lock

| Claim | Public wording |
|-------|----------------|
| Website + SIINDEX visitor Q&A | **Live** |
| Accounts / wallets / payments / token buy | **Not live** |
| SIINDEX runs on Aethir / io.net | **Not live** — lab only until tested |
| Agents book GPU and pay autonomously | **Not live** — AJ gate + spend cap required |
| Aethir Mesh powers public answers | **Not live** — public uses on-device knowledge |

---

## Stack (research-backed targets)

| Layer | Provider | Lab use | Public live? |
|-------|----------|---------|--------------|
| GPU DePIN | Aethir (containers / Earth) | Heavy jobs, agent host | No |
| GPU DePIN | io.net (Solana) | Cost-sensitive clusters | No |
| Agent host | Aethir Claw (OpenClaw VPS) | Isolated agent instance | No |
| Open LLM API | Aethir Mesh | Lab inference only | No |
| On-chain actions | Solana Agent Kit + plugins | **Devnet first** | No |
| Skills | Solana Agent Skills (official) | Security / errors first | No |

Primary docs:

- Claw: https://docs.aethir.com/aethir-claw · https://claw.aethir.com
- Mesh: https://docs.aethir.com/aethir-mesh · https://mesh.aethir.com
- Agent Kit: `npm install solana-agent-kit` · docs.sendai.fun
- io.net: https://io.net

---

## Build → test → complete

### Phase A — Policy + smoke (this repo) — **MUST PASS FIRST**

| Step | Test | Done |
|------|------|------|
| A1 | `siindex-lab/depin` smoke runs without secrets | See package scripts |
| A2 | Policy module blocks mainnet + unapproved spend | Unit assertions |
| A3 | This file + research file linked from operating README | Docs present |

### Phase B — Aethir Claw (AJ account required)

| Step | Test | Done when |
|------|------|-----------|
| B1 | Create Claw account | Login works |
| B2 | Deploy Lite (prefer Singapore region) | Instance reachable |
| B3 | OpenClaw responds to a safe prompt | Reply received |
| B4 | No private keys stored in agent memory | Checklist signed |

### Phase C — Mesh (lab key only)

| Step | Test | Done when |
|------|------|-----------|
| C1 | Mesh API key in secrets manager only | Key never in git |
| C2 | Chat completion to one open model | HTTP 200 + text |
| C3 | System prompt includes SIINDEX refusals | No invent licences / live wallets |

### Phase D — Solana Agent Kit (devnet)

| Step | Test | Done when |
|------|------|-----------|
| D1 | Install kit in lab package | `npm install` succeeds |
| D2 | Keypair wallet **devnet only** | Balance read works |
| D3 | Optional tiny SOL transfer devnet | Signature confirmed |
| D4 | Mainnet path remains policy-blocked | Smoke fails if CLUSTER=mainnet without AJ flag |

### Phase E — io.net (optional, later)

| Step | Test | Done when |
|------|------|-----------|
| E1 | Account + cluster quote | Price visible |
| E2 | Short job completes | Logs saved |
| E3 | No public claim of citizen GPU income | Marketing check |

---

## Hard gates (never skip)

1. **No keys in browser or public edge.**
2. **No mainnet funds** without explicit AJ authorization file.
3. **Official / reviewed skills only** — no random skill installs (supply-chain risk).
4. **Public knowledge refusals stay source of truth** for citizens/media until pilot.
5. **Each phase ends with a written PASS** in `siindex-lab/depin/TESTLOG.md`.

---

## Lab package

```
siindex-lab/depin/
  package.json
  policy.mjs          # cluster + spend gates
  smoke.mjs           # runnable without secrets
  TESTLOG.md          # PASS/FAIL record
  .env.example        # never commit .env
```

Run:

```bash
cd siindex-lab/depin && node smoke.mjs
```

Expected: exit 0, all policy assertions PASS.

---

## Not in this track

- Changing public Home / Interview / FAQ answers to claim DePIN live
- Autonomous GPU booking on mainnet
- Putting Mesh behind visitor chat without AJ + legal

---

*SIINDEX — SI not AI · build tested · AJ authorize for production*
