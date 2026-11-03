
// ── SWAP HISTORY ──────────────────────────────────────────────────────
const MAX_HIST = 20;
function logSwap(fromSym, fromAmt, toSym, toAmt) {
  let h = JSON.parse(localStorage.getItem('indx_swap_hist') || '[]');
  h.unshift({ from: fromSym, fromAmt, to: toSym, toAmt, ts: Date.now() });
  localStorage.setItem('indx_swap_hist', JSON.stringify(h.slice(0, MAX_HIST)));
}
function openHistory() {
  const h = JSON.parse(localStorage.getItem('indx_swap_hist') || '[]');
  const list = document.getElementById('histList');
  if (!h.length) {
    list.innerHTML = '<div class="hist-empty">No preview swaps yet.<br>Nothing here is a real, executed trade — SovSwap isn\'t connected to a live DEX yet.</div>';
  } else {
    list.innerHTML = h.map(s => {
      const d = new Date(s.ts);
      const label = d.toLocaleDateString('en-AU', { day:'numeric', month:'short' }) + ' ' + d.toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' });
      return `<div class="hist-item">
        <div>
          <div class="hist-pair">${s.from} → ${s.to}</div>
          <div class="hist-meta">${label}</div>
        </div>
        <div class="hist-amt">
          <div class="hist-out">+${parseFloat(s.toAmt).toFixed(4)} ${s.to}</div>
          <div class="hist-in">${parseFloat(s.fromAmt).toFixed(4)} ${s.from}</div>
        </div>
      </div>`;
    }).join('');
  }
  document.getElementById('histOverlay').classList.add('active');
  document.getElementById('historySheet').classList.add('active');
}
function closeHistory() {
  document.getElementById('histOverlay').classList.remove('active');
  document.getElementById('historySheet').classList.remove('active');
}

// ── TOKEN FAVORITES ────────────────────────────────────────────────────
function getFavs() { return JSON.parse(localStorage.getItem('indx_fav_tokens') || '[]'); }
function toggleFav(symbol, event) {
  event.stopPropagation();
  let favs = getFavs();
  const idx = favs.indexOf(symbol);
  if (idx >= 0) favs.splice(idx, 1);
  else favs.push(symbol);
  localStorage.setItem('indx_fav_tokens', JSON.stringify(favs));
  renderPicker(document.getElementById('tokenSearch').value
    ? TOKENS.filter(t => t.symbol.toLowerCase().includes(document.getElementById('tokenSearch').value.toLowerCase()) || t.name.toLowerCase().includes(document.getElementById('tokenSearch').value.toLowerCase()))
    : TOKENS);
}

// ── SUPABASE (real INDX balance only — no other asset is actually custodied) ──
const SUPABASE_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
const SB_HEADERS = { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };
const citizenId = sessionStorage.getItem('citizen_id');

async function loadRealIndxBalance() {
  if (!citizenId) return;
  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/citizens?id=eq.' + citizenId + '&select=indx_balance', { headers: SB_HEADERS });
    const rows = await res.json();
    const bal = rows && rows[0] ? parseFloat(rows[0].indx_balance) : null;
    if (bal !== null && !isNaN(bal)) {
      const indx = TOKENS.find(t => t.symbol === 'INDX');
      indx.balance = bal.toFixed(2);
      indx.usdBal = '$' + (bal * INDX_PRICE_USD_FIXED).toFixed(2);
      updateUI();
      renderPicker(TOKENS);
    }
  } catch (e) { /* real balance unavailable — leave placeholder */ }
}

// INDX price is facts-fixed at $0.24 USD — never invent a different value or simulate live movement.
const INDX_PRICE_USD_FIXED = 0.24;

// ── TOKEN DATA ── (SOL/USDC/USDT/BTC/ETH: illustrative reference values only — IN$DEX does not
// custody these assets for citizens today; only indx_balance is a real, backed number)
const TOKENS = [
  { symbol:'SOL',  name:'Solana',          cls:'sol',  logo:'◎',   balance:'0.00',   usdBal:'not connected',  price:200,   change:+2.1  },
  { symbol:'INDX', name:'IN$DEX',          cls:'indx', logo:'IN$', balance:'0',      usdBal:'—',              price:0.24,  change:0     },
  { symbol:'USDC', name:'USD Coin',         cls:'usdc', logo:'$',   balance:'0.00',   usdBal:'not connected',  price:1,     change:0     },
  { symbol:'USDT', name:'Tether',           cls:'usdt', logo:'₮',   balance:'0.00',   usdBal:'not connected',  price:1,     change:0     },
  { symbol:'BTC',  name:'Bitcoin (Wrapped)', cls:'btc', logo:'₿',   balance:'0.00',   usdBal:'not connected',  price:65000, change:-0.8  },
  { symbol:'ETH',  name:'Ethereum (Neon)',  cls:'eth',  logo:'Ξ',   balance:'0.00',   usdBal:'not connected',  price:3200,  change:+1.3  },
];

let fromToken = TOKENS[0]; // SOL
let toToken   = TOKENS[1]; // INDX
let slippage  = 0.5;
let pickerTarget = 'from';

