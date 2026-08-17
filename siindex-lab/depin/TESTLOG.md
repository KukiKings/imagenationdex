# DEPIN lab TESTLOG

| Phase | Test | Result | Date | Notes |
|-------|------|--------|------|-------|
| A1 | `node smoke.mjs` policy suite | **PASS** | 2026-08-18 | Includes Solana-only + MoonPay block |
| A2 | mainnet/transfer/mesh-frontend blocked | **PASS** | 2026-08-18 | See smoke.mjs |
| D1 | `@solana/web3.js` in package.json | **PASS** | 2026-08-18 | Solana-native dependency |
| D2 | `node phase-d-balance.mjs` devnet balance read | **PASS** | 2026-08-18 | Ephemeral keypair, 0 SOL, RPC ok |
| D3 | tiny SOL transfer devnet | PENDING | — | Needs AJ + funded lab keypair |
| D4 | mainnet path policy-blocked | **PASS** (policy) | 2026-08-18 | Run `npm run phase-d:mainnet-should-fail` expects throw |
| B | Aethir Claw deploy | PENDING | — | Needs AJ account |
| C | Mesh API completion | PENDING | — | Needs lab key |
| E | io.net job | PENDING | — | Optional |

**Public product:** still Visitor Mode only — Phase D is **lab**, not citizen wallets/payments.

**Rule:** Do not mark spend (D3) or B–E complete until PASS with evidence.
