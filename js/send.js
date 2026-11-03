// ── SUPABASE CLIENT ──
const SUPABASE_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── DATA ──

const CORRIDORS = [
  { flag:'🇹🇴', name:'Tonga',             currency:'TOP', rate:2.38,  dial:'+676' },
  { flag:'🇼🇸', name:'Samoa',             currency:'WST', rate:2.73,  dial:'+685' },
  { flag:'🇫🇯', name:'Fiji',              currency:'FJD', rate:2.27,  dial:'+679' },
  { flag:'🇻🇺', name:'Vanuatu',           currency:'VUV', rate:119.0, dial:'+678' },
  { flag:'🇵🇬', name:'Papua New Guinea',  currency:'PGK', rate:3.92,  dial:'+675' },
  { flag:'🇵🇭', name:'Philippines',       currency:'PHP', rate:57.0,  dial:'+63'  },
  { flag:'🇨🇰', name:'Cook Islands',      currency:'NZD', rate:1.68,  dial:'+682' },
  { flag:'🇸🇧', name:'Solomon Islands',   currency:'SBD', rate:8.47,  dial:'+677' },
  { flag:'🇻🇳', name:'Vietnam',           currency:'VND', rate:25400, dial:'+84'  },
  { flag:'🇮🇩', name:'Indonesia',         currency:'IDR', rate:16200, dial:'+62'  },
  { flag:'🇲🇾', name:'Malaysia',          currency:'MYR', rate:4.71,  dial:'+60'  },
  { flag:'🇹🇭', name:'Thailand',          currency:'THB', rate:36.5,  dial:'+66'  },
  { flag:'🇮🇳', name:'India',             currency:'INR', rate:83.5,  dial:'+91'  },
  { flag:'🇦🇺', name:'Australia',         currency:'AUD', rate:1.53,  dial:'+61'  }, // AUDIT-EXEMPT: fiat corridor currency — display only in selector, all INDX pricing remains USD
  { flag:'🇳🇿', name:'New Zealand',       currency:'NZD', rate:1.68,  dial:'+64'  },
];

const DIAL_CODES = [
  { flag:'🇦🇺', name:'Australia',      code:'+61'  },
  { flag:'🇨🇰', name:'Cook Islands',   code:'+682' },
  { flag:'🇫🇯', name:'Fiji',           code:'+679' },
  { flag:'🇮🇳', name:'India',          code:'+91'  },
  { flag:'🇮🇩', name:'Indonesia',      code:'+62'  },
  { flag:'🇲🇾', name:'Malaysia',       code:'+60'  },
  { flag:'🇳🇿', name:'New Zealand',    code:'+64'  },
  { flag:'🇵🇬', name:'Papua New Guinea',code:'+675'},
  { flag:'🇵🇭', name:'Philippines',    code:'+63'  },
  { flag:'🇼🇸', name:'Samoa',          code:'+685' },
  { flag:'🇸🇧', name:'Solomon Islands',code:'+677' },
  { flag:'🇹🇭', name:'Thailand',       code:'+66'  },
  { flag:'🇹🇴', name:'Tonga',          code:'+676' },
  { flag:'🇻🇺', name:'Vanuatu',        code:'+678' },
  { flag:'🇻🇳', name:'Vietnam',        code:'+84'  },
];

const TOKENS = {
  indx: { symbol:'◎', ticker:'INDX', balance:1240,  rate:0.24,  decimals:0 },
  sol:  { symbol:'◉', ticker:'SOL',  balance:2.48,  rate:186.50,decimals:4 },
  usdc: { symbol:'$', ticker:'USDC', balance:48.00, rate:1.00,  decimals:2 },
};

// FIX 2026-08-30: this used to be a hardcoded 4-entry mock dict -- only those
// 4 demo phone numbers ever showed "✓ Citizen found · instant delivery" on
// this real-money send screen, which reads as a verified-recipient check
// but was pure fiction. Replaced with a real, debounced call to
// get_citizen_by_phone (the same anon-safe RPC used by biometric-kyc.html
// -- returns only {id} to a non-owner caller, no name, per the phone-
// identity-leak fix applied earlier this session). transfer_indx itself
// already resolves the recipient by phone number regardless of this
// lookup, so this only drives the pre-flight hint shown to the sender.
let _phoneLookupTimer = null;

// ── STATE ──
let selectedToken = 'indx';
let amountStr = '0';
let selectedDialCode = '+61';
let selectedDialFlag = '🇦🇺';
let selectedCorridor = null;
let recipientPhone = '';
let recipientName = '';

