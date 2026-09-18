/**
 * Evidence Agent — Stage 1
 * Records durable evidence receipt for the chain (local bus + optional Supabase later).
 */
export async function run(job) {
  const refs = job.payload?.knowledge_refs || job.last_result?.artifacts || [];
  const evidence = {
    task_id: job.id,
    agent: "evidence",
    kind: "chain_receipt",
    summary: "Stage 1 evidence packet — internal draft only",
    source_refs: refs,
    policy: job.payload?.policy || null,
    at: new Date().toISOString(),
  };

  return {
    job_id: job.id,
    agent: "evidence",
    ok: true,
    summary: "Evidence receipt written for draft chain. Classification: internal_draft.",
    artifacts: ["agent_evidence", JSON.stringify(evidence)],
    payload_update: { evidence },
    next_hint: job.chain[job.step_index + 1] || null,
    blocked_reason: null,
    needs_aj: false,
    at: new Date().toISOString(),
  };
}
