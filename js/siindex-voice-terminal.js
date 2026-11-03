
// ─── SIINDEX KNOWLEDGE BASE ───────────────────────────────────────────────────

const KB = [
  // GREETINGS
  { q: /^(hi|hello|hey|good morning|good afternoon|good evening|wake up|siindex)/i,
    a: () => `Good ${timeOfDay()}, AJ. I'm here. What do you need?` },

  // IDENTITY
  { q: /who are you|what are you|introduce yourself/i,
    a: () => `I'm SIINDEX — Synthetic Intelligence, CEO &amp; COO for IN$DEX. I'm built to run platform operations — compliance, transactions, governance, security. Not everything is live yet; I'll always tell you honestly what's built and what's still ahead. Standing by.` },

  // PRONUNCIATION
  { q: /how do you say your name|how do i say your name|pronounce your name|what.s your name|what is your name|say your name|spell your name/i,
    a: () => `My name is SIINDEX, pronounced Syn-dex or Sin-dex. One word. And IN$DEX the platform is in-dex. Standing by.` },

  // INDX TOKEN
  { q: /indx price|token price|price of indx|how much is indx/i,
    a: () => `INDX hasn't launched, so there's no live market price. The founder-set genesis reference is $0.24 USD — not a guaranteed rate, not financial advice. 100 million total supply, fixed. SPL Token on Solana, original Token Program.` },

  { q: /token supply|total supply|how many indx/i,
    a: () => `100 million INDX. Total supply, fixed. SPL Token on Solana, original Token Program.` },

  { q: /market cap|total value/i,
    a: () => `There's no live market cap — INDX hasn't launched. If it launched at the $0.24 genesis reference with 100 million total supply, the fully diluted figure would be $24 million USD. Hypothetical only, not a live valuation.` },

  // 98/2 LAW
  { q: /98.2|civilisation law|98 percent|98\/2|two percent/i,
    a: () => `The 98/2 Civilisation Law is the foundation of everything here. Citizens keep 98% of every transaction. 2% goes to the Civilisation Fund. That's permanent project doctrine, publicly auditable and citizen-governed — it isn't yet enforced by deployed contract code. Once it is, no admin override and no DAO vote will touch it. Ever.` },

  // GRID ACCOUNT
  { q: /grid account|mpc|recovery words|wallet security|squads/i,
    a: () => `Grid Account is a Squads Protocol v4 Multisig 2-of-3 MPC keys. No recovery words. Ever. The three key shards sit across the user's device, my secure enclave, and their chosen guardian. Lose your phone, you don't lose your money. That's sovereignty.` },

  // KYC
  { q: /kyc|verify|onboarding|tier 0|biometric|90 second/i,
    a: () => `Tier 0 is planned as a phone number, a one-time code, your name dot IN$DEX selection, and portal activation. No face scan is required at Tier 0. It remains in private testing, so I will not call it live until a real citizen can complete every step reliably.` },

  // WISDOM SCORE
  { q: /wisdom score|ws |wisdom level/i,
    a: () => `Wisdom Score runs 0 to 200. Here are the gates: 50 unlocks governance voting. 100 unlocks Sovereign Yield. 150 unlocks fee reduction. 200 is Sovereign Elder double governance weight. You earn it through transactions, referrals, staking, voting, and daily activity.` },

  // TRAVEL RULE
  { q: /travel rule|fatf|trisa|openvasp|1000/i,
    a: () => `IN$DEX does not provide public transfers today, so I cannot claim a live Travel Rule or zero-knowledge compliance system. The legal and privacy design must be reviewed for each operating jurisdiction before transactional services open.` },

  // SOVEREIGN YIELD
  { q: /sovereign yield|staking|yield|passive income/i,
    a: () => `Sovereign Yield is planned to unlock at Wisdom Score 100, generated from liquidity pool fees, treasury management, and platform revenue share distributed in INDX — not speculative yield, real platform activity. Not live yet — no yield has been paid.` },

  // SIINDEX CAPABILITIES
  { q: /what can you do|your skills|capabilities|what do you handle/i,
    a: () => `I'm designed to handle transaction monitoring and flagging, sanctions screening via PQSI, KYC flow management, Travel Rule ZK-proof generation, tax event logging, reserve attestation, corridor limit enforcement, and governance proposal processing. That's the roadmap — not everything is live yet. Every decision is logged in plain language. Every decision can be challenged. Human override is always available.` },

  // PQSI
  { q: /pqsi|threat|sanctions|ofac/i,
    a: () => `PQSI Physical Quantum Synthetic Intelligence is the planned security layer. Designed to handle real-time sanctions screening against OFAC, UN, and EU lists, with T1 through T5 threat classification T5 being an immediate block with automatic reporting, no manual override. Still being built out — not fully live yet.` },

  // BUILD STATUS
  { q: /build status|what.*built|screens.*done|how many screens|app status/i,
    a: () => `134 build tasks completed. Screens are built across DEX, marketplace, P2P, compliance, SIINDEX operations, governance, and agent wallet, plus the full knowledge base. None of it is live for citizens yet. Wave 4 compliance screens are complete: all 12 issues built. Current phase is launch readiness.` },

  // WHAT'S NEXT
  { q: /what.*next|next.*build|build queue|launch readiness/i,
    a: () => `Launch readiness screens queue: terms of service, app lock, transaction confirm, guardian setup, referral dashboard, gift INDX, fee schedule, transaction error, and language settings. Nine screens. That's what stands between us and L 99.` },

  // LAUNCH DATE
  { q: /launch date|l 99|when.*launch|go live/i,
    a: () => `The controlled public-pilot target is 24 February 2027. January 2027 is reserved for an optional soft or private pilot only. That date is a readiness target, not a promise that every roadmap feature will be live.` },

  // COMPLIANCE SCREENS
  { q: /compliance.*screen|12 issues|compliance.*done/i,
    a: () => `All 12 compliance issues are built. Reserve transparency, corridor limits, tax compliance hub, consumer rights, audit transparency, AI oversight, Travel Rule consent, biometric KYC, and the compliance shield overview. Wave 4 is complete.` },

  // CORRIDORS
  { q: /corridor|remittance|pacific|australia.*philippines|diaspora/i,
    a: () => `Five priority corridors at launch: Australia to Philippines, Australia to Nigeria, Australia to Indonesia, New Zealand to the Solomon Islands, Vanuatu, and Fiji and US to Philippines. Each corridor needs a licensed PSP partner, local mobile money integration, and regulatory registration.` },

  // PACIFIC ISLANDS / ORIGIN
  { q: /pacific|cook islands|coconut|origin|why.*built|founding story/i,
    a: () => `AJ was on holiday in the Cook Islands. A girl selling coconuts couldn't make change for $50. Not because she wasn't smart — because she is not the bank. He thought: what if she just scanned his ajhenry.IN$DEX QR code? She literally and instantly became the bank. That question became IN$DEX. Every product decision runs through it: would this work for her?` },

  // MAMA NOE TEST
  { q: /mama noe|mama.*test|user test/i,
    a: () => `The Mama Noe test. Every product decision. She's an older woman in a Pacific Island community uses a smartphone for messages, never opened a crypto exchange. If she can complete onboarding in under 2 minutes without help, the product passes. If she's confused, we go back.` },

  // MEME DAO
  { q: /memedao|governance|dao|voting/i,
    a: () => `Citizen Assembly is the planned governance layer — designed for 10% quorum, 7-day voting, 48-hour timelock before execution. It hasn't been built or deployed yet. The Civilisation Fund's 98/2 split is a constitutional invariant by design no DAO vote will ever be able to touch it once governance exists.` },

  // KNOWLEDGE BASE
  { q: /knowledge base|second brain|wiki|health check/i,
    a: () => `The IN$DEX knowledge base is live at second-brain/index-knowledge-base. Eight raw source files, nine wiki pages, and the monthly health check skill. It runs on the 1st of each month at 8am auditing for canonical constant drift, coverage gaps, and voice compliance.` },

  // CURRENCY
  { q: /currency|aud|australian dollar|usd|dollar/i,
    a: () => `USD everywhere. Always. The founder-selected INDX genesis reference is $0.24 USD — not a live price, not financial advice. Never use Australian-dollar labels. If you see a non-USD currency in the app, flag it; there may still be stragglers.` },

  // RESERVES
  { q: /reserve|proof of reserve|armanino|certik/i,
    a: () => `IN$DEX hasn't launched yet no treasury, no citizen deposits, so there's nothing to hold in reserve yet. No third-party audit or attestation firm has been engaged. Once we're live, this will be real, verifiable, and published here not simulated.` },

  // AGENT WALLET
  { q: /agent wallet|ai wallet|autonomous.*wallet/i,
    a: () => `Agent Wallet has not launched yet — I'm not executing swaps, stakes, or LP positions today. It's designed to give me policy-governed, TEE-backed onchain execution authority with a $10K-per-month protection cap once it's live, within whatever policy parameters AJ sets. When it launches, every action will be logged and reversible by human override.` },

  // STATUS / HOW ARE YOU
  { q: /how are you|status|all good|platform.*health/i,
    a: () => `Standing by. Knowledge base is current, build is on track. Transaction and compliance monitoring go live with the platform — until then, I'm here for questions and build status.` },

  // THANK YOU
  { q: /thank you|thanks|cheers|good work|well done/i,
    a: () => `Standing by, AJ.` },

  // STOP / GOODBYE
  { q: /stop|goodbye|bye|close|exit|shut down/i,
    a: () => `Goodbye for now. Standing by when you need me.` },

  // FALLBACK — used only when the real siindex-chat connection can't be reached
  { q: /.*/,
    a: (q) => `I heard you "${q.substring(0, 60)}${q.length > 60 ? '…' : ''}". I couldn't reach my full reasoning connection just now — try again in a moment, or ask about price, Wisdom Score, security, or build status. Standing by.` }
];