// FIXED (critical): getFeePct() and updateCorridorFeePill() were called from
// updateDisplay() and openConfirm() but never defined anywhere -- not in this
// file, not in any script it loads. Every call to updateDisplay() (page load,
// every numpad keypress, every token/corridor change) threw a ReferenceError,
// and openConfirm() throws BEFORE it populates or shows the confirm sheet --
// meaning tapping "Send INDX" did nothing visible at all. The entire Send
// flow was unreachable for every citizen. Separately, the missing code
// implied a discounted 0.5% fee for "Pacific corridor" destinations, but the
// real transfer_indx RPC always charges a flat 2% with no corridor-based
// discount (see its v_civ_fee calculation) -- showing 0.5%/keeps-99.5% here
// while the backend actually takes 2% would be a fee claim this app can't
// back up, so this returns the real flat rate rather than inventing a tier
// that doesn't exist server-side.
function getFeePct() {
  return 0.02;
}
function updateCorridorFeePill() {
  const pill = document.getElementById('corridorFeePill');
  if (pill) pill.classList.remove('show');
}

// ── TOKEN ──
// FIXED: SOL and USDC used to be fully selectable here with a hardcoded fake
// "available" balance (2.48 SOL / 48.00 USDC that never changed for anyone),
// and a real Send flow behind them. IN$DEX has no SOL/USDC custody at all --
// citizens only have indx_balance -- and goToTrustGate() below always hands
// off to the real transfer_indx RPC regardless of which tab was selected, so
// a citizen picking "SOL" and sending would have actually moved their real
// INDX balance, converted through a fake SOL/USD rate. Blocked selection
// here rather than just relabeling, since the danger was reachability, not
// just the label.
function selectToken(key) {
  if (key !== 'indx') {
    showToast('SOL and USDC transfers aren\'t live yet — INDX only for now.');
    return;
  }
  selectedToken = key;
  document.querySelectorAll('.token-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tok-' + key).classList.add('active');
  const t = TOKENS[key];
  document.getElementById('amtSymbol').textContent = t.symbol;
  document.getElementById('amtTicker').textContent = t.ticker;
  document.getElementById('balDisplay').textContent = `${t.balance.toLocaleString()} ${t.ticker}`;
  document.getElementById('sendBtn').textContent = `Send ${t.ticker}`;
  amountStr = '0';
  updateDisplay();
}

// ── NUMPAD ──
function keyPress(k) {
  if (k === '.' && amountStr.includes('.')) return;
  if (amountStr === '0' && k !== '.') amountStr = k;
  else amountStr += k;
  const parts = amountStr.split('.');
  if (parts[1] && parts[1].length > TOKENS[selectedToken].decimals) return;
  updateDisplay();
}
function keyDel() {
  amountStr = amountStr.slice(0, -1) || '0';
  updateDisplay();
}
function useMax() {
  amountStr = TOKENS[selectedToken].balance.toString();
  updateDisplay();
}

function updateDisplay() {
  const val = parseFloat(amountStr) || 0;
  const t = TOKENS[selectedToken];
  const usd = (val * t.rate).toFixed(2);
  document.getElementById('amtValue').textContent = amountStr === '0' ? '0' : amountStr;
  document.getElementById('amtValue').style.color = val > t.balance ? 'var(--red)' : 'var(--text)';
  document.getElementById('amtUsd').innerHTML = `≈ <span>$${usd} USD</span>`;
  document.getElementById('feeAmt').textContent = `${amountStr} ${t.ticker}`;
  document.getElementById('feeUsd').textContent = `$${usd}`;
  document.getElementById('feeTotal').textContent = `${amountStr} ${t.ticker}`;
  // GOD MODE R3 — live 98/2 fee preview + Pacific corridor rate
  const feePct = getFeePct();
  const feeUsdAmt = val * t.rate * feePct;
  const netUsd = val * t.rate - feeUsdAmt;
  const civLabel = document.getElementById('civFeeLabel');
  const civVal = document.getElementById('civFeeVal');
  const keepBadge = document.getElementById('keepBadge');
  if (civLabel) civLabel.textContent = feePct === 0.005 ? 'Pacific corridor fee · 0.5%' : 'Civilisation fee · 2%';
  if (civVal) civVal.textContent = '$' + feeUsdAmt.toFixed(2);
  if (keepBadge) keepBadge.textContent = feePct === 0.005 ? 'keeps 99.5%' : 'keeps 98%';
  const recvEl = document.getElementById('feeRecv');
  if (selectedCorridor) {
    const localAmt = (netUsd * selectedCorridor.rate).toFixed(selectedCorridor.rate > 100 ? 0 : 2);
    const localFmt = parseFloat(localAmt).toLocaleString();
    recvEl.textContent = `${localFmt} ${selectedCorridor.currency}`;
  } else {
    recvEl.textContent = ' select country';
  }
  if (val > 0) { recvEl.classList.remove('fee-flash'); void recvEl.offsetWidth; recvEl.classList.add('fee-flash'); }
  updateCorridorFeePill();
}