// ── INIT ── single DOMContentLoaded entry point — renderPairPins (defined below,
// hoisted) is called from here too so this file registers only one listener.
function initDexSwap() {
  renderPicker(TOKENS);
  drawChart();
  updateChartPair();
  loadRealIndxBalance();
  renderPairPins();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDexSwap, { once: true });
} else {
  initDexSwap();
}

function updateUI() {
  // From
  document.getElementById('fromLogo').textContent = fromToken.logo;
  document.getElementById('fromLogo').className = 'token-logo ' + fromToken.cls;
  document.getElementById('fromSymbol').textContent = fromToken.symbol;
  document.getElementById('fromBalance').textContent = fromToken.balance + ' ' + fromToken.symbol;
  // To
  document.getElementById('toLogo').textContent = toToken.logo;
  document.getElementById('toLogo').className = 'token-logo ' + toToken.cls;
  document.getElementById('toSymbol').textContent = toToken.symbol;
  document.getElementById('toBalance').textContent = toToken.balance + ' ' + toToken.symbol;
  updateChartPair();
  calcOutput();
}

// ── CALC OUTPUT ──
function calcOutput() {
  const input = parseFloat(document.getElementById('fromAmount').value);
  const fromUSD = document.getElementById('fromUSD');
  const outputEl = document.getElementById('outputAmount');
  const routeBadge = document.getElementById('routeBadge');
  const swapBtn = document.getElementById('swapBtn');
  const detailsEl = document.getElementById('swapDetails');
  const feeBadge = document.getElementById('feeBadge');

  if (!input || isNaN(input) || input <= 0) {
    fromUSD.textContent = '≈ $0.00';
    outputEl.textContent = '';
    outputEl.className = 'output-amount';
    routeBadge.style.display = 'none';
    swapBtn.disabled = true;
    swapBtn.textContent = 'Enter an amount';
    detailsEl.style.display = 'none';
    feeBadge.textContent = '';
    document.getElementById('impactBanner').classList.remove('show');
    document.getElementById('routeViz').classList.remove('show');
    return;
  }

  const usdIn = input * fromToken.price;
  fromUSD.textContent = '≈ $' + usdIn.toLocaleString('en-AU', {minimumFractionDigits:2, maximumFractionDigits:2});

  // Rate: fromToken USD → toToken
  const rawOut = (usdIn / toToken.price) * 0.98; // 2% sovereign fee
  const feeAmt = (usdIn / toToken.price) * 0.02;

  outputEl.textContent = rawOut.toLocaleString('en-AU', {minimumFractionDigits:2, maximumFractionDigits:4});
  outputEl.className = 'output-amount';
  document.getElementById('toUSD').textContent = '≈ $' + (rawOut * toToken.price).toLocaleString('en-AU', {minimumFractionDigits:2, maximumFractionDigits:2});

  routeBadge.style.display = 'inline-flex';

  // Fee
  feeBadge.textContent = feeAmt.toFixed(4) + ' ' + toToken.symbol;

  // Details
  detailsEl.style.display = 'block';
  const rate = (1 / fromToken.price) * toToken.price;
  document.getElementById('detailRate').textContent = '1 ' + fromToken.symbol + ' = ' + (fromToken.price / toToken.price).toFixed(4) + ' ' + toToken.symbol;
  // Price impact (based on USD value of swap)
  const impactPct = usdIn < 100 ? 0.01 : usdIn < 500 ? 0.05 : usdIn < 2000 ? 0.3 : usdIn < 10000 ? 1.2 : 3.5;
  const impactEl = document.getElementById('detailImpact');
  const bannerEl = document.getElementById('impactBanner');
  bannerEl.className = 'impact-banner';
  if (impactPct < 0.1) {
    impactEl.textContent = '< 0.1%';
    impactEl.className = 'detail-value green';
    bannerEl.classList.remove('show');
  } else if (impactPct < 1) {
    impactEl.textContent = '~' + impactPct.toFixed(2) + '%';
    impactEl.className = 'detail-value';
    impactEl.style.color = 'var(--cyan)';
    bannerEl.classList.remove('show');
  } else if (impactPct < 3) {
    impactEl.textContent = '⚠ ~' + impactPct.toFixed(1) + '%';
    impactEl.className = 'detail-value';
    impactEl.style.color = '#FFB800';
    bannerEl.innerHTML = '⚠️ <span>High price impact (~' + impactPct.toFixed(1) + '%). Consider splitting into smaller orders.</span>';
    bannerEl.classList.add('show', 'impact-warn');
  } else {
    impactEl.textContent = '🚨 ~' + impactPct.toFixed(1) + '%';
    impactEl.className = 'detail-value red';
    bannerEl.innerHTML = '🚨 <span>Very high impact (~' + impactPct.toFixed(1) + '%). This swap may move the market. Split into smaller orders.</span>';
    bannerEl.classList.add('show', 'impact-danger');
  }
  const minReceived = rawOut * (1 - slippage/100);
  document.getElementById('detailMin').textContent = minReceived.toFixed(4) + ' ' + toToken.symbol;

  // Route visualization
  const routeViz = document.getElementById('routeViz');
  const routePath = document.getElementById('routePath');
  const routeSplit = document.getElementById('routeSplit');
  routeViz.classList.add('show');
  // Determine route hops: if stablecoins involved, route via USDC bridge; otherwise direct
  const needsBridge = !['USDC','USDT'].includes(fromToken.symbol) && !['USDC','USDT'].includes(toToken.symbol) && fromToken.symbol !== 'INDX' && toToken.symbol !== 'INDX';
  if (needsBridge) {
    routePath.innerHTML = `<span class="route-token">${fromToken.symbol}</span><span class="route-arrow">→</span><span class="route-via">Raydium</span><span class="route-arrow">→</span><span class="route-token">USDC</span><span class="route-arrow">→</span><span class="route-via">IN$DEX Pool</span><span class="route-arrow">→</span><span class="route-token">${toToken.symbol}</span>`;
    routeSplit.textContent = usdIn > 1000 ? '70% Raydium · 30% Orca (split for best price)' : 'Single route · best available';
  } else {
    routePath.innerHTML = `<span class="route-token">${fromToken.symbol}</span><span class="route-arrow">→</span><span class="route-via">Raydium CPMM</span><span class="route-arrow">→</span><span class="route-token">${toToken.symbol}</span>`;
    routeSplit.textContent = 'Direct pool · lowest fees';
  }

  // Confirm sheet
  document.getElementById('cfFrom').textContent = input + ' ' + fromToken.symbol;
  document.getElementById('cfTo').textContent = rawOut.toFixed(4) + ' ' + toToken.symbol;
  document.getElementById('cfRate').textContent = '1 ' + fromToken.symbol + ' = ' + (fromToken.price / toToken.price).toFixed(4) + ' ' + toToken.symbol;
  document.getElementById('cfFee').textContent = feeAmt.toFixed(4) + ' ' + toToken.symbol;
  document.getElementById('cfMin').textContent = minReceived.toFixed(4) + ' ' + toToken.symbol;

  swapBtn.disabled = false;
  swapBtn.textContent = 'Swap ' + fromToken.symbol + ' → ' + toToken.symbol;
}

