
/* ─── Config ─────────────────────────────────── */
const SB_URL  = 'https://zljgthfzbalsunuoohcd.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';

/* ─── Session context ────────────────────────── */
const citizenName    = sessionStorage.getItem('citizen_name')    || '';
const citizenWisdom  = parseInt(sessionStorage.getItem('citizen_wisdom')  || '0');
const citizenBalance = parseInt(sessionStorage.getItem('citizen_balance') || '0');

/* ─── State ──────────────────────────────────── */
let history       = [];   // {role, content}[]
let streaming     = false;
let voiceOn       = false;
let interviewMode = false;

/* ─── Interview mode detection ───────────────── */
const params = new URLSearchParams(window.location.search);
interviewMode = params.get('mode') === 'interview';

if (interviewMode) {
  document.getElementById('interviewBadge').style.display = 'inline';
  document.getElementById('introDesc').textContent =
    "Welcome. I'm SIINDEX, your Sovereign SI — COO of IN$DEX. Ask me anything about the platform, the mission, or the people this was built for.";
}

/* ─── Personalise intro ──────────────────────── */
if (citizenName && !interviewMode) {
  document.getElementById('introDesc').textContent =
    `Welcome back, ${citizenName.split(' ')[0]}. I've already reviewed your account. Standing by.`;
}

/* ─── Prompt chips ───────────────────────────── */
// GOD MODE PATCH — use canonical SIINDEX_STARTERS from siindex-system.js
const citizenChips = (typeof SIINDEX_STARTERS !== 'undefined')
  ? SIINDEX_STARTERS.map(s => s.label)
  : [
    '🧠 Explain tokenomics',
    '📊 Marketplace health check',
    '🛡 How does escrow work?',
    '🏛 Understand a proposal',
    '👤 Creator pricing advice',
  ];
const interviewChips = [
  'Tell me about IN$DEX',
  'What problem does this solve?',
  'The coconut girl story',
  'Who built this?',
  'What makes this different from other exchanges?'
];
const chips = interviewMode ? interviewChips : citizenChips;
const row = document.getElementById('promptsRow');
chips.forEach(label => {
  const el = document.createElement('div');
  el.className = 'prompt-chip';
  el.textContent = label;
  el.onclick = () => useChip(label);
  row.appendChild(el);
});

/* ─── Utilities ──────────────────────────────── */
function now() {
  return new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
}
function esc(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function scroll() {
  const el = document.getElementById('chatMessages');
  el.scrollTop = el.scrollHeight;
}
function toast(msg, ms = 2800) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), ms);
}
function showTyping() {
  document.getElementById('typingRow').style.display = 'flex';
  scroll();
}
function hideTyping() {
  document.getElementById('typingRow').style.display = 'none';
}

/* ─── Format SIINDEX text ────────────────────── */
function formatSI(raw) {
  let t = esc(raw);
  // Standing by → subtle cyan
  t = t.replace(/Standing by\./g,
    '<span style="color:rgba(0,212,255,0.6);font-size:12px">Standing by.</span>');
  // **bold** → cyan strong
  t = t.replace(/\*\*(.*?)\*\*/g,
    '<strong style="color:var(--cyan)">$1</strong>');
  // line breaks
  t = t.replace(/\n/g, '<br>');
  return t;
}

/* ─── Append user message ────────────────────── */
function addUserMsg(text) {
  const msgs = document.getElementById('chatMessages');
  const row = document.createElement('div');
  row.className = 'msg-row user';
  row.innerHTML = `
    <div class="msg-content">
      <div class="bubble">${esc(text)}</div>
      <div class="msg-time">${now()}</div>
    </div>`;
  msgs.appendChild(row);
  scroll();
}

/* ─── Create SIINDEX streaming bubble ─────────── */
function createSIBubble() {
  const msgs = document.getElementById('chatMessages');
  const row = document.createElement('div');
  row.className = 'msg-row siindex';
  const bubbleId = 'b' + Date.now();
  const timeId   = 't' + Date.now();
  row.innerHTML = `
    <div class="msg-avatar"><img src="assets/siindex-avatar.jpg" alt="SIINDEX" data-error-action="h_1" data-error-args="[&quot;$event&quot;]"></div>
    <div class="msg-content">
      <div class="bubble" id="${bubbleId}"></div>
      <div class="msg-time" id="${timeId}"></div>
    </div>`;
  msgs.appendChild(row);
  scroll();
  return { bubbleEl: row.querySelector('#'+bubbleId), timeEl: row.querySelector('#'+timeId), rowEl: row };
}