// ── PHONE INPUT ──
function onPhoneInput() {
  const phone = document.getElementById('phoneInput').value.replace(/\D/g, '');
  const fullNum = selectedDialCode + phone;
  recipientPhone = fullNum;
  document.getElementById('recentList').style.display = phone.length > 0 ? 'none' : 'flex';

  const status = document.getElementById('lookupStatus');
  clearTimeout(_phoneLookupTimer);
  if (phone.length >= 7) {
    status.className = 'lookup-status';
    status.style.display = 'flex';
    document.getElementById('lookupIcon').textContent = '⋯';
    document.getElementById('lookupName').textContent = 'Checking…';
    document.getElementById('lookupSub').textContent = '';
    const lookupNum = fullNum; // capture so a stale response can't overwrite a newer one
    _phoneLookupTimer = setTimeout(async () => {
      let found = false;
      try {
        // No session guarantee here, so no get_citizen_by_phone: boolean-only edge function.
        const existsPhone = IndxPhone.forRpc(lookupNum);
        if (!existsPhone) { status.className = 'lookup-status'; status.style.display = 'none'; return; }
        const { data } = await sb.functions.invoke('citizen-exists', { body: { phone: existsPhone } });
        found = !!(data && data.exists === true);
      } catch (e) { /* network hiccup -- fall through to the invite state */ }
      if (lookupNum !== fullNum) return; // superseded by a newer keystroke
      if (found) {
        recipientName = ''; // real name is not exposed pre-transfer (privacy) -- transfer_indx resolves it server-side
        status.className = 'lookup-status found';
        document.getElementById('lookupIcon').textContent = '✓';
        document.getElementById('lookupName').textContent = 'Citizen found';
        document.getElementById('lookupSub').textContent = 'Instant delivery';
      } else {
        recipientName = '';
        status.className = 'lookup-status invite';
        document.getElementById('lookupIcon').textContent = '✉';
        document.getElementById('lookupName').textContent = 'New to IN$DEX';
        document.getElementById('lookupSub').textContent = 'They\'ll get an SMS invite to claim';
      }
    }, 400);
  } else {
    status.className = 'lookup-status';
    status.style.display = 'none';
    recipientName = '';
  }
}

function selectContact(name, phone, flag) {
  const digits = phone.replace(/\D/g, '');
  // Find matching dial code
  const match = DIAL_CODES.find(d => phone.startsWith(d.code));
  if (match) {
    selectedDialCode = match.code;
    selectedDialFlag = match.flag;
    document.getElementById('dialFlag').textContent = match.flag;
    document.getElementById('dialCode').textContent = match.code;
    document.getElementById('phoneInput').value = digits.slice(match.code.replace('+','').length);
  } else {
    document.getElementById('phoneInput').value = digits;
  }
  recipientPhone = phone;
  document.getElementById('recentList').style.display = 'none';
  // FIX 2026-08-30: this used to hardcode the "✓ Citizen found · instant delivery"
  // status straight from the tapped row's name, with no real check. Run the same
  // real onPhoneInput() lookup used for manual entry instead, so a past recipient
  // who has since left/been removed doesn't still show as a false "found".
  onPhoneInput();
  // Auto-select corridor based on flag
  const corr = CORRIDORS.find(c => c.flag === flag);
  if (corr) setSelectedCorridor(corr);
}

function scanQR() { window.location.href = 'qr-scanner.html'; }

