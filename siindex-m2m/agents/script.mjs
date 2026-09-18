/**
 * Script Agent — Stage 2
 * Writes draft scripts from approved knowledge + media plan. No publish.
 */
export async function run(job) {
  const plan = job.payload?.media_plan || {};
  const knowledgeNote = job.payload?.knowledge_note || "";
  const goal = job.payload?.goal || plan.campaign_code || "draft script";

  const script60 = [
    "Kia orana. I am SIINDEX — pronounced Sinn-dex.",
    "I am SI, not AI: structured intelligence for Image Nation DEx — brand first, IN$DEX.",
    "Right now, Visitor Mode is live: you can type or speak, use Interview, Present, and FAQ.",
    "Accounts, wallets, payments, and remittance are not live. We do not invent products.",
    "Genesis reference is USD 0.24 only — not a live market price.",
    "Pilot target is 24 February 2027 — a target, not a guarantee.",
    "Company registration is in progress in the Cook Islands. No licence number is claimed until issued.",
    "Ask me anything about what is live today. I stay honest.",
  ].join(" ");

  const draft = {
    format: "60s_script",
    title: "SIINDEX Visitor Mode — honest intro",
    body: script60,
    pronunciation_note: "TTS must say Sinn-dex, never Sign-dex",
    classification: "internal_draft",
    source_refs: job.payload?.knowledge_refs || [
      "siindex/SOUL.md",
      "public live-status",
    ],
    knowledge_note: knowledgeNote,
    goal,
  };

  return {
    job_id: job.id,
    agent: "script",
    ok: true,
    summary: "60s draft script written. Classification: internal_draft. Not for publication.",
    artifacts: ["draft:60s_script"],
    payload_update: { script_draft: draft },
    next_hint: job.chain[job.step_index + 1] || null,
    blocked_reason: null,
    needs_aj: false,
    at: new Date().toISOString(),
  };
}
