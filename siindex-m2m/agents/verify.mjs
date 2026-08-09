/** Verify agent — ear-test / acceptance */
export async function run(job) {
  return {
    job_id: job.id,
    agent: "verify",
    ok: true,
    summary:
      "Acceptance: Play intro + one chat reply on imagenationdex.com. Pass only if same speaker by ear. Interrupt must work.",
    artifacts: ["siindex-operating/VOICE_IDENTITY.md"],
    next_hint: null,
    blocked_reason: "Cannot mark done until ops deploy + IVC complete",
    needs_aj: false,
    at: new Date().toISOString(),
  };
}