// ── CORRIDOR SHEET ──
function buildCorridorList(filter) {
  const list = document.getElementById('corridorList');
  const items = filter
    ? CORRIDORS.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()))
    : CORRIDORS;
  list.innerHTML = items.map(c => `
    <div class="country-row ${selectedCorridor && selectedCorridor.name === c.name ? 'active' : ''}"
         data-action="setSelectedCorridor" data-args='${JSON.stringify([c]).replace(/&/g,'&amp;').replace(/'/g,'&#39;')}'>
      <div class="country-flag">${c.flag}</div>
      <div class="country-name">${c.name}</div>
      <div class="country-currency">${c.currency} · ${c.dial}</div>
      <div class="country-check">✓</div>
    </div>`).join('');
}
function filterCorridors(v) { buildCorridorList(v); }
function openCorridorSheet() {
  buildCorridorList('');
  document.getElementById('corridorOverlay').classList.add('show');
  document.getElementById('corridorSheet').classList.add('show');
  document.getElementById('corridorSearch').value = '';
  document.getElementById('corridorSearch').focus();
}
function closeCorridorSheet() {
  document.getElementById('corridorOverlay').classList.remove('show');
  document.getElementById('corridorSheet').classList.remove('show');
}
function setSelectedCorridor(c) {
  // c may come as string from inline onclick
  if (typeof c === 'string') {
    c = c.replace(/'/g,'"');
    try { c = JSON.parse(c); } catch(e) { return; }
  }
  selectedCorridor = c;
  document.getElementById('corridorFlag').textContent = c.flag;
  document.getElementById('corridorCountry').textContent = c.name;
  const rateDisplay = c.rate > 100
    ? `$1 USD ≈ ${c.rate.toLocaleString()} ${c.currency}`
    : `$1 USD ≈ ${c.rate} ${c.currency}`;
  document.getElementById('corridorRate').textContent = rateDisplay;
  document.getElementById('corridorBtn').classList.add('selected');
  // Auto-set dial code if not already set
  const match = DIAL_CODES.find(d => d.code === c.dial);
  if (match && document.getElementById('phoneInput').value === '') {
    selectedDialCode = match.code;
    selectedDialFlag = match.flag;
    document.getElementById('dialFlag').textContent = match.flag;
    document.getElementById('dialCode').textContent = match.code;
  }
  updateDisplay();
  closeCorridorSheet();
}

// ── DIAL CODE SHEET ──
function buildDialList(filter) {
  const list = document.getElementById('dialList');
  const items = filter
    ? DIAL_CODES.filter(d => d.name.toLowerCase().includes(filter.toLowerCase()) || d.code.includes(filter))
    : DIAL_CODES;
  list.innerHTML = items.map(d => `
    <div class="dial-row" data-action="selectDialCode" data-args='${JSON.stringify([d.flag,d.code,d.name]).replace(/&/g,'&amp;').replace(/'/g,'&#39;')}'>
      <div class="dial-row-flag">${d.flag}</div>
      <div class="dial-row-name">${d.name}</div>
      <div class="dial-row-code">${d.code}</div>
    </div>`).join('');
}
function filterDial(v) { buildDialList(v); }
function openDialSheet() {
  buildDialList('');
  document.getElementById('dialOverlay').classList.add('show');
  document.getElementById('dialSheet').classList.add('show');
  document.getElementById('dialSearch').value = '';
}
function closeDialSheet() {
  document.getElementById('dialOverlay').classList.remove('show');
  document.getElementById('dialSheet').classList.remove('show');
}
function selectDialCode(flag, code, name) {
  selectedDialCode = code;
  selectedDialFlag = flag;
  document.getElementById('dialFlag').textContent = flag;
  document.getElementById('dialCode').textContent = code;
  closeDialSheet();
  onPhoneInput();
}

// ── CONFIRM ──
function openConfirm() {
  const val = parseFloat(amountStr) || 0;
  const t = TOKENS[selectedToken];
  const phone = document.getElementById('phoneInput').value.trim();
  if (val <= 0)   { showToast('Enter an amount'); return; }
  if (val > t.balance) { showToast('Insufficient balance'); return; }
  if (!phone)     { showToast('Enter a mobile number'); return; }
  if (!selectedCorridor) { showToast('Select a destination country'); return; }

  const usd = (val * t.rate).toFixed(2);
  // GOD MODE R3 — 98/2 fee applied to confirm breakdown
  const feePct = getFeePct();
  const feeUsdAmt = parseFloat(usd) * feePct;
  const netUsd = parseFloat(usd) - feeUsdAmt;
  const localAmt = (netUsd * selectedCorridor.rate).toFixed(selectedCorridor.rate > 100 ? 0 : 2);
  const localFmt = parseFloat(localAmt).toLocaleString();
  const recipientLabel = recipientName
    ? `${recipientName} · ${selectedDialCode} ${phone}`
    : `${selectedDialCode} ${phone}`;
  const memo = document.getElementById('memoInput').value.trim();

  document.getElementById('cfAmt').textContent = amountStr;
  document.getElementById('cfToken').textContent = `${t.ticker} ${t.symbol}  ·  $${usd} USD`;
  document.getElementById('cfTo').innerHTML = `${selectedCorridor.flag} ${recipientLabel}`;
  document.getElementById('cfMemo').textContent = memo ? `"${memo}"` : '';
  document.getElementById('cfRecv').textContent = `${localFmt} ${selectedCorridor.currency}`;
  document.getElementById('confirmOverlay').classList.add('show');
}

// Builds the pending transaction and hands off execution to trust-before-transaction.html —
// that screen owns the real approval check + the actual transfer_indx call now. This screen's
// job is just to gather what the citizen wants to send, not to decide/execute it.
function closeConfirmOverlay() { document.getElementById('confirmOverlay').classList.remove('show'); }
function goToTrustGate() {
  const t = TOKENS[selectedToken];
  const usd = (parseFloat(amountStr) * t.rate).toFixed(2);
  const memoVal = (document.getElementById('memoInput')?.value || '').trim();
  const amtIndx = selectedToken === 'indx' ? parseFloat(amountStr) : parseFloat(usd) / 0.24;
  const phone = document.getElementById('phoneInput')?.value?.trim() || '';
  const recipient = recipientPhone || recipientName || phone || 'unknown';
  const flag = selectedCorridor ? selectedCorridor.flag : '🌏';
  const recipientLabel = flag + ' ' + (recipientName ? `${recipientName} · ${selectedDialCode} ${phone}` : `${selectedDialCode} ${phone}`);
  const currency = selectedCorridor ? selectedCorridor.currency : 'USD';
  const feeIndx = parseFloat((amtIndx * 0.02).toFixed(4));

  const pending = {
    type: 'send',
    amountIndx: parseFloat(amtIndx.toFixed(4)),
    recipient: recipient,
    recipientLabel: recipientLabel,
    memo: memoVal,
    corridor: currency,
    feeIndx: feeIndx,
    feeLabel: feeIndx.toFixed(2) + ' INDX (2% — 98/2 Law)',
    timing: 'Solana settlement — not live yet',
    returnUrl: 'send.html'
  };
  sessionStorage.setItem('indx_pending_tx', JSON.stringify(pending));
  window.location.href = 'trust-before-transaction.html';
}

function resetSend() {
  document.getElementById('confirmOverlay').classList.remove('show');
  amountStr = '0';
  document.getElementById('phoneInput').value = '';
  document.getElementById('memoInput').value = '';
  document.getElementById('lookupStatus').className = 'lookup-status';
  document.getElementById('recentList').style.display = 'flex';
  recipientPhone = '';
  recipientName = '';
  updateDisplay();
  setTimeout(() => {
    document.getElementById('confirmCard').innerHTML = `
      <div class="confirm-title">Confirm Send</div>
      <div class="confirm-sub">Can't be reversed double-check</div>
      <div class="confirm-amount" id="cfAmt">0</div>
      <div class="confirm-token" id="cfToken">INDX ◎</div>
      <div class="confirm-to">
        <div class="confirm-to-label">To</div>
        <div class="confirm-to-val" id="cfTo"></div>
        <div class="confirm-memo" id="cfMemo"></div>
      </div>
      <div class="confirm-row"><span>Recipient gets</span><span id="cfRecv" style="color:var(--green)"></span></div>
      <div class="confirm-row"><span>Network fee</span><span>~$0.0004</span></div>
      <div class="confirm-row"><span>Platform fee</span><span style="color:var(--green)">Free</span></div>
      <button class="confirm-pay-btn" data-action="goToTrustGate">Review &amp; Send →</button>
      <button class="confirm-cancel" data-action="closeConfirmOverlay">Cancel</button>`;
  }, 300);
}

// ── TOAST ──
let toastTimer;
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:110px;left:50%;transform:translateX(-50%);background:#1A1D25;border:1px solid #2A2D38;color:#EAEAEA;padding:10px 20px;border-radius:12px;font-size:14px;z-index:500;pointer-events:none;transition:opacity 0.3s;white-space:nowrap;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.style.opacity = '0', 2400);
}

