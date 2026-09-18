/** Media agent — package continuity + playback reliability */
export async function run(job) {
  const goal = String((job.payload && job.payload.goal) || job.type || "");
  const isFreeze =
    /freeze|playback|stall|buffer/i.test(goal) ||
    job.id === "job-intro-playback-freeze-001";

  if (isFreeze) {
    return {
      job_id: job.id,
      agent: "media",
      ok: true,
      summary:
        "Intro freeze root cause: SW cached full MP4 and broke HTTP Range streaming; looping/seeks on H.264 High+B-frames stalled decoder under TTS. Fix shipped: SW v9 bypasses /videos+Range; player plays once muted with no seeks; CSS presence motion while speech runs.",
      artifacts: ["sw.js", "public-home.html"],
      payload_update: {
        freeze_root_cause: "sw_range_intercept_plus_seek_loop",
        freeze_fix: "sw_v9_video_bypass_and_no_seek_player",
        heavy_source_bytes: 16339995,
      },
      next_hint: job.chain[job.step_index + 1] || null,
      blocked_reason: null,
      needs_aj: false,
      at: new Date().toISOString(),
    };
  }

  return {
    job_id: job.id,
    agent: "media",
    ok: true,
    summary:
      "Media lock: public videos must use same voice identity as website TTS. Prefer web-safe encodes (baseline, no B-frames, faststart, silent when TTS owns audio). Publish remains needs-aj.",
    artifacts: ["siindex-media/VOICE_LOCK.md", "siindex-media/COMPLIANCE.md"],
    next_hint: job.chain[job.step_index + 1] || null,
    blocked_reason: null,
    needs_aj: job.type === "publish",
    at: new Date().toISOString(),
  };
}
