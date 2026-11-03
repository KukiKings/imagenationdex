
const INDX_PRICE_USD = 0.24;
const _MCC_KEY = 'indx_mcc_tab';

// ── GOD MODE: ORDER STATUS PERSISTENCE ──
const ORDER_STATUS_KEY = 'indx_mcc_order_status';

function getOrderStatuses() {
  try { return JSON.parse(localStorage.getItem(ORDER_STATUS_KEY) || '{}'); }
  catch (e) { return {}; }
}

function saveOrderStatus(id, status) {
  const all = getOrderStatuses();
  all[id] = status;
  localStorage.setItem(ORDER_STATUS_KEY, JSON.stringify(all));
}

function applyOrderStatus(id, status) {
  const badge = document.getElementById('orderStatus-' + id);
  const card = document.getElementById('orderCard-' + id);
  const actions = document.getElementById('orderActions-' + id);
  if (!badge || !card || !actions) return;
  if (status === 'confirmed') {
    badge.textContent = 'Confirmed';
    badge.className = 'oc-status confirmed';
    actions.innerHTML = '<div style="flex:1;text-align:center;font-size:12px;color:var(--green);font-weight:700;">✓ Confirmed — consent receipt generated</div>';
  } else if (status === 'cancelled') {
    badge.textContent = 'Cancelled';
    badge.className = 'oc-status cancelled';
    card.classList.add('cancelled');
    const note = document.getElementById('orderStatusNote-' + id);
    if (note) note.textContent = 'Cancelled — no funds moved';
    actions.innerHTML = '<div style="flex:1;text-align:center;font-size:12px;color:var(--red);font-weight:700;">✕ Cancelled — no funds moved</div>';
  }
}

function confirmOrder(id) {
  applyOrderStatus(id, 'confirmed');
  saveOrderStatus(id, 'confirmed');
  showToast('Order confirmed. Consent receipt generated.');
}

function cancelOrder(id) {
  applyOrderStatus(id, 'cancelled');
  saveOrderStatus(id, 'cancelled');
  showToast('Order cancelled. No funds moved.');
}

function restoreOrderStatuses() {
  const all = getOrderStatuses();
  Object.keys(all).forEach(id => applyOrderStatus(id, all[id]));
}

// ── GOD MODE: PAYOUT CONFIRM SHEET + LOCAL PAYOUT LOG ──
const PAYOUT_LOG_KEY = 'indx_mcc_payout_log';

function getPayoutLog() {
  try { return JSON.parse(localStorage.getItem(PAYOUT_LOG_KEY) || '[]'); }
  catch (e) { return []; }
}

function openPayoutConfirmSheet() {
  document.getElementById('payoutConfirmOverlay').classList.add('show');
  const btn = document.querySelector('#payoutConfirmSheet .sheet-btn.primary');
  if (btn) btn.focus();
}

function closePayoutConfirmSheet() {
  document.getElementById('payoutConfirmOverlay').classList.remove('show');
}

function confirmPayoutRequest() {
  const log = getPayoutLog();
  log.unshift({ amount: 346.40, fee: 6.93, destination: 'ANZ PayID', ts: Date.now() });
  localStorage.setItem(PAYOUT_LOG_KEY, JSON.stringify(log.slice(0, 20)));
  closePayoutConfirmSheet();
  showToast('Payout requested: $346.40 → ANZ PayID. Logged to your payout history.');
}

function openPayoutHistorySheet() {
  renderPayoutHistory();
  document.getElementById('payoutHistoryOverlay').classList.add('show');
  const btn = document.querySelector('#payoutHistorySheet .sheet-btn.cancel');
  if (btn) btn.focus();
}

function closePayoutHistorySheet() {
  document.getElementById('payoutHistoryOverlay').classList.remove('show');
}

function renderPayoutHistory() {
  const log = getPayoutLog();
  const container = document.getElementById('payoutHistoryList');
  if (!log.length) {
    container.innerHTML = '<div class="payout-log-empty">No payout requests logged on this device yet.</div>';
    return;
  }
  container.innerHTML = log.map(function(p) {
    const d = new Date(p.ts);
    const dateStr = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    return '<div class="payout-log-item">' +
      '<div class="payout-log-top"><span>$' + p.amount.toFixed(2) + '</span><span style="color:var(--text-muted);font-weight:600;">-$' + p.fee.toFixed(2) + ' fee</span></div>' +
      '<div class="payout-log-meta">' + p.destination + ' · ' + dateStr + '</div>' +
      '</div>';
  }).join('');
}

// ── GOD MODE: ESCAPE-TO-CLOSE + FOCUS TRAP for both new sheets ──
function _activeGodModeSheet() {
  if (document.getElementById('payoutConfirmOverlay').classList.contains('show')) return { overlay: 'payoutConfirmOverlay', sheet: 'payoutConfirmSheet', close: closePayoutConfirmSheet };
  if (document.getElementById('payoutHistoryOverlay').classList.contains('show')) return { overlay: 'payoutHistoryOverlay', sheet: 'payoutHistorySheet', close: closePayoutHistorySheet };
  return null;
}

