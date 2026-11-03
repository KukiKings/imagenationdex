
// ── GOD MODE: SMART BALANCE DEFAULT + CALCULATION HISTORY ───────────────────
function useMyBalance() {
  const bal = parseFloat(sessionStorage.getItem('citizen_balance') || '0');
  if (!bal) return;
  setUnit('USD');
  document.getElementById('calcInput').value = bal.toFixed(2);
  updateCalc();
  saveCalcHistory();
  const name = sessionStorage.getItem('citizen_name');
  showToast(name ? `Loaded ${name}'s balance: $${bal.toFixed(2)}` : `Loaded your balance: $${bal.toFixed(2)}`);
}

function saveCalcHistory() {
  const amt = calcAmt;
  if (!amt || amt <= 0) return;
  let hist = JSON.parse(localStorage.getItem('indx_law_calc_history') || '[]');
  hist = hist.filter(v => v !== amt);
  hist.unshift(amt);
  hist = hist.slice(0, 5);
  localStorage.setItem('indx_law_calc_history', JSON.stringify(hist));
  renderCalcHistory();
}

function renderCalcHistory() {
  const hist = JSON.parse(localStorage.getItem('indx_law_calc_history') || '[]');
  const wrap = document.getElementById('calcHistory');
  const chips = document.getElementById('calcHistoryChips');
  if (!hist.length) { wrap.hidden = true; return; }
  wrap.hidden = false;
  chips.innerHTML = hist.map(v => `<button class="calc-history-chip" data-action="h_1" data-args="${JSON.stringify(["$event",v]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">$${v.toFixed(2)}</button>`).join('');
}

function loadHistoryAmount(v) {
  setUnit('USD');
  document.getElementById('calcInput').value = v.toFixed(2);
  updateCalc();
}

// ── CONSTANTS ─────────────────────────────────────────────────────────────
// AUDIT 2026-09-10: INDX has no live market price — the token is not deployed
// or trading anywhere yet. This value is a placeholder used only to render an
// illustrative INDX-denominated figure in the calculator below; it is not a
// quote, estimate of fair value, or price target. See calcPriceNote in the
// markup, shown whenever the INDX unit tab is active, for the user-facing
// disclosure. Do not remove without also removing the INDX unit tab, since
// the tab's math depends on this constant.
const INDX_PRICE_USD = 0.24;

// ── COMPETITOR DATA ────────────────────────────────────────────────────────
const COMPETITORS = [
  { name:'Western Union', icon:'🏦', feePct:0.09,  flatFee:0,   color:'var(--red)' },
  { name:'Bank Wire',     icon:'🏛️', feePct:0,     flatFee:20,  color:'var(--red)' },
  { name:'PayPal',        icon:'🅿️', feePct:0.0349,flatFee:0,   color:'#F6C90E' },
  { name:'Stripe',        icon:'💳', feePct:0.029, flatFee:0.30,color:'#F6C90E' },
  { name:'IN$DEX',        icon:'⚡', feePct:0.02,  flatFee:0,   color:'var(--green)', isIndx:true },
];

// ── FEE DESTINATIONS ──────────────────────────────────────────────────────
const FEE_DESTS = [
  { label:'Liquidity Pool',        pct:40, color:'var(--cyan)' },
  { label:'Security & Operations', pct:30, color:'var(--purple)' },
  { label:'Community & Support',   pct:20, color:'var(--green)' },
  { label:'Citizen Governance',    pct:10, color:'var(--gold)' },
];

// ── STATE ─────────────────────────────────────────────────────────────────
let calcUnit = 'USD';
let calcAmt  = 100;
let compAmt  = 100;

// ── GM1: CALCULATOR ───────────────────────────────────────────────────────
function setUnit(u) {
  calcUnit = u;
  document.getElementById('tabUSD').classList.toggle('active', u === 'USD');
  document.getElementById('tabINDX').classList.toggle('active', u === 'INDX');
  document.getElementById('calcPrefix').textContent = u === 'INDX' ? '◎' : '$';
  document.getElementById('calcPriceNote').hidden = u !== 'INDX';
  updateCalc();
}

function updateCalc() {
  const raw = parseFloat(document.getElementById('calcInput').value) || 0;
  const usd = calcUnit === 'INDX' ? raw * INDX_PRICE_USD : raw;
  calcAmt = usd;

  const citizen = usd * 0.98;
  const fee     = usd * 0.02;
  const indxCit = citizen / INDX_PRICE_USD;
  const indxFee = fee    / INDX_PRICE_USD;

  const fmt = v => '$' + v.toFixed(2);
  const fmtI = v => v.toFixed(2) + ' INDX';

  document.getElementById('calcCitizen').textContent = fmt(citizen);
  document.getElementById('calcFee').textContent     = fmt(fee);
  document.getElementById('calcCitizenSub').textContent = calcUnit === 'INDX' ? fmtI(indxCit) : '98% of transaction';
  document.getElementById('calcFeeSub').textContent  = calcUnit === 'INDX' ? fmtI(indxFee) : '2% · funds the civilization';
  document.getElementById('calcExample').textContent = `On a ${fmt(usd)} sale: you receive ${fmt(citizen)} · civilization fee ${fmt(fee)}`;

  // Update fee destination total
  updateFeeDestination(fee, usd);
  // Persist
  localStorage.setItem('indx_law_last_amount', JSON.stringify({ raw, unit: calcUnit }));
}

