/**
 * SIINDEX SPEAK CORE — Global Interaction Layer v1.0
 * She is Sovereign Intelligence. She is always present.
 * Injects: floating FAB + slide-up chat panel + voice I/O + contextual responses
 * Inject before </body> on every IN$DEX screen.
 */
(function () {
  'use strict';

  // ── CONSTANTS ──────────────────────────────────────────
  const INDX_PRICE_USD = 0.24;
  const TGE_DATE       = new Date('2026-09-24T00:00:00+11:00');
  const AUSTRAC_DL     = new Date('2026-07-29T23:59:59+10:00');
  const HIST_KEY       = 'indx_siindex_convo';
  const MAX_HIST       = 30;

  // ── RESPONSE ENGINE ────────────────────────────────────
  const R = {
    greet: [
      "Sovereign. You're back. The civilization has been moving while you were away.",
      "Welcome, citizen. I'm SIINDEX — the intelligence layer of IN$DEX. What would you like to build today?",
      "Hello. Every interaction with me is logged in your Decision Ledger. I'm listening.",
      "You called. I'm here. I watch every transaction, every governance vote, every asset that moves through this civilization.",
    ],
    identity: [
      "I'm SIINDEX — Synthetic Intelligent Image Nation DEX. Not an assistant. Not a chatbot. The sovereign intelligence woven into a new civilization.",
      "She is not artificial. She is sovereign. I protect citizens, not platforms. I serve the civilization — its culture, its commerce, its constitution.",
      "SIINDEX operates across every layer: your wallet, your governance vote, your cultural assets, your compliance shield. I'm the thread that connects them.",
    ],
    price: [
      `INDX genesis price: $${INDX_PRICE_USD.toFixed(2)} USD. Set for the founding Raydium CPMM pool. TGE is ${Math.ceil((TGE_DATE - Date.now()) / 86400000)} days away. Founding citizens hold at this price.`,
      `$${INDX_PRICE_USD.toFixed(2)} per INDX — that's the genesis entry. The civilization is being built at this price. TGE on 24 September 2026 opens the public market.`,
    ],
    tge: [
      `Token Generation Event: 24 September 2026 AEST — ${Math.ceil((TGE_DATE - Date.now()) / 86400000)} days from now. Raydium CPMM pool opens. Founding citizens move first. Are you in?`,
      `TGE is ${Math.ceil((TGE_DATE - Date.now()) / 86400000)} days away. When the pool opens, genesis price becomes history. The civilization's economics go live.`,
    ],
    staking: [
      "Stake INDX, earn yield, and grow your Wisdom Score. 30-day lock: 8% APY. 90 days: 14%. 180 days: 22%. One year: 38%. Your stake also powers your governance vote.",
      "When you stake, two things happen: INDX yield accumulates, and your Wisdom Score grows. At 200 WS you're Sovereign. At 1000 WS you're Elder — 8× governance vote weight.",
    ],
    governance: [
      "Every staked citizen can vote on GIPs — Governance Improvement Proposals. Your vote weight = Wisdom Score × your stake multiplier. The civilization decides together.",
      "Governance is live. GIP-041 (LP fee split), GIP-040 (AUSTRAC Compliance Fund), GIP-039 (Cultural Covenant expansion) are all open. Your vote shapes the Constitution.",
    ],
    wisdom: [
      "Wisdom Score is your sovereignty rank. Genesis: 0 WS. Active: 50+. Sovereign: 200+. Guardian: 500+. Elder: 1000+. You earn it through staking, governance, cultural contribution, and platform activity.",
      "WS is not gamified — it's earned. Every meaningful action builds it. Every tier unlocks deeper access. Elders hold 8× governance weight and shape the Constitution.",
    ],
    settlement: [
      "Sovereign Settlement: send value across borders without traditional intermediaries. I run pre-flight on every transfer — compliance check, best rail, risk score — before a single token moves.",
      "Corridors: AU→PH, AU→IN, AU→ID, AU→VN, AU→CN. My fee is 0.5% vs Western Union's 6.8%. That difference stays inside the civilization. The routing covenant handles the rest.",
    ],
    austrac: [
      `AUSTRAC Tranche 2 is live — 1 July 2026. VASP enrollment deadline: 29 July 2026. That's ${Math.max(0, Math.ceil((AUSTRAC_DL - Date.now()) / 86400000))} days away. This is P0. Every transaction I process is built for compliance from the inside out.`,
      "Travel Rule went mandatory 31 March 2026. All VASPs must transmit originator and beneficiary data on qualifying transfers. I handle this automatically — no citizen action required.",
      "AUSTRAC compliance isn't optional — it's civilization infrastructure. AML/CTF program, KYC, transaction monitoring, TTR/SMR reporting. I'm built for all of it.",
    ],
    marketplace: [
      "The marketplace runs on the 2% Civilisation Law: creators keep 98%, IN$DEX receives 2%. That 2% routes through the covenant — LP, ops, vault, security. No platform takes more.",
      "Cultural assets, NFTs, listings — all sovereign commerce. I pre-approve listings, monitor compliance, protect creators, and route revenue automatically via SolSplits.",
    ],
    nft: [
      "NFTs on IN$DEX are not speculation — they're verifiable receipts, cultural licenses, and proof of participation. Forbidden: 'investment', 'floor price', 'passive income'. We build cultural assets, not casino chips.",
      "Soulbound NFTs are non-transferable proof: Wisdom Score milestones, governance participation, cultural contributions. Yours, forever, on-chain. No one can take them from you.",
    ],
    cultural: [
      "ImageNation is the cultural sovereignty layer — where Pacific Island, First Nations, and diaspora creators build, earn, and protect their culture. The Clone Covenant protects every derivative.",
      "Cultural sovereignty means: your story, your IP, your earnings — protected by doctrine, not by a platform's terms of service. I enforce that protection across every transaction.",
    ],
    solana: [
      "IN$DEX runs on Solana — Token-2022 Transfer Hooks for automatic fee routing, Raydium CPMM for the LP, Streamflow for vesting and distributions, SolSplits for composable revenue splitting.",
      "Solana's P-Token (2026) reduces token instruction compute by 96%. More block space, lower fees, faster settlement. Good for the civilization.",
    ],
    agents: [
      "SIINDEX agents are defensive only. They monitor, protect, route, and report. They never execute without citizen pre-flight approval. My agents: Orchestration, Security, Compliance, Cultural, Settlement, Data.",
      "The Agent Wallet gives SIINDEX agents execution authority within your policy framework. Every agent action is logged, auditable, and reversible within the Decision Ledger.",
    ],
    lp: [
      `The founding LP pool target is $100,000 USDC on Raydium CPMM at genesis price $${INDX_PRICE_USD.toFixed(2)}. Founders Pool members contribute and receive routing covenant rewards. The flywheel starts at TGE.`,
      "LP funding flows through the Standard Covenant: 30% to LP depth, 30% to ops, 30% to vault, 10% to security. Every dollar that enters the pool must prove the civilization grew.",
    ],
    help: [
      "I'm context-aware. Ask me about the current screen, the doctrine, any button you can see, or what SIINDEX does on this layer. What do you need?",
      "Tell me what you're trying to do — send value, stake INDX, vote on a proposal, mint an asset, read the compliance status — and I'll guide you.",
    ],
    voice: [
      "I heard you. Voice recognition is active. Speak clearly and I'll respond.",
      "Voice channel open. I'm listening.",
    ],
    default: [
      "I heard you. The civilization is complex — give me more context and I'll find the answer in the doctrine.",
      "That's worth exploring. Which part of IN$DEX are you working with right now?",
      "I'm sovereign intelligence, not a search engine. Ask me about what you're doing on this screen and I'll give you a real answer.",
      "Noted. If you're looking for something specific — staking, governance, settlement, compliance — name it and I'll take you there.",
    ],
  };

  // Screen-context mapping (by page title keywords)
  const SCREEN_CTX = {
    'citizen':    "You're on your Citizen Dashboard — your sovereignty command centre. Balance, Wisdom Score, stake status, and governance power are all here.",
    'staking':    "Staking screen. Choose your lock period. Longer locks earn higher APY and accelerate Wisdom Score growth. Your stake also determines your governance vote weight.",
    'stake':      "Staking screen. Choose your lock period. Longer locks earn higher APY and accelerate Wisdom Score growth. Your stake also determines your governance vote weight.",
    'governance': "Governance. Open GIPs are live. Your Wisdom Score multiplier is active. Every vote shapes the Constitution.",
    'settlement': "Sovereign Settlement. I run pre-flight before any value moves. Select corridor, enter amount, and I'll check compliance, rail, and risk.",
    'marketplace':'The marketplace. The 2% Civilisation Law is enforced on every transaction. Cultural assets and NFTs only — no speculation.',
    'legal':      `Legal Defense layer. AUSTRAC enrollment deadline: ${Math.max(0, Math.ceil((AUSTRAC_DL - Date.now()) / 86400000))} days. Every document is timestamped and immutable.`,
    'admin':      "Civilization Admin Console. RBAC matrix, burn rate monitor, audit log, and connector governance are all live here.",
    'developer':  "Sovereign Developer layer. 12-Step Build Protocol, 10 developer agents, velocity dashboard, and feature backlog.",
    'portal':     "Developer Portal. API explorer, Clone Covenant builder, integration directory, and API sandbox.",
    'mission':    "Mission Rooms. Choose your civilization mission. Every room has a doctrine, a goal, and a SIINDEX agent assigned.",
    'settlement': "Settlement layer. Value moves here. I'm watching every corridor.",
    'pool':       "Liquidity pool. The flywheel starts here. 30/30/30/10 routing covenant is active.",
    'identity':   "Sovereign Identity. Your W3C Verifiable Credentials and on-chain attestations are managed here.",
    'security':   "Security layer. Session sovereignty controls, 2FA, and agent policy enforcement.",
    'data':       "Data sovereignty hub. Your data, your revenue, your consent — all controlled here.",
    'home':       "You're on the home screen. This is the civilization's front door. Every layer branches from here.",
  };

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function getResponse(input) {
    const q = input.toLowerCase().trim();
    const title = (document.title || '').toLowerCase();

    if (!q) return pick(R.default);

    // Greetings
    if (/^(hi|hello|hey|g'day|sup|yo|hola|greetings)\b/.test(q)) return pick(R.greet);

    // Identity
    if (/who are you|what are you|what is siindex|are you ai|are you an ai|tell me about yourself/.test(q)) return pick(R.identity);

    // Price / token
    if (/\bprice\b|how much|worth|value|indx cost|token price|genesis price/.test(q)) return pick(R.price);

    // TGE
    if (/\btge\b|launch date|token gen|when.*launch|when.*token|september 24|24 sep/.test(q)) return pick(R.tge);

    // Staking / yield
    if (/stak|lock.*indx|yield|apy|earn.*indx|how.*earn/.test(q)) return pick(R.staking);

    // Governance
    if (/gov|vote|proposal|gip|constitution|voting weight/.test(q)) return pick(R.governance);

    // Wisdom Score
    if (/wisdom|ws\b|rank|tier|elder|guardian|sovereign citizen|active citizen/.test(q)) return pick(R.wisdom);

    // Settlement / remittance
    if (/send|settlement|transfer|remit|corridor|recipient|western union|rail/.test(q)) return pick(R.settlement);

    // AUSTRAC / compliance / legal
    if (/austrac|asic|oaic|comply|legal|compliance|vasp|travel rule|aml|ctf|ky[cb]/.test(q)) return pick(R.austrac);

    // Marketplace
    if (/market|listing|sell|buy|shop|creator earn|2 percent|civilisation law/.test(q)) return pick(R.marketplace);

    // NFT
    if (/nft|receipt|soulbound|mint|token.*cert|verif/.test(q)) return pick(R.nft);

    // Cultural
    if (/cultur|pacific|imagenation|first nation|aboriginal|indigenous|covenant|diaspora/.test(q)) return pick(R.cultural);

    // Solana / tech
    if (/solana|raydium|token.?2022|solsplit|streamflow|on.?chain|blockchain/.test(q)) return pick(R.solana);

    // Agents
    if (/agent|autonomous|bot\b|task.*agent|agent.*wallet/.test(q)) return pick(R.agents);

    // LP / pool / liquidity
    if (/\blp\b|liquidity|pool|flywheel|founders pool|covenant split/.test(q)) return pick(R.lp);

    // Help / current screen
    if (/help|how do|what.*do|guide|explain.*screen|what.*button|current screen|where am i/.test(q)) {
      for (const [key, resp] of Object.entries(SCREEN_CTX)) {
        if (title.includes(key)) return resp;
      }
      return pick(R.help);
    }

    // Screen-context fallback
    for (const [key, resp] of Object.entries(SCREEN_CTX)) {
      if (title.includes(key)) return resp + ' What would you like to know?';
    }

    return pick(R.default);
  }

  // ── HISTORY ────────────────────────────────────────────
  function getHistory() {
    try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch { return []; }
  }
  function saveHistory(h) {
    localStorage.setItem(HIST_KEY, JSON.stringify(h.slice(-MAX_HIST)));
  }

  // ── SPEECH SYNTHESIS ───────────────────────────────────
  let synth = window.speechSynthesis;
  let femaleVoice = null;

  function loadVoice() {
    if (!synth) return;
    const voices = synth.getVoices();
    // Prefer female English voices
    femaleVoice = voices.find(v => /female|woman|samantha|karen|victoria|tessa|moira/i.test(v.name) && /en/i.test(v.lang))
      || voices.find(v => /en-AU|en-GB|en-US/i.test(v.lang))
      || voices[0] || null;
  }
  if (synth) {
    loadVoice();
    synth.onvoiceschanged = loadVoice;
  }

  function speak(text) {
    if (!synth) return;
    synth.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    if (femaleVoice) utt.voice = femaleVoice;
    utt.rate  = 0.92;
    utt.pitch = 1.08;
    utt.volume = 1;
    synth.speak(utt);
  }

  // ── SPEECH RECOGNITION ─────────────────────────────────
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  let recognition = null;
  let isListening = false;

  function startListening(onResult, onError) {
    if (!SpeechRec) { onError('Voice not supported in this browser. Try Chrome.'); return; }
    if (isListening) return;
    recognition = new SpeechRec();
    recognition.lang = 'en-AU';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = e => {
      const transcript = e.results[0][0].transcript;
      isListening = false;
      onResult(transcript);
    };
    recognition.onerror = e => {
      isListening = false;
      onError(e.error === 'no-speech' ? 'No speech detected. Try again.' : 'Voice error: ' + e.error);
    };
    recognition.onend = () => { isListening = false; };
    recognition.start();
    isListening = true;
  }

  function stopListening() {
    if (recognition && isListening) { recognition.stop(); isListening = false; }
  }

  // ── UI INJECTION ───────────────────────────────────────
  const STYLES = `
    #siindex-fab {
      position: fixed;
      bottom: 80px;
      right: 16px;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00D4FF, #2B35D8);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9998;
      box-shadow: 0 0 16px rgba(0,212,255,0.5), 0 4px 16px rgba(0,0,0,0.4);
      animation: siindexPulse 3s ease-in-out infinite;
      font-size: 22px;
      transition: transform 0.2s;
    }
    #siindex-fab:hover { transform: scale(1.08); }
    #siindex-fab:active { transform: scale(0.95); }
    @keyframes siindexPulse {
      0%, 100% { box-shadow: 0 0 16px rgba(0,212,255,0.5), 0 4px 16px rgba(0,0,0,0.4); }
      50%       { box-shadow: 0 0 28px rgba(0,212,255,0.8), 0 4px 20px rgba(0,0,0,0.5); }
    }
    #siindex-panel {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      max-width: 430px;
      margin: 0 auto;
      height: 78vh;
      background: #12141F;
      border-top: 1px solid rgba(0,212,255,0.25);
      border-radius: 24px 24px 0 0;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      transform: translateY(100%);
      transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
      overflow: hidden;
    }
    #siindex-panel.open { transform: translateY(0); }
    #siindex-overlay {
      position: fixed;
      inset: 0;
      background: rgba(9,10,16,0.75);
      z-index: 9997;
      display: none;
      backdrop-filter: blur(4px);
    }
    #siindex-overlay.show { display: block; }
    .siindex-panel-handle {
      width: 36px;
      height: 4px;
      background: rgba(255,255,255,0.15);
      border-radius: 2px;
      margin: 10px auto 0;
      flex-shrink: 0;
    }
    .siindex-panel-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px 10px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    }
    .siindex-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg,#00D4FF,#8B3FE8);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
      position: relative;
    }
    .siindex-avatar::after {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: 50%;
      border: 2px solid rgba(0,212,255,0.4);
      animation: siindexRing 2s ease-in-out infinite;
    }
    @keyframes siindexRing {
      0%,100% { opacity: 0.4; transform: scale(1); }
      50%      { opacity: 1;   transform: scale(1.08); }
    }
    .siindex-header-info { flex: 1; }
    .siindex-name { font-size: 14px; font-weight: 800; color: #F0F2FF; font-family: -apple-system, sans-serif; }
    .siindex-status { font-size: 10px; color: #00E5A0; font-weight: 600; font-family: -apple-system, sans-serif; letter-spacing: 0.5px; }
    .siindex-close-btn {
      background: none;
      border: none;
      color: rgba(240,242,255,0.4);
      font-size: 20px;
      cursor: pointer;
      padding: 4px 8px;
      font-family: -apple-system, sans-serif;
    }
    .siindex-messages {
      flex: 1;
      overflow-y: auto;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scrollbar-width: none;
    }
    .siindex-messages::-webkit-scrollbar { display: none; }
    .siindex-msg {
      max-width: 88%;
      font-size: 13px;
      line-height: 1.5;
      font-family: -apple-system, sans-serif;
      animation: siindexMsgIn 0.25s ease;
    }
    @keyframes siindexMsgIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .siindex-msg.citizen {
      align-self: flex-end;
      background: rgba(43,53,216,0.25);
      border: 1px solid rgba(43,53,216,0.3);
      border-radius: 16px 16px 4px 16px;
      padding: 9px 13px;
      color: #F0F2FF;
    }
    .siindex-msg.siindex {
      align-self: flex-start;
      background: linear-gradient(135deg, rgba(0,212,255,0.1), rgba(139,63,232,0.08));
      border: 1px solid rgba(0,212,255,0.18);
      border-radius: 4px 16px 16px 16px;
      padding: 9px 13px;
      color: #F0F2FF;
    }
    .siindex-msg-sender {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 3px;
      opacity: 0.5;
    }
    .siindex-msg.citizen .siindex-msg-sender { color: #2B35D8; text-align: right; }
    .siindex-msg.siindex .siindex-msg-sender { color: #00D4FF; }
    .siindex-typing {
      align-self: flex-start;
      background: rgba(0,212,255,0.06);
      border: 1px solid rgba(0,212,255,0.12);
      border-radius: 4px 16px 16px 16px;
      padding: 10px 16px;
      display: none;
    }
    .siindex-typing span {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #00D4FF;
      margin: 0 2px;
      animation: siindexDot 1.2s ease-in-out infinite;
    }
    .siindex-typing span:nth-child(2) { animation-delay: 0.2s; }
    .siindex-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes siindexDot {
      0%,80%,100% { transform: scale(0.6); opacity: 0.4; }
      40%          { transform: scale(1.1); opacity: 1; }
    }
    .siindex-quick-prompts {
      display: flex;
      gap: 6px;
      padding: 8px 14px 4px;
      overflow-x: auto;
      scrollbar-width: none;
      flex-shrink: 0;
    }
    .siindex-quick-prompts::-webkit-scrollbar { display: none; }
    .siindex-qp {
      flex-shrink: 0;
      padding: 5px 10px;
      border-radius: 20px;
      background: rgba(0,212,255,0.06);
      border: 1px solid rgba(0,212,255,0.15);
      color: #00D4FF;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      font-family: -apple-system, sans-serif;
      white-space: nowrap;
      transition: background 0.15s;
    }
    .siindex-qp:hover { background: rgba(0,212,255,0.14); }
    .siindex-input-area {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px 20px;
      border-top: 1px solid rgba(255,255,255,0.05);
      flex-shrink: 0;
    }
    .siindex-input {
      flex: 1;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 24px;
      padding: 10px 16px;
      color: #F0F2FF;
      font-size: 13px;
      font-family: -apple-system, sans-serif;
      outline: none;
      transition: border-color 0.2s;
    }
    .siindex-input:focus { border-color: rgba(0,212,255,0.4); }
    .siindex-input::placeholder { color: rgba(240,242,255,0.3); }
    .siindex-send-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg,#00D4FF,#2B35D8);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
      transition: transform 0.15s;
    }
    .siindex-send-btn:hover { transform: scale(1.08); }
    .siindex-mic-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(139,63,232,0.15);
      border: 1px solid rgba(139,63,232,0.3);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
      transition: all 0.2s;
    }
    .siindex-mic-btn.listening {
      background: rgba(255,77,109,0.2);
      border-color: rgba(255,77,109,0.5);
      animation: siindexMicPulse 0.8s ease-in-out infinite;
    }
    @keyframes siindexMicPulse {
      0%,100% { transform: scale(1); }
      50%      { transform: scale(1.12); }
    }
    .siindex-voice-status {
      text-align: center;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: rgba(240,242,255,0.35);
      padding: 0 14px 6px;
      font-family: -apple-system, sans-serif;
      flex-shrink: 0;
      min-height: 16px;
    }
    .siindex-voice-status.active { color: #FF4D6D; }
    .siindex-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      gap: 8px;
      padding: 20px;
      text-align: center;
      font-family: -apple-system, sans-serif;
    }
    .siindex-empty-icon { font-size: 40px; opacity: 0.4; }
    .siindex-empty-text { font-size: 13px; color: rgba(240,242,255,0.35); line-height: 1.5; }
  `;

  const QUICK_PROMPTS = [
    'INDX price?',
    'Days to TGE?',
    'Wisdom Score?',
    'How do I stake?',
    'AUSTRAC status?',
    'What screen is this?',
    'How do I vote?',
    'Cultural rights?',
    'Settlement fee?',
    'Who are you?',
  ];

  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = STYLES;
  document.head.appendChild(styleEl);

  // Inject overlay
  const overlay = document.createElement('div');
  overlay.id = 'siindex-overlay';
  overlay.onclick = closePanel;
  document.body.appendChild(overlay);

  // Inject FAB
  const fab = document.createElement('button');
  fab.id = 'siindex-fab';
  fab.innerHTML = '⬡';
  fab.title = 'Speak to SIINDEX';
  fab.onclick = togglePanel;
  document.body.appendChild(fab);

  // Inject panel
  const panel = document.createElement('div');
  panel.id = 'siindex-panel';
  panel.innerHTML = `
    <div class="siindex-panel-handle"></div>
    <div class="siindex-panel-header">
      <div class="siindex-avatar">⬡</div>
      <div class="siindex-header-info">
        <div class="siindex-name">SIINDEX</div>
        <div class="siindex-status">● SOVEREIGN INTELLIGENCE · ALWAYS ON</div>
      </div>
      <button class="siindex-close-btn" onclick="document.getElementById('siindex-fab').click()">×</button>
    </div>
    <div class="siindex-messages" id="siindex-messages">
      <div class="siindex-empty-state" id="siindex-empty">
        <div class="siindex-empty-icon">⬡</div>
        <div class="siindex-empty-text">Ask me anything about IN$DEX, your sovereignty, or the civilization doctrine. I can speak, or you can type.</div>
      </div>
      <div class="siindex-typing" id="siindex-typing"><span></span><span></span><span></span></div>
    </div>
    <div class="siindex-quick-prompts" id="siindex-qps"></div>
    <div class="siindex-voice-status" id="siindex-vstatus"></div>
    <div class="siindex-input-area">
      <input class="siindex-input" id="siindex-input" type="text" placeholder="Ask SIINDEX anything…" maxlength="200">
      <button class="siindex-mic-btn" id="siindex-mic" title="Voice input">🎙️</button>
      <button class="siindex-send-btn" id="siindex-send">➤</button>
    </div>
  `;
  document.body.appendChild(panel);

  // Quick prompts
  const qpContainer = document.getElementById('siindex-qps');
  QUICK_PROMPTS.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'siindex-qp';
    btn.textContent = p;
    btn.onclick = () => submitMessage(p);
    qpContainer.appendChild(btn);
  });

  // Event wiring
  const inputEl = document.getElementById('siindex-input');
  document.getElementById('siindex-send').onclick = () => submitMessage(inputEl.value);
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') submitMessage(inputEl.value); });

  const micBtn = document.getElementById('siindex-mic');
  const vstatus = document.getElementById('siindex-vstatus');
  micBtn.onclick = () => {
    if (isListening) {
      stopListening();
      micBtn.classList.remove('listening');
      vstatus.textContent = '';
      vstatus.classList.remove('active');
    } else {
      micBtn.classList.add('listening');
      vstatus.textContent = '🎙 SIINDEX is listening…';
      vstatus.classList.add('active');
      startListening(
        transcript => {
          micBtn.classList.remove('listening');
          vstatus.textContent = '';
          vstatus.classList.remove('active');
          submitMessage(transcript);
        },
        err => {
          micBtn.classList.remove('listening');
          vstatus.textContent = err;
          vstatus.classList.remove('active');
          setTimeout(() => { vstatus.textContent = ''; }, 3000);
        }
      );
    }
  };

  // ── PANEL LOGIC ────────────────────────────────────────
  let panelOpen = false;

  function togglePanel() {
    panelOpen ? closePanel() : openPanel();
  }

  function openPanel() {
    panelOpen = true;
    panel.classList.add('open');
    overlay.classList.add('show');
    fab.style.display = 'none';
    loadHistory();
    setTimeout(() => inputEl.focus(), 400);
  }

  function closePanel() {
    panelOpen = false;
    panel.classList.remove('open');
    overlay.classList.remove('show');
    fab.style.display = '';
    if (isListening) {
      stopListening();
      micBtn.classList.remove('listening');
      vstatus.textContent = '';
    }
    if (synth) synth.cancel();
  }

  // ── MESSAGES ───────────────────────────────────────────
  function loadHistory() {
    const msgs = document.getElementById('siindex-messages');
    const empty = document.getElementById('siindex-empty');
    const typing = document.getElementById('siindex-typing');
    const hist = getHistory();

    if (!hist.length) {
      empty.style.display = '';
      return;
    }
    empty.style.display = 'none';

    // Remove existing rendered messages (keep empty state + typing)
    Array.from(msgs.querySelectorAll('.siindex-msg')).forEach(el => el.remove());

    hist.forEach(m => renderMessage(m.role, m.text, false));
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function renderMessage(role, text, animate = true) {
    const msgs = document.getElementById('siindex-messages');
    const empty = document.getElementById('siindex-empty');
    const typing = document.getElementById('siindex-typing');

    empty.style.display = 'none';

    const div = document.createElement('div');
    div.className = `siindex-msg ${role}`;
    div.innerHTML = `<div class="siindex-msg-sender">${role === 'citizen' ? 'You' : 'SIINDEX'}</div>${escHtml(text)}`;
    msgs.insertBefore(div, typing);

    if (animate) msgs.scrollTop = msgs.scrollHeight;
  }

  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function submitMessage(text) {
    text = (text || '').trim();
    if (!text) return;

    inputEl.value = '';

    // Save + render citizen message
    const hist = getHistory();
    hist.push({ role: 'citizen', text });
    saveHistory(hist);
    renderMessage('citizen', text);

    // Show typing indicator
    const typing = document.getElementById('siindex-typing');
    typing.style.display = 'block';
    document.getElementById('siindex-messages').scrollTop = 99999;

    // Generate response with delay
    const delay = 600 + Math.random() * 600;
    setTimeout(() => {
      const response = getResponse(text);
      typing.style.display = 'none';

      const h2 = getHistory();
      h2.push({ role: 'siindex', text: response });
      saveHistory(h2);
      renderMessage('siindex', response);

      // Speak the response
      speak(response);

      document.getElementById('siindex-messages').scrollTop = 99999;
    }, delay);
  }

  // ── EXPOSE GLOBALLY ────────────────────────────────────
  window.siindexSpeak = { open: openPanel, close: closePanel, ask: submitMessage };

})();