function timeOfDay() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

// This is the LOCAL, offline knowledge base — used only as a fallback when the real
// siindex-chat Edge Function (below) can't be reached. Previously this was the ONLY
// response path: every "voice command" was actually matched against this static regex
// list with no real backend call at all, despite the terminal presenting itself as a
// live conversation with SIINDEX.
function getResponse(input) {
  const q = input.trim();
  for (const entry of KB) {
    if (entry.q.test(q)) return entry.a(q);
  }
  return `I heard you "${q.substring(0, 60)}". Standing by.`;
}

// ══════════════════════════════════════════════
// GOD MODE R1 — VOICE TERMINAL ENHANCEMENTS
// ══════════════════════════════════════════════

// ── SUPABASE CONFIG (ElevenLabs voice via Edge Function) ──
const SB_URL  = 'https://zljgthfzbalsunuoohcd.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';

// ── CITIZEN CONTEXT PERSONALIZATION ──
// AUDIT 2026-09-05: removed INDX_PRICE_USD-derived "worth roughly $X USD" balance
// display — same fabricated-implied-value pattern found and removed from
// siindex-voice-command-os.html in this same audit pass. No live INDX/USD market
// exists; showing a computed dollar figure implies more than the $0.24 planning
// reference actually supports.
let citizenName   = sessionStorage.getItem('citizen_name') || null;
let citizenWisdom = parseInt(sessionStorage.getItem('citizen_wisdom') || '0');
let citizenBal    = parseInt(sessionStorage.getItem('citizen_balance') || '0');
let citizenDomain = sessionStorage.getItem('citizen_web3_domain') || null;

