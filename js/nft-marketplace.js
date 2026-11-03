
function switchTab(t){
  ['Browse','Music','Sales','Mine','List'].forEach(id=>{
    document.getElementById('tab'+id).classList.toggle('active',id.toLowerCase()===t);
    document.getElementById('pane'+id).style.display=id.toLowerCase()===t?'block':'none';
  });
}
function setFilter(el,f){
  document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  showToast('Filtering: '+f);
}
const INDX_RATE = 0.24;
const nftData={
  music1:{art:'🎵',bg:'rgba(139,63,232,0.3),rgba(43,53,216,0.2)',name:'Island Breeze Vol.1',issuer:'Sione Tuilagi',type:'Music NFT',floor:'10 INDX',royalty:'🎤 10% royalty on every resale',edition:'82 / 100 remaining',benefits:['🎫 Concert access','💰 Revenue share','🔒 Exclusive content'],artist:{name:'Sione Tuilagi',avatar:'ST',meta:'Tongan artist · 3 NFTs minted'}},
  music2:{art:'🎸',bg:'rgba(255,77,109,0.2),rgba(139,63,232,0.15)',name:'Pacific Roots EP',issuer:'Malo Fono',type:'Music NFT',floor:'25 INDX',royalty:'🎤 15% royalty on every resale',edition:'45 / 200 remaining',benefits:['👕 Merch drops','🔒 Exclusive content','🗳 Fan voting'],artist:{name:'Malo Fono',avatar:'MF',meta:'Samoan artist · 5 NFTs minted'}},
  rwa1:{art:'🏢',bg:'rgba(139,63,232,0.2),rgba(255,184,0,0.08)',name:'Sydney CBD Unit',issuer:'Realty.io',type:'Real World Asset',floor:'4,800 INDX',royalty:'🏠 4.2% annual rental yield',edition:'1 of 1',benefits:['💰 Yield distributions','🗳 DAO governance']},
  art1:{art:'🎨',bg:'rgba(0,212,255,0.15),rgba(43,53,216,0.15)',name:'Coconut Girl #001',issuer:'AJ Henry',type:'Digital Art',floor:'50 INDX',royalty:'🎨 8% royalty on every resale',edition:'1 of 1',benefits:['🌍 Origin story access']},
  event1:{art:'🎟',bg:'rgba(255,184,0,0.15),rgba(255,77,109,0.1)',name:'Pacific Music Fest 2026',issuer:'Citizen Assembly Events',type:'Event Ticket NFT',floor:'100 INDX',royalty:'🎟 10% royalty on ticket resale',edition:'200 / 500 remaining',benefits:['🎫 VIP Entry','🎤 Backstage pass','👕 Festival merch']},
  inv1:{art:'📄',bg:'rgba(43,53,216,0.25),rgba(0,212,255,0.1)',name:'INV-2026-0142',issuer:'8xKL…mN92',type:'Invoice NFT',floor:'40 INDX',royalty:'📄 Tradeable invoice token',edition:'1 of 1',benefits:[]},
  rwa2:{art:'🌾',bg:'rgba(255,77,109,0.1),rgba(255,184,0,0.08)',name:'Farmland Lot #7',issuer:'AgroDAO',type:'Real World Asset',floor:'1,200 INDX',royalty:'🌾 Harvest yield token',edition:'1 of 1',benefits:['💰 Seasonal yield']},
};
function openDetail(id){
  const d=nftData[id];
  const floorNum = parseFloat((d.floor||'').replace(/[^0-9.]/g,'')) || 0;
  document.getElementById('mArt').textContent=d.art;
  document.getElementById('mArt').style.background=`linear-gradient(135deg,${d.bg})`;
  document.getElementById('mName').textContent=d.name;
  document.getElementById('mIssuer').textContent=d.issuer+' · Solana SPL NFT';
  document.getElementById('mType').textContent=d.type;
  document.getElementById('mFloor').textContent=d.floor;
  document.getElementById('mEdition').textContent=d.edition||'';
  document.getElementById('mUsd').textContent='$'+(floorNum*INDX_RATE).toFixed(2);
  document.getElementById('mRoyalty').textContent=d.royalty||'';
  // artist row
  const artistRow=document.getElementById('mArtistRow');
  if(d.artist){artistRow.style.display='flex';document.getElementById('mArtistAvatar').textContent=d.artist.avatar;document.getElementById('mArtistName').textContent=d.artist.name;document.getElementById('mArtistMeta').textContent=d.artist.meta;}
  else{artistRow.style.display='none';}
  // benefits
  const bw=document.getElementById('mBenefitsWrap');
  const bl=document.getElementById('mBenefits');
  bl.innerHTML='';
  if(d.benefits&&d.benefits.length){bw.style.display='block';d.benefits.forEach(b=>{const t=document.createElement('div');t.className='ms-benefit-tag';t.textContent=b;bl.appendChild(t);});}
  else{bw.style.display='none';}
  // buy button
  const buyLabel=d.floor==='Not for sale'?'Soulbound · Not transferable':'Buy · '+d.floor;
  document.getElementById('mBuyBtn').textContent=buyLabel;
  document.getElementById('mBuyBtn').onclick=d.floor==='Not for sale'?()=>showToast('Soulbound cannot be sold'):()=>buyNFT(d.floor);
  document.getElementById('detailModal').classList.add('open');
}
function closeDetail(e){if(e.target===document.getElementById('detailModal'))document.getElementById('detailModal').classList.remove('open');}