/* ─── Voice toggle ───────────────────────────── */
function toggleVoice() {
  voiceOn = !voiceOn;
  const btn = document.getElementById('voiceBtn');
  btn.textContent = voiceOn ? '🔊 Voice' : '🔇 Voice';
  btn.classList.toggle('active', voiceOn);
  if (voiceOn) toast('Voice on SIINDEX will speak her replies');
}

/* ─── Chip click ─────────────────────────────── */
function useChip(label) {
  document.getElementById('promptsRow').remove();
  document.getElementById('msgInput').value = label;
  handleSend();
}

/* ─── Main send ──────────────────────────────── */
async function handleSend() {
  const input = document.getElementById('msgInput');
  const text  = input.value.trim();
  if (!text || streaming) return;

  input.value = '';
  document.getElementById('sendBtn').disabled = true;
  streaming = true;

  // Remove chips on first send
  const chipsEl = document.getElementById('promptsRow');
  if (chipsEl) chipsEl.remove();

  addUserMsg(text);
  showTyping();

  let fullText = '';

  try {
    const resp = await fetch(`${SB_URL}/functions/v1/siindex-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SB_ANON}`
      },
      body: JSON.stringify({
        message:        text,
        citizen_name:   citizenName,
        wisdom_score:   citizenWisdom,
        indx_balance:   citizenBalance,
        interview_mode: interviewMode,
        history:        history.slice(-10),   // last 5 exchanges = 10 entries
        // GOD MODE PATCH — canonical SIINDEX Marketplace Intelligence mandate
        system_prompt:  (typeof SIINDEX_SYSTEM_PROMPT !== 'undefined') ? SIINDEX_SYSTEM_PROMPT : undefined
      })
    });

    hideTyping();

    if (!resp.ok || !resp.body) throw new Error(resp.status);

    const { bubbleEl, timeEl } = createSIBubble();
    const reader  = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop(); // keep partial

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') break;
        try {
          const chunk = JSON.parse(raw).text || '';
          fullText += chunk;
          bubbleEl.innerHTML = formatSI(fullText);
          scroll();
        } catch(_) {}
      }
    }

    timeEl.textContent = now();

    // Update history
    history.push({ role: 'user', content: text });
    history.push({ role: 'assistant', content: fullText });

    // Phase 2 voice
    if (voiceOn && fullText) await playVoice(fullText, timeEl.parentElement);

  } catch(err) {
    hideTyping();
    const { bubbleEl, timeEl } = createSIBubble();
    bubbleEl.textContent = 'Connection issue. Try again in a moment. Standing by.';
    timeEl.textContent = now();
  }

  streaming = false;
  document.getElementById('sendBtn').disabled = false;
  input.focus();
}

/* ─── Phase 2 · ElevenLabs Voice ─────────────── */
async function playVoice(text, parentEl) {
  try {
    const res = await fetch(`${SB_URL}/functions/v1/siindex-voice-tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SB_ANON}`
      },
      body: JSON.stringify({ text: text.slice(0, 2500) })
    });

    const data = await res.json();
    if (!data.voice_enabled) return; // not yet activated silent fail

    const bytes = Uint8Array.from(atob(data.audio_base64), c => c.charCodeAt(0));
    const url   = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
    const audio = new Audio(url);

    // Mini player under the bubble
    if (parentEl) {
      const player = document.createElement('div');
      player.className = 'audio-player';
      const btnId = 'pb' + Date.now();
      player.innerHTML = `
        <button class="play-btn" id="${btnId}">▶</button>
        <span class="audio-label">SIINDEX VOICE</span>`;
      parentEl.appendChild(player);
      const btn = player.querySelector('#'+btnId);
      btn.onclick = () => audio.paused
        ? (audio.play(), btn.textContent = '⏸')
        : (audio.pause(), btn.textContent = '▶');
      audio.onended = () => btn.textContent = '▶';
    }

    audio.play();
  } catch(_) { /* voice error text chat continues */ }
}

