
  const SUPA_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
  const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNjM3MjUsImV4cCI6MjA1ODYzOTcyNX0.SRSVRhNYKBRuFqMBpBaFyshFAVafxqBiPGj6N2ZwYGo';
  const INDX_PRICE = 0.24;

  const STATUS_BADGE = { active:'active', sold:'sold', draft:'paused', removed:'paused' };
  const STATUS_LABEL = { active:'Active', sold:'Sold', draft:'Draft', removed:'Removed' };
  const CAT_EMOJI    = { Services:'🛠️', Food:'🍽️', Digital:'💾', RWA:'💎', Crafts:'🎨', Clothing:'👕', Electronics:'📱', Other:'📦', goods:'📦' };

  let myListings = [];

  window.addEventListener('DOMContentLoaded', async () => {
    const citizenId = sessionStorage.getItem('citizen_id');
    if (citizenId) await loadMyListings(citizenId);

    // GOD MODE: restore persisted sort + currency preferences
    const savedSort = localStorage.getItem('indx_mylistings_sort') || 'default';
    const sortSelect = document.getElementById('listingSortSelect');
    if (sortSelect) sortSelect.value = savedSort;
    document.getElementById('curBtnIndx').classList.toggle('active', displayCurrency === 'indx');
    document.getElementById('curBtnUsd').classList.toggle('active', displayCurrency === 'usd');
  });

  async function loadMyListings(citizenId) {
    try {
      const res = await fetch(`${SUPA_URL}/rest/v1/rpc/get_my_listings`, {
        method: 'POST',
        headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_citizen_id: citizenId })
      });
      myListings = await res.json() || [];
    } catch(e) {
      myListings = [];
    }
    renderMyListings();
  }

  // GOD MODE: display-currency preference (persisted) used across listings + earnings tab
  let displayCurrency = localStorage.getItem('indx_mylistings_currency') || 'indx';
  let activeCategoryFilter = 'all';

  function renderMyListings() {
    // GOD MODE PATCH: render into the sub-container so the search/sort filter bar above it survives re-renders
    const container = document.getElementById('listingsListContainer');
    const active  = myListings.filter(l => l.status === 'active');
    const sold    = myListings.filter(l => l.status === 'sold');
    const earned  = sold.reduce((s, l) => s + (l.price_indx * 0.98), 0);

    // Update stats
    const statBoxes = document.querySelectorAll('.stat-box .stat-num');
    if (statBoxes[0]) statBoxes[0].textContent = active.length;
    if (statBoxes[1]) statBoxes[1].textContent = sold.length;
    if (statBoxes[2]) statBoxes[2].textContent = displayCurrency === 'usd' ? '$' + (earned * INDX_PRICE).toFixed(2) : earned.toFixed(1);

    // GOD MODE PATCH: wire the previously-static Earnings tab total to real computed data
    const earningsTotalNum = document.getElementById('earningsTotalNum');
    const earningsTotalUsd = document.getElementById('earningsTotalUsd');
    if (earningsTotalNum) earningsTotalNum.textContent = (displayCurrency === 'usd' ? '$' + (earned * INDX_PRICE).toFixed(2) : earned.toFixed(1) + ' INDX');
    if (earningsTotalUsd) earningsTotalUsd.textContent = displayCurrency === 'usd' ? earned.toFixed(1) + ' INDX' : '≈ $' + (earned * INDX_PRICE).toFixed(2);

    const filterBar = document.getElementById('listingsFilterBar');
    if (!myListings.length) {
      if (filterBar) filterBar.style.display = 'none';
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🏪</div>
          <div class="empty-title">No listings yet</div>
          <div class="empty-sub">List a service, digital product, or physical item. You keep 98% of every sale — 2% goes to the Civilisation.</div>
          <button class="empty-btn" data-action="h_2" data-args="[&quot;$event&quot;]">+ Create First Listing</button>
        </div>`;
      return;
    }

    if (filterBar) filterBar.style.display = 'flex';
    buildCategoryChips();
    applyListingFilters();
  }

  // GOD MODE: live search + category filter + sort (client-side, over real myListings data)
  function buildCategoryChips() {
    const row = document.getElementById('categoryChipRow');
    if (!row) return;
    const cats = Array.from(new Set(myListings.map(l => l.category).filter(Boolean)));
    row.innerHTML = ['all', ...cats].map(c => {
      const label = c === 'all' ? 'All' : (CAT_EMOJI[c] || '🛒') + ' ' + c;
      return `<div class="filter-chip ${activeCategoryFilter === c ? 'active' : ''}" data-action="h_14" data-args="${JSON.stringify(["$event",c]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">${label}</div>`;
    }).join('');
  }

  function setCategoryFilter(cat) {
    activeCategoryFilter = cat;
    buildCategoryChips();
    applyListingFilters();
  }

  function applyListingFilters() {
    const container = document.getElementById('listingsListContainer');
    if (!container) return;
    const searchInput = document.getElementById('listingSearchInput');
    const sortSelect = document.getElementById('listingSortSelect');
    const q = (searchInput ? searchInput.value : '').trim().toLowerCase();
    const sortMode = sortSelect ? sortSelect.value : 'default';

    // GOD MODE: remember last-used sort choice
    if (sortSelect) localStorage.setItem('indx_mylistings_sort', sortMode);

    let list = myListings.filter(l => {
      const matchesCat = activeCategoryFilter === 'all' || l.category === activeCategoryFilter;
      const matchesText = !q || (l.title || '').toLowerCase().includes(q) || (l.description || '').toLowerCase().includes(q);
      return matchesCat && matchesText;
    });

    if (sortMode === 'price-desc') list = list.slice().sort((a, b) => b.price_indx - a.price_indx);
    else if (sortMode === 'price-asc') list = list.slice().sort((a, b) => a.price_indx - b.price_indx);
    else if (sortMode === 'az') list = list.slice().sort((a, b) => (a.title || '').localeCompare(b.title || ''));

    if (!list.length) {
      container.innerHTML = `<div class="filter-empty">No listings match "${q || activeCategoryFilter}"</div>`;
      return;
    }

    container.innerHTML = list.map(l => {
      const emoji = CAT_EMOJI[l.category] || '🛒';
      const badge = STATUS_BADGE[l.status] || 'paused';
      const label = STATUS_LABEL[l.status] || l.status;
      const usd   = (l.price_indx * INDX_PRICE).toFixed(2);
      const priceMain = displayCurrency === 'usd' ? '$' + usd : l.price_indx + ' INDX';
      const priceSub  = displayCurrency === 'usd' ? l.price_indx + ' INDX' : '≈ $' + usd;
      return `
        <div class="listing-item" data-action="h_15" data-args="${JSON.stringify(["$event",l.title,l.price_indx,label,(l.description||'').slice(0,60)]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">
          <div class="listing-thumb">${emoji}</div>
          <div class="listing-body">
            <div class="listing-title">${l.title}</div>
            <div class="listing-meta">
              <div class="listing-price">${priceMain}</div>
              <div class="listing-status ${badge}">${label}</div>
              <div class="listing-views">${priceSub}</div>
            </div>
          </div>
          <div class="listing-actions">
            <div class="action-btn edit" data-action="h_16" data-args="[&quot;$event&quot;]">Edit</div>
            ${l.status==='active' ? `<div class="action-btn pause" data-action="h_17" data-args="[&quot;$event&quot;]">Pause</div>` : ''}
          </div>
        </div>`;
    }).join('');
  }

  // GOD MODE: INDX / USD display toggle, persisted across visits
  function setDisplayCurrency(mode) {
    displayCurrency = mode;
    localStorage.setItem('indx_mylistings_currency', mode);
    document.getElementById('curBtnIndx').classList.toggle('active', mode === 'indx');
    document.getElementById('curBtnUsd').classList.toggle('active', mode === 'usd');
    renderMyListings();
  }

  // GOD MODE: portfolio insights sheet — computed entirely from real myListings data
  function openInsightsSheet() {
    const active = myListings.filter(l => l.status === 'active');
    const totalValue = active.reduce((s, l) => s + l.price_indx, 0);
    const avgPrice = myListings.length ? (myListings.reduce((s, l) => s + l.price_indx, 0) / myListings.length) : 0;
    const highest = myListings.slice().sort((a, b) => b.price_indx - a.price_indx)[0];
    const catCounts = {};
    myListings.forEach(l => { const c = l.category || 'Other'; catCounts[c] = (catCounts[c] || 0) + 1; });

    const body = document.getElementById('insightsBody');
    body.innerHTML = `
      <div class="insight-stat-grid">
        <div class="insight-stat">
          <div class="insight-stat-num">${totalValue.toFixed(1)}</div>
          <div class="insight-stat-lbl">Active Value (INDX)</div>
        </div>
        <div class="insight-stat">
          <div class="insight-stat-num">${avgPrice.toFixed(1)}</div>
          <div class="insight-stat-lbl">Avg. Listing Price</div>
        </div>
      </div>
      ${highest ? `<div class="detail-row"><div class="lbl">Highest priced listing</div><div class="val">${highest.title} · ${highest.price_indx} INDX</div></div>` : ''}
      ${Object.keys(catCounts).length ? Object.entries(catCounts).map(([c, n]) => `<div class="insight-cat-row"><div>${CAT_EMOJI[c] || '🛒'} ${c}</div><div>${n}</div></div>`).join('') : '<div class="filter-empty">No listings yet — create one to see insights.</div>'}
    `;
    document.getElementById('insightsOverlay').classList.add('open');
    document.getElementById('insightsSheet').classList.add('open');
  }

  function closeInsightsSheet() {
    document.getElementById('insightsOverlay').classList.remove('open');
    document.getElementById('insightsSheet').classList.remove('open');
  }

  function switchTab(tab) {
    ['listings','orders','earnings'].forEach(t => {
      document.getElementById('tab-'+t).classList.toggle('active', t===tab);
      document.getElementById('content-'+t).classList.toggle('active', t===tab);
    });
  }

  function openOrderSheet(title, price, status, detail) {
    document.getElementById('orderSheetTitle').textContent = title;
    const p = parseFloat(price) || 0;
    document.getElementById('orderSheetRows').innerHTML = `
      <div class="detail-row"><div class="lbl">Price</div><div class="val" style="color:var(--cyan)">${p} INDX ≈ $${(p*INDX_PRICE).toFixed(2)}</div></div>
      <div class="detail-row"><div class="lbl">Status</div><div class="val">${status}</div></div>
      <div class="detail-row"><div class="lbl">Description</div><div class="val">${detail}</div></div>
      <div class="detail-row"><div class="lbl">Your cut (98%)</div><div class="val" style="color:var(--green)">+${(p*0.98).toFixed(2)} INDX</div></div>
      <div class="detail-row"><div class="lbl">Civilisation Fee</div><div class="val" style="color:var(--red)">-${(p*0.02).toFixed(2)} INDX</div></div>
    `;
    document.getElementById('orderOverlay').classList.add('open');
  }

  function closeOrderSheet() { document.getElementById('orderOverlay').classList.remove('open'); }
  document.getElementById('orderOverlay').addEventListener('click', function(e) { if(e.target===this) closeOrderSheet(); });
  document.getElementById('orderPrimaryBtn').onclick = () => { closeOrderSheet(); showToast('✓ Order marked as fulfilled'); };

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  }

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { window.history.back(); }
function h_2(event) { window.location.href='create-listing.html'; }
function h_3(event) { event.stopPropagation(); showToast('✏️ Edit listing coming Wave 1'); }
function h_4(event) { event.stopPropagation(); showToast('⏸ Listing paused'); }
function h_5(event) { event.stopPropagation(); showToast('🗑 Delete coming Wave 1'); }
function h_6(event) { switchTab('listings'); document.getElementById('tab-listings').classList.add('active'); }
function h_7(event) { window.location.href='dispute.html'; }
function h_8(event) { if(event.target===this) closeInsightsSheet(); }
function h_9(event) { window.location.href='citizen-dashboard.html'; }
function h_10(event) { window.location.href='marketplace.html'; }
function h_11(event) { window.location.href='portfolio.html'; }
function h_12(event) { window.location.href='feed.html'; }
function h_13(event) { window.location.href='profile.html'; }
function h_14(event, __p0) { setCategoryFilter(String(__p0)); }
function h_15(event, __p0, __p1, __p2, __p3) { openOrderSheet(String(__p0), String(__p1), String(__p2), String(__p3)); }
function h_16(event) { event.stopPropagation(); showToast('✏️ Edit coming Wave 1'); }
function h_17(event) { event.stopPropagation(); showToast('⏸ Pause coming Wave 1'); }


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
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, { capture: true, passive: false }); })(EV.change);

})();
