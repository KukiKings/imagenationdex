/**
 * SIINDEX Agent Bus — claim next runnable task (Stage 1)
 * Visibility timeout + claim token. Service-role / worker secret only.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.95.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WORKER_SECRET = Deno.env.get("SIINDEX_AGENT_WORKER_SECRET") || "";
const DEFAULT_VISIBILITY_SEC = 120;

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

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { body = {}; }

  const agent = String(body.agent || "").trim();
  const visibility = Math.min(600, Math.max(30, Number(body.visibility_seconds || DEFAULT_VISIBILITY_SEC)));
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const now = new Date();
  const timeoutAt = new Date(now.getTime() + visibility * 1000).toISOString();

  await admin.from("agent_tasks").update({
    status: "awaiting_next", claimed_by: null, claim_token: null, visibility_timeout_at: null,
  }).eq("status", "running").lt("visibility_timeout_at", now.toISOString());

  const { data: candidates, error } = await admin
    .from("agent_tasks")
    .select("*")
    .in("status", ["queued", "awaiting_next"])
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(5);

  if (error) return json(500, { error: "claim_query_failed", detail: error.message }, correlationId);

  const job = (candidates || []).find((row) => {
    if (row.expires_at && new Date(row.expires_at) < now) return false;
    if (!agent) return true;
    const next = (row.chain || [])[row.step_index];
    return next === agent;
  });

  if (!job) return json(200, { ok: true, claimed: false, task: null }, correlationId);

  const claimToken = crypto.randomUUID();
  const nextAgent = (job.chain || [])[job.step_index] || null;

  const { data: updated, error: upErr } = await admin.from("agent_tasks").update({
    status: "running",
    current_agent: nextAgent,
    claimed_by: agent || nextAgent || "worker",
    claim_token: claimToken,
    visibility_timeout_at: timeoutAt,
  }).eq("id", job.id).in("status", ["queued", "awaiting_next"]).select("*").maybeSingle();

  if (upErr || !updated) return json(409, { error: "claim_race", detail: upErr?.message }, correlationId);

  await admin.from("agent_audit").insert({
    task_id: job.id, agent: agent || nextAgent, action: "claim", ok: true,
    detail: { claim_token: claimToken, visibility_timeout_at: timeoutAt },
    correlation_id: correlationId,
  });

  return json(200, {
    ok: true, claimed: true, claim_token: claimToken, task: updated, current_agent: nextAgent,
  }, correlationId);
});
