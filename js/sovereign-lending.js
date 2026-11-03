
const SUPABASE_URL     = 'https://zljgthfzbalsunuoohcd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const INDX_PRICE = 0.24;
// Corrected 2026-07-25: fallback defaults were fabricated (11.2% APY, 2,847,500 INDX pool) — the
// lending-pool-stats edge function itself is real (queries the real lending_positions table, real
// kink interest-rate model, real Pyth SOL/USD price), so it's honest to default to 0 while it loads
// rather than showing invented numbers pre-fetch.
let APY = 0;
let poolTotalDeposited = 0;

const EDGE_FN_URL = 'https://zljgthfzbalsunuoohcd.supabase.co/functions/v1/lending-pool-stats';

async function fetchPoolStats() {
  try {
    const res = await fetch(EDGE_FN_URL);
    if (!res.ok) return;
    const json = await res.json();
    const pool = json.pool;
    if (!pool) return;

    // Update live APY for yield calculations
    APY = pool.deposit_apy / 100;
    const borrowAPR = pool.borrow_apr / 100;
    const util = pool.utilisation_pct;
    poolTotalDeposited = pool.total_deposited || poolTotalDeposited;

    // Hero
    document.getElementById('heroApy').textContent = pool.deposit_apy.toFixed(1) + '%';
    document.getElementById('heroUtil').textContent = util.toFixed(1) + '%';

    // Hero stats
    const poolSizeM = (poolTotalDeposited / 1e6).toFixed(2);
    document.getElementById('statPool').textContent = poolSizeM + 'M';
    document.getElementById('statDepositors').textContent = pool.depositors.toLocaleString();

    // Utilisation bar + header
    document.getElementById('utilFill').style.width = Math.min(util, 100) + '%';
    document.getElementById('utilHeader').textContent = util.toFixed(1) + '% — ' + (util >= 90 ? 'Critical' : util >= 67 ? 'High' : util >= 40 ? 'Medium' : 'Low');

    // Pool stats section
    const available = poolTotalDeposited - pool.total_borrowed;
    document.getElementById('psSizeVal').textContent = poolTotalDeposited.toLocaleString(undefined, {maximumFractionDigits:0}) + ' INDX';
    document.getElementById('psBorrowedVal').textContent = pool.total_borrowed.toLocaleString(undefined, {maximumFractionDigits:0}) + ' INDX';
    document.getElementById('psAvailVal').textContent = available.toLocaleString(undefined, {maximumFractionDigits:0}) + ' INDX';
    document.getElementById('psUtilVal').textContent = util.toFixed(1) + '%';
    document.getElementById('psAprVal').textContent = borrowAPR.toFixed(1) + '%';

    // Confirm sheet APY
    document.getElementById('confirmSheetApy').textContent = pool.deposit_apy.toFixed(1) + '%';

    // Hero APY sub
    document.getElementById('heroApySub').innerHTML = 'Pool utilisation: <span>' + util.toFixed(1) + '%</span> — ' + (util >= 67 ? 'High demand → Higher yield' : 'Growing pool — earn as it fills');
  } catch (e) {
    console.warn('fetchPoolStats failed (using defaults):', e);
  }
}

const citizenId      = sessionStorage.getItem('citizen_id');
const citizenBalance = parseFloat(sessionStorage.getItem('citizen_balance') || '0');
const depositInput   = document.getElementById('depositInput');
const withdrawInput  = document.getElementById('withdrawInput');

let myDeposit    = 0;
let myPositionId = null;
let totalEarned  = 0;

async function init() {
  document.getElementById('balanceDisplay').textContent = citizenBalance.toLocaleString(undefined, {maximumFractionDigits: 2});

  // Fetch live pool stats first (non-blocking — updates UI once resolved)
  fetchPoolStats();

  if (citizenId) {
    await loadPositions();
  } else {
    updatePositionCard();
  }
}

async function loadPositions() {
  try {
    const { data, error } = await sb.rpc('get_lending_positions', { p_citizen_id: citizenId });
    if (error) throw error;

    const deposits = data.deposits || [];
    const activeDeposit = deposits.find(d => d.status === 'active');

    if (activeDeposit) {
      myDeposit    = parseFloat(activeDeposit.indx_amount);
      myPositionId = activeDeposit.id;
      totalEarned  = parseFloat(activeDeposit.interest_accrued || 0);
    }
    document.getElementById('withdrawDepositDisplay').textContent = myDeposit.toLocaleString(undefined, {maximumFractionDigits: 2});
    updatePositionCard();
  } catch (e) {
    console.error('loadPositions:', e);
    updatePositionCard();
  }
}

