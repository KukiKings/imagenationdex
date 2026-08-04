import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.95.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ELEVENLABS_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const VOICE_ID = Deno.env.get("ELEVENLABS_VOICE_ID") || "19STyYD15bswVz51nqLf";
const MODEL_ID = "eleven_flash_v2_5";
const OUTPUT_FORMAT = "pcm_24000";

function allowedOrigin(origin: string | null): string {
  if (!origin) return "https://imagenationdex.com";
  try {
    const host = new URL(origin).hostname;
    if (
      host === "imagenationdex.com" ||
      host === "www.imagenationdex.com" ||
      host.endsWith(".vercel.app")
    ) return origin;
  } catch (_) {}
  return "https://imagenationdex.com";
}

function cors(req: Request) {
  return {
    "Access-Control-Allow-Origin": allowedOrigin(req.headers.get("Origin")),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Expose-Headers":
      "X-Siindex-Correlation-Id, X-Siindex-Audio-Format, X-Siindex-Voice-Model",
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

function aalFromJwt(jwt: string): string | null {
  try {
    const payload = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(payload + "=".repeat((4 - payload.length % 4) % 4)));
    return decoded.aal ?? null;
  } catch (_) {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  const correlationId = crypto.randomUUID();
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, 405, { error: "method_not_allowed" }, correlationId);

  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!jwt) return json(req, 401, { error: "not_authenticated" }, correlationId);

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(jwt);
  if (userError || !userData.user) return json(req, 401, { error: "not_authenticated" }, correlationId);

  const authUserId = userData.user.id;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: founder } = await admin
    .from("founder_authority")
    .select("auth_user_id")
    .eq("auth_user_id", authUserId)
    .is("revoked_at", null)
    .maybeSingle();
  if (!founder) return json(req, 403, { error: "founder_required" }, correlationId);
  if (aalFromJwt(jwt) !== "aal2") return json(req, 403, { error: "step_up_required" }, correlationId);

  let text = "";
  try {
    const body = await req.json();
    text = String(body?.text || "").trim();
  } catch (_) {
    return json(req, 400, { error: "invalid_json" }, correlationId);
  }
  if (!text) return json(req, 400, { error: "text_required" }, correlationId);
  if (text.length > 2000) return json(req, 413, { error: "text_too_long", max_characters: 2000 }, correlationId);
  if (!ELEVENLABS_KEY) return json(req, 503, { error: "voice_provider_not_configured" }, correlationId);

  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count } = await admin
    .from("security_events")
    .select("id", { count: "exact", head: true })
    .eq("zone", "siindex_founder_voice_tts")
    .eq("detail->>auth_user_id", authUserId)
    .gte("created_at", oneMinuteAgo);
  if ((count || 0) >= 12) {
    await admin.from("security_events").insert({
      tier: "T1",
      zone: "siindex_founder_voice_rate_limited",
      correlation_id: correlationId,
      description: "Founder Voice Room TTS request refused by the per-minute safety limit.",
      detail: { auth_user_id: authUserId, requests_seen: count },
    });
    return json(req, 429, { error: "rate_limited", retry_after_seconds: 60 }, correlationId);
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
      zone: "siindex_founder_voice_provider_error",
      correlation_id: correlationId,
      description: "Founder Voice Room could not reach the configured voice provider.",
      detail: { auth_user_id: authUserId, error: String(error) },
    });
    return json(req, 502, { error: "voice_provider_unavailable" }, correlationId);
  }

  if (!provider.ok || !provider.body) {
    await admin.from("security_events").insert({
      tier: "T1",
      zone: "siindex_founder_voice_provider_error",
      correlation_id: correlationId,
      description: "Founder Voice Room voice provider returned an error.",
      detail: {
        auth_user_id: authUserId,
        provider_status: provider.status,
        provider_request_id: provider.headers.get("request-id"),
        model_id: MODEL_ID,
      },
    });
    return json(req, 502, { error: "voice_provider_error", provider_status: provider.status }, correlationId);
  }

  await admin.from("security_events").insert({
    tier: "T0",
    zone: "siindex_founder_voice_tts",
    correlation_id: correlationId,
    description: "Founder Voice Room generated one authenticated spoken response.",
    detail: {
      auth_user_id: authUserId,
      characters: text.length,
      model_id: MODEL_ID,
      output_format: OUTPUT_FORMAT,
    },
  });

  return new Response(provider.body, {
    status: 200,
    headers: {
      ...cors(req),
      "Content-Type": "audio/pcm;rate=24000",
      "Cache-Control": "no-store",
      "X-Siindex-Correlation-Id": correlationId,
      "X-Siindex-Audio-Format": OUTPUT_FORMAT,
      "X-Siindex-Voice-Model": MODEL_ID,
      "X-Content-Type-Options": "nosniff",
    },
  });
});
