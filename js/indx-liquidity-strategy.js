
// ── GOD MODE — Founder Interactive Layer ────────────────────────────────────
const INDX_PRICE_USD = 0.24;

function loadRoadmapState() {
  let state = {};
  try { state = JSON.parse(localStorage.getItem('indx_liquiditystrategy_roadmap') || '{}'); } catch (e) { state = {}; }
  document.querySelectorAll('.rm-check').forEach(cb => {
    if (state[cb.id]) {
      cb.checked = true;
      cb.closest('.check-row').classList.add('done');
    }
  });
  updateRoadmapProgress();
}

function toggleRoadmapItem(checkbox) {
  let state = {};
  try { state = JSON.parse(localStorage.getItem('indx_liquiditystrategy_roadmap') || '{}'); } catch (e) { state = {}; }
  state[checkbox.id] = checkbox.checked;
  localStorage.setItem('indx_liquiditystrategy_roadmap', JSON.stringify(state));
  checkbox.closest('.check-row').classList.toggle('done', checkbox.checked);
  updateRoadmapProgress();
}

function updateRoadmapProgress() {
  const boxes = document.querySelectorAll('.rm-check');
  const done = Array.from(boxes).filter(cb => cb.checked).length;
  const total = boxes.length || 14;
  const pct = Math.round((done / total) * 100);
  const fill = document.getElementById('roadmapProgressFill');
  const count = document.getElementById('roadmapProgressCount');
  if (fill) fill.style.width = pct + '%';
  if (count) count.textContent = done + ' / ' + total + ' steps';
}

function loadNotesAndReviewed() {
  let reviewed = {};
  let notes = {};
  try { reviewed = JSON.parse(localStorage.getItem('indx_liquiditystrategy_reviewed') || '{}'); } catch (e) { reviewed = {}; }
  try { notes = JSON.parse(localStorage.getItem('indx_liquiditystrategy_notes') || '{}'); } catch (e) { notes = {}; }
  for (let n = 1; n <= 4; n++) {
    const cb = document.getElementById('reviewedCheck' + n);
    const stamp = document.getElementById('reviewedStamp' + n);
    const input = document.getElementById('notesInput' + n);
    if (cb && reviewed[n] && reviewed[n].checked) {
      cb.checked = true;
      if (stamp) stamp.textContent = '✓ Reviewed ' + reviewed[n].date;
    }
    if (input && notes[n]) input.value = notes[n];
  }
  updateReviewedSummary();
}

function toggleReviewed(n, checkbox) {
  let reviewed = {};
  try { reviewed = JSON.parse(localStorage.getItem('indx_liquiditystrategy_reviewed') || '{}'); } catch (e) { reviewed = {}; }
  const stamp = document.getElementById('reviewedStamp' + n);
  if (checkbox.checked) {
    const date = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
    reviewed[n] = { checked: true, date: date };
    if (stamp) stamp.textContent = '✓ Reviewed ' + date;
  } else {
    delete reviewed[n];
    if (stamp) stamp.textContent = '';
  }
  localStorage.setItem('indx_liquiditystrategy_reviewed', JSON.stringify(reviewed));
  updateReviewedSummary();
}

function updateReviewedSummary() {
  const el = document.getElementById('reviewedSummary');
  if (!el) return;
  let reviewed = {};
  try { reviewed = JSON.parse(localStorage.getItem('indx_liquiditystrategy_reviewed') || '{}'); } catch (e) { reviewed = {}; }
  el.textContent = Object.keys(reviewed).length + ' / 4 strategies reviewed';
}

function saveNotes(n, value) {
  let notes = {};
  try { notes = JSON.parse(localStorage.getItem('indx_liquiditystrategy_notes') || '{}'); } catch (e) { notes = {}; }
  notes[n] = value;
  localStorage.setItem('indx_liquiditystrategy_notes', JSON.stringify(notes));
}

function filterCompareTable(rec, chip) {
  document.querySelectorAll('.gm-filter-row .gm-chip').forEach(c => c.classList.remove('active'));
  if (chip) chip.classList.add('active');
  document.querySelectorAll('#compareTable tbody tr').forEach(tr => {
    tr.classList.toggle('gm-hidden', rec !== 'all' && tr.dataset.rec !== rec);
  });
}

function sortCompareTable(colIndex, th) {
  const table = document.getElementById('compareTable');
  if (!table) return;
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const current = table.dataset.sortCol === String(colIndex) ? table.dataset.sortDir : null;
  const dir = current === 'asc' ? 'desc' : 'asc';
  rows.sort((a, b) => {
    const av = a.children[colIndex].dataset.sort || a.children[colIndex].textContent.trim();
    const bv = b.children[colIndex].dataset.sort || b.children[colIndex].textContent.trim();
    const an = parseFloat(String(av).replace(/[^0-9.-]/g, ''));
    const bn = parseFloat(String(bv).replace(/[^0-9.-]/g, ''));
    let cmp;
    if (!isNaN(an) && !isNaN(bn) && /^[\d$.,%\s-]+$/.test(String(av)) && /^[\d$.,%\s-]+$/.test(String(bv))) {
      cmp = an - bn;
    } else {
      cmp = String(av).localeCompare(String(bv));
    }
    return dir === 'asc' ? cmp : -cmp;
  });
  rows.forEach(r => tbody.appendChild(r));
  table.dataset.sortCol = String(colIndex);
  table.dataset.sortDir = dir;
  table.querySelectorAll('th.sortable .gm-sort-arrow').forEach(a => a.textContent = '↕');
  const arrow = th.querySelector('.gm-sort-arrow');
  if (arrow) arrow.textContent = dir === 'asc' ? '↑' : '↓';
}

function calcTreasury() {
  const input = document.getElementById('treasuryInput');
  const results = document.getElementById('treasuryResults');
  if (!input) return;
  const val = parseFloat(input.value);
  if (!val || val <= 0) { if (results) results.hidden = true; return; }
  localStorage.setItem('indx_liquiditystrategy_lasttreasury', String(val));
  const seedLow = val * 0.15;
  const seedHigh = val * 0.25;
  const indxAmount = (seedHigh / 2) / INDX_PRICE_USD;
  const jitoYield = val * 0.08;
  document.getElementById('calcSeedLow').textContent = '$' + seedLow.toLocaleString(undefined, { maximumFractionDigits: 0 });
  document.getElementById('calcSeedHigh').textContent = '$' + seedHigh.toLocaleString(undefined, { maximumFractionDigits: 0 });
  document.getElementById('calcIndxAmount').textContent = '≈ ' + Math.round(indxAmount).toLocaleString() + ' INDX';
  document.getElementById('calcJitoYield').textContent = '$' + jitoYield.toLocaleString(undefined, { maximumFractionDigits: 0 }) + '/yr';
  if (results) results.hidden = false;
}

function prefillTreasuryCalc() {
  const saved = localStorage.getItem('indx_liquiditystrategy_lasttreasury') || '0';
  const input = document.getElementById('treasuryInput');
  if (input && parseFloat(saved) > 0) {
    input.value = saved;
    calcTreasury();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadRoadmapState();
  loadNotesAndReviewed();
  prefillTreasuryCalc();
});

// ── Generated handler wrappers (inline on* attributes → named functions) ──


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
    }, { capture: true, passive: false }); })(EV.change);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, { capture: true, passive: false }); })(EV.click);

})();