function updatePositionCard() {
  if (myDeposit > 0) {
    document.getElementById('emptyPosition').style.display = 'none';
    document.getElementById('activePosition').style.display = 'flex';
    document.getElementById('positionBadge').style.display = 'block';
    const todayYield = myDeposit * APY / 365;
    document.getElementById('posDeposit').textContent = myDeposit.toLocaleString(undefined, {maximumFractionDigits: 2}) + ' INDX';
    document.getElementById('posToday').textContent = '+' + todayYield.toFixed(4) + ' INDX (~$' + (todayYield * INDX_PRICE).toFixed(2) + ')';
    document.getElementById('posTotal').textContent = '+' + totalEarned.toFixed(6) + ' INDX';
    // Corrected 2026-07-25: was hardcoded to the fake 2,847,500 pool size instead of the live
    // poolTotalDeposited value fetched from the real edge function above.
    const share = poolTotalDeposited > 0 ? (myDeposit / poolTotalDeposited * 100).toFixed(4) : '0.0000';
    document.getElementById('posShare').textContent = share + '% of pool';
  } else {
    document.getElementById('emptyPosition').style.display = 'block';
    document.getElementById('activePosition').style.display = 'none';
    document.getElementById('positionBadge').style.display = 'none';
  }
}

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach((t,i) => t.classList.toggle('active', (tab==='deposit' && i===0) || (tab==='withdraw' && i===1)));
  document.getElementById('panelDeposit').classList.toggle('active', tab==='deposit');
  document.getElementById('panelWithdraw').classList.toggle('active', tab==='withdraw');
}

function onDepositInput() {
  const val = parseFloat(depositInput.value) || 0;
  document.getElementById('depositUsd').textContent = '≈ $' + (val * INDX_PRICE).toFixed(2) + ' USD';
  document.getElementById('depositBtn').disabled = val <= 0 || val > citizenBalance;
  if (val > 0) {
    const daily = val * APY / 365;
    const monthly = daily * 30;
    const yearly = val * APY;
    document.getElementById('previewDaily').textContent = '+' + daily.toFixed(4) + ' INDX (~$' + (daily * INDX_PRICE).toFixed(2) + ')';
    document.getElementById('previewMonthly').textContent = '+' + monthly.toFixed(2) + ' INDX (~$' + (monthly * INDX_PRICE).toFixed(2) + ')';
    document.getElementById('previewYearly').textContent = '+' + yearly.toFixed(2) + ' INDX (~$' + (yearly * INDX_PRICE).toFixed(2) + ')';
    document.getElementById('yieldPreview').style.display = 'block';
  } else {
    document.getElementById('yieldPreview').style.display = 'none';
  }
}

function onWithdrawInput() {
  const val = parseFloat(withdrawInput.value) || 0;
  document.getElementById('withdrawUsd').textContent = '≈ $' + (val * INDX_PRICE).toFixed(2) + ' USD';
  document.getElementById('withdrawBtn').disabled = val <= 0 || val > myDeposit;
}

function useMax() { depositInput.value = citizenBalance; onDepositInput(); }
function useMaxWithdraw() { withdrawInput.value = myDeposit; onWithdrawInput(); }

function setAmount(n) {
  depositInput.value = n; onDepositInput();
  document.querySelectorAll('.quick .qa').forEach(q => q.classList.toggle('sel', parseInt(q.textContent.replace(',','')) === n));
}

function setWithdraw(pct) {
  withdrawInput.value = (myDeposit * pct / 100).toFixed(2); onWithdrawInput();
}

function openDepositSheet() {
  const val = parseFloat(depositInput.value) || 0;
  document.getElementById('confirmAmt').textContent = val.toLocaleString() + ' INDX (~$' + (val * INDX_PRICE).toFixed(2) + ')';
  document.getElementById('confirmDaily').textContent = '+' + (val * APY / 365).toFixed(4) + ' INDX';
  document.getElementById('depositOverlay').classList.add('show');
  document.getElementById('depositSheet').classList.add('show');
}