// ── BUY NFT ──────────────────────────────────────────────────────────────────
const SUPA_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
const INDX_PRICE = 0.24;

async function buyNFT(priceStr, nftId) {
  document.getElementById('detailModal').classList.remove('open');
  const buyerId = sessionStorage.getItem('citizen_id');
  if (!buyerId) {
    showToast('Log in to buy. Your INDX is waiting.');
    return;
  }
  const indxAmt = parseFloat(String(priceStr).replace(/[^0-9.]/g,'')) || 0;
  const bal = parseFloat(sessionStorage.getItem('citizen_balance') || '0');
  if (bal < indxAmt) {
    showToast('Insufficient balance. Top up your wallet to continue.');
    return;
  }
  if (!nftId) {
    // No real listing behind this card yet (gallery/demo item) — say so
    // honestly instead of faking a purchase. Previously this silently
    // debited the real balance and showed a fake success toast even when
    // there was no real listing id and even on a network error.
    showToast('This piece isn\'t listed for real purchase yet — preview only.');
    return;
  }
  showToast('⏳ Processing purchase…');
  try {
    // FIXED 2026-09 (Approval Gateway audit): use a real session access token when
    // one exists, instead of always sending the anon key -- purchase_listing is
    // authenticated_exec only, so the anon key alone was always rejected.
    let _accessToken = SUPA_KEY;
    try {
      const _sb = window.supabase && window.supabase.createClient
        ? window.supabase.createClient(SUPA_URL, SUPA_KEY)
        : null;
      const { data: _sessionData } = _sb ? await _sb.auth.getSession() : { data: null };
      if (_sessionData && _sessionData.session && _sessionData.session.access_token) {
        _accessToken = _sessionData.session.access_token;
      }
    } catch (_) { /* fall back to anon key -- request will fail cleanly, not silently */ }
    const res = await fetch(`${SUPA_URL}/rest/v1/rpc/purchase_listing`, {
      method: 'POST',
      headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + _accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_buyer_id: buyerId, p_listing_id: nftId })
    });
    const data = await res.json();
    if (data && data.success) {
      const newBal = bal - indxAmt;
      sessionStorage.setItem('citizen_balance', newBal.toFixed(6));
      showToast(`✅ NFT purchased! ${indxAmt} INDX · Seller received ${(indxAmt * 0.98).toFixed(2)} INDX (98%)`);
    } else if (data && data.pending_approval) {
      // FIXED 2026-09 (Approval Gateway audit): purchase_listing's risk_class is
      // filed for elevation but not yet approved (see BUILD_LOG.md) -- a no-op
      // today, future-proofed so no second deploy is needed once it activates.
      showToast('👆 This purchase needs approval first — check Approvals, then try again.');
    } else {
      // Real rejection from the backend (sold, insufficient funds, listing
      // gone, etc.) — show the real reason. Do NOT deduct balance or fake
      // a success toast here; that was the bug.
      // ACCOUNT_FROZEN / CARD_FROZEN are raw error codes, not something to show verbatim.
      const errCode = data?.error || '';
      const msg = errCode === 'ACCOUNT_FROZEN' ? 'Your account is frozen — purchase blocked. Unfreeze it from Emergency Freeze, or contact support.'
        : errCode === 'CARD_FROZEN' ? 'Your card is frozen — this action is blocked.'
        : errCode || 'Could not complete purchase. Try again.';
      showToast(msg);
    }
  } catch(e) {
    showToast('Connection error. Purchase not completed — your balance was not charged.');
  }
}