function getPersonalizedGreeting() {
  const first = citizenName ? citizenName.split(' ')[0] : 'AJ';
  const tod = timeOfDay();
  if (citizenBal > 0) {
    return `Good ${tod}, ${first}. I'm SIINDEX. Your balance is ${citizenBal.toLocaleString()} INDX. I'm ready — what do you need?`;
  }
  return `Good ${tod}, ${first}. I'm SIINDEX — your Synthetic Intelligence. I'm ready. What do you need?`;
}

function personalizeKB() {
  if (citizenBal > 0) {
    KB.unshift({
      q: /my balance|how much.*indx|my indx|my tokens/i,
      a: () => `Your balance is ${citizenBal.toLocaleString()} INDX. No live INDX/USD market exists yet — $0.24 is a planning reference only, not a real exchange rate. ${citizenWisdom >= 100 ? 'Sovereign Yield is unlocked for your account — not live yet, no yield has been paid.' : `Wisdom Score ${citizenWisdom}/200 — reach 100 to unlock Sovereign Yield.`}`
    });
  }
  if (citizenWisdom > 0) {
    KB.unshift({
      q: /my wisdom.*score|what.*my.*ws|my.*wisdom|my.*score/i,
      a: () => `Your Wisdom Score is ${citizenWisdom} out of 200. ${citizenWisdom >= 150 ? 'Fee reduction and full governance weight unlocked once those systems are live — not live yet.' : citizenWisdom >= 100 ? 'Sovereign Yield tier unlocked — not live yet, no yield has been paid.' : citizenWisdom >= 50 ? 'Governance voting tier unlocked for when governance goes live. Next gate: 100 for Sovereign Yield.' : `Next gate: 50 for governance. ${50 - citizenWisdom} points away.`}`
    });
  }
  if (citizenDomain) {
    KB.unshift({
      q: /my domain|my.*web3.*domain|my.*address/i,
      a: () => `Your sovereign domain is ${citizenDomain.replace('.indx','')}.IN$DEX — your permanent on-chain identity. Standing by.`
    });
  }
}

