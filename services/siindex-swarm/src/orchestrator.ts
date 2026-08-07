import { randomUUID } from "node:crypto";
import type {
  ActionMode,
  AgentId,
  Network,
  SwarmEvent,
  SwarmRun,
  SwarmTask,
} from "./contracts.js";
import { evaluateAction } from "./policy-engine.js";
import { ReceiptStore } from "./receipt-store.js";

interface TaskTemplate {
  agentId: AgentId;
  capability: string;
  mode?: ActionMode;
  network?: Network;
  amountAtomic?: bigint;
  asset?: string;
  metadata?: Readonly<Record<string, unknown>>;
}

function templatesFor(event: SwarmEvent): TaskTemplate[] {
  switch (event.type) {
    case "citizen.signup": {
      const tasks: TaskTemplate[] = [
        { agentId: "citizen", capability: "citizen.onboarding.prepare" },
        { agentId: "membership", capability: "membership.activate.prepare" },
        { agentId: "media", capability: "media.video.render.draft" },
      ];
      if (typeof event.data?.optionalMembershipAmountAtomic === "string") {
        tasks.splice(2, 0, {
          agentId: "payments",
          capability: "payments.solana_pay.prepare",
          network: "solana-devnet",
          amountAtomic: BigInt(event.data.optionalMembershipAmountAtomic),
          asset: "TEST_USDC",
        });
      }
      return tasks;
    }
    case "governance.proposal":
      return [
        { agentId: "analytics", capability: "analytics.proposal.assess", mode: "read" },
        { agentId: "reputation", capability: "reputation.evidence.read", mode: "read" },
        { agentId: "media", capability: "media.video.render.draft" },
      ];
    case "commerce.payment_requested":
      return [{
        agentId: "payments",
        capability: "payments.solana_pay.prepare",
        network: "solana-devnet",
        amountAtomic: BigInt(String(event.data?.amountAtomic ?? "0")),
        asset: String(event.data?.asset ?? "TEST_USDC"),
      }];
    case "commerce.payment_received":
      return [
        { agentId: "payments", capability: "payments.receipt.verify", mode: "read" },
        { agentId: "fulfilment", capability: "fulfilment.order.prepare" },
        { agentId: "reputation", capability: "reputation.score.prepare" },
      ];
    case "membership.renewal":
      return [
        { agentId: "membership", capability: "membership.renewal.evaluate", mode: "read" },
        { agentId: "payments", capability: "payments.x402.prepare" },
      ];
    case "media.welcome_requested":
      return [{ agentId: "media", capability: "media.video.render.draft" }];
  }
}

function taskFromTemplate(runId: string, event: SwarmEvent, template: TaskTemplate, index: number): SwarmTask {
  const action = {
    id: randomUUID(),
    runId,
    agentId: template.agentId,
    capability: template.capability,
    mode: template.mode ?? "prepare",
    network: template.network ?? "sandbox",
    requestedBy: event.requestedBy,
    subjectId: event.subjectId,
    idempotencyKey: `${event.id}:${index}:${template.agentId}:${template.capability}`,
    ...(template.amountAtomic === undefined ? {} : { amountAtomic: template.amountAtomic }),
    ...(template.asset === undefined ? {} : { asset: template.asset }),
    ...(event.approvals === undefined ? {} : { approvals: event.approvals }),
    ...((template.metadata ?? event.data) === undefined ? {} : { metadata: template.metadata ?? event.data }),
  } as const;
  return { action, decision: evaluateAction(action) };
}

export class SiindexOrchestrator {
  constructor(private readonly receipts = new ReceiptStore()) {}

  route(event: SwarmEvent): SwarmRun {
    const runId = randomUUID();
    const tasks = templatesFor(event).map((template, index) => taskFromTemplate(runId, event, template, index));
    for (const task of tasks) {
      this.receipts.append(runId, task.action.id, event.type, task.decision, {
        agentId: task.action.agentId,
        capability: task.action.capability,
        network: task.action.network,
        idempotencyKey: task.action.idempotencyKey,
      });
    }
    const status = tasks.some((task) => task.decision.status === "denied")
      ? "denied"
      : tasks.some((task) => task.decision.status === "approval_required")
        ? "awaiting_approval"
        : "prepared";
    return Object.freeze({ id: runId, event, tasks: Object.freeze(tasks), status });
  }

  getReceiptStore(): ReceiptStore {
    return this.receipts;
  }
}
