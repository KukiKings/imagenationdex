/** Context agent — loads mission constraints for the job */
export async function run(job) {
  return {
    job_id: job.id,
    agent: "context",
    ok: true,
    summary:
      "Loaded SIINDEX constraints: SI not AI; brand IN$DEX first; Path A intro=chat voice; no production without AJ.",
    artifacts: [
      "siindex-operating/VOICE_IDENTITY.md",
      "siindex-operating/OPERATING_CHARTER.md",
    ],
    next_hint: job.chain[job.step_index + 1] || null,
    blocked_reason: null,
    needs_aj: false,
    at: new Date().toISOString(),
  };
}