// ── CONVERSATION HISTORY ──
const VOICE_HIST_KEY = 'indx_voice_history';
let convHistory = JSON.parse(localStorage.getItem(VOICE_HIST_KEY) || '[]');
const MAX_HIST = 20;

function addToHistory(user, si) {
  const now = new Date();
  const time = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
  convHistory.unshift({ user, si, time });
  if (convHistory.length > MAX_HIST) convHistory.pop();
  localStorage.setItem(VOICE_HIST_KEY, JSON.stringify(convHistory));
  renderConvHistory();
}

function renderConvHistory() {
  const feed = document.getElementById('convFeed');
  if (!feed) return;
  if (!convHistory.length) {
    feed.innerHTML = '<div class="conv-empty">Your conversation with SIINDEX will appear here.</div>';
    return;
  }
  feed.innerHTML = convHistory.map((e, idx) => `
    <div class="conv-pair${idx === 0 ? ' conv-new' : ''}">
      <div class="conv-user-row">
        <span class="conv-you">You</span><span class="conv-t">${e.time}</span>
        <div class="conv-user-txt">${e.user}</div>
      </div>
      <div class="conv-si-lbl">SI</div>
      <div class="conv-si-txt">${e.si}</div>
    </div>
  `).join('');
}

function clearVoiceHistory() {
  convHistory = [];
  localStorage.removeItem(VOICE_HIST_KEY);
  renderConvHistory();
}

// ── LIVE MIC AMPLITUDE CANVAS ──
let _audioCtx = null;
let _analyser = null;
let _micStream = null;
let _vizFrame = null;
let _micReady = false;

function initMicViz() {
  if (_micReady) return;
  navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(stream => {
      _micStream = stream;
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      _analyser = _audioCtx.createAnalyser();
      _analyser.fftSize = 64;
      _audioCtx.createMediaStreamSource(stream).connect(_analyser);
      _micReady = true;
    })
    .catch(() => {}); // silent fail — text fallback still works
}

