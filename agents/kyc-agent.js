'use strict';

/**
 * IN$DEX KYC Agent
 *
 * Real Node.js wrapper around this project's ACTUAL Postgres RPCs and tables for
 * citizen identity linking and KYC-tier verification (Supabase project
 * zljgthfzbalsunuoohcd). Every function name / column name / RPC signature below was
 * confirmed to exist via direct introspection of the live database on 2026-09-17
 * (information_schema.routines, pg_proc, information_schema.columns) before this file
 * was written — see the orchestrator.js task report for the exact query results. This
 * module invents nothing: it does not run its own document/liveness checks, does not
 * fabricate a verification result, and does not hardcode credentials.
 *
 * SIINDEX is IN$DEX's Synthetic Intelligence (SI) — never "AI" — she/her.
 *
 * Calling convention matches the existing client-side usage of these same RPCs in
 * onboarding-flow.html / biometric-kyc.html / grid-account-onboarding.html:
 *   client.rpc('<function_name>', { p_arg_name: value })
 *
 * The caller supplies the Supabase client (so this module works equally with a
 * service-role backend client or a citizen-scoped client carrying a real user JWT —
 * several of the wrapped functions do their own auth.uid() ownership check and will
 * throw "not_authorized" if the caller isn't entitled to the citizen row).
 */

function assertClient(client) {
  if (!client || typeof client.rpc !== 'function') {
    throw new Error('kyc-agent: a real Supabase client instance is required (got none).');
  }
  return client;
}

/**
 * get_citizen_by_phone(p_phone text) RETURNS json
 * Confirmed via pg_proc (routine_type FUNCTION, data_type json).
 */
async function lookupCitizenByPhone(client, { phone } = {}) {
  assertClient(client);
  if (!phone) throw new Error('lookupCitizenByPhone requires { phone }');
  const { data, error } = await client.rpc('get_citizen_by_phone', { p_phone: phone });
  if (error) throw error;
  return data;
}

/**
 * create_onboarding_citizen(p_payload jsonb) RETURNS jsonb
 * Confirmed via pg_proc. p_payload shape (citizen_name, phone_number, email, ...) taken
 * from the real call site in onboarding-flow.html, not invented here.
 */
async function createOnboardingCitizen(client, payload = {}) {
  assertClient(client);
  const { data, error } = await client.rpc('create_onboarding_citizen', { p_payload: payload });
  if (error) throw error;
  return data;
}

/**
 * link_citizen_auth(p_phone text, p_auth_id uuid) RETURNS void
 * Confirmed via pg_proc.
 */
async function linkCitizenAuth(client, { phone, authId } = {}) {
  assertClient(client);
  if (!phone || !authId) throw new Error('linkCitizenAuth requires { phone, authId }');
  const { error } = await client.rpc('link_citizen_auth', { p_phone: phone, p_auth_id: authId });
  if (error) throw error;
  return { success: true };
}

/**
 * link_citizen_auth_by_id(p_citizen_id uuid) RETURNS jsonb
 * Confirmed via pg_proc. Per onboarding-flow.html's own comment on this exact call,
 * it self-heals phone_number from auth.users.phone and is safe to call as a non-fatal
 * best-effort step after a real Supabase Auth session already exists.
 */
async function linkCitizenAuthById(client, { citizenId } = {}) {
  assertClient(client);
  if (!citizenId) throw new Error('linkCitizenAuthById requires { citizenId }');
  const { data, error } = await client.rpc('link_citizen_auth_by_id', { p_citizen_id: citizenId });
  if (error) throw error;
  return data;
}

/**
 * verify_payid(p_citizen_id uuid, p_payid text) RETURNS jsonb
 * Confirmed via pg_get_functiondef. Genuinely sets citizens.kyc_tier = 1 and persists
 * phone_number or email (detects an email vs phone PayID by checking for "@"). Unlike
 * the tier-2/3 functions below, this one is NOT self-labelled mock in its own source —
 * it performs real format validation and a real, non-mock security_events log entry
 * ("Citizen verified PayID and reached kyc_tier 1").
 */
async function verifyPayId(client, { citizenId, payid } = {}) {
  assertClient(client);
  if (!citizenId || !payid) throw new Error('verifyPayId requires { citizenId, payid }');
  const { data, error } = await client.rpc('verify_payid', { p_citizen_id: citizenId, p_payid: payid });
  if (error) throw error;
  return data;
}

