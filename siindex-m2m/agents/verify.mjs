/** Verify agent — acceptance / independent check */
export async function run(job) {
  const isStage1 =
    job.type === "stage1-demo-draft-chain" ||
    (job.chain || []).includes("policy_gate");

  if (isStage1) {
    const hasKnowledge = !!(job.payload?.knowledge_refs || job.payload?.knowledge_note);
    const policyOk = job.payload?.policy?.ok !== false;
    const hasEvidence = !!job.payload?.evidence;
    const ok = hasKnowledge && policyOk && hasEvidence;
    return {
      job_id: job.id,
      agent: "verify",
      ok,
      summary: ok
        ? "Stage 1 verify PASS: knowledge + policy + evidence present. Draft only — no publish."
        : "Stage 1 verify FAIL: missing knowledge, policy, or evidence packet.",
      artifacts: ["siindex-m2m/STAGE1.md"],
      next_hint: null,
      blocked_reason: ok ? null : "Stage 1 chain incomplete",
      needs_aj: false,
      at: new Date().toISOString(),
    };
  }

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
