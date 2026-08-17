# DEPIN lab TESTLOG

| Phase | Test | Result | Date | Notes |
|-------|------|--------|------|-------|
| A1 | `node smoke.mjs` policy suite | **PASS** | 2026-08-18 | Solana-only + MoonPay block |
| A2 | mainnet/transfer/mesh blocked | **PASS** | 2026-08-18 | |
| D1 | `@solana/web3.js` dependency | **PASS** | 2026-08-18 | |
| D2 | `npm run phase-d` balance | **PASS** | 2026-08-18 | Devnet RPC |
| D3 | `npm run phase-d3` transfer | **PENDING** | 2026-08-18 | Scaffold live; needs AJ + funded `LAB_SECRET_KEY` |
| D3-block | `npm run phase-d3:blocked` | **PASS** (expect exit 2) | 2026-08-18 | Policy denies without AJ |
| D4 | mainnet without AJ | **PASS** | 2026-08-18 | |
| B/C/E | Claw / Mesh / io.net | PENDING | — | Credentials |

**Public product:** Visitor Mode only.
