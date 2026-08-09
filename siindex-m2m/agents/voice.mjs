/** Voice agent — Path A prep (exact intro match) */
export async function run(job) {
  return {
    job_id: job.id,
    agent: "voice",
    ok: true,
    summary:
      "Voice package ready: intro sample path, IVC setup function in repo, TTS resolve order env→DB→fallback. Live setup still 404 until deploy.",
    artifacts: [
      "supabase/functions/siindex-website-voice-setup/index.ts",
      "supabase/functions/siindex-website-voice-tts/index.ts",
      "siindex-operating/RESEARCH-voice-exact-match.md",
    ],
    next_hint: job.chain[job.step_index + 1] || null,
    blocked_reason: null,
    needs_aj: false,
    at: new Date().toISOString(),
  };
}