/* ─── Auto-focus ─────────────────────────────── */
document.getElementById('msgInput').focus();

// ── GOD MODE F1: CHAT HISTORY PERSISTENCE ────────────────────────
const CHAT_HIST_KEY = 'indx_chat_history';
const CHAT_HIST_MAX = 20; // messages to store

function saveChatHistory() {
  try { localStorage.setItem(CHAT_HIST_KEY, JSON.stringify(history.slice(-CHAT_HIST_MAX))); } catch(_) {}
}

function restoreChatHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(CHAT_HIST_KEY) || '[]');
    if (!saved.length) return;
    history = saved;
    const msgs = document.getElementById('chatMessages');
    // Insert timestamp pill
    const pill = document.createElement('div');
    pill.className = 'history-pill';
    const lastTs = localStorage.getItem(CHAT_HIST_KEY + '_ts');
    pill.textContent = lastTs ? '— Previous session · ' + new Date(parseInt(lastTs)).toLocaleDateString('en-NZ', {day:'numeric',month:'short'}) + ' —' : '— Restored —';
    msgs.appendChild(pill);
    // Re-render messages
    for (let i = 0; i < saved.length; i++) {
      const m = saved[i];
      if (m.role === 'user') {
        addUserMsg(m.content);
      } else {
        const { bubbleEl, timeEl } = createSIBubble();
        bubbleEl.innerHTML = formatSI(m.content);
        timeEl.textContent = '';
        // Enable bookmark on restored SI messages
        attachBookmark(bubbleEl.closest('.msg-row'), m.content);
      }
    }
    scroll();
  } catch(_) {}
}

// Patch history push to auto-save
const _origHistPush = history.push.bind(history);
history.push = function(...args) {
  const r = Array.prototype.push.apply(history, args);
  saveChatHistory();
  localStorage.setItem(CHAT_HIST_KEY + '_ts', String(Date.now()));
  return r;
};

// Restore on load
restoreChatHistory();

// ── GOD MODE F2: INDX PRICE TICKER ───────────────────────────────
// FIXED 2026-07-25: was faking a "live" price ticker — setInterval(updatePriceChip, 30000)
// used Math.random() to drift the displayed price randomly between $0.22-$0.28 every
// 30-60s, persisted to localStorage to look like real market movement. INDX has not
// launched — there is no live market and no real price feed. This directly violated the
// canonical fixed genesis price ($0.24 USD, never a different number — see CLAUDE.md).
// Now always shows the real fixed genesis price with no invented movement.
const INDX_BASE = 0.24;
const _chatPrice = INDX_BASE;

function updatePriceChip() {
  const chip = document.getElementById('priceChip');
  if (!chip) return;
  chip.textContent = '$' + _chatPrice.toFixed(2) + ' genesis';
  chip.className = 'price-chip';
}

updatePriceChip();

// ── GOD MODE F3: WISDOM SCORE CHIP + NUDGE ───────────────────────
(function initWsChip() {
  if (citizenWisdom <= 0) return;
  const chip = document.getElementById('wsChip');
  chip.textContent = 'WS ' + citizenWisdom;
  chip.style.display = 'block';
})();

function showWsNudge() {
  if (citizenWisdom >= 50) {
    toast('✅ WS ' + citizenWisdom + ' — You qualify for Governance Rewards. Ask SIINDEX how to vote.', 3500);
  } else {
    const needed = 50 - citizenWisdom;
    toast('WS ' + citizenWisdom + ' · Need ' + needed + ' more to unlock Governance Rewards', 3200);
  }
}

// ── GOD MODE F4: MESSAGE BOOKMARK ────────────────────────────────
const BM_KEY = 'indx_chat_bookmarks';

function getBookmarks() {
  try { return JSON.parse(localStorage.getItem(BM_KEY) || '[]'); } catch(_) { return []; }
}
function saveBookmarks(bms) {
  try { localStorage.setItem(BM_KEY, JSON.stringify(bms)); } catch(_) {}
}

function updateBmBadge() {
  const bms = getBookmarks();
  const el = document.getElementById('bmCount');
  el.textContent = bms.length;
  el.classList.toggle('show', bms.length > 0);
}

