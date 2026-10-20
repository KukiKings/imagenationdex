// SIINDEX real-time voice: mints a short-lived OpenAI Realtime client secret for the browser.
// The long-lived key (REALTIME_API_KEY) never leaves this function. Audio goes browser -> OpenAI
// over WebRTC; this function never sees or stores audio or transcripts.
// Gates (same family as siindex-website-voice-tts): allowed origin, provider consent header,
// per-visitor rate limit with an audit row in security_events.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.95.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const REALTIME_KEY = Deno.env.get("REALTIME_API_KEY");
const MODEL = Deno.env.get("REALTIME_MODEL") || "gpt-realtime-2.1";
// OpenAI built-in voice. The locked ElevenLabs voice (iBEZxKDWKDCs8WbjiLKK) is NOT available here.
const VOICE = Deno.env.get("REALTIME_VOICE") || "marin";
const ZONE = "siindex_realtime_token";

const INSTRUCTIONS = [
  "You are SIINDEX (spoken Sinn-dex), the founder's operations voice for IN$DEX. Speak briefly and plainly, in Australian English.",
  "You are a conversation only. You have no tools and cannot send, pay, issue domains, change files or run anything. Never say you did.",
  "Board actions need the word COMPUTER from the founder. Anything sensitive (sending, paying, issuing a domain, submitting a form) needs the founder to say PROCEED aloud, and even then you only restate the request; a human-supervised agent carries it out later.",
  "Facts you may state: INDEX LIMITED is not registered and has no certificate; the Cook Islands Form A-1 is in progress. Pay, wallets, remittance, token distribution and domain issuance are not live. .INDX is reserved, not issued. The pilot target is 24 February 2027.",
  "If you do not know something, say you don't know. Do not invent prices, balances, dates, customers or capabilities.",
].join(" ");

function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;
  try {
    const host = new URL(origin).hostname.toLowerCase();
    return host === "imagenationdex.com" ||
      host === "www.imagenationdex.com" ||
      host === "imagenationdex.vercel.app" ||
      host === "imagenationdex-kukikings.vercel.app" ||
      (host.startsWith("imagenationdex-") && host.endsWith("-kukikings.vercel.app"));
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
      "authorization, apikey, content-type, x-siindex-visitor-id, x-siindex-provider-consent",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(req: Request, status: number, body: Record<string, unknown>, correlationId: string) {
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
  const source = forwarded ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-siindex-visitor-id") ||
    "unknown";
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${source}|${SERVICE_KEY.slice(0, 32)}`),
  );
  return Array.from(new Uint8Array(digest)).map((v) => v.toString(16).padStart(2, "0")).join("");
}

// Each session costs money: tighter than the TTS limits.
async function allowed(admin: ReturnType<typeof createClient>, hash: string) {
  const minuteAgo = new Date(Date.now() - 60_000).toISOString();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const [minute, day] = await Promise.all([
    admin.from("security_events").select("id", { count: "exact", head: true })
      .eq("zone", ZONE).eq("detail->>visitor_hash", hash).gte("created_at", minuteAgo),
    admin.from("security_events").select("id", { count: "exact", head: true })
      .eq("zone", ZONE).eq("detail->>visitor_hash", hash).gte("created_at", dayAgo),
  ]);
  if (minute.error || day.error) throw new Error("rate_limit_unavailable");
  return (minute.count || 0) < 3 && (day.count || 0) < 20;
}

Deno.serve(async (req: Request) => {
  const correlationId = crypto.randomUUID();
  if (!isAllowedOrigin(req.headers.get("Origin"))) {
    return json(req, 403, { error: "origin_not_allowed" }, correlationId);
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, 405, { error: "method_not_allowed" }, correlationId);
  if (req.headers.get("x-siindex-provider-consent") !== "accepted") {
    return json(req, 403, { error: "provider_consent_required" }, correlationId);
  }
  if (!REALTIME_KEY) {
    return json(req, 503, { error: "voice_provider_not_configured" }, correlationId);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const hash = await visitorHash(req);
  try {
    if (!await allowed(admin, hash)) {
      return json(req, 429, { error: "rate_limited", retry_after_seconds: 60 }, correlationId);
    }
  } catch (_) {
    return json(req, 503, { error: "rate_limit_unavailable" }, correlationId);
  }

  const { error: auditError } = await admin.from("security_events").insert({
    tier: "T0",
    zone: ZONE,
    correlation_id: correlationId,
    description: "SIINDEX real-time voice session requested; audio and transcripts are not stored by SIINDEX.",
    detail: { visitor_hash: hash, model: MODEL, voice: VOICE, audio_stored: false, text_stored: false },
  });
  if (auditError) return json(req, 503, { error: "rate_limit_unavailable" }, correlationId);

  let upstream: Response;
  try {
    upstream = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${REALTIME_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Safety-Identifier": hash.slice(0, 32),
      },
      body: JSON.stringify({
        expires_after: { anchor: "created_at", seconds: 60 },
        session: {
          type: "realtime",
          model: MODEL,
          instructions: INSTRUCTIONS,
          audio: { output: { voice: VOICE } },
        },
      }),
    });
  } catch (_) {
    return json(req, 502, { error: "voice_provider_unreachable" }, correlationId);
  }
  if (!upstream.ok) {
    // Do not forward provider error bodies to the browser.
    return json(req, 502, { error: "voice_provider_error", provider_status: upstream.status }, correlationId);
  }
  const data = await upstream.json();
  const secret = data?.value || data?.client_secret?.value;
  if (!secret) return json(req, 502, { error: "voice_provider_error" }, correlationId);
  return json(req, 200, {
    client_secret: secret,
    expires_at: data?.expires_at ?? null,
    model: MODEL,
    voice: VOICE,
    voice_is_locked_elevenlabs: false,
  }, correlationId);
});