// ── LIST NFT → route to create-listing ───────────────────────────────────────
function openNFTListSheet() {
  window.location.href = 'create-listing.html?type=nft';
}

function showToast(m){const t=document.getElementById('toast');t.textContent=m;t.style.opacity='1';setTimeout(()=>t.style.opacity='0',2500);}
// init
switchTab('browse');
document.getElementById('paneMusic').style.display='none';

/* ═══════════════════════════════════════════════════════
   GOD MODE JS — nft-marketplace.html
═══════════════════════════════════════════════════════ */
const INDX_PRICE_USD = 0.24;
const WATCH_KEY = 'indx_nft_watch';

// ── Feature 1: Watchlist hearts ─────────────────────────
function getSaved() { return JSON.parse(localStorage.getItem(WATCH_KEY) || '[]'); }
function toggleWatch(nftId, el, e) {
  e.stopPropagation();
  let saved = getSaved();
  const idx = saved.indexOf(nftId);
  if (idx >= 0) { saved.splice(idx,1); el.textContent = '♡'; el.style.color = 'rgba(255,255,255,0.6)'; showToast('Removed from watchlist'); }
  else { saved.push(nftId); el.textContent = '♥'; el.style.color = 'var(--red)'; showToast('❤ Saved to watchlist'); }
  localStorage.setItem(WATCH_KEY, JSON.stringify(saved));
  updateSavedChip();
}
function updateSavedChip() {
  const saved = getSaved();
  const chip = document.getElementById('savedChip');
  if (chip) {
    chip.innerHTML = saved.length > 0
      ? '❤ Saved <span class="saved-badge">' + saved.length + '</span>'
      : '❤ Saved';
  }
}
function initHearts() {
  const arts = document.querySelectorAll('.nft-art');
  const ids = ['music1','music2','rwa1','art1','event1','inv1'];
  arts.forEach(function(art, i) {
    const id = ids[i] || 'nft'+i;
    const saved = getSaved();
    const h = document.createElement('div');
    h.className = 'nft-heart';
    h.textContent = saved.includes(id) ? '♥' : '♡';
    h.style.color = saved.includes(id) ? 'var(--red)' : 'rgba(255,255,255,0.6)';
    h.addEventListener('click', function(e) { toggleWatch(id, h, e); });
    art.appendChild(h);
  });
  updateSavedChip();
}
function showSaved(chip) {
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  const saved = getSaved();
  const grid = document.querySelector('.nft-grid');
  if (!grid) return;
  if (saved.length === 0) { showToast('No saved NFTs yet — tap ♡ on any card'); return; }
  // Show only saved cards: re-render grid filtered
  const all = grid.querySelectorAll('.nft-card');
  const ids = ['music1','music2','rwa1','art1','event1','inv1'];
  all.forEach(function(card, i) { card.style.display = saved.includes(ids[i]) ? '' : 'none'; });
  showToast('Showing ' + saved.length + ' saved NFT' + (saved.length > 1 ? 's' : ''));
}

