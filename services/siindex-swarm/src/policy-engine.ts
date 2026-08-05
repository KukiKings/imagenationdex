import type {
  ActionRequest,
  ApprovalEvidence,
  ApprovalKind,
  PolicyDecision,
} from "./contracts.js";
import { getManifest, isCapabilityAllowed, isCapabilityProhibited } from "./manifests.js";

const DEVNET_ASSETS = new Set(["TEST_USDC", "TEST_INDX"]);

function validApprovals(
  approvals: readonly ApprovalEvidence[] | undefined,
  subjectId: string,
  now: Date,
): Set<ApprovalKind> {
  return new Set(
    (approvals ?? [])
      .filter((approval) => approval.subjectId === subjectId)
      .filter((approval) => Number.isFinite(Date.parse(approval.expiresAt)))
      .filter((approval) => Date.parse(approval.expiresAt) > now.getTime())
      .map((approval) => approval.kind),
  );
}

function requiredApprovals(action: ActionRequest): ApprovalKind[] {
  const required: ApprovalKind[] = [];
  if (action.capability === "citizen.identity.issue") required.push("citizen-consent");
  if (action.capability === "media.avatar.profile.prepare") required.push("subject-consent");
  if (action.capability === "media.video.render.draft") required.push("subject-consent");
  if (action.capability === "media.video.publish") {
    required.push("subject-consent", "publication-approval");
  }
  if (action.capability === "marketing.distribution.publish") required.push("publication-approval");
  if (action.capability === "payments.x402.execute") required.push("payment-approval");
  if (action.metadata?.onChainAgentRegistration === true) required.push("chain-registration-approval");
  return [...new Set(required)];
}

export function evaluateAction(action: ActionRequest, now = new Date()): PolicyDecision {
  const manifest = getManifest(action.agentId);
  const reasons: string[] = [];

  if (isCapabilityProhibited(manifest, action.capability)) {
    reasons.push("Capability is permanently prohibited for the SIINDEX swarm.");
  }
  if (!isCapabilityAllowed(manifest, action.capability)) {
    reasons.push("Capability is absent from the agent manifest.");
  }
  if (!manifest.networks.includes(action.network)) {
    reasons.push("Mainnet and unlisted networks are disabled in private testing.");
  }
  if (action.mode === "execute" && action.network === "solana-mainnet") {
    reasons.push("Mainnet execution is disabled.");
  }
  if (action.amountAtomic !== undefined) {
    if (action.amountAtomic < 0n) reasons.push("Payment amount cannot be negative.");
    if (!action.asset || !DEVNET_ASSETS.has(action.asset)) {
      reasons.push("Only TEST_USDC or TEST_INDX is accepted in the private test runtime.");
    }
    if (action.network !== "solana-devnet" && action.network !== "sandbox") {
      reasons.push("Payment testing is restricted to sandbox or Solana devnet.");
    }
    if (action.amountAtomic > manifest.devnetPaymentLimitAtomic) {
      reasons.push("Payment exceeds the manifest's devnet atomic-unit limit.");
    }
  }
  if (action.capability === "governance.vote.execute") {
    reasons.push("Synthetic Intelligence may analyse governance but cannot cast a vote.");
  }

  const required = requiredApprovals(action);
  const present = validApprovals(action.approvals, action.subjectId, now);
  const missing = required.filter((kind) => !present.has(kind));
  const evaluatedAt = now.toISOString();

  if (reasons.length > 0) {
    return { status: "denied", actionId: action.id, reasons, requiredApprovals: missing, evaluatedAt };
  }
  if (missing.length > 0) {
    return {
      status: "approval_required",
      actionId: action.id,
      reasons: ["Required approval evidence is missing or expired."],
      requiredApprovals: missing,
      evaluatedAt,
    };
  }
  return {
    status: "allowed",
    actionId: action.id,
    reasons: ["Capability, network, value limit and approval policy passed."],
    requiredApprovals: [],
    evaluatedAt,
  };
}
