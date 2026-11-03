
  const SUPABASE_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
  const SB_HEADERS = { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };
  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const citizenId = sessionStorage.getItem('citizen_id');

  // ── REAL AUTH FIX (God Mode) ──────────────────────────────────────────
  // Found 2026-07-23, same bug class already fixed in card-freeze.html and staking.html:
  // this screen's set_account_freeze calls sent the anon key as their own Bearer token,
  // but that function correctly has EXECUTE revoked from anon (verified via
  // information_schema.role_routine_grants) — meaning every real citizen's freeze,
  // unfreeze, and report-stolen attempt has been silently 403'ing. On an emergency-freeze
  // screen this is the exact false-sense-of-protection failure mode already flagged in
  // gotchas.md: a citizen who thinks they've frozen their account has not actually done so.
  // Fixed the same way as card-freeze.html — use the real Supabase Auth access_token when
  // a genuine session exists, anon key otherwise (no regression for today's common case).
  let _realAccessToken = null;
  async function initRealSession() {
    try {
      const { data } = await sb.auth.getSession();
      if (data && data.session && data.session.access_token) _realAccessToken = data.session.access_token;
    } catch (e) { /* stay on anon key */ }
  }
  function rpcHeaders() {
    return { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + (_realAccessToken || SUPABASE_ANON_KEY), 'Content-Type': 'application/json' };
  }

  let holdTimer = null;
  let holdInterval = null;
  let freezeStart = null;
  let frozenTimerInterval = null;

  async function loadFreezeState() {
    if (!citizenId) { document.getElementById('activeState').style.display = 'block'; return; }
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/citizens?id=eq.' + encodeURIComponent(citizenId) + '&select=account_frozen,account_frozen_at,indx_balance', { headers: rpcHeaders() });
      const rows = await res.json();
      const row = rows && rows[0];
      const bal = document.getElementById('balanceRow');
      if (bal && row) bal.textContent = Number(row.indx_balance || 0).toLocaleString(undefined,{maximumFractionDigits:2}) + ' INDX SAFE';
      if (row && row.account_frozen) {
        freezeStart = new Date(row.account_frozen_at || Date.now());
        document.getElementById('frozenAt').textContent = freezeStart.toLocaleTimeString();
        document.getElementById('activeState').style.display = 'none';
        document.getElementById('frozenState').style.display = 'block';
        startFrozenTimer();
      } else {
        document.getElementById('activeState').style.display = 'block';
      }
    } catch (e) { document.getElementById('activeState').style.display = 'block'; }
  }

  document.addEventListener('DOMContentLoaded', async function() {
    await initRealSession(); // GOD MODE PATCH — resolve real access token before any RPC call
    loadFreezeState();
    loadSecurityLog(); // GOD MODE PATCH — Feature 3: live security event log
  });

  function startHold() {
    let elapsed = 0;
    const total = 3000;
    const bar = document.getElementById('holdProgress');
    const label = document.getElementById('holdLabel');
    bar.style.transition = 'none'; bar.style.width = '0%';
    holdInterval = setInterval(() => {
      elapsed += 50;
      bar.style.width = Math.min((elapsed / total) * 100, 100) + '%';
      if (elapsed >= 1000) label.textContent = '🔴 Keep holding…';
      if (elapsed >= 2000) label.textContent = '🔴 Almost there…';
    }, 50);
    holdTimer = setTimeout(() => {
      clearInterval(holdInterval);
      executeFreeze();
    }, total);
  }

  function cancelHold() {
    clearTimeout(holdTimer);
    clearInterval(holdInterval);
    document.getElementById('holdProgress').style.width = '0%';
    document.getElementById('holdLabel').textContent = '🔴 Hold 3 seconds to freeze';
  }

  async function executeFreeze() {
    if (!citizenId) { showToast('Sign in to freeze your account'); return; }
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/set_account_freeze', {
        method: 'POST', headers: rpcHeaders(),
        body: JSON.stringify({ p_citizen_id: citizenId, p_frozen: true, p_reason: 'citizen_emergency_freeze' })
      });
      const data = await res.json();
      if (!res.ok || !data || data.success === false) { showToast('Could not freeze account — try again'); return; }
      freezeStart = new Date();
      document.getElementById('frozenAt').textContent = freezeStart.toLocaleTimeString();
      document.getElementById('activeState').style.display = 'none';
      document.getElementById('frozenState').style.display = 'block';
      startFrozenTimer();
      loadSecurityLog(); // GOD MODE PATCH — keep the log fresh after a real freeze
      showToast('🧊 Account frozen — real transfers, withdrawals and purchases are now blocked.');
    } catch (e) { showToast('Could not freeze account — connection error'); }
  }

  function startFrozenTimer() {
    clearInterval(frozenTimerInterval);
    frozenTimerInterval = setInterval(() => {
      const diff = Math.floor((new Date() - freezeStart) / 1000);
      const m = String(Math.floor(diff / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      document.getElementById('frozenTimer').textContent = m + ':' + s;
    }, 1000);
  }

  async function startUnfreeze() {
    if (!citizenId) { showToast('Sign in to unfreeze your account'); return; }
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/set_account_freeze', {
        method: 'POST', headers: rpcHeaders(),
        body: JSON.stringify({ p_citizen_id: citizenId, p_frozen: false })
      });
      const data = await res.json();
      if (!res.ok || !data || data.success === false) { showToast('Could not unfreeze — try again'); return; }
      clearInterval(frozenTimerInterval);
      document.getElementById('frozenState').style.display = 'none';
      document.getElementById('activeState').style.display = 'block';
      loadSecurityLog(); // GOD MODE PATCH — keep the log fresh after a real unfreeze
      showToast('✅ Account unfrozen — real transfers, withdrawals and purchases are allowed again.');
    } catch (e) { showToast('Could not unfreeze — connection error'); }
  }

  // Reports a real security_events row (T3) so there's a genuine trace, even though
  // there's no live support-ticketing system yet to guarantee a callback time — so we
  // don't promise a specific response window we can't back up.
  async function logCitizenReport(reasonText) {
    if (!citizenId) return false;
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/set_account_freeze', {
        method: 'POST', headers: rpcHeaders(),
        body: JSON.stringify({ p_citizen_id: citizenId, p_frozen: true, p_reason: 'citizen_report: ' + reasonText })
      });
      return res.ok;
    } catch (e) { return false; }
  }

  // ── CONFIRM-BEFORE-REPORT-STOLEN (God Mode Feature 2) ──
  // "Report device stolen" used to fire logCitizenReport() on a single tap with no
  // way back. This is a T3 event on a HVZ (Human Validation Zone)-adjacent action, so
  // it now requires an explicit second confirmation tap before it executes for real.
  function showConfirmStolen() {
    document.getElementById('confirmStolenModal').classList.add('show');
    trapFocus(document.querySelector('#confirmStolenModal .modal-card'));
  }

  function closeConfirmStolen() {
    document.getElementById('confirmStolenModal').classList.remove('show');
  }

  async function confirmReportStolen() {
    closeConfirmStolen();
    const ok = await logCitizenReport('device_stolen');
    if (ok) loadSecurityLog();
    showToast(ok ? '🚨 Reported and account frozen — logged to your security record.' : 'Could not log report — try again');
  }

  function showReportModal() {
    document.getElementById('reportModal').classList.add('show');
    trapFocus(document.querySelector('#reportModal .modal-card'));
  }

  let _selectedReason = 'unspecified';
  function selectReason(el) {
    document.querySelectorAll('.reason-option').forEach(r => r.classList.remove('selected'));
    el.classList.add('selected');
    _selectedReason = el.textContent.trim();
  }

  async function submitReport() {
    document.getElementById('reportModal').classList.remove('show');
    const ok = await logCitizenReport(_selectedReason);
    if (ok) loadSecurityLog();
    showToast(ok ? '✓ Reported and logged to your security record.' : 'Could not submit report — try again');
  }

  // ── VERIFY ACCOUNT STATUS (God Mode Feature 1) ──
  // Re-fetches the citizen's real DB row on demand rather than trusting whatever
  // this screen last rendered — grounds the claim in a fresh server read.
  async function verifyAccountStatus() {
    if (!citizenId) { showToast('Sign in to verify your account status'); return; }
    showToast('Checking your real account state…');
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/citizens?id=eq.' + encodeURIComponent(citizenId) + '&select=account_frozen,account_frozen_at', { headers: rpcHeaders() });
      const rows = await res.json();
      const row = rows && rows[0];
      if (!row) { showToast('Could not verify — try again'); return; }
      if (row.account_frozen) {
        showToast('✅ account_frozen = true on your real account — transfers, withdrawals, bill pay, ATM cash-out, and purchases are blocked while frozen.');
      } else {
        showToast('✅ account_frozen = false on your real account — it is not frozen. Tap freeze again if that seems wrong.');
      }
    } catch (e) { showToast('Could not verify — connection error'); }
  }

  // ── LIVE SECURITY EVENT LOG (God Mode Feature 3) ──
  // Real entries from security_events (zone: account_freeze) for this citizen —
  // not a fabricated or hardcoded log.
  function renderSecLogRow(r) {
    const dotClass = r.tier === 'T3' || r.tier === 'T4' ? 'red' : (r.tier === 'T2' ? 'gold' : 'green');
    const d = new Date(r.created_at);
    return '<div class="sl-item"><div class="sl-dot ' + dotClass + '"></div><div class="sl-body">' +
      '<div class="sl-event">' + r.description + '</div>' +
      '<div class="sl-time">' + d.toLocaleString('en-AU', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) + ' · ' + r.tier + '</div>' +
    '</div></div>';
  }

  async function loadSecurityLog() {
    const el = document.getElementById('secLogList');
    if (!el) return;
    if (!citizenId) { el.innerHTML = '<div class="sl-item"><div class="sl-body"><div class="sl-event" style="color:var(--text-muted);">Sign in to see your security log.</div></div></div>'; return; }
    try {
      const url = SUPABASE_URL + '/rest/v1/security_events?zone=eq.account_freeze&detail->>citizen_id=eq.' + encodeURIComponent(citizenId) + '&order=created_at.desc&limit=8&select=tier,description,created_at';
      const res = await fetch(url, { headers: rpcHeaders() });
      const rows = await res.json();
      if (!Array.isArray(rows) || !rows.length) {
        el.innerHTML = '<div class="sl-item"><div class="sl-body"><div class="sl-event" style="color:var(--text-muted);">No security events yet.</div></div></div>';
        return;
      }
      el.innerHTML = rows.map(renderSecLogRow).join('');
    } catch (e) {
      el.innerHTML = '<div class="sl-item"><div class="sl-body"><div class="sl-event" style="color:var(--text-muted);">Could not load security log.</div></div></div>';
    }
  }

  // ── KEYBOARD ACCESSIBILITY (God Mode Feature 4) ──
  // Escape-to-close + Tab focus-trap for both the report modal and the new
  // confirm-stolen sheet — neither had any keyboard handling before this.
  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    const rm = document.getElementById('reportModal');
    const cs = document.getElementById('confirmStolenModal');
    if (rm && rm.classList.contains('show')) rm.classList.remove('show');
    if (cs && cs.classList.contains('show')) closeConfirmStolen();
  });

  function trapFocus(containerEl) {
    if (!containerEl) return;
    const focusables = containerEl.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    setTimeout(function() { first.focus(); }, 50);
    if (containerEl._trapHandler) containerEl.removeEventListener('keydown', containerEl._trapHandler);
    const handler = function(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    containerEl.addEventListener('keydown', handler);
    containerEl._trapHandler = handler;
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.style.opacity = '1';
    setTimeout(() => t.style.opacity = '0', 2800);
  }

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { history.back(); }
function h_2(event) { window.location.href='account-recovery.html'; }
function h_3(event) { document.getElementById('reportModal').classList.remove('show'); }


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
    }, { capture: true, passive: false }); })(EV.mousedown);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, { capture: true, passive: false }); })(EV.touchstart);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, { capture: true, passive: false }); })(EV.mouseup);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, { capture: true, passive: false }); })(EV.touchend);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, { capture: true, passive: false }); })(EV.mouseleave);

})();
