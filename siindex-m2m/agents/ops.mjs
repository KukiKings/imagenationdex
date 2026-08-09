/** Ops agent — deploy / secrets (AJ gate for production) */
export async function run(job) {
  return {
    job_id: job.id,
    agent: "ops",
    ok: true,
    summary:
      "Deploy workflow exists. Run #1 (31310157891) failed: missing SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_ID in GitHub Actions secrets. Migration ready. SIINDEX_VOICE_SETUP_TOKEN not set on project.",
    artifacts: [
      ".github/workflows/deploy-supabase-functions.yml",
      "supabase/migrations/20260809_siindex_runtime_config.sql",
      "siindex-operating/VOICE_EXACT_MATCH_STATUS.md",
    ],
    next_hint: null,
    blocked_reason:
      "GitHub Actions secrets SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_ID missing. Optional SUPABASE_DB_PASSWORD for migration. After secrets: deploy functions, set SIINDEX_VOICE_SETUP_TOKEN (+ optional SIINDEX_VOICE_SAMPLE_URL), POST setup once, ear-test.",
    needs_aj: true,
    gate: "ops.deploy + ops.secret_write",
    at: new Date().toISOString(),
  };
}
