
const INDX_PRICE_USD = 0.24;
const _GAO_KEY = 'indx_gao_state';
const SUPABASE_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, window.IndxAuthOpts);

var STEPS_PROGRESS = {1:10,2:30,3:52,4:72,5:100};
var selectedLoc = null;
var selectedPurpose = null;
var domainCheckTimer = null;

var PURPOSE_LABELS = {send:'Sender',receive:'Receiver',sell:'Merchant',build:'Builder',learn:'Learner',culture:'Cultural Steward',govern:'Governance Citizen',all:'Sovereign Citizen'};
var PURPOSE_BP = {send:'Payment pioneer',receive:'Recipient ready',sell:'Market maker',build:'Income builder',learn:'Knowledge seeker',culture:'Cultural protector',govern:'Governance voice',all:'Sovereign citizen'};
var LOCATION_LABELS = {AU:'🇦🇺 Australia',WS:'🇼🇸 Samoa',FJ:'🇫🇯 Fiji',VU:'🇻🇺 Vanuatu',TO:'🇹🇴 Tonga',PG:'🇵🇬 PNG',NZ:'🇳🇿 New Zealand',OTHER:'🌏 Other'};
var _reviewLastFocus = null;
var _activityTickTimer = null;

// ── GOD MODE: activity ticker (social proof), draft autosave + resume
// (data persistence), review & confirm sheet (confirmation safety),
// keyboard navigation (accessibility) ──

async function updateActivityTicker() {
  var el = document.getElementById('activityCount');
  var wrap = document.getElementById('activityTicker');
  if (!el || !wrap) return;
  var key = 'indx_grid-account-onboarding_activity';
  var cached = JSON.parse(localStorage.getItem(key) || 'null');
  var now = Date.now();
  if (cached && cached.count != null && (now - cached.ts) < 300000) {
    el.textContent = Number(cached.count || 0).toLocaleString();
    wrap.style.display = 'flex';
    return;
  }
  try {
    const { count, error } = await sb.from('citizens').select('id', { count: 'exact', head: true });
    if (error) throw error;
    localStorage.setItem(key, JSON.stringify({ count: count || 0, ts: now }));
    el.textContent = Number(count || 0).toLocaleString();
    wrap.style.display = 'flex';
  } catch (e) {
    // No live count available — hide the ticker rather than show a fabricated number
    wrap.style.display = 'none';
  }
}

function saveDraftState() {
  var fnameEl = document.getElementById('fname');
  var domainEl = document.getElementById('domain');
  var phoneEl = document.getElementById('phone');
  var state = {
    name: fnameEl ? fnameEl.value.trim() : '',
    domain: domainEl ? domainEl.value.trim() : '',
    phone: phoneEl ? phoneEl.value.trim() : '',
    purpose: selectedPurpose,
    loc: selectedLoc,
    ts: Date.now()
  };
  localStorage.setItem(_GAO_KEY, JSON.stringify(state));
}

function resumeDraft() {
  var saved = JSON.parse(localStorage.getItem(_GAO_KEY) || 'null');
  if (!saved) { goTo(2); return; }
  if (saved.purpose) { goTo(4); }
  else if (saved.phone || saved.loc) { goTo(3); }
  else { goTo(2); }
}

function openReviewSheet() {
  var fname = document.getElementById('fname').value.trim() || 'Citizen';
  var domain = document.getElementById('domain').value.trim().toLowerCase() || 'citizen';
  document.getElementById('revName').textContent = fname;
  document.getElementById('revDomain').textContent = domain + '.IN$DEX';
  document.getElementById('revPhone').textContent = document.getElementById('phone').value.trim() || 'Not provided';
  document.getElementById('revLocation').textContent = LOCATION_LABELS[selectedLoc] || 'Not selected';
  document.getElementById('revPurpose').textContent = PURPOSE_LABELS[selectedPurpose] || 'Not selected';
  saveDraftState();
  _reviewLastFocus = document.activeElement;
  document.getElementById('reviewOverlay').classList.add('show');
  document.getElementById('reviewSheet').classList.add('show');
  document.addEventListener('keydown', reviewSheetKeydown);
  setTimeout(function(){ var b = document.getElementById('reviewCloseBtn'); if (b) b.focus(); }, 300);
}

function closeReviewSheet() {
  document.getElementById('reviewOverlay').classList.remove('show');
  document.getElementById('reviewSheet').classList.remove('show');
  document.removeEventListener('keydown', reviewSheetKeydown);
  if (_reviewLastFocus && typeof _reviewLastFocus.focus === 'function') _reviewLastFocus.focus();
}

function confirmReviewAndCreate() {
  closeReviewSheet();
  goTo(5);
}

