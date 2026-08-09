/** Voice agent — Path A (exact intro = chat) */
export async function run(job) {
  return {
    job_id: job.id,
    agent: "voice",
    ok: true,
    summary:
      "Path A live: IVC voice_id iBEZxKDWKDCs8WbjiLKK, TTS + runtime deployed. Pronunciation canon Syn-dex on TTS + client. Intro MP4 still had baked Sign-dex — interim fix mutes video audio and speaks Syn-dex via website TTS (js/siindex-intro-player-honesty.js). Full lip-sync re-export remains media package needs-aj.",
    artifacts: [
      "supabase/functions/siindex-website-voice-setup/index.ts",
      "supabase/functions/siindex-website-voice-tts/index.ts",
      "js/siindex-pronunciation-fix.js",
      "js/siindex-intro-player-honesty.js",
      "siindex-operating/VOICE_EXACT_MATCH_STATUS.md",
    ],
    payload_update: {
      pronunciation_canon: "Syn-dex",
      intro_interim: "muted_visuals_plus_tts",
      intro_lip_sync_reexport: "needs-aj",
      elevenlabs_voice_id: "iBEZxKDWKDCs8WbjiLKK",
      path_a_deployed: true,
    },
    next_hint: job.chain[job.step_index + 1] || null,
    blocked_reason: null,
    needs_aj: job.type === "publish" || job.id === "job-media-voice-lock-001",
    at: new Date().toISOString(),
  };
}