function openWithdrawSheet() {
  const val = parseFloat(withdrawInput.value) || 0;
  document.getElementById('confirmWithdrawAmt').textContent = val.toLocaleString() + ' INDX (~$' + (val * INDX_PRICE).toFixed(2) + ')';
  document.getElementById('confirmWithdrawYield').textContent = '+' + (myDeposit * APY / 365).toFixed(4) + ' INDX (kept)';
  document.getElementById('withdrawOverlay').classList.add('show');
  document.getElementById('withdrawSheet').classList.add('show');
}

function closeSheets() {
  document.querySelectorAll('.overlay, .sheet').forEach(el => el.classList.remove('show'));
}

// Approval Gateway: deposit_to_pool/withdraw_from_pool are risk_class >= 3 in agent_registry,
// so a first call can come back {success:false, pending_approval:true, intent_id} instead of
// executing -- check pending_approval specifically, before treating success:false as a real
// rejection. Show what SIINDEX needs approved, then on explicit approve, grant it and retry.
async function resolveGate(intentId, retryFn) {
  let card = null;
  try {
    const { data } = await sb.rpc('get_action_intent_card', { p_intent_id: intentId });
    card = data;
  } catch (e) {}
  document.getElementById('gateText').textContent =
    (card && !card.error && card.data_involved) ? card.data_involved
      : 'This action needs your explicit approval before it can complete.';
  document.getElementById('gateOverlay').classList.add('show');
  document.getElementById('gateSheet').classList.add('show');

  return new Promise((resolve) => {
    document.getElementById('gateApproveBtn').onclick = async function () {
      const gbtn = document.getElementById('gateApproveBtn');
      gbtn.textContent = 'Approving…'; gbtn.disabled = true;
      try {
        const { data: grant } = await sb.rpc('grant_intent_approval', { p_intent_id: intentId, p_level: 1, p_method: 'citizen_app_confirm' });
        if (!grant || !grant.success) throw new Error('Approval could not be recorded.');
        closeSheets();
        const result = await retryFn();
        resolve(result);
      } catch (e) {
        alert(e.message || 'Approval failed. Try again.');
        closeSheets();
        resolve(null);
      } finally {
        gbtn.textContent = 'Approve & Continue'; gbtn.disabled = false;
      }
    };
  });
}

async function confirmDeposit() {
  const val = parseFloat(depositInput.value) || 0;
  const btn = document.getElementById('depositBtn');
  btn.textContent = 'Processing…'; btn.disabled = true;

  try {
    let { data, error } = await sb.rpc('deposit_to_pool', {
      p_citizen_id: citizenId,
      p_amount_indx: val
    });
    if (!error && data && data.pending_approval) {
      data = await resolveGate(data.intent_id, async () => {
        const r = await sb.rpc('deposit_to_pool', { p_citizen_id: citizenId, p_amount_indx: val });
        return r.data;
      });
      if (!data) { btn.textContent = 'Lend INDX →'; btn.disabled = false; return; }
    }
    if (error || !data.success) throw new Error((data && data.error) || (error && error.message));

    // Update sessionStorage balance
    sessionStorage.setItem('citizen_balance', data.new_balance);
    myDeposit += val;
    myPositionId = data.position_id;
    closeSheets();
    document.getElementById('successTitle').textContent = 'Deposit Confirmed!';
    document.getElementById('successSub').textContent = val.toLocaleString() + ' INDX is now in the Sovereign Lending Pool. A real daily job accrues interest starting tonight, paid into your spendable balance when you withdraw.';
    document.getElementById('successOverlay').classList.add('show');
    depositInput.value = '';
    onDepositInput();
    updatePositionCard();
    document.getElementById('withdrawDepositDisplay').textContent = myDeposit.toLocaleString(undefined, {maximumFractionDigits: 2});
  } catch (e) {
    // ACCOUNT_FROZEN is a raw Postgres exception message, not something to show verbatim.
    const msg = (e.message || '').includes('ACCOUNT_FROZEN')
      ? 'Your account is frozen — deposits are blocked. Unfreeze it from Emergency Freeze, or contact support.'
      : 'Deposit failed: ' + e.message;
    alert(msg);
  } finally {
    btn.textContent = 'Lend INDX →'; btn.disabled = false;
  }
}