function reviewSheetKeydown(e) {
  if (e.key === 'Escape') { closeReviewSheet(); return; }
  if (e.key !== 'Tab') return;
  var sheet = document.getElementById('reviewSheet');
  var focusable = sheet.querySelectorAll('button, [tabindex="0"]');
  if (!focusable.length) return;
  var first = focusable[0], last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function enableKeyboardNav(containerId, selector) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var items = container.querySelectorAll(selector);
  items.forEach(function(item, idx) {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        items[(idx + 1) % items.length].focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length].focus();
      }
    });
  });
}

function goTo(step) {
  document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('active'); });
  document.getElementById('s' + step).classList.add('active');
  window.scrollTo(0,0);
  document.getElementById('pFill').style.width = (STEPS_PROGRESS[step] || 10) + '%';
  // FIXED 2026-09-04: screen 3's field hint has always promised "SIINDEX sends a code to
  // confirm this is you" but buildAccountScreen() never verified anything — any typed phone
  // was written straight to citizens.phone_number. Phone is optional here, so only gate on
  // OTP when one was actually entered; an empty phone still goes straight through (nothing
  // to verify, same as before).
  if (step === 5) {
    var rawPhone = document.getElementById('phone').value.trim();
    if (rawPhone && !sessionStorage.getItem('citizen_id')) {
      startGaOtp(rawPhone);
    } else {
      buildAccountScreen();
    }
  }
}

// ── Tier 0 KYC — real Supabase Auth phone OTP, gating buildAccountScreen() ──
var gaOtpPhone = '';
async function startGaOtp(rawPhone) {
  // Same normalization as quickstart-onboarding.html's e164Phone()/login.html's sendOTP()
  // (2026-09-04 fix): strip everything but digits, then a leading 0, so the verified string
  // matches what gets written to citizens.phone_number.
  gaOtpPhone = rawPhone.startsWith('+') ? '+' + rawPhone.slice(1).replace(/\D/g,'') : '+' + rawPhone.replace(/\D/g,'').replace(/^0+/,'');
  try {
    const { error } = await sb.auth.signInWithOtp({ phone: gaOtpPhone, options: await IndxCaptcha.options() });
    if (error) {
      showToast('❌ Could not send verification code — ' + (error.message || 'try again'));
      goTo(3);
      return;
    }
  } catch (e) {
    showToast('❌ Could not send verification code — try again');
    goTo(3);
    return;
  }
  document.getElementById('gaOtpSub').textContent = 'We sent a real 6-digit code to ' + gaOtpPhone + '.';
  document.getElementById('gaOtpError').textContent = '';
  for (var i = 0; i < 6; i++) document.getElementById('gaOtp' + i).value = '';
  document.getElementById('gaOtpBtn').disabled = true;
  document.getElementById('gaOtpOverlay').classList.add('show');
  document.getElementById('gaOtpSheet').classList.add('show');
  document.getElementById('gaOtp0').focus();
}

function gaOtpInput(idx) {
  var el = document.getElementById('gaOtp' + idx);
  if (el.value && idx < 5) document.getElementById('gaOtp' + (idx + 1)).focus();
  var code = [0,1,2,3,4,5].map(function(i){ return document.getElementById('gaOtp' + i).value; }).join('');
  document.getElementById('gaOtpBtn').disabled = code.length < 6;
  document.getElementById('gaOtpError').textContent = '';
}

async function resendGaOtp() {
  try {
    const { error } = await sb.auth.signInWithOtp({ phone: gaOtpPhone, options: await IndxCaptcha.options() });
    document.getElementById('gaOtpError').style.color = error ? 'var(--red)' : 'var(--green)';
    document.getElementById('gaOtpError').textContent = error ? (error.message || 'Could not resend — try again.') : 'New code sent';
  } catch (e) {
    document.getElementById('gaOtpError').style.color = 'var(--red)';
    document.getElementById('gaOtpError').textContent = 'Could not resend — try again.';
  }
}

function cancelGaOtp() {
  document.getElementById('gaOtpOverlay').classList.remove('show');
  document.getElementById('gaOtpSheet').classList.remove('show');
  goTo(3);
}

async function verifyGaOtp() {
  var token = [0,1,2,3,4,5].map(function(i){ return document.getElementById('gaOtp' + i).value; }).join('');
  var btn = document.getElementById('gaOtpBtn');
  btn.disabled = true; btn.textContent = 'Verifying…';
  try {
    const { error } = await sb.auth.verifyOtp({ phone: gaOtpPhone, token: token, type: 'sms' });
    if (error) {
      document.getElementById('gaOtpError').style.color = 'var(--red)';
      document.getElementById('gaOtpError').textContent = 'Invalid code — try again';
      btn.disabled = false; btn.textContent = 'Verify →';
      return;
    }
  } catch (e) {
    document.getElementById('gaOtpError').style.color = 'var(--red)';
    document.getElementById('gaOtpError').textContent = 'Verification failed — try again';
    btn.disabled = false; btn.textContent = 'Verify →';
    return;
  }
  btn.textContent = 'Verify →';
  document.getElementById('gaOtpOverlay').classList.remove('show');
  document.getElementById('gaOtpSheet').classList.remove('show');
  buildAccountScreen();
}

