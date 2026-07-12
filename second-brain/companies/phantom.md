# Phantom

**Type:** Solana wallet browser extension (`window.phantom.solana` / `window.solana`)
**Relevance to IN$DEX:** Dual role — (1) listed as a competitor in companies/_index.md (wallet-only, no P2P commerce, KYC friction); (2) as of Session 100, one of four wallets detected/supported by `js/indx-wallet.js` adapter (`connect`, `disconnect`, `signMessage`, `signAndSendTransaction`, `getSOLBalance`, `getINDXBalance`).
**Status:** Live integration target — pre-TGE balance reads from sessionStorage, post-TGE (after 2026-09-24) queries Solana RPC directly.