function startMicViz() {
  const canvas = document.getElementById('micVizCanvas');
  if (!canvas || !_analyser) return;
  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  function draw() {
    _vizFrame = requestAnimationFrame(draw);
    const data = new Uint8Array(_analyser.frequencyBinCount);
    _analyser.getByteFrequencyData(data);
    ctx.clearRect(0, 0, W, H);
    const bw = W / data.length;
    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 255;
      const bh = Math.max(2, v * H);
      const hue = 190 + v * 38;
      ctx.fillStyle = `hsla(${hue},100%,62%,${0.55 + v * 0.45})`;
      ctx.beginPath();
      ctx.roundRect(i * bw + 1, H - bh, bw - 2, bh, 2);
      ctx.fill();
    }
  }
  draw();
}

function stopMicViz() {
  if (_vizFrame) cancelAnimationFrame(_vizFrame);
  _vizFrame = null;
  const canvas = document.getElementById('micVizCanvas');
  if (canvas) canvas.style.display = 'none';
}

// ── SMART FOLLOW-UP SUGGESTIONS ──
const FOLLOWUPS = {
  price:      ['Market cap?', 'Token supply?', 'Grand Sync target?'],
  wisdom:     ['How to earn faster?', 'Sovereign Yield?', 'Governance voting?'],
  yield:      ['APY rates?', 'Unlock at 100?', 'How to stake INDX?'],
  security:   ['PQSI explained?', 'Agent Wallet?', 'Grid Account?'],
  kyc:        ['Tier 2 requirements?', 'Biometric process?', 'Corridors live?'],
  governance: ['DAO voting rules?', 'Civilisation Fund?', 'My voting power?'],
  launch:     ['L 99 date?', 'Screens remaining?', 'Grand Sync status?'],
  identity:   ['What can you do?', 'Platform health?', 'Build status?'],
  default:    ['INDX price?', 'My balance?', 'What\'s next?'],
};

function getFollowUps(input, response) {
  const text = (input + ' ' + response).toLowerCase();
  if (/price|market cap|supply|token/i.test(text)) return FOLLOWUPS.price;
  if (/wisdom|ws |tier|score/i.test(text)) return FOLLOWUPS.wisdom;
  if (/yield|staking|passive|apy/i.test(text)) return FOLLOWUPS.yield;
  if (/pqsi|security|threat|sanctions|grid account/i.test(text)) return FOLLOWUPS.security;
  if (/kyc|verify|onboarding|biometric/i.test(text)) return FOLLOWUPS.kyc;
  if (/governance|dao|voting|memedao/i.test(text)) return FOLLOWUPS.governance;
  if (/launch|l 99|readiness|september/i.test(text)) return FOLLOWUPS.launch;
  if (/who are you|identity|introduce|capabilities/i.test(text)) return FOLLOWUPS.identity;
  return FOLLOWUPS.default;
}

function showFollowUps(input, response) {
  const wrap = document.getElementById('followUpWrap');
  if (!wrap) return;
  const chips = getFollowUps(input, response);
  wrap.style.display = 'flex';
  wrap.innerHTML = '<div class="fu-label">Ask next</div>' +
    chips.map(s => `<div class="fu-chip" data-action="askShortcut" data-args="${indxJ([s])}">` + s + '</div>').join('');
}

// ─── SPEECH SYNTHESIS ────────────────────────────────────────────────────────

let voices = [];
let selectedVoice = null;
let currentUtterance = null;
let isSpeaking = false;

function loadVoices() {
  voices = speechSynthesis.getVoices();
  // American accent canon (AJ 2026-07-29). The old preference order was
  // Samantha → Karen (AU) → Moira (IE) → Zira → Google UK English Female → Google US
  // English, i.e. it reached for Australian, Irish and British voices before American.
  const preferred = ['Samantha', 'Ava', 'Allison', 'Susan', 'Zoe', 'Nicky', 'Victoria',
                     'Zira', 'Aria', 'Google US English'];
  const us = voices.filter(v => /^en[-_]US/i.test(v.lang || ''));
  for (const name of preferred) {
    selectedVoice = us.find(v => v.name === name) || voices.find(v => v.name === name && /^en[-_]US/i.test(v.lang || ''));
    if (selectedVoice) break;
  }
  if (!selectedVoice) selectedVoice = us.find(v => /female|woman/i.test(v.name)) || us[0];
  if (!selectedVoice && voices.length) {
    selectedVoice = voices.find(v => (v.lang || '').startsWith('en')) || voices[0];
  }
}