async function confirmWithdraw() {
  const val = parseFloat(withdrawInput.value) || 0;
  const btn = document.getElementById('withdrawBtn');
  btn.textContent = 'Processing…'; btn.disabled = true;

  if (!myPositionId) {
    alert('No active deposit position found. Please refresh and try again.');
    btn.textContent = 'Withdraw INDX'; btn.disabled = false;
    return;
  }

  try {
    let { data, error } = await sb.rpc('withdraw_from_pool', {
      p_citizen_id:  citizenId,
      p_position_id: myPositionId,
      p_amount_indx: val
    });
    if (!error && data && data.pending_approval) {
      data = await resolveGate(data.intent_id, async () => {
        const r = await sb.rpc('withdraw_from_pool', { p_citizen_id: citizenId, p_position_id: myPositionId, p_amount_indx: val });
        return r.data;
      });
      if (!data) { btn.textContent = 'Withdraw INDX'; btn.disabled = false; return; }
    }
    if (error || !data.success) throw new Error((data && data.error) || (error && error.message));

    // Update sessionStorage balance with returned principal + 98% yield
    const newBal = parseFloat(sessionStorage.getItem('citizen_balance') || '0') + data.total_received;
    sessionStorage.setItem('citizen_balance', newBal.toFixed(6));
    myDeposit = Math.max(0, myDeposit - val);
    if (myDeposit === 0) myPositionId = null;
    closeSheets();
    document.getElementById('successTitle').textContent = 'Withdrawal Complete';
    document.getElementById('successSub').textContent = val.toLocaleString() + ' INDX + ' + parseFloat(data.interest_earned).toFixed(4) + ' INDX yield returned to your wallet.';
    document.getElementById('successOverlay').classList.add('show');
    withdrawInput.value = '';
    onWithdrawInput();
    updatePositionCard();
    document.getElementById('withdrawDepositDisplay').textContent = myDeposit.toLocaleString(undefined, {maximumFractionDigits: 2});
  } catch (e) {
    alert('Withdrawal failed: ' + e.message);
  } finally {
    btn.textContent = 'Withdraw INDX'; btn.disabled = false;
  }
}

function dismissSuccess() { document.getElementById('successOverlay').classList.remove('show'); }

function showInfo() {
  alert('Sovereign Lending lets you earn yield on your INDX tokens. Deposits move real INDX and a real daily job (pg_cron) accrues interest every day — paid into your spendable balance when you withdraw. 98/2 Law: you keep 98% of interest earned, enforced server-side today. Not yet enforced by on-chain smart contract code — this is an internal ledger balance, not custody on Solana. "Powered by MarginFi" was never accurate — there is no MarginFi integration.');
}

// ── RISK BADGE ──
function updateRiskBadge(util) {
  const badge = document.getElementById('riskBadge');
  if (!badge) return;
  if (util < 50) {
    badge.className = 'risk-badge low';
    badge.textContent = '✅ Low Risk · ' + util.toFixed(0) + '% utilised';
  } else if (util < 80) {
    badge.className = 'risk-badge medium';
    badge.textContent = '⚡ Medium Risk · ' + util.toFixed(0) + '% utilised';
  } else {
    badge.className = 'risk-badge high';
    badge.textContent = '🔴 High Demand · ' + util.toFixed(0) + '% utilised';
  }
}

// ── COMPOUND TOGGLE ──
let compoundOn = false;
function toggleCompound() {
  compoundOn = !compoundOn;
  const btn = document.getElementById('compoundToggle');
  btn.classList.toggle('on', compoundOn);
  document.getElementById('compoundSub').textContent = compoundOn
    ? 'Yield auto-reinvested daily — grows faster'
    : 'Yield paid daily to wallet';
  const amt = parseFloat(document.getElementById('depositInput').value) || 0;
  if (amt > 0) recalcProjection(amt);
}

// ── EARNINGS PROJECTION ──
let projHorizonMonths = 1;
function setHorizon(el, n, unit) {
  projHorizonMonths = unit === 'year' ? n * 12 : n;
  document.querySelectorAll('.ph').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  const months = ['month','months'];
  const label = projHorizonMonths === 1 ? '1 month' : projHorizonMonths < 12 ? projHorizonMonths + ' months' : (projHorizonMonths/12) + (projHorizonMonths===12?' year':' years');
  document.getElementById('projEndLabel').textContent = 'Total after ' + label;
  const amt = parseFloat(document.getElementById('depositInput').value) || 0;
  if (amt > 0) recalcProjection(amt);
}