function attachBookmark(rowEl, text) {
  if (!rowEl || rowEl.dataset.bmAttached) return;
  rowEl.dataset.bmAttached = '1';
  let pressTimer;
  rowEl.addEventListener('touchstart', () => {
    pressTimer = setTimeout(() => { bookmarkMsg(text, rowEl); }, 600);
  }, { passive: true });
  rowEl.addEventListener('touchend', () => clearTimeout(pressTimer));
  rowEl.addEventListener('touchmove', () => clearTimeout(pressTimer));
  // Desktop: double-click
  rowEl.addEventListener('dblclick', () => bookmarkMsg(text, rowEl));
}

function bookmarkMsg(text, rowEl) {
  const bms = getBookmarks();
  const plain = text.replace(/<[^>]+>/g, '').slice(0, 280);
  if (bms.some(b => b.text === plain)) { toast('Already saved'); return; }
  bms.unshift({ text: plain, ts: Date.now() });
  saveBookmarks(bms.slice(0, 20));
  updateBmBadge();
  // Flash animation on badge
  const cnt = document.getElementById('bmCount');
  cnt.classList.add('bm-pop');
  setTimeout(() => cnt.classList.remove('bm-pop'), 350);
  toast('🔖 Response saved!');
}

function openBookmarks() {
  const bms = getBookmarks();
  const list = document.getElementById('bmList');
  if (!bms.length) {
    list.innerHTML = '<div class="bm-empty">No saved responses yet.<br>Long-press any SIINDEX reply to save it.</div>';
  } else {
    list.innerHTML = bms.map((b, i) => `
      <div class="bm-item">
        ${b.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
        <div class="bm-time">${new Date(b.ts).toLocaleString('en-NZ',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
        <div class="bm-del" data-action="h_4" data-args="${JSON.stringify(["$event",i]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">✕</div>
      </div>`).join('');
  }
  document.getElementById('bmOverlay').classList.add('show');
}

function deleteBookmark(idx) {
  const bms = getBookmarks();
  bms.splice(idx, 1);
  saveBookmarks(bms);
  updateBmBadge();
  openBookmarks(); // re-render
}

function closeBmOverlay(e) {
  if (!e || e.target === document.getElementById('bmOverlay')) {
    document.getElementById('bmOverlay').classList.remove('show');
  }
}

// ── PATCH createSIBubble to attach bookmark handler ──────────────
const _origCreateSIBubble = createSIBubble;
createSIBubble = function() {
  const result = _origCreateSIBubble();
  // attach after content is filled — triggered from handleSend patch
  result._rawText = '';
  return result;
};

// Patch handleSend end to attach bookmark + save history
const _origHandleSend = handleSend;
handleSend = async function() {
  await _origHandleSend.apply(this, arguments);
  // Attach bookmark to latest SI row
  const rows = document.querySelectorAll('.msg-row.siindex');
  const last = rows[rows.length - 1];
  if (last) {
    const bubble = last.querySelector('.bubble');
    attachBookmark(last, bubble ? bubble.textContent : '');
  }
};

// Init badge count on load
updateBmBadge();

// ── GOD MODE R2: STREAMING TYPEWRITER CURSOR ──────────────────────
const _origFormatSI_R2 = formatSI;
formatSI = function(raw) {
  let result = _origFormatSI_R2(raw);
  if (streaming) result += '<span class="typing-cursor"></span>';
  return result;
};

