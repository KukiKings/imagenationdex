// SIINDEX Voice agent: Instant Voice Clone from introduction audio (Path A).
// Exact match: chat TTS voice_id === intro speaker.
// Uses existing ELEVENLABS_API_KEY. Protected by SIINDEX_VOICE_SETUP_TOKEN.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.95.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ELEVENLABS_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const SETUP_TOKEN = Deno.env.get("SIINDEX_VOICE_SETUP_TOKEN") || "";
// Prefer clean speech sample; fall back to full intro video (ElevenLabs accepts media)
const SAMPLE_URL = Deno.env.get("SIINDEX_VOICE_SAMPLE_URL") ||
  "https://imagenationdex.com/videos/siindex-01-name-intro.mp4";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json({ error: "method_not_allowed" }, { status: 405 });
  }
  if (!SETUP_TOKEN || req.headers.get("x-siindex-setup-token") !== SETUP_TOKEN) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!ELEVENLABS_KEY) {
    return Response.json({ error: "voice_provider_not_configured" }, { status: 503 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const correlationId = crypto.randomUUID();

  let sample: ArrayBuffer;
  try {
    const media = await fetch(SAMPLE_URL, { signal: AbortSignal.timeout(90_000) });
    if (!media.ok) {
      return Response.json(
        { error: "sample_fetch_failed", status: media.status, url: SAMPLE_URL },
        { status: 502 },
      );
    }
    sample = await media.arrayBuffer();
  } catch (error) {
    return Response.json(
      { error: "sample_fetch_error", detail: String(error) },
      { status: 502 },
    );
  }

  const form = new FormData();
  form.append("name", "SIINDEX Public Intro");
  form.append(
    "files",
    new Blob([sample], { type: "audio/mpeg" }),
    "siindex-intro-ivc-sample.mp4",
  );
  form.append(
    "description",
    "SIINDEX website voice — Instant Voice Clone of public introduction (Path A exact match)",
  );
  // Strip bed/noise so clone locks on speech, not city ambience
  form.append("remove_background_noise", "true");

  let created: Record<string, unknown> = {};
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      signal: AbortSignal.timeout(180_000),
      headers: { "xi-api-key": ELEVENLABS_KEY },
      body: form,
    });
    created = await res.json().catch(() => ({}));
    if (!res.ok) {
      await admin.from("security_events").insert({
        tier: "T1",
        zone: "siindex_voice_setup_error",
        correlation_id: correlationId,
        description: "SIINDEX intro voice clone failed",
        detail: { status: res.status, body: created },
      });
      return Response.json(
        { error: "clone_failed", provider_status: res.status, body: created },
        { status: 502 },
      );
    }
  } catch (error) {
    return Response.json(
      { error: "clone_error", detail: String(error) },
      { status: 502 },
    );
  }

  const voiceId = String(created.voice_id || created.voiceId || "").trim();
  if (!voiceId) {
    return Response.json({ error: "no_voice_id", body: created }, { status: 502 });
  }

  // Prefer env override path for ops that set secrets; always write DB for runtime resolve
  const { error: upsertError } = await admin.from("siindex_runtime_config").upsert({
    key: "elevenlabs_voice_id",
    value: voiceId,
    updated_at: new Date().toISOString(),
  });

  await admin.from("security_events").insert({
    tier: "T0",
    zone: "siindex_voice_setup_success",
    correlation_id: correlationId,
    description: "SIINDEX intro IVC stored for website TTS",
    detail: {
      voice_id_suffix: voiceId.slice(-6),
      sample_url: SAMPLE_URL,
      config_write_ok: !upsertError,
      config_error: upsertError?.message || null,
    },
  });

  return Response.json({
    ok: true,
    voice_id: voiceId,
    correlation_id: correlationId,
    config_write_ok: !upsertError,
    next:
      "Set ELEVENLABS_VOICE_ID to this voice_id if DB config table missing; redeploy voice-tts; ear-test intro vs chat.",
  });
});