function recalcProjection(amt) {
  const months = projHorizonMonths;
  let total;
  if (compoundOn) {
    // compound monthly
    total = amt * Math.pow(1 + APY/12, months);
  } else {
    total = amt + (amt * APY * months / 12);
  }
  const yield_ = total - amt;
  const pct = Math.min((yield_ / amt) * 100, 100);
  document.getElementById('projPrincipal').textContent = amt.toLocaleString(undefined,{maximumFractionDigits:2}) + ' INDX';
  document.getElementById('projYield').textContent = '+' + yield_.toFixed(2) + ' INDX (~$' + (yield_*INDX_PRICE).toFixed(2) + ')';
  document.getElementById('projTotal').textContent = total.toFixed(2) + ' INDX';
  document.getElementById('projBar').style.width = Math.max(pct, 3) + '%';
  document.getElementById('projResult').style.display = 'block';
}

// ── POSITION HISTORY ──
function renderHistory() {
  const card = document.getElementById('historyCard');
  const list = document.getElementById('historyList');
  // Load from localStorage + add today's yield credit
  let history = JSON.parse(localStorage.getItem('lendingHistory') || '[]');
  // [Fixed 2026-07-27] Previously seeded 3 fake "Yield paid" entries computed
  // from the citizen's current deposit whenever real history was empty —
  // these were never actual recorded payments. Removed per the sitewide
  // simulated-yield-history sweep. Real entries only get added here once a
  // real deposit/withdrawal/yield event is recorded to localStorage elsewhere
  // in this file's flow.
  if (history.length === 0) { card.style.display = 'none'; return; }
  list.innerHTML = history.slice(-5).reverse().map(h =>
    `<div class="hc-item"><div class="hc-left"><div class="hc-type">${h.type}</div><div class="hc-date">${h.date}</div></div><div class="hc-amt">${h.amt}</div></div>`
  ).join('');
  card.style.display = 'block';
}

// Patch onDepositInput to also show compound + projection
const _origOnDepositInput = onDepositInput;
function onDepositInput() {
  _origOnDepositInput();
  const val = parseFloat(document.getElementById('depositInput').value) || 0;
  const compoundRow = document.getElementById('compoundRow');
  const projSection = document.getElementById('projSection');
  if (val > 0) {
    compoundRow.style.display = 'flex';
    projSection.style.display = 'block';
    recalcProjection(val);
  } else {
    compoundRow.style.display = 'none';
    projSection.style.display = 'none';
    document.getElementById('projResult').style.display = 'none';
  }
}

// Patch fetchPoolStats to also update risk badge
const _origFetchPoolStats = fetchPoolStats;
fetchPoolStats = async function() {
  await _origFetchPoolStats();
  // risk badge updated with current util from hero text
  const utilText = document.getElementById('utilHeader').textContent;
  const utilMatch = utilText.match(/^([\d.]+)/);
  if (utilMatch) updateRiskBadge(parseFloat(utilMatch[1]));
};

// Patch updatePositionCard to also render history
const _origUpdatePositionCard = updatePositionCard;
function updatePositionCard() {
  _origUpdatePositionCard();
  if (myDeposit > 0) renderHistory();
}

// ── GOD MODE — CYBERTRON HEX CANVAS ──
(function(){
  const C=document.getElementById('cyberCanvasSL');
  if(!C)return;
  const X=C.getContext('2d');
  const N=22,FRAME_MS=1000/22;
  let W,H,nodes=[],lastT=0;
  function resize(){W=C.width=window.innerWidth;H=C.height=window.innerHeight;nodes=[];for(let i=0;i<N;i++)nodes.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-0.5)*0.36,vy:(Math.random()-0.5)*0.36,r:Math.random()*3+2});}
  function hex(x,y,r){const s=r*1.2;X.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/6;X.lineTo(x+s*Math.cos(a),y+s*Math.sin(a));}X.closePath();}
  function draw(ts){
    if(ts-lastT<FRAME_MS){requestAnimationFrame(draw);return;}lastT=ts;
    X.clearRect(0,0,W,H);
    nodes.forEach(n=>{n.x+=n.vx;n.y+=n.vy;if(n.x<0||n.x>W)n.vx*=-1;if(n.y<0||n.y>H)n.vy*=-1;});
    for(let i=0;i<N;i++)for(let j=i+1;j<N;j++){const dx=nodes[i].x-nodes[j].x,dy=nodes[i].y-nodes[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<140){X.beginPath();X.moveTo(nodes[i].x,nodes[i].y);X.lineTo(nodes[j].x,nodes[j].y);X.strokeStyle='rgba(0,212,255,'+(0.18*(1-d/140))+')';X.lineWidth=0.7;X.stroke();}}
    nodes.forEach(n=>{hex(n.x,n.y,n.r);X.fillStyle='rgba(0,212,255,0.35)';X.fill();X.strokeStyle='rgba(0,212,255,0.6)';X.lineWidth=0.8;X.stroke();});
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize',resize);resize();requestAnimationFrame(draw);
})();