// ── GOD MODE R2: CONTEXTUAL FOLLOW-UP CHIPS ───────────────────────
const CHAT_FU = {
  price:    ['Market cap?', 'Grand Sync target?', 'How to buy INDX?'],
  wisdom:   ['How to earn more WS?', 'What unlocks at 100?', 'Governance voting?'],
  staking:  ['APY rates?', 'Minimum to stake?', 'How to unstake?'],
  send:     ['What are the fees?', 'How fast is it?', 'Supported corridors?'],
  security: ['PQSI explained?', 'Grid Account?', 'How are keys stored?'],
  defi:     ['How does the DEX work?', 'Liquidity pools?', 'What is the 2% law?'],
  mission:  ['The coconut girl story?', 'Who built IN$DEX?', 'Pacific origin?'],
  default:  ['Tell me more', 'INDX price?', 'How do I get started?'],
};
function getChatFU(u, s) {
  const t = (u + ' ' + s).toLowerCase();
  if (/price|market cap|indx|\$0\.\d|usd/i.test(t)) return CHAT_FU.price;
  if (/wisdom|ws |score/i.test(t)) return CHAT_FU.wisdom;
  if (/stak|yield|apr|apy/i.test(t)) return CHAT_FU.staking;
  if (/send|remit|transfer|pay\b|money/i.test(t)) return CHAT_FU.send;
  if (/secur|pqsi|quantum|key|mpc|grid account/i.test(t)) return CHAT_FU.security;
  if (/dex|swap|liquidity|pool|2%|civilisation/i.test(t)) return CHAT_FU.defi;
  if (/mission|vision|story|coconut|pacific|built|founder/i.test(t)) return CHAT_FU.mission;
  return CHAT_FU.default;
}
function showChatFU(userText, siText) {
  document.querySelectorAll('.si-followup-row').forEach(el => el.remove());
  const chips = getChatFU(userText, siText);
  const row = document.createElement('div');
  row.className = 'si-followup-row';
  chips.forEach(label => {
    const chip = document.createElement('button');
    chip.className = 'si-fu-chip';
    chip.textContent = label;
    chip.onclick = () => {
      document.querySelectorAll('.si-followup-row').forEach(el => el.remove());
      document.getElementById('msgInput').value = label;
      handleSend();
    };
    row.appendChild(chip);
  });
  document.getElementById('chatMessages').appendChild(row);
  scroll();
}

// ── GOD MODE R2: ONE-TAP COPY BUTTON ──────────────────────────────
function attachCopyBtn(rowEl) {
  const content = rowEl && rowEl.querySelector('.msg-content');
  if (!content || content.querySelector('.msg-copy-btn')) return;
  const btn = document.createElement('button');
  btn.className = 'msg-copy-btn';
  btn.textContent = '📋 Copy reply';
  btn.onclick = (e) => {
    e.stopPropagation();
    const bubble = rowEl.querySelector('.bubble');
    const clean = (bubble ? bubble.textContent : '').trim();
    navigator.clipboard.writeText(clean).then(() => toast('Copied')).catch(() => toast('Copy failed'));
  };
  content.appendChild(btn);
}

// ── GOD MODE R2: EXPORT FULL CONVERSATION ─────────────────────────
function exportChat() {
  if (!history.length) { toast('No conversation to export'); return; }
  const lines = history.map(m => (m.role === 'user' ? 'You: ' : 'SIINDEX: ') + m.content).join('\n\n');
  const header = 'IN$DEX Conversation — ' + new Date().toLocaleString('en-NZ') + '\n' + '─'.repeat(44) + '\n\n';
  const full = header + lines;
  if (navigator.share && /Mobi/i.test(navigator.userAgent)) {
    navigator.share({ title: 'SIINDEX Chat', text: full }).catch(() => {});
  } else {
    navigator.clipboard.writeText(full)
      .then(() => toast('✅ Conversation copied to clipboard'))
      .catch(() => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([full], { type: 'text/plain' }));
        a.download = 'siindex-conversation.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast('Conversation downloaded');
      });
  }
}

// ── GOD MODE R2: PATCH handleSend ─────────────────────────────────
const _origHandleSendR2 = handleSend;
handleSend = async function() {
  // GOD MODE PATCH R2 — remove stale follow-up chips before new send
  document.querySelectorAll('.si-followup-row').forEach(el => el.remove());
  await _origHandleSendR2.apply(this, arguments);
  // Remove streaming cursor from last SI bubble
  document.querySelectorAll('.typing-cursor').forEach(el => el.remove());
  // Attach copy button + contextual follow-ups for last SI response
  const rows = document.querySelectorAll('.msg-row.siindex');
  const lastRow = rows[rows.length - 1];
  if (lastRow) {
    attachCopyBtn(lastRow);
    if (history.length >= 2) {
      showChatFU(history[history.length - 2].content, history[history.length - 1].content);
    }
  }
};

// Add copy buttons to any SI rows rendered during history restore
setTimeout(() => {
  document.querySelectorAll('.msg-row.siindex').forEach(row => attachCopyBtn(row));
}, 200);