// ── RECENT CONTACTS (real, replacing the old hardcoded 3-person demo list) ──
function timeAgoShort(d) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 3600) return Math.max(1, Math.floor(s / 60)) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}
async function loadRecentContacts() {
  const list = document.getElementById('recentList');
  if (!list) return;
  const citizenId = sessionStorage.getItem('citizen_id');
  if (!citizenId) { list.style.display = 'none'; return; }
  try {
    const { data, error } = await sb.from('transactions')
      .select('counterparty_address, created_at')
      .eq('citizen_id', citizenId)
      .eq('direction', 'send')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error || !data || !data.length) { list.style.display = 'none'; return; }
    const seen = new Set();
    const recents = [];
    for (const row of data) {
      const addr = row.counterparty_address;
      if (!addr || seen.has(addr)) continue;
      seen.add(addr);
      recents.push(row);
      if (recents.length >= 3) break;
    }
    if (!recents.length) { list.style.display = 'none'; return; }
    list.innerHTML = recents.map(r => {
      const addr = String(r.counterparty_address);
      const digits = addr.replace(/\D/g, '');
      const initials = digits ? digits.slice(-2) : addr.slice(0, 2).toUpperCase();
      const when = timeAgoShort(new Date(r.created_at));
      const safeAddr = addr.replace(/'/g, "\\'");
      return `<div class="contact-row" data-action="selectContact" data-args='${JSON.stringify(['',addr,'']).replace(/&/g,'&amp;').replace(/'/g,'&#39;')}'>
        <div class="contact-avatar" style="background:linear-gradient(135deg,#8B3FE8,#00D4FF)">${initials}</div>
        <div>
          <div class="contact-name">${addr}</div>
          <div class="contact-addr">Sent before</div>
        </div>
        <div class="contact-time">${when}</div>
      </div>`;
    }).join('');
    list.style.display = 'flex';
  } catch (e) { list.style.display = 'none'; }
}

