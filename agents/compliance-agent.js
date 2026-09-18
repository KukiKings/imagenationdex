'use strict';

/**
 * IN$DEX Compliance Agent
 *
 * Real Node.js wrapper around this project's ACTUAL Postgres RPCs and tables for risk
 * assessment, the Approval Gateway, complaints, security events, and threshold
 * (multi-signoff) approvals (Supabase project zljgthfzbalsunuoohcd). Every function
 * name / column name / RPC signature below was confirmed to exist via direct
 * introspection of the live database on 2026-09-17 (information_schema.routines,
 * pg_proc, information_schema.columns) before this file was written — see the
 * orchestrator.js task report for the exact query results. Table writes here
 * (security_events, complaints, complaint_events) follow the same direct
 * `client.from(table).insert(...)` pattern already used by the real
 * supabase/functions/remittance-agent edge function in this repo, not a new invented
 * convention.
 *
 * SIINDEX is IN$DEX's Synthetic Intelligence (SI) — never "AI" — she/her.
 */

function assertClient(client) {
  if (!client || typeof client.rpc !== 'function' || typeof client.from !== 'function') {
    throw new Error('compliance-agent: a real Supabase client instance is required (got none).');
  }
  return client;
}

/**
 * request_action_approval(p_citizen_id uuid, p_agent_name text, p_amount_indx numeric,
 * p_raw_intent text) RETURNS jsonb
 * Confirmed via pg_get_functiondef. This IS the real Approval Gateway: it looks up
 * agent_registry for p_agent_name and, only when that agent's risk_class >= 3, requires
 * a matching citizen_intents + approval_gates row (granted within the last 24h) before
 * returning { gate_required: false }. Otherwise it inserts a new citizen_intents row and
 * returns { gate_required: true, intent_id, risk_level, message }. This function is the
 * real gate — this wrapper does not reimplement or bypass its logic.
 */
async function requestActionApproval(client, { citizenId, agentName, amountIndx, rawIntent } = {}) {
  assertClient(client);
  if (!citizenId || !agentName) {
    throw new Error('requestActionApproval requires { citizenId, agentName, amountIndx, rawIntent }');
  }
  const { data, error } = await client.rpc('request_action_approval', {
    p_citizen_id: citizenId,
    p_agent_name: agentName,
    p_amount_indx: amountIndx ?? 0,
    p_raw_intent: rawIntent || '',
  });
  if (error) throw error;
  return data;
}

/**
 * assess_transfer_risk(p_sender_id uuid, p_recipient_id uuid, p_recipient_address text,
 * p_amount numeric, p_tx_id uuid) RETURNS void
 * Confirmed via pg_get_functiondef. Writes real security_events rows when: the amount
 * is at/above siindex_runtime_config's transfer_risk_amount_threshold_indx (default
 * 500), the sender has sent 3+ times in the last 60 seconds, or the recipient address
 * matches an active row in known_malicious_indicators. It swallows its own errors
 * (EXCEPTION WHEN OTHERS -> NULL) by design so risk flagging never breaks a real
 * transfer — this wrapper does not add a second layer of risk logic on top.
 */
async function assessTransferRisk(client, { senderId, recipientId, recipientAddress, amount, txId } = {}) {
  assertClient(client);
  if (!senderId || !amount || !txId) {
    throw new Error('assessTransferRisk requires { senderId, amount, txId } (recipientId/recipientAddress optional)');
  }
  const { error } = await client.rpc('assess_transfer_risk', {
    p_sender_id: senderId,
    p_recipient_id: recipientId || null,
    p_recipient_address: recipientAddress || null,
    p_amount: amount,
    p_tx_id: txId,
  });
  if (error) throw error;
  return { success: true };
}

/**
 * report_connectivity_risk(p_citizen_id uuid, p_risk_type text) RETURNS jsonb
 * Confirmed via pg_get_functiondef. This is itself a real, currently-registered
 * agent_registry row (agent_name = 'report_connectivity_risk', domain = 'Connectivity',
 * risk_class = 1). It genuinely inserts into connectivity_risk_flags AND calls
 * set_account_freeze(...) to freeze the citizen's account pending review.
 */
async function reportConnectivityRisk(client, { citizenId, riskType } = {}) {
  assertClient(client);
  if (!citizenId || !riskType) throw new Error('reportConnectivityRisk requires { citizenId, riskType }');
  const { data, error } = await client.rpc('report_connectivity_risk', {
    p_citizen_id: citizenId,
    p_risk_type: riskType,
  });
  if (error) throw error;
  return data;
}

/**
 * get_connectivity_risk_flags(p_citizen_id uuid) RETURNS jsonb
 * Confirmed via pg_get_functiondef. Reads real connectivity_risk_flags rows.
 */
async function getConnectivityRiskFlags(client, { citizenId } = {}) {
  assertClient(client);
  if (!citizenId) throw new Error('getConnectivityRiskFlags requires { citizenId }');
  const { data, error } = await client.rpc('get_connectivity_risk_flags', { p_citizen_id: citizenId });
  if (error) throw error;
  return data;
}

/**
 * get_my_transfer_risk_flags(p_citizen_id uuid) RETURNS jsonb — confirmed via pg_proc.
 */
async function getMyTransferRiskFlags(client, { citizenId } = {}) {
  assertClient(client);
  if (!citizenId) throw new Error('getMyTransferRiskFlags requires { citizenId }');
  const { data, error } = await client.rpc('get_my_transfer_risk_flags', { p_citizen_id: citizenId });
  if (error) throw error;
  return data;
}

