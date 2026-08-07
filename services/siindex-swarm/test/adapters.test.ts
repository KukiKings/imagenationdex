import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import {
  DEVNET_USDC_MINT,
  HeyGenDraftClient,
  PlanningOnlyWallet,
  SOLANA_DEVNET_CAIP2,
  USDC_DEVNET_ADDRESS,
  buildAgentRegistrationPlan,
  filterPrivateTestRequirements,
  prepareSolanaPayRequest,
  type PolicyDecision,
  type X402PaymentRequirement,
} from "../src/index.js";

const allowedDecision: PolicyDecision = {
  status: "allowed",
  actionId: randomUUID(),
  reasons: ["test"],
  requiredApprovals: [],
  evaluatedAt: new Date().toISOString(),
};

const ADDRESS_ONE = "11111111111111111111111111111111";
const ADDRESS_TWO = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

test("Solana Pay adapter produces an unsigned devnet TEST_USDC URI", () => {
  const recipient = ADDRESS_ONE;
  const reference = ADDRESS_TWO;
  const result = prepareSolanaPayRequest({
    recipient,
    reference,
    amount: "10.25",
    label: "IN$DEX private test",
    message: "No real settlement",
    memo: "private-test-receipt-001",
    decision: allowedDecision,
  });
  const uri = new URL(result.uri);
  assert.equal(result.status, "unsigned_private_test_request");
  assert.equal(result.network, "solana-devnet");
  assert.equal(uri.protocol, "solana:");
  assert.equal(uri.searchParams.get("spl-token"), DEVNET_USDC_MINT);
  assert.equal(uri.searchParams.get("amount"), "10.25");
});

test("Solana Pay preparation cannot bypass a policy hold", () => {
  assert.throws(() => prepareSolanaPayRequest({
    recipient: ADDRESS_ONE,
    reference: ADDRESS_TWO,
    amount: "1",
    label: "test",
    message: "test",
    memo: "test",
    decision: { ...allowedDecision, status: "approval_required" },
  }), /policy decision/i);
});

test("the Solana Agent Kit wallet adapter cannot sign", async () => {
  const wallet = new PlanningOnlyWallet(ADDRESS_ONE);
  await assert.rejects(wallet.signTransaction({}), /Signing is disabled/);
});

test("Metaplex plans are devnet-only and externally signed", () => {
  const plan = buildAgentRegistrationPlan({
    wallet: ADDRESS_ONE,
    name: "SIINDEX Payments Agent",
    description: "Prepares bounded private-test payment work.",
    metadataUri: "https://imagenationdex.com/agents/payments.json",
    manifestUri: "https://imagenationdex.com/agents/payments-manifest.json",
    serviceEndpoint: "https://zljgthfzbalsunuoohcd.supabase.co/functions/v1/siindex-swarm-runtime",
  });
  assert.equal(plan.input.network, "solana-devnet");
  assert.equal(plan.signingAuthority, "external_policy_wallet");
  assert.match(plan.input.agentMetadata.supportedTrust.join(" "), /deny-by-default/);
});

test("x402 policy accepts only devnet USDC at or below 0.001", () => {
  const base = {
    scheme: "exact",
    payTo: ADDRESS_ONE,
    maxTimeoutSeconds: 60,
    extra: {},
  };
  const requirements = [
    { ...base, network: SOLANA_DEVNET_CAIP2, asset: USDC_DEVNET_ADDRESS, amount: "1000" },
    { ...base, network: SOLANA_DEVNET_CAIP2, asset: USDC_DEVNET_ADDRESS, amount: "1001" },
    { ...base, network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp", asset: USDC_DEVNET_ADDRESS, amount: "1" },
  ] as X402PaymentRequirement[];
  const accepted = filterPrivateTestRequirements(requirements);
  assert.equal(accepted.length, 1);
  assert.equal(accepted[0]?.amount, "1000");
});

test("HeyGen adapter requires consent and creates a private draft only", async () => {
  let requestBody: Record<string, unknown> | undefined;
  const mockFetch: typeof fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response(JSON.stringify({ data: { video_id: "video-private-001" } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  const client = new HeyGenDraftClient("test-key", "https://api.heygen.test", mockFetch);
  const result = await client.createPrivateDraft({
    avatarId: "avatar-001",
    voiceId: "voice-001",
    script: "Welcome to your private IN$DEX test journey.",
    subjectId: "siindex-subject",
    consent: {
      id: randomUUID(),
      kind: "subject-consent",
      subjectId: "siindex-subject",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    },
  });
  assert.equal(result.status, "queued_private_draft");
  assert.equal(result.publishAuthority, "human_only");
  assert.ok(Array.isArray(requestBody?.video_inputs));
});
