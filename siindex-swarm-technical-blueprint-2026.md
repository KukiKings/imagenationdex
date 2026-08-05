# SIINDEX Swarm and Digital Twin Technical Blueprint

**Status:** canonical private-test architecture  
**Updated:** 5 August 2026  
**Rule:** SIINDEX is Synthetic Intelligence. No agent owns keys or silently expands its authority.

## Founder direction preserved

The digital twin, agent swarm, Solana Pay, Metaplex Agent Registry and x402 are committed product scope. They are being built for private testing now.

The proposed statement that the swarm needs no approval is not adopted. Routine reversible preparation can be automatic. Identity issuance, likeness use, payment signing, public publication, governance execution and mainnet activation require evidence-backed policy gates. This is consistent with the permanent safeguard that no agent owns keys, wallets or citizen assets.

## Correct system boundary

Solana is the settlement and public attestation layer. It is not the entire application.

| Layer | Canonical responsibility |
|---|---|
| Supabase Auth and Postgres | OTP, citizen accounts, consent, policies, approvals, private records and receipts |
| SIINDEX control plane | Event routing, manifests, idempotency, timeouts, recovery and evidence |
| Solana Agent Kit | Approved Solana action preparation through selected plugins |
| External policy wallet | Signing, value limits, multisignature and revocation. Never model-owned |
| Solana Pay | Citizen and merchant payment requests |
| Metaplex Agent Registry | Optional devnet agent identity and delegation attestations |
| x402 v2 | Policy-bound HTTP micropayment challenges and settlement |
| HeyGen | Consent-bound SIINDEX digital-twin video generation |
| Sovereign storage | Citizen data, private media, evidence and retention controls |

HeyGen, authenticated accounts, HTTP services, policy engines and private data do not run on Solana. The correct doctrine is: **Solana settlement and attestation, sovereign off-chain services for everything that must remain private, consented or operational.**

## Canonical swarm

| Agent | Role | Automatic scope | Held scope |
|---|---|---|---|
| SIINDEX | Orchestrator | Route, pause, resume, status | Cannot sign or self-expand |
| Citizen | Onboarding and identity | Prepare and verify | Identity issuance requires citizen consent |
| Payments | Requests and receipts | Prepare and verify | x402 execution requires payment approval; mainnet disabled |
| Membership | Tiers and renewal | Prepare and evaluate | Billing execution held |
| Media | Digital twin drafts | Prepare profile | Render requires subject consent; publication requires approval |
| Scheduling | Availability and bookings | Read and prepare | External booking confirmation held |
| Fulfilment | Orders and delivery | Prepare and hold disputes | Real delivery changes held |
| Marketing | Campaigns and content | Prepare | Distribution requires publication approval |
| Analytics | Metrics and proposal analysis | Read and prepare | No financial or governance execution |
| Reputation | Evidence and trust | Read and prepare | Consequential score changes remain reviewable |

Permanent prohibitions include unattended signing, key export, autonomous trading, lending, borrowing, bridging, airdrops, token launches, treasury rebalancing and automatic governance voting.

## Implemented in the current private-test checkpoint

- Ten versioned capability manifests.
- Deny-by-default policy engine.
- Sandbox and Solana devnet network boundary.
- Zero mainnet authority.
- 0.001 TEST_USDC x402 limit per call.
- Isolated x402 v2 gateway compiled against its compatible Solana Kit major.
- Supply-chain-isolated Solana Agent Kit boundary with a planning wallet that throws on every signing method.
- Solana Pay unsigned TEST_USDC request builder.
- Metaplex Agent Registry unsigned devnet registration plan.
- HeyGen private draft client with subject-consent enforcement and no publish method.
- Event routing for citizen signup, governance proposals, payments, fulfilment, renewals and welcome media.
- Idempotency keys and hash-linked receipts.
- Supabase schema for runs, tasks, approvals, media consent and append-only evidence.
- Authenticated Supabase Edge Function for route, approve and status operations.
- Private command-centre page for authenticated testing.
- Automated TypeScript compilation and behavioural tests.

## External activation gates

The following cannot be truthfully marked complete from source code alone:

1. Apply the new Supabase migrations and deploy the private swarm function.
2. Set `SIINDEX_SWARM_PRIVATE_PREVIEW_ENABLED=true` only in the private environment.
3. Record SIINDEX's real-person HeyGen consent media and create the avatar profile.
4. Configure HeyGen avatar and voice identifiers in secret storage.
5. Establish the external devnet policy wallet or multisignature signer.
6. Register agents on Metaplex devnet after chain-registration approval.
7. Fund test accounts with devnet assets only and run Solana Pay receipt verification.
8. Connect an x402 v2 devnet seller and facilitator, then test the 0.001 TEST_USDC ceiling and duplicate-settlement protection.
9. Complete privacy, security, accessibility, performance and physical-device acceptance.
10. Obtain a separate founder decision before any mainnet, real-money or public media activation.

Current dependency gate: Solana Agent Kit 2.0.10 is excluded from the production package because its transitive dependency audit reported 16 advisories, including five high-severity findings. Its constructor may be injected only from a separately audited runtime after those risks are cleared or contained.

x402 2.21.0 is isolated in its own gateway because its Solana Kit 5.x plugin peers conflict with Solana Pay 1.0.26's Solana Kit 6.x peers. Both production dependency graphs now audit at zero known vulnerabilities.

## Source verification notes

- HeyGen Avatar V documents a persistent digital identity from a 15-second video, but its real-person consent process remains mandatory. Live conversational avatars use a separate LiveAvatar workflow and should not be confused with Avatar V video generation.
- Solana Agent Kit v2 uses a core plus plugin architecture. Installing the core does not safely grant every advertised action.
- Metaplex Agent Registry is a real early-stage SDK. The current integration targets devnet and prepares an unsigned transaction.
- Solana Pay supports transfer and transaction request URLs. Performance and fee claims must be measured in the target corridor rather than promised as constants.
- x402 v2 supports Solana, but real settlement requires a signer, facilitator and spend policy. Mainnet readiness must be tested independently.

## Test sequence

1. Compile and unit-test the local control plane.
2. Apply the schema to a private Supabase branch.
3. Verify one authenticated route and its receipt chain.
4. Verify approval expiry and revocation.
5. Create the HeyGen profile with real consent.
6. Render one private welcome draft and confirm it cannot publish.
7. Register one Metaplex devnet agent with an external signer.
8. Generate one Solana Pay devnet TEST_USDC request and verify its reference.
9. Complete one policy-approved x402 devnet call at or below 0.001 TEST_USDC.
10. Exercise emergency pause, duplicate request and stale approval recovery.

No stage is promoted to production merely because the code exists.
