import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.95.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const PRIVATE_PREVIEW_ENABLED = Deno.env.get("SIINDEX_SWARM_PRIVATE_PREVIEW_ENABLED") === "true";

const EVENTS = new Set([
  "citizen.signup",
  "governance.proposal",
  "commerce.payment_requested",
  "commerce.payment_received",
  "membership.renewal",
  "media.welcome_requested",
]);

const APPROVALS = new Set([
  "citizen-consent",
  "subject-consent",
  "publication-approval",
  "payment-approval",
  "chain-registration-approval",
  "governance-execution-approval",
]);

function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;
  try {
    const host = new URL(origin).hostname.toLowerCase();
    return host === "imagenationdex.com" ||
      host === "www.imagenationdex.com" ||
      host === "imagenationdex.vercel.app" ||
      host === "imagenationdex-kukikings.vercel.app" ||
      (host.startsWith("imagenationdex-") && host.endsWith("-kukikings.vercel.app")) ||
      host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

function cors(req: Request) {
  const origin = req.headers.get("Origin");
  return {
    "Access-Control-Allow-Origin": origin && isAllowedOrigin(origin) ? origin : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function reply(req: Request, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(req), "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function safeData(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const encoded = JSON.stringify(value);
  if (encoded.length > 32_768) return false;
  return !/(private[_ -]?key|recovery words|password|secret key)/i.test(encoded);
}

Deno.serve(async (req: Request) => {
  const correlationId = crypto.randomUUID();
  if (!isAllowedOrigin(req.headers.get("Origin"))) {
    return reply(req, 403, { error: "origin_not_allowed", correlation_id: correlationId });
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return reply(req, 405, { error: "method_not_allowed", correlation_id: correlationId });
  if (!PRIVATE_PREVIEW_ENABLED) {
    return reply(req, 503, { error: "private_preview_disabled", correlation_id: correlationId });
  }
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return reply(req, 401, { error: "authentication_required", correlation_id: correlationId });
  }
  if (Number(req.headers.get("content-length") || 0) > 65_536) {
    return reply(req, 413, { error: "request_too_large", correlation_id: correlationId });
  }

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) {
    return reply(req, 401, { error: "invalid_session", correlation_id: correlationId });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply(req, 400, { error: "invalid_json", correlation_id: correlationId });
  }

  const operation = String(body.operation || "route");
  if (operation === "route") {
    const eventType = String(body.event_type || "");
    const data = body.data ?? {};
    if (!EVENTS.has(eventType) || !safeData(data)) {
      return reply(req, 400, { error: "invalid_private_test_event", correlation_id: correlationId });
    }
    const { data: result, error } = await client.rpc("enqueue_siindex_swarm_event", {
      p_event_type: eventType,
      p_subject_id: userData.user.id,
      p_data: data,
    });
    if (error) return reply(req, 400, { error: "route_failed", detail: error.message, correlation_id: correlationId });
    return reply(req, 200, { result, correlation_id: correlationId });
  }

  if (operation === "approve") {
    const runId = String(body.run_id || "");
    const kind = String(body.approval_kind || "");
    const evidenceHash = String(body.evidence_hash || "");
    const expiresAt = String(body.expires_at || "");
    if (!/^[a-f0-9]{64}$/.test(evidenceHash) || !APPROVALS.has(kind) || !Number.isFinite(Date.parse(expiresAt))) {
      return reply(req, 400, { error: "invalid_approval", correlation_id: correlationId });
    }
    const { data: result, error } = await client.rpc("approve_siindex_swarm_task", {
      p_run_id: runId,
      p_approval_kind: kind,
      p_evidence_hash: evidenceHash,
      p_expires_at: expiresAt,
    });
    if (error) return reply(req, 400, { error: "approval_failed", detail: error.message, correlation_id: correlationId });
    return reply(req, 200, { result, correlation_id: correlationId });
  }

  if (operation === "status") {
    const { data: runs, error } = await client
      .from("siindex_swarm_runs")
      .select("id,event_type,status,created_at,siindex_swarm_tasks(id,agent_id,capability,status,required_approval,network)")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return reply(req, 400, { error: "status_failed", detail: error.message, correlation_id: correlationId });
    return reply(req, 200, { runs, correlation_id: correlationId });
  }

  return reply(req, 400, { error: "unsupported_operation", correlation_id: correlationId });
});
