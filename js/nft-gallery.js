
// GOD MODE: favorites, recently viewed, live USD conversion, burn confirm sheet
const INDX_PRICE_USD = 0.24;
const FAV_KEY = 'indx_nftgallery_favorites';
const RECENT_KEY = 'indx_nftgallery_recent';

function getFavorites() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch (e) { return []; }
}
function saveFavorites(arr) { localStorage.setItem(FAV_KEY, JSON.stringify(arr)); }
function isFavorite(key) { return getFavorites().includes(key); }

function toggleFavorite(key, btnEl, event) {
  if (!key) return;
  if (event) event.stopPropagation();
  const favs = getFavorites();
  const idx = favs.indexOf(key);
  const nowActive = idx === -1;
  if (nowActive) { favs.push(key); showToast('❤️ Added to favorites'); }
  else { favs.splice(idx, 1); showToast('💔 Removed from favorites'); }
  saveFavorites(favs);
  document.querySelectorAll('.fav-btn[data-nft-key="' + key + '"], .nft-list-fav[data-nft-key="' + key + '"]').forEach(b => {
    b.classList.toggle('active', nowActive);
    b.textContent = nowActive ? '❤' : '♡';
  });
  if (btnEl && btnEl.id === 'dsFavBtn') {
    btnEl.classList.toggle('active', nowActive);
    btnEl.textContent = nowActive ? '❤' : '♡';
  }
}

function applyFavoriteStates() {
  const favs = getFavorites();
  document.querySelectorAll('.fav-btn[data-nft-key], .nft-list-fav[data-nft-key]').forEach(btn => {
    const active = favs.includes(btn.getAttribute('data-nft-key'));
    btn.classList.toggle('active', active);
    btn.textContent = active ? '❤' : '♡';
  });
}

function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch (e) { return []; }
}

function addToRecent(key) {
  if (!key) return;
  let recent = getRecent().filter(k => k !== key);
  recent.unshift(key);
  recent = recent.slice(0, 8);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  renderRecentStrip();
}

function renderRecentStrip() {
  const strip = document.getElementById('recentStrip');
  if (!strip) return;
  const recent = getRecent().filter(k => NFT_STORE[k]); // only real NFTs still in the store
  if (recent.length === 0) { strip.style.display = 'none'; strip.innerHTML = ''; return; }
  strip.style.display = 'flex';
  strip.innerHTML = recent.map(key => {
    const nft = NFT_STORE[key];
    return '<div class="recent-chip" data-action="h_8" data-args="[&quot;$event&quot;,' + indxJ(key) + ']">'
      + '<div class="recent-chip-art">' + nft.emoji + '</div>'
      + '<div class="recent-chip-label">' + nft.name + '</div>'
      + '</div>';
  }).join('');
}

function updateStatsUsd() {
  const usdEl = document.getElementById('statValueUsd');
  if (!usdEl) return;
  const total = Object.keys(NFT_STORE).length;
  const indxTotal = total * 50; // same basis as statValue
  usdEl.textContent = total > 0 ? '≈ $' + (indxTotal * INDX_PRICE_USD).toFixed(2) + ' USD' : '';
}

function openBurnConfirm() {
  const nft = NFT_STORE[currentNFT];
  if (!nft) return;
  document.getElementById('burnConfirmName').textContent = nft.name;
  document.getElementById('burnConfirmOverlay').classList.add('open');
  document.getElementById('burnConfirmSheet').classList.add('open');
}

function closeBurnConfirm() {
  document.getElementById('burnConfirmOverlay').classList.remove('open');
  document.getElementById('burnConfirmSheet').classList.remove('open');
}