// ── Feature 2: Make Offer Sheet ────────────────────────
let offerNFTName = 'this NFT';
let offerExpiry = '24h';
function openOfferSheet() {
  const nameEl = document.getElementById('mName');
  const floorEl = document.getElementById('mFloor');
  offerNFTName = nameEl ? nameEl.textContent : 'this NFT';
  const floorVal = floorEl ? floorEl.textContent : '10 INDX';
  const floorNum = parseFloat(floorVal.replace(/[^0-9.]/g,'')) || 0;
  document.getElementById('offerNFTLabel').textContent = offerNFTName;
  document.getElementById('offerFloor').textContent = floorVal + ' · $' + (floorNum * INDX_PRICE_USD).toFixed(2);
  document.getElementById('offerInput').value = '';
  document.getElementById('offerUsd').textContent = '≈ $0.00';
  document.getElementById('offerOverlay').classList.add('open');
  document.getElementById('offerSheet').classList.add('open');
  document.getElementById('detailModal').classList.remove('open');
}
function closeOfferSheet() {
  document.getElementById('offerOverlay').classList.remove('open');
  document.getElementById('offerSheet').classList.remove('open');
}
function updateOfferUsd() {
  const amt = parseFloat(document.getElementById('offerInput').value) || 0;
  document.getElementById('offerUsd').textContent = '≈ $' + (amt * INDX_PRICE_USD).toFixed(2);
}
function setOfferExpiry(chip, val) {
  document.querySelectorAll('.offer-exp-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  offerExpiry = val;
}
// FIX 2026-09-03: was a fake success toast ("✅ Offer sent: X INDX · expires in Y") with no
// fetch/RPC call behind it at all — no offer routine exists anywhere in the DB. Matches the
// honest treatment buyNFT() above already got on 2026-07-25 for the same reason.
function submitOffer() {
  const amt = parseFloat(document.getElementById('offerInput').value) || 0;
  if (amt <= 0) { showToast('Enter an offer amount in INDX'); return; }
  closeOfferSheet();
  showToast('Offers aren\'t live yet — preview only. Nothing was sent.');
}

// FIXED 2026-07-25: this used to inject a fictional NFT "sale" into the LIVE FEED
// every 4 seconds forever (LIVE_ITEMS cycling on a setInterval) so it looked like
// real ongoing marketplace activity. Disabled — no real sales feed to poll yet.
// See gotchas.md.
function initLiveFeed() { /* no-op: no real sales feed connected yet */ }

// FIXED 2026-07-25: was a hardcoded fake "88 INDX" collection value with fake
// item breakdown shown regardless of what the citizen actually owns. Since the
// Mine tab now shows an honest empty state until real ownership data exists,
// this header is disabled rather than showing a fabricated valuation. See gotchas.md.
function injectPortfolioHeader() { /* no-op: no real per-citizen NFT holdings to value yet */ }

// ── Patch switchTab to inject portfolio on Mine activation ──
(function() {
  const orig = window.switchTab;
  window.switchTab = function(t) {
    orig(t);
    if (t === 'mine') injectPortfolioHeader();
  };
})();

// ════════════════════════════════════════════════════════
// GOD MODE ROUND 2 JS — nft-marketplace.html
// ════════════════════════════════════════════════════════

// Feature R2-1: Sort sheet
const SORT_KEY = 'indx_nft_sort';
const NFT_PRICES = { music1:10, music2:25, rwa1:4800, art1:50, event1:100, inv1:40, rwa2:1200 };
const SORT_LABELS = { default:'Recently Listed', low:'Lowest Price', high:'Highest Price', popular:'Most Popular' };

function openSort() {
  document.getElementById('sortOverlay').classList.add('open');
  document.getElementById('sortSheet').classList.add('open');
}
function closeSort() {
  document.getElementById('sortOverlay').classList.remove('open');
  document.getElementById('sortSheet').classList.remove('open');
}
function applySort(type) {
  document.querySelectorAll('.sort-option').forEach(function(o) {
    o.classList.toggle('active', o.dataset.sort === type);
  });
  const grid = document.querySelector('.nft-grid');
  if (grid) {
    const nftIds = ['music1','music2','rwa1','art1','event1','inv1'];
    const cards = Array.from(grid.querySelectorAll('.nft-card'));
    cards.forEach(function(c, i) { c.dataset.price = NFT_PRICES[nftIds[i]] || 0; c.dataset.origIdx = i; });
    let sorted;
    if (type === 'low')     sorted = cards.slice().sort(function(a,b){ return a.dataset.price - b.dataset.price; });
    else if (type === 'high')     sorted = cards.slice().sort(function(a,b){ return b.dataset.price - a.dataset.price; });
    else if (type === 'popular')  sorted = cards.slice().sort(function(a,b){ return (b.dataset.origIdx % 3) - (a.dataset.origIdx % 3) || a.dataset.origIdx - b.dataset.origIdx; });
    else                          sorted = cards.slice().sort(function(a,b){ return a.dataset.origIdx - b.dataset.origIdx; });
    sorted.forEach(function(c) { grid.appendChild(c); });
  }
  localStorage.setItem(SORT_KEY, type);
  const chip = document.getElementById('sortChip');
  if (chip) chip.textContent = type === 'default' ? 'Sort ↕' : SORT_LABELS[type] + ' ↕';
  closeSort();
  showToast('Sorted: ' + (SORT_LABELS[type] || type));
}

// Feature R2-2: Rarity DNA badges
const RARITY_MAP = {
  music1:{rank:'RARE',    cls:'rarity-rare'},
  music2:{rank:'EPIC',    cls:'rarity-epic'},
  rwa1:  {rank:'LEGENDARY',cls:'rarity-legendary'},
  art1:  {rank:'EPIC',    cls:'rarity-epic'},
  event1:{rank:'RARE',    cls:'rarity-rare'},
  inv1:  {rank:'COMMON',  cls:'rarity-common'},
};
function injectRarityBadges() {
  const arts = document.querySelectorAll('.nft-art');
  const ids = ['music1','music2','rwa1','art1','event1','inv1'];
  arts.forEach(function(art, i) {
    if (art.querySelector('.rarity-badge')) return;
    const r = RARITY_MAP[ids[i]] || {rank:'COMMON',cls:'rarity-common'};
    const badge = document.createElement('div');
    badge.className = 'rarity-badge ' + r.cls;
    badge.textContent = r.rank;
    art.appendChild(badge);
  });
}
function showRarityOnModal(id) {
  const r = RARITY_MAP[id] || {rank:'COMMON',cls:'rarity-common'};
  let el = document.getElementById('modalRarityBadge');
  if (!el) {
    el = document.createElement('div');
    el.id = 'modalRarityBadge';
    el.className = 'modal-rarity';
    const nameEl = document.getElementById('mName');
    if (nameEl && nameEl.parentNode) nameEl.parentNode.insertBefore(el, nameEl.nextSibling);
  }
  el.className = 'modal-rarity ' + r.cls;
  el.innerHTML = '★ ' + r.rank;
}

// Feature R2-3: Price sparkline
let _currentDetailId = null;
function drawNFTChart(id) {
  const canvas = document.getElementById('nftPriceChart');
  if (!canvas) return;
  const wrap = document.getElementById('nftChartWrap');
  const W = wrap ? (wrap.offsetWidth || 350) : 350;
  const H = 64;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  const basePrice = NFT_PRICES[id] || 10;
  const seed = id.split('').reduce(function(a,c){ return a + c.charCodeAt(0); }, 0);
  const rng = function(s){ const x = Math.sin(s) * 10000; return x - Math.floor(x); };
  const pts = 30;
  let price = basePrice * 0.82;
  const data = [];
  for (let i = 0; i < pts; i++) {
    price += (rng(seed + i * 7) - 0.47) * basePrice * 0.06;
    price = Math.max(basePrice * 0.5, Math.min(basePrice * 1.65, price));
    data.push(price);
  }
  data[pts - 1] = basePrice;
  const min = Math.min.apply(null, data) * 0.94;
  const max = Math.max.apply(null, data) * 1.06;
  const sx = function(i){ return (i / (pts - 1)) * W; };
  const sy = function(v){ return H - ((v - min) / (max - min)) * (H - 8) - 4; };
  const up = data[pts - 1] >= data[0];
  const lineColor = up ? '#00E5A0' : '#FF4D6D';
  // Fill gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, up ? 'rgba(0,229,160,0.22)' : 'rgba(255,77,109,0.18)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.moveTo(sx(0), sy(data[0]));
  for (let i = 1; i < pts; i++) {
    const cx = (sx(i-1) + sx(i)) / 2;
    ctx.bezierCurveTo(cx, sy(data[i-1]), cx, sy(data[i]), sx(i), sy(data[i]));
  }
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();
  // Line
  ctx.beginPath();
  ctx.moveTo(sx(0), sy(data[0]));
  for (let i = 1; i < pts; i++) {
    const cx = (sx(i-1) + sx(i)) / 2;
    ctx.bezierCurveTo(cx, sy(data[i-1]), cx, sy(data[i]), sx(i), sy(data[i]));
  }
  ctx.strokeStyle = lineColor; ctx.lineWidth = 1.5; ctx.stroke();
  // Dot at current price
  ctx.beginPath();
  ctx.arc(sx(pts-1), sy(data[pts-1]), 3.5, 0, Math.PI * 2);
  ctx.fillStyle = lineColor; ctx.fill();
  // Trend label
  const trend = ((data[pts-1] - data[0]) / data[0] * 100);
  const valEl = document.getElementById('chartPriceVal');
  if (valEl) {
    valEl.textContent = (trend >= 0 ? '↑ +' : '↓ ') + Math.abs(trend).toFixed(1) + '% 30d';
    valEl.className = 'chart-price-val ' + (up ? 'up' : 'dn');
  }
}

// GOD MODE PATCH — wrap openDetail to inject rarity + chart
const _origOpenDetail = window.openDetail;
window.openDetail = function(id) {
  _origOpenDetail(id);
  _currentDetailId = id;
  showRarityOnModal(id);
  setTimeout(function() { drawNFTChart(id); }, 60);
};

// Feature R2-4: Share deep-link
function shareNFT() {
  const id = _currentDetailId;
  if (!id) return;
  const url = window.location.href.split('?')[0] + '?nft=' + id;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(function() {
      showToast('🔗 Link copied — share to invite buyers');
    }).catch(function() { showToast('🔗 ' + url); });
  } else {
    showToast('🔗 ' + url);
  }
  const shares = JSON.parse(localStorage.getItem('indx_nft_shares') || '{}');
  shares[id] = (shares[id] || 0) + 1;
  localStorage.setItem('indx_nft_shares', JSON.stringify(shares));
}

// ── Init ──
document.addEventListener('DOMContentLoaded', function() {
  initHearts();
  initLiveFeed();
  // GOD MODE ROUND 2 INIT
  injectRarityBadges();
  const savedSort = localStorage.getItem(SORT_KEY);
  if (savedSort && savedSort !== 'default') setTimeout(function() { applySort(savedSort); }, 120);
  // Deep-link: auto-open NFT from ?nft= URL param
  const dlNft = new URLSearchParams(window.location.search).get('nft');
  if (dlNft && nftData[dlNft]) setTimeout(function() { openDetail(dlNft); }, 450);
});

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { history.back(); }
function h_2(event) { event.stopPropagation();buyNFT('10 INDX'); }
function h_3(event) { event.stopPropagation();buyNFT('25 INDX'); }
function h_4(event) { event.stopPropagation();buyNFT('4,800 INDX'); }
function h_5(event) { event.stopPropagation();buyNFT('50 INDX'); }
function h_6(event) { event.stopPropagation();buyNFT('100 INDX'); }
function h_7(event) { event.stopPropagation();buyNFT('40 INDX'); }
function h_8(event) { window.location.href='nft-create.html'; }


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
