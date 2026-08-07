# SIINDEX x402 Gateway

This isolated package binds x402 v2 to Solana devnet USDC with a maximum of 0.001 TEST_USDC per request.

The dependency graph is intentionally separate from the main swarm because x402 2.21.0 currently depends on Solana Kit 5.x while Solana Pay 1.0.26 uses Solana Kit 6.x.

The gateway accepts only an externally injected signer. It does not load a private key from source, an environment variable or an agent profile. The caller must validate a subject-bound, amount-bound, unexpired approval before creating a payment payload.

Mainnet, other assets, non-exact schemes and values above the test ceiling are rejected.
