(function () {
  'use strict';
  var SB_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
  var $ = function (id) { return document.getElementById(id); };
  var state = { handle: '', phone: '', verified: false, events: [] };
  var step = 1;
  var busy = false;
  var cooldownTimer = null;

  function setErr(id, m) { $(id).textContent = m || ''; }
  function clearErrs() { ['e1', 'e2', 'e3'].forEach(function (i) { setErr(i, ''); }); }
  function setBusy(btn, on, label, idle) { busy = on; btn.disabled = on; btn.textContent = on ? label : idle; }
  function addEvent(type, payload) { state.events.push({ event_type: type, payload: payload || {}, client_ts: new Date().toISOString() }); state.events = state.events.slice(-20); }
  async function flushEvents() {
    if (!state.events.length) return;
    var list = state.events.slice(-20);
    try {
      var r = await sb.rpc('log_onboarding_events', { p_events: list });
      if (!r.error && r.data && r.data.ok) state.events = [];
    } catch (e) { /* best effort, never blocks the citizen */ }
  }

  function showStep(n, noFocus) {
    step = n;
    for (var i = 1; i <= 4; i++) $('s' + i).hidden = (i !== n);
    var lis = $('progress').children;
    for (var j = 0; j < lis.length; j++) lis[j].className = (n === 4 || j + 1 < n) ? 'done' : (j + 1 === n ? 'now' : '');
    $('count').textContent = n < 4 ? 'Step ' + n + ' of 3' : 'Done';
    if (!noFocus) { var h = $('s' + n).querySelector('h2'); if (h) try { h.focus(); } catch (e) {} }
    try { window.scrollTo(0, 0); } catch (e) {}
  }

  // Plain-language errors. Never show a raw technical message.
  function plain(e) {
    var m = String((e && (e.message || e.code)) || e || '').toLowerCase();
    if (!navigator.onLine || m.indexOf('failed to fetch') >= 0 || m.indexOf('network') >= 0 || m.indexOf('load failed') >= 0) return 'We could not reach the server. Check your connection and try again.';
    if (m.indexOf('captcha') >= 0) return 'The security check did not pass. Refresh the page and try again.';
    if (m.indexOf('rate limit') >= 0 || m.indexOf('too many') >= 0 || m.indexOf('seconds') >= 0 || m.indexOf('429') >= 0) return 'Too many tries. Wait a few minutes and try again.';
    if (m.indexOf('provider_disabled') >= 0 || m.indexOf('provider disabled') >= 0) return 'Text sign-in is switched off right now. Please try again later.';
    if (m.indexOf('hook') >= 0 || m.indexOf('unsupported phone') >= 0 || m.indexOf('invalid payload') >= 0 || m.indexOf('sms') >= 0) return 'We could not send a text to that number. Check it, with the country code, and try again.';
    if (m.indexOf('already') >= 0 && m.indexOf('email') >= 0) return 'That email is already used by another account.';
    if (m.indexOf('email') >= 0 && m.indexOf('invalid') >= 0) return 'That email does not look right. Check it and try again.';
    if (m.indexOf('expired') >= 0 || m.indexOf('invalid') >= 0 || m.indexOf('token') >= 0 || m.indexOf('otp') >= 0) return 'That code did not work or has expired. Send a new code and try again.';
    return 'Something went wrong on our side. Please try again in a moment.';
  }

  var sb;
  try {
    if (!window.supabase) throw new Error('load');
    sb = window.supabase.createClient(SB_URL, SB_KEY, window.IndxAuthOpts || undefined);
  } catch (e) {
    $('fatal').textContent = 'This page could not load. Refresh it and try again.';
    showStep(1, true);
    return;
  }

  // ---- input cleaning
  function cleanHandle(v) { return String(v || '').trim().toLowerCase().replace(/[^a-z0-9]/g, ''); }
  // Phone must carry a country code. Returns +digits, or null if it cannot be a real number.
  function normPhone(v) {
    var s = String(v || '').trim();
    var intl = /^\+/.test(s) || /^00/.test(s);
    var d = s.replace(/\D/g, '');
    if (/^00/.test(s)) d = d.slice(2);
    if (!intl) return null;
    if (/^610/.test(d)) d = '61' + d.slice(3); // +61 (0)4... : drop the local trunk zero
    if (d.length < 8 || d.length > 15) return null;
    if (/^61/.test(d) && d.length !== 11) return null; // Australia: +61 then 9 digits
    if (/^682/.test(d) && d.length !== 8) return null; // Cook Islands: +682 then 5 digits
    return '+' + d;
  }
  function showPhoneEcho() {
    var p = normPhone($('phone').value);
    $('phonePreview').textContent = p ? 'We will text ' + p : '';
  }
  $('handle').addEventListener('input', function () {
    var h = cleanHandle($('handle').value);
    $('preview').textContent = h ? h + '.INDEX' : '';
  });
  $('phone').addEventListener('input', showPhoneEcho);

  // ---- send the code (step 1 -> 2, and "send a new code")
  async function sendCode(btn, idle, errId) {
    if (busy) return false;
    setBusy(btn, true, 'Sending…', idle);
    try {
      try { await sb.auth.signOut({ scope: 'local' }); } catch (e) {} // never reuse an old session for a new number
      var opts = window.IndxCaptcha ? await window.IndxCaptcha.options({ shouldCreateUser: true }) : { shouldCreateUser: true };
      if (window.IndxCaptcha && window.IndxCaptcha.enabled() && !opts.captchaToken) {
        setErr(errId, 'The security check did not load. Refresh the page and try again.');
        setBusy(btn, false, '', idle);
        return false;
      }
      var res = await sb.auth.signInWithOtp({ phone: state.phone, options: opts });
      if (res.error) {
        // A 500 here means the text hook refused the number, so the message points at the number.
        setErr(errId, res.error.status >= 500 ? 'We could not send a text to that number. Check it, with the country code, and try again.' : plain(res.error));
        setBusy(btn, false, '', idle); return false;
      }
    } catch (e) { setErr(errId, plain(e)); setBusy(btn, false, '', idle); return false; }
    setBusy(btn, false, '', idle);
    return true;
  }
  function startCooldown() {
    var b = $('resend'), left = 60;
    if (cooldownTimer) clearInterval(cooldownTimer);
    b.disabled = true; b.textContent = 'Send a new code (' + left + ')';
    cooldownTimer = setInterval(function () {
      left--;
      if (left <= 0) { clearInterval(cooldownTimer); cooldownTimer = null; b.disabled = false; b.textContent = 'Send a new code'; }
      else b.textContent = 'Send a new code (' + left + ')';
    }, 1000);
  }

  // ---- Step 1: name + phone, "I'm in"
  $('f1').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    if (busy) return;
    clearErrs();
    var h = cleanHandle($('handle').value), phone = normPhone($('phone').value);
    if (h.length < 3 || h.length > 30) return setErr('e1', 'Choose a name of 3 to 30 letters and numbers. For example: yourname.');
    if (!phone) return setErr('e1', 'Check your phone number. Use the country code and the full number, like +682 12345 or +61 451 234 567.');
    state.handle = h;
    var phoneChanged = phone !== state.phone;
    state.phone = phone;
    if (state.verified && !phoneChanged) { await afterVerified(); return; }
    state.verified = false;
    setBusy($('b1'), true, 'Checking…', "I'm in");
    try {
      var av = await sb.rpc('check_domain_available', { p_domain: h });
      if (!av.error && av.data === false) { setBusy($('b1'), false, '', "I'm in"); return setErr('e1', 'That name is taken. Choose another.'); }
    } catch (e) { /* the database re-checks when the name is saved */ }
    setBusy($('b1'), false, '', "I'm in");
    if (await sendCode($('b1'), "I'm in", 'e1')) {
      $('sentTo').textContent = 'We texted a code to ' + phone + '.';
      $('otp').value = '';
      showStep(2); startCooldown();
    }
  });

  // ---- Step 2: verify the code
  $('f2').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    if (busy) return;
    setErr('e2', '');
    if (state.verified) { await afterVerified(); return; }
    var token = $('otp').value.replace(/\D/g, '');
    if (token.length < 4) return setErr('e2', 'Enter the code from the text message.');
    setBusy($('b2'), true, 'Checking…', 'Check code');
    try {
      var res = await sb.auth.verifyOtp({ phone: state.phone, token: token, type: 'sms' });
      if (res.error) { setErr('e2', plain(res.error)); setBusy($('b2'), false, '', 'Check code'); return; }
      state.verified = true;
      addEvent('otp_verified', { method: 'sms' });
    } catch (e) { setErr('e2', plain(e)); setBusy($('b2'), false, '', 'Check code'); return; }
    setBusy($('b2'), false, '', 'Check code');
    await afterVerified();
  });
  $('resend').addEventListener('click', async function () {
    clearErrs();
    if (await sendCode($('resend'), 'Send a new code', 'e2')) startCooldown();
  });
  $('back1').addEventListener('click', function () { clearErrs(); state.verified = false; showStep(1); });

  // After the phone is verified: save the name to the citizen record, then ask for email.
  async function afterVerified() {
    if (busy) return;
    var btn = $('b2'), idle = 'Check code';
    var onS1 = step === 1;
    var errId = onS1 ? 'e1' : 'e2';
    if (!onS1) { btn.textContent = 'Saving…'; }
    busy = true; btn.disabled = true;
    function done() { busy = false; btn.disabled = false; btn.textContent = idle; }
    try {
      var sess = await sb.auth.getSession();
      if (!(sess && sess.data && sess.data.session)) { done(); state.verified = false; showStep(1); return setErr('e1', 'Your sign-in did not carry over. Tap I\'m in to start again.'); }
      var prof = await sb.rpc('upsert_tier0_profile', { p_display_name: state.handle + '.INDEX / ' + state.phone, p_region: null, p_date_of_birth: null, p_guardian_email: null });
      if (prof.error || (prof.data && prof.data.ok === false)) { done(); return setErr(errId, 'We could not save your name. Tap again to retry.'); }
      var rd = await sb.rpc('reserve_domain', { p_domain: state.handle });
      var out = rd && rd.data;
      if (rd.error || !out || out.ok !== true) {
        done();
        if (out && out.error === 'taken') { showStep(1); return setErr('e1', 'That name was just taken. Choose another, then tap I\'m in.'); }
        if (out && out.error === 'invalid_length') { showStep(1); return setErr('e1', 'Choose a name of 3 to 30 letters and numbers.'); }
        return setErr(errId, 'We could not reserve your name. Tap again to retry.');
      }
      addEvent('name_reserved', { handle: state.handle, domain: state.handle + '.INDEX', issued: false });
      await flushEvents();
    } catch (e) { done(); return setErr(errId, plain(e)); }
    done();
    showStep(3);
  }

  // ---- Step 3: email
  function finish(note) {
    $('doneDomain').textContent = state.handle + '.INDEX';
    $('doneNote').textContent = note || '';
    showStep(4);
  }
  $('f3').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    if (busy) return;
    setErr('e3', '');
    var email = $('email').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr('e3', 'Enter a valid email, like you@example.com.');
    setBusy($('b3'), true, 'Sending…', 'Finish');
    var note = '';
    try {
      var res = await sb.auth.updateUser({ email: email });
      if (res.error) {
        var m = String(res.error.message || res.error.code || '').toLowerCase();
        if (m.indexOf('rate limit') >= 0 || m.indexOf('429') >= 0) note = 'We could not send the email link just now. Your name is saved.';
        else { setErr('e3', plain(res.error)); setBusy($('b3'), false, '', 'Finish'); return; }
      } else {
        addEvent('email_sent', { email_domain: email.split('@')[1] || '' });
        note = 'Check your email and tap the link to confirm it.';
      }
    } catch (e) { setErr('e3', plain(e)); setBusy($('b3'), false, '', 'Finish'); return; }
    addEvent('signup_completed', { tier: 'tier0', domain_issued: false, reserved_domain: state.handle + '.INDEX' });
    await flushEvents();
    setBusy($('b3'), false, '', 'Finish');
    finish(note);
  });
  $('skip').addEventListener('click', async function () {
    if (busy) return;
    addEvent('signup_completed', { tier: 'tier0', domain_issued: false, reserved_domain: state.handle + '.INDEX', email_given: false });
    await flushEvents();
    finish('You can add an email later.');
  });

  showStep(1, true);
})();
