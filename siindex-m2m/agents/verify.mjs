/** Verify agent — acceptance / independent check */
export async function run(job) {
  const isStage2 =
    job.type === "stage2-media-draft-chain" ||
    (job.chain || []).includes("media_director");

  if (isStage2) {
    const hasPlan = !!job.payload?.media_plan;
    const hasScript = !!(job.payload?.script_draft && job.payload.script_draft.body);
    const factsOk = job.payload?.fact_report?.ok === true;
    const qaOk = job.payload?.media_qa?.ok === true;
    const noPublish = job.payload?.media_qa?.publication_allowed === false;
    const hasEvidence = !!job.payload?.evidence;
    const ok = hasPlan && hasScript && factsOk && qaOk && noPublish && hasEvidence;
    return {
      job_id: job.id,
      agent: "verify",
      ok,
      summary: ok
        ? "Stage 2 verify PASS: draft media package complete. Not published — AJ review only."
        : "Stage 2 verify FAIL: incomplete media draft package or publish flag set.",
      artifacts: ["siindex-m2m/STAGE2.md"],
      next_hint: null,
      blocked_reason: ok ? null : "Stage 2 media draft incomplete",
      needs_aj: false,
      at: new Date().toISOString(),
    };
  }

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
