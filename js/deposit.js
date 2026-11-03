
let activeMethod = 'card';
const INDX_PRICE_USD = 0.24; // $0.24 per INDX
const SUPABASE_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
const SB_HEADERS = { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };
const citizenId = sessionStorage.getItem('citizen_id');

// ── Smart greeting + real balance (was sessionStorage-guess with a fake '50' default) ──
(async function showGreetingAndBalance() {
  const name = sessionStorage.getItem('citizen_name');
  const bar = document.getElementById('greetingBar');
  if (name) {
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    bar.innerHTML = greet + ', <strong>' + name + '</strong>.';
  }
  const refEl = document.getElementById('bankRefName');
  if (refEl) {
    const domain = (sessionStorage.getItem('citizen_web3_domain') || '').replace(/\.IN\$DEX$/i, '');
    refEl.textContent = (domain || name || 'YOUR NAME').toUpperCase();
  }
  const balEl = document.getElementById('balPillVal');
  const usdEl = document.getElementById('balPillUsd');
  if (!citizenId) { if (balEl) balEl.textContent = '— INDX'; return; }
  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/citizens?id=eq.' + citizenId + '&select=indx_balance', { headers: SB_HEADERS });
    const rows = await res.json();
    const bal = rows && rows[0] ? parseFloat(rows[0].indx_balance) : 0;
    if (balEl) balEl.textContent = bal.toLocaleString(undefined,{maximumFractionDigits:2}) + ' INDX';
    if (usdEl) usdEl.textContent = '≈ $' + (bal * INDX_PRICE_USD).toFixed(2) + ' USD';
  } catch (e) {
    if (balEl) balEl.textContent = '— INDX';
  }
})();

// ── GOD MODE: FEATURE 1 — Amount persistence across method switches (harmless UI convenience, kept) ──
let persistedAmount = parseFloat(localStorage.getItem('indx_deposit_last_amount') || '0');

(function restoreAmount() {
  const stored = localStorage.getItem('indx_deposit_last_amount');
  if (stored && parseFloat(stored) > 0) {
    const inp = document.getElementById('cardAmount');
    if (inp) { inp.value = stored; calcCardEquiv(); }
  }
})();

function setMethod(el, method) {
  document.querySelectorAll('.method-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel' + method.charAt(0).toUpperCase() + method.slice(1)).classList.add('active');
  activeMethod = method;
}

function calcCardEquiv() {
  const amt = parseFloat(document.getElementById('cardAmount')?.value || 0);
  const indx = amt / INDX_PRICE_USD;
  const el = document.getElementById('cardEquiv');
  if (el) el.innerHTML = '≈ <span>' + (isNaN(indx) ? 0 : indx.toFixed(0)) + ' INDX</span>';
}

function setCardAmt(val) {
  const inp = document.getElementById('cardAmount');
  if (inp) {
    inp.value = val;
    calcCardEquiv();
    localStorage.setItem('indx_deposit_last_amount', String(val));
  }
}

function selectProvider(el) {
  document.querySelectorAll('.provider').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
}

function formatCard(el) {
  let v = el.value.replace(/\D/g,'').slice(0,16);
  el.value = v.replace(/(.{4})/g,'$1 ').trim();
}

