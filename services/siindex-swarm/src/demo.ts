import { randomUUID } from "node:crypto";
import { SiindexOrchestrator } from "./orchestrator.js";

const subjectId = "citizen-private-test-001";
const orchestrator = new SiindexOrchestrator();
const run = orchestrator.route({
  id: randomUUID(),
  type: "citizen.signup",
  requestedBy: subjectId,
  subjectId,
  occurredAt: new Date().toISOString(),
  approvals: [{
    id: randomUUID(),
    kind: "subject-consent",
    subjectId,
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  }],
});

console.log(JSON.stringify(run, (_key, value) => typeof value === "bigint" ? value.toString() : value, 2));