// ── MAX ──
function setMax() {
  document.getElementById('fromAmount').value = parseFloat(fromToken.balance);
  calcOutput();
}

// ── FLIP ──
function flipTokens() {
  const btn = document.getElementById('flipBtn');
  btn.classList.add('flipping');
  setTimeout(() => btn.classList.remove('flipping'), 300);
  [fromToken, toToken] = [toToken, fromToken];
  document.getElementById('fromAmount').value = '';
  updateUI();
}


// ── SLIPPAGE ──
function setSlippage(el, val) {
  document.querySelectorAll('.slip-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  slippage = parseFloat(val);
  document.getElementById('slipCustom').value = '';
  calcOutput();
}
function customSlippage(el) {
  const v = parseFloat(el.value);
  if (!isNaN(v) && v > 0) {
    document.querySelectorAll('.slip-chip').forEach(c => c.classList.remove('active'));
    slippage = v;
    calcOutput();
  }
}
function openSlippage() {
  const d = document.getElementById('swapDetails');
  d.style.display = d.style.display === 'none' || !d.style.display ? 'block' : 'none';
}

// ── PERIOD ──
function setPeriod(el, p) {
  document.querySelectorAll('.period-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  drawChart(p);
}

// ── CHART ──
function updateChartPair() {
  document.getElementById('chartPair').textContent = fromToken.symbol + ' / ' + toToken.symbol;
  const change = fromToken.change - toToken.change;
  const up = change >= 0;
  document.getElementById('chartPrice').textContent = (fromToken.price / toToken.price).toFixed(4);
  const changeEl = document.getElementById('chartChange');
  changeEl.textContent = (up ? '↑ +' : '↓ ') + Math.abs(change).toFixed(1) + '%';
  changeEl.className = 'chart-change ' + (up ? 'up' : 'down');
}

function drawChart(period) {
  const canvas = document.getElementById('priceChart');
  const ctx = canvas.getContext('2d');
  const W = canvas.parentElement.offsetWidth;
  const H = 90;
  canvas.width = W;
  canvas.height = H;

  // FIXED 2026-07-25: was Math.random()-driven fake price history (a chart of
  // trading activity that never happened) — no LP is seeded and no real swap
  // executes on this screen, so there is no real price history to chart. Draw
  // a flat reference line at the current ratio instead of fabricating movement.
  const pts = 60;
  const data = [];
  const flat = Math.max(0.2, Math.min(1.2, 0.5 + (fromToken.change - toToken.change) * 0.001));
  for (let i = 0; i < pts; i++) {
    data.push(flat);
  }

  const min = Math.min(...data) * 0.95;
  const max = Math.max(...data) * 1.05;
  const scaleY = y => H - ((y - min) / (max - min)) * (H - 10) - 5;
  const scaleX = i => (i / (pts - 1)) * W;

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(0,212,255,0.25)');
  grad.addColorStop(1, 'rgba(245,200,66,0)');

  ctx.beginPath();
  ctx.moveTo(scaleX(0), scaleY(data[0]));
  for (let i = 1; i < pts; i++) {
    const cx = (scaleX(i-1) + scaleX(i)) / 2;
    ctx.bezierCurveTo(cx, scaleY(data[i-1]), cx, scaleY(data[i]), scaleX(i), scaleY(data[i]));
  }
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(scaleX(0), scaleY(data[0]));
  for (let i = 1; i < pts; i++) {
    const cx = (scaleX(i-1) + scaleX(i)) / 2;
    ctx.bezierCurveTo(cx, scaleY(data[i-1]), cx, scaleY(data[i]), scaleX(i), scaleY(data[i]));
  }
  ctx.strokeStyle = '#00D4FF';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ── TOKEN PICKER ──
function renderPicker(tokens) {
  const list = document.getElementById('pickerList');
  const favs = getFavs();
  // Sort: favorites first
  const sorted = [...tokens].sort((a, b) => {
    const aFav = favs.includes(a.symbol) ? 0 : 1;
    const bFav = favs.includes(b.symbol) ? 0 : 1;
    return aFav - bFav;
  });
  list.innerHTML = sorted.map(t => {
    const isFav = favs.includes(t.symbol);
    return `
    <div class="picker-item ${t === fromToken || t === toToken ? 'selected' : ''}" data-action="h_2" data-args="${JSON.stringify(["$event",t.symbol]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">
      <div class="token-logo ${t.cls}">${t.logo}</div>
      <div class="picker-info">
        <div class="picker-symbol">${t.symbol}</div>
        <div class="picker-name">${t.name}</div>
      </div>
      <div class="picker-balance">
        <div class="picker-bal-val">${t.balance}</div>
        <div class="picker-bal-usd">${t.usdBal}</div>
      </div>
      <div class="fav-star ${isFav ? 'active' : ''}" data-action="h_3" data-args="${JSON.stringify(["$event",t.symbol]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">${isFav ? '★' : '☆'}</div>
    </div>`;
  }).join('');
}

function filterTokens(q) {
  const filtered = TOKENS.filter(t =>
    t.symbol.toLowerCase().includes(q.toLowerCase()) ||
    t.name.toLowerCase().includes(q.toLowerCase())
  );
  renderPicker(filtered);
}

function openPicker(target) {
  pickerTarget = target;
  document.getElementById('tokenSearch').value = '';
  renderPicker(TOKENS);
  document.getElementById('pickerOverlay').classList.add('active');
  document.getElementById('tokenPicker').classList.add('active');
}

function closePicker() {
  document.getElementById('pickerOverlay').classList.remove('active');
  document.getElementById('tokenPicker').classList.remove('active');
}

function selectToken(symbol) {
  const token = TOKENS.find(t => t.symbol === symbol);
  if (!token) return;
  if (pickerTarget === 'from') {
    if (token === toToken) { [fromToken, toToken] = [toToken, fromToken]; }
    else fromToken = token;
  } else {
    if (token === fromToken) { [fromToken, toToken] = [toToken, fromToken]; }
    else toToken = token;
  }
  closePicker();
  updateUI();
}

// ── CONFIRM / EXECUTE ──
function openConfirm() {
  document.getElementById('sheetOverlay').classList.add('active');
  document.getElementById('confirmSheet').classList.add('active');
}
function closeConfirm() {
  document.getElementById('sheetOverlay').classList.remove('active');
  document.getElementById('confirmSheet').classList.remove('active');
}

function executeSwap() {
  closeConfirm();
  // Show loading state on button
  const btn = document.getElementById('swapBtn');
  btn.classList.add('loading');
  btn.textContent = 'Not connected — previewing…';

  setTimeout(() => {
    const input = document.getElementById('fromAmount').value;
    const out = document.getElementById('outputAmount').textContent;
    logSwap(fromToken.symbol, input, toToken.symbol, out);
    document.getElementById('successTitle').textContent = 'Preview only — not a real swap';
    document.getElementById('successSub').textContent = `${input} ${fromToken.symbol} → ${out} ${toToken.symbol} (illustrative)\nNo tokens actually moved — SovSwap isn't connected to a live Solana DEX yet.`;
    document.getElementById('successTx').textContent = 'no real transaction';
    document.getElementById('successOverlay').classList.add('active');
    btn.classList.remove('loading');
    btn.textContent = 'Swap ' + fromToken.symbol + ' → ' + toToken.symbol;
    // Reset
    document.getElementById('fromAmount').value = '';
    calcOutput();
  }, 1200);
}

function closeSuccess() {
  document.getElementById('successOverlay').classList.remove('active');
}


// ── NAV ──
function navTap(el, label) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  const msgs = { Home:'🏠 Home dashboard', Earn:'⚡ Your income streams', PAG:'🤖 Personal AI Guardian' };
  if (msgs[label]) showToast(msgs[label]);
}

// ── TOAST ──
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ── RESIZE CHART ──
window.addEventListener('resize', () => drawChart());

/* ═══════════════════════════════════════════════════════
   GOD MODE JS — dex-swap.html
═══════════════════════════════════════════════════════ */

// Feature 1: Market / Limit / DCA mode toggle
let swapMode = 'market';
let tifValue = '1h';

function setSwapMode(mode) {
  swapMode = mode;
  ['market','limit','dca'].forEach(function(m) {
    const el = document.getElementById('mode' + m.charAt(0).toUpperCase() + m.slice(1));
    if (el) el.classList.toggle('active', m === mode);
  });
  const limitPanel = document.getElementById('limitPanel');
  const swapCard   = document.querySelector('.swap-card');
  const swapBtn    = document.getElementById('swapBtn');
  if (mode === 'limit') {
    if (limitPanel) limitPanel.style.display = 'block';
    if (swapCard)   swapCard.style.display   = 'none';
    if (swapBtn)    swapBtn.style.display     = 'none';
    updateLimitPreview();
  } else if (mode === 'dca') {
    if (limitPanel) limitPanel.style.display = 'none';
    if (swapCard)   swapCard.style.display   = '';
    if (swapBtn)    swapBtn.style.display     = '';
    showToast('DCA (Dollar Cost Average) — coming in v1.1');
    setTimeout(function() { setSwapMode('market'); }, 1500);
  } else {
    if (limitPanel) limitPanel.style.display = 'none';
    if (swapCard)   swapCard.style.display   = '';
    if (swapBtn)    swapBtn.style.display     = '';
  }
}

function setTIF(chip, val) {
  document.querySelectorAll('.tif-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  tifValue = val;
}

function updateLimitPreview() {
  const target = parseFloat(document.getElementById('limitPrice').value) || 0;
  const preview = document.getElementById('limitPreview');
  const pair    = document.getElementById('limitPair');
  if (!preview || !pair) return;
  pair.textContent = toToken.symbol + ' per ' + fromToken.symbol;
  if (target <= 0) {
    preview.textContent = 'Set a target price to auto-execute your swap';
    preview.style.color = 'var(--text-muted)';
    return;
  }
  const currentRate = fromToken.price / toToken.price;
  const pctDiff = ((target - currentRate) / currentRate * 100).toFixed(1);
  const dir = target > currentRate ? 'above' : 'below';
  preview.textContent = `Execute when rate hits ${target.toFixed(4)} (${Math.abs(pctDiff)}% ${dir} current ${currentRate.toFixed(4)})`;
  preview.style.color = target > currentRate ? 'var(--green)' : '#FFB800';
}

function submitLimitOrder() {
  const target = parseFloat(document.getElementById('limitPrice').value) || 0;
  if (target <= 0) { showToast('Enter a target price'); return; }
  let orders = JSON.parse(localStorage.getItem('indx_limit_orders') || '[]');
  orders.unshift({ from: fromToken.symbol, to: toToken.symbol, targetPrice: target, tif: tifValue, ts: Date.now() });
  localStorage.setItem('indx_limit_orders', JSON.stringify(orders.slice(0, 10)));
  setSwapMode('market');
  showToast('⚡ Saved as a preview · ' + fromToken.symbol + ' → ' + toToken.symbol + ' @ ' + target.toFixed(4) + ' · no real order-book monitoring exists yet');
}

// Feature 2: Fee Savings Counter (accumulates per swap)
const SAVINGS_KEY = 'indx_fee_savings';
function getSavings() { return parseFloat(localStorage.getItem(SAVINGS_KEY) || '0'); }
function addSavings(usdIn) {
  // IN$DEX charges 2%; Coinbase avg 2.75% → we save 0.75% of trade value
  const saved = getSavings() + usdIn * 0.0075;
  localStorage.setItem(SAVINGS_KEY, saved.toFixed(4));
  updateSavingsBanner(saved);
}
function updateSavingsBanner(val) {
  const el = document.getElementById('savingsVal');
  if (el) el.textContent = '$' + (val || getSavings()).toFixed(2);
}
// GOD MODE PATCH — patch executeSwap to track savings
const _origExecuteSwap = window.executeSwap;
window.executeSwap = function() {
  const input  = parseFloat(document.getElementById('fromAmount').value) || 0;
  const usdIn  = input * fromToken.price;
  if (usdIn > 0) addSavings(usdIn);
  _origExecuteSwap();
};
// Init on load — merged into direct call (DCL already fired above at line 1117)
updateSavingsBanner();

// Feature 3: Cybertron hex canvas
(function initSwapCanvas() {
  const canvas = document.getElementById('cyberCanvasSwap');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const COLS = ['rgba(0,212,255,','rgba(43,53,216,','rgba(139,63,232,'];
  const FRAME_MS = 1000/22;
  let pts = [];
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize, {passive:true});
  for (let i = 0; i < 22; i++) {
    pts.push({ x:Math.random()*innerWidth, y:Math.random()*innerHeight,
      vx:(Math.random()-0.5)*0.42, vy:(Math.random()-0.5)*0.42,
      r:4+Math.random()*8, phase:Math.random()*Math.PI*2,
      c:COLS[Math.floor(Math.random()*COLS.length)], op:0.04+Math.random()*0.055 });
  }
  function hex(cx,cy,r){ ctx.beginPath(); for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/6; i?ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a)):ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a));} ctx.closePath(); }
  let lastT=0;
  function loop(t){
    if(t-lastT<FRAME_MS){requestAnimationFrame(loop);return;} lastT=t;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pts.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.phase+=0.02;
      if(p.x<-20)p.x=canvas.width+20; if(p.x>canvas.width+20)p.x=-20;
      if(p.y<-20)p.y=canvas.height+20; if(p.y>canvas.height+20)p.y=-20; });
    for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
      const dx=pts[j].x-pts[i].x, dy=pts[j].y-pts[i].y, d=Math.sqrt(dx*dx+dy*dy);
      if(d<120){ ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y);
        ctx.strokeStyle=pts[i].c+(0.04*(1-d/120)).toFixed(3)+')'; ctx.lineWidth=0.6; ctx.stroke(); }
    }
    pts.forEach(p=>{
      const op=p.op*(0.62+0.38*Math.sin(p.phase));
      hex(p.x,p.y,p.r); ctx.fillStyle=p.c+op.toFixed(3)+')'; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x,p.y,1.5,0,Math.PI*2); ctx.fillStyle=p.c+'0.8)'; ctx.fill();
    });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

