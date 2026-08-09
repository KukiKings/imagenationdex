// SIINDEX Voice agent: clone website voice from intro sample (Path A).
// Uses existing ELEVENLABS_API_KEY. Stores voice id in siindex_runtime_config.
// Protected by SIINDEX_VOICE_SETUP_TOKEN (service secret) — not public.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.95.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ELEVENLABS_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const SETUP_TOKEN = Deno.env.get("SIINDEX_VOICE_SETUP_TOKEN") || "";
const SAMPLE_URL = Deno.env.get("SIINDEX_VOICE_SAMPLE_URL") ||
  "https://imagenationdex.com/videos/siindex-01-name-intro.mp4";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!SETUP_TOKEN || req.headers.get("x-siindex-setup-token") !== SETUP_TOKEN) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!ELEVENLABS_KEY) {
    return new Response(JSON.stringify({ error: "voice_provider_not_configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const correlationId = crypto.randomUUID();

  // Fetch intro media (video or audio) as clone sample
  let sample: ArrayBuffer;
  try {
    const media = await fetch(SAMPLE_URL, { signal: AbortSignal.timeout(60_000) });
    if (!media.ok) {
      return new Response(
        JSON.stringify({ error: "sample_fetch_failed", status: media.status }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }
    sample = await media.arrayBuffer();
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "sample_fetch_error", detail: String(error) }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  const form = new FormData();
  form.append(
    "name",
    "SIINDEX Public Intro",
  );
  form.append(
    "files",
    new Blob([sample], { type: "audio/mpeg" }),
    "siindex-intro-sample.mp4",
  );
  form.append("description", "SIINDEX website voice matched to public introduction (Path A)");

  let created: { voice_id?: string; voiceId?: string } = {};
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      signal: AbortSignal.timeout(120_000),
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
      return new Response(
        JSON.stringify({ error: "clone_failed", provider_status: res.status, body: created }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "clone_error", detail: String(error) }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  const voiceId = String(created.voice_id || created.voiceId || "").trim();
  if (!voiceId) {
    return new Response(
      JSON.stringify({ error: "no_voice_id", body: created }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  const { error: upsertError } = await admin.from("siindex_runtime_config").upsert({
    key: "elevenlabs_voice_id",
    value: voiceId,
    updated_at: new Date().toISOString(),
  });
  if (upsertError) {
    return new Response(
      JSON.stringify({
        error: "config_write_failed",
        voice_id: voiceId,
        detail: upsertError.message,
        note: "Clone succeeded — set ELEVENLABS_VOICE_ID secret to this voice_id",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  await admin.from("security_events").insert({
    tier: "T0",
    zone: "siindex_voice_setup_success",
    correlation_id: correlationId,
    description: "SIINDEX website voice cloned from intro and stored in runtime config",
    detail: { voice_id_suffix: voiceId.slice(-6), sample_url: SAMPLE_URL },
  });

  return new Response(
    JSON.stringify({
      ok: true,
      voice_id: voiceId,
      correlation_id: correlationId,
      message: "Path A complete: chat TTS will use intro-matched voice after function pick-up",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
