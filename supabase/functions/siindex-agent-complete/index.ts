/**
 * SIINDEX Agent Bus — complete step (Stage 1)
 * Writes evidence + audit, advances chain or needs_aj / done.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.95.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WORKER_SECRET = Deno.env.get("SIINDEX_AGENT_WORKER_SECRET") || "";

const ALWAYS_AJ = [
  "publish", "contact_citizens", "move_funds", "issue_identity", "legal_commit",
  "ops.deploy", "ops.secret_write",
];

function authorized(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  const worker = req.headers.get("x-siindex-agent-worker") || "";
  if (SERVICE_KEY && auth === `Bearer ${SERVICE_KEY}`) return true;
  if (WORKER_SECRET && worker === WORKER_SECRET) return true;
  return false;
}

function json(status: number, body: Record<string, unknown>, correlationId: string) {
  return new Response(JSON.stringify({ ...body, correlation_id: correlationId }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Siindex-Correlation-Id": correlationId,
    },
  });
}

Deno.serve(async (req: Request) => {
  const correlationId = crypto.randomUUID();
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" }, correlationId);
  if (!authorized(req)) return json(401, { error: "unauthorized_worker" }, correlationId);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json(400, { error: "invalid_json" }, correlationId); }

  const taskId = String(body.task_id || "");
  const claimToken = String(body.claim_token || "");
  const agent = String(body.agent || "");
  const result = (body.result || {}) as Record<string, unknown>;
  if (!taskId || !claimToken) return json(400, { error: "task_id_and_claim_token_required" }, correlationId);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: job, error } = await admin.from("agent_tasks").select("*")
    .eq("id", taskId).eq("claim_token", claimToken).maybeSingle();
  if (error || !job) return json(409, { error: "invalid_claim", detail: error?.message }, correlationId);

  const requested = Array.isArray(result.requested_actions) ? result.requested_actions.map(String) : [];
  const blocked = requested.filter((a) => ALWAYS_AJ.includes(a) && !job.aj_authorized);
  const needsAj = Boolean(result.needs_aj) || blocked.length > 0;

  if (result.evidence) {
    await admin.from("agent_evidence").insert({
      task_id: taskId,
      agent: agent || job.current_agent || "unknown",
      kind: String((result.evidence as Record<string, unknown>).kind || "artifact"),
      summary: String(result.summary || ""),
      source_refs: (result.evidence as Record<string, unknown>).source_refs || [],
      payload: result.evidence,
    });
  }

  const payload = { ...(job.payload || {}), ...((result.payload_update as object) || {}) };
  let status = "awaiting_next";
  let stepIndex = Number(job.step_index) + 1;
  let blockedReason = result.blocked_reason ? String(result.blocked_reason) : job.blocked_reason;

  if (needsAj) { status = "needs_aj"; stepIndex = job.step_index; }
  else if (!result.ok) status = "failed";
  else if (stepIndex >= (job.chain || []).length) status = blockedReason ? "blocked" : "done";

  const { error: upErr } = await admin.from("agent_tasks").update({
    status, step_index: stepIndex, payload, last_result: result,
    blocked_reason: blockedReason,
    gate: needsAj ? String(result.summary || "needs AJ") : null,
    current_agent: null, claimed_by: null, claim_token: null, visibility_timeout_at: null,
    error: result.ok === false ? String(result.summary || "failed") : null,
  }).eq("id", taskId).eq("claim_token", claimToken);

  if (upErr) return json(500, { error: "complete_failed", detail: upErr.message }, correlationId);

  const next = status === "awaiting_next" ? (job.chain || [])[stepIndex] : null;
  if (next && status === "awaiting_next") {
    await admin.from("agent_messages").insert({
      task_id: taskId,
      sender: agent || job.current_agent || "worker",
      recipient: next,
      message_type: "handoff",
      goal: String((job.envelope as Record<string, unknown>)?.goal || job.payload?.goal || ""),
      source_refs: result.artifacts || [],
      allowed_actions: (job.envelope as Record<string, unknown>)?.allowed_actions || [],
      prohibited_actions: ALWAYS_AJ,
      data_classification: "internal_draft",
      evidence_required: true,
      nonce: crypto.randomUUID(),
      body: { from_result: result.summary },
    });
  }

  await admin.from("agent_audit").insert({
    task_id: taskId, agent: agent || job.current_agent, action: "complete",
    ok: Boolean(result.ok !== false),
    detail: { status, step_index: stepIndex, needs_aj: needsAj },
    correlation_id: correlationId,
  });

  return json(200, { ok: true, task_id: taskId, status, step_index: stepIndex, next_agent: next }, correlationId);
});
