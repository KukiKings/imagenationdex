/**
 * Media QA — Stage 2
 * Quality checks on draft package. Stops before Publication.
 */
export async function run(job) {
  const checks = [];
  const script = job.payload?.script_draft;
  const facts = job.payload?.fact_report;
  const atoms = job.payload?.content_atoms;
  const plan = job.payload?.media_plan;

  checks.push({
    id: "has_plan",
    pass: !!plan,
    detail: plan ? "media_plan present" : "missing media_plan",
  });
  checks.push({
    id: "has_script",
    pass: !!(script && script.body),
    detail: script?.body ? `script ${script.body.length} chars` : "missing script",
  });
  checks.push({
    id: "facts_ok",
    pass: facts?.ok === true,
    detail: facts?.ok ? "fact_report ok" : "fact_report failed or missing",
  });
  checks.push({
    id: "atoms_present",
    pass: !!(atoms && atoms.faq_entries),
    detail: atoms ? "content_atoms present" : "missing atoms",
  });
  checks.push({
    id: "no_publish_in_chain",
    pass: !(job.chain || []).includes("publication"),
    detail: "Publication agent must not run in Stage 2",
  });
  checks.push({
    id: "classification_draft",
    pass:
      script?.classification === "internal_draft" ||
      atoms?.classification === "internal_draft",
    detail: "internal_draft classification required",
  });

  const failed = checks.filter((c) => !c.pass);
  const ok = failed.length === 0;

  return {
    job_id: job.id,
    agent: "media_qa",
    ok,
    summary: ok
      ? "Media QA PASS. Package ready for AJ review — not published."
      : `Media QA FAIL: ${failed.map((f) => f.id).join(", ")}`,
    artifacts: ["media_qa_report"],
    payload_update: {
      media_qa: { ok, checks, publication_allowed: false },
    },
    next_hint: job.chain[job.step_index + 1] || null,
    blocked_reason: ok ? null : "Media QA failed",
    needs_aj: false,
    at: new Date().toISOString(),
  };
}