// ── INIT ──
updateDisplay();
loadRecentContacts();

// ════════════════════════════════════════════════
// GOD MODE — SEND.HTML
// ════════════════════════════════════════════════
const INDX_PRICE_USD = 0.24;
const DRAFT_KEY = 'indx_send_draft';
const BALANCE_KEY = 'indx_send_balance';

// 1. BALANCE SYNC — pull live balance from sessionStorage on load
(function syncBalanceFromSession() {
  const sessBal = sessionStorage.getItem('citizen_balance');
  if (sessBal && !isNaN(parseInt(sessBal))) {
    TOKENS.indx.balance = parseInt(sessBal);
    document.getElementById('bal-indx').textContent = parseInt(sessBal).toLocaleString() + ' available';
    document.getElementById('balDisplay').textContent = parseInt(sessBal).toLocaleString() + ' INDX';
  }
})();

// 2. QUICK AMOUNT CHIPS — convert USD to token units
function setQuickAmt(usd, btn) {
  const t = TOKENS[selectedToken];
  const tokenUnits = usd / t.rate;
  amountStr = t.decimals === 0 ? Math.round(tokenUnits).toString() : tokenUnits.toFixed(t.decimals);
  updateDisplay();
  // Visual highlight
  document.querySelectorAll('.qa-chip').forEach(c => c.classList.remove('qa-active'));
  btn.classList.add('qa-active');
  setTimeout(() => btn.classList.remove('qa-active'), 600);
}

// 3. DRAFT SAVE/RESTORE — persist form state to localStorage
function saveDraft() {
  const phone = document.getElementById('phoneInput').value.trim();
  const memo  = document.getElementById('memoInput').value.trim();
  if (amountStr === '0' && !phone) return; // nothing to save
  const draft = {
    amount: amountStr,
    token: selectedToken,
    phone: phone,
    dialCode: selectedDialCode,
    dialFlag: selectedDialFlag,
    memo: memo,
    corridor: selectedCorridor ? selectedCorridor.name : '',
    ts: Date.now()
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function checkDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (!d || Date.now() - d.ts > 24 * 3600 * 1000) { localStorage.removeItem(DRAFT_KEY); return; }
    if (d.amount === '0' && !d.phone) return;
    const banner = document.getElementById('draftBanner');
    const label  = document.getElementById('draftLabel');
    const parts  = [];
    if (d.amount && d.amount !== '0') parts.push(d.amount + ' ' + (d.token || 'INDX').toUpperCase());
    if (d.phone)   parts.push('to ' + d.dialCode + ' ' + d.phone);
    label.textContent = 'Resume draft: ' + (parts.join(' ') || 'unsent transfer');
    banner.classList.add('show');
  } catch(e) {}
}

function restoreDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (d.token) selectToken(d.token);
    if (d.amount) { amountStr = d.amount; updateDisplay(); }
    if (d.phone) {
      selectedDialCode = d.dialCode || '+61';
      selectedDialFlag = d.dialFlag || '🇦🇺';
      document.getElementById('dialFlag').textContent = selectedDialFlag;
      document.getElementById('dialCode').textContent = selectedDialCode;
      document.getElementById('phoneInput').value = d.phone;
      onPhoneInput();
    }
    if (d.memo) document.getElementById('memoInput').value = d.memo;
    if (d.corridor) {
      const corr = CORRIDORS.find(c => c.name === d.corridor);
      if (corr) setSelectedCorridor(corr);
    }
    document.getElementById('draftBanner').classList.remove('show');
    localStorage.removeItem(DRAFT_KEY);
    showToast('Draft restored');
  } catch(e) {}
}

// 4. NUMPAD KEY PULSE ANIMATION
const origKeyPress = keyPress;
const numpadKeys = document.querySelectorAll('.key');
numpadKeys.forEach(k => {
  k.addEventListener('click', function() {
    this.classList.remove('pressed');
    void this.offsetWidth; // force reflow
    this.classList.add('pressed');
    setTimeout(() => this.classList.remove('pressed'), 200);
  });
});

