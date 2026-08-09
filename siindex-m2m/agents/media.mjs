/** Media agent — package continuity */
export async function run(job) {
  return {
    job_id: job.id,
    agent: "media",
    ok: true,
    summary:
      "Media lock: public videos must use same voice identity as website TTS. Publish remains needs-aj.",
    artifacts: ["siindex-media/VOICE_LOCK.md", "siindex-media/COMPLIANCE.md"],
    next_hint: job.chain[job.step_index + 1] || null,
    blocked_reason: null,
    needs_aj: job.type === "publish",
    at: new Date().toISOString(),
  };
}
