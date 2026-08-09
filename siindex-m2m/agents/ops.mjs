/** Ops agent — deploy / secrets (AJ gate) */
export async function run(job) {
  // Production deploy/secret write cannot complete without provider connection.
  return {
    job_id: job.id,
    agent: "ops",
    ok: true,
    summary:
      "Ops prepared GitHub Action deploy-supabase-functions.yml. Live edge setup not deployed (404). Secret write requires connected Supabase authority.",
    artifacts: [
      ".github/workflows/deploy-supabase-functions.yml",
      "siindex-operating/VOICE_EXACT_MATCH_STATUS.md",
    ],
    next_hint: null,
    blocked_reason:
      "Supabase function deploy + SIINDEX_VOICE_SETUP_TOKEN not available to this runtime",
    needs_aj: true,
    at: new Date().toISOString(),
  };
}