// ── GOD MODE — LIVE YIELD TICKER ──
let _tickerInterval = null;
let _tickerBase = 0;
let _tickerStart = 0;

function startYieldTicker() {
  const ticker = document.getElementById('yieldTicker');
  if (!ticker || myDeposit <= 0) return;
  ticker.style.display = 'block';
  const perSec = myDeposit * APY / 365 / 86400;
  _tickerBase = totalEarned;
  _tickerStart = Date.now();
  if (_tickerInterval) clearInterval(_tickerInterval);
  _tickerInterval = setInterval(function() {
    const elapsed = (Date.now() - _tickerStart) / 1000;
    const current = _tickerBase + perSec * elapsed;
    document.getElementById('tickerCount').textContent = current.toFixed(6);
    document.getElementById('tickerUsd').textContent = '≈ $' + (current * INDX_PRICE).toFixed(4);
  }, 100);
}

function stopYieldTicker() {
  if (_tickerInterval) { clearInterval(_tickerInterval); _tickerInterval = null; }
  const ticker = document.getElementById('yieldTicker');
  if (ticker) ticker.style.display = 'none';
}

// GOD MODE PATCH — updatePositionCard → start yield ticker
updatePositionCard = (function(orig){
  return function() {
    orig();
    if (myDeposit > 0) startYieldTicker(); else stopYieldTicker();
  };
})(updatePositionCard);

// ── GOD MODE — GRAND SYNCHRONICITY VALUE CARD ──
// AUDIT 2026-07-30: was 2.50 — a dated price target written into #syncAtTarget, whose own label reads
// "Total in INDX (no USD forecast)". Residue of the 2026-07-29 $2.50 purge. Now the genesis reference.
const SYNC_TARGET_PRICE = INDX_PRICE;
const SYNC_DATE = new Date('2027-02-24T00:00:00+10:00');

function updateSyncCard(amtINDX) {
  const card = document.getElementById('syncValueCard');
  if (!card) return;
  if (amtINDX <= 0) { card.style.display = 'none'; return; }
  const daysToSync = Math.max(0, (SYNC_DATE - Date.now()) / 86400000);
  const yieldBySync = amtINDX * APY * (daysToSync / 365);
  const totalINDX = amtINDX + yieldBySync;
  document.getElementById('syncAtGenesis').textContent = '$' + (amtINDX * INDX_PRICE).toFixed(2);
  document.getElementById('syncYieldEst').textContent = '+$' + (yieldBySync * INDX_PRICE).toFixed(2) + ' (~' + yieldBySync.toFixed(2) + ' INDX)';
  document.getElementById('syncAtTarget').textContent = '$' + (totalINDX * SYNC_TARGET_PRICE).toFixed(2);
  card.style.display = 'block';
}

// GOD MODE PATCH — deposit input → sync card
document.getElementById('depositInput').addEventListener('input', function() {
  updateSyncCard(parseFloat(this.value) || 0);
});