function checkDomain() {
  var d = document.getElementById('domain').value.trim().toLowerCase();
  var status = document.getElementById('domainStatus');
  if (d.length < 3) { status.style.display = 'none'; return; }

  status.style.display = 'flex';
  status.textContent = '⏳ Checking availability…';

  clearTimeout(domainCheckTimer);
  domainCheckTimer = setTimeout(async function() {
    try {
      const { data } = await sb.from('citizens').select('id').eq('web3_domain', d + '.IN$DEX').maybeSingle();
      if (data) {
        status.textContent = '❌ ' + d + '.IN$DEX is already taken — try another';
        status.style.color = 'var(--red)';
      } else {
        status.textContent = '✅ Available — ' + d + '.IN$DEX is yours';
        status.style.color = 'var(--green)';
      }
    } catch (e) {
      // No live confirmation possible — say so plainly, don't fake a check
      status.textContent = '⚠️ Could not verify availability right now';
      status.style.color = 'var(--gold)';
    }
  }, 500);
}

function goNextName() {
  var f = document.getElementById('fname').value.trim();
  var d = document.getElementById('domain').value.trim();
  if (!f) { showToast('Please enter your name'); return; }
  if (!d || d.length < 3) { showToast('Choose a domain name (3+ characters)'); return; }
  goTo(3);
}

function selLoc(el, code) {
  document.querySelectorAll('.loc-chip').forEach(function(c){ c.classList.remove('active'); });
  el.classList.add('active');
  selectedLoc = code;
  // GOD MODE PATCH
  saveDraftState();
}

function selPurpose(el, id) {
  document.querySelectorAll('.purpose-card').forEach(function(c){ c.classList.remove('active'); });
  el.classList.add('active');
  selectedPurpose = id;
  // GOD MODE PATCH
  saveDraftState();
}

