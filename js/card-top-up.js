
  const INDX_PRICE_USD = 0.24;
  const PRESETS = [10, 20, 50, 100, 200];
  let selectedAmount = 50;
  let selectedMethod = 'apple';

  // ── GOD MODE ADDITIONS ──
  const HISTORY_KEY = 'indx_card-top-up_history';
  const LAST_USED_KEY = 'indx_card-top-up_last';
  const FEE_RATES = { apple: 0, google: 0, card: 0.03, bank: 0.01, cash: 0 };
  let lastFocusedEl = null;

  function getHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch (e) { return []; }
  }

  function saveHistory(list) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 20)));
  }

  function recordAttempt(amount, method) {
    const list = getHistory();
    list.unshift({ amount: amount, method: method, indx: Number((amount / INDX_PRICE_USD).toFixed(0)), ts: Date.now() });
    saveHistory(list);
    renderHistoryDot();
  }

  function renderHistoryDot() {
    const btn = document.getElementById('historyBtn');
    if (btn) btn.classList.toggle('has-history', getHistory().length > 0);
  }

  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  }

  function openHistory() {
    lastFocusedEl = document.activeElement;
    const list = getHistory();
    const el = document.getElementById('historyList');
    if (list.length === 0) {
      el.innerHTML = '<div class="history-empty">No top-up attempts yet.</div>';
    } else {
      el.innerHTML = list.map(function (h) {
        const m = METHOD_LABELS[h.method] || { label: h.method };
        return '<div class="history-item"><div class="hi-left"><div class="hi-amount">$' + h.amount.toFixed(2) + ' via ' + m.label + '</div><div class="hi-meta">' + timeAgo(h.ts) + ' · ' + Number(h.indx || 0).toLocaleString() + ' INDX equiv.</div></div><div class="hi-badge">Simulated</div></div>';
      }).join('');
    }
    document.getElementById('historyOverlay').classList.add('show');
    trapFocus(document.getElementById('historySheet'));
  }

  function closeHistory() {
    document.getElementById('historyOverlay').classList.remove('show');
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  function closeHistoryOnTap(e) {
    if (e.target.id === 'historyOverlay') closeHistory();
  }

  function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    const el = document.getElementById('historyList');
    if (el) el.innerHTML = '<div class="history-empty">No top-up attempts yet.</div>';
    renderHistoryDot();
    showToast('History cleared.');
  }

  function saveLastUsed(amount, method) {
    localStorage.setItem(LAST_USED_KEY, JSON.stringify({ amount: amount, method: method, ts: Date.now() }));
  }

  function renderLastUsedChip() {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(LAST_USED_KEY) || 'null'); } catch (e) { data = null; }
    const chip = document.getElementById('lastUsedChip');
    if (!data || !chip) return;
    const m = METHOD_LABELS[data.method];
    document.getElementById('lastUsedText').innerHTML = 'Repeat last top-up: <strong>$' + Number(data.amount || 0).toFixed(2) + '</strong> via ' + (m ? m.label : data.method);
    chip.classList.remove('hidden');
  }

  function applyLastUsed() {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(LAST_USED_KEY) || 'null'); } catch (e) { data = null; }
    if (!data) return;
    if (PRESETS.indexOf(data.amount) !== -1) {
      selectPreset(data.amount);
    } else {
      focusCustom();
      document.getElementById('customInput').value = data.amount;
      onCustomInput(String(data.amount));
    }
    selectMethod(data.method);
    showToast('Applied your last top-up settings.');
  }

  function updateFeeBreakdown() {
    const feeLine = document.getElementById('convFeeLine');
    const netLine = document.getElementById('convNetLine');
    if (!feeLine || !netLine) return;
    const rate = FEE_RATES[selectedMethod] || 0;
    const amount = selectedAmount || 0;
    const fee = amount * rate;
    const net = amount - fee;
    const pct = (rate * 100).toFixed(0);
    const methodLabel = METHOD_LABELS[selectedMethod] ? METHOD_LABELS[selectedMethod].label : selectedMethod;
    feeLine.textContent = rate > 0 ? pct + '% ' + methodLabel + ' fee → $' + fee.toFixed(2) : 'No fee — ' + methodLabel + ' is free';
    netLine.textContent = amount > 0 ? 'Net credited: $' + net.toFixed(2) : 'Net credited: —';
  }

  function trapFocus(container) {
    if (!container) return;
    const focusable = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length) focusable[0].focus();
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' && e.key !== 'Tab') return;
    const confirmEl = document.getElementById('confirmOverlay');
    const historyEl = document.getElementById('historyOverlay');
    const confirmOpen = confirmEl.classList.contains('show');
    const historyOpen = historyEl.classList.contains('show');
    if (e.key === 'Escape') {
      if (confirmOpen) closeConfirm();
      if (historyOpen) closeHistory();
      return;
    }
    if (e.key === 'Tab' && (confirmOpen || historyOpen)) {
      const container = confirmOpen ? confirmEl.querySelector('.sheet') : document.getElementById('historySheet');
      const focusable = Array.prototype.slice.call(container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  // ── END GOD MODE ADDITIONS ──

  // [Fixed 2026-07-27] time:'Instant' contradicted executeTopUp()'s own
  // "Not connected yet — can't add real money" button state below.
  const METHOD_LABELS = {
    apple:  { label:'Apple Pay',               time:'Not live yet',     fee:'Free' },
    google: { label:'Google Pay',              time:'Not live yet',     fee:'Free' },
    card:   { label:'Debit / Credit Card',     time:'Not live yet',     fee:'~3%'  },
    bank:   { label:'Bank Transfer',           time:'1–2 business days',fee:'~1%'  },
    cash:   { label:'Cash at IN$DEX Merchant', time:'Not live yet',     fee:'Free' },
  };

  const SUPABASE_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
  const SB_HEADERS = { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };
  const citizenId = sessionStorage.getItem('citizen_id');
  let currentBalanceUsd = 0;

  async function init() {
    let usdBal = 0;
    if (citizenId) {
      try {
        const res = await fetch(SUPABASE_URL + '/rest/v1/citizens?id=eq.' + citizenId + '&select=indx_balance', { headers: SB_HEADERS });
        const rows = await res.json();
        const indxBal = rows && rows[0] ? parseFloat(rows[0].indx_balance) : 0;
        usdBal = indxBal * INDX_PRICE_USD;
      } catch (e) {}
    }
    currentBalanceUsd = usdBal;
    document.getElementById('currentBalance').textContent = '$' + usdBal.toFixed(2) + ' (' + (usdBal / INDX_PRICE_USD).toFixed(0) + ' INDX)';
    // Update INDX equivalents on presets
    PRESETS.forEach(p => {
      const indx = (p / INDX_PRICE_USD).toFixed(0);
      const el = document.getElementById('indx' + p);
      if (el) el.textContent = '≈ ' + Number(indx).toLocaleString() + ' INDX';
    });
    updateConversionBar();
    // GOD MODE PATCH
    renderLastUsedChip();
    renderHistoryDot();
  }

  function selectPreset(amount) {
    selectedAmount = amount;
    PRESETS.forEach(p => {
      const btn = document.getElementById('preset' + p);
      if (btn) btn.classList.toggle('active', p === amount);
    });
    document.getElementById('presetCustom').classList.remove('active');
    document.getElementById('customInput').value = '';
    document.getElementById('customInputRow').classList.remove('focused');
    updateConversionBar();
  }

  function focusCustom() {
    PRESETS.forEach(p => { const btn = document.getElementById('preset' + p); if (btn) btn.classList.remove('active'); });
    document.getElementById('presetCustom').classList.add('active');
    document.getElementById('customInput').focus();
  }

  function onCustomFocus() {
    PRESETS.forEach(p => { const btn = document.getElementById('preset' + p); if (btn) btn.classList.remove('active'); });
    document.getElementById('presetCustom').classList.add('active');
    document.getElementById('customInputRow').classList.add('focused');
  }

  function onCustomInput(val) {
    const n = parseFloat(val);
    selectedAmount = isNaN(n) || n <= 0 ? 0 : n;
    updateConversionBar();
  }

  function updateConversionBar() {
    const indx = selectedAmount > 0 ? (selectedAmount / INDX_PRICE_USD).toFixed(0) : '—';
    document.getElementById('convAmount').textContent = '$' + (selectedAmount || 0).toFixed(2) + ' USDC';
    document.getElementById('convIndx').textContent = selectedAmount > 0 ? '≈ ' + Number(indx).toLocaleString() + ' INDX' : '—';
    const label = selectedAmount > 0 ? 'Top Up $' + selectedAmount.toFixed(2) : 'Enter an amount';
    document.getElementById('ctaLabel').textContent = label;
    document.getElementById('ctaBtn').disabled = selectedAmount <= 0;
    // GOD MODE PATCH
    updateFeeBreakdown();
  }

  function selectMethod(key) {
    selectedMethod = key;
    Object.keys(METHOD_LABELS).forEach(k => {
      const el = document.getElementById('method-' + k);
      if (el) el.classList.toggle('active', k === key);
    });
    // GOD MODE PATCH
    updateFeeBreakdown();
  }

  function showConfirm() {
    if (selectedAmount <= 0) return;
    const m = METHOD_LABELS[selectedMethod];
    const newBal = (currentBalanceUsd + selectedAmount).toFixed(2);
    const indx = (selectedAmount / INDX_PRICE_USD).toFixed(0);
    document.getElementById('confirmAmount').textContent = '$' + selectedAmount.toFixed(2) + ' USDC';
    document.getElementById('confirmMethod').textContent = m.label;
    document.getElementById('confirmIndx').textContent = selectedMethod === 'apple' || selectedMethod === 'google' ? 'N/A — paying with ' + m.label : '≈ ' + Number(indx).toLocaleString() + ' INDX';
    document.getElementById('confirmTime').textContent = m.time;
    document.getElementById('confirmNewBal').textContent = 'Would be $' + newBal + ' — not applied (not connected)';
    document.getElementById('confirmOverlay').classList.add('show');
    // GOD MODE PATCH
    lastFocusedEl = document.activeElement;
    trapFocus(document.getElementById('confirmOverlay').querySelector('.sheet'));
  }

  function closeConfirm() {
    document.getElementById('confirmOverlay').classList.remove('show');
    // GOD MODE PATCH
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  function closeConfirmOnTap(e) {
    if (e.target.id === 'confirmOverlay') closeConfirm();
  }

  // No real payment processor is connected yet (Apple Pay / Google Pay / card /
  // bank / cash-at-merchant all require a licensed provider like Stripe with
  // real credentials — see buy-indx.html for an existing Stripe Elements
  // scaffold awaiting real keys). Crediting real INDX here without a real
  // payment behind it would let anyone mint free spendable balance, so this
  // deliberately does NOT touch indx_balance. Honest disclosure only.
  function executeTopUp() {
    // GOD MODE PATCH
    recordAttempt(selectedAmount, selectedMethod);
    saveLastUsed(selectedAmount, selectedMethod);
    renderLastUsedChip();
    closeConfirm();
    showToast('⚠️ Not connected to a real payment processor yet — no money was added.');
  }

  function showToast(msg) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#22263A;border:1px solid #2A2D38;color:#EAEAEA;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;z-index:999;max-width:360px;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,0.4);';
      document.body.appendChild(t);
    }
    t.textContent = msg; t.style.opacity = '1';
    clearTimeout(window._tt);
    window._tt = setTimeout(() => { t.style.opacity = '0'; }, 3500);
  }

  document.addEventListener('DOMContentLoaded', init);

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { history.back(); }


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
    }, { capture: true, passive: false }); })(EV.focus);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, { capture: true, passive: false }); })(EV.input);

})();
