/**
 * ============================================================================
 * SANDBOX PROVIDER ADAPTER — NOT REAL. DO NOT WIRE TO CITIZEN-FACING SCREENS.
 * ============================================================================
 *
 * This file implements the Provider Adapter contract defined in
 * sovereign-embedded-connectivity-charter-v1.md ("Provider Adapter Layer")
 * against fake, clearly-labeled sandbox data. It exists for exactly one
 * purpose: to prove the interface shape is internally consistent and usable
 * BEFORE any real telecom partner (1GLOBAL, Mobilise, Gigs) is signed.
 *
 * Per AJ's own July 2026 action plan: "Build the provider sandbox adapter.
 * Do not connect it to citizen-facing production actions."
 *
 * When a real partner is signed, a new file (e.g. oneglobal-provider-adapter.js)
 * should implement this exact same interface against the partner's real API —
 * every citizen-facing screen should be able to call either adapter through
 * the identical function signatures below, so swapping providers or adding a
 * second one never requires rewiring the frontend.
 *
 * Every value returned by this file is fake and clearly marked "SANDBOX" so
 * nobody mistakes it for real telecom data if this file is ever read out of
 * context.
 *
 * Required commands (per the charter's Provider Adapter Layer):
 *   list_plans, check_coverage, check_device, create_subscription,
 *   issue_activation, confirm_installation, get_usage, top_up, renew_plan,
 *   suspend_subscription, resume_subscription, transfer_device, check_number,
 *   check_sim_swap, terminate_subscription, export_subscription
 */
(function (global) {
  'use strict';

  const SANDBOX_TAG = 'SANDBOX-ONLY-NOT-REAL';

  function delay(value, ms) {
    return new Promise(function (resolve) { setTimeout(function () { resolve(value); }, ms || 10); });
  }

  const SandboxProviderAdapter = {
    providerName: 'sandbox',

    list_plans: function (params) {
      return delay({
        _sandbox: SANDBOX_TAG,
        plans: [
          { plan_id: 'sandbox-plan-basic', name: 'Sandbox Basic', data_mb: 5000, period_days: 30, price_usd: 8.00, network: 'Sandbox Network A' },
          { plan_id: 'sandbox-plan-plus', name: 'Sandbox Plus', data_mb: 15000, period_days: 30, price_usd: 18.00, network: 'Sandbox Network B' }
        ]
      });
    },

    check_coverage: function (params) {
      return delay({ _sandbox: SANDBOX_TAG, region: (params && params.region) || 'unknown', covered: true, confidence: 'sandbox-simulated' });
    },

    check_device: function (params) {
      return delay({ _sandbox: SANDBOX_TAG, device_model: (params && params.deviceModel) || 'unknown', esim_compatible: true, physical_sim_fallback: true });
    },

    create_subscription: function (params) {
      return delay({ _sandbox: SANDBOX_TAG, subscription_id: 'sandbox-sub-' + Math.random().toString(36).slice(2, 10), status: 'pending_activation' });
    },

    issue_activation: function (params) {
      return delay({ _sandbox: SANDBOX_TAG, activation_code: 'SANDBOX-LPA:1$sandbox.example$FAKE-ACTIVATION-CODE', subscription_id: (params && params.subscriptionId) || null });
    },

    confirm_installation: function (params) {
      return delay({ _sandbox: SANDBOX_TAG, installed: true, subscription_id: (params && params.subscriptionId) || null, confirmed_at: new Date().toISOString() });
    },

    get_usage: function (params) {
      return delay({ _sandbox: SANDBOX_TAG, subscription_id: (params && params.subscriptionId) || null, data_used_mb: 1200, data_remaining_mb: 3800, expires_at: null });
    },

    top_up: function (params) {
      return delay({ _sandbox: SANDBOX_TAG, subscription_id: (params && params.subscriptionId) || null, added_mb: (params && params.amountMb) || 0, success: true });
    },

    renew_plan: function (params) {
      return delay({ _sandbox: SANDBOX_TAG, subscription_id: (params && params.subscriptionId) || null, renewed: true, new_expiry: null });
    },

    suspend_subscription: function (params) {
      return delay({ _sandbox: SANDBOX_TAG, subscription_id: (params && params.subscriptionId) || null, status: 'suspended' });
    },

    resume_subscription: function (params) {
      return delay({ _sandbox: SANDBOX_TAG, subscription_id: (params && params.subscriptionId) || null, status: 'active' });
    },

    transfer_device: function (params) {
      return delay({ _sandbox: SANDBOX_TAG, subscription_id: (params && params.subscriptionId) || null, transferred_to: (params && params.newDeviceId) || null, status: 'transfer_pending' });
    },

    check_number: function (params) {
      return delay({ _sandbox: SANDBOX_TAG, msisdn_confirmed: false, note: 'Sandbox adapter does not simulate real number verification.' });
    },

    check_sim_swap: function (params) {
      return delay({ _sandbox: SANDBOX_TAG, swap_detected: false, note: 'Sandbox adapter cannot detect a real SIM swap — no real network signal exists yet. See report_connectivity_risk for the real citizen-initiated path.' });
    },

    terminate_subscription: function (params) {
      return delay({ _sandbox: SANDBOX_TAG, subscription_id: (params && params.subscriptionId) || null, status: 'terminated' });
    },

    export_subscription: function (params) {
      return delay({ _sandbox: SANDBOX_TAG, subscription_id: (params && params.subscriptionId) || null, export_format: 'json', data: {} });
    }
  };

  global.SandboxProviderAdapter = SandboxProviderAdapter;
})(typeof window !== 'undefined' ? window : this);