// Auto-save draft on every input change
document.getElementById('phoneInput').addEventListener('input', saveDraft);
document.getElementById('memoInput').addEventListener('input', saveDraft);
// Override keyPress to also save draft
(function patchKeyPress() {
  const origUpdate = updateDisplay;
  window.updateDisplay = function() {
    origUpdate();
    saveDraft();
  };
})();

// Check for draft on load
checkDraft();

/* ════════════════════════════════════════════════
   GOD MODE R2 — SEND.HTML
════════════════════════════════════════════════ */

// Feature R2-1: Send history quick-sheet
// UPDATED (open-items pass, 2026-07-15): this used to read a localStorage cache
// (indx_pay_hist) written by logSend(), called from the old in-page executeSend().
// Since Task 6 moved real execution to trust-before-transaction.html, nothing has
// called logSend() since — the cache was stale/frozen, showing sends that stopped
// updating. Rather than re-wire a second write path into another page's flow (and
// keep two sources of truth in sync), this now reads the real `transactions` table
// directly — the exact same source history.html itself reads. No fake/stale data,
// no duplicate cache to drift out of sync.
async function openSendHistory() {
  var list = document.getElementById('shList');
  if (!list) return;
  list.innerHTML = '<div class="sh-empty">Loading…</div>';
  document.getElementById('sendHistOverlay').classList.add('show');
  document.getElementById('sendHistSheet').classList.add('show');

  var citizenId = sessionStorage.getItem('citizen_id');
  if (!citizenId) {
    list.innerHTML = '<div class="sh-empty">Finish registering your Grid Account to see send history.</div>';
    return;
  }

  try {
    const { data: hist, error } = await sb.from('transactions')
      .select('*')
      .eq('citizen_id', citizenId)
      .eq('direction', 'send')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!hist || !hist.length) {
      list.innerHTML = '<div class="sh-empty">No sends yet.<br>History appears after your first send.</div>';
      return;
    }
    list.innerHTML = hist.map(function(h) {
      var d = new Date(h.created_at);
      var label = d.toLocaleDateString('en', { day:'numeric', month:'short' }) + ' · ' + d.toLocaleTimeString('en', { hour:'2-digit', minute:'2-digit' });
      var token = h.token || 'INDX';
      var recipientLabel = h.counterparty_address || 'Recipient';
      var recvStr = h.corridor ? (h.amount_usd ? h.amount_usd.toFixed(2) + ' ' + h.corridor : h.corridor) : ('$' + (h.amount_usd || (h.amount_indx * INDX_PRICE_USD)).toFixed(2) + ' USD');
      return '<div class="sh-item"><div><div class="sh-pair">→ ' + recipientLabel + '</div><div class="sh-meta">' + token + ' · ' + label + '</div></div><div class="sh-right"><div class="sh-amt">' + Number(h.amount_indx).toFixed(2) + ' ' + token + '</div><div class="sh-recv">' + recvStr + '</div></div></div>';
    }).join('');
  } catch (e) {
    console.error('[send.html] failed to load real send history:', e);
    list.innerHTML = '<div class="sh-empty">Could not load history right now.</div>';
  }
}

function closeSendHistory() {
  document.getElementById('sendHistOverlay').classList.remove('show');
  document.getElementById('sendHistSheet').classList.remove('show');
}

// GOD MODE PATCH — topbar History opens sheet instead of navigating
document.querySelector('.topbar-history').onclick = function(e) { e.preventDefault(); openSendHistory(); };

// Feature R2-2: Memo emoji quick-picks
function insertEmoji(em) {
  var inp = document.getElementById('memoInput');
  var pos = typeof inp.selectionStart === 'number' ? inp.selectionStart : inp.value.length;
  inp.value = inp.value.slice(0, pos) + em + inp.value.slice(pos);
  inp.dispatchEvent(new Event('input'));
  try { inp.focus(); inp.setSelectionRange(pos + em.length, pos + em.length); } catch(e) {}
}

// Feature R2-3: FX savings vs Western Union
var WU_FEE_PCT   = 0.068; // avg 6.8% Pacific corridors
var INDX_FEE_PCT = 0.02;  // 2% Civilisation Law fee

function updateFXSavings() {
  var row   = document.getElementById('fxSaveRow');
  var valEl = document.getElementById('fxSaveValEl');
  if (!row || !valEl) return;
  var val = parseFloat(amountStr) || 0;
  var t   = TOKENS[selectedToken];
  var usd = val * t.rate;
  if (usd < 1 || !selectedCorridor) { row.classList.remove('show'); return; }
  var wuFee   = usd * WU_FEE_PCT;
  var indxFee = usd * INDX_FEE_PCT;
  var saved   = (wuFee - indxFee).toFixed(2);
  valEl.textContent = 'Save $' + saved;
  row.classList.add('show');
}