/* ═══════════════════════════════════════════════════════
   GOD MODE ROUND 2 JS — dex-swap.html
═══════════════════════════════════════════════════════ */

// Feature R2-1: Quote expiry countdown
const QUOTE_DURATION = 30;
let _qtInterval = null;
let _qtRemaining = QUOTE_DURATION;

function startQuoteTimer() {
  const timerEl = document.getElementById('quoteTimer');
  const barEl   = document.getElementById('qtBar');
  const countEl = document.getElementById('qtCount');
  if (!timerEl) return;
  clearInterval(_qtInterval);
  _qtRemaining = QUOTE_DURATION;
  timerEl.classList.add('show');
  barEl.style.width = '100%';
  barEl.className = 'qt-bar';
  countEl.className = 'qt-count';
  _qtInterval = setInterval(function() {
    _qtRemaining--;
    const pct = (_qtRemaining / QUOTE_DURATION) * 100;
    barEl.style.width = pct + '%';
    countEl.textContent = _qtRemaining + 's';
    const urgent = _qtRemaining <= 10 && _qtRemaining > 5;
    const danger  = _qtRemaining <= 5;
    barEl.className  = 'qt-bar'  + (danger ? ' danger' : urgent ? ' urgent' : '');
    countEl.className = 'qt-count' + (danger ? ' danger' : urgent ? ' urgent' : '');
    if (_qtRemaining <= 0) {
      calcOutput();
      _qtRemaining = QUOTE_DURATION;
      barEl.style.width = '100%';
      barEl.className = 'qt-bar';
      countEl.className = 'qt-count';
    }
  }, 1000);
}