document.addEventListener('keydown', function(e) {
  const active = _activeGodModeSheet();
  if (!active) return;
  if (e.key === 'Escape') { active.close(); return; }
  if (e.key !== 'Tab') return;
  const sheet = document.getElementById(active.sheet);
  const focusables = sheet.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
  if (!focusables.length) return;
  const first = focusables[0], last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

// ── FIX 2026-09-03: real dispute data for the Disputes tab (see markup comment above) ──
const SUPABASE_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const citizenId = sessionStorage.getItem('citizen_id');
let _realAccessToken = null;
async function initRealSession() {
  try {
    const { data } = await sb.auth.getSession();
    if (data && data.session && data.session.access_token) _realAccessToken = data.session.access_token;
  } catch (e) { /* stay on anon key */ }
}
async function rpc(name, body) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + (_realAccessToken || SUPABASE_ANON_KEY), 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}
const DISPUTE_STATUS_LABEL = { open: ['OPEN','#ffb800'], evidence: ['EVIDENCE ADDED','#ffb800'], mediation: ['IN MEDIATION','#ffb800'],
  resolved_buyer: ['RESOLVED (BUYER)','#00e5a0'], resolved_seller: ['RESOLVED (SELLER)','#00e5a0'], withdrawn: ['WITHDRAWN','var(--text-muted)'] };
async function loadMerchantDisputes() {
  const loadingEl = document.getElementById('disputesLoading');
  const listEl = document.getElementById('realDisputesList');
  const emptyEl = document.getElementById('noDisputesMsg');
  if (!citizenId) {
    loadingEl.style.display = 'none';
    emptyEl.textContent = 'Log in to see your disputes.';
    emptyEl.style.display = 'block';
    return;
  }
  try {
    await initRealSession();
    const disputes = await rpc('get_my_disputes', { p_citizen_id: citizenId });
    loadingEl.style.display = 'none';
    if (!disputes || disputes.length === 0) {
      emptyEl.style.display = 'block';
      return;
    }
    listEl.style.display = 'block';
    listEl.innerHTML = disputes.map(function(d) {
      const meta = DISPUTE_STATUS_LABEL[d.status] || [String(d.status || '').toUpperCase(), 'var(--text-muted)'];
      const opened = d.opened_at ? new Date(d.opened_at).toLocaleDateString() : '';
      return '<div class="dispute-card" data-action="h_4" data-args="[&quot;$event&quot;]">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
        '<span style="font-size:11px;font-weight:700;color:' + meta[1] + ';">' + meta[0] + '</span>' +
        '<span style="font-size:11px;color:var(--text-muted);">Opened ' + opened + '</span></div>' +
        '<div style="font-size:13px;">' + ((d.reason || '').split(':')[0] || 'Dispute') + '</div></div>';
    }).join('');
  } catch (e) {
    loadingEl.textContent = 'Could not load disputes right now.';
  }
}

var SI_MSGS = [
  'Your screen prints listing is getting 3× more views than your average. One buyer has messaged twice. I recommend responding within 2 hours.',
  'Your $346.40 in earnings is ready for payout. I will show the full fee before anything moves.',
  'Your tapa cloth listing is awaiting cultural review. Cultural Steward check typically takes under 48 hours.',
  'You have 3 new order notifications. Responding quickly improves your Wisdom Score and seller trust rating.',
  'Tip: Adding a short story about your print process increases buyer confidence and listing views.'
];
var siMsgIdx = 0;

function switchTab(id, btn) {
  document.querySelectorAll('.tab-panel').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('active'); });
  document.getElementById('tab-' + id).classList.add('active');
  btn.classList.add('active');
  localStorage.setItem(_MCC_KEY, id);
}

function rotateSiMsg() {
  siMsgIdx = (siMsgIdx + 1) % SI_MSGS.length;
  document.getElementById('siDashMsg').textContent = SI_MSGS[siMsgIdx];
}

function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function(){ t.classList.remove('show'); }, 3400);
}

document.addEventListener('DOMContentLoaded', function() {
  var saved = localStorage.getItem(_MCC_KEY);
  if (saved) {
    var btn = document.querySelector('.tab-btn[onclick*="' + saved + '"]');
    if (btn) switchTab(saved, btn);
  }
  loadMerchantDisputes();
  // GOD MODE PATCH: restore any persisted order confirm/cancel state on load
  restoreOrderStatuses();
});

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { history.back(); }
function h_2(event) { if(event.target===this)closePayoutConfirmSheet(); }
function h_3(event) { if(event.target===this)closePayoutHistorySheet(); }
function h_4(event) { window.location.href='dispute.html'; }


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

})();
