
  const WL_SUPA_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
  const WL_SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
  // `base` is also read/written by joinWaitlist() further down (queue position = base + 1) — keep
  // it in this shared top-level scope, not local to this IIFE, or that line throws ReferenceError.
  let base = 0;
  // Separate client instance (harmless — supabase-js allows multiple) used only for
  // email OTP auth calls below, so the existing count IIFE above is left untouched.
  const wlAuthClient = supabase.createClient(WL_SUPA_URL, WL_SUPA_KEY);
  (async () => {
    try {
      const sb = supabase.createClient(WL_SUPA_URL, WL_SUPA_KEY);
      const { data } = await sb.rpc('get_waitlist_count');
      if (typeof data === 'number' && data >= 0) base = data;
    } catch (e) {}
    const el = document.getElementById('waitlistCount');
    if (el) el.textContent = base.toLocaleString();
  })();

  // ── AUTO-FILL REF CODE FROM URL ──
  // Preserves referral attribution when citizen arrives via genesis-offer.html or a shared link
  (function autoFillRef() {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (!ref) return;
    document.addEventListener('DOMContentLoaded', () => {
      const refInput = document.getElementById('refInput');
      if (refInput) {
        refInput.value = ref;
        refInput.dispatchEvent(new Event('input')); // triggers checkRef() badge
      }
    });
  })();

  let selectedRegion = 'Fiji';
  function selectRegion(el, region) {
    document.querySelectorAll('.region-btn').forEach(b => { b.classList.remove('selected'); b.setAttribute('aria-checked','false'); b.tabIndex = -1; });
    el.classList.add('selected');
    // GOD MODE PATCH — aria-checked/roving tabindex for keyboard users + draft autosave
    el.setAttribute('aria-checked','true');
    el.tabIndex = 0;
    selectedRegion = region;
    wlSaveDraft();
  }

  function checkRef() {
    const val = document.getElementById('refInput').value.trim();
    const badge = document.getElementById('refBadge');
    badge.classList.toggle('show', val.length >= 4);
    // GOD MODE PATCH — keep the saved draft in sync with the referral code field
    wlSaveDraft();
  }

  // ── GOD MODE PATCH: 4 additive features (form draft persistence, accessibility,
  // real-time field feedback, "why we verify" info sheet). None of this touches the
  // OTP verification screen, its copy, or its logic above/below. ──

  const WL_DRAFT_KEY = 'indx_waitlist_draft';

  // Data persistence — remember partially-filled fields across navigations/reloads
  function wlSaveDraft() {
    try {
      const draft = {
        name: document.getElementById('nameInput').value,
        contact: document.getElementById('contactInput').value,
        region: selectedRegion,
        ref: document.getElementById('refInput').value
      };
      localStorage.setItem(WL_DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {}
  }

  function wlRestoreDraft() {
    let draft = null;
    try { draft = JSON.parse(localStorage.getItem(WL_DRAFT_KEY) || 'null'); } catch (e) { draft = null; }
    if (!draft) return;
    const refParam = new URLSearchParams(window.location.search).get('ref');
    const nameEl = document.getElementById('nameInput');
    const contactEl = document.getElementById('contactInput');
    const refEl = document.getElementById('refInput');
    if (draft.name && nameEl && !nameEl.value) nameEl.value = draft.name;
    if (draft.contact && contactEl && !contactEl.value) contactEl.value = draft.contact;
    // Don't clobber a real ?ref= link with a stale saved draft ref
    if (!refParam && draft.ref && refEl && !refEl.value) {
      refEl.value = draft.ref;
      refEl.dispatchEvent(new Event('input'));
    }
    if (draft.region) {
      const btn = Array.prototype.find.call(document.querySelectorAll('.region-btn'), b => {
        const nameSpan = b.querySelector('.region-name');
        return nameSpan && nameSpan.textContent === draft.region;
      });
      if (btn) selectRegion(btn, draft.region);
    }
    wlCheckNameField();
    wlCheckContactField();
  }

  function wlClearDraft() {
    try { localStorage.removeItem(WL_DRAFT_KEY); } catch (e) {}
  }

  // Real-time feedback — inline validity hints as the citizen types (display-only;
  // never replaces or bypasses the real submit-time / OTP checks elsewhere in this file)
  function wlCheckNameField() {
    const el = document.getElementById('nameInput');
    const status = document.getElementById('nameStatus');
    if (!el || !status) return;
    const v = el.value.trim();
    if (!v) { status.textContent = ''; status.className = 'field-status'; }
    else if (v.length > 80) { status.textContent = 'Too long — keep it under 80 characters'; status.className = 'field-status bad'; }
    else { status.textContent = '✓ Looks good'; status.className = 'field-status ok'; }
    wlSaveDraft();
  }

  function wlCheckContactField() {
    const el = document.getElementById('contactInput');
    const status = document.getElementById('contactStatus');
    if (!el || !status) return;
    const v = el.value.trim();
    if (!v) { status.textContent = ''; status.className = 'field-status'; wlSaveDraft(); return; }
    if (EMAIL_RE.test(v)) { status.textContent = '✓ Valid email — a code will be sent here'; status.className = 'field-status ok'; }
    else if (PHONE_RE.test(v)) { status.textContent = '✓ Valid phone number'; status.className = 'field-status ok'; }
    else { status.textContent = 'Enter a valid email or phone number'; status.className = 'field-status bad'; }
    wlSaveDraft();
  }

  // Accessibility — arrow-key / space / enter navigation across the region radiogroup
  function wlRegionKeyNav(e) {
    const keys = ['ArrowRight','ArrowLeft','ArrowDown','ArrowUp',' ','Enter'];
    if (keys.indexOf(e.key) === -1) return;
    const btns = Array.prototype.slice.call(document.querySelectorAll('.region-btn'));
    const idx = btns.indexOf(document.activeElement);
    if (idx === -1) return;
    e.preventDefault();
    if (e.key === ' ' || e.key === 'Enter') { document.activeElement.click(); return; }
    let next = idx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % btns.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + btns.length) % btns.length;
    btns[next].focus();
  }

  // "Why we verify" info sheet — purely informational, additive
  function openWhyVerifySheet() {
    document.getElementById('wlInfoOverlay').classList.add('show');
    document.getElementById('wlInfoSheet').classList.add('show');
  }
  function closeWhyVerifySheet() {
    document.getElementById('wlInfoOverlay').classList.remove('show');
    document.getElementById('wlInfoSheet').classList.remove('show');
  }

  // SUPABASE CONFIG
  const SUPABASE_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;

  // Holds {name, contact, region, referredBy} while an email signup is waiting on
  // its OTP code, so wlVerifyOtp() can finish the submission after a real code check.
  let pendingSignup = null;

  async function joinWaitlist() {
    const name = document.getElementById('nameInput').value.trim();
    const contact = document.getElementById('contactInput').value.trim();
    if (!name) { showToast('Enter your name first.'); return; }
    if (name.length > 80) { showToast('Name is too long keep it under 80 characters.'); return; }
    if (!contact) { showToast('Add a phone or email we\'ll notify you.'); return; }
    if (contact.length > 120) { showToast('Contact is too long.'); return; }
    const isEmail = EMAIL_RE.test(contact);
    const isPhone = PHONE_RE.test(contact);
    if (!isEmail && !isPhone) { showToast('Use a valid email or phone number (e.g. +679 123 4567).'); return; }

    // Get selected region
    const regionBtn = document.querySelector('.region-btn.selected .region-name');
    const region = regionBtn ? regionBtn.textContent : null;

    // Get referral code if entered
    const referredBy = document.getElementById('refInput').value.trim() || null;

    // ── REAL email OTP gate (God Mode) ──────────────────────────────────────
    // Email signups get a real Supabase Auth code before join_waitlist ever runs,
    // so a queue position/application number can't be claimed with an email nobody
    // controls. Phone-only signups still submit directly below — same honest gap
    // account-recovery.html already discloses for its own phone-only OTP ("Email-code
    // recovery isn't built yet"), just the other direction. Not silently claiming
    // phone signups are verified when they aren't.
    if (isEmail) {
      const btn = document.getElementById('submitBtn');
      btn.textContent = 'Sending code...';
      btn.disabled = true;
      try {
        const { error } = await wlAuthClient.auth.signInWithOtp({ email: contact });
        if (error) {
          showToast(error.message || 'Could not send code. Please try again.');
          btn.textContent = 'Apply as a Founding Citizen';
          btn.disabled = false;
          return;
        }
      } catch (e) {
        showToast('Could not send code. Please try again.');
        btn.textContent = 'Apply as a Founding Citizen';
        btn.disabled = false;
        return;
      }
      pendingSignup = { name, contact, region, referredBy };
      document.getElementById('otpCardSub').textContent = 'We sent a real 6-digit code to ' + contact + '.';
      document.getElementById('signupForm').style.display = 'none';
      document.getElementById('otpCard').style.display = 'block';
      btn.textContent = 'Apply as a Founding Citizen';
      btn.disabled = false;
      [0,1,2,3,4,5].forEach(n => document.getElementById('wob'+n).value = '');
      document.getElementById('wlOtpBtn').disabled = true;
      setTimeout(() => document.getElementById('wob0').focus(), 100);
      wlStartResendCooldown();
      return;
    }

    await submitWaitlist(name, contact, region, referredBy);
  }

  async function submitWaitlist(name, contact, region, referredBy) {
    const btn = document.getElementById('submitBtn');
    const otpBtn = document.getElementById('wlOtpBtn');
    btn.textContent = 'Submitting application...';
    btn.disabled = true;

    try {
      // Calls the join_waitlist RPC instead of POSTing to the table directly.
      // The direct POST used Prefer: return=representation, which makes PostgREST
      // read the row back after inserting. SELECT on waitlist is founder-only, so
      // the read was denied and the whole insert rolled back — every public signup
      // failed with "Something went wrong" while the queue sequence still advanced.
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/join_waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          p_name: name, p_contact: contact,
          p_region: region, p_referred_by: referredBy
        })
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);
      const result = await res.json();

      if (!result.ok) {
        if (result.already_joined) {
          showToast('You\'re already on the list! Check your spot below.');
        } else {
          showToast(result.error || 'Could not save your spot. Please try again.');
        }
        btn.textContent = 'Apply as a Founding Citizen';
        btn.disabled = false;
        if (otpBtn) { otpBtn.disabled = false; otpBtn.textContent = 'Verify & join waitlist'; }
        return;
      }

      const refCode = result.referral_code;
      const applicationNumber = result.queue_position;
      const cohortPosition = result.total;

      // Mission Ledger identity link: lets the SIINDEX chat on this page (and
      // public-home.html) know which real citizen it's talking to, so goal/offer
      // capture writes to a persistent record instead of staying chat-only.
      if (result.id) {
        try { localStorage.setItem('siindex_citizen_waitlist_id', result.id); } catch (_) {}
      }

      // Link this waitlist row to the real auth session, if one exists (email
      // OTP path only — phone-only signups have no session to link, per the
      // honesty comment above). Best-effort, non-blocking: the row is already
      // saved either way, this just makes it re-readable later by the citizen
      // who owns it, via link_waitlist_to_session (see waitlist_auth_link_v1
      // migration, 2026-08-20). Without this, founding-citizen.html has no
      // safe way to look up a citizen's own application after signup.
      if (result.id) {
        try {
          const { data: { session } } = await wlAuthClient.auth.getSession();
          if (session) await wlAuthClient.rpc('link_waitlist_to_session', { p_waitlist_id: result.id });
        } catch (_) { /* best-effort — signup already succeeded regardless */ }
      }

      document.getElementById('signupForm').style.display = 'none';
      document.getElementById('otpCard').style.display = 'none';
      document.getElementById('shareCard').style.display = 'none';
      document.getElementById('successState').classList.add('show');
      document.getElementById('applicationNumber').textContent = '#' + applicationNumber.toLocaleString();
      document.getElementById('cohortPosition').textContent = '#' + cohortPosition.toLocaleString();
      document.getElementById('shareLink').textContent = 'https://imagenationdex.com/join?ref=' + refCode;
      base = result.total;
      document.getElementById('waitlistCount').textContent = result.total.toLocaleString();
      // GOD MODE PATCH — the application succeeded, so the saved draft is no longer needed
      wlClearDraft();

    } catch (e) {
      console.error('Waitlist error:', e);
      showToast('Something went wrong. Please try again.');
      btn.textContent = 'Apply as a Founding Citizen';
      btn.disabled = false;
      if (otpBtn) { otpBtn.disabled = false; otpBtn.textContent = 'Verify & join waitlist'; }
    }
  }

  // ── EMAIL OTP BOX HANDLERS — same interaction pattern as account-recovery.html's
  // phone OTP boxes (prefixed wl/wob to avoid colliding with that screen's ids/fns
  // if any script is ever shared between them) ──
  function wlOtpMove(i) {
    const v = document.getElementById('wob' + i).value;
    if (v.length >= 1 && i < 5) document.getElementById('wob' + (i+1)).focus();
    const filled = [0,1,2,3,4,5].every(n => document.getElementById('wob'+n).value.length > 0);
    document.getElementById('wlOtpBtn').disabled = !filled;
  }
  function wlOtpKeyDown(e, i) {
    if (e.key === 'Backspace' && !e.target.value && i > 0) {
      document.getElementById('wob' + (i - 1)).focus();
    }
  }
  function wlOtpPaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    for (let i = 0; i < 6; i++) document.getElementById('wob' + i).value = text[i] || '';
    const last = Math.min(text.length, 6) - 1;
    if (last >= 0) document.getElementById('wob' + last).focus();
    const filled = [0,1,2,3,4,5].every(n => document.getElementById('wob'+n).value.length > 0);
    document.getElementById('wlOtpBtn').disabled = !filled;
  }

  let wlResendCooldown = 0;
  let wlResendTimer = null;
  function wlStartResendCooldown() {
    wlResendCooldown = 30;
    wlUpdateResendLabel();
    clearInterval(wlResendTimer);
    wlResendTimer = setInterval(() => {
      wlResendCooldown--;
      wlUpdateResendLabel();
      if (wlResendCooldown <= 0) clearInterval(wlResendTimer);
    }, 1000);
  }
  function wlUpdateResendLabel() {
    const el = document.getElementById('wlResendLink');
    if (!el) return;
    if (wlResendCooldown > 0) {
      el.textContent = `Resend in ${wlResendCooldown}s`;
      el.style.cursor = 'default';
      el.style.color = 'var(--text-muted)';
    } else {
      el.textContent = 'Resend';
      el.style.cursor = 'pointer';
      el.style.color = 'var(--cyan)';
    }
  }
  async function wlResendCode() {
    if (wlResendCooldown > 0 || !pendingSignup) return;
    try {
      const { error } = await wlAuthClient.auth.signInWithOtp({ email: pendingSignup.contact });
      if (error) { showToast(error.message || 'Could not resend'); return; }
      showToast('New code sent ✓');
      wlStartResendCooldown();
    } catch (e) {
      showToast('Could not resend — try again');
    }
  }

  function wlOtpBack() {
    document.getElementById('otpCard').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
    pendingSignup = null;
    clearInterval(wlResendTimer);
    [0,1,2,3,4,5].forEach(n => document.getElementById('wob'+n).value = '');
    document.getElementById('otpError').textContent = '';
  }

  // ── REAL verification: Supabase Auth email OTP check → finish the signup ──
  async function wlVerifyOtp() {
    if (!pendingSignup) return;
    const code = [0,1,2,3,4,5].map(n => document.getElementById('wob'+n).value).join('');
    const btn = document.getElementById('wlOtpBtn');
    const errEl = document.getElementById('otpError');
    errEl.textContent = '';
    btn.disabled = true; btn.textContent = 'Verifying…';
    try {
      const { error } = await wlAuthClient.auth.verifyOtp({ email: pendingSignup.contact, token: code, type: 'email' });
      if (error) {
        errEl.textContent = error.message || 'Invalid code — try again';
        btn.disabled = false; btn.textContent = 'Verify & join waitlist';
        return;
      }
      const { name, contact, region, referredBy } = pendingSignup;
      pendingSignup = null;
      clearInterval(wlResendTimer);
      await submitWaitlist(name, contact, region, referredBy);
    } catch (e) {
      errEl.textContent = 'Verification failed — try again';
      btn.disabled = false; btn.textContent = 'Verify & join waitlist';
    }
  }

  const shareText = 'I joined the IN$DEX founding citizen cohort. Help test one real citizen journey and shape what gets built next:';
  const shareUrl = 'https://imagenationdex.com/join';

  function shareWA() { window.open('https://wa.me/?text=' + encodeURIComponent(shareText + ' ' + shareUrl)); }
  function shareTG() { window.open('https://t.me/share/url?url=' + encodeURIComponent(shareUrl) + '&text=' + encodeURIComponent(shareText)); }
  function shareSMS() { window.open('sms:?body=' + encodeURIComponent(shareText + ' ' + shareUrl)); }
  function copyLink() { navigator.clipboard.writeText(shareUrl).then(() => showToast('Link copied.')); }
  function copySuccessLink() {
    const link = document.getElementById('shareLink').textContent;
    navigator.clipboard.writeText(link).then(() => showToast('Invite link copied. Share it!'));
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  // GOD MODE PATCH — restore any saved draft now that the form exists in the DOM
  wlRestoreDraft();

// ── Generated handler wrappers (inline on* attributes → named functions) ──


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
    }, false); })(EV.input);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, false); })(EV.click);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, false); })(EV.keydown);

})();
