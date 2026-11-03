
const INDX_PRICE = 0.24;
let mintType = 'album';
let mintCount = 0;

// ===== GOD MODE PATCH: live estimator, local history, last-tab memory, sheet a11y =====
const HISTORY_KEY = 'indx_musicnft_history';
const LASTTAB_KEY = 'indx_musicnft_lastTab';

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch (e) { return []; }
}

function saveHistoryEntry(entry) {
  const list = getHistory();
  list.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 30)));
  updateHistoryBadge();
}

function updateHistoryBadge() {
  const count = getHistory().length;
  const badge = document.getElementById('historyBadge');
  if (!badge) return;
  badge.style.display = count > 0 ? 'flex' : 'none';
  badge.textContent = count > 99 ? '99+' : String(count);
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

function renderHistory() {
  const list = getHistory();
  const el = document.getElementById('historyList');
  if (!list.length) {
    el.innerHTML = '<div class="history-empty">No preview mints yet. Everything you create with "Mint &amp; List" is saved here, on this device only.</div>';
    return;
  }
  const icons = {album:'💿',single:'🎵',ticket:'🎫',merch:'👕'};
  el.innerHTML = list.map(function (h) {
    return '<div class="history-item"><div class="hi-icon">' + (icons[h.type] || '✨') + '</div>' +
      '<div class="hi-body"><div class="hi-title">' + escapeHtml(h.title) + '</div>' +
      '<div class="hi-meta">' + escapeHtml(h.typeLabel) + ' · ' + escapeHtml(h.date) + ' · preview only</div></div></div>';
  }).join('');
}

function openHistorySheet() {
  renderHistory();
  document.getElementById('historyOverlay').classList.add('show');
  document.getElementById('historySheet').classList.add('show');
}

function closeHistorySheet() {
  document.getElementById('historyOverlay').classList.remove('show');
  document.getElementById('historySheet').classList.remove('show');
}

function clearHistory() {
  localStorage.setItem(HISTORY_KEY, '[]');
  renderHistory();
  updateHistoryBadge();
  showToast('History cleared');
}

function updateEarningsEstimate() {
  const sliderEl = document.getElementById('estSlider');
  const pct = sliderEl ? (parseInt(sliderEl.value) || 0) : 50;
  const sliderValEl = document.getElementById('estSliderVal');
  if (sliderValEl) sliderValEl.textContent = pct + '% sold';

  let price = 0, supply = 0, unitLabel = 'editions';
  if (mintType === 'album' || mintType === 'single') {
    price = parseFloat((document.getElementById('releasePrice') || {}).value) || 0;
    supply = parseInt((document.getElementById('releaseEditions') || {}).value) || 0;
    unitLabel = 'editions';
  } else if (mintType === 'ticket') {
    price = parseFloat((document.getElementById('ticketGA') || {}).value) || 0;
    supply = parseInt((document.getElementById('ticketSupply') || {}).value) || 0;
    unitLabel = 'tickets (at GA price)';
  } else if (mintType === 'merch') {
    price = parseFloat((document.getElementById('merchPrice') || {}).value) || 0;
    supply = parseInt((document.getElementById('merchStock') || {}).value) || 0;
    unitLabel = 'items';
  }

  const soldCount = Math.round(supply * pct / 100);
  const netIndx = soldCount * price * 0.98;
  const netUsd = netIndx * INDX_PRICE;

  const earnEl = document.getElementById('estEarnings');
  const subEl = document.getElementById('estSub');
  if (earnEl) earnEl.textContent = '≈$' + netUsd.toFixed(2) + ' USD (planning ref.) · ' + netIndx.toFixed(1) + ' INDX';
  if (subEl) subEl.textContent = soldCount + ' of ' + supply + ' ' + unitLabel + ' · 98% yours';
}

// Focus trap + Escape-to-close for the open bottom sheet (mint sheet or history sheet)
function getFocusable(container) {
  if (!container) return [];
  return Array.prototype.slice.call(container.querySelectorAll('input, button, textarea, [tabindex]:not([tabindex="-1"])'))
    .filter(function (el) { return el.offsetParent !== null; });
}

document.addEventListener('keydown', function (e) {
  const mintSheetEl = document.getElementById('mintSheet');
  const historySheetEl = document.getElementById('historySheet');
  const mintOpen = mintSheetEl && mintSheetEl.classList.contains('show');
  const histOpen = historySheetEl && historySheetEl.classList.contains('show');
  if (!mintOpen && !histOpen) return;
  const activeSheet = mintOpen ? mintSheetEl : historySheetEl;

  if (e.key === 'Escape') {
    if (mintOpen) closeMintSheet(); else closeHistorySheet();
    return;
  }
  if (e.key === 'Tab') {
    const focusables = getFocusable(activeSheet);
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }
});
// ===== END GOD MODE PATCH =====

// Load citizen data
(function init() {
  const name = sessionStorage.getItem('citizen_name') || 'Your Artist Name';
  const domain = sessionStorage.getItem('citizen_web3_domain') || 'yourname.IN$DEX';
  document.getElementById('artistName').textContent = name;
  document.getElementById('artistDomain').textContent = domain;

  // Check URL for tab param
  const params = new URLSearchParams(location.search);
  if (params.get('tab') === 'tickets') {
    switchTab('tickets');
  } else {
    // GOD MODE PATCH: restore last visited tab when there's no explicit URL param
    const lastTab = localStorage.getItem(LASTTAB_KEY);
    if (lastTab && lastTab !== 'releases') switchTab(lastTab);
  }
  // GOD MODE PATCH: initialize the local preview-history badge count
  updateHistoryBadge();
})();

function updatePriceHint() {
  // Real pre-existing bug fix: this handler was referenced by the price input's
  // oninput but was never defined, so the "≈ $X USD each" hint never updated.
  const price = parseFloat(document.getElementById('releasePrice').value) || 0;
  document.getElementById('releasePriceHint').textContent = '≈ $' + (price * INDX_PRICE).toFixed(2) + ' USD each (planning ref., not live)';
}

function switchTab(tab) {
  ['releases','tickets','merch'].forEach(t => {
    document.getElementById('tab-' + t).classList.toggle('active', t === tab);
    document.getElementById('panel-' + t).style.display = t === tab ? 'block' : 'none';
  });
  // GOD MODE PATCH: remember the last active tab for the next visit
  localStorage.setItem(LASTTAB_KEY, tab);
}

function openMintSheet(type) {
  mintType = type;
  ['album','ticket','merch'].forEach(f => {
    document.getElementById('fields-' + f).style.display = 'none';
  });
  const typeKey = (type === 'single') ? 'album' : type;
  document.getElementById('fields-' + typeKey).style.display = 'block';

  const titles = {album:'Mint Album NFT',single:'Mint a Single',ticket:'Create Concert Ticket NFT',merch:'Tokenize Merch Item'};
  const subs = {album:'Your music. On the blockchain. Forever.',single:'One track. Infinite potential.',ticket:'Future-dated. Unforgeable. Giveaway-ready.',merch:'Physical item + NFT receipt. No counterfeits.'};
  document.getElementById('msTitle').textContent = titles[type] || 'Mint NFT';
  document.getElementById('msSub').textContent = subs[type] || '';

  document.getElementById('sheetOverlay').classList.add('show');
  document.getElementById('mintSheet').classList.add('show');

  // GOD MODE PATCH: live earnings estimate for the newly opened sheet type + autofocus first field
  updateEarningsEstimate();
  setTimeout(function () {
    const activeFields = document.getElementById('fields-' + typeKey);
    const firstInput = activeFields ? activeFields.querySelector('input, textarea') : null;
    if (firstInput) firstInput.focus();
  }, 350);
}

function closeMintSheet() {
  document.getElementById('sheetOverlay').classList.remove('show');
  document.getElementById('mintSheet').classList.remove('show');
}

function toggleGiveaway(btn) {
  const isOn = btn.classList.toggle('on');
  document.getElementById('giveawayField').style.display = isOn ? 'block' : 'none';
}

function mintNFT() {
  let title = '', icon = '🎵', successTitle = '', successSub = '';

  // Preview only — no real Solana NFT minting exists. Deliberately does NOT touch
  // sessionStorage.citizen_wisdom or any real balance/score: several real screens
  // gate real privileges on wisdom thresholds, so a fake bump here would be a
  // genuine privilege-escalation bug, not just fake UI (same fix as skill-point-nft.html).
  if (mintType === 'album' || mintType === 'single') {
    title = document.getElementById('releaseTitle').value.trim();
    if (!title) { showToast('Add a release title first'); return; }
    const editions = parseInt(document.getElementById('releaseEditions').value) || 100;
    icon = '💿';
    successTitle = 'Preview saved — nothing minted';
    successSub = 'No real Solana NFT was created and your Wisdom Score wasn\'t changed. This is saved locally so it\'s ready once minting is real.';
    mintCount++;
    document.getElementById('statReleases').textContent = mintCount;
    // Show preview release card
    document.getElementById('demoRelease').style.display = 'flex';
    document.getElementById('demoReleaseTitle').textContent = title;
    document.getElementById('demoReleaseType').textContent = (mintType === 'single' ? 'Single (preview)' : 'Album (preview)') + ' · ' + editions + ' editions';
  } else if (mintType === 'ticket') {
    title = document.getElementById('ticketEvent').value.trim();
    if (!title) { showToast('Add event name first'); return; }
    icon = '🎫';
    successTitle = 'Preview saved — no real tickets exist';
    successSub = 'No real ticket NFTs were created — no ticketing backend is connected yet. This is saved locally only.';
  } else if (mintType === 'merch') {
    title = document.getElementById('merchName').value.trim();
    if (!title) { showToast('Add item name first'); return; }
    icon = '👕';
    successTitle = 'Preview saved — nothing tokenized';
    successSub = 'No real NFT receipt was created — no merch fulfillment backend is connected yet. This is saved locally only.';
  }

  // GOD MODE PATCH: persist this preview mint to local history (device-only, not a real blockchain record)
  saveHistoryEntry({
    type: mintType,
    typeLabel: ({album:'Album (preview)',single:'Single (preview)',ticket:'Ticket (preview)',merch:'Merch (preview)'})[mintType] || 'Preview',
    title: title,
    date: new Date().toLocaleDateString()
  });

  closeMintSheet();
  setTimeout(() => {
    document.getElementById('soIcon').textContent = icon;
    document.getElementById('soTitle').textContent = successTitle;
    document.getElementById('soSub').textContent = successSub;
    document.getElementById('soNftId').textContent = 'No real token — preview only';
    document.getElementById('successOverlay').classList.add('show');
  }, 300);
}

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { window.location.href='tokenize.html'; }
function h_2(event) { window.location.href='citizen-dashboard.html'; }
function h_3(event) { window.location.href='marketplace.html'; }
function h_4(event) { window.location.href='sovereignpay.html'; }
function h_5(event) { window.location.href='feed.html'; }
function h_6(event) { window.location.href='search.html'; }
function h_7(event) { document.getElementById('successOverlay').classList.remove('show');location.reload(); }


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
    }, { capture: true, passive: false }); })(EV.input);

})();