// GOD MODE PATCH — append FX savings update to updateDisplay
var _origUpdateDisplayR2 = window.updateDisplay;
window.updateDisplay = function() {
  _origUpdateDisplayR2.call(this);
  updateFXSavings();
};

// Feature R2-4: Animated send progress stepper + history logging
function buildStepperHTML() {
  return '<div style="text-align:center;padding:16px 0 4px;"><div style="font-size:36px;margin-bottom:10px;">⚡</div><div style="font-size:16px;font-weight:800;margin-bottom:4px;">Sending…</div><div style="font-size:12px;color:var(--text-muted);margin-bottom:14px;">Broadcasting to Solana</div></div>' +
    '<div class="send-stepper">' +
    '<div class="ss-step"><div class="ss-dot" id="ssDot0"></div><div class="ss-label" id="ssLbl0">Submitting</div></div>' +
    '<div class="ss-line" id="ssLine0"></div>' +
    '<div class="ss-step"><div class="ss-dot" id="ssDot1"></div><div class="ss-label" id="ssLbl1">Broadcasting</div></div>' +
    '<div class="ss-line" id="ssLine1"></div>' +
    '<div class="ss-step"><div class="ss-dot" id="ssDot2"></div><div class="ss-label" id="ssLbl2">Confirmed</div></div>' +
    '</div>';
}

function animateSendStepper() {
  function activate(idx) {
    var dot  = document.getElementById('ssDot' + idx);
    var lbl  = document.getElementById('ssLbl' + idx);
    if (dot) dot.className = 'ss-dot active';
    if (lbl) lbl.className = 'ss-label active';
    if (idx > 0) {
      var pDot  = document.getElementById('ssDot' + (idx - 1));
      var pLbl  = document.getElementById('ssLbl' + (idx - 1));
      var pLine = document.getElementById('ssLine' + (idx - 1));
      if (pDot)  pDot.className  = 'ss-dot done';
      if (pLbl)  pLbl.className  = 'ss-label done';
      if (pLine) pLine.className = 'ss-line done';
    }
  }
  activate(0);
  setTimeout(function() { activate(1); }, 600);
  setTimeout(function() { activate(2); }, 1300);
}

// NOTE: the old executeSend() (both the original definition and this God Mode override)
// has been retired. Execution now happens on trust-before-transaction.html after real
// approval — see goToTrustGate() above. buildStepperHTML/animateSendStepper are kept as
// unused-but-harmless dead code (no longer called from anywhere in this file — safe to
// remove in a future cleanup pass). logSend()/SEND_HIST_KEY were removed entirely in the
// 2026-07-15 open-items pass: openSendHistory() now reads the real `transactions` table
// directly (see above), the same source history.html reads — no more stale local cache.

// Navigation helpers for converted history.back() / window.location.href handlers.
function goTo(url) { window.location.href = url; }
function goBack() { history.back(); }

// ── Delegated dispatcher ──────────────────────────────────────────────────
// Replaces inline on* attributes (CSP phase: no inline handlers).
// Markup carries data-<kind>action="fn" + data-<kind>args='[...]'. JSON args:
// "$this" = element, "$event" = event (currentTarget = matched element), "$value" = element.value.
// data-stop = event.stopPropagation() equivalent: ancestors' actions do not fire.
function indxDispatch(e, actionKey, argsKey, gate) {
  for (let el = e.target; el && el !== document; el = el.parentElement) {
    const name = el.dataset && el.dataset[actionKey];
    if (name) {
      const fn = window[name];
      let args = null;
      if (typeof fn === 'function') {
        try { args = el.dataset[argsKey] ? JSON.parse(el.dataset[argsKey]) : []; } catch (_) { args = null; }
      }
      if (args && (!gate || gate(e))) {
                const ev = new Proxy(e, { get(t, k) { if (k === 'currentTarget') return el; const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; } });
        fn.apply(el, args.map(function (a) { return a === '$this' ? el : a === '$event' ? ev : a === '$value' ? el.value : a; }));
      }
    }
    if (e.type === 'click' && el.dataset && el.dataset.stop !== undefined) break;
    if (e.cancelBubble) break;
  }
}
const indxEnter = function (e) { return e.key === 'Enter'; };
document.addEventListener('click', function (e) { indxDispatch(e, 'action', 'args'); });
document.addEventListener('input', function (e) { indxDispatch(e, 'inputAction', 'inputArgs'); });
document.addEventListener('change', function (e) { indxDispatch(e, 'changeAction', 'changeArgs'); });