function stopQuoteTimer() {
  clearInterval(_qtInterval);
  const timerEl = document.getElementById('quoteTimer');
  if (timerEl) timerEl.classList.remove('show');
}

// GOD MODE PATCH — wrap calcOutput to control timer
const _origCalcOutput = window.calcOutput;
window.calcOutput = function() {
  _origCalcOutput.call(this);
  const input = parseFloat(document.getElementById('fromAmount').value);
  if (input && input > 0) {
    if (!document.getElementById('quoteTimer').classList.contains('show')) {
      startQuoteTimer();
    }
  } else {
    stopQuoteTimer();
  }
};

// Feature R2-2: Quick amount chips
function setQuickAmt(pct) {
  const bal = parseFloat(fromToken.balance) || 0;
  const raw = bal * pct;
  document.getElementById('fromAmount').value = raw % 1 === 0 ? raw : parseFloat(raw.toFixed(6));
  const chips = document.querySelectorAll('.qa-chip');
  chips.forEach(c => c.classList.remove('flash'));
  const idx = [0.25, 0.50, 0.75, 1.00].indexOf(pct);
  if (chips[idx]) {
    chips[idx].classList.add('flash');
    setTimeout(function() { chips[idx].classList.remove('flash'); }, 420);
  }
  calcOutput();
}

