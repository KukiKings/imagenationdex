export const AGENT_IDS = [
  "siindex",
  "citizen",
  "payments",
  "membership",
  "media",
  "scheduling",
  "fulfilment",
  "marketing",
  "analytics",
  "reputation",
] as const;

export type AgentId = (typeof AGENT_IDS)[number];
export type Network = "sandbox" | "solana-devnet" | "solana-mainnet";
export type ActionMode = "read" | "prepare" | "execute";
export type DecisionStatus = "allowed" | "approval_required" | "denied";

export type ApprovalKind =
  | "citizen-consent"
  | "subject-consent"
  | "publication-approval"
  | "payment-approval"
  | "chain-registration-approval"
  | "governance-execution-approval";

export interface ApprovalEvidence {
  id: string;
  kind: ApprovalKind;
  subjectId: string;
  expiresAt: string;
}

export interface CapabilityManifest {
  agentId: AgentId;
  role: string;
  capabilities: readonly string[];
  networks: readonly Network[];
  prohibited: readonly string[];
  ownsKeys: false;
  defaultMode: ActionMode;
  devnetPaymentLimitAtomic: bigint;
}

export interface ActionRequest {
  id: string;
  runId: string;
  agentId: AgentId;
  capability: string;
  mode: ActionMode;
  network: Network;
  requestedBy: string;
  subjectId: string;
  idempotencyKey: string;
  amountAtomic?: bigint;
  asset?: string;
  approvals?: readonly ApprovalEvidence[];
  metadata?: Readonly<Record<string, unknown>>;
}

export interface PolicyDecision {
  status: DecisionStatus;
  actionId: string;
  reasons: readonly string[];
  requiredApprovals: readonly ApprovalKind[];
  evaluatedAt: string;
}

export type SwarmEventType =
  | "citizen.signup"
  | "governance.proposal"
  | "commerce.payment_requested"
  | "commerce.payment_received"
  | "membership.renewal"
  | "media.welcome_requested";

export interface SwarmEvent {
  id: string;
  type: SwarmEventType;
  requestedBy: string;
  subjectId: string;
  occurredAt: string;
  approvals?: readonly ApprovalEvidence[];
  data?: Readonly<Record<string, unknown>>;
}

export interface SwarmTask {
  action: ActionRequest;
  decision: PolicyDecision;
}

export interface SwarmRun {
  id: string;
  event: SwarmEvent;
  tasks: readonly SwarmTask[];
  status: "prepared" | "awaiting_approval" | "denied";
}

export interface ReceiptRecord {
  id: string;
  runId: string;
  actionId: string;
  eventType: string;
  status: DecisionStatus;
  detail: Readonly<Record<string, unknown>>;
  createdAt: string;
  previousHash: string | null;
  hash: string;
}
