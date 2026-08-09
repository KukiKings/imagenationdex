/** Voice agent — Path A (exact intro = chat) */
export async function run(job) {
  return {
    job_id: job.id,
    agent: "voice",
    ok: true,
    summary:
      "Path A ready. Clean speech sample extracted from intro (45s mono, highpass+loudnorm, 192kbps MP3 + WAV). IVC setup function prefers clean sample with MP4 fallback; TTS resolves env→DB→fallback with turbo_v2_5. Setup still 404 until Supabase deploy.",
    artifacts: [
      "supabase/functions/siindex-website-voice-setup/index.ts",
      "supabase/functions/siindex-website-voice-tts/index.ts",
      "siindex-operating/RESEARCH-voice-exact-match.md",
      "siindex-operating/VOICE_EXACT_MATCH_STATUS.md",
    ],
    payload_update: {
      clean_sample_ready: true,
      clean_sample_duration_s: 45.12,
      preferred_sample:
        "https://imagenationdex.com/videos/siindex-intro-speech-clean.mp3",
      fallback_sample:
        "https://imagenationdex.com/videos/siindex-01-name-intro.mp4",
    },
    next_hint: job.chain[job.step_index + 1] || null,
    blocked_reason: null,
    needs_aj: false,
    at: new Date().toISOString(),
  };
}
