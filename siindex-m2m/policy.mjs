/**
 * SIINDEX Policy Gate — Stage 1
 * Hard bans always need AJ (or active campaign mandate for scoped external work).
 */

export const ALWAYS_AJ = Object.freeze([
  "publish",
  "contact_citizens",
  "move_funds",
  "issue_identity",
  "legal_commit",
  "ops.deploy",
  "ops.secret_write",
]);

export const INTERNAL_OK = Object.freeze([
  "read_knowledge",
  "check_policy",
  "write_evidence",
  "verify_draft",
  "draft_script",
  "draft_image",
  "draft_video",
  "run_test",
  "repair_branch",
  "handoff",
]);

/**
 * @param {string[]} requested
 * @param {{ aj_authorized?: boolean, mandate_actions?: string[] }} ctx
 */
export function evaluateActions(requested, ctx = {}) {
  const req = Array.isArray(requested) ? requested : [];
  const blocked = [];
  const allowed = [];

  for (const action of req) {
    if (ALWAYS_AJ.includes(action)) {
      if (ctx.aj_authorized) {
        allowed.push(action);
      } else if (
        ctx.mandate_actions &&
        ctx.mandate_actions.includes(action)
      ) {
        allowed.push(action);
      } else {
        blocked.push(action);
      }
      continue;
    }
    allowed.push(action);
  }

  return {
    ok: blocked.length === 0,
    allowed,
    blocked,
    needs_aj: blocked.length > 0,
    reason: blocked.length
      ? `Policy Gate blocked: ${blocked.join(", ")} — AJ or campaign mandate required`
      : null,
  };
}

export function defaultProhibited() {
  return [...ALWAYS_AJ];
}