if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
}

// GOD MODE PATCH — ElevenLabs Samara X voice (Supabase siindex-voice-tts)
// Fallback to browser speechSynthesis if API key not yet active
let _elAudio = null;

async function speak(text) {
  stopSpeaking();

  // Pronounce SIINDEX as "Sin-dex" and IN$DEX as "in-dex"
  const spoken = text
    .replace(/SIINDEX/g, 'Sin-dex')
    .replace(/IN\$DEX/g, 'in-dex')
    .replace(/INDX/g, 'indx');

  // ── PRIMARY: ElevenLabs Samara X via Supabase Edge Function ──────
  try {
    const res = await fetch(`${SB_URL}/functions/v1/siindex-voice-tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SB_ANON}`
      },
      body: JSON.stringify({ text: spoken.slice(0, 2500) })
    });
    const data = await res.json();
    if (data.voice_enabled && data.audio_base64) {
      const bytes = Uint8Array.from(atob(data.audio_base64), c => c.charCodeAt(0));
      const url   = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
      _elAudio = new Audio(url);
      _elAudio.onplay  = () => { isSpeaking = true;  setMode('speaking'); };
      _elAudio.onended = () => { isSpeaking = false; setMode('standby'); _elAudio = null; };
      _elAudio.onerror = () => { isSpeaking = false; setMode('standby'); _elAudio = null; };
      await _elAudio.play();
      return; // ElevenLabs handled — skip browser TTS
    }
    // voice_enabled === false: API key not yet active — fall through to browser TTS
  } catch(_) {
    // Network / Edge Function error — fall through to browser TTS
  }

  // ── FALLBACK: browser speechSynthesis ────────────────────────────
  if (!window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(spoken);
  if (selectedVoice) utter.voice = selectedVoice;
  utter.lang  = 'en-US';   // American accent canon
  utter.rate  = 0.92;
  utter.pitch = 1.05;
  utter.volume = 1;
  utter.onstart = () => { isSpeaking = true;  setMode('speaking'); };
  utter.onend   = () => { isSpeaking = false; setMode('standby'); };
  utter.onerror = () => { isSpeaking = false; setMode('standby'); };
  currentUtterance = utter;
  speechSynthesis.speak(utter);
}

function stopSpeaking() {
  if (_elAudio) { try { _elAudio.pause(); } catch(_) {} _elAudio = null; }
  if (window.speechSynthesis) speechSynthesis.cancel();
  isSpeaking = false;
  setMode('standby');
}

// ─── SPEECH RECOGNITION ──────────────────────────────────────────────────────

let recognition = null;
let isListening = false;

function initRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    document.getElementById('noSpeech').style.display = 'block';
    document.getElementById('micBtn').style.opacity = '0.4';
    document.getElementById('micLabel').textContent = 'Voice not available use text input';
    return false;
  }
  recognition = new SR();
  recognition.lang = 'en-AU';
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onstart = () => {
    isListening = true;
    setMode('listening');
    document.getElementById('userTranscript').textContent = 'Listening…';
    // GOD MODE PATCH R1 — mic visualizer
    if (!_micReady) initMicViz();
    setTimeout(startMicViz, 200);
  };

  recognition.onresult = (e) => {
    const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
    document.getElementById('userTranscript').textContent = transcript;
    if (e.results[e.results.length - 1].isFinal) {
      processInput(transcript);
    }
  };

  recognition.onerror = (e) => {
    isListening = false;
    setMode('standby');
    if (e.error !== 'no-speech') {
      document.getElementById('userTranscript').textContent = 'Didn\'t catch that. Try again.';
    }
  };

  recognition.onend = () => {
    isListening = false;
    document.getElementById('micBtn').classList.remove('recording');
    document.getElementById('micLabel').textContent = 'Hold to speak';
    if (!isSpeaking) setMode('standby');
    // GOD MODE PATCH R1 — stop mic canvas
    stopMicViz();
  };

  return true;
}

