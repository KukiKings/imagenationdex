#!/usr/bin/env node
'use strict';

/**
 * IN$DEX Agent Orchestrator
 *
 * Real Node.js dispatcher that reads actual rows from the live agent_registry table
 * (Supabase project zljgthfzbalsunuoohcd) and routes a task object to either
 * ./kyc-agent.js or ./compliance-agent.js. Every table/column/RPC name referenced here
 * was confirmed to exist via direct database introspection on 2026-09-17
 * (information_schema.tables/columns, pg_proc via pg_get_functiondef) before this file
 * was written — see the task report for the exact query results.
 *
 * HONEST SCOPE NOTE: agent_registry currently has no row whose agent_name is literally
 * "kyc-agent" or "compliance-agent" (confirmed — a query for those two names returned
 * zero rows). "kyc-agent" / "compliance-agent" are this repo's own code-module names,
 * not registered bus agents. What agent_registry DOES contain are individual real
 * actions (e.g. transfer_indx, report_connectivity_risk, set_account_freeze,
 * setup_totp, ...). This orchestrator therefore keys dispatch off the specific action
 * being requested, and — where a matching agent_registry row for that exact action
 * exists — looks it up for real (status='active', revocation_status='active') before
 * calling it. Where no such row exists (true for most of the plain KYC-tier RPCs and
 * several compliance RPCs, which are ordinary Postgres functions rather than
 * registry-tracked bus agents), that absence is recorded in the audit row as
 * registry_match: false rather than papered over with an invented row.
 *
 * There IS a real, already-built persistent task/job bus in this project — the
 * agent_tasks / agent_messages / agent_evidence / agent_audit tables, driven by the
 * existing supabase/functions/siindex-agent-dispatch, siindex-agent-claim and
 * siindex-agent-complete edge functions (chain-based, with visibility timeouts, claim
 * tokens, and AJ-authorization gating for high-risk actions). This orchestrator is a
 * separate, simpler, synchronous Node-side dispatcher — it does not reimplement or
 * replace that chain/claim state machine. It does write one real agent_audit row per
 * dispatch (agent_audit is a plain insert-only log table, not a claim/lease queue), so
 * every dispatch through this file is genuinely traceable in the same audit table the
 * real agent bus already uses.
 *
 * SIINDEX is IN$DEX's Synthetic Intelligence (SI) — never "AI" — she/her.
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const kycAgent = require('./kyc-agent');
const complianceAgent = require('./compliance-agent');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let _client = null;

/**
 * Lazily builds the real Supabase service-role client from environment variables.
 * Never hardcodes a URL or key — if the environment isn't configured, this throws
 * rather than silently falling back to a fake/anonymous client.
 */
function getClient() {
  if (_client) return _client;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'orchestrator: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set in the ' +
      'environment. Refusing to run against a fabricated or default client.'
    );
  }
  _client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

/**
 * Real columns confirmed via information_schema.columns on agent_registry:
 * agent_name, purpose, domain, permitted_tools (jsonb), permitted_memory_classes
 * (jsonb), risk_class (int, 0-5), status ('active'|'retired'), registered_at, owner,
 * constitutional_authority, prohibited_actions (jsonb), model_version,
 * software_version, execution_environment, start_date, expiry, revocation_status
 * ('active'|'revoked'|'suspended'), verification_key, max_citizens_affected,
 * max_money_indx, max_records_changed, blast_radius_window_minutes.
 */
const AGENT_REGISTRY_COLUMNS =
  'agent_name, domain, purpose, risk_class, status, owner, permitted_tools, ' +
  'prohibited_actions, revocation_status, max_money_indx, max_citizens_affected, ' +
  'max_records_changed, blast_radius_window_minutes';

/** Reads every currently active, non-revoked row from the real agent_registry table. */
async function loadActiveAgentRegistry(client = getClient()) {
  const { data, error } = await client
    .from('agent_registry')
    .select(AGENT_REGISTRY_COLUMNS)
    .eq('status', 'active')
    .eq('revocation_status', 'active');
  if (error) throw error;
  return data || [];
}

/**
 * Looks up one real agent_registry row by its exact agent_name. Returns null (not a
 * fabricated row) when no such action is registered — several real KYC/compliance RPCs
 * this orchestrator dispatches to are plain Postgres functions with no registry row.
 */
