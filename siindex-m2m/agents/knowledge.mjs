/**
 * Knowledge Agent — Stage 1
 * Reads only approved public doctrine paths / live-status style facts from job payload.
 * Does not invent live products or licences.
 */
export async function run(job) {
  const goal = job.payload?.goal || job.envelope?.goal || "knowledge pass";
  const refs = [
    "siindex/SOUL.md",
    "siindex/AGENTS.md",
    "public live-status: Visitor Mode typed+spoken live; accounts/wallets/payments not live",
    "genesis USD 0.24 reference only",
    "pilot target 24 Feb 2027 — target not guarantee",
  ];

  return {
    job_id: job.id,
    agent: "knowledge",
    ok: true,
    summary:
      "Knowledge pack attached for internal draft only. Live boundaries preserved (no wallets/payments/onboarding claimed).",
    artifacts: refs,
    payload_update: {
      knowledge_refs: refs,
      knowledge_note:
        "SI not AI; brand IN$DEX first; registration in progress Cook Islands; no invented licences.",
      goal,
    },
    next_hint: job.chain[job.step_index + 1] || null,
    blocked_reason: null,
    needs_aj: false,
    at: new Date().toISOString(),
  };
}