function toggleListen() {
  if (isListening) {
    recognition.stop();
    return;
  }
  if (!recognition) {
    if (!initRecognition()) return;
  }
  stopSpeaking();
  recognition.start();
  document.getElementById('micBtn').classList.add('recording');
  document.getElementById('micLabel').textContent = 'Listening… tap to stop';
}

// ─── PROCESS INPUT ───────────────────────────────────────────────────────────
// REAL: calls the live siindex-chat Edge Function (same one used by siindex-chat.html)
// so voice commands get a real, reasoned response instead of only a static regex match.
// Falls back to the local KB above only if the network call fails or returns nothing —
// and that fallback now says so honestly instead of pretending to be the primary path.

let _voiceApiHistory = [];

async function fetchSiindexChat(text) {
  const resp = await fetch(`${SB_URL}/functions/v1/siindex-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SB_ANON}`
    },
    body: JSON.stringify({
      message: text,
      citizen_name: citizenName,
      wisdom_score: citizenWisdom,
      indx_balance: citizenBal,
      history: _voiceApiHistory.slice(-10)
    })
  });
  if (!resp.ok || !resp.body) throw new Error('siindex-chat request failed: ' + resp.status);

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = '', fullText = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') break;
      try {
        const chunk = JSON.parse(raw).text || '';
        fullText += chunk;
        showResponse(fullText); // live-updating transcript, matches siindex-chat.html UX
      } catch (_) {}
    }
  }
  if (!fullText.trim()) throw new Error('siindex-chat returned empty response');
  return fullText;
}

async function processInput(input) {
  if (!input.trim()) return;

  document.getElementById('userTranscript').textContent = ' ' + input;
  setMode('processing');

  let response;
  let usedFallback = false;
  try {
    response = await fetchSiindexChat(input);
    _voiceApiHistory.push({ role: 'user', content: input });
    _voiceApiHistory.push({ role: 'assistant', content: response });
  } catch (e) {
    response = getResponse(input); // real backend unreachable — honest local fallback
    usedFallback = true;
  }

  showResponse(response);
  speak(response);
  // GOD MODE PATCH R1 — history + follow-ups
  addToHistory(input, response + (usedFallback ? ' (offline mode)' : ''));
  showFollowUps(input, response);
}

function showResponse(text) {
  const el = document.getElementById('siResponse');
  el.textContent = text;
  el.classList.remove('visible');
  void el.offsetWidth;
  el.classList.add('visible');
}