// Corrected 2026-07-25: this entire feed was fabricated — a canned list of fake deposits,
// withdrawals, and yield events ("Yield paid to 1,247 citizens", "1,200 INDX deposited") randomly
// selected and injected every 8-14 seconds with fake "Xs/Xm ago" timestamps, directly contradicting
// the real pool stats fetched above (which honestly show $0/0 depositors pre-launch). Disabled.
// ── GOD MODE — LIVE POOL ACTIVITY FEED ──
const _AF_EVENTS = [
  {cls:'deposit',icon:'💰',texts:['500 INDX deposited','1,200 INDX deposited','250 INDX deposited','800 INDX deposited','2,000 INDX deposited'],hasAmt:true,color:'green'},
  {cls:'yield',icon:'📈',texts:['Yield distributed to all depositors','Daily yield credited','Yield paid to 1,247 citizens'],hasAmt:false,color:'green'},
  // AUDIT 2026-07-30: the 2026-07-25 fix replaced the fabricated 11.2% fallback constant but left the
  // same figure in this activity-ticker string, in the very file documenting its removal at line 679.
  {cls:'apy',icon:'⚡',texts:['Rate not set — no pool exists yet','Pool not funded','MarginFi integration not connected','SIINDEX pool scan: pre-launch'],hasAmt:false,color:'gold'},
  {cls:'withdraw',icon:'↩️',texts:['120 INDX withdrawn','300 INDX withdrawn','50 INDX withdrawn'],hasAmt:true,color:'red'},
];
let _afLog = [], _afTs = [];

function _afTimeAgo(ms) {
  const s = Math.floor((Date.now() - ms) / 1000);
  return s < 60 ? s + 's ago' : Math.floor(s/60) + 'm ago';
}

function _renderAF() {
  const feed = document.getElementById('activityFeed');
  if (!feed) return;
  feed.innerHTML = _afLog.slice(-6).reverse().map(function(a, i) {
    const idx = _afLog.length - 1 - i;
    return '<div class="af-item">' +
      '<div class="af-icon ' + a.cls + '">' + a.icon + '</div>' +
      '<div class="af-body"><div class="af-text">' + a.text + '</div><div class="af-time">' + _afTimeAgo(_afTs[idx]) + '</div></div>' +
      (a.amt ? '<div class="af-amt ' + a.color + '">' + (a.color === 'red' ? '-' : '+') + a.amt + ' INDX</div>' : '') +
      '</div>';
  }).join('');
}

// ⚠️ DEAD CODE — DO NOT RE-ENABLE (marked 2026-07-30).
// Disabled at the call site on 2026-07-25, but the fix note sat above the _AF_EVENTS array, not here,
// and the string "DEAD CODE" appeared nowhere in this file. Re-enabling ships a Math.random() feed of
// fake deposits, withdrawals and yield payouts against real pool stats reading $0 / 0 depositors.
function _addAFEvent() {
  const ev = _AF_EVENTS[Math.floor(Math.random() * _AF_EVENTS.length)];
  const text = ev.texts[Math.floor(Math.random() * ev.texts.length)];
  const amt = ev.hasAmt ? (Math.floor(Math.random() * 20 + 1) * 50) : null;
  _afLog.push({cls:ev.cls,icon:ev.icon,text,amt,color:ev.color});
  _afTs.push(Date.now());
  if (_afLog.length > 20) { _afLog.shift(); _afTs.shift(); }
  _renderAF();
}

// ⚠️ DEAD CODE — DO NOT RE-ENABLE (marked 2026-07-30). See _addAFEvent above. Seeds a fabricated
// lending activity history, including "Yield paid to 1,247 citizens", for a pool that does not exist.
function seedActivityFeed() {
  const now = Date.now();
  for (let i = 5; i >= 0; i--) {
    const ev = _AF_EVENTS[Math.floor(Math.random() * _AF_EVENTS.length)];
    const text = ev.texts[Math.floor(Math.random() * ev.texts.length)];
    const amt = ev.hasAmt ? (Math.floor(Math.random() * 20 + 1) * 50) : null;
    _afLog.push({cls:ev.cls,icon:ev.icon,text,amt,color:ev.color});
    _afTs.push(now - i * 22000 - Math.random() * 8000);
  }
  _renderAF();
  // Refresh time labels every 30s
  setInterval(_renderAF, 30000);
  // New event every 8-14 seconds
  (function schedule() {
    setTimeout(function() { _addAFEvent(); schedule(); }, 8000 + Math.random() * 6000);
  })();
}

init();
// seedActivityFeed(); — Corrected 2026-07-25: disabled, see comment at _AF_EVENTS above.

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { history.back(); }
function h_2(event) { location.href='citizen-dashboard.html'; }
function h_3(event) { location.href='marketplace.html'; }
function h_4(event) { location.href='staking.html'; }
function h_5(event) { location.href='profile.html'; }


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
