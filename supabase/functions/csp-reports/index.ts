/**
 * csp-reports — public receiver for browser CSP violation reports.
 * Accepts POST with Content-Type application/reports+json (Reporting API) or
 * application/csp-report (legacy report-uri). verify_jwt is false (see supabase/config.toml)
 * because browsers send reports without credentials.
 *
 * Privacy: query strings and fragments are stripped from document and blocked URLs, and from
 * every URL-valued field inside the stored raw JSON, before anything is written.
 * Abuse limits (no rate limiter here): body max 64 KB, at most 20 reports per request.
 *
 * Responses: 204 stored, 400 malformed or unsupported, 405 non-POST, 500 insert failed.
 * OPTIONS answers the CORS preflight that browsers send for cross-origin report uploads.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.95.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MAX_BYTES = 64 * 1024;
const MAX_REPORTS = 20;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Max-Age": "86400",
};

const URL_KEYS = new Set([
  "documenturl", "blockedurl", "document-uri", "blocked-uri", "referrer",
  "source-file", "sourcefile", "url",
]);

function stripUrl(v: string): string {
  const i = v.search(/[?#]/);
  return i === -1 ? v : v.slice(0, i);
}

// Deep copy; every URL-valued key loses its query string and fragment.
function clean(value: unknown, key = ""): unknown {
  if (typeof value === "string") return URL_KEYS.has(key.toLowerCase()) ? stripUrl(value) : value;
  if (Array.isArray(value)) return value.map((x) => clean(x, key));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = clean(v, k);
    return out;
  }
  return value;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v.slice(0, 2048) : null;
}
function int(v: unknown): number | null {
  return typeof v === "number" && Number.isInteger(v) ? v : null;
}

function respond(status: number, extra: Record<string, string> = {}) {
  return new Response(null, { status, headers: { ...CORS, ...extra } });
}

function row(rep: Record<string, unknown>, body: Record<string, unknown>, ua: string | null, type: string) {
  return {
    report_type: type,
    document_url: str(body["documentURL"] ?? body["document-uri"]),
    blocked_url: str(body["blockedURL"] ?? body["blocked-uri"]),
    effective_directive: str(body["effectiveDirective"] ?? body["effective-directive"] ?? body["violated-directive"]),
    disposition: str(body["disposition"]),
    status_code: int(body["statusCode"] ?? body["status-code"]),
    user_agent: ua,
    raw: rep,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return respond(204);
  if (req.method !== "POST") return respond(405, { Allow: "POST, OPTIONS" });

  const ct = (req.headers.get("content-type") || "").toLowerCase();
  const reportsJson = ct.startsWith("application/reports+json");
  const legacy = ct.startsWith("application/csp-report");
  if (!reportsJson && !legacy) return respond(400);

  let text: string;
  try { text = await req.text(); } catch (_) { return respond(400); }
  if (text.length === 0 || text.length > MAX_BYTES) return respond(400);

  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch (_) { return respond(400); }

  const headerUa = req.headers.get("user-agent");
  const rows: ReturnType<typeof row>[] = [];

  if (reportsJson) {
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > MAX_REPORTS) return respond(400);
    for (const item of parsed) {
      if (!item || typeof item !== "object") return respond(400);
      const rep = item as Record<string, unknown>;
      const body = rep["body"];
      if (!body || typeof body !== "object" || Array.isArray(body)) return respond(400);
      const cleaned = clean(rep) as Record<string, unknown>;
      rows.push(row(cleaned, cleaned["body"] as Record<string, unknown>, str(rep["user_agent"]) ?? headerUa, str(rep["type"]) ?? "csp-violation"));
    }
  } else {
    const body = (parsed && typeof parsed === "object") ? (parsed as Record<string, unknown>)["csp-report"] : null;
    if (!body || typeof body !== "object" || Array.isArray(body)) return respond(400);
    const cleaned = clean(parsed) as Record<string, unknown>;
    rows.push(row(cleaned, cleaned["csp-report"] as Record<string, unknown>, headerUa, "csp-violation"));
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { error } = await sb.from("csp_reports").insert(rows);
  if (error) return respond(500);
  return respond(204);
});