/** get_consent_compliance_summary() RETURNS jsonb — confirmed via pg_proc, no args. */
async function getConsentComplianceSummary(client) {
  assertClient(client);
  const { data, error } = await client.rpc('get_consent_compliance_summary');
  if (error) throw error;
  return data;
}

/** get_platform_security_status() RETURNS jsonb — confirmed via pg_proc, no args. */
async function getPlatformSecurityStatus(client) {
  assertClient(client);
  const { data, error } = await client.rpc('get_platform_security_status');
  if (error) throw error;
  return data;
}

/**
 * record_threshold_signoff(p_threshold_approval_id uuid, p_approver_name text,
 * p_decision text) RETURNS jsonb
 * Confirmed via pg_get_functiondef. p_decision must be 'agree' or 'reject'. IMPORTANT
 * REAL CONSTRAINT: the function itself opens with `IF NOT is_founder() THEN RAISE
 * EXCEPTION 'not_authorized'`. That means this only succeeds when called with a
 * Supabase client whose session's auth.uid() actually resolves to the founder via
 * is_founder() — calling it with a bare service-role client (auth.uid() IS NULL) will
 * raise not_authorized. This wrapper does not work around that; it is a genuine
 * authorization boundary already enforced in Postgres, not something to fabricate a
 * bypass for.
 */
async function recordThresholdSignoff(client, { thresholdApprovalId, approverName, decision } = {}) {
  assertClient(client);
  if (!thresholdApprovalId || !approverName || !decision) {
    throw new Error('recordThresholdSignoff requires { thresholdApprovalId, approverName, decision }');
  }
  if (decision !== 'agree' && decision !== 'reject') {
    throw new Error("recordThresholdSignoff: decision must be 'agree' or 'reject'");
  }
  const { data, error } = await client.rpc('record_threshold_signoff', {
    p_threshold_approval_id: thresholdApprovalId,
    p_approver_name: approverName,
    p_decision: decision,
  });
  if (error) throw error;
  return data;
}

/**
 * threshold_approvals (real table, columns confirmed via information_schema): id,
 * action_type, target_table, target_id, description, required_count, status
 * ('pending' default), created_at, resolved_at. Read-only listing of open ones.
 */
async function listOpenThresholdApprovals(client) {
  assertClient(client);
  const { data, error } = await client
    .from('threshold_approvals')
    .select('id, action_type, target_table, target_id, description, required_count, status, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * pending_approvals (real table, columns confirmed): id, action_id, risk_class,
 * payload, evidence, status ('PENDING' default), created_at, expires_at, approved_by,
 * approved_at, denied_by, denied_at, denial_reason. Read-only listing.
 */
async function listPendingApprovals(client) {
  assertClient(client);
  const { data, error } = await client
    .from('pending_approvals')
    .select('id, action_id, risk_class, payload, status, created_at, expires_at')
    .eq('status', 'PENDING')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * security_events (real table, columns confirmed): id, created_at, tier, zone,
 * description, detail (jsonb), resolved, resolved_at, resolved_by, scan_id,
 * correlation_id. This is the exact insert pattern already used by
 * supabase/functions/remittance-agent/index.ts (`sb.from('security_events').insert(...)`).
 */
async function logSecurityEvent(client, { tier, zone, description, detail } = {}) {
  assertClient(client);
  if (!tier || !zone || !description) {
    throw new Error('logSecurityEvent requires { tier, zone, description, detail? }');
  }
  const { data, error } = await client
    .from('security_events')
    .insert({ tier, zone, description, detail: detail || {} })
    .select('id, created_at')
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * complaints (real table, columns confirmed): id, citizen_id, category, description,
 * status ('open' default), internal_target_response_by, opened_at, resolved_at.
 */
async function openComplaint(client, { citizenId, category, description } = {}) {
  assertClient(client);
  if (!citizenId || !category || !description) {
    throw new Error('openComplaint requires { citizenId, category, description }');
  }
  const { data, error } = await client
    .from('complaints')
    .insert({ citizen_id: citizenId, category, description })
    .select('id, citizen_id, category, status, opened_at')
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * complaint_events (real table, columns confirmed): id, complaint_id, event_type,
 * detail (text), created_at. Appends an event to an already-open complaint.
 */
async function addComplaintEvent(client, { complaintId, eventType, detail } = {}) {
  assertClient(client);
  if (!complaintId || !eventType) {
    throw new Error('addComplaintEvent requires { complaintId, eventType, detail? }');
  }
  const { data, error } = await client
    .from('complaint_events')
    .insert({ complaint_id: complaintId, event_type: eventType, detail: detail || null })
    .select('id, complaint_id, event_type, created_at')
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * complaints (real table). Read-only listing of open complaints, oldest first — useful
 * for a compliance worker deciding what to work on next.
 */
async function listOpenComplaints(client) {
  assertClient(client);
  const { data, error } = await client
    .from('complaints')
    .select('id, citizen_id, category, description, status, internal_target_response_by, opened_at')
    .eq('status', 'open')
    .order('opened_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

module.exports = {
  requestActionApproval,
  assessTransferRisk,
  reportConnectivityRisk,
  getConnectivityRiskFlags,
  getMyTransferRiskFlags,
  getConsentComplianceSummary,
  getPlatformSecurityStatus,
  recordThresholdSignoff,
  listOpenThresholdApprovals,
  listPendingApprovals,
  logSecurityEvent,
  openComplaint,
  addComplaintEvent,
  listOpenComplaints,
};