function setNetwork(el, net) {
  document.querySelectorAll('.net-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  // Fabricated placeholder addresses removed 2026-07-29 — see the comment at #cryptoAddress.
  const addresses = {
    SOL:  'No deposit address yet — do not send funds',
    USDC: 'No deposit address yet — do not send funds',
    ETH:  'No deposit address yet — do not send funds'
  };
  document.getElementById('cryptoAddress').textContent = addresses[net] || addresses.SOL;
  const warns = { SOL:'⚠️ Crypto deposits are not live. Do not send funds — there is no address to receive them.', USDC:'⚠️ Crypto deposits are not live. Do not send funds.', ETH:'⚠️ Send only ETH (Neon EVM) to this address.' };
  document.querySelector('.warning-box').innerHTML = '<strong>' + warns[net] + '</strong> Sending other tokens may result in permanent loss. Minimum deposit: 0.1.';
}

function copyAddress() {
  const addr = document.getElementById('cryptoAddress').textContent;
  navigator.clipboard?.writeText(addr).catch(()=>{});
  const btn = document.getElementById('copyBtn');
  btn.textContent = 'Copied!';
  btn.style.background = 'var(--green)';
  btn.style.color = 'var(--black)';
  setTimeout(() => { btn.textContent = 'Copy'; btn.style.background = ''; btn.style.color = ''; }, 2000);
}

// Deliberately does NOT touch indx_balance or write any "completed deposit"
// record anywhere — none of card/bank/crypto rails are connected to a real
// payment/settlement backend, and crediting a balance without a real payment
// behind it would let anyone mint free INDX (same fraud-vector reasoning as
// card-top-up.html x26). Shows an honest not-connected notice instead.
function confirmDeposit(method) {
  const msgs = {
    card: 'Card deposits aren\'t connected to a real payment processor yet. No money moved.',
    bank: 'This bank account isn\'t confirmed as a real, monitored IN$DEX account, and there\'s no reconciliation system to credit a real transfer yet.',
    crypto: 'Crypto deposits aren\'t connected yet — this address is shared across all citizens, not unique to you, so nothing sent here could be credited safely.',
  };
  document.getElementById('successSub').textContent = msgs[method] || msgs.card;
  document.getElementById('successOverlay').classList.add('active');
}

// ── GOD MODE: FEATURE 4 — Share deposit address ──
function shareDepositAddress() {
  const addr = document.getElementById('cryptoAddress').textContent;
  const shareData = {
    title: 'My IN$DEX Deposit Address',
    text: 'IN$DEX crypto deposits are not live yet — there is no address to send to. Please do not send funds.',
    url: addr
  };
  if (navigator.share) {
    navigator.share(shareData).catch(() => {
      navigator.clipboard.writeText(addr).then(() => showToast('Address copied to clipboard'));
    });
  } else {
    navigator.clipboard.writeText(addr).then(() => showToast('Address copied to clipboard'));
  }
}

function closeSuccess() {
  document.getElementById('successOverlay').classList.remove('active');
}

// ════════════════════════════════════════════════
// GOD MODE R2 — DEPOSIT.HTML
// ════════════════════════════════════════════════
const INDX_GS_TARGET = INDX_PRICE_USD;
const DEP_DRAFT_KEY  = 'indx_deposit_draft';
const DEP_DISMISS_KEY= 'indx_deposit_draft_dismissed';

// ── 1. GRAND SYNCHRONICITY PROJECTION STRIP ────
// GOD MODE PATCH: wrap calcCardEquiv to also update GS strip
const _origCalcEquiv = calcCardEquiv;
window.calcCardEquiv = function() {
  _origCalcEquiv();
  const amt = parseFloat(document.getElementById('cardAmount')?.value || '0');
  const strip = document.getElementById('gsStrip');
  const gsVal = document.getElementById('gsVal');
  if (amt > 0) {
    const indx = amt / INDX_PRICE_USD;
    const gsUSD = indx * INDX_GS_TARGET;
    if (gsVal) gsVal.textContent = '$' + gsUSD.toFixed(2) + ' USD';
    if (strip) strip.classList.add('show');
    // Save draft
    try { localStorage.setItem(DEP_DRAFT_KEY, JSON.stringify({ amt, ts: Date.now() })); } catch(e) {}
  } else {
    if (strip) strip.classList.remove('show');
  }
};

// ── 2. DRAFT RESUME BANNER ────────────────────
function gmLoadDraftBanner() {
  try {
    const dismissed = localStorage.getItem(DEP_DISMISS_KEY);
    const raw = localStorage.getItem(DEP_DRAFT_KEY);
    if (!raw || dismissed === 'true') return;
    const d = JSON.parse(raw);
    if (!d || !d.amt || d.amt <= 0) return;
    // Only show if older than 30s (i.e. they left and came back)
    if (Date.now() - d.ts < 30000) return;
    document.getElementById('draftAmt').textContent = '$' + parseFloat(d.amt).toFixed(0);
    document.getElementById('draftBanner').classList.add('show');
  } catch(e) {}
}
function gmResumeDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(DEP_DRAFT_KEY) || '{}');
    if (d.amt) {
      const inp = document.getElementById('cardAmount');
      if (inp) { inp.value = d.amt; calcCardEquiv(); }
      inp && inp.scrollIntoView({ behavior:'smooth', block:'center' });
    }
  } catch(e) {}
  document.getElementById('draftBanner').classList.remove('show');
}
function gmDismissDraft() {
  document.getElementById('draftBanner').classList.remove('show');
  try { localStorage.setItem(DEP_DISMISS_KEY, 'true'); } catch(e) {}
}

