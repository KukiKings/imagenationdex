/**
 * csp-reports — public receiver for browser CSP violation reports.
 * Accepts POST with Content-Type application/reports+json (Reporting API) or
 * application/csp-report (legacy report-uri). verify_jwt is false (see supabase/config.toml)
 * because browsers send reports without credentials.
 *
 * All report fields are untrusted (see sanitize.ts): query strings and fragments are stripped
 * from URL fields, URL and policy fields are length-capped, and any script sample is reduced to
 * 40 safe characters or dropped entirely, in both the columns and the stored raw JSON.
 *
 * Order of checks (nothing touches the database before all pass):
 *   non-POST 405 (OPTIONS preflight 204) -> Origin present and not imagenationdex.com or a
 *   subdomain 403 -> Upstash sliding window 100 reports/IP/hour, 429 (fail closed: also 429 if
 *   Redis is unreachable or unconfigured) -> content type and JSON 400 -> 64 KB body cap,
 *   20 reports per request -> insert -> 204.
 * Requires secrets UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.95.0";
import { Ratelimit } from "npm:@upstash/ratelimit@2.0.5";
import { Redis } from "npm:@upstash/redis@1.34.3";
import { clean, originAllowed } from "./sanitize.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const UPSTASH_URL = Deno.env.get("UPSTASH_REDIS_REST_URL");
const UPSTASH_TOKEN = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");
const MAX_BYTES = 64 * 1024;
const MAX_REPORTS = 20;

const limiter = (UPSTASH_URL && UPSTASH_TOKEN)
  ? new Ratelimit({
    redis: new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN }),
    limiter: Ratelimit.slidingWindow(100, "1 h"),
    prefix: "csp-reports",
  })
  : null;

function cors(req: Request): Record<string, string> {
  const o = req.headers.get("origin");
  const h: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (o === null) h["Access-Control-Allow-Origin"] = "*";
  else if (originAllowed(o)) h["Access-Control-Allow-Origin"] = o;
  return h;
}

function respond(req: Request, status: number, extra: Record<string, string> = {}) {
  return new Response(null, { status, headers: { ...cors(req), ...extra } });
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v.slice(0, 2048) : null;
}
function int(v: unknown): number | null {
  return typeof v === "number" && Number.isInteger(v) ? v : null;
}

function row(rep: Record<string, unknown>, body: Record<string, unknown>, ua: string | null, type: string) {
  return {
    report_type: type,
    document_url: str(body["documentURL"] ?? body["document-uri"]),
    blocked_url: str(body["blockedURL"] ?? body["blocked-uri"]),
    effective_directive: str(body["effectiveDirective"] ?? body["effective-directive"] ?? body["violated-directive"]),
    disposition: str(body["disposition"]),
    status_code: int(body["statusCode"] ?? body["status-code"]),
    user_agent: ua ? ua.slice(0, 512) : null,
    raw: rep,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return respond(req, 204);
  if (req.method !== "POST") return respond(req, 405, { Allow: "POST, OPTIONS" });

  // Origin present and not ours: reject before any database work.
  if (!originAllowed(req.headers.get("origin"))) return respond(req, 403);

  // Durable per-IP limit. Fail closed: any Redis problem is a 429.
  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  try {
    if (!limiter) return respond(req, 429);
    const { success } = await limiter.limit(ip);
    if (!success) return respond(req, 429);
  } catch (_) {
    return respond(req, 429);
  }

  const ct = (req.headers.get("content-type") || "").toLowerCase();
  const reportsJson = ct.startsWith("application/reports+json");
  const legacy = ct.startsWith("application/csp-report");
  if (!reportsJson && !legacy) return respond(req, 400);

  let text: string;
  try { text = await req.text(); } catch (_) { return respond(req, 400); }
  if (text.length === 0 || text.length > MAX_BYTES) return respond(req, 400);

  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch (_) { return respond(req, 400); }

  const headerUa = req.headers.get("user-agent");
  const rows: ReturnType<typeof row>[] = [];

  if (reportsJson) {
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > MAX_REPORTS) return respond(req, 400);
    for (const item of parsed) {
      if (!item || typeof item !== "object") return respond(req, 400);
      const rep = item as Record<string, unknown>;
      const body = rep["body"];
      if (!body || typeof body !== "object" || Array.isArray(body)) return respond(req, 400);
      const cleaned = clean(rep) as Record<string, unknown>;
      rows.push(row(cleaned, cleaned["body"] as Record<string, unknown>, str(rep["user_agent"]) ?? headerUa, str(rep["type"]) ?? "csp-violation"));
    }
  } else {
    const body = (parsed && typeof parsed === "object") ? (parsed as Record<string, unknown>)["csp-report"] : null;
    if (!body || typeof body !== "object" || Array.isArray(body)) return respond(req, 400);
    const cleaned = clean(parsed) as Record<string, unknown>;
    rows.push(row(cleaned, cleaned["csp-report"] as Record<string, unknown>, headerUa, "csp-violation"));
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { error } = await sb.from("csp_reports").insert(rows);
  if (error) return respond(req, 500);
  return respond(req, 204);
});
