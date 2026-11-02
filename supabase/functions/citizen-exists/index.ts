/**
 * citizen-exists — pre-OTP "does a citizen exist for this phone" check.
 * Returns { exists: boolean } and nothing else. No citizen data leaves this function.
 * Uses service_role server-side. Same phone rule as phone-normalize.js:
 * strip non-digits, reject under ten digits (400, not a silent false).
 *
 * KNOWN RISK: a public yes/no on phone numbers is an enumeration oracle. This function
 * adds a best-effort per-IP limit (in-memory, per instance) only. Add a durable limiter
 * or CAPTCHA before relying on it. NOT DEPLOYED by committing this file.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.95.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MIN_DIGITS = 10;
const LIMIT = 30;           // requests per window per IP
const WINDOW_MS = 60_000;
const hits = new Map<string, { n: number; t: number }>();

function allowedOrigin(origin: string | null) {
  if (!origin) return false;
  try {
    const h = new URL(origin).hostname.toLowerCase();
    return h === "imagenationdex.com" || h === "www.imagenationdex.com" ||
      h === "imagenationdex.vercel.app" || h === "imagenationdex-kukikings.vercel.app" ||
      (h.startsWith("imagenationdex-") && h.endsWith("-kukikings.vercel.app")) ||
      h === "localhost" || h === "127.0.0.1";
  } catch (_) { return false; }
}

function cors(req: Request) {
  const o = req.headers.get("Origin");
  return {
    "Access-Control-Allow-Origin": o && allowedOrigin(o) ? o : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    Vary: "Origin",
  };
}

function json(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(req), "Content-Type": "application/json" },
  });
}

function limited(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > WINDOW_MS) { hits.set(ip, { n: 1, t: now }); return false; }
  h.n += 1;
  return h.n > LIMIT;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return json(req, 405, { error: "method_not_allowed" });
  if (!allowedOrigin(req.headers.get("Origin"))) return json(req, 403, { error: "forbidden" });

  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  if (limited(ip)) return json(req, 429, { error: "rate_limited" });

  let phone: unknown;
  try { phone = (await req.json())?.phone; } catch (_) { return json(req, 400, { error: "invalid_phone" }); }
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.length < MIN_DIGITS) return json(req, 400, { error: "invalid_phone" });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data, error } = await sb
    .from("citizens")
    .select("id")
    .in("phone_number", ["+" + digits, digits])
    .limit(1);
  if (error) return json(req, 500, { error: "lookup_failed" });
  return json(req, 200, { exists: !!(data && data.length > 0) });
});