// ── 4. PRE-DEPOSIT CONFIRM SHEET ─────────────
// GOD MODE PATCH: intercept confirmDeposit to show confirm sheet first
const _origConfirmDeposit = confirmDeposit;
window.confirmDeposit = function(method) {
  const amt = parseFloat(document.getElementById('cardAmount')?.value || '0');
  if (method === 'crypto') {
    // Crypto: just show success (no amount to verify)
    _origConfirmDeposit(method);
    return;
  }
  if (!(amt > 0)) { showToast('Enter an amount first'); return; }
  const indx = Math.floor(amt / INDX_PRICE_USD);
  const labels = { card:'💳 Card', bank:'🏦 Bank Transfer' };
  document.getElementById('dcsUSD').textContent = '$' + amt.toFixed(2) + ' USD';
  document.getElementById('dcsINDX').textContent = indx.toLocaleString() + ' INDX';
  document.getElementById('dcsMethod').textContent = labels[method] || method;
  document.getElementById('depConfirmOverlay').dataset.method = method;
  document.getElementById('depConfirmOverlay').classList.add('open');
};

function gmCloseConfirm() {
  document.getElementById('depConfirmOverlay').classList.remove('open');
}
function gmExecuteDeposit() {
  const method = document.getElementById('depConfirmOverlay').dataset.method || 'card';
  gmCloseConfirm();
  try { localStorage.removeItem(DEP_DISMISS_KEY); } catch(e) {}
  _origConfirmDeposit(method);
}

// Init
gmLoadDraftBanner();

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { event.stopPropagation();gmDismissDraft(); }
function h_2(event) { history.back(); }
function h_3(event) { if(event.target===this)gmCloseConfirm(); }
function h_4(event) { window.location.href='citizen-dashboard.html'; }
function h_5(event) { window.location.href='marketplace.html'; }
function h_6(event) { window.location.href='portfolio.html'; }
function h_7(event) { window.location.href='feed.html'; }
function h_8(event) { window.location.href='profile.html'; }


// ── Delegated dispatcher ──────────────────────────────────────────────────
// Replaces inline on* attributes (CSP phase: no inline handlers).
// Markup carries data-action / data-args (click) or data-<event>-action / data-<event>-args.
// JSON args: "$this" = element, "$event" = event (currentTarget = matched element),
// "$value" = element.value, "$checked" = element.checked.
function indxJ(v) { return JSON.stringify(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
(function () {
  const EV = { click: ['click', 'action', 'args', true], input: ['input', 'inputAction', 'inputArgs', true], change: ['change', 'changeAction', 'changeArgs', true],
    submit: ['submit', 'submitAction', 'submitArgs', true], keydown: ['keydown', 'keydownAction', 'keydownArgs', true], keyup: ['keyup', 'keyupAction', 'keyupArgs', true],
    keypress: ['keypress', 'keypressAction', 'keypressArgs', true], dblclick: ['dblclick', 'dblclickAction', 'dblclickArgs', true],
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
    }, false); })(EV.click);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, false); })(EV.input);

})();
