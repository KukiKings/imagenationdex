// js/wisdom-award.js
//
// Shared helper for awarding Wisdom Score points via the real award_wisdom RPC,
// with automatic per-action idempotency built in.
//
// Plain global-scope script -- this codebase has no bundler and no ES module
// loading anywhere (verified across all ~280 screens; only one unrelated dev
// file in the repo uses import/export). This file is loaded the same way
// every other shared js/*.js file here is:
//   <script src="js/wisdom-award.js"></script>
// and then called as a global function: awardWisdomIdempotent(...).
//
// WHY THIS EXISTS
// ----------------
// Five separate screens (staking.html, create-listing.html,
// pillar-amendment.html, plus the same bug already independently fixed
// earlier in siindex-citizen-fluency-academy.html and sovereign-academy.html)
// each called the award_wisdom RPC with a fixed, non-unique p_reason string
// for an action a citizen can legitimately repeat -- stake again, publish
// another listing, vote on a different proposal. award_wisdom's idempotency
// key is UNIQUE(citizen_id, action_key) on the wisdom_actions table, keyed
// on p_reason. A fixed reason string means only the citizen's very
// first-ever use of that action earned wisdom; every later use silently hit
// the unique_violation branch, which returns the unchanged current score
// with no error surfaced anywhere -- not to the citizen, not in the
// console, nothing.
//
// This helper makes that mistake structurally hard to repeat: the caller
// must supply both an action name and the specific thing the action was
// performed on (a listing id, a proposal id, a staking position id, a
// referral code...). There is no code path that lets you pass a bare,
// non-unique reason string -- if targetId is missing, this throws in the
// console instead of silently sending a broken request, so the bug shows up
// at development time, not months later as a silent wisdom-score deficit
// nobody notices.
//
// WHY award_wisdom, NOT award_wisdom_internal
// ---------------------------------------------
// award_wisdom_internal is SECURITY DEFINER with no ownership check --
// intentionally, because it's used server-side-adjacent for third-party
// awards (e.g. crediting a marketplace seller when a buyer completes a
// purchase, where the caller isn't the citizen being credited). Because of
// that, it is granted ONLY to service_role and postgres -- NOT to
// `authenticated`. A client-side call to award_wisdom_internal gets a 42501
// permission-denied on every single attempt. The function every citizen-
// facing screen must call is the public award_wisdom RPC, which checks
// citizens.auth_user_id = auth.uid() before awarding anything and IS
// granted to `authenticated`. This helper only ever calls award_wisdom.

/**
 * Award wisdom points for a specific, repeatable action, with automatic
 * per-target idempotency -- each distinct targetId earns its own award,
 * independent of whether the citizen has performed this action before.
 *
 * @param {string} supabaseUrl - the screen's own SUPABASE_URL / SUPA_URL constant
 * @param {object} headers     - headers object already built by the calling screen
 *                                (its own rpcHeaders() / SB_HEADERS / equivalent --
 *                                must include apikey, Authorization, Content-Type).
 *                                This file does not assume any single fixed key, so
 *                                it works whether the screen sends the citizen's real
 *                                access token or the anon key.
 * @param {string} citizenId   - the acting citizen's id
 * @param {string} action      - short, stable action name, e.g. 'staking',
 *                                'listing_published', 'governance_vote'
 * @param {string|number} targetId - the specific thing this action was performed
 *                                on: a staking position id, listing id, proposal id,
 *                                referral code, transaction id, etc. Required --
 *                                this is what makes the award idempotent per
 *                                occurrence instead of per citizen for all time.
 * @param {number} [points=5]  - wisdom points to award (award_wisdom rejects >20)
 * @returns {Promise<{ok:boolean, newScore:(number|null), error:(string|null)}>}
 *          newScore is the citizen's resulting wisdom_score whether this call was
 *          the first-ever occurrence of this action+target or a harmless repeat
 *          (a repeat returns the unchanged current score, not an error -- that's
 *          the idempotency working as intended, not a failure).
 */
async function awardWisdomIdempotent(supabaseUrl, headers, citizenId, action, targetId, points = 5) {
  if (!citizenId) return { ok: false, newScore: null, error: 'NO_CITIZEN_ID' };
  if (!action || targetId === undefined || targetId === null || targetId === '') {
    // Fail loudly here rather than silently falling back to a non-unique
    // reason string -- that fallback is exactly the bug this file exists to
    // prevent from ever being written again.
    console.error('[wisdom-award] action and targetId are both required for an idempotent award — got', { action, targetId });
    return { ok: false, newScore: null, error: 'MISSING_ACTION_OR_TARGET' };
  }
  const p_reason = action + ':' + targetId;
  try {
    const res = await fetch(supabaseUrl + '/rest/v1/rpc/award_wisdom', {
      method: 'POST',
      headers,
      body: JSON.stringify({ p_citizen_id: citizenId, p_points: points, p_reason })
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, newScore: null, error: (data && data.message) || 'award_wisdom request failed' };
    }
    // award_wisdom returns the citizen's new wisdom_score as a plain integer.
    return { ok: true, newScore: typeof data === 'number' ? data : null, error: null };
  } catch (e) {
    return { ok: false, newScore: null, error: (e && e.message) || 'connection error' };
  }
}
