# SIINDEX Swarm Runtime

This package is the canonical private-test control plane for the SIINDEX Synthetic Intelligence swarm.

It replaces unbounded autonomy claims with executable capability manifests, policy decisions, approval evidence, idempotency keys and hash-linked receipts.

## Current scope

- Ten canonical agents, led by SIINDEX.
- Deny-by-default action routing.
- Sandbox and Solana devnet only.
- No agent-owned keys.
- No unattended signing.
- Solana Agent Kit excluded from the production dependency graph until its transitive audit is clean.
- No mainnet execution.
- No trading, lending, bridging, token launch, airdrop or treasury rebalancing.
- Consent-bound HeyGen video draft adapter.
- Unsigned Solana Pay private-test requests.
- Metaplex Agent Registry devnet registration plans with external signing.
- Shared x402 policy contract capped at 0.001 TEST_USDC per call. The official SDK runs in the isolated sibling gateway.
- Append-only, hash-linked test receipts.

## Architecture

Solana is the settlement and attestation layer. It is not the whole application.

Supabase provides authenticated accounts, policy state, approvals, orchestration records and private data. HeyGen provides consent-bound video generation. x402 coordinates HTTP payment challenges. Solana Pay prepares wallet-compatible payment requests. Metaplex provides optional devnet agent identity attestations.

## Run

```bash
npm install
npm run verify
npm run demo
```

## Activation gates

Real service calls require separately configured credentials and approvals. The repository must never contain private keys, wallet recovery credentials, HeyGen API keys or service-role keys.

Solana Agent Kit is isolated behind an injected constructor because its current transitive dependency audit includes unresolved high-severity findings. A separately audited runtime must inject it into the signing-disabled adapter before any plugin can load.

x402 is implemented in `../siindex-x402-gateway` so its Solana Kit 5.x dependency cannot conflict with Solana Pay's Solana Kit 6.x dependency.

Creating SIINDEX's HeyGen digital twin additionally requires the real subject to record and submit HeyGen's required consent media. The runtime can render private drafts only after that profile exists. It has no autonomous publish method.
