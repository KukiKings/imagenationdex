import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.95.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ELEVENLABS_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const VOICE_ID = Deno.env.get("ELEVENLABS_VOICE_ID") || "19STyYD15bswVz51nqLf";
const MODEL_ID = "eleven_flash_v2_5";
const OUTPUT_FORMAT = "pcm_24000";
const ZONE = "siindex_private_qa_voice_tts";
const QA_EXPIRES_AT = Date.parse("2026-08-05T00:00:00Z");

function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;
  try {
    const host = new URL(origin).hostname.toLowerCase();
    return (host.startsWith("imagenationdex-") && host.endsWith("-kukikings.vercel.app")) ||
      host === "localhost" ||
      host === "127.0.0.1";
  } catch (_) {
    return false;
  }
}

function cors(req: Request) {
  const origin = req.headers.get("Origin");
  return {
    "Access-Control-Allow-Origin": origin && isAllowedOrigin(origin)
      ? origin
      : "https://imagenationdex.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-siindex-visitor-id, x-siindex-provider-consent, x-siindex-test-mode",
    "Access-Control-Expose-Headers":
      "X-Siindex-Correlation-Id, X-Siindex-Audio-Format, X-Siindex-Voice-Model",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(
  req: Request,
  status: number,
  body: Record<string, unknown>,
  correlationId: string,
) {
  return new Response(
    JSON.stringify({ ...body, correlation_id: correlationId }),
    {
      status,
      headers: {
        ...cors(req),
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Siindex-Correlation-Id": correlationId,
      },
    },
  );
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
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function allowed(
  admin: ReturnType<typeof createClient>,
  hash: string,
) {
  const minuteAgo = new Date(Date.now() - 60_000).toISOString();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const [minute, day] = await Promise.all([
    admin.from("security_events").select("id", { count: "exact", head: true })
      .eq("zone", ZONE).eq("detail->>visitor_hash", hash)
      .gte("created_at", minuteAgo),
    admin.from("security_events").select("id", { count: "exact", head: true })
      .eq("zone", ZONE).eq("detail->>visitor_hash", hash)
      .gte("created_at", dayAgo),
  ]);
  if (minute.error || day.error) throw new Error("rate_limit_unavailable");
  return (minute.count || 0) < 6 && (day.count || 0) < 60;
}

Deno.serve(async (req: Request) => {
  const correlationId = crypto.randomUUID();
  if (Date.now() >= QA_EXPIRES_AT) {
    return json(req, 403, { error: "qa_window_closed" }, correlationId);
  }
  if (!isAllowedOrigin(req.headers.get("Origin"))) {
    return json(req, 403, { error: "origin_not_allowed" }, correlationId);
  }
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors(req) });
  }
  if (req.method !== "POST") {
    return json(req, 405, { error: "method_not_allowed" }, correlationId);
  }
  if (req.headers.get("x-siindex-test-mode") !== "aj-private-qa-v1") {
    return json(req, 403, { error: "test_mode_required" }, correlationId);
  }
  if (req.headers.get("x-siindex-provider-consent") !== "accepted") {
    return json(
      req,
      403,
      { error: "provider_consent_required" },
      correlationId,
    );
  }
  if (!ELEVENLABS_KEY) {
    return json(
      req,
      503,
      { error: "voice_provider_not_configured" },
      correlationId,
    );
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const hash = await visitorHash(req);
  try {
    if (!await allowed(admin, hash)) {
      return json(
        req,
        429,
        { error: "rate_limited", retry_after_seconds: 60 },
        correlationId,
      );
    }
  } catch (_) {
    return json(
      req,
      503,
      { error: "rate_limit_unavailable" },
      correlationId,
    );
  }

  let text = "";
  try {
    const body = await req.json();
    text = String(body?.text || "").trim();
  } catch (_) {
    return json(req, 400, { error: "invalid_json" }, correlationId);
  }
  if (!text) return json(req, 400, { error: "text_required" }, correlationId);
  if (text.length > 1400) {
    return json(
      req,
      413,
      { error: "text_too_long", max_characters: 1400 },
      correlationId,
    );
  }

  const { error: auditError } = await admin.from("security_events").insert({
    tier: "T0",
    zone: ZONE,
    correlation_id: correlationId,
    description: "Private AJ QA voice request accepted; response text was not stored.",
    detail: {
      visitor_hash: hash,
      characters: text.length,
      model_id: MODEL_ID,
      output_format: OUTPUT_FORMAT,
      text_stored: false,
      audio_stored: false,
    },
  });
  if (auditError) {
    return json(
      req,
      503,
      { error: "rate_limit_unavailable" },
      correlationId,
    );
  }

  let provider: Response;
  try {
    provider = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream?output_format=${OUTPUT_FORMAT}`,
      {
        method: "POST",
        signal: AbortSignal.timeout(20_000),
        headers: {
          "xi-api-key": ELEVENLABS_KEY,
          "Content-Type": "application/json",
          "Accept": "audio/pcm",
        },
        body: JSON.stringify({
          text,
          model_id: MODEL_ID,
          apply_text_normalization: "auto",
          voice_settings: {
            stability: 0.42,
            similarity_boost: 0.83,
            style: 0,
            use_speaker_boost: true,
            speed: 0.88,
          },
        }),
      },
    );
  } catch (error) {
    await admin.from("security_events").insert({
      tier: "T1",
      zone: "siindex_private_qa_voice_tts_provider_error",
      correlation_id: correlationId,
      description: "Private AJ QA SIINDEX could not reach the voice provider.",
      detail: { visitor_hash: hash, error: String(error) },
    });
    return json(
      req,
      502,
      { error: "voice_provider_unavailable" },
      correlationId,
    );
  }

  if (!provider.ok || !provider.body) {
    await admin.from("security_events").insert({
      tier: "T1",
      zone: "siindex_private_qa_voice_tts_provider_error",
      correlation_id: correlationId,
      description: "Private AJ QA SIINDEX voice provider returned an error.",
      detail: {
        visitor_hash: hash,
        provider_status: provider.status,
        provider_request_id: provider.headers.get("request-id"),
        model_id: MODEL_ID,
      },
    });
    return json(
      req,
      502,
      { error: "voice_provider_error", provider_status: provider.status },
      correlationId,
    );
  }

  await admin.from("security_events").insert({
    tier: "T0",
    zone: "siindex_private_qa_voice_tts_success",
    correlation_id: correlationId,
    description: "Private AJ QA SIINDEX generated one spoken reply.",
    detail: {
      visitor_hash: hash,
      model_id: MODEL_ID,
      output_format: OUTPUT_FORMAT,
      audio_stored: false,
    },
  });

  return new Response(provider.body, {
    headers: {
      ...cors(req),
      "Content-Type": "audio/pcm;rate=24000",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Siindex-Correlation-Id": correlationId,
      "X-Siindex-Audio-Format": OUTPUT_FORMAT,
      "X-Siindex-Voice-Model": MODEL_ID,
    },
  });
});