// ── GM2: COMPETITOR COMPARISON ────────────────────────────────────────────
function setCompAmount(amt, btn) {
  compAmt = amt;
  document.querySelectorAll('.comp-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderCompTable();
}

function renderCompTable() {
  const tbody = document.getElementById('compBody');
  const indxFee = compAmt * 0.02;
  const indxCitizen = compAmt - indxFee;

  tbody.innerHTML = COMPETITORS.map(c => {
    const fee     = c.feePct * compAmt + c.flatFee;
    const citizen = compAmt - fee;
    const diff    = citizen - indxCitizen;
    const isIndx  = c.isIndx;
    const rowClass = isIndx ? ' class="comp-highlight"' : '';

    return `<tr${rowClass}>
      <td><div class="comp-name"><div class="comp-icon">${c.icon}</div>${c.name}${isIndx ? ' ⚡' : ''}</div></td>
      <td class="comp-fee${isIndx ? ' indx' : ''}">${c.flatFee && !c.feePct ? '$'+c.flatFee.toFixed(2)+' flat' : (c.feePct*100).toFixed(2)+'%'+(c.flatFee ? '+$'+c.flatFee.toFixed(2) : '')}</td>
      <td class="comp-citizen${isIndx ? ' indx' : ''}">$${citizen.toFixed(2)}</td>
      <td class="comp-savings${isIndx ? ' indx' : ''}">${isIndx ? '✅ Best rate' : (diff < 0 ? '-$'+Math.abs(diff).toFixed(2) : '+$'+diff.toFixed(2))}</td>
    </tr>`;
  }).join('');
}

// ── GM3: FEE DESTINATION ──────────────────────────────────────────────────
function updateFeeDestination(feeUSD, baseUSD) {
  document.getElementById('destBase').textContent  = '$' + (baseUSD||calcAmt).toFixed(2);
  document.getElementById('destTotal').textContent = '$' + feeUSD.toFixed(2);

  const rows = document.getElementById('destRows');
  rows.innerHTML = FEE_DESTS.map(d => {
    const amt = (feeUSD * d.pct / 100).toFixed(4);
    return `<div class="dest-row">
      <div class="dest-label">${d.label}</div>
      <div class="dest-bar-track">
        <div class="dest-bar-fill" style="width:${d.pct}%;background:${d.color};"></div>
      </div>
      <div class="dest-pct" style="color:${d.color};">${d.pct}%</div>
      <div class="dest-amount" style="color:${d.color};">$${amt}</div>
    </div>`;
  }).join('');
}

// ── GM4: SAVINGS PROJECTION ───────────────────────────────────────────────
const COMP_RATES = {
  wu:     { pct:0.09,   flat:0 },
  bank:   { pct:0,      flat:20 },
  paypal: { pct:0.0349, flat:0 },
  stripe: { pct:0.029,  flat:0.30 },
};

function updateSavings() {
  const vol    = parseFloat(document.getElementById('savingsVolume').value) || 0;
  const key    = document.getElementById('savingsCompare').value;
  const comp   = COMP_RATES[key];

  // Estimate number of transactions per month (assume avg $50 each)
  const txPerMonth = Math.max(1, Math.round(vol / 50));
  const compFee  = comp.pct * vol + comp.flat * txPerMonth;
  const indxFee  = 0.02 * vol;
  const saved    = Math.max(0, compFee - indxFee);

  const fmt = v => '$' + Math.round(v).toLocaleString();
  document.getElementById('savingsMo').textContent  = fmt(saved);
  document.getElementById('savingsYr').textContent  = fmt(saved * 12);
  document.getElementById('savings5yr').textContent = fmt(saved * 60);

  localStorage.setItem('indx_law_savings', JSON.stringify({ vol, key }));
}

// ── TOAST ─────────────────────────────────────────────────────────────────
function showToast(msg, ms) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), ms || 2800);
}

// ── INIT ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Restore last calculator amount
  const saved = JSON.parse(localStorage.getItem('indx_law_last_amount') || 'null');
  if (saved) {
    setUnit(saved.unit || 'USD');
    document.getElementById('calcInput').value = saved.raw || 100;
  }
  updateCalc();
  renderCompTable();

  // Restore savings inputs
  const sv = JSON.parse(localStorage.getItem('indx_law_savings') || 'null');
  if (sv) {
    document.getElementById('savingsVolume').value = sv.vol || 500;
    document.getElementById('savingsCompare').value = sv.key || 'wu';
  }
  updateSavings();

  // GOD MODE PATCH: reveal "Use my balance" when a citizen session has a balance, render history
  if (parseFloat(sessionStorage.getItem('citizen_balance') || '0') > 0) {
    document.getElementById('calcBalanceBtn').hidden = false;
  }
  renderCalcHistory();
});

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event, __p0) { loadHistoryAmount(__p0); }


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
    }, { capture: true, passive: false }); })(EV.input);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, { capture: true, passive: false }); })(EV.blur);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, { capture: true, passive: false }); })(EV.click);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, { capture: true, passive: false }); })(EV.change);

})();