// Feature R2-4: Confetti burst on swap success
function launchConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  const overlay = document.getElementById('successOverlay');
  if (!canvas || !overlay) return;
  canvas.width  = overlay.offsetWidth  || 375;
  canvas.height = overlay.offsetHeight || 600;
  const ctx = canvas.getContext('2d');
  const COLS = ['#00D4FF','#8B3FE8','#00E5A0','#FFB800','#FF4D6D','#ffffff','#2B35D8'];
  const particles = Array.from({length: 90}, function() {
    return {
      x: canvas.width * 0.5 + (Math.random() - 0.5) * 80,
      y: canvas.height * 0.30,
      vx: (Math.random() - 0.5) * 11,
      vy: -(Math.random() * 9 + 3),
      r: 4 + Math.random() * 6,
      color: COLS[Math.floor(Math.random() * COLS.length)],
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.36,
      gravity: 0.30,
      life: 1,
      decay: 0.010 + Math.random() * 0.012,
      shape: Math.random() > 0.5 ? 'rect' : 'circle'
    };
  });
  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach(function(p) {
      if (p.life <= 0) return;
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.spin;
      p.life -= p.decay;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      if (p.shape === 'rect') {
        ctx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r);
      } else {
        ctx.beginPath(); ctx.arc(0, 0, p.r * 0.6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    });
    if (alive) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  requestAnimationFrame(frame);
}

// GOD MODE PATCH — chain executeSwap to fire confetti
const _origExecSwapR2 = window.executeSwap;
window.executeSwap = function() {
  _origExecSwapR2.call(this);
  setTimeout(launchConfetti, 1900);
};

/* ═══════════════════════════════════════════════════════
   GOD MODE R3 JS — dex-swap.html
═══════════════════════════════════════════════════════ */

// Feature R3-1: DCA Mode full implementation
let dcaFreq = 'daily';