/**
 * verify_government_id(p_citizen_id uuid, p_doc_type text) RETURNS jsonb
 * Confirmed via pg_get_functiondef to exist and to genuinely set citizens.kyc_tier = 2
 * on success. HONESTY NOTE (read before wiring this into any UI as "verified"): the
 * function's own body inserts a security_events row whose description literally reads
 * "MOCK government ID verification — placeholder validation only, no real document
 * check performed" and sets detail.mock = true. No actual ID document is inspected
 * server-side today. This wrapper passes that response through unmodified — including
 * the mock flag — rather than presenting it as a real identity check.
 * p_doc_type must be one of: passport | licence | medicare | utility | other
 * (enforced inside the function itself).
 */
async function verifyGovernmentId(client, { citizenId, docType } = {}) {
  assertClient(client);
  if (!citizenId || !docType) throw new Error('verifyGovernmentId requires { citizenId, docType }');
  const { data, error } = await client.rpc('verify_government_id', {
    p_citizen_id: citizenId,
    p_doc_type: docType,
  });
  if (error) throw error;
  return data;
}

/**
 * verify_address_funds(p_citizen_id uuid, p_country text, p_source_of_funds text)
 * RETURNS jsonb
 * Confirmed via pg_get_functiondef to exist and to genuinely set citizens.kyc_tier = 3
 * on success. Same honesty note as verifyGovernmentId: the function's own
 * security_events insert says "MOCK address/source-of-funds verification — placeholder
 * validation only, no real bank statement or address proof checked" (detail.mock =
 * true). p_source_of_funds must be one of: employment | business | savings |
 * investment | gift | other (enforced inside the function itself).
 */
async function verifyAddressFunds(client, { citizenId, country, sourceOfFunds } = {}) {
  assertClient(client);
  if (!citizenId || !country || !sourceOfFunds) {
    throw new Error('verifyAddressFunds requires { citizenId, country, sourceOfFunds }');
  }
  const { data, error } = await client.rpc('verify_address_funds', {
    p_citizen_id: citizenId,
    p_country: country,
    p_source_of_funds: sourceOfFunds,
  });
  if (error) throw error;
  return data;
}

/**
 * get_citizen_verification_bundle(p_citizen_id uuid) RETURNS jsonb
 * Confirmed via pg_get_functiondef. Returns { citizen, consent_receipts, credentials,
 * recent_transactions, bundle_generated_at, bundle_format }. The function itself
 * enforces auth.uid() ownership whenever auth.uid() IS NOT NULL — a service-role
 * client (auth.uid() IS NULL) bypasses that check, so this should only be called from a
 * trusted backend context, never exposed directly to an untrusted caller.
 */
async function getCitizenVerificationBundle(client, { citizenId } = {}) {
  assertClient(client);
  if (!citizenId) throw new Error('getCitizenVerificationBundle requires { citizenId }');
  const { data, error } = await client.rpc('get_citizen_verification_bundle', { p_citizen_id: citizenId });
  if (error) throw error;
  return data;
}

/**
 * citizens.kyc_tier (integer, default 0) — confirmed real column via
 * information_schema.columns. Reading it directly is cheaper than round-tripping
 * through get_citizen_verification_bundle when the caller only wants the tier.
 */
async function getCurrentKycTier(client, { citizenId } = {}) {
  assertClient(client);
  if (!citizenId) throw new Error('getCurrentKycTier requires { citizenId }');
  const { data, error } = await client
    .from('citizens')
    .select('id, kyc_tier, account_frozen, account_frozen_reason')
    .eq('id', citizenId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// TODO: no real RPC or table exists yet for an actual document-scan / liveness /
// facial-match KYC provider integration. Confirmed by reading biometric-kyc.html's own
// live Supabase calls (get_citizen_by_phone, link_citizen_auth_by_id,
// create_onboarding_citizen, claim_genesis_signup_bonus_anon) — none of them perform a
// real ID-document or liveness check; verify_government_id / verify_address_funds above
// are themselves self-labelled placeholders. Do not fabricate a "verify_document" or
// "run_liveness_check" function here — wire it in only once that backend piece is
// actually built and a real RPC/table exists to confirm against.

module.exports = {
  lookupCitizenByPhone,
  createOnboardingCitizen,
  linkCitizenAuth,
  linkCitizenAuthById,
  verifyPayId,
  verifyGovernmentId,
  verifyAddressFunds,
  getCitizenVerificationBundle,
  getCurrentKycTier,
};
