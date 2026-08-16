/**
 * SIINDEX Visitor Feedback — public POST (origin-checked).
 * Dual-write companion to localStorage siindex_feedback_v1.
 * No accounts. No PII stored. Rate-limited by visitor hash.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.95.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ZONE = "siindex_visitor_feedback";

function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;
  try {
    const host = new URL(origin).hostname.toLowerCase();
    return (
      host === "imagenationdex.com" ||
      host === "www.imagenationdex.com" ||
      host === "imagenationdex.vercel.app" ||
      host === "imagenationdex-kukikings.vercel.app" ||
      (host.startsWith("imagenationdex-") && host.endsWith("-kukikings.vercel.app")) ||
      host === "localhost" ||
      host === "127.0.0.1"
    );
  } catch (_) {
    return false;
  }
}

function cors(req: Request) {
  const origin = req.headers.get("Origin");
  return {
    "Access-Control-Allow-Origin": origin && isAllowedOrigin(origin) ? origin : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-siindex-visitor-id",
    "Access-Control-Expose-Headers": "X-Siindex-Correlation-Id",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(
  req: Request,
  status: number,
  body: Record<string, unknown>,
  correlationId: string,
) {
  return new Response(JSON.stringify({ ...body, correlation_id: correlationId }), {
    status,
    headers: {
      ...cors(req),
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Siindex-Correlation-Id": correlationId,
    },
  });
}

async function visitorHash(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const source =
    forwarded ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-siindex-visitor-id") ||
    "unknown";
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${source}|${SERVICE_KEY.slice(0, 32)}`),
  );
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function uaHash(req: Request) {
  const ua = req.headers.get("user-agent") || "unknown";
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(ua),
  );
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

async function allowed(
  admin: ReturnType<typeof createClient>,
  hash: string,
) {
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count, error } = await admin
    .from("security_events")
    .select("id", { count: "exact", head: true })
    .eq("zone", ZONE)
    .eq("detail->>visitor_hash", hash)
    .gte("created_at", hourAgo);
  if (error) throw new Error("rate_limit_unavailable");
  return (count || 0) < 30;
}

Deno.serve(async (req: Request) => {
  const correlationId = crypto.randomUUID();
  if (!isAllowedOrigin(req.headers.get("Origin"))) {
    return json(req, 403, { error: "origin_not_allowed" }, correlationId);
  }
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors(req) });
  }
  if (req.method !== "POST") {
    return json(req, 405, { error: "method_not_allowed" }, correlationId);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const hash = await visitorHash(req);

  try {
    if (!(await allowed(admin, hash))) {
      return json(
        req,
        429,
        { error: "rate_limited", retry_after_seconds: 3600 },
        correlationId,
      );
    }
  } catch (_) {
    return json(req, 503, { error: "rate_limit_unavailable" }, correlationId);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (_) {
    return json(req, 400, { error: "invalid_json" }, correlationId);
  }

  const vote = String(body.vote || "").toLowerCase();
  if (vote !== "up" && vote !== "down") {
    return json(req, 400, { error: "vote_must_be_up_or_down" }, correlationId);
  }

  const answerSnippet = String(body.text || body.answer_snippet || "")
    .slice(0, 280)
    .trim();
  const pagePath = String(body.page || body.page_path || "/").slice(0, 200);
  const knowledgeVersion = body.knowledge_version
    ? String(body.knowledge_version).slice(0, 32)
    : null;
  const source = String(body.source || "presence-thumbs").slice(0, 64);

  const ua = await uaHash(req);

  const { error: insertErr } = await admin.from("visitor_feedback").insert({
    vote,
    answer_snippet: answerSnippet,
    page_path: pagePath,
    knowledge_version: knowledgeVersion,
    source,
    visitor_hash: hash,
    correlation_id: correlationId,
    user_agent_hash: ua,
  });

  if (insertErr) {
    await admin.from("security_events").insert({
      tier: "T1",
      zone: ZONE,
      correlation_id: correlationId,
      description: "visitor_feedback insert failed",
      detail: { visitor_hash: hash, error: insertErr.message },
    });
    return json(
      req,
      503,
      { error: "store_unavailable", detail: insertErr.message },
      correlationId,
    );
  }

  await admin.from("security_events").insert({
    tier: "T0",
    zone: ZONE,
    correlation_id: correlationId,
    description: "visitor_feedback accepted",
    detail: {
      visitor_hash: hash,
      vote,
      page_path: pagePath,
      knowledge_version: knowledgeVersion,
      text_len: answerSnippet.length,
    },
  });

  return json(req, 200, { ok: true, stored: "remote" }, correlationId);
});
