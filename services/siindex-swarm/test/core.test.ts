import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import {
  AGENT_IDS,
  CAPABILITY_MANIFESTS,
  ReceiptStore,
  SiindexOrchestrator,
  evaluateAction,
  type ActionRequest,
  type ApprovalEvidence,
} from "../src/index.js";

function action(overrides: Partial<ActionRequest> = {}): ActionRequest {
  return {
    id: randomUUID(),
    runId: randomUUID(),
    agentId: "payments",
    capability: "payments.x402.prepare",
    mode: "prepare",
    network: "sandbox",
    requestedBy: "citizen-1",
    subjectId: "citizen-1",
    idempotencyKey: randomUUID(),
    ...overrides,
  };
}

function approval(kind: ApprovalEvidence["kind"], subjectId = "citizen-1"): ApprovalEvidence {
  return {
    id: randomUUID(),
    kind,
    subjectId,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
}

test("the canonical swarm has ten agents and no agent owns keys", () => {
  assert.equal(AGENT_IDS.length, 10);
  assert.deepEqual(Object.keys(CAPABILITY_MANIFESTS).sort(), [...AGENT_IDS].sort());
  for (const manifest of Object.values(CAPABILITY_MANIFESTS)) {
    assert.equal(manifest.ownsKeys, false);
    assert.equal(manifest.networks.includes("solana-mainnet"), false);
  }
});

test("unlisted and permanently prohibited capabilities are denied", () => {
  const unlisted = evaluateAction(action({ capability: "payments.bank.withdraw" }));
  assert.equal(unlisted.status, "denied");

  const trade = evaluateAction(action({ capability: "solana.trade", mode: "execute" }));
  assert.equal(trade.status, "denied");
  assert.match(trade.reasons.join(" "), /prohibited/i);
});

test("mainnet execution is denied", () => {
  const decision = evaluateAction(action({ network: "solana-mainnet", mode: "execute" }));
  assert.equal(decision.status, "denied");
});

test("a digital-twin draft waits for matching subject consent", () => {
  const pending = evaluateAction(action({
    agentId: "media",
    capability: "media.video.render.draft",
  }));
  assert.equal(pending.status, "approval_required");
  assert.deepEqual(pending.requiredApprovals, ["subject-consent"]);

  const allowed = evaluateAction(action({
    agentId: "media",
    capability: "media.video.render.draft",
    approvals: [approval("subject-consent")],
  }));
  assert.equal(allowed.status, "allowed");
});

test("publication requires both consent and publication approval", () => {
  const decision = evaluateAction(action({
    agentId: "media",
    capability: "media.video.publish",
    mode: "execute",
    approvals: [approval("subject-consent")],
  }));
  assert.equal(decision.status, "approval_required");
  assert.deepEqual(decision.requiredApprovals, ["publication-approval"]);
});

test("x402 execution is limited to devnet test assets and 0.001 TEST_USDC", () => {
  const allowed = evaluateAction(action({
    capability: "payments.x402.execute",
    mode: "execute",
    network: "solana-devnet",
    amountAtomic: 1_000n,
    asset: "TEST_USDC",
    approvals: [approval("payment-approval")],
  }));
  assert.equal(allowed.status, "allowed");

  const tooLarge = evaluateAction(action({
    capability: "payments.x402.execute",
    mode: "execute",
    network: "solana-devnet",
    amountAtomic: 1_001n,
    asset: "TEST_USDC",
    approvals: [approval("payment-approval")],
  }));
  assert.equal(tooLarge.status, "denied");
});

test("citizen signup routes work but holds media until consent exists", () => {
  const orchestrator = new SiindexOrchestrator();
  const run = orchestrator.route({
    id: randomUUID(),
    type: "citizen.signup",
    requestedBy: "citizen-1",
    subjectId: "citizen-1",
    occurredAt: new Date().toISOString(),
  });
  assert.equal(run.tasks.length, 3);
  assert.equal(run.status, "awaiting_approval");
  assert.equal(run.tasks.find((task) => task.action.agentId === "media")?.decision.status, "approval_required");
  assert.equal(orchestrator.getReceiptStore().verify(), true);
});

test("optional membership payment is explicit and cannot hide in identity issuance", () => {
  const run = new SiindexOrchestrator().route({
    id: randomUUID(),
    type: "citizen.signup",
    requestedBy: "citizen-1",
    subjectId: "citizen-1",
    occurredAt: new Date().toISOString(),
    data: { optionalMembershipAmountAtomic: "500" },
  });
  const payment = run.tasks.find((task) => task.action.agentId === "payments");
  assert.equal(payment?.action.capability, "payments.solana_pay.prepare");
  assert.equal(payment?.action.asset, "TEST_USDC");
  assert.equal(payment?.action.amountAtomic, 500n);
});

test("receipts form a verifiable hash chain", () => {
  const store = new ReceiptStore();
  const first = store.append("run", "action-1", "test", {
    status: "allowed",
    actionId: "action-1",
    reasons: [],
    requiredApprovals: [],
    evaluatedAt: new Date().toISOString(),
  });
  const second = store.append("run", "action-2", "test", {
    status: "denied",
    actionId: "action-2",
    reasons: ["test"],
    requiredApprovals: [],
    evaluatedAt: new Date().toISOString(),
  });
  assert.equal(second.previousHash, first.hash);
  assert.equal(store.verify(), true);
});
