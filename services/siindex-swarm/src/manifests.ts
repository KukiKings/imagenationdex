import type { AgentId, CapabilityManifest } from "./contracts.js";

const GLOBAL_PROHIBITIONS = [
  "wallet.export",
  "wallet.sign.unattended",
  "solana.trade",
  "solana.lend",
  "solana.borrow",
  "solana.bridge",
  "solana.airdrop",
  "solana.token.launch",
  "treasury.rebalance",
  "governance.vote.execute",
] as const;

function manifest(
  agentId: AgentId,
  role: string,
  capabilities: readonly string[],
  devnetPaymentLimitAtomic = 0n,
): CapabilityManifest {
  return Object.freeze({
    agentId,
    role,
    capabilities: Object.freeze([...capabilities]),
    networks: Object.freeze(["sandbox", "solana-devnet"] as const),
    prohibited: Object.freeze([...GLOBAL_PROHIBITIONS]),
    ownsKeys: false as const,
    defaultMode: "prepare" as const,
    devnetPaymentLimitAtomic,
  });
}

export const CAPABILITY_MANIFESTS: Readonly<Record<AgentId, CapabilityManifest>> = Object.freeze({
  siindex: manifest("siindex", "Orchestrates bounded workflows and records decisions", [
    "swarm.route",
    "swarm.pause",
    "swarm.resume",
    "swarm.status.read",
  ]),
  citizen: manifest("citizen", "Prepares onboarding and verified identity work", [
    "citizen.onboarding.prepare",
    "citizen.phone.verify",
    "citizen.identity.issue",
    "citizen.recovery.prepare",
  ]),
  payments: manifest("payments", "Prepares payment requests and verifies receipts", [
    "payments.solana_pay.prepare",
    "payments.receipt.verify",
    "payments.x402.prepare",
    "payments.x402.execute",
  ], 1_000n),
  membership: manifest("membership", "Prepares tiers and renewal decisions", [
    "membership.activate.prepare",
    "membership.renewal.evaluate",
    "membership.tier.update.prepare",
  ]),
  media: manifest("media", "Creates consent-bound private media drafts", [
    "media.avatar.profile.prepare",
    "media.video.render.draft",
    "media.video.publish",
  ]),
  scheduling: manifest("scheduling", "Prepares bookings and reminders", [
    "scheduling.availability.read",
    "scheduling.booking.prepare",
    "scheduling.reminder.prepare",
  ]),
  fulfilment: manifest("fulfilment", "Prepares merchant fulfilment work", [
    "fulfilment.order.prepare",
    "fulfilment.delivery.update.prepare",
    "fulfilment.dispute.hold",
  ]),
  marketing: manifest("marketing", "Prepares truthful campaign drafts", [
    "marketing.campaign.prepare",
    "marketing.content.prepare",
    "marketing.distribution.publish",
  ]),
  analytics: manifest("analytics", "Reads evidence and prepares analysis", [
    "analytics.metrics.read",
    "analytics.proposal.assess",
    "analytics.report.prepare",
  ]),
  reputation: manifest("reputation", "Prepares evidence-based trust updates", [
    "reputation.evidence.read",
    "reputation.score.prepare",
    "reputation.flag.prepare",
  ]),
});

export function getManifest(agentId: AgentId): CapabilityManifest {
  return CAPABILITY_MANIFESTS[agentId];
}

export function isCapabilityAllowed(manifest: CapabilityManifest, capability: string): boolean {
  return manifest.capabilities.includes(capability);
}

export function isCapabilityProhibited(manifest: CapabilityManifest, capability: string): boolean {
  return manifest.prohibited.some((value) => capability === value || capability.startsWith(`${value}.`));
}
