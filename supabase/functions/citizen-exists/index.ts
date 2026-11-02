/**
 * citizen-exists — pre-OTP "does a citizen exist for this phone" check.
 * Returns { exists: boolean } and nothing else. No citizen data leaves this function.
 * Uses service_role server-side. Same phone rule as phone-normalize.js:
 * strip non-digits, reject under ten digits (400, not a silent false).
 *
 * KNOWN RISK: a public yes/no on phone numbers is an enumeration oracle. Mitigation here:
 * durable per-IP rate limit in Upstash Redis, key = IP + UTC day, rejects after 20 checks
 * per IP per day. Fails CLOSED: if Upstash is not configured or unreachable the request is
 * refused. Required secrets: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.95.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MIN_DIGITS = 10;
const DAILY_LIMIT = 20;     // checks per IP per UTC day
const UPSTASH_URL = Deno.env.get("UPSTASH_REDIS_REST_URL");
const UPSTASH_TOKEN = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

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

async function upstash(cmd: (string | number)[]) {
  const r = await fetch(UPSTASH_URL!, {
    method: "POST",
    headers: { Authorization: "Bearer " + UPSTASH_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error("upstash_" + r.status);
  return (await r.json()).result;
}

// Returns "ok", "limited" or "unavailable". Unavailable means refuse (fail closed).
async function checkLimit(ip: string): Promise<"ok" | "limited" | "unavailable"> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return "unavailable";
  try {
    const day = new Date().toISOString().slice(0, 10);
    const key = "citizen-exists:" + ip + ":" + day;
    const n = Number(await upstash(["INCR", key]));
    if (n === 1) await upstash(["EXPIRE", key, 90000]);
    return n > DAILY_LIMIT ? "limited" : "ok";
  } catch (_) { return "unavailable"; }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return json(req, 405, { error: "method_not_allowed" });
  if (!allowedOrigin(req.headers.get("Origin"))) return json(req, 403, { error: "forbidden" });

  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const lim = await checkLimit(ip);
  if (lim === "limited") return json(req, 429, { error: "rate_limited" });
  if (lim === "unavailable") return json(req, 503, { error: "unavailable" });

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
