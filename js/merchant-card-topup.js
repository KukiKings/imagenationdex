
  // ── GOD MODE: session log + quick-repeat + sheet accessibility ──
  const TOPUP_HISTORY_KEY = 'indx_cardtopup_history';
  const TOPUP_LASTDOMAIN_KEY = 'indx_cardtopup_lastdomain';

  function getTopupHistory() {
    try { return JSON.parse(localStorage.getItem(TOPUP_HISTORY_KEY) || '[]'); }
    catch (e) { return []; }
  }

  function logTopup(entry) {
    const hist = getTopupHistory();
    hist.unshift(entry);
    localStorage.setItem(TOPUP_HISTORY_KEY, JSON.stringify(hist.slice(0, 50)));
    renderTopupHistory();
  }

  function timeAgo(ts) {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return new Date(ts).toLocaleDateString();
  }

  function renderTopupHistory() {
    const hist = getTopupHistory();
    const list = document.getElementById('histList');
    const isSameDay = (ts) => new Date(ts).toDateString() === new Date().toDateString();
    const todays = hist.filter(h => isSameDay(h.ts));

    if (!hist.length) {
      list.innerHTML = '<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:8px 0;">No real top-ups yet — this feature isn\'t connected to a settlement system, so nothing here is recorded for real.</div>';
    } else {
      list.innerHTML = hist.slice(0, 20).map(h => `
        <div class="hist-item">
          <div class="hist-icon">🧾</div>
          <div class="hist-body">
            <div class="hist-name">${h.domain}</div>
            <div class="hist-meta">${timeAgo(h.ts)} · logged only, not settled</div>
          </div>
          <div class="hist-earn">$${h.amount.toFixed(2)}</div>
        </div>
      `).join('');
    }

    const total = todays.reduce((s, h) => s + h.amount, 0);
    document.getElementById('sessStatTotal').textContent = '$' + total.toFixed(2);
    document.getElementById('sessStatCount').textContent = String(todays.length);
    document.getElementById('sessStatAvg').textContent = '$' + (todays.length ? (total / todays.length) : 0).toFixed(2);
  }

  function renderQuickRepeat() {
    const last = localStorage.getItem(TOPUP_LASTDOMAIN_KEY) || '';
    const box = document.getElementById('quickRepeatBox');
    if (!last) { box.classList.remove('show'); return; }
    document.getElementById('qrDomainLabel').textContent = last;
    box.classList.add('show');
  }

  async function quickRepeatLookup() {
    const last = localStorage.getItem(TOPUP_LASTDOMAIN_KEY) || '';
    if (!last) return;
    await lookupAndPreviewDomain(last.replace('.IN$DEX', '').toLowerCase());
  }

  // Shared lookup used by both manual entry and quick-repeat
  async function lookupAndPreviewDomain(domain) {
    if (!domain) { showToast('Enter a domain first.'); return; }
    showToast('Looking up ' + domain + '.IN$DEX…');
    try {
      const result = await rpc('get_public_domain_view', { p_slug: domain });
      const view = Array.isArray(result) ? result[0] : result;
      if (!view || !view.found) {
        showToast('No citizen found at ' + domain + '.IN$DEX — check the spelling.');
        return;
      }
      scannedCitizen = {
        name: view.citizen_name || (domain + ' (citizen)'),
        domain: view.web3_domain,
        wisdom_tier: view.wisdom_tier || 'Citizen',
        member_since: view.member_since,
        genesis: !!view.genesis_citizen
      };
      localStorage.setItem(TOPUP_LASTDOMAIN_KEY, scannedCitizen.domain);
      showCitizenPreview(scannedCitizen);
      showToast('✅ Real account found: ' + scannedCitizen.domain);
      setTimeout(() => goToStep(2), 400);
    } catch (e) {
      showToast('Lookup failed: ' + e.message);
    }
  }

  // Escape-to-close + focus trap for the manual entry sheet
  function trapFocus(e) {
    const overlay = document.getElementById('manualOverlay');
    if (overlay.style.pointerEvents !== 'all') return;
    if (e.key === 'Escape') { closeManual(); return; }
    if (e.key !== 'Tab') return;
    const sheet = document.getElementById('manualSheet');
    const focusables = sheet.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  document.addEventListener('keydown', trapFocus);

  const SUPABASE_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
  const SB_HEADERS = { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };

  async function rpc(name, body) {
    const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + name, {
      method: 'POST', headers: SB_HEADERS, body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error((data && data.message) || 'Request failed');
    return data;
  }

  const INDX_PRICE_USD = 0.24;
  let topUpAmt = 50;
  let currentStep = 1;
  let scannedCitizen = null;

  function init() {
    const merchantName = sessionStorage.getItem('merchant_name') || 'Coconut Stall Avarua';
    const merchantDomain = sessionStorage.getItem('merchant_domain') || 'coconutstall.IN$DEX';
    const initial = merchantName.charAt(0).toUpperCase();
    document.getElementById('msAvatar').textContent = initial;
    document.getElementById('msName').textContent = merchantName;
    document.getElementById('msDomain').textContent = merchantDomain + ' · Verified Merchant';
    updateConversion();
    // GOD MODE PATCH: render the local session log + quick-repeat box on load
    renderTopupHistory();
    renderQuickRepeat();
  }

  function showManualEntry() {
    document.getElementById('manualOverlay').style.opacity = '1';
    document.getElementById('manualOverlay').style.pointerEvents = 'all';
    document.getElementById('manualInput').focus();
  }

  function closeManual(e) {
    if (!e || e.target.id === 'manualOverlay') {
      document.getElementById('manualOverlay').style.opacity = '0';
      document.getElementById('manualOverlay').style.pointerEvents = 'none';
    }
  }

  // GOD MODE PATCH: now delegates to the shared lookupAndPreviewDomain() so quick-repeat uses the same path
  async function confirmManualEntry() {
    const domain = document.getElementById('manualInput').value.trim().toLowerCase();
    closeManual();
    await lookupAndPreviewDomain(domain);
  }

  function showCitizenPreview(c) {
    const preview = document.getElementById('citizenPreview');
    document.getElementById('cpAvatar').textContent = c.name.charAt(0);
    document.getElementById('cpName').textContent = c.name;
    document.getElementById('cpDomain').textContent = c.domain;
    document.getElementById('cpTier').textContent = c.wisdom_tier;
    document.getElementById('cpMemberSince').textContent = c.member_since ? new Date(c.member_since).toLocaleDateString('en-US', { month:'short', year:'numeric' }) : '—';
    document.getElementById('cpGenesis').textContent = c.genesis ? '✅' : '—';
    preview.classList.add('show');
  }

  function selectTopUp(a) {
    topUpAmt = a;
    [10,20,50,100,200].forEach(v => {
      const btn = document.getElementById('tp' + v);
      if (btn) btn.classList.toggle('active', v === a);
    });
    document.getElementById('tpCustom').classList.remove('active');
    document.getElementById('customTopUpInput').value = '';
    updateConversion();
  }

  function focusCustomTopUp() {
    [10,20,50,100,200].forEach(v => { const b = document.getElementById('tp' + v); if(b) b.classList.remove('active'); });
    document.getElementById('tpCustom').classList.add('active');
    document.getElementById('customTopUpInput').focus();
  }

  function onCustomTopUpInput(v) {
    topUpAmt = parseFloat(v) || 0;
    updateConversion();
  }

  function updateConversion() {
    document.getElementById('convResult').textContent = '$' + topUpAmt.toFixed(2) + ' USDC (not yet credited)';
    document.getElementById('commPreview').textContent = 'planned — no commission engine live yet';
    document.getElementById('continueToConfirmBtn').textContent = topUpAmt > 0 ? 'Continue → $' + topUpAmt.toFixed(2) : 'Enter an amount';
  }

  function goToConfirm() {
    if (topUpAmt <= 0) return;
    const domain = scannedCitizen ? scannedCitizen.domain : 'citizen.IN$DEX';
    document.getElementById('confCash').textContent = '$' + topUpAmt.toFixed(2);
    document.getElementById('confUsdc').textContent = '$' + topUpAmt.toFixed(2) + ' USDC (not yet credited)';
    document.getElementById('confDomain').textContent = domain;
    goToStep(3);
  }

  function goToStep(n) {
    currentStep = n;
    document.getElementById('step1Panel').style.display = n === 1 ? 'block' : 'none';
    document.getElementById('step2Panel').style.display = n === 2 ? 'block' : 'none';
    document.getElementById('step3Panel').classList.toggle('show', n === 3);
    document.getElementById('successPanel').classList.toggle('show', n === 4);
    document.getElementById('histTitle').style.display = n === 4 ? 'block' : 'block';
    [1,2,3].forEach(i => {
      const dot = document.getElementById('stepDot' + i);
      const lbl = document.getElementById('stepLabel' + i);
      dot.className = 'step-dot ' + (i < n ? 'done' : i === n ? 'active' : 'pending');
      dot.textContent = i < n ? '✓' : i;
      lbl.className = 'step-label' + (i === n ? ' active' : '');
    });
  }

  function goBack() { goToStep(currentStep - 1); }

  function executeTopUp() {
    const domain = scannedCitizen ? scannedCitizen.domain : 'citizen.IN$DEX';
    document.getElementById('successDomain').textContent = domain;
    document.getElementById('successAmount').textContent = '$' + topUpAmt.toFixed(2);
    document.getElementById('successSub').textContent = 'No real USDC or INDX has moved for ' + domain + ' — cash-to-USDC settlement isn\'t automated yet.';
    showToast('Logged only — ' + domain + ' has not actually been credited.');
    // GOD MODE PATCH: persist this logged (not settled) top-up to the local session log
    logTopup({ domain: domain, amount: topUpAmt, ts: Date.now() });
    goToStep(4);
  }

  function resetFlow() {
    scannedCitizen = null;
    topUpAmt = 50;
    document.getElementById('citizenPreview').classList.remove('show');
    document.getElementById('customTopUpInput').value = '';
    [10,20,50,100,200].forEach(v => { const b = document.getElementById('tp' + v); if(b) b.classList.remove('active'); });
    document.getElementById('tp50').classList.add('active');
    document.getElementById('step3Panel').classList.remove('show');
    document.getElementById('successPanel').classList.remove('show');
    updateConversion();
    goToStep(1);
    window.scrollTo({ top:0, behavior:'smooth' });
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
function h_2(event) { document.getElementById('customTopUpRow').classList.add('focused'); }


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
    }, { capture: true, passive: false }); })(EV.focus);

})();
