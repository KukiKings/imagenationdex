/**
 * Fact Verifier — Stage 2
 * Checks draft claims against live-status rules. Flags inventions.
 */
const BANNED_LIVE_CLAIMS = [
  /wallet(s)?\s+(are|is)\s+live/i,
  /payments?\s+(are|is)\s+live/i,
  /remittance\s+(is|are)\s+live/i,
  /trading\s+(is|are)\s+live/i,
  /onboarding\s+(is|are)\s+live/i,
  /licensed\s+by/i,
  /AUSTRAC\s+(approved|complete)/i,
  /TRISA\s+verified/i,
  /\$0\.35/,
  /Sign-dex/i,
  /Sighn-dex/i,
];

const REQUIRED_MARKERS = [
  { id: "sinn_dex", re: /Sinn-dex/i },
  { id: "visitor_mode", re: /Visitor Mode/i },
  { id: "not_live_boundary", re: /not live/i },
];

export async function run(job) {
  const draft = job.payload?.script_draft;
  const text = draft?.body || "";
  const flags = [];

  if (!text) {
    flags.push({ severity: "error", code: "empty_script", msg: "No script_draft.body" });
  }

  for (const re of BANNED_LIVE_CLAIMS) {
    if (re.test(text)) {
      flags.push({
        severity: "error",
        code: "banned_live_claim",
        msg: `Matched banned pattern: ${re}`,
      });
    }
  }

  for (const m of REQUIRED_MARKERS) {
    if (text && !m.re.test(text)) {
      flags.push({
        severity: "warn",
        code: "missing_marker",
        msg: `Expected marker missing: ${m.id}`,
      });
    }
  }

  if (text && /Sign-dex|Sighn-dex/i.test(text)) {
    flags.push({
      severity: "error",
      code: "bad_pronunciation",
      msg: "Must use Sinn-dex only",
    });
  }

  const errors = flags.filter((f) => f.severity === "error");
  const ok = errors.length === 0 && !!text;

  const report = {
    ok,
    flags,
    checked_chars: text.length,
    classification: "internal_draft",
    rule: "No invented live products; Sinn-dex only; Visitor Mode honesty",
  };

  return {
    job_id: job.id,
    agent: "fact_verifier",
    ok,
    summary: ok
      ? `Fact Verifier PASS (${flags.length} warnings). Draft remains internal.`
      : `Fact Verifier FAIL: ${errors.map((e) => e.code).join(", ")}`,
    artifacts: ["fact_report"],
    payload_update: { fact_report: report },
    next_hint: job.chain[job.step_index + 1] || null,
    blocked_reason: ok ? null : "Fact Verifier blocked draft",
    needs_aj: false,
    at: new Date().toISOString(),
  };
}
