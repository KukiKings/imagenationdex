
  const SUPABASE_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
  const { createClient } = supabase;
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, window.IndxAuthOpts);

  // ── REAL AUTH FIX (God Mode) ──────────────────────────────────────────
  // Found 2026-07-23, same bug class already fixed in staking.html/card-freeze.html/
  // emergency-freeze.html/guardian-setup.html/card-cashback.html/withdraw.html/
  // dispute.html/kyc-compliance.html: this screen's freeze-status SELECT and
  // set_account_freeze/set_card_freeze calls sent the anon key as their Bearer
  // token. Confirmed live-broken via information_schema/pg_policies:
  // `citizens` RLS requires auth.uid() = id for SELECT (anon key -> auth.uid() is
  // NULL -> the freeze-status check always silently returns zero rows), and
  // `set_account_freeze`/`set_card_freeze` have EXECUTE granted ONLY to
  // `authenticated`, not `anon` (role_routine_grants confirmed). Net effect: a
  // real frozen citizen recovering their account never actually got unfrozen —
  // the check silently found nothing to unfreeze. verifyOtp() already creates a
  // real Supabase Auth session; we just weren't using its token. Fixed the same
  // way as the other screens: use the real access_token once a session exists,
  // anon key otherwise.
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

  let currentScreen = 'screen1';
  let recovPhoneNum = '';

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    currentScreen = id;
  }

  function checkPhone() {
    const p = document.getElementById('recovPhone').value;
    document.getElementById('step1Btn').disabled = !(p.replace(/\D/g,'').length >= 8);
  }

  // ── REAL phone verification via Supabase Auth — same mechanism login.html uses ──
  async function goStep2() {
    // FIXED 2026-09-04: this field's own placeholder ("+61 4XX XXX XXX") tells citizens to
    // type spaces, and the raw value — spaces included — was going straight to
    // signInWithOtp/verifyOtp/get_citizen_by_phone. That's not the E.164 format every other
    // screen stores in citizens.phone_number, so a citizen recovering an account created
    // elsewhere (space-free number) could fail to match here even after a real OTP succeeds.
    // Strip everything but the leading + and digits — same normalization spirit as
    // quickstart-onboarding.html's e164Phone(), just no leading-zero stripping since this is
    // free-text international input, not a fixed-dial-code local-number field.
    recovPhoneNum = document.getElementById('recovPhone').value.trim().replace(/(?!^\+)[^\d]/g, '');
    const errEl = document.getElementById('recovError');
    errEl.textContent = '';
    const btn = document.getElementById('step1Btn');
    btn.disabled = true; btn.textContent = 'Sending…';
    try {
      const { error } = await sb.auth.signInWithOtp({ phone: recovPhoneNum, options: await IndxCaptcha.options() });
      if (error) {
        errEl.textContent = error.message;
        btn.disabled = false; btn.textContent = 'Send verification code';
        return;
      }
      document.getElementById('otpSub').textContent = 'We sent a real 6-digit code to ' + recovPhoneNum + '.';
      showScreen('screen1b');
      setTimeout(() => document.getElementById('ob0').focus(), 100);
      startResendCooldown();
    } catch (e) {
      errEl.textContent = 'Could not send code — try again';
      btn.disabled = false; btn.textContent = 'Send verification code';
    }
  }

  function otpMove(i) {
    const v = document.getElementById('ob' + i).value;
    if (v.length >= 1 && i < 5) document.getElementById('ob' + (i+1)).focus();
    const filled = [0,1,2,3,4,5].every(n => document.getElementById('ob'+n).value.length > 0);
    document.getElementById('otpBtn').disabled = !filled;
  }

  // GOD MODE: OTP BACKSPACE NAVIGATION + PASTE SUPPORT
  function otpKeyDown(e, i) {
    if (e.key === 'Backspace' && !e.target.value && i > 0) {
      document.getElementById('ob' + (i - 1)).focus();
    }
  }
  function otpPaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    for (let i = 0; i < 6; i++) document.getElementById('ob' + i).value = text[i] || '';
    const last = Math.min(text.length, 6) - 1;
    if (last >= 0) document.getElementById('ob' + last).focus();
    const filled = [0,1,2,3,4,5].every(n => document.getElementById('ob'+n).value.length > 0);
    document.getElementById('otpBtn').disabled = !filled;
  }

  // GOD MODE: RESEND COOLDOWN
  let resendCooldown = 0;
  let resendTimer = null;
  function startResendCooldown() {
    resendCooldown = 30;
    updateResendLabel();
    clearInterval(resendTimer);
    resendTimer = setInterval(() => {
      resendCooldown--;
      updateResendLabel();
      if (resendCooldown <= 0) clearInterval(resendTimer);
    }, 1000);
  }
  function updateResendLabel() {
    const el = document.getElementById('resendLink');
    if (!el) return;
    if (resendCooldown > 0) {
      el.textContent = `Resend in ${resendCooldown}s`;
      el.style.cursor = 'default';
      el.style.color = 'var(--text-dim)';
    } else {
      el.textContent = 'Resend';
      el.style.cursor = 'pointer';
      el.style.color = 'var(--cyan)';
    }
  }
  // ── REAL resend — calls Supabase Auth again, no fake "sent" toast without a real send ──
  async function resendCode() {
    if (resendCooldown > 0) return;
    try {
      const { error } = await sb.auth.signInWithOtp({ phone: recovPhoneNum, options: await IndxCaptcha.options() });
      if (error) { showToast(error.message || 'Could not resend'); return; }
      showToast('New code sent ✓');
      startResendCooldown();
    } catch (e) {
      showToast('Could not resend — try again');
    }
  }

  // ── REAL verification: Supabase Auth OTP check → real citizen lookup → real freeze lift ──
  async function verifyOTP() {
    const code = [0,1,2,3,4,5].map(n => document.getElementById('ob'+n).value).join('');
    const btn = document.getElementById('otpBtn');
    btn.disabled = true; btn.textContent = 'Verifying…';
    try {
      const { error: otpError } = await sb.auth.verifyOtp({ phone: recovPhoneNum, token: code, type: 'sms' });
      if (otpError) {
        showToast(otpError.message || 'Invalid code — try again');
        btn.disabled = false; btn.textContent = 'Verify';
        return;
      }

      await initRealSession(); // GOD MODE PATCH — resolve real access token before any RPC call

      const rpcPhone = IndxPhone.forRpc(recovPhoneNum);
      if (!rpcPhone) {
        IndxPhone.log('account-recovery', 'invalid-phone');
        showToast('Enter your full phone number');
        btn.disabled = false; btn.textContent = 'Verify';
        return;
      }
      const lookupRes = await fetch(SUPABASE_URL + '/rest/v1/rpc/get_citizen_by_phone', {
        method: 'POST', headers: rpcHeaders(), body: JSON.stringify({ p_phone: rpcPhone })
      });
      const citizen = await lookupRes.json().catch(() => null);
      if (IndxPhone.isNotAuthenticated(citizen)) {
        IndxPhone.log('account-recovery', 'not-authenticated');
        window.location.href = 'login.html';
        return;
      }
      if (!citizen || !citizen.id) {
        IndxPhone.log('account-recovery', 'null');
        showToast('No IN$DEX account found for this phone');
        btn.disabled = false; btn.textContent = 'Verify';
        return;
      }

      sessionStorage.setItem('citizen_id', citizen.id);
      sessionStorage.setItem('citizen_name', citizen.citizen_name || '');
      sessionStorage.setItem('citizen_wisdom', citizen.wisdom_score ?? 0);
      sessionStorage.setItem('citizen_balance', citizen.indx_balance ?? 0);
      sessionStorage.setItem('citizen_web3_domain', citizen.web3_domain || '');

      // GOD MODE FIX (2026-08-29): a founder-imposed security freeze can no
      // longer be self-lifted by phone re-verification (set_account_freeze /
      // set_card_freeze now reject that server-side) -- this used to fire the
      // unfreeze request and claim success unconditionally, regardless of
      // whether the RPC actually succeeded. Now checks the real response.
      let wasFrozen = false;
      let freezeBlocked = false;
      try {
        const freezeRes = await fetch(SUPABASE_URL + '/rest/v1/citizens?id=eq.' + citizen.id + '&select=account_frozen,card_frozen', { headers: rpcHeaders() });
        const freezeRows = await freezeRes.json();
        const row = freezeRows[0] || {};
        if (row.account_frozen) {
          const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/set_account_freeze', { method: 'POST', headers: rpcHeaders(), body: JSON.stringify({ p_citizen_id: citizen.id, p_frozen: false }) });
          // FIXED 2026-09 (Approval Gateway wiring): r.ok only reflects the HTTP
          // status -- a gated RPC still returns HTTP 200 with a JSON body of
          // {success:false, pending_approval:true}, which r.ok alone can't see.
          // Must parse the body to know whether the freeze was actually lifted.
          const rBody = r.ok ? await r.json().catch(() => null) : null;
          if (rBody && rBody.success) { wasFrozen = true; } else { freezeBlocked = true; }
        }
        if (row.card_frozen) {
          const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/set_card_freeze', { method: 'POST', headers: rpcHeaders(), body: JSON.stringify({ p_citizen_id: citizen.id, p_frozen: false }) });
          const rBody = r.ok ? await r.json().catch(() => null) : null;
          if (rBody && rBody.success) { wasFrozen = true; } else { freezeBlocked = true; }
        }
      } catch (e) { /* freeze lift is best-effort — recovery still proceeds even if this check fails */ }

      document.getElementById('restoredBalance').textContent = 'INDX balance: ' + (parseFloat(citizen.indx_balance) || 0).toLocaleString() + ' INDX';
      document.getElementById('restoredWisdom').textContent = 'Wisdom Score: ' + (citizen.wisdom_score ?? 0) + ' pts';
      document.getElementById('restoredDomain').textContent = 'Domain: ' + (citizen.web3_domain || 'not claimed yet');
      if (wasFrozen) {
        document.getElementById('restoredFreezeRow').style.display = 'flex';
      }
      if (freezeBlocked) {
        document.getElementById('restoredFreezeRow').style.display = 'flex';
        document.getElementById('restoredFreeze').textContent = 'Your account is frozen pending a security review and could not be lifted by phone verification alone — contact support.';
        document.getElementById('restoredFreezeRow').querySelector('.ri-check').textContent = '⚠';
        document.getElementById('restoredIcon').textContent = '⚠️';
        document.getElementById('restoredTitle').textContent = 'Identity verified — account still frozen';
        document.getElementById('restoredSub').textContent = 'Your phone is confirmed, but this freeze needs a security review before it can be lifted.';
      }

      setProgress(2);
      showScreen('screen3');
    } catch (e) {
      showToast('Verification failed — try again');
      btn.disabled = false; btn.textContent = 'Verify';
    }
  }

  function setProgress(step) {
    // step 0=verify, 1=recover, 2=restored
    const circles = ['pc1','pc2','pc3'];
    const labels = ['pl1','pl2','pl3'];
    const lines = ['line1','line2'];
    circles.forEach((id, i) => {
      const el = document.getElementById(id);
      el.className = 'prog-circle ' + (i < step ? 'done' : i === step ? 'active' : 'pending');
      if (i < step) el.textContent = '✓';
      else el.textContent = i + 1;
      document.getElementById(labels[i]).className = 'prog-label' + (i === step ? ' active' : '');
    });
    lines.forEach((id, i) => {
      document.getElementById(id).className = 'prog-line' + (i < step ? ' done' : '');
    });
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.style.opacity = '1';
    setTimeout(() => t.style.opacity = '0', 2500);
  }

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { history.back(); }
function h_2(event) { window.location.href='citizen-dashboard.html'; }


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
    }, { capture: true, passive: false }); })(EV.keydown);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, { capture: true, passive: false }); })(EV.paste);

})();
