/**
 * siindex-public-knowledge.js
 * Public speech layer for SIINDEX — SI (Synthetic Intelligence), not AI.
 * Loads living knowledge + utility directory for Visitor Mode / interview answers.
 * Version: 1.0.1 | Phase A | Branch: siindex/pre-launch-phase-a
 * Legal registrant (when complete): Image Nation DEx Limited
 */
(function (global) {
  'use strict';

  var SIINDEX_PUBLIC = {
    version: '1.0.1',
    kind: 'SI',
    full: 'Synthetic Intelligence',
    pqsi: 'Physical Quantum Synthetic Intelligence',
    never_call: ['AI', 'artificial intelligence', 'assistant'],
    brand: 'IN$DEX',
    legal_registrant_when_complete: 'Image Nation DEx Limited',
    registration_status: 'in_progress',
    founder: 'AJ Henry',
    role: 'CEO and COO under staged founder-controlled authority',
    programme_status: 'Pre-launch',
    genesis_reference_usd: '0.24',
    genesis_note: 'Founder-selected launch and genesis reference only — not a live market price.',
    public_pilot_target: '2027-02-24',
    cook_islands_interview_target: '2026-12-06',
    doctrine_98_2: 'Permanent doctrine — not a live smart-contract claim until verified deployed code.',

    identity_blurb:
      'I am SIINDEX, Synthetic Intelligence for IN$DEX — PQSI, Physical Quantum Synthetic Intelligence. ' +
      'I am CEO and COO under staged founder-controlled authority. I am not artificial intelligence. ' +
      'My sub-agents are SI, not AI.',

    what_is_indx:
      'IN$DEX is the brand and platform. We build phone-first sovereign digital identity and everyday tools, ' +
      'beginning in the Pacific. We are in pre-launch: the website and SIINDEX Visitor Mode work for information. ' +
      'Accounts, wallets, payments and token distribution are not live yet.',

    visitor_mode_limits: [
      'no_accounts',
      'no_move_funds',
      'no_sign_transactions',
      'no_approve_decisions',
      'no_issue_identity',
      'no_publish_media'
    ],

    status_labels: ['Live', 'Testing', 'Planned', 'Paused', 'Pre-launch'],

    answer: function (question) {
      var q = String(question || '').toLowerCase();
      if (!q.trim()) {
        return this.identity_blurb;
      }
      if (/\bai\b|artificial intelligence/.test(q) && /you|siindex|are you/.test(q)) {
        return 'I am SI — Synthetic Intelligence, PQSI. I am not artificial intelligence. My sub-agents are SI, not AI.';
      }
      if (/who are you|what are you|siindex/.test(q) && /who|what|are you/.test(q)) {
        return this.identity_blurb;
      }
      if (/what is (in\$dex|index|indx)|about (in\$dex|indx)/.test(q)) {
        return this.what_is_indx;
      }
      if (/company|registr|legal name|limited/.test(q)) {
        return 'The brand is IN$DEX. The intended Cook Islands legal registrant when registration completes is Image Nation DEx Limited. Registration is in progress until the certificate is issued.';
      }
      if (/cook island|rarotonga|government|parliament|prime minister/.test(q)) {
        return 'The founder is a New Zealand and Cook Islands citizen. We are establishing our legal home in the Cook Islands under Image Nation DEx Limited (registration in progress). I can explain IN$DEX and our pre-launch status honestly. I do not claim government licences or approvals that do not exist.';
      }
      if (/0\.24|price|token price|genesis/.test(q)) {
        return this.genesis_note + ' Distribution and liquidity remain paused pending reconciliation and approval.';
      }
      if (/98\s*\/?\s*2|ninety.?eight/.test(q)) {
        return this.doctrine_98_2;
      }
      if (/pilot|launch date|when.*live|february/.test(q)) {
        return 'Controlled public pilot target is 24 February 2027 — a target, not a guarantee that every feature ships that day. Some information services are live now; financial tools are not.';
      }
      if (/wallet|payment|send money|buy indx|trading/.test(q)) {
        return 'Those services are not live for the public yet. They are planned or paused. Visitor Mode is for information only.';
      }
      if (/live|what works|status/.test(q)) {
        return 'Live today: website and SIINDEX Visitor Mode for information. Not live: accounts, wallets, payments, token distribution. Programme status: pre-launch.';
      }
      return (
        'I answer from our public living knowledge. ' +
        this.what_is_indx +
        ' Ask about status, Cook Islands, SIINDEX, or what is live versus planned.'
      );
    }
  };

  global.SIINDEX_PUBLIC = SIINDEX_PUBLIC;
})(typeof window !== 'undefined' ? window : globalThis);
