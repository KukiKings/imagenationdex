/**
 * SIINDEX Agent Bus — dispatch (Stage 1)
 * Service-role / worker secret only. Creates or enqueues agent_tasks + first message.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.95.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WORKER_SECRET = Deno.env.get("SIINDEX_AGENT_WORKER_SECRET") || "";

const ALWAYS_AJ = [
  "publish",
  "contact_citizens",
  "move_funds",
  "issue_identity",
  "legal_commit",
  "ops.deploy",
  "ops.secret_write",
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
  if (req.method === "OPTIONS") return new Response("ok", { status: 200 });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" }, correlationId);
  if (!authorized(req)) return json(401, { error: "unauthorized_worker" }, correlationId);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json(400, { error: "invalid_json" }, correlationId); }

  const taskId = String(body.task_id || body.id || `task-${crypto.randomUUID()}`);
  const chain = Array.isArray(body.chain)
    ? body.chain.map(String)
    : ["knowledge", "policy_gate", "evidence", "verify"];
  const goal = String(body.goal || "Untitled internal task");
  const allowed = Array.isArray(body.allowed_actions)
    ? body.allowed_actions.map(String)
    : ["read_knowledge", "check_policy", "write_evidence", "verify_draft"];
  const prohibited = Array.from(new Set([
    ...(Array.isArray(body.prohibited_actions) ? body.prohibited_actions.map(String) : []),
    ...ALWAYS_AJ,
  ]));

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const envelope = {
    task_id: taskId,
    sender: String(body.sender || "SIINDEX"),
    recipient: chain[0] || "knowledge",
    goal,
    source_refs: body.source_refs || [],
    allowed_actions: allowed,
    prohibited_actions: prohibited,
    output_format: body.output_format || null,
    data_classification: body.data_classification || "internal_draft",
    approval_class: body.approval_class || null,
    evidence_required: body.evidence_required !== false,
    deadline: body.deadline || null,
    cost_limit_usd: body.cost_limit_usd ?? 2,
    retry_limit: body.retry_limit ?? 3,
    expires_at: body.expires_at || null,
    nonce: crypto.randomUUID(),
  };

  const { error: taskErr } = await admin.from("agent_tasks").upsert({
    id: taskId,
    directed_by: "SIINDEX",
    type: String(body.type || "internal_chain"),
    priority: Number(body.priority ?? 10),
    status: "queued",
    chain,
    step_index: 0,
    payload: body.payload || { goal },
    envelope,
    requires_aj_for: ALWAYS_AJ,
    aj_authorized: false,
    retry_limit: envelope.retry_limit,
    cost_limit_usd: envelope.cost_limit_usd,
    expires_at: envelope.expires_at,
  });

  if (taskErr) {
    await admin.from("agent_audit").insert({
      task_id: taskId, agent: "dispatch", action: "dispatch_failed", ok: false,
      detail: { error: taskErr.message }, correlation_id: correlationId,
    });
    return json(500, { error: "task_upsert_failed", detail: taskErr.message }, correlationId);
  }

  const { error: msgErr } = await admin.from("agent_messages").insert({
    task_id: taskId,
    sender: envelope.sender,
    recipient: envelope.recipient,
    message_type: "dispatch",
    goal,
    source_refs: envelope.source_refs,
    allowed_actions: allowed,
    prohibited_actions: prohibited,
    output_format: envelope.output_format,
    data_classification: envelope.data_classification,
    approval_class: envelope.approval_class,
    evidence_required: envelope.evidence_required,
    deadline: envelope.deadline,
    cost_limit_usd: envelope.cost_limit_usd,
    retry_limit: envelope.retry_limit,
    expires_at: envelope.expires_at,
    nonce: envelope.nonce,
    body: { chain, payload: body.payload || {} },
  });

  await admin.from("agent_audit").insert({
    task_id: taskId, agent: "SIINDEX", action: "dispatch", ok: !msgErr,
    detail: { chain, goal }, correlation_id: correlationId,
  });

  if (msgErr) return json(500, { error: "message_insert_failed", detail: msgErr.message }, correlationId);
  return json(200, { ok: true, task_id: taskId, status: "queued", chain }, correlationId);
});
