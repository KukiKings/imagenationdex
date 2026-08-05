(function () {
  'use strict';

  const SUPABASE_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
  const TERMS_VERSION = 'tier0-identity-v1';
  const REQUEST_TIMEOUT_MS = 30000;
  const RESEND_SECONDS = 60;

  const countries = [
    { flag: '🇨🇰', name: 'Cook Islands', dial: '+682', example: 'XXXXX' },
    { flag: '🇫🇯', name: 'Fiji', dial: '+679', example: 'XXX XXXX' },
    { flag: '🇹🇴', name: 'Tonga', dial: '+676', example: 'XXXXX' },
    { flag: '🇼🇸', name: 'Samoa', dial: '+685', example: 'XXXXXXXX' },
    { flag: '🇵🇬', name: 'Papua New Guinea', dial: '+675', example: 'XXXX XXXX' },
    { flag: '🇸🇧', name: 'Solomon Islands', dial: '+677', example: 'XXXXXXX' },
    { flag: '🇻🇺', name: 'Vanuatu', dial: '+678', example: 'XXXXXXX' },
    { flag: '🇵🇭', name: 'Philippines', dial: '+63', example: 'XXX XXX XXXX' },
    { flag: '🇦🇺', name: 'Australia', dial: '+61', example: '4XX XXX XXX' },
    { flag: '🇳🇿', name: 'New Zealand', dial: '+64', example: 'XX XXX XXXX' },
    { flag: '🇮🇳', name: 'India', dial: '+91', example: 'XXXXX XXXXX' },
    { flag: '🇮🇩', name: 'Indonesia', dial: '+62', example: 'XXX XXXX XXXX' },
    { flag: '🇲🇾', name: 'Malaysia', dial: '+60', example: 'XX XXXX XXXX' },
    { flag: '🇹🇭', name: 'Thailand', dial: '+66', example: 'XX XXXX XXXX' },
    { flag: '🇻🇳', name: 'Vietnam', dial: '+84', example: 'XXXXXXXXX' },
    { flag: '🇬🇧', name: 'United Kingdom', dial: '+44', example: 'XXXX XXXXXX' },
    { flag: '🇺🇸', name: 'United States', dial: '+1', example: 'XXX XXX XXXX' }
  ];

  const core = window.INDEXTier0Core;
  if (!window.supabase || !core) {
    document.documentElement.dataset.tier0Error = 'dependencies';
    return;
  }

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const state = {
    step: 'phone',
    selectedCountry: countries[0],
    phone: '',
    sending: false,
    verifying: false,
    claiming: false,
    availabilityNonce: 0,
    availabilityTimer: null,
    handleAvailable: false,
    resendTimer: null
  };

  const el = {};
  const ids = [
    'countryButton', 'countryFlag', 'countryDial', 'countrySheet', 'countryList',
    'phoneInput', 'phoneHint', 'phoneConsent', 'phoneError', 'sendOtpButton',
    'otpMessage', 'otpError', 'verifyOtpButton', 'resendButton', 'displayNameInput',
    'handleInput', 'domainPreview', 'availabilityStatus', 'identityError',
    'issueIdentityButton', 'issuedName', 'issuedDomain', 'issuedReceipt',
    'openPortalButton', 'openSwarmButton', 'liveStatus'
  ];

  function cacheElements() {
    ids.forEach(function (id) { el[id] = document.getElementById(id); });
    el.otpInputs = Array.from(document.querySelectorAll('[data-otp-digit]'));
    el.steps = Array.from(document.querySelectorAll('[data-step]'));
    el.progress = Array.from(document.querySelectorAll('[data-progress-step]'));
  }

  function withTimeout(promise, label) {
    let timer;
    const timeout = new Promise(function (_, reject) {
      timer = setTimeout(function () {
        const error = new Error(label + ' timed out');
        error.code = 'request_timeout';
        reject(error);
      }, REQUEST_TIMEOUT_MS);
    });
    return Promise.race([promise, timeout]).finally(function () { clearTimeout(timer); });
  }

  function announce(message) {
    if (el.liveStatus) el.liveStatus.textContent = message;
  }

  function showError(target, message) {
    if (target) target.textContent = message || '';
    if (message) announce(message);
  }

  function setStep(step) {
    state.step = step;
    const order = ['phone', 'otp', 'identity', 'complete'];
    const activeIndex = order.indexOf(step);

    el.steps.forEach(function (node) {
      const active = node.dataset.step === step;
      node.hidden = !active;
      node.classList.toggle('active', active);
    });

    el.progress.forEach(function (node, index) {
      node.classList.toggle('active', index === activeIndex);
      node.classList.toggle('done', index < activeIndex);
      node.setAttribute('aria-current', index === activeIndex ? 'step' : 'false');
    });

    const focusTarget = {
      phone: el.phoneInput,
      otp: el.otpInputs[0],
      identity: el.displayNameInput,
      complete: el.openPortalButton
    }[step];
    setTimeout(function () { if (focusTarget) focusTarget.focus(); }, 0);
  }

  function maskPhone(phone) {
    const digits = core.digitsOnly(phone);
    return digits.length < 5 ? phone : '+' + digits.slice(0, 3) + ' ••• ••' + digits.slice(-2);
  }

  function clearCitizenSession() {
    [
      'citizen_id', 'citizen_name', 'citizen_web3_domain', 'citizen_wisdom',
      'citizen_balance', 'citizen_genesis', 'citizen_kyc_tier', 'citizen_referral'
    ].forEach(function (key) { sessionStorage.removeItem(key); });
  }

  function storeIdentity(identity) {
    clearCitizenSession();
    sessionStorage.setItem('citizen_id', identity.citizen_id || '');
    sessionStorage.setItem('citizen_name', identity.display_name || '');
    sessionStorage.setItem('citizen_web3_domain', identity.domain || '');
  }

  function openCountrySheet() {
    el.countrySheet.hidden = false;
    el.countrySheet.classList.add('show');
    const selected = el.countryList.querySelector('[aria-selected="true"]');
    if (selected) selected.focus();
  }

  function closeCountrySheet() {
    el.countrySheet.classList.remove('show');
    el.countrySheet.hidden = true;
    el.countryButton.focus();
  }

  function selectCountry(country) {
    state.selectedCountry = country;
    el.countryFlag.textContent = country.flag;
    el.countryDial.textContent = country.dial;
    el.phoneHint.textContent = 'Local format: ' + country.example + '. We convert it to international format.';
    localStorage.setItem('indx_tier0_country', country.dial);
    validatePhoneStep();
    closeCountrySheet();
  }

  function renderCountries() {
    el.countryList.replaceChildren();
    countries.forEach(function (country) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'country-option';
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', String(country.dial === state.selectedCountry.dial));
      button.innerHTML = '<span aria-hidden="true">' + country.flag + '</span><span>' + country.name + '</span><strong>' + country.dial + '</strong>';
      button.addEventListener('click', function () { selectCountry(country); });
      el.countryList.appendChild(button);
    });
  }

  function validatePhoneStep() {
    const normalized = core.normalizeE164(state.selectedCountry.dial, el.phoneInput.value);
    const ready = normalized.ok && el.phoneConsent.checked && !state.sending;
    el.sendOtpButton.disabled = !ready;
    showError(el.phoneError, normalized.ok || !el.phoneInput.value ? '' : 'Enter a complete phone number.');
    return normalized;
  }

  async function sendOtp() {
    const normalized = validatePhoneStep();
    if (!normalized.ok || !el.phoneConsent.checked || state.sending) return;

    state.sending = true;
    state.phone = normalized.value;
    el.sendOtpButton.disabled = true;
    el.sendOtpButton.textContent = 'Sending secure code…';
    showError(el.phoneError, '');

    try {
      const result = await withTimeout(
        sb.auth.signInWithOtp({
          phone: state.phone,
          options: { shouldCreateUser: true }
        }),
        'SMS request'
      );
      if (result.error) throw result.error;

      sessionStorage.setItem('indx_pending_phone', state.phone);
      el.otpMessage.textContent = 'Code sent to ' + maskPhone(state.phone);
      setStep('otp');
      startResendCountdown();
      announce('Verification code sent.');
    } catch (error) {
      showError(el.phoneError, core.friendlyAuthError(error, 'send'));
    } finally {
      state.sending = false;
      el.sendOtpButton.textContent = 'Send secure code';
      validatePhoneStep();
    }
  }

  function updateOtpState() {
    const otp = core.readOtp(el.otpInputs);
    el.verifyOtpButton.disabled = otp.length !== 6 || state.verifying;
    showError(el.otpError, '');
    return otp;
  }

  function handleOtpInput(event, index) {
    event.target.value = core.digitsOnly(event.target.value).slice(-1);
    if (event.target.value && index < el.otpInputs.length - 1) el.otpInputs[index + 1].focus();
    updateOtpState();
  }

  function handleOtpKeydown(event, index) {
    if (event.key === 'Backspace' && !event.target.value && index > 0) el.otpInputs[index - 1].focus();
  }

  function handleOtpPaste(event) {
    const digits = core.digitsOnly(event.clipboardData && event.clipboardData.getData('text')).slice(0, 6);
    if (!digits) return;
    event.preventDefault();
    el.otpInputs.forEach(function (input, index) { input.value = digits[index] || ''; });
    el.otpInputs[Math.min(digits.length, 6) - 1].focus();
    updateOtpState();
  }

  async function getMyIdentity() {
    const result = await withTimeout(sb.rpc('get_my_tier0_identity'), 'Identity lookup');
    if (result.error) throw result.error;
    return result.data || { complete: false };
  }

  async function verifyOtp() {
    const token = updateOtpState();
    if (token.length !== 6 || state.verifying) return;

    state.verifying = true;
    let phoneVerified = false;
    el.verifyOtpButton.disabled = true;
    el.verifyOtpButton.textContent = 'Verifying…';

    try {
      const result = await withTimeout(
        sb.auth.verifyOtp({ phone: state.phone, token: token, type: 'sms' }),
        'Code verification'
      );
      if (result.error || !result.data || !result.data.session) throw result.error || new Error('No verified session');
      phoneVerified = true;

      clearCitizenSession();
      sessionStorage.removeItem('indx_pending_phone');

      const consent = await withTimeout(
        sb.rpc('record_tier0_phone_consent', { p_terms_version: TERMS_VERSION }),
        'Consent receipt'
      );
      if (consent.error || !consent.data || !consent.data.ok) {
        throw consent.error || new Error('Consent receipt was not recorded');
      }

      const identity = await getMyIdentity();

      if (identity.complete) {
        storeIdentity(identity);
        el.issuedName.textContent = identity.display_name || 'Citizen';
        el.issuedDomain.textContent = identity.domain || 'Identity issued';
        el.issuedReceipt.textContent = identity.issued_at
          ? 'Issued ' + new Date(identity.issued_at).toLocaleString()
          : 'Verified identity record';
        setStep('complete');
        return;
      }

      setStep('identity');
      announce('Phone verified. Choose your name.IN$DEX identity.');
    } catch (error) {
      showError(
        el.otpError,
        phoneVerified
          ? 'Your phone was verified, but the identity service is unavailable. No identity was issued. Try again.'
          : core.friendlyAuthError(error, 'verify')
      );
    } finally {
      state.verifying = false;
      el.verifyOtpButton.textContent = 'Verify phone';
      updateOtpState();
    }
  }

  function startResendCountdown() {
    clearInterval(state.resendTimer);
    let remaining = RESEND_SECONDS;
    el.resendButton.disabled = true;
    el.resendButton.textContent = 'Resend in ' + remaining + 's';
    state.resendTimer = setInterval(function () {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(state.resendTimer);
        el.resendButton.disabled = false;
        el.resendButton.textContent = 'Resend code';
      } else {
        el.resendButton.textContent = 'Resend in ' + remaining + 's';
      }
    }, 1000);
  }

  async function resendOtp() {
    if (el.resendButton.disabled || !state.phone) return;
    el.resendButton.disabled = true;
    try {
      const result = await withTimeout(
        sb.auth.signInWithOtp({ phone: state.phone, options: { shouldCreateUser: true } }),
        'SMS resend'
      );
      if (result.error) throw result.error;
      showError(el.otpError, '');
      announce('A new code was sent.');
      startResendCountdown();
    } catch (error) {
      showError(el.otpError, core.friendlyAuthError(error, 'send'));
      el.resendButton.disabled = false;
    }
  }

  function updateIdentityStep() {
    const name = core.validateDisplayName(el.displayNameInput.value);
    const handle = core.validateHandle(el.handleInput.value);
    el.domainPreview.textContent = handle.ok ? handle.domain : 'yourname.IN$DEX';

    if (!handle.ok && el.handleInput.value) {
      el.availabilityStatus.className = 'availability invalid';
      el.availabilityStatus.textContent = handle.reason === 'length'
        ? 'Use 3–32 characters.'
        : 'Use lowercase letters, numbers and single hyphens.';
    } else if (!el.handleInput.value) {
      el.availabilityStatus.className = 'availability';
      el.availabilityStatus.textContent = 'This becomes your unique citizen identity.';
    }

    if (!handle.ok) state.handleAvailable = false;
    el.issueIdentityButton.disabled = !(name.ok && handle.ok && state.handleAvailable) || state.claiming;
    return { name, handle };
  }

  function scheduleAvailabilityCheck() {
    clearTimeout(state.availabilityTimer);
    state.handleAvailable = false;
    updateIdentityStep();
    const validated = core.validateHandle(el.handleInput.value);
    if (!validated.ok) return;

    const nonce = ++state.availabilityNonce;
    el.availabilityStatus.className = 'availability checking';
    el.availabilityStatus.textContent = 'Checking availability…';

    state.availabilityTimer = setTimeout(async function () {
      try {
        const result = await withTimeout(
          sb.rpc('check_name_indx_availability', { p_handle: validated.handle }),
          'Name availability check'
        );
        if (nonce !== state.availabilityNonce) return;
        if (result.error) throw result.error;

        state.handleAvailable = Boolean(result.data && result.data.available);
        el.availabilityStatus.className = 'availability ' + (state.handleAvailable ? 'available' : 'unavailable');
        el.availabilityStatus.textContent = state.handleAvailable
          ? validated.domain + ' is available.'
          : result.data && result.data.reason === 'reserved'
            ? 'This name is protected. Choose another.'
            : 'This name.IN$DEX identity is already claimed.';
      } catch (_) {
        state.handleAvailable = false;
        el.availabilityStatus.className = 'availability unavailable';
        el.availabilityStatus.textContent = 'Availability could not be checked. Try again.';
      }
      updateIdentityStep();
    }, 350);
  }

  async function issueIdentity() {
    const values = updateIdentityStep();
    if (!values.name.ok || !values.handle.ok || !state.handleAvailable || state.claiming) return;

    state.claiming = true;
    el.issueIdentityButton.disabled = true;
    el.issueIdentityButton.textContent = 'Issuing identity…';
    showError(el.identityError, '');

    try {
      const result = await withTimeout(
        sb.rpc('claim_tier0_identity', {
          p_display_name: values.name.name,
          p_handle: values.handle.handle,
          p_terms_version: TERMS_VERSION
        }),
        'Identity issuance'
      );
      if (result.error) throw result.error;
      if (!result.data || !result.data.ok) {
        showError(el.identityError, core.claimErrorMessage(result.data && result.data.code));
        if (result.data && ['HANDLE_TAKEN', 'HANDLE_RESERVED'].includes(result.data.code)) {
          state.handleAvailable = false;
          scheduleAvailabilityCheck();
        }
        return;
      }

      storeIdentity(result.data);
      el.issuedName.textContent = result.data.display_name;
      el.issuedDomain.textContent = result.data.domain;
      el.issuedReceipt.textContent = 'Receipt recorded ' + new Date(result.data.issued_at).toLocaleString();
      setStep('complete');
      announce('Your name.IN$DEX identity was issued.');
    } catch (error) {
      const message = error && error.message === 'AUTHENTICATION_REQUIRED'
        ? core.claimErrorMessage('AUTHENTICATION_REQUIRED')
        : 'Identity issuance did not complete. Your name was not reserved. Try again.';
      showError(el.identityError, message);
    } finally {
      state.claiming = false;
      el.issueIdentityButton.textContent = 'Issue my identity';
      updateIdentityStep();
    }
  }

  async function changeNumber() {
    clearInterval(state.resendTimer);
    await sb.auth.signOut({ scope: 'local' });
    state.phone = '';
    el.otpInputs.forEach(function (input) { input.value = ''; });
    sessionStorage.removeItem('indx_pending_phone');
    setStep('phone');
  }

  function bindEvents() {
    el.countryButton.addEventListener('click', openCountrySheet);
    el.countrySheet.addEventListener('click', function (event) {
      if (event.target === el.countrySheet) closeCountrySheet();
    });
    document.getElementById('closeCountrySheet').addEventListener('click', closeCountrySheet);
    el.phoneInput.addEventListener('input', validatePhoneStep);
    el.phoneConsent.addEventListener('change', validatePhoneStep);
    el.sendOtpButton.addEventListener('click', sendOtp);
    el.verifyOtpButton.addEventListener('click', verifyOtp);
    el.resendButton.addEventListener('click', resendOtp);
    document.getElementById('changeNumberButton').addEventListener('click', changeNumber);
    el.displayNameInput.addEventListener('input', updateIdentityStep);
    el.handleInput.addEventListener('input', function () {
      const cursor = el.handleInput.selectionStart;
      const normalized = core.normalizeHandle(el.handleInput.value).replace(/[^a-z0-9-]/g, '');
      el.handleInput.value = normalized;
      if (cursor !== null) el.handleInput.setSelectionRange(cursor, cursor);
      scheduleAvailabilityCheck();
    });
    el.issueIdentityButton.addEventListener('click', issueIdentity);
    el.openPortalButton.addEventListener('click', function () {
      window.location.assign('public-home.html');
    });
    el.openSwarmButton.addEventListener('click', function () {
      window.location.assign('/swarm-preview');
    });
    el.otpInputs.forEach(function (input, index) {
      input.addEventListener('input', function (event) { handleOtpInput(event, index); });
      input.addEventListener('keydown', function (event) { handleOtpKeydown(event, index); });
      input.addEventListener('paste', handleOtpPaste);
    });
  }

  async function restoreSession() {
    const savedDial = localStorage.getItem('indx_tier0_country');
    state.selectedCountry = countries.find(function (country) { return country.dial === savedDial; }) || countries[0];
    el.countryFlag.textContent = state.selectedCountry.flag;
    el.countryDial.textContent = state.selectedCountry.dial;
    el.phoneHint.textContent = 'Local format: ' + state.selectedCountry.example + '. We convert it to international format.';
    renderCountries();

    const pendingPhone = sessionStorage.getItem('indx_pending_phone');
    if (pendingPhone) state.phone = pendingPhone;

    try {
      const sessionResult = await sb.auth.getSession();
      if (!sessionResult.data || !sessionResult.data.session) {
        setStep(pendingPhone ? 'otp' : 'phone');
        if (pendingPhone) el.otpMessage.textContent = 'Enter the code sent to ' + maskPhone(pendingPhone);
        return;
      }

      const identity = await getMyIdentity();
      if (identity.complete) {
        storeIdentity(identity);
        el.issuedName.textContent = identity.display_name || 'Citizen';
        el.issuedDomain.textContent = identity.domain || 'Identity issued';
        el.issuedReceipt.textContent = identity.issued_at
          ? 'Issued ' + new Date(identity.issued_at).toLocaleString()
          : 'Verified identity record';
        setStep('complete');
        return;
      }
      setStep('identity');
    } catch (_) {
      setStep('phone');
      showError(el.phoneError, 'Secure sign-in could not start. Refresh and try again.');
    }
  }

  document.addEventListener('DOMContentLoaded', async function () {
    cacheElements();
    bindEvents();
    await restoreSession();
  });
})();
