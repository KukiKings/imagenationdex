/**
 * Content Atomizer — Stage 2
 * One approved draft source → many internal draft formats. No publish.
 */
export async function run(job) {
  const script = job.payload?.script_draft;
  if (!script?.body) {
    return {
      job_id: job.id,
      agent: "content_atomizer",
      ok: false,
      summary: "No script_draft to atomize",
      artifacts: [],
      payload_update: {},
      next_hint: null,
      blocked_reason: "Missing script_draft",
      needs_aj: false,
      at: new Date().toISOString(),
    };
  }

  if (job.payload?.fact_report && job.payload.fact_report.ok === false) {
    return {
      job_id: job.id,
      agent: "content_atomizer",
      ok: false,
      summary: "Refusing to atomize failed fact report",
      artifacts: [],
      payload_update: {},
      next_hint: null,
      blocked_reason: "fact_report not ok",
      needs_aj: false,
      at: new Date().toISOString(),
    };
  }

  const body = script.body;
  const atoms = {
    short_video_script: body,
    faq_entries: [
      {
        q: "What is SIINDEX?",
        a: "SIINDEX (Sinn-dex) is structured intelligence for IN$DEX — SI not AI.",
      },
      {
        q: "What is live today?",
        a: "Visitor Mode: typed and spoken chat, Interview, Present, FAQ. Accounts, wallets, and payments are not live.",
      },
      {
        q: "How do you say SIINDEX?",
        a: "Sinn-dex — never Sign-dex.",
      },
    ],
    social_post:
      "Kia orana. SIINDEX (Sinn-dex) — SI not AI. Visitor Mode is live. Wallets and payments are not. Honest by design. imagenationdex.com",
    email_blurb:
      "SIINDEX (pronounced Sinn-dex) is the public face of IN$DEX. Visitor Mode is available now. Financial products are not live yet.",
    kb_entry: {
      title: "Visitor Mode live status",
      body: "Live: Visitor Mode. Not live: accounts, wallets, payments, remittance, token distribution, public trading, citizen onboarding.",
    },
    classification: "internal_draft",
  };

  return {
    job_id: job.id,
    agent: "content_atomizer",
    ok: true,
    summary:
      "Atomized into FAQ, social, email, KB drafts. All internal_draft — Publication Agent not in chain.",
    artifacts: Object.keys(atoms),
    payload_update: { content_atoms: atoms },
    next_hint: job.chain[job.step_index + 1] || null,
    blocked_reason: null,
    needs_aj: false,
    at: new Date().toISOString(),
  };
}