async function buildAccountScreen() {
  var fname = document.getElementById('fname').value.trim() || 'Citizen';
  var domain = document.getElementById('domain').value.trim().toLowerCase() || 'citizen';
  // FIXED 2026-09-04: use the OTP-verified phone string (gaOtpPhone, set by startGaOtp())
  // when one exists, instead of re-reading the raw field — guarantees the value written to
  // citizens.phone_number is the exact string Supabase Auth actually verified, not a
  // differently-formatted re-read of the same input.
  var phone = gaOtpPhone || document.getElementById('phone').value.trim();
  document.getElementById('displayName').textContent = fname;
  document.getElementById('displayDomain').textContent = domain + '.IN$DEX';
  var bpLabel = PURPOSE_BP[selectedPurpose] || 'Explorer';
  document.getElementById('bpPurpose').textContent = bpLabel;

  // Keep a local draft so the form can restore on return visit
  // GOD MODE PATCH — extended to also persist phone via saveDraftState()
  saveDraftState();

  // Already have a live citizen this session (e.g. resumed) — don't create a duplicate
  if (sessionStorage.getItem('citizen_id')) {
    showToast('✅ Welcome back — ' + fname + ' · ' + domain + '.IN$DEX');
    return;
  }

  var statusEl = document.getElementById('accountStatus');
  var discEl = document.getElementById('accountDisclaimer');

  try {
    // Routed through create_onboarding_citizen(), not a raw insert — this
    // flow never authenticates, so it always runs as the 'anon' role, which
    // has no auth.uid() and can never pass any SELECT policy on citizens. A
    // raw insert().select() was guaranteed to throw "violates row-level
    // security policy" on every signup. The RPC inserts server-side and
    // returns the id directly. Reward fields granted after via
    // claim_genesis_signup_bonus_anon() — found + fixed 19 Jul 2026.
    const { data: created, error: rpcError } = await sb.rpc('create_onboarding_citizen', {
      p_payload: {
        citizen_name: fname,
        phone_number: phone || null,
        web3_domain: domain + '.IN$DEX'
      }
    });
    if (rpcError) throw rpcError;
    if (!created.success) throw { code: created.reason === 'duplicate' ? '23505' : 'unknown', message: created.reason, details: created.detail };
    const data = { id: created.id };
    await sb.rpc('claim_genesis_signup_bonus_anon', { p_citizen_id: data.id });
    // Real Supabase Auth session now exists whenever a phone was entered (startGaOtp()'s
    // verifyOtp() call succeeded before buildAccountScreen() ever ran) — link it so future
    // RLS-gated calls work for this citizen. Self-heals phone_number too. Non-fatal.
    if (gaOtpPhone) { try { await sb.rpc('link_citizen_auth_by_id', { p_citizen_id: data.id }); } catch (linkErr) { /* non-fatal */ } }

    sessionStorage.setItem('citizen_id', data.id);
    sessionStorage.setItem('citizen_name', fname);
    sessionStorage.setItem('citizen_web3_domain', domain + '.IN$DEX');
    sessionStorage.setItem('citizen_wisdom', '25');
    sessionStorage.setItem('citizen_balance', '50');
    sessionStorage.setItem('citizen_genesis', 'true');
    sessionStorage.setItem('citizen_kyc_tier', '0');

    showToast('✅ Grid Account ready — ' + fname + ' · ' + domain + '.IN$DEX');

  } catch (e) {
    console.error('[grid-account-onboarding] citizen insert failed:', e);

    // Duplicate domain or phone — say so plainly, don't pretend success
    if (e && e.code === '23505') {
      var detail = e.message || e.details || '';
      if (detail.includes('web3_domain')) {
        statusEl.textContent = '⚠️ Domain taken';
        statusEl.className = 'ac-val';
        statusEl.style.color = 'var(--gold)';
        discEl.textContent = domain + '.IN$DEX was claimed by someone else just now. Go back and choose a different name to finish registration.';
        showToast('❌ ' + domain + '.IN$DEX was just taken — pick another name');
        return;
      }
      if (detail.includes('phone_number')) {
        // Existing citizen with this phone — look them up and continue as them
        const { data: existing } = await sb.from('citizens').select('id,citizen_name,web3_domain,wisdom_score,indx_balance,genesis_citizen,kyc_tier').eq('phone_number', phone).single();
        if (existing) {
          sessionStorage.setItem('citizen_id', existing.id);
          sessionStorage.setItem('citizen_name', existing.citizen_name || fname);
          sessionStorage.setItem('citizen_web3_domain', existing.web3_domain || (domain + '.IN$DEX'));
          sessionStorage.setItem('citizen_wisdom', String(existing.wisdom_score || 0));
          sessionStorage.setItem('citizen_balance', String(existing.indx_balance || 0));
          sessionStorage.setItem('citizen_genesis', String(existing.genesis_citizen || false));
          sessionStorage.setItem('citizen_kyc_tier', String(existing.kyc_tier || 0));
          showToast('✅ Welcome back, ' + (existing.citizen_name || fname));
          return;
        }
      }
    }

    // Any other failure (network, RLS, etc.) — be honest, don't fake a ready account
    statusEl.textContent = '⚠️ Not saved yet';
    statusEl.className = 'ac-val';
    statusEl.style.color = 'var(--gold)';
    discEl.textContent = 'We could not reach the network to save your Grid Account. Check your connection and reopen this page to finish registration — your details above are held locally for now.';
    showToast('⚠️ Could not save to the network — please retry with signal');
  }
}

function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function(){ t.classList.remove('show'); }, 3200);
}

document.addEventListener('DOMContentLoaded', function() {
  var saved = JSON.parse(localStorage.getItem(_GAO_KEY) || 'null');
  if (saved && saved.name) {
    document.getElementById('fname').value = saved.name;
    document.getElementById('domain').value = saved.domain || '';
    checkDomain();
  }

  // GOD MODE PATCH — restore phone/location/purpose and show resume banner
  if (saved) {
    if (saved.phone) document.getElementById('phone').value = saved.phone;
    if (saved.loc) {
      var chip = document.querySelector('.loc-chip[onclick*="\'' + saved.loc + '\'"]');
      if (chip) { document.querySelectorAll('.loc-chip').forEach(function(c){ c.classList.remove('active'); }); chip.classList.add('active'); selectedLoc = saved.loc; }
    }
    if (saved.purpose) {
      var card = document.querySelector('.purpose-card[onclick*="\'' + saved.purpose + '\'"]');
      if (card) { document.querySelectorAll('.purpose-card').forEach(function(c){ c.classList.remove('active'); }); card.classList.add('active'); selectedPurpose = saved.purpose; }
    }
    if (saved.domain || saved.phone || saved.purpose || saved.loc) {
      var resumeText = document.getElementById('resumeText');
      if (resumeText && saved.name) resumeText.textContent = '👋 Welcome back, ' + saved.name + ' — pick up where you left off';
      var banner = document.getElementById('resumeBanner');
      if (banner) banner.style.display = 'flex';
    }
  }

  // GOD MODE PATCH — activity ticker + keyboard nav for purpose/location grids
  updateActivityTicker();
  enableKeyboardNav('purposeGrid', '.purpose-card');
  enableKeyboardNav('locationChips', '.loc-chip');
});

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