// GOD MODE PATCH — replace DCA toast with real panel
var _origSetSwapMode = window.setSwapMode;
window.setSwapMode = function(mode) {
  if (mode === 'dca') {
    // Update chips
    ['market','limit','dca'].forEach(function(m) {
      var el = document.getElementById('mode' + m.charAt(0).toUpperCase() + m.slice(1));
      if (el) el.classList.toggle('active', m === mode);
    });
    // Hide swap card and button, show DCA panel
    var swapCard = document.querySelector('.swap-card');
    var swapBtn  = document.getElementById('swapBtn');
    var limitPanel = document.getElementById('limitPanel');
    var dcaPanel   = document.getElementById('dcaPanel');
    if (swapCard)   swapCard.style.display = 'none';
    if (swapBtn)    swapBtn.style.display  = 'none';
    if (limitPanel) limitPanel.style.display = 'none';
    if (dcaPanel)   dcaPanel.classList.add('show');
    updateDCASummary();
    return; // do NOT call _origSetSwapMode — it would show "coming" toast
  }
  // Hide DCA panel when switching away
  var dcaPanel = document.getElementById('dcaPanel');
  if (dcaPanel) dcaPanel.classList.remove('show');
  _origSetSwapMode(mode);
};

function setDCAFreq(chip, freq) {
  document.querySelectorAll('.dca-freq-chip').forEach(function(c) { c.classList.remove('active'); });
  chip.classList.add('active');
  dcaFreq = freq;
  updateDCASummary();
}

function updateDCASummary() {
  const amt    = parseFloat(document.getElementById('dcaAmount').value) || 0;
  const orders = parseInt(document.getElementById('dcaOrders').value)   || 0;
  const sumEl  = document.getElementById('dcaSummary');
  if (!sumEl) return;
  if (!amt || !orders) {
    sumEl.innerHTML = 'Enter an amount and order count to preview your DCA plan.';
    return;
  }
  const total    = (amt * orders).toFixed(2);
  const outTotal = ((amt * orders * fromToken.price) / toToken.price * 0.98).toFixed(2);
  const freqLabel = { daily:'day', weekly:'week', monthly:'month' }[dcaFreq] || 'day';
  sumEl.innerHTML = `Buy <strong>${amt} ${fromToken.symbol}</strong> every <strong>${freqLabel}</strong> for <strong>${orders} orders</strong>.<br>Total spend: <strong>$${total}</strong> · Est. receive: <strong>≈${outTotal} ${toToken.symbol}</strong>.`;
}

function submitDCAOrder() {
  const amt    = parseFloat(document.getElementById('dcaAmount').value) || 0;
  const orders = parseInt(document.getElementById('dcaOrders').value)   || 0;
  if (!amt || amt <= 0) { showToast('Enter an amount per buy'); return; }
  if (!orders || orders < 2) { showToast('Enter at least 2 orders'); return; }
  let dcaPlans = JSON.parse(localStorage.getItem('indx_dca_plans') || '[]');
  dcaPlans.unshift({ from: fromToken.symbol, to: toToken.symbol, amt, orders, freq: dcaFreq, ts: Date.now(), active: false });
  localStorage.setItem('indx_dca_plans', JSON.stringify(dcaPlans.slice(0, 5)));
  setSwapMode('market');
  showToast('📅 Saved as a preview · ' + fromToken.symbol + ' → ' + toToken.symbol + ' · not actually executing yet');
}

// Feature R3-2: Animated swap progress stepper
function showSwapProgress() {
  const el = document.getElementById('swapProgress');
  if (!el) return;
  // Reset all
  for (let i = 0; i < 3; i++) {
    const dot = document.getElementById('spDot' + i);
    const lbl = document.getElementById('spLbl' + i);
    if (dot) { dot.className = 'sp-dot'; }
    if (lbl) { lbl.className = 'sp-label'; }
  }
  for (let i = 0; i < 2; i++) {
    const ln = document.getElementById('spLine' + i);
    if (ln) ln.className = 'sp-line';
  }
  el.classList.add('show');
  // Animate: step 0 at 0ms, step 1 at 600ms, step 2 at 1200ms
  function activateStep(idx) {
    var dot = document.getElementById('spDot' + idx);
    var lbl = document.getElementById('spLbl' + idx);
    if (dot) dot.className = 'sp-dot active';
    if (lbl) lbl.className = 'sp-label active';
    if (idx > 0) {
      var prevDot = document.getElementById('spDot' + (idx-1));
      var prevLbl = document.getElementById('spLbl' + (idx-1));
      var prevLine = document.getElementById('spLine' + (idx-1));
      if (prevDot) prevDot.className = 'sp-dot done';
      if (prevLbl) prevLbl.className = 'sp-label done';
      if (prevLine) prevLine.className = 'sp-line done';
    }
  }
  activateStep(0);
  setTimeout(function() { activateStep(1); }, 600);
  setTimeout(function() { activateStep(2); }, 1200);
}

function hideSwapProgress() {
  var el = document.getElementById('swapProgress');
  if (el) el.classList.remove('show');
}