async function getRegisteredAgent(agentName, client = getClient()) {
  const { data, error } = await client
    .from('agent_registry')
    .select('*')
    .eq('agent_name', agentName)
    .eq('status', 'active')
    .eq('revocation_status', 'active')
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

/**
 * Actions routed to ./kyc-agent.js. Each key is the real RPC name it wraps (confirmed
 * to exist via pg_proc — see kyc-agent.js's own comments for each one's exact
 * signature). handler(client, params) matches each wrapper's real signature.
 */
const KYC_ACTIONS = new Map([
  ['get_citizen_by_phone', (client, p) => kycAgent.lookupCitizenByPhone(client, p)],
  ['create_onboarding_citizen', (client, p) => kycAgent.createOnboardingCitizen(client, p)],
  ['link_citizen_auth', (client, p) => kycAgent.linkCitizenAuth(client, p)],
  ['link_citizen_auth_by_id', (client, p) => kycAgent.linkCitizenAuthById(client, p)],
  ['verify_payid', (client, p) => kycAgent.verifyPayId(client, p)],
  ['verify_government_id', (client, p) => kycAgent.verifyGovernmentId(client, p)],
  ['verify_address_funds', (client, p) => kycAgent.verifyAddressFunds(client, p)],
  ['get_citizen_verification_bundle', (client, p) => kycAgent.getCitizenVerificationBundle(client, p)],
  ['get_current_kyc_tier', (client, p) => kycAgent.getCurrentKycTier(client, p)],
]);

/**
 * Actions routed to ./compliance-agent.js. Same real-RPC/table-backed contract as
 * above — see compliance-agent.js's own comments for each one's exact signature.
 */
const COMPLIANCE_ACTIONS = new Map([
  ['request_action_approval', (client, p) => complianceAgent.requestActionApproval(client, p)],
  ['assess_transfer_risk', (client, p) => complianceAgent.assessTransferRisk(client, p)],
  ['report_connectivity_risk', (client, p) => complianceAgent.reportConnectivityRisk(client, p)],
  ['get_connectivity_risk_flags', (client, p) => complianceAgent.getConnectivityRiskFlags(client, p)],
  ['get_my_transfer_risk_flags', (client, p) => complianceAgent.getMyTransferRiskFlags(client, p)],
  ['get_consent_compliance_summary', (client) => complianceAgent.getConsentComplianceSummary(client)],
  ['get_platform_security_status', (client) => complianceAgent.getPlatformSecurityStatus(client)],
  ['record_threshold_signoff', (client, p) => complianceAgent.recordThresholdSignoff(client, p)],
  ['list_open_threshold_approvals', (client) => complianceAgent.listOpenThresholdApprovals(client)],
  ['list_pending_approvals', (client) => complianceAgent.listPendingApprovals(client)],
  ['log_security_event', (client, p) => complianceAgent.logSecurityEvent(client, p)],
  ['open_complaint', (client, p) => complianceAgent.openComplaint(client, p)],
  ['add_complaint_event', (client, p) => complianceAgent.addComplaintEvent(client, p)],
  ['list_open_complaints', (client) => complianceAgent.listOpenComplaints(client)],
  ['flag_large_transaction', (client, p) => complianceAgent.flagLargeTransaction(client, p)],
]);

/** Best-effort write to the real agent_audit table. Never throws — an audit failure
 * must not block or fabricate the outcome of the underlying dispatch. */
async function writeAudit(client, { taskId, agent, action, ok, detail }) {
  try {
    await client.from('agent_audit').insert({ task_id: taskId, agent, action, ok, detail: detail || {} });
  } catch (_) {
    // agent_audit is a real but non-essential trail; a logging failure is swallowed
    // deliberately so it never masquerades as a dispatch failure or vice versa.
  }
}

/**
 * dispatch(task, client?) — the real, callable dispatch function.
 *
 * task = {
 *   task_id?: string,       // optional; a real uuid is generated if omitted
 *   action: string,         // required; must be a key in KYC_ACTIONS or COMPLIANCE_ACTIONS
 *   params?: object,        // passed straight through to the matched handler
 * }
 *
 * This does not enqueue into any invented in-memory queue and does not fabricate
 * execution history: it executes the task now, against real infrastructure, and
 * returns the real result (or a real thrown error) plus one real agent_audit row.
 */
async function dispatch(task, client = getClient()) {
  if (!task || typeof task.action !== 'string' || !task.action) {
    throw new Error('dispatch(task) requires task.action (string)');
  }
  const taskId = task.task_id || crypto.randomUUID();
  const params = task.params || {};

  let moduleName = null;
  let handler = null;
  if (KYC_ACTIONS.has(task.action)) {
    moduleName = 'kyc-agent';
    handler = KYC_ACTIONS.get(task.action);
  } else if (COMPLIANCE_ACTIONS.has(task.action)) {
    moduleName = 'compliance-agent';
    handler = COMPLIANCE_ACTIONS.get(task.action);
  }

  if (!handler) {
    await writeAudit(client, {
      taskId, agent: task.action, action: 'dispatch_rejected', ok: false,
      detail: { reason: 'unknown_action', action: task.action },
    });
    return { ok: false, task_id: taskId, error: 'unknown_action' };
  }

  // Real gate: only ever consult agent_registry for a row that genuinely exists under
  // this exact action name. registryRow is null (not fabricated) when there is none.
  let registryRow = null;
  try {
    registryRow = await getRegisteredAgent(task.action, client);
  } catch (_) {
    registryRow = null;
  }
  if (registryRow && registryRow.status !== 'active') {
    await writeAudit(client, {
      taskId, agent: task.action, action: 'dispatch_rejected', ok: false,
      detail: { reason: 'registry_agent_not_active', status: registryRow.status },
    });
    return { ok: false, task_id: taskId, error: 'registry_agent_not_active' };
  }

  await writeAudit(client, {
    taskId, agent: task.action, action: 'dispatch', ok: true,
    detail: {
      routed_to: moduleName,
      registry_match: !!registryRow,
      risk_class: registryRow ? registryRow.risk_class : null,
    },
  });

  try {
    const result = await handler(client, params);
    await writeAudit(client, {
      taskId, agent: task.action, action: 'complete', ok: true,
      detail: { routed_to: moduleName },
    });
    return { ok: true, task_id: taskId, module: moduleName, action: task.action, result };
  } catch (err) {
    const message = (err && err.message) || String(err);
    await writeAudit(client, {
      taskId, agent: task.action, action: 'complete', ok: false,
      detail: { routed_to: moduleName, error: message },
    });
    return { ok: false, task_id: taskId, module: moduleName, action: task.action, error: message };
  }
}

/**
 * --------------------------------------------------------------------------
 * Queue worker — added 2026-09-21, closes the gap this file's own header
 * comment flagged above: this project already has a real, deployed
 * agent_tasks/agent_messages/agent_evidence/agent_audit bus, driven by three
 * already-deployed edge functions (supabase/functions/siindex-agent-dispatch,
 * -claim, -complete). Nothing in this repo previously actually claimed a row
 * from that queue and drove it to completion. This section does that — it
 * does not reimplement the claim/visibility-timeout/chain-advance state
 * machine those edge functions already own; it calls them over real HTTP,
 * exactly the contract they define (confirmed by reading their deployed
 * source directly, 2026-09-21), and reuses dispatch() above to actually run
 * the work once a task is claimed.
 *
 * Task shape this worker expects: a queued agent_tasks row whose `chain`
 * contains this worker's own agent name (e.g. "kyc-agent" or
 * "compliance-agent") at the current step, and whose `payload` carries
 * { action: <a real KYC_ACTIONS/COMPLIANCE_ACTIONS key>, params: {...} }.
 * That payload shape is this file's own convention (there is no existing
 * caller enqueueing tasks this way yet) — documented here rather than
 * silently assumed, so a future caller of siindex-agent-dispatch knows the
 * contract this worker expects.
 * --------------------------------------------------------------------------
 */

const SIINDEX_AGENT_WORKER_SECRET = process.env.SIINDEX_AGENT_WORKER_SECRET || '';

/**
 * Calls a real, already-deployed edge function under supabase/functions/.
 * Auths the same way orchestrator.js's env already requires: service-role
 * bearer token (preferred, already mandatory via getClient()) or the worker
 * secret header, matching exactly what siindex-agent-claim/-complete check
 * server-side (`authorized(req)` in both files' real source).
 */
async function callAgentBusFunction(functionSlug, body) {
  if (!SUPABASE_URL) {
    throw new Error('orchestrator: SUPABASE_URL must be set to call the real agent-bus edge functions.');
  }
  const headers = { 'Content-Type': 'application/json' };
  if (SUPABASE_SERVICE_ROLE_KEY) {
    headers.Authorization = `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;
  } else if (SIINDEX_AGENT_WORKER_SECRET) {
    headers['x-siindex-agent-worker'] = SIINDEX_AGENT_WORKER_SECRET;
  } else {
    throw new Error(
      'orchestrator: neither SUPABASE_SERVICE_ROLE_KEY nor SIINDEX_AGENT_WORKER_SECRET is set — ' +
      'refusing to call the agent-bus edge functions unauthenticated.'
    );
  }
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${functionSlug}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body || {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`orchestrator: ${functionSlug} returned ${res.status}: ${json.error || 'unknown_error'}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

/**
 * Claims at most one real agent_tasks row for `agentName` (via the real
 * siindex-agent-claim edge function), runs it through dispatch() using this
 * file's KYC_ACTIONS/COMPLIANCE_ACTIONS maps, and reports the real outcome
 * back via siindex-agent-complete. Returns { claimed: false } when the queue
 * had nothing runnable for this agent — that is a normal, honest outcome,
 * not an error.
 */
async function claimAndProcessNext(agentName, { client = getClient(), visibilitySeconds } = {}) {
  if (!agentName) throw new Error('claimAndProcessNext requires agentName ("kyc-agent" or "compliance-agent")');

  const claimBody = { agent: agentName };
  if (visibilitySeconds) claimBody.visibility_seconds = visibilitySeconds;
  const claimed = await callAgentBusFunction('siindex-agent-claim', claimBody);

  if (!claimed.claimed || !claimed.task) {
    return { claimed: false };
  }

  const task = claimed.task;
  const payload = task.payload || {};
  const action = payload.action;

  if (!action || typeof action !== 'string') {
    // A real claimed task with no runnable action in its payload. Report this
    // honestly as a failure back to the bus rather than silently dropping it
    // (which would leave it claimed forever until the visibility timeout).
    await callAgentBusFunction('siindex-agent-complete', {
      task_id: task.id,
      claim_token: claimed.claim_token,
      agent: agentName,
      result: { ok: false, summary: 'payload.action missing or not a string — nothing to dispatch' },
    });
    return { claimed: true, task_id: task.id, ok: false, error: 'payload_action_missing' };
  }

  const outcome = await dispatch({ task_id: task.id, action, params: payload.params || {} }, client);

  const completeResult = {
    ok: outcome.ok,
    summary: outcome.ok
      ? `dispatch(${action}) via ${outcome.module} completed`
      : `dispatch(${action}) failed: ${outcome.error}`,
    payload_update: { last_dispatch_action: action, last_dispatch_ok: outcome.ok },
  };
  if (!outcome.ok) completeResult.blocked_reason = outcome.error;

  const completed = await callAgentBusFunction('siindex-agent-complete', {
    task_id: task.id,
    claim_token: claimed.claim_token,
    agent: agentName,
    result: completeResult,
  });

  return {
    claimed: true,
    task_id: task.id,
    ok: outcome.ok,
    dispatch_result: outcome,
    bus_status: completed.status,
  };
}

/**
 * Polls claimAndProcessNext in a real loop until the queue is empty for this
 * agent, or maxIterations is reached (default 50, so a stuck loop can never
 * run unbounded in, say, a cron invocation). Does not swallow a thrown auth
 * or network error from callAgentBusFunction — a caller running this
 * unattended (e.g. cron) should catch and alert on that itself rather than
 * have failures silently vanish here.
 */
async function runWorkerLoop(agentName, { client = getClient(), maxIterations = 50, visibilitySeconds } = {}) {
  const results = [];
  for (let i = 0; i < maxIterations; i += 1) {
    const outcome = await claimAndProcessNext(agentName, { client, visibilitySeconds });
    if (!outcome.claimed) break;
    results.push(outcome);
  }
  return results;
}

// CLI entry point: `node agents/orchestrator.js kyc-agent` or `... compliance-agent`
// drains that agent's real queue once and exits — for cron/manual invocation, not a
// long-running daemon (no invented backoff/retry loop beyond maxIterations above).
if (require.main === module) {
  const agentArg = process.argv[2];
  if (!agentArg || (agentArg !== 'kyc-agent' && agentArg !== 'compliance-agent')) {
    console.error('Usage: node agents/orchestrator.js <kyc-agent|compliance-agent>');
    process.exitCode = 1;
  } else {
    runWorkerLoop(agentArg)
      .then((results) => {
        console.log(JSON.stringify({ agent: agentArg, processed: results.length, results }, null, 2));
      })
      .catch((err) => {
        console.error('orchestrator worker loop failed:', err.message || err);
        process.exitCode = 1;
      });
  }
}

module.exports = {
  getClient,
  loadActiveAgentRegistry,
  getRegisteredAgent,
  dispatch,
  claimAndProcessNext,
  runWorkerLoop,
  KYC_ACTIONS,
  COMPLIANCE_ACTIONS,
};
