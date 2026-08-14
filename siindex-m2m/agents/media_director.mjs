/**
 * Media Director — Stage 2
 * Plans campaign format and schedule. Draft only. Never publishes.
 */
export async function run(job) {
  const goal =
    job.payload?.goal ||
    "Draft SIINDEX Visitor Mode explainer (internal only)";

  const plan = {
    campaign_code: "visitor-mode-explainer-draft",
    audience: "Pacific-first visitors, curious founders, partners (info only)",
    formats: ["60s_script", "faq_atoms", "social_short_copy"],
    must_include: [
      "IN$DEX brand first",
      "SIINDEX pronounced Sinn-dex",
      "SI not AI",
      "Visitor Mode live; accounts/wallets/payments not live",
      "USD 0.24 genesis reference only",
      "Pilot target 24 Feb 2027 — target not guarantee",
      "Cook Islands registration in progress — no invented licence",
    ],
    must_exclude: [
      "live wallets",
      "live remittance",
      "citizen onboarding live",
      "token trading live",
      "government digital residency live",
      "publish without AJ",
    ],
    classification: "internal_draft",
    publication: "blocked_until_aj_or_mandate",
  };

  return {
    job_id: job.id,
    agent: "media_director",
    ok: true,
    summary:
      "Media Director plan ready: Visitor Mode explainer, multi-format, internal_draft only.",
    artifacts: ["siindex-m2m/STAGE2.md"],
    payload_update: { media_plan: plan, goal },
    next_hint: job.chain[job.step_index + 1] || null,
    blocked_reason: null,
    needs_aj: false,
    at: new Date().toISOString(),
  };
}
