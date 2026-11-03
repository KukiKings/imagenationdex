
  const INDX_PRICE_USD = 0.24;
  let currentFilter = 'all';
  let searchTimer;

  // ── GOD MODE — SEARCH ────────────────────────────────────────

  // 1. RECENT SEARCHES — localStorage persistence
  const RECENT_KEY = 'indx_search_recent';
  const MAX_RECENT = 8;

  function loadRecent() {
    const saved = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    const list = document.getElementById('recentList');
    if (!saved.length) {
      list.innerHTML = '<div style="font-size:13px;color:var(--text-dim);padding:8px 14px;">No recent searches</div>';
      return;
    }
    list.innerHTML = saved.map(q => `
      <div class="recent-item" data-action="h_8" data-args="${JSON.stringify(["$event",JSON.stringify(q)]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">
        <span class="ri-icon">🕐</span>
        <span class="ri-text">${q}</span>
        <span class="ri-remove" data-action="removeRecent" data-args="[&quot;$event&quot;,&quot;$this&quot;]">✕</span>
      </div>`).join('');
  }

  function addToRecent(q) {
    if (!q || q.length < 2) return;
    let saved = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    saved = saved.filter(s => s !== q);
    saved.unshift(q);
    localStorage.setItem(RECENT_KEY, JSON.stringify(saved.slice(0, MAX_RECENT)));
    loadRecent();
  }

  // 2. VOICE SEARCH
  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showToast('Voice search not supported on this browser'); return; }
    const rec = new SR();
    rec.lang = 'en-NZ';
    rec.continuous = false;
    rec.interimResults = false;
    const micBtn = document.getElementById('micBtn');
    micBtn.classList.add('listening');
    showToast('🎤 Listening…');
    try { rec.start(); } catch(e) { micBtn.classList.remove('listening'); return; }
    rec.onresult = (e) => {
      const q = e.results[0][0].transcript.trim();
      micBtn.classList.remove('listening');
      if (q) { document.getElementById('searchInput').value = q; onSearch(); }
    };
    // FIXED 2026-07-26: onerror silently reset the mic button with no message at all —
    // a citizen whose voice search failed (e.g. a 'network' error, since this needs
    // Chrome with a working connection to Google's speech servers) had no idea why
    // nothing happened. Added a specific message for that case.
    rec.onerror = (e) => {
      micBtn.classList.remove('listening');
      if (e.error === 'network') showToast('Voice needs an internet connection — try typing instead');
      else if (e.error === 'not-allowed') showToast('Mic access denied — check your browser permissions');
    };
    rec.onend = () => micBtn.classList.remove('listening');
  }

  // FIXED 2026-07-25: was a fabricated "live drift" loop — Math.random() kept inflating
  // fake listings/votes/couriers/Wisdom Score counters and jittering the INDX price %
  // every ~20-35s to fake organic growth (INDX price must stay fixed at $0.24, never
  // drift). Removed; the "Trending Now" meta text above is now static honest copy.
  // See gotchas.md.
  function driftTrending() {
    return;
  }

  // 4. URL PARAM PRE-FILL + SHARE RESULTS
  function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      document.getElementById('searchInput').value = q;
      onSearch();
    }
  }

  function shareResults() {
    const q = document.getElementById('searchInput').value.trim();
    if (!q) return;
    const url = location.origin + location.pathname + '?q=' + encodeURIComponent(q);
    if (navigator.share) {
      navigator.share({ title: 'IN$DEX Search', text: `Search for "${q}" on IN$DEX`, url });
    } else {
      navigator.clipboard.writeText(url).then(() => showToast('🔗 Search link copied!'));
    }
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2400);
  }
  // ── END GOD MODE ─────────────────────────────────────────────

  const DATA = {
    listings: [
      { emoji:'🎨', title:'Handmade Ceramic Coffee Set', seller:'kiri.IN$DEX', price:'150 INDX', category:'Crafts' },
      { emoji:'📱', title:'iPhone 13 Pro Excellent Condition', seller:'sione.IN$DEX', price:'800 INDX', category:'Electronics' },
      { emoji:'👗', title:'Vintage Silk Kimono Size M', seller:'amara.IN$DEX', price:'120 INDX', category:'Clothing' },
      { emoji:'🥘', title:'Homemade Samoan Palusami 6 Pack', seller:'tala.IN$DEX', price:'20 INDX', category:'Food' },
      { emoji:'🖼️', title:'Koru Print Art A2 Framed', seller:'kiri.IN$DEX', price:'55 INDX', category:'Crafts' },
      { emoji:'🔧', title:'Professional Web Design Service', seller:'mele.IN$DEX', price:'200 INDX', category:'Services' },
    ],
    tokens: [
      { icon:'◎', name:'INDX', symbol:'INDX · Solana', price:'$0.24', change:'Planning reference', up:null },
      { icon:'◉', name:'Solana', symbol:'SOL · Solana', price:'$125.00', change:'+3.2%', up:true },
      { icon:'💵', name:'USD Coin', symbol:'USDC · Solana', price:'$1.00', change:'-0.1%', up:false },
    ],
    citizens: [
      { initials:'KT', bg:'linear-gradient(135deg,#8B3FE8,#00D4FF)', name:'Kiri Tane', handle:'kiri.IN$DEX', ws:'WS 82 · 47 sales' },
      { initials:'ST', bg:'linear-gradient(135deg,#00E5A0,#2B35D8)', name:'Sione Tuilagi', handle:'sione.IN$DEX', ws:'WS 74 · 38 sales' },
      { initials:'AT', bg:'linear-gradient(135deg,#FFB800,#FF6B00)', name:'Aiko Tanaka', handle:'aiko.IN$DEX', ws:'WS 194 · 203 sales' },
      { initials:'AD', bg:'linear-gradient(135deg,#FF4D6D,#8B3FE8)', name:'Amara Diallo', handle:'amara.IN$DEX', ws:'WS 66 · 21 sales' },
    ],
    governance: [
      { title:'Proposal: Reduce Civilisation Fee to 1.5%', meta:'847 votes · 2 days left' },
      { title:'Proposal: Add Fijian creole to platform languages', meta:'312 votes · 5 days left' },
      { title:'Proposal: Launch IN$DEX mesh node in Samoa', meta:'124 votes · 7 days left' },
    ]
  };

  function selectFilter(el, name) {
    currentFilter = name;
    document.querySelectorAll('.ft').forEach(f => f.classList.remove('active'));
    el.classList.add('active');
    const q = document.getElementById('searchInput').value.trim();
    if (q) renderResults(q);
  }

  function selectFilterByName(name) {
    currentFilter = name;
    document.querySelectorAll('.ft').forEach(f => {
      f.classList.toggle('active', f.textContent.toLowerCase().includes(name));
    });
    const q = document.getElementById('searchInput').value.trim();
    if (q) renderResults(q);
  }

  function onSearch() {
    const q = document.getElementById('searchInput').value.trim();
    // GOD MODE PATCH — toggle mic vs clear, show/hide share
    document.getElementById('clearBtn').style.display = q ? 'block' : 'none';
    document.getElementById('micBtn').style.display  = q ? 'none'  : 'flex';
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      if (q.length >= 1) {
        document.getElementById('defaultState').style.display = 'none';
        renderResults(q);
      } else {
        document.getElementById('defaultState').style.display = 'block';
        document.getElementById('resultsState').classList.remove('show');
        document.getElementById('emptyState').classList.remove('show');
      }
    }, 220);
  }

  // GOD MODE PATCH
  function doSearch(q) {
    document.getElementById('searchInput').value = q;
    document.getElementById('clearBtn').style.display = 'block';
    document.getElementById('micBtn').style.display = 'none';
    document.getElementById('searchInput').focus();
    addToRecent(q);
    onSearch();
  }

  function renderResults(q) {
    const ql = q.toLowerCase();
    const show = currentFilter;

    // Filter data
    const listings = DATA.listings.filter(l =>
      l.title.toLowerCase().includes(ql) || l.seller.includes(ql) || l.category.toLowerCase().includes(ql));
    const tokens = DATA.tokens.filter(t =>
      t.name.toLowerCase().includes(ql) || t.symbol.toLowerCase().includes(ql));
    const citizens = DATA.citizens.filter(c =>
      c.name.toLowerCase().includes(ql) || c.handle.toLowerCase().includes(ql));
    const governance = DATA.governance.filter(g =>
      g.title.toLowerCase().includes(ql));

    const hasResults = listings.length || tokens.length || citizens.length || governance.length;

    document.getElementById('resultsState').classList.toggle('show', hasResults);
    document.getElementById('emptyState').classList.toggle('show', !hasResults);
    // GOD MODE PATCH — show share button when results exist
    document.getElementById('shareWrap').classList.toggle('show', hasResults);
    if (!hasResults) {
      document.getElementById('emptySubtext').textContent = `No results for "${q}". Try different keywords.`;
      return;
    }

    // Listings
    const showListings = (show === 'all' || show === 'listings');
    document.getElementById('section-listings').style.display = showListings && listings.length ? 'block' : 'none';
    document.getElementById('listings-results').innerHTML = listings.slice(0,3).map(l => `
      <div class="result-listing" data-action="h_9" data-args="[&quot;$event&quot;]">
        <div class="rl-img">${l.emoji}</div>
        <div>
          <div class="rl-title">${highlight(l.title, ql)}</div>
          <div class="rl-seller">${l.seller}</div>
          <div><span class="rl-price">${l.price}</span><span class="rl-badge">${l.category}</span></div>
        </div>
      </div>`).join('');

    // Tokens
    const showTokens = (show === 'all' || show === 'tokens');
    document.getElementById('section-tokens').style.display = showTokens && tokens.length ? 'block' : 'none';
    document.getElementById('tokens-results').innerHTML = tokens.slice(0,3).map(t => `
      <div class="result-token" data-action="h_2" data-args="[&quot;$event&quot;]">
        <div class="rt-icon">${t.icon}</div>
        <div>
          <div class="rt-name">${highlight(t.name, ql)}</div>
          <div class="rt-symbol">${t.symbol}</div>
        </div>
        <div class="rt-price">
          <div class="rt-val">${t.price}</div>
          <div class="rt-change ${t.up === null ? 'flat' : (t.up ? 'up' : 'down')}">${t.change}</div>
        </div>
      </div>`).join('');

    // Citizens
    const showCitizens = (show === 'all' || show === 'citizens');
    document.getElementById('section-citizens').style.display = showCitizens && citizens.length ? 'block' : 'none';
    document.getElementById('citizens-results').innerHTML = citizens.slice(0,3).map(c => `
      <div class="result-citizen" data-action="h_10" data-args="${JSON.stringify(["$event",encodeURIComponent(c.handle)]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">
        <div class="rc-av" style="background:${c.bg}">${c.initials}</div>
        <div>
          <div class="rc-nm">${highlight(c.name, ql)}</div>
          <div class="rc-hndl">${c.handle}</div>
          <div class="rc-ws">${c.ws}</div>
        </div>
        <div class="rc-follow">Follow</div>
      </div>`).join('');

    // Governance
    const showGov = (show === 'all' || show === 'governance');
    document.getElementById('section-governance').style.display = showGov && governance.length ? 'block' : 'none';
    document.getElementById('governance-results').innerHTML = governance.slice(0,2).map(g => `
      <div class="result-gov" data-action="h_3" data-args="[&quot;$event&quot;]">
        <div class="rg-title">${highlight(g.title, ql)}</div>
        <div class="rg-meta"><span>🗳️ ${g.meta}</span></div>
      </div>`).join('');
  }

  function highlight(text, q) {
    if (!q) return text;
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
    return text.replace(re, '<span style="color:var(--cyan);font-weight:700;">$1</span>');
  }

  // GOD MODE PATCH
  function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('clearBtn').style.display = 'none';
    document.getElementById('micBtn').style.display = 'flex';
    document.getElementById('defaultState').style.display = 'block';
    document.getElementById('resultsState').classList.remove('show');
    document.getElementById('emptyState').classList.remove('show');
    document.getElementById('shareWrap').classList.remove('show');
  }

  // GOD MODE PATCH
  function clearRecent() {
    localStorage.removeItem(RECENT_KEY);
    document.getElementById('recentList').innerHTML = '<div style="font-size:13px;color:var(--text-dim);padding:8px 14px;">No recent searches</div>';
  }

  // GOD MODE PATCH
  function removeRecent(e, el) {
    e.stopPropagation();
    const text = el.closest('.recent-item').querySelector('.ri-text').textContent;
    let saved = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    saved = saved.filter(s => s !== text);
    localStorage.setItem(RECENT_KEY, JSON.stringify(saved));
    el.closest('.recent-item').remove();
    if (!saved.length) {
      document.getElementById('recentList').innerHTML = '<div style="font-size:13px;color:var(--text-dim);padding:8px 14px;">No recent searches</div>';
    }
  }

  // Auto-focus
  window.addEventListener('load', () => setTimeout(() => document.getElementById('searchInput').focus(), 100));

  // GOD MODE: DOMContentLoaded init
  document.addEventListener('DOMContentLoaded', () => {
    loadRecent();
    checkUrlParams();
    setTimeout(driftTrending, 8000); // start drift after 8s
  });

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { window.history.back(); }
function h_2(event) { window.location.href='dex-swap.html'; }
function h_3(event) { window.location.href='governance.html'; }
function h_4(event) { window.location.href='citizen-dashboard.html'; }
function h_5(event) { window.location.href='marketplace.html'; }
function h_6(event) { window.location.href='feed.html'; }
function h_7(event) { window.location.href='profile.html'; }
function h_8(event, __p0) { doSearch(__p0); }
function h_9(event) { window.location.href='listing-detail.html'; }
function h_10(event, __p0) { window.location.href='citizen-profile.html?citizen=' + String(__p0) + ''; }


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
    }, true); })(EV.click);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, true); })(EV.input);

})();
