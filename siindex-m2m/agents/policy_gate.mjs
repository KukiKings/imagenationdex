/**
 * Policy Gate Agent — Stage 1
 * Evaluates allowed/prohibited actions before downstream work.
 */
import { evaluateActions, ALWAYS_AJ } from "../policy.mjs";

export async function run(job) {
  const requested =
    job.envelope?.allowed_actions ||
    job.payload?.allowed_actions ||
    ["read_knowledge", "check_policy", "write_evidence", "verify_draft"];

  const decision = evaluateActions(requested, {
    aj_authorized: !!job.aj_authorized,
    mandate_actions: job.payload?.mandate_actions || [],
  });

  if (!decision.ok) {
    return {
      job_id: job.id,
      agent: "policy_gate",
      ok: false,
      summary: decision.reason,
      artifacts: ["siindex-m2m/policy.mjs"],
      payload_update: { policy: decision, always_aj: ALWAYS_AJ },
      next_hint: null,
      blocked_reason: decision.reason,
      needs_aj: true,
      at: new Date().toISOString(),
    };
  }

  return {
    job_id: job.id,
    agent: "policy_gate",
    ok: true,
    summary: `Policy Gate passed for: ${decision.allowed.join(", ")}`,
    artifacts: ["siindex-m2m/policy.mjs"],
    payload_update: { policy: decision },
    next_hint: job.chain[job.step_index + 1] || null,
    blocked_reason: null,
    needs_aj: false,
    at: new Date().toISOString(),
  };
}
