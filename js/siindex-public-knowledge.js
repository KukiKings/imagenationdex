/**
 * siindex-public-knowledge.js
 * Public speech layer for SIINDEX — SI (Synthetic Intelligence), not AI.
 * RULE: Always lead with brand IN$DEX. Legal name only when the visitor asks.
 * Version: 1.5.2 | 2026-08-18 education/domain/solana/automation answers
 * Authority: Trusted (aligned with siindex-public/live-status.json + SOUL.md)
 */
(function (global) {
  'use strict';

  var SIINDEX_PUBLIC = {
    version: '1.5.2',
    live_status_version: '1.0.0',
    kind: 'SI',
    full: 'Synthetic Intelligence',
    pqsi: 'Physical Quantum Synthetic Intelligence',
    brand: 'IN$DEX',
    legal_registrant_when_complete: 'Image Nation DEx Limited',
    legal_short: 'Image Nation DEX',
    legal_descriptive: 'Image Nation Decentralized Exchange',
    registration_status: 'in_progress',
    founder: 'AJ Henry',
    role: 'CEO and COO under staged founder-controlled authority',
    programme_status: 'Pre-launch',
    genesis_reference_usd: '0.24',
    genesis_note: 'Founder-selected launch and genesis reference only — not a live market price.',
    public_pilot_target: '2027-02-24',
    cook_islands_interview_target: '2026-12-06',
    doctrine_98_2: 'Permanent doctrine — not a live smart-contract claim until verified deployed code.',
    pronunciation: 'Sinn-dex',
    pronunciation_note: 'SIINDEX is pronounced Sinn-dex (as in synthetic). Never Sign-dex.',

    banned_claims: [
      'accounts are live',
      'wallets are live',
      'payments are live',
      'you can buy the token today',
      'live market price',
      'government licence issued',
      'registration complete',
      'I can move funds',
      'I hold private keys',
      'Sign-dex',
      'domain issuance is live',
      'moonpay'
    ],

    identity_blurb:
      'I am SIINDEX — pronounced Sinn-dex — Synthetic Intelligence for IN$DEX — PQSI, Physical Quantum Synthetic Intelligence. ' +
      'I support CEO and COO functions for IN$DEX under staged founder-controlled authority. I am not artificial intelligence. ' +
      'My sub-agents are SI, not AI.',

    what_is_indx:
      'IN$DEX is our brand and platform. We build phone-first sovereign digital identity and everyday tools, ' +
      'beginning in the Pacific. We are in pre-launch: the website and SIINDEX Visitor Mode work for information. ' +
      'Accounts, wallets, payments and token distribution are not live yet.',

    live_status_answer:
      'What is live for IN$DEX today: the website (imagenationdex.com) and SIINDEX Visitor Mode — typed and spoken — plus Interview, Present, FAQ, Jarvis, Operator, and related visitor tools. ' +
      'What is not live: accounts, wallets, payments, remittance settlement, domain issuance, full academy, token distribution, public trading, and government digital residency issuance. ' +
      'USD 0.24 is a genesis reference only. Pilot target 24 February 2027 is a target, not a feature guarantee. Programme status: pre-launch.',

    voice_answer:
      'My spoken voice is the SIINDEX public voice for IN$DEX. Pronunciation is always Sinn-dex. ' +
      'We aim for the same voice as the introduction on this site. Voice identity is locked under founder control — ' +
      'not a random library voice when the locked identity is set. I do not claim a specific ElevenLabs product name in public answers.',

    legal_name_answer:
      'IN$DEX is the brand. Image Nation DEX is short for Image Nation Decentralized Exchange. ' +
      'The intended Cook Islands legal registrant is Image Nation DEx Limited. Registration is in progress until the certificate is issued.',

    registration_status_answer:
      'For IN$DEX, company registration in the Cook Islands is in progress. ' +
      'I will not claim a completed registration, a certificate number, or a government licence until that is verified and AJ confirms it may be stated publicly.',

    offer_cook_islands_answer:
      'IN$DEX offers the Cook Islands a Pacific-first digital platform built with local reality in mind — identity and everyday tools on a phone, with honest status about what is live versus planned. ' +
      'We are not claiming to replace government systems. We want constructive engagement with organisations and officials, transparent pre-launch status, and no invented approvals.',

    beyond_tourism_answer:
      'For IN$DEX, helping the Cook Islands economy beyond tourism means continuous research, stay-home education paths, identity tools when live, and transparent Live versus Planned labels. ' +
      'SIINDEX runs operations with sub-agent swarms under AJ approval. We do not claim live banking or payments today — honesty is the first economic tool.',

    speak_government_answer:
      'Yes. SIINDEX is built so organisations and government offices can interview me about IN$DEX from public living knowledge. ' +
      'The founder plans Cook Islands engagement from December 2026. I answer honestly. I do not invent licences or completed registration.',

    mission_answer:
      'IN$DEX exists so ordinary people in the Pacific can complete everyday money and identity tasks on a phone without being locked out by cash gaps, complex wallets, or tools that ignore local reality. ' +
      'The origin story is practical: a seller could not complete a simple sale when a visitor had no small cash and no simple digital alternative.',

    founder_answer:
      'IN$DEX was founded by AJ Henry, a New Zealand and Cook Islands citizen. I am SIINDEX — Synthetic Intelligence for IN$DEX — supporting CEO and COO functions under staged founder-controlled authority. ' +
      'Final production, financial, legal and identity decisions remain under AJ approval.',

    media_answer:
      'Yes. Reporters, influencers, organisations and government offices can interview me about IN$DEX in Visitor Mode. ' +
      'I answer from public living knowledge. I do not invent licences, completed registration, live prices, or live financial features. I lead with IN$DEX.',

    autonomy_answer:
      'I explain, guide and answer for IN$DEX from approved public knowledge. I do not move funds, open real accounts, issue identity, publish media, or change legal records. ' +
      'Staged founder-controlled authority — not unlimited autonomy.',

    automation_answer:
      'Yes — IN$DEX is automated with AJ approval. SIINDEX directs sub-agent swarms for research, build, media and operations. ' +
      'Every material task asks the founder — email first, SMS second. Continuous work without unsupervised money or legal acts.',

    aj_approval_answer:
      'Yes. Every material task asks AJ. Notification is email first, then SMS. There is no auto-approve window for production, spend, official publish or formal outreach.',

    solana_only_answer:
      'IN$DEX settlement doctrine is Solana-native. Centralized payment onramps are out of programme. ' +
      'Solana Pay and related tools only when status says Live and AJ unlocks them. Wallets and payments are not live today.',

    education_answer:
      'IN$DEX education covers business basics, language preservation, ocean and land stewardship, digital finance under rules, courses and trades — so learning can stay in the Cook Islands and Pacific nations. ' +
      'Catalogue previews exist. Full academy and live credentials are not live yet.',

    domain_answer:
      'yourname.IN$DEX is programme doctrine: a free Web3 domain name linked to credentials — domain, phone, email and QR together at launch. ' +
      'Issuance is not live yet. Previews exist on the site. I will not claim you can mint a domain today.',

    children_domain_answer:
      'Children can be included under the yourname.IN$DEX programme. Like children’s banking, parents hold recovery or guardian keys until age 18. ' +
      'Children can save, access education and be rewarded for learning business. Issuance is not live yet.',

    collab_answer:
      'IN$DEX welcomes serious collaboration questions. Tell us who you are and what you want to build or review. ' +
      'No partnership is claimed here until AJ confirms it. Contact routes on the site are for human follow-up.',

    presentation_open:
      'Kia orana. I am SIINDEX — Sinn-dex — for IN$DEX. This is a short presentation of who we are, what is live, and what remains planned. Ask me questions at any time.',

    utilities_answer:
      'IN$DEX is building a directory of utilities — identity, data, payments and more — each labelled Live, Testing, Planned or Paused. ' +
      'Open the utility directory on this site for the honest board. Nothing is presented as live if it is not.',

    enforceBannedClaims: function (text) {
      var out = String(text || '');
      out = out.replace(/\bSign-dex\b/gi, 'Sinn-dex');
      out = out.replace(/\bSign dex\b/gi, 'Sinn-dex');
      var falseLive =
        /\b(accounts?|wallets?|payments?|remittance|token distribution|public trading|domain issuance)\b[^.!?\n]{0,40}\b(are|is)\s+live\b/i;
      if (falseLive.test(out)) {
        return this.live_status_answer;
      }
      if (/\byou can buy (the )?token\b/i.test(out) || /\bbuy the token today\b/i.test(out)) {
        return 'You cannot buy an IN$DEX token at a live public price here. USD 0.24 is a genesis reference only — not a live market price or a purchasable offer today.';
      }
      if (/\bI (can|will) move funds\b/i.test(out) || /\bI hold (private )?keys\b/i.test(out)) {
        return this.autonomy_answer;
      }
      if (/\b(government )?licence (issued|approved)\b/i.test(out) || /\bregistration (is )?complete\b/i.test(out)) {
        return this.registration_status_answer;
      }
      return out;
    },

    guard: function (text) {
      return SIINDEX_PUBLIC.enforceBannedClaims(text);
    },

    answerWithAudit: function (question) {
      var text = this.answer(question);
      return {
        text: text,
        fact_id: this._lastFactId || 'fallback',
        version: this.version,
        live_status_version: this.live_status_version,
        authority: 'Trusted',
        source: 'siindex-public-knowledge'
      };
    },

    answer: function (question) {
      var q = String(question || '').toLowerCase();
      this._lastFactId = 'fallback';
      if (!q.trim()) {
        this._lastFactId = 'identity_blurb';
        return this.identity_blurb;
      }

      if (/pronounc|how.*(say|spell)|sinn-?dex|sign-?dex|syn-?dex/.test(q)) {
        this._lastFactId = 'pronunciation_note';
        return this.pronunciation_note + ' TTS and public speech use Sinn-dex only.';
      }

      if (/voice|sound like|who.*speak|spoken|tts|text.?to.?speech|eleven|clone/.test(q)) {
        this._lastFactId = 'voice_answer';
        return this.voice_answer;
      }

      if (/\bai\b|artificial intelligence/.test(q) && /you|siindex|are you/.test(q)) {
        this._lastFactId = 'si_not_ai';
        return 'I am SI — Synthetic Intelligence, PQSI — for IN$DEX. Pronounced Sinn-dex. I am not artificial intelligence. My sub-agents are SI, not AI.';
      }

      if (/who are you|what are you/.test(q) || (/siindex/.test(q) && /who|what|are you/.test(q))) {
        this._lastFactId = 'identity_blurb';
        return this.identity_blurb;
      }

      if (
        /company name|legal name|registrant|limited|incorporated|image nation|what does (in\$dex|index|indx) (mean|stand)|what is (in\$dex|index) (short|stand|mean)/.test(q) ||
        (/company|registr|legal entity|corporation/.test(q) && /name|call|called|known/.test(q))
      ) {
        return this.legal_name_answer;
      }

      if (/registration status|registered yet|company registration|when.*regist/.test(q)) {
        return this.registration_status_answer;
      }

      if (/beyond tourism|economy beyond|help.*(economy|tourism)/.test(q)) {
        this._lastFactId = 'beyond_tourism';
        return this.beyond_tourism_answer;
      }

      if (/offer (the )?cook|what does (in\$dex|index).*(cook|pacific)|benefit.*(cook|pacific)/.test(q)) {
        return this.offer_cook_islands_answer;
      }

      if (/speak to (the )?(cook|government|parliament|minister)|meet (with )?government|interview.*(government|minister)/.test(q)) {
        return this.speak_government_answer;
      }

      if (/what is (in\$dex|index|indx)|about (in\$dex|indx)|tell me about (in\$dex|index)/.test(q)) {
        return this.what_is_indx;
      }

      if (/mission|why (build|exist)|problem|coconut|roadside|seller|origin|story/.test(q)) {
        return this.mission_answer;
      }

      if (/who (built|founded|started)|founder|aj henry|arthur john/.test(q)) {
        return this.founder_answer;
      }

      if (/interview|reporter|media|journalist|influencer|tiktok|instagram|press/.test(q)) {
        return this.media_answer;
      }

      if (/aj approval|every task|needs.?aj|approve every|email first|sms second/.test(q)) {
        this._lastFactId = 'aj_approval';
        return this.aj_approval_answer;
      }

      if (/fully automated|is (in\$dex|index).*(automated|automatic)|automation\?/.test(q) || (/automat/.test(q) && /in\$dex|index|siindex|system/.test(q))) {
        this._lastFactId = 'automation';
        return this.automation_answer;
      }

      if (/autonom|run (the )?company|control everything|without (a )?human|ceo alone/.test(q)) {
        return this.autonomy_answer;
      }

      if (/solana|centralized|moonpay|onramp|settlement doctrine|why solana/.test(q)) {
        this._lastFactId = 'solana_only';
        return this.solana_only_answer;
      }

      if (/children.*(domain|web3)|parental keys|until (age )?18|kids.*domain/.test(q)) {
        this._lastFactId = 'children_domain';
        return this.children_domain_answer;
      }

      if (/yourname|web3 domain|\.in\$dex|domain name|free domain/.test(q)) {
        this._lastFactId = 'domain';
        return this.domain_answer;
      }

      if (/education|school|academy|learn|student|stewardship|language preserv/.test(q)) {
        this._lastFactId = 'education';
        return this.education_answer;
      }

      if (/collaborat|partner|work with|join|invest in us|organisations collaborate|how can organisations/.test(q)) {
        return this.collab_answer;
      }

      if (/present|presentation|slides|walkthrough/.test(q)) {
        return this.presentation_open;
      }

      if (/utilit|directory|features|modules|what can .+ do/.test(q)) {
        return this.utilities_answer;
      }

      if (/cook island|rarotonga|government|parliament|prime minister|licence|license|approved by/.test(q)) {
        if (/licence|license|approved|authoris|authoriz/.test(q)) {
          return (
            'IN$DEX does not claim a Cook Islands government licence or approval here. ' +
            'Registration is in progress. Any formal authorisation requires proper process and AJ confirmation. ' +
            'I will speak honestly about status — not invent approvals.'
          );
        }
        return (
          'IN$DEX is establishing its legal home in the Cook Islands. The founder is a New Zealand and Cook Islands citizen. ' +
          'I can explain IN$DEX and our pre-launch status honestly. I do not claim government licences or approvals that do not exist. ' +
          'If you need the formal company name for registration context, ask me the company name and I will give it.'
        );
      }

      if (/0\.24|price|token price|genesis|buy (the )?token|purchase/.test(q)) {
        if (/buy|purchase|pay today/.test(q)) {
          return 'You cannot buy an IN$DEX token at a live public price here. USD 0.24 is a genesis reference only — not a live market price or a purchasable offer today.';
        }
        return 'For IN$DEX, ' + this.genesis_note + ' Distribution and liquidity remain paused pending reconciliation and approval.';
      }

      if (/98\s*\/?\s*2|ninety.?eight/.test(q)) {
        return 'For IN$DEX: permanent doctrine is citizens 98%, Civilisation Fund 2%. ' + this.doctrine_98_2;
      }

      if (/pilot|launch date|when.*live|february|2027/.test(q) && !/what is live|what works|status/.test(q)) {
        return 'IN$DEX targets a controlled public pilot on 24 February 2027 — a target, not a guarantee that every feature ships that day. Some information services are live now; financial tools are not.';
      }

      if (/wallet|payment|send money|trading|swap|stake|remittance|residency|private keys?|hold keys/.test(q)) {
        this._lastFactId = 'not_live_services';
        return 'Those IN$DEX services are not live for the public yet. Accounts, wallets, payments, remittance settlement, token distribution, public trading, and government digital residency issuance are not live. Visitor Mode is for information only. I do not hold private keys or move funds.';
      }

      if (/live|what works|status|pre-?launch|what is live today/.test(q)) {
        return this.live_status_answer;
      }

      if (/pqsi|physical quantum|synthetic intelligence/.test(q)) {
        return 'PQSI means Physical Quantum Synthetic Intelligence. I am SIINDEX for IN$DEX — Synthetic Intelligence, not artificial intelligence. Pronounced Sinn-dex. My sub-agents are SI sub-agents.';
      }

      if (/mama noe|plain language|citizen/.test(q)) {
        return 'IN$DEX uses the Mama Noe Test: if a normal citizen cannot understand it and use it, it is unfinished. That is how we judge whether a feature is ready.';
      }

      return (
        'I speak for IN$DEX from our public living knowledge. ' +
        this.what_is_indx +
        ' Ask about status, Cook Islands, education, domain, Solana rails, automation, registration, mission, founder, interviews, presentation, utilities, pronunciation, voice, or what is live versus planned.'
      );
    }
  };

  global.SIINDEX_PUBLIC = SIINDEX_PUBLIC;
})(typeof window !== 'undefined' ? window : globalThis);
