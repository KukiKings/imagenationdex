/**
 * siindex-public-knowledge.js
 * Public speech layer for SIINDEX — SI (Synthetic Intelligence), not AI.
 * RULE: Always lead with brand IN$DEX. Legal name only when the visitor asks what IN$DEX means or asks for the company/legal name.
 * Version: 1.0.2 | Phase A | Branch: siindex/pre-launch-phase-a
 */
(function (global) {
  'use strict';

  var SIINDEX_PUBLIC = {
    version: '1.0.2',
    kind: 'SI',
    full: 'Synthetic Intelligence',
    pqsi: 'Physical Quantum Synthetic Intelligence',
    never_call: ['AI', 'artificial intelligence', 'assistant'],
    brand: 'IN$DEX',
    legal_registrant_when_complete: 'Image Nation DEx Limited',
    legal_descriptive: 'Image Nation Decentralised Exchange',
    registration_status: 'in_progress',
    founder: 'AJ Henry',
    role: 'CEO and COO under staged founder-controlled authority',
    programme_status: 'Pre-launch',
    genesis_reference_usd: '0.24',
    genesis_note: 'Founder-selected launch and genesis reference only — not a live market price.',
    public_pilot_target: '2027-02-24',
    cook_islands_interview_target: '2026-12-06',
    doctrine_98_2: 'Permanent doctrine — not a live smart-contract claim until verified deployed code.',

    /** Always lead with IN$DEX. Never open with the legal company name. */
    identity_blurb:
      'I am SIINDEX, Synthetic Intelligence for IN$DEX — PQSI, Physical Quantum Synthetic Intelligence. ' +
      'I am CEO and COO of IN$DEX under staged founder-controlled authority. I am not artificial intelligence. ' +
      'My sub-agents are SI, not AI.',

    what_is_indx:
      'IN$DEX is our brand and platform. We build phone-first sovereign digital identity and everyday tools, ' +
      'beginning in the Pacific. We are in pre-launch: the website and SIINDEX Visitor Mode work for information. ' +
      'Accounts, wallets, payments and token distribution are not live yet.',

    /** Only when the visitor asks company / legal / what the name stands for. */
    legal_name_answer:
      'IN$DEX is the brand. When someone asks what that means as a company: the intended Cook Islands legal registrant is Image Nation DEx Limited — also said Image Nation Decentralised Exchange. Registration is in progress until the certificate is issued.',

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

      // SI not AI
      if (/\bai\b|artificial intelligence/.test(q) && /you|siindex|are you/.test(q)) {
        return 'I am SI — Synthetic Intelligence, PQSI — for IN$DEX. I am not artificial intelligence. My sub-agents are SI, not AI.';
      }

      // Who / what is SIINDEX — always brand first
      if (/who are you|what are you|siindex/.test(q) && /who|what|are you/.test(q)) {
        return this.identity_blurb;
      }

      // Legal / company / what does IN$DEX stand for / mean as a company
      if (
        /company name|legal name|registrant|limited|incorporated|what does (in\$dex|index|indx) (mean|stand)|what is (in\$dex|index) (short|stand|mean)/.test(q) ||
        (/company|registr|legal entity|corporation/.test(q) && /name|call|called|known/.test(q))
      ) {
        return this.legal_name_answer;
      }

      // What is IN$DEX — brand product answer, not legal dump
      if (/what is (in\$dex|index|indx)|about (in\$dex|indx)|tell me about (in\$dex|index)/.test(q)) {
        return this.what_is_indx;
      }

      if (/cook island|rarotonga|government|parliament|prime minister/.test(q)) {
        return (
          'IN$DEX is establishing its legal home in the Cook Islands. The founder is a New Zealand and Cook Islands citizen. ' +
          'I can explain IN$DEX and our pre-launch status honestly. I do not claim government licences or approvals that do not exist. ' +
          'If you need the formal company name for registration context, ask me the company name and I will give it.'
        );
      }

      if (/0\.24|price|token price|genesis/.test(q)) {
        return 'For IN$DEX, ' + this.genesis_note + ' Distribution and liquidity remain paused pending reconciliation and approval.';
      }

      if (/98\s*\/?\s*2|ninety.?eight/.test(q)) {
        return 'For IN$DEX: ' + this.doctrine_98_2;
      }

      if (/pilot|launch date|when.*live|february/.test(q)) {
        return 'IN$DEX targets a controlled public pilot on 24 February 2027 — a target, not a guarantee that every feature ships that day. Some information services are live now; financial tools are not.';
      }

      if (/wallet|payment|send money|buy indx|trading/.test(q)) {
        return 'Those IN$DEX services are not live for the public yet. They are planned or paused. Visitor Mode is for information only.';
      }

      if (/live|what works|status/.test(q)) {
        return 'IN$DEX today: website and SIINDEX Visitor Mode for information are live. Not live: accounts, wallets, payments, token distribution. Programme status: pre-launch.';
      }

      // Default: brand first, short
      return (
        'I speak for IN$DEX from our public living knowledge. ' +
        this.what_is_indx +
        ' Ask about status, Cook Islands, SIINDEX, or what is live versus planned.'
      );
    }
  };

  global.SIINDEX_PUBLIC = SIINDEX_PUBLIC;
})(typeof window !== 'undefined' ? window : globalThis);
