/** Voice agent — Path A (chat TTS) + pronunciation lock */
export async function run(job) {
  return {
    job_id: job.id,
    agent: "voice",
    ok: true,
    summary:
      "Chat TTS must speak Sinn-dex only (never Sign-dex). Client lock: js/siindex-pronunciation-fix.js + siindex-speak-core pronunciation(). Display label may remain Syn-dex. IVC voice_id iBEZxKDWKDCs8WbjiLKK. Intro MP4 native A/V only — baked audio not re-exported (needs AJ for true lip-sync).",
    artifacts: [
      "js/siindex-pronunciation-fix.js",
      "siindex-speak-core.js",
      "supabase/functions/siindex-website-voice-tts/index.ts",
      "siindex-operating/VOICE_EXACT_MATCH_STATUS.md",
    ],
    payload_update: {
      pronunciation_spoken: "Sinn-dex",
      pronunciation_display: "Syn-dex",
      never: "Sign-dex",
      elevenlabs_voice_id: "iBEZxKDWKDCs8WbjiLKK",
      intro_lip_sync_reexport: "needs-aj",
      path_a_deployed: true,
    },
    next_hint: job.chain[job.step_index + 1] || null,
    blocked_reason: null,
    needs_aj: job.type === "publish" || job.id === "job-media-voice-lock-001",
    at: new Date().toISOString(),
  };
}