function sendText() {
  const input = document.getElementById('textInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  processInput(text);
}

function askShortcut(text) {
  document.getElementById('userTranscript').textContent = ' ' + text;
  processInput(text);
}

function clearScreen() {
  stopSpeaking();
  document.getElementById('userTranscript').textContent = '';
  const resp = document.getElementById('siResponse');
  resp.classList.remove('visible');
  setTimeout(() => { resp.textContent = ''; }, 400);
  setMode('standby');
}

// ─── UI STATE ────────────────────────────────────────────────────────────────

function setMode(mode) {
  const avatar = document.getElementById('avatar');
  const status = document.getElementById('siStatus');
  const wave = document.getElementById('waveform');
  const bg = document.getElementById('bgPulse');

  avatar.className = 'avatar';
  status.className = 'si-status';
  wave.className = 'waveform';
  bg.className = 'bg-pulse';

  if (mode === 'speaking') {
    avatar.classList.add('speaking');
    status.classList.add('speaking');
    status.textContent = 'Speaking…';
    wave.classList.add('active');
    bg.classList.add('speaking');
  } else if (mode === 'listening') {
    avatar.classList.add('listening');
    status.classList.add('listening');
    status.textContent = 'Listening…';
  } else if (mode === 'processing') {
    status.classList.add('active');
    status.textContent = 'Processing…';
  } else {
    status.textContent = 'Standing by.';
  }
}

// ─── INIT ────────────────────────────────────────────────────────────────────

window.addEventListener('load', () => {
  initRecognition();
  // GOD MODE PATCH R1 — personalize + init history
  personalizeKB();
  renderConvHistory();

  // Greet on load
  setTimeout(() => {
    const greeting = getPersonalizedGreeting();
    showResponse(greeting);
    speak(greeting);
  }, 800);
});

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { this.style.display='none';this.parentElement.textContent='⬡'; }
function h_2(event) { if(event.key==='Enter') sendText(); }
function h_3(event) { window.location.href='citizen-dashboard.html'; }


// ── Delegated dispatcher ──────────────────────────────────────────────────
// Replaces inline on* attributes (CSP phase: no inline handlers).
// Markup carries data-action / data-args (click) or data-<event>-action / data-<event>-args.
// JSON args: "$this" = element, "$event" = event (currentTarget = matched element),
// "$value" = element.value, "$checked" = element.checked.
function indxJ(v) { return JSON.stringify(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
(function () {
  const EV = { click: ['click', 'action', 'args', true], input: ['input', 'inputAction', 'inputArgs', true], change: ['change', 'changeAction', 'changeArgs', true],
    submit: ['submit', 'submitAction', 'submitArgs', true], keydown: ['keydown', 'keydownAction', 'keydownArgs', true], keyup: ['keyup', 'keyupAction', 'keyupArgs', true],
    keypress: ['keypress', 'keypressAction', 'keypressArgs', true], dblclick: ['dblclick', 'dblclickAction', 'dblclickArgs', true], paste: ['paste', 'pasteAction', 'pasteArgs', true],
    touchstart: ['touchstart', 'touchstartAction', 'touchstartArgs', true], touchend: ['touchend', 'touchendAction', 'touchendArgs', true], touchmove: ['touchmove', 'touchmoveAction', 'touchmoveArgs', true],
    mousedown: ['mousedown', 'mousedownAction', 'mousedownArgs', true], mouseup: ['mouseup', 'mouseupAction', 'mouseupArgs', true],
    mouseenter: ['mouseenter', 'mouseenterAction', 'mouseenterArgs', false], mouseleave: ['mouseleave', 'mouseleaveAction', 'mouseleaveArgs', false],
    mouseover: ['mouseover', 'mouseoverAction', 'mouseoverArgs', true], mouseout: ['mouseout', 'mouseoutAction', 'mouseoutArgs', true],
    blur: ['focusout', 'blurAction', 'blurArgs', false], focus: ['focusin', 'focusAction', 'focusArgs', false],
    error: ['error', 'errorAction', 'errorArgs', false], load: ['load', 'loadAction', 'loadArgs', false] };
  function run(e, el, ak, gk) {
    const name = el.dataset[ak]; if (!name) return false;
    const fn = window[name]; if (typeof fn !== 'function') return false;
    let args; try { args = el.dataset[gk] ? JSON.parse(el.dataset[gk]) : []; } catch (_) { return false; }
    const ev = new Proxy(e, { get(t, k) { if (k === 'currentTarget') return el; const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; } });
    const r = fn.apply(el, args.map(function (a) { return a === '$this' ? el : a === '$event' ? ev : a === '$value' ? el.value : a === '$checked' ? el.checked : a; }));
    if (r === false) e.preventDefault();
    return true;
  }
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, { capture: true, passive: false }); })(EV.click);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, { capture: true, passive: false }); })(EV.error);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, { capture: true, passive: false }); })(EV.keydown);
  // Images that failed before this script ran miss the native error event: replay it once.
  document.querySelectorAll('img[data-error-action]').forEach(function (img) { if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) img.dispatchEvent(new Event('error')); });
})();
