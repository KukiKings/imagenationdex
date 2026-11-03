
  const SUPABASE_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const citizenId = sessionStorage.getItem('citizen_id');
  const INDX_PRICE_USD = 0.24;
  let withdrawAmt = 50;
  let pinEntry = '';
  let countdownTimer = null;
  let genInFlight = false;

  // Real usage figures pulled from get_atm_daily_usage — replaces the old
  // hardcoded $420/$80/$48 and sessionStorage-guessed balance.
  let usage = { daily_limit_usd: 500, used_today_usd: 0, remaining_today_usd: 500, card_balance_usd: 0 };

  let _realAccessToken = null;
  async function initRealSession() {
    try { const { data } = await sb.auth.getSession(); if (data && data.session && data.session.access_token) _realAccessToken = data.session.access_token; } catch (e) {}
  }
  function rpcHeaders() { return { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + (_realAccessToken || SUPABASE_ANON_KEY), 'Content-Type': 'application/json' }; }

  async function rpc(name, body) {
    const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + name, {
      method: 'POST', headers: rpcHeaders(), body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  }

  async function init() {
    await initRealSession();
    const domain = sessionStorage.getItem('citizen_web3_domain') || 'arthur.IN$DEX';
    document.getElementById('qrDomain').textContent = domain + ' · INDX';

    if (!citizenId) {
      showToast('No citizen session found — please log in');
      updateGenerateBtn();
      return;
    }

    try {
      usage = await rpc('get_atm_daily_usage', { p_citizen_id: citizenId });
      const wisdom = usage.wisdom_score || 0;
      const tierLabel = wisdom >= 200 ? 'Tier 3 · $5,000/day' : wisdom >= 100 ? 'Tier 2 · $2,000/day' : 'Tier 1 · $500/day';
      document.getElementById('atmTierBadge').textContent = tierLabel;
      document.getElementById('atmBarMax').textContent = '$' + usage.daily_limit_usd.toLocaleString() + ' daily limit';
      document.getElementById('atmRemaining').textContent = '$' + usage.remaining_today_usd.toLocaleString();
      document.getElementById('atmUsed').textContent = '$' + usage.used_today_usd.toLocaleString();
      document.getElementById('atmBalance').textContent = '$' + usage.card_balance_usd.toLocaleString();
      document.querySelector('.lh-bar-label span').textContent = '$' + usage.used_today_usd.toLocaleString() + ' used';
      const pct = usage.daily_limit_usd > 0 ? Math.min(100, (usage.used_today_usd / usage.daily_limit_usd) * 100) : 0;
      document.getElementById('atmBarFill').style.width = pct + '%';
    } catch (e) {
      showToast('Could not load your real balance/limits right now');
    }

    try {
      const pinStatus = await rpc('get_atm_pin_status', { p_citizen_id: citizenId });
      document.getElementById('pinStatusSub').textContent = pinStatus.pin_set
        ? 'PIN set ' + new Date(pinStatus.set_at).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'})
        : 'No PIN set yet — used for physical card withdrawals';
    } catch (e) {}

    renderHistory();
    updateGenerateBtn();
  }

  function selectWithdrawAmt(a) {
    withdrawAmt = a;
    [20,50,100,200,400].forEach(v => {
      const el = document.getElementById('atm' + v);
      if (el) el.classList.toggle('active', v === a);
    });
    document.getElementById('atmCustomBtn').classList.remove('active');
    document.getElementById('customWithdrawInput').value = '';
    updateGenerateBtn();
  }

  function focusCustomWithdraw() {
    [20,50,100,200,400].forEach(v => { const el = document.getElementById('atm' + v); if(el) el.classList.remove('active'); });
    document.getElementById('atmCustomBtn').classList.add('active');
    document.getElementById('customWithdrawInput').focus();
  }

  function onCustomWithdrawFocus() {
    document.getElementById('customWithdrawRow').classList.add('focused');
  }

  function onCustomWithdrawInput(v) {
    const n = parseFloat(v);
    withdrawAmt = isNaN(n) ? 0 : n;
    updateGenerateBtn();
  }

  function updateGenerateBtn() {
    const btn = document.getElementById('generateBtn');
    const lbl = document.getElementById('generateBtnLabel');
    const cardBal = usage.card_balance_usd;
    const remaining = usage.remaining_today_usd;
    const errBanner = document.getElementById('amtErrorBanner');
    const errMsg = document.getElementById('amtErrorMsg');

    if (genInFlight) {
      btn.disabled = true; return;
    }
    if (withdrawAmt <= 0) {
      btn.disabled = true; lbl.textContent = 'Select an amount';
      errBanner.classList.remove('show');
    } else if (withdrawAmt > cardBal) {
      btn.disabled = true; lbl.textContent = 'Insufficient card balance';
      errMsg.textContent = 'Amount ($' + withdrawAmt.toFixed(2) + ') exceeds card balance ($' + cardBal.toFixed(2) + ')';
      errBanner.classList.add('show');
    } else if (withdrawAmt > remaining) {
      btn.disabled = true; lbl.textContent = 'Exceeds remaining daily limit';
      errMsg.textContent = 'Amount exceeds your remaining $' + remaining.toLocaleString() + ' today';
      errBanner.classList.add('show');
    } else {
      btn.disabled = false;
      lbl.textContent = 'Generate Code for $' + withdrawAmt.toFixed(0);
      errBanner.classList.remove('show');
    }
  }

  async function generateWithdrawCode() {
    if (genInFlight) return;
    if (!citizenId) { showToast('No citizen session found — please log in'); return; }
    genInFlight = true;
    updateGenerateBtn();

    try {
      const result = await rpc('generate_atm_withdrawal', { p_citizen_id: citizenId, p_amount_usd: withdrawAmt });

      // Approval Gateway: generate_atm_withdrawal is risk_class >= 3 in agent_registry, so a
      // first call can come back {success:false, pending_approval:true, intent_id} instead of
      // executing -- rpc() only throws on a non-2xx status, so this must be checked explicitly
      // or a pending request would render as "Code undefined generated".
      if (result && result.pending_approval) {
        genInFlight = false;
        updateGenerateBtn();
        await showAtmGate(result.intent_id);
        return;
      }

      showGeneratedCode(result);
      await init();
    } catch (e) {
      const msg = e.message.includes('ACCOUNT_FROZEN') ? 'Your account is frozen — withdrawal blocked'
        : e.message.includes('CARD_FROZEN') ? 'Your card is frozen — withdrawal blocked'
        : e.message.includes('Exceeds daily') ? 'This exceeds your remaining daily limit'
        : e.message.includes('Insufficient') ? "You don't have enough INDX for this withdrawal"
        : 'Could not generate code — please try again';
      showToast(msg);
    } finally {
      genInFlight = false;
      updateGenerateBtn();
    }
  }

  function showGeneratedCode(result) {
    document.getElementById('qrAmountDisplay').textContent = '$' + withdrawAmt.toFixed(2);
    const qrEl = document.getElementById('qrDisplay');
    qrEl.classList.add('show');
    qrEl.scrollIntoView({ behavior:'smooth' });
    qrEl.classList.remove('pulse-once');
    void qrEl.offsetWidth;
    qrEl.classList.add('pulse-once');
    startCountdown(60);
    showToast('✓ Code ' + result.receipt_code + ' generated · Real ATM dispensing not connected yet');
  }

  async function showAtmGate(intentId) {
    let card = null;
    try { card = await rpc('get_action_intent_card', { p_intent_id: intentId }); } catch (e) {}
    document.getElementById('gateText').textContent =
      (card && !card.error && card.data_involved) ? card.data_involved
        : `Generate an ATM code for $${withdrawAmt.toFixed(2)} needs your explicit approval before it can complete.`;
    document.getElementById('gateOverlay').classList.add('show');

    document.getElementById('gateCancelBtn').onclick = function () {
      document.getElementById('gateOverlay').classList.remove('show');
    };

    document.getElementById('gateApproveBtn').onclick = async function () {
      const gbtn = document.getElementById('gateApproveBtn');
      gbtn.textContent = 'Generating…'; gbtn.disabled = true;
      try {
        const grant = await rpc('grant_intent_approval', { p_intent_id: intentId, p_level: 1, p_method: 'citizen_app_confirm' });
        if (!grant || !grant.success) throw new Error('Approval could not be recorded.');
        const result2 = await rpc('generate_atm_withdrawal', { p_citizen_id: citizenId, p_amount_usd: withdrawAmt });
        if (result2 && result2.pending_approval) throw new Error('Approval did not clear — please try again.');
        document.getElementById('gateOverlay').classList.remove('show');
        showGeneratedCode(result2);
        await init();
      } catch (e) {
        document.getElementById('gateOverlay').classList.remove('show');
        showToast(e.message || 'Could not generate code — please try again');
      } finally {
        gbtn.textContent = 'Approve & Generate Code'; gbtn.disabled = false;
      }
    };
  }

  function startCountdown(secs) {
    clearInterval(countdownTimer);
    let remaining = secs;
    const circle = document.getElementById('countdownCircle');
    const numEl  = document.getElementById('countdownNum');
    const circumference = 213.6;
    function tick() {
      remaining--;
      numEl.textContent = remaining;
      const offset = circumference * (1 - remaining / secs);
      circle.style.strokeDashoffset = offset;
      if (remaining <= 10) circle.style.stroke = 'var(--red)';
      if (remaining <= 0) {
        clearInterval(countdownTimer);
        document.getElementById('qrDisplay').classList.remove('show');
        showToast('⏱ Code expired. Generate a new one.');
      }
    }
    countdownTimer = setInterval(tick, 1000);
  }

  function cancelQR() {
    clearInterval(countdownTimer);
    document.getElementById('qrDisplay').classList.remove('show');
    document.getElementById('countdownCircle').style.stroke = 'var(--cyan)';
    document.getElementById('countdownCircle').style.strokeDashoffset = '0';
  }

  function showPinSheet() {
    pinEntry = '';
    updatePinDots();
    document.getElementById('pinSheetTitle').textContent = 'Change PIN';
    document.getElementById('pinSheetSub').textContent = 'Enter a new 4-digit PIN for ATM withdrawals. Once set, it can never be shown back to you — only changed.';
    document.getElementById('pinOverlay').classList.add('show');
  }

  function closePinSheet(e) {
    if (!e || e.target.id === 'pinOverlay') document.getElementById('pinOverlay').classList.remove('show');
  }

  function pinKey(k) {
    if (k === 'clear') { pinEntry = ''; }
    else if (k === 'back') { pinEntry = pinEntry.slice(0, -1); }
    else if (pinEntry.length < 4) { pinEntry += k; }
    updatePinDots();
    document.getElementById('pinConfirmBtn').disabled = pinEntry.length < 4;
    document.getElementById('pinConfirmBtn').style.opacity = pinEntry.length < 4 ? '0.35' : '1';
  }

  function updatePinDots() {
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById('pd' + i);
      if (dot) dot.classList.toggle('filled', i < pinEntry.length);
    }
  }

  async function confirmPin() {
    if (pinEntry.length !== 4) return;
    if (!citizenId) { showToast('No citizen session found — please log in'); return; }
    const pin = pinEntry;
    document.getElementById('pinOverlay').classList.remove('show');
    pinEntry = '';
    updatePinDots();
    try {
      await rpc('set_atm_pin', { p_citizen_id: citizenId, p_pin: pin });
      showToast('✅ PIN updated. Your new PIN is active.');
      const pinStatus = await rpc('get_atm_pin_status', { p_citizen_id: citizenId });
      document.getElementById('pinStatusSub').textContent = 'PIN set ' + new Date(pinStatus.set_at).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'});
    } catch (e) {
      showToast('Could not update PIN — please try again');
    }
  }

  // Real navigation action: opens an actual Google Maps search for the named
  // location. Distance/live ATM network data isn't connected — see the
  // disclosure line under the list.
  function openAtmMap(query) {
    window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query), '_blank');
  }

  // Real withdrawal history, backed by get_atm_withdrawal_history
  async function renderHistory() {
    const el = document.getElementById('historyList');
    if (!citizenId) { el.innerHTML = '<div style="padding:16px 0;text-align:center;color:var(--text-muted);font-size:13px;">Log in to see your real withdrawal history.</div>'; return; }
    try {
      const hist = await rpc('get_atm_withdrawal_history', { p_citizen_id: citizenId, p_limit: 10 });
      if (!hist.length) {
        el.innerHTML = '<div style="padding:16px 0;text-align:center;color:var(--text-muted);font-size:13px;">No real withdrawals yet.</div>';
        return;
      }
      el.innerHTML = hist.map(h => `
        <div class="hist-item" data-action="showHistDetail" data-args="${indxJ([h])}">
          <div class="hist-icon">🏧</div>
          <div class="hist-body">
            <div class="hist-name">Cardless ATM Withdrawal</div>
            <div class="hist-meta">${new Date(h.created_at).toLocaleDateString('en-AU',{day:'numeric',month:'short'})} · ${h.receipt_code} · ${h.status}</div>
          </div>
          <div class="hist-amount">−$${parseFloat(h.amount_usd).toFixed(2)}</div>
        </div>`).join('');
    } catch (e) {
      el.innerHTML = '<div style="padding:16px 0;text-align:center;color:var(--text-muted);font-size:13px;">Could not load history right now.</div>';
    }
  }

  function showHistDetail(tx) {
    document.getElementById('histDetailTitle').textContent = 'Cardless ATM Withdrawal';
    document.getElementById('hdAmount').textContent = '−$' + parseFloat(tx.amount_usd).toFixed(2);
    document.getElementById('hdLocation').textContent = 'Cardless (no ATM network connected yet)';
    document.getElementById('hdMethod').textContent = 'Cardless QR';
    document.getElementById('hdPqsi').textContent = tx.status === 'pending' ? 'Pending — not yet settled' : tx.status;
    document.getElementById('hdRef').textContent = tx.receipt_code;
    document.getElementById('histOverlay').classList.add('show');
  }
  function closeHistDetail(e) {
    if (!e || e.target.id === 'histOverlay') document.getElementById('histOverlay').classList.remove('show');
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
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => { t.style.opacity = '0'; }, 3500);
  }

  document.addEventListener('DOMContentLoaded', init);

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { history.back(); }


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
    }, { capture: true, passive: false }); })(EV.focus);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, { capture: true, passive: false }); })(EV.input);

})();
