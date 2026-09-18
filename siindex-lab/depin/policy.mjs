/**
 * SIINDEX DEPIN / agent lab policy.
 * No secrets. Enforce before any Solana or compute call.
 * Settlement: Solana-native only. Centralized rails (e.g. MoonPay) permanently out.
 */

export const POLICY = {
  version: '1.2.0',
  public_product_live: false,
  allowed_clusters: ['devnet', 'localnet', 'test'],
  blocked_clusters: ['mainnet-beta', 'mainnet'],
  require_aj_flag_for_spend: true,
  require_aj_flag_for_mainnet: true,
  max_lab_spend_usd_without_aj: 0,
  mesh_keys_in_frontend: false,
  community_skills_default: false,
  /** Settlement: Solana-native only (AJ). */
  payments_rail: 'solana-only',
  /** Permanently false — do not re-enable. */
  centralized_onramp_allowed: false,
  moonpay_allowed: false,
};

/**
 * @param {{ cluster?: string, action?: string, ajAuthorized?: boolean, spendUsd?: number, meshInFrontend?: boolean, installCommunitySkills?: boolean, useMoonPay?: boolean, useCentralizedOnramp?: boolean }} opts
 * @returns {{ ok: boolean, reason?: string }}
 */
export function gate(opts = {}) {
  const cluster = String(opts.cluster || 'devnet').toLowerCase();
  const action = String(opts.action || 'read');
  const aj = Boolean(opts.ajAuthorized);
  const spend = Number(opts.spendUsd || 0);

  if (
    opts.useMoonPay === true ||
    opts.useCentralizedOnramp === true ||
    POLICY.moonpay_allowed === true ||
    POLICY.centralized_onramp_allowed === true
  ) {
    return {
      ok: false,
      reason:
        'Centralized onramps (including MoonPay) permanently forbidden — Solana-native only',
    };
  }

  if (POLICY.blocked_clusters.includes(cluster)) {
    if (!aj) {
      return { ok: false, reason: `cluster ${cluster} requires ajAuthorized=true` };
    }
  }

  if (!POLICY.allowed_clusters.includes(cluster) && !aj) {
    return { ok: false, reason: `cluster ${cluster} not in allowed lab set` };
  }

  const spendingActions = new Set(['transfer', 'swap', 'lend', 'book_gpu', 'pay', 'execute']);
  if (spendingActions.has(action)) {
    if (POLICY.require_aj_flag_for_spend && !aj) {
      return { ok: false, reason: `action ${action} requires AJ authorization` };
    }
    if (spend > POLICY.max_lab_spend_usd_without_aj && !aj) {
      return { ok: false, reason: `spend ${spend} exceeds lab max without AJ` };
    }
  }

  if (opts.meshInFrontend === true) {
    return { ok: false, reason: 'Mesh API keys must not be used in frontend' };
  }

  if (opts.installCommunitySkills === true && !POLICY.community_skills_default && !aj) {
    return { ok: false, reason: 'community skills blocked until AJ review' };
  }

  return { ok: true };
}

export function assertGate(opts) {
  const r = gate(opts);
  if (!r.ok) throw new Error(r.reason || 'policy denied');
  return r;
}
