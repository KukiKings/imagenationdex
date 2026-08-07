import {
  mintAgent,
  type AgentMetadata,
  type MintAgentInput,
  type MintAgentResponse,
} from "@metaplex-foundation/mpl-agent-registry";
import type { PublicKey, Umi } from "@metaplex-foundation/umi";
import type { ApprovalEvidence } from "../contracts.js";

export interface AgentRegistrationPlanInput {
  wallet: PublicKey | string;
  name: string;
  description: string;
  metadataUri: string;
  manifestUri: string;
  serviceEndpoint: string;
}

export interface AgentRegistrationPlan {
  status: "unsigned_devnet_plan";
  input: MintAgentInput;
  signingAuthority: "external_policy_wallet";
}

export function buildAgentRegistrationPlan(input: AgentRegistrationPlanInput): AgentRegistrationPlan {
  for (const value of [input.metadataUri, input.manifestUri, input.serviceEndpoint]) new URL(value);
  const agentMetadata: AgentMetadata = {
    type: "synthetic-intelligence-agent",
    name: input.name,
    description: input.description,
    services: [
      { name: "capability-manifest", endpoint: input.manifestUri },
      { name: "private-test-service", endpoint: input.serviceEndpoint },
    ],
    registrations: [],
    supportedTrust: ["deny-by-default", "external-policy-wallet", "append-only-receipts"],
  };
  return Object.freeze({
    status: "unsigned_devnet_plan",
    signingAuthority: "external_policy_wallet",
    input: {
      wallet: input.wallet,
      network: "solana-devnet" as const,
      name: input.name,
      uri: input.metadataUri,
      agentMetadata,
    },
  });
}

export async function prepareUnsignedAgentRegistration(
  umi: Umi,
  plan: AgentRegistrationPlan,
  approval: ApprovalEvidence,
  now = new Date(),
): Promise<MintAgentResponse> {
  if (approval.kind !== "chain-registration-approval") throw new Error("Chain registration approval is required.");
  if (Date.parse(approval.expiresAt) <= now.getTime()) throw new Error("Chain registration approval has expired.");
  if (plan.input.network !== "solana-devnet") throw new Error("Agent registration is restricted to Solana devnet.");
  // Metaplex returns an unsigned transaction. This adapter intentionally does
  // not sign or submit it. Signing belongs to an external policy wallet.
  return mintAgent(umi, {}, plan.input);
}