function executeBurn() {
  if (!currentNFT) { closeBurnConfirm(); return; }
  const favs = getFavorites().filter(k => k !== currentNFT);
  saveFavorites(favs);
  const recent = getRecent().filter(k => k !== currentNFT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  delete NFT_STORE[currentNFT];
  closeBurnConfirm();
  closeDetail();
  updateStats();
  renderRecentStrip();
  showToast('🔥 NFT burned');
}

// NFT data store in real app this comes from Solana/Metaplex API
// FIXED 2026-07-25: no longer hardcodes a fake "genesis" entry for every visitor —
// the real entry (if any) is added by checkRealGenesisStatus() below after a real
// Supabase check. See gotchas.md.
const NFT_STORE = {};

// Load any NFTs minted in this session (from receipt.html / rwa.html)
function loadSessionNFTs() {
  // Check for minted receipt NFT
  const receiptId = window._mintedReceiptId || localStorage.getItem('_lastMintedReceiptId');
  if (receiptId) {
    NFT_STORE['receipt_' + receiptId] = {
      emoji: '🧾',
      name: 'Transaction Receipt NFT',
      sub: 'Immutable transaction proof · Compressed NFT',
      type: 'Receipt',
      id: receiptId,
      date: new Date().toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'}),
      royalty: '2%',
      artBg: 'linear-gradient(135deg,rgba(0,229,160,0.2),rgba(0,229,160,0.05))',
      value: '',
      showRoyalty: true,
      category: 'receipt'
    };
  }
}

let currentView = 'grid';
let currentTab = 'all';
let currentNFT = null;

// FIXED 2026-07-25: real check for genesis status instead of always assuming it —
// see gotchas.md. Uses the same Supabase project/anon key already wired into
// citizen-dashboard.html and login.html.
const SUPA_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
const SUPA_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';

async function checkRealGenesisStatus() {
  const citizenId = sessionStorage.getItem('citizen_id');
  if (!citizenId) return;
  try {
    const res = await fetch(
      `${SUPA_URL}/rest/v1/citizens?id=eq.${encodeURIComponent(citizenId)}&select=genesis_citizen,created_at`,
      { headers: { apikey: SUPA_ANON_KEY, Authorization: `Bearer ${SUPA_ANON_KEY}` } }
    );
    if (!res.ok) return;
    const rows = await res.json();
    const row = rows && rows[0];
    if (!row || !row.genesis_citizen) return; // not a genesis citizen — leave card hidden
    NFT_STORE.genesis = {
      emoji: '🏛️',
      name: 'Genesis Mint Receipt',
      sub: 'IN$DEX Founding Citizen · Compressed NFT (Bubblegum)',
      type: 'Receipt',
      id: 'GNES-' + citizenId.slice(0, 8).toUpperCase(),
      date: row.created_at ? new Date(row.created_at).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'}) : 'Genesis',
      royalty: '5%',
      artBg: 'linear-gradient(135deg,rgba(43,53,216,0.3),rgba(139,63,232,0.3))',
      value: '50 INDX',
      showRoyalty: true,
      category: 'receipt'
    };
    const gc = document.getElementById('genesisCard');
    const gl = document.getElementById('genesisListItem');
    if (gc) gc.style.display = '';
    if (gl) gl.style.display = '';
    updateStats();
    // GOD MODE PATCH: refresh recently-viewed strip now that this NFT is known
    renderRecentStrip();
  } catch (e) { /* no real data available — card stays hidden */ }
}

// GOD MODE PATCH: initialize favorites + recently viewed after initial render
window.addEventListener('DOMContentLoaded', () => {
  loadSessionNFTs();
  updateStats();
  renderGrid();
  checkRealGenesisStatus();
  applyFavoriteStates();
  renderRecentStrip();
});

// GOD MODE PATCH: also refresh live USD estimate whenever stats update
function updateStats() {
  const total = Object.keys(NFT_STORE).length;
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statValue').textContent = total > 0 ? total * 50 + ' INDX' : '';
  document.getElementById('statRoyalty').textContent = '0 INDX';
  updateStatsUsd();
}

function switchTab(el, tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  currentTab = tab;
  renderGrid();
}

function setView(v) {
  currentView = v;
  document.getElementById('vtGrid').classList.toggle('active', v === 'grid');
  document.getElementById('vtList').classList.toggle('active', v === 'list');
  document.getElementById('gridView').style.display = v === 'grid' ? 'block' : 'none';
  document.getElementById('listView').style.display = v === 'list' ? 'block' : 'none';
}

function renderGrid() {
  // Re-render with filter applied for now just refresh visibility of demo cards
  // In production, this would re-render from filtered NFT_STORE
  const demoCards = document.querySelectorAll('.nft-card[style*="opacity:0.4"]');
  demoCards.forEach(c => {
    if (currentTab === 'all') c.style.display = '';
    else c.style.display = 'none';
  });
}

function openDetail(key) {
  const nft = NFT_STORE[key];
  if (!nft) return;
  currentNFT = key;
  document.getElementById('dsArt').textContent = nft.emoji;
  document.getElementById('dsArt').style.background = nft.artBg;
  document.getElementById('dsTitle').textContent = 'NFT Details';
  document.getElementById('dsName').textContent = nft.name;
  document.getElementById('dsSub').textContent = nft.sub;
  document.getElementById('dsPropType').textContent = nft.type;
  document.getElementById('dsPropId').textContent = nft.id;
  document.getElementById('dsPropDate').textContent = nft.date;
  document.getElementById('dsPropRoyalty').textContent = nft.royalty || 'N/A';
  document.getElementById('dsRoyaltyNote').style.display = nft.showRoyalty ? 'block' : 'none';
  document.getElementById('overlay').classList.add('open');
  document.getElementById('detailSheet').classList.add('open');
  document.body.style.overflow = 'hidden';
  // GOD MODE PATCH: sync favorite button + log this view to recently viewed
  const favBtn = document.getElementById('dsFavBtn');
  if (favBtn) {
    const active = isFavorite(key);
    favBtn.classList.toggle('active', active);
    favBtn.textContent = active ? '❤' : '♡';
  }
  addToRecent(key);
}

function closeDetail() {
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('detailSheet').classList.remove('open');
  document.body.style.overflow = '';
  currentNFT = null;
}

function listOnMarket() {
  showToast('📋 Listing flow coming in Wave 1');
}

function shareNFT() {
  const nft = NFT_STORE[currentNFT];
  if (!nft) return;
  if (navigator.share) {
    navigator.share({ title: nft.name, text: 'Check out my NFT on IN$DEX: ' + nft.name + ' · Token: ' + nft.id });
  } else {
    showToast('📋 Token ID copied');
    navigator.clipboard?.writeText(nft.id).catch(()=>{});
  }
}

function viewOnChain() {
  const nft = NFT_STORE[currentNFT];
  showToast('🔗 Explorer link: solscan.io/token/' + (nft?.id || ''));
}

// GOD MODE PATCH: replaced native confirm() dialog with a custom two-step bottom-sheet confirmation
function burnNFT() {
  openBurnConfirm();
}

function showComingSoon() {
  showToast('🖼️ Mint an asset to see it here');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(20px)';
  }, 2500);
}

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { window.history.back(); }
function h_2(event) { window.location.href='rwa.html'; }
function h_3(event) { window.location.href='marketplace.html'; }
function h_4(event) { toggleFavorite(currentNFT, this, event); }
function h_5(event) { window.location.href='citizen-dashboard.html'; }
function h_6(event) { window.location.href='portfolio.html'; }
function h_7(event) { window.location.href='profile.html'; }
function h_8(event, __p0) { openDetail(String(__p0)); }


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

})();
