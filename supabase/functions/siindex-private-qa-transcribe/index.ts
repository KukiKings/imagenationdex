import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.95.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ELEVENLABS_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const MODEL = "scribe_v2";
const ZONE = "siindex_private_qa_voice_transcribe";
const MAX_BYTES = 5 * 1024 * 1024;
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
    "Access-Control-Expose-Headers": "X-Siindex-Correlation-Id",
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
  return (minute.count || 0) < 8 && (day.count || 0) < 80;
}

function extensionFor(type: string) {
  if (type.includes("mp4")) return "mp4";
  if (type.includes("mpeg") || type.includes("mp3")) return "mp3";
  if (type.includes("wav")) return "wav";
  if (type.includes("ogg")) return "ogg";
  return "webm";
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
      { error: "transcription_provider_not_configured" },
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

  let audio: File | null = null;
  try {
    const body = await req.formData();
    const value = body.get("audio");
    if (value instanceof File) audio = value;
  } catch (_) {
    return json(req, 400, { error: "invalid_form_data" }, correlationId);
  }
  if (!audio || !audio.size) {
    return json(req, 400, { error: "audio_required" }, correlationId);
  }
  if (audio.size > MAX_BYTES) {
    return json(
      req,
      413,
      { error: "audio_too_large", max_bytes: MAX_BYTES },
      correlationId,
    );
  }

  const type = audio.type || "audio/webm";
  const outbound = new FormData();
  outbound.set(
    "file",
    new File([audio], `siindex-utterance.${extensionFor(type)}`, { type }),
  );
  outbound.set("model_id", MODEL);
  outbound.set("tag_audio_events", "false");
  outbound.set("timestamps_granularity", "none");

  const { error: auditError } = await admin.from("security_events").insert({
    tier: "T0",
    zone: ZONE,
    correlation_id: correlationId,
    description: "Private AJ QA transcription request accepted; raw audio was not stored.",
    detail: {
      visitor_hash: hash,
      audio_bytes: audio.size,
      audio_type: type,
      model: MODEL,
      audio_stored: false,
      transcript_stored: false,
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
    provider = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      signal: AbortSignal.timeout(30_000),
      headers: {
        "xi-api-key": ELEVENLABS_KEY,
      },
      body: outbound,
    });
  } catch (error) {
    await admin.from("security_events").insert({
      tier: "T1",
      zone: "siindex_private_qa_voice_transcribe_provider_error",
      correlation_id: correlationId,
      description: "Private AJ QA microphone could not reach the transcription provider.",
      detail: { visitor_hash: hash, error: String(error) },
    });
    return json(
      req,
      502,
      { error: "transcription_provider_unavailable" },
      correlationId,
    );
  }

  if (!provider.ok) {
    await admin.from("security_events").insert({
      tier: "T1",
      zone: "siindex_private_qa_voice_transcribe_provider_error",
      correlation_id: correlationId,
      description: "Private AJ QA transcription provider returned an error.",
      detail: { visitor_hash: hash, provider_status: provider.status, model: MODEL },
    });
    return json(
      req,
      502,
      {
        error: "transcription_provider_error",
        provider_status: provider.status,
      },
      correlationId,
    );
  }

  const result = await provider.json().catch(() => ({}));
  const transcript = String(result?.text || "").trim().slice(0, 1200);
  if (!transcript) {
    return json(req, 422, { error: "no_speech_detected" }, correlationId);
  }

  await admin.from("security_events").insert({
    tier: "T0",
    zone: "siindex_private_qa_voice_transcribe_success",
    correlation_id: correlationId,
    description: "Private AJ QA utterance transcribed; raw audio was not stored.",
    detail: {
      visitor_hash: hash,
      transcript_characters: transcript.length,
      model: MODEL,
      transcript_stored: false,
    },
  });

  return json(req, 200, { transcript, model: MODEL }, correlationId);
});