// GOD MODE PATCH — add progress stepper to executeSwap
var _origExecSwapR3 = window.executeSwap;
window.executeSwap = function() {
  closeConfirm();
  showSwapProgress();
  var btn = document.getElementById('swapBtn');
  if (btn) { btn.classList.add('loading'); btn.textContent = 'Not connected — previewing…'; }
  var input = document.getElementById('fromAmount').value;
  var out   = document.getElementById('outputAmount').textContent;
  setTimeout(function() {
    hideSwapProgress();
    logSwap(fromToken.symbol, input, toToken.symbol, out);
    document.getElementById('successTitle').textContent = 'Preview only — not a real swap';
    document.getElementById('successSub').textContent = input + ' ' + fromToken.symbol + ' → ' + out + ' ' + toToken.symbol + ' (illustrative)\nNo tokens actually moved — SovSwap isn\'t connected to a live Solana DEX yet.';
    document.getElementById('successTx').textContent = 'no real transaction';
    document.getElementById('successOverlay').classList.add('active');
    if (btn) { btn.classList.remove('loading'); btn.textContent = 'Swap ' + fromToken.symbol + ' → ' + toToken.symbol; }
    document.getElementById('fromAmount').value = '';
    calcOutput();
  }, 1200);
};

// Feature R3-3: Gas reserve warning
const GAS_RESERVE_SOL = 0.005;
function checkGasReserve() {
  const warn = document.getElementById('gasWarn');
  if (!warn) return;
  if (fromToken.symbol !== 'SOL') { warn.classList.remove('show'); return; }
  const amt = parseFloat(document.getElementById('fromAmount').value) || 0;
  const bal = parseFloat(fromToken.balance) || 0;
  if (amt > 0 && (bal - amt) < GAS_RESERVE_SOL) {
    warn.classList.add('show');
  } else {
    warn.classList.remove('show');
  }
}

// GOD MODE PATCH — append gas check to calcOutput
var _origCalcOutputR3 = window.calcOutput;
window.calcOutput = function() {
  _origCalcOutputR3.call(this);
  checkGasReserve();
};

// Feature R3-4: Pair quick-pins
const PINS_KEY = 'indx_swap_pins';
const DEFAULT_PINS = [
  { from:'SOL',  to:'INDX' },
  { from:'USDC', to:'INDX' },
  { from:'SOL',  to:'USDC' },
];

function getSavedPins() {
  try { return JSON.parse(localStorage.getItem(PINS_KEY)) || DEFAULT_PINS; }
  catch(e) { return DEFAULT_PINS; }
}

function renderPairPins() {
  const container = document.getElementById('pairPins');
  if (!container) return;
  const pins = getSavedPins();
  const isActivePin = (p) => p.from === fromToken.symbol && p.to === toToken.symbol;
  let html = pins.map(function(p) {
    const active = isActivePin(p) ? ' active' : '';
    return `<div class="pin-chip${active}" data-action="h_4" data-args="${JSON.stringify(["$event",p.from,p.to]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">⚡ ${p.from}→${p.to}</div>`;
  }).join('');
  // Add current pair pin button if not already pinned
  const alreadyPinned = pins.some(isActivePin);
  if (!alreadyPinned) {
    html += `<div class="pin-chip pin-add" data-action="addCurrentPairPin" title="Pin this pair">＋ Pin ${fromToken.symbol}→${toToken.symbol}</div>`;
  }
  container.innerHTML = html;
}

function loadPairPin(fromSym, toSym) {
  const fTok = TOKENS.find(t => t.symbol === fromSym);
  const tTok = TOKENS.find(t => t.symbol === toSym);
  if (!fTok || !tTok || fTok === tTok) return;
  fromToken = fTok;
  toToken   = tTok;
  document.getElementById('fromAmount').value = '';
  updateUI();
  renderPairPins();
}

function addCurrentPairPin() {
  const pins = getSavedPins();
  if (pins.length >= 5) { showToast('Max 5 pinned pairs — remove one first'); return; }
  if (fromToken.symbol === toToken.symbol) return;
  pins.push({ from: fromToken.symbol, to: toToken.symbol });
  localStorage.setItem(PINS_KEY, JSON.stringify(pins));
  renderPairPins();
  showToast('📌 Pinned ' + fromToken.symbol + ' → ' + toToken.symbol);
}

// Refresh pins after token selection
var _origUpdateUI = window.updateUI;
window.updateUI = function() {
  _origUpdateUI.call(this);
  renderPairPins();
};

// renderPairPins() now runs from initDexSwap() above — no separate listener here.

// Feature 4: 24h market stats strip
// INDX price is facts-fixed at $0.24 USD (no LP is seeded yet, so there is no live market price to
// simulate) — do not animate or nudge it. SOL price/volume/liquidity figures are reference values only.
(function initStatsTicker() {
  const priceEl = document.getElementById('indxStatPrice');
  const chgEl   = document.getElementById('indxStatChg');
  const volEl   = document.getElementById('statVol');
  if (priceEl) priceEl.textContent = '$0.24';
  if (chgEl) { chgEl.textContent = 'Fixed — no LP yet'; chgEl.className = 'stat-chg'; chgEl.style.color = 'var(--text-muted)'; }
  if (volEl) volEl.textContent = 'n/a';
})();

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { this.style.display='none'; }
function h_2(event, __p0) { selectToken(String(__p0)); }
function h_3(event, __p0) { toggleFav(String(__p0), event); }
function h_4(event, __p0, __p1) { loadPairPin(String(__p0),String(__p1)); }


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
    }, true); })(EV.error);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, false); })(EV.click);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, false); })(EV.input);
  // Images that failed before this script ran miss the native error event: replay it once.
  document.querySelectorAll('img[data-error-action]').forEach(function (img) { if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) img.dispatchEvent(new Event('error')); });
})();
