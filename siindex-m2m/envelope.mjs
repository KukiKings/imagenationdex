/**
 * Typed agent message envelope — Stage 1
 * Agents must not send unrestricted natural-language commands.
 */
import { randomUUID } from "node:crypto";
import { ALWAYS_AJ, defaultProhibited } from "./policy.mjs";

const REQUIRED = [
  "task_id",
  "sender",
  "recipient",
  "goal",
  "allowed_actions",
  "prohibited_actions",
  "nonce",
];

/**
 * @param {Record<string, unknown>} raw
 */
export function validateEnvelope(raw) {
  const errors = [];
  if (!raw || typeof raw !== "object") {
    return { ok: false, errors: ["envelope_not_object"] };
  }
  for (const key of REQUIRED) {
    if (raw[key] === undefined || raw[key] === null || raw[key] === "") {
      errors.push(`missing_${key}`);
    }
  }
  if (!Array.isArray(raw.allowed_actions)) errors.push("allowed_actions_not_array");
  if (!Array.isArray(raw.prohibited_actions)) errors.push("prohibited_actions_not_array");

  if (raw.expires_at) {
    const exp = Date.parse(String(raw.expires_at));
    if (!Number.isNaN(exp) && exp < Date.now()) errors.push("envelope_expired");
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Build a complete envelope with safe defaults.
 */
export function buildEnvelope(partial = {}) {
  const prohibited = Array.from(
    new Set([...(partial.prohibited_actions || []), ...defaultProhibited()]),
  );
  return {
    task_id: partial.task_id || "task-unknown",
    parent_task_id: partial.parent_task_id || null,
    sender: partial.sender || "SIINDEX",
    recipient: partial.recipient || "knowledge",
    message_type: partial.message_type || "handoff",
    goal: partial.goal || "",
    source_refs: partial.source_refs || [],
    allowed_actions: partial.allowed_actions || ["handoff"],
    prohibited_actions: prohibited,
    output_format: partial.output_format || null,
    data_classification: partial.data_classification || "internal_draft",
    approval_class: partial.approval_class || null,
    evidence_required: partial.evidence_required !== false,
    deadline: partial.deadline || null,
    cost_limit_usd: partial.cost_limit_usd ?? 2,
    retry_limit: partial.retry_limit ?? 3,
    expires_at: partial.expires_at || null,
    nonce: partial.nonce || randomUUID(),
    body: partial.body || {},
  };
}
