(function () {
  'use strict';

  const SUPABASE_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdWJhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
  const TERMS_VERSION = 'citizen-account-recovery-v1';
  const REQUEST_TIMEOUT_MS = 30000;
  const RESEND_SECONDS = 60;
  const DEVICE_KEY_STORAGE = 'indx_citizen_device_key';

  const core = window.INDEXCitizenAccountCore;
  if (!window.supabase || !core) {
    document.documentElement.dataset.accountRecoveryError = 'dependencies';
    return;
  }

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const state = {
    selectedCountry: core.countries[0],
    phone: '',
    sending: false,
    verifying: false,
    resendTimer: null,
    sessionsSecured: false
  };

  const el = {};
  const ids = [
    'signedInPanel', 'recoveryFlow', 'signedInName', 'manageSecurityButton',
    'restartRecoveryButton', 'countryButton', 'countryFlag', 'countryDial',
    'countrySheet', 'countryList', 'closeCountrySheet', 'phoneInput', 'phoneHint',
    'recoveryConsent', 'sharedDevice', 'phoneError', 'sendOtpButton', 'phoneStep',
    'otpStep', 'successStep', 'otpMessage', 'otpError', 'verifyOtpButton',
    'resendButton', 'changeNumberButton', 'successName', 'successDomain',
    'successReceipt', 'securityHoldNotice', 'openSecurityButton', 'signOutButton',
    'liveStatus'
  ];

  function cacheElements() {
    ids.forEach(function (id) { el[id] = document.getElementById(id); });
    el.otpInputs = Array.from(document.querySelectorAll('[data-otp-digit]'));
    el.progress = Array.from(document.querySelectorAll('.steps li'));
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
    const order = ['phone', 'otp', 'success'];
    const activeIndex = order.indexOf(step);
    order.forEach(function (name) {
      const node = el[name + 'Step'];
      node.hidden = name !== step;
      node.classList.toggle('active', name === step);
    });
    el.progress.forEach(function (node, index) {
      node.classList.toggle('active', index === activeIndex);
      node.classList.toggle('done', index < activeIndex);
      node.setAttribute('aria-current', index === activeIndex ? 'step' : 'false');
    });
    const focus = step === 'phone' ? el.phoneInput : step === 'otp' ? el.otpInputs[0] : el.openSecurityButton;
    setTimeout(function () { if (focus) focus.focus(); }, 0);
  }

  function getDeviceKey(shared) {
    const storage = shared ? sessionStorage : localStorage;
    let key = storage.getItem(DEVICE_KEY_STORAGE);
    if (!core.isUuid(key)) {
      key = core.createDeviceKey(window.crypto);
      storage.setItem(DEVICE_KEY_STORAGE, key);
    }
    if (shared) sessionStorage.setItem('indx_current_device_shared', 'true');
    else {
      sessionStorage.removeItem(DEVICE_KEY_STORAGE);
      sessionStorage.removeItem('indx_current_device_shared');
    }
    return key;
  }

  function renderCountries() {
    el.countryList.replaceChildren();
    core.countries.forEach(function (country) {
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

  function openCountrySheet() {
    el.countrySheet.hidden = false;
    const selected = el.countryList.querySelector('[aria-selected="true"]');
    if (selected) selected.focus();
  }

  function closeCountrySheet() {
    el.countrySheet.hidden = true;
    el.countryButton.focus();
  }

  function selectCountry(country) {
    state.selectedCountry = country;
    el.countryFlag.textContent = country.flag;
    el.countryDial.textContent = country.dial;
    el.phoneHint.textContent = 'Local format: ' + country.example + '. We convert it to international format.';
    localStorage.setItem('indx_account_country', country.dial);
    renderCountries();
    validatePhone();
    closeCountrySheet();
  }

  function validatePhone() {
    const normalized = core.normalizeE164(state.selectedCountry.dial, el.phoneInput.value);
    el.sendOtpButton.disabled = !(normalized.ok && el.recoveryConsent.checked) || state.sending;
    showError(el.phoneError, normalized.ok || !el.phoneInput.value ? '' : 'Enter a complete phone number.');
    return normalized;
  }

  async function sendOtp() {
    const normalized = validatePhone();
    if (!normalized.ok || !el.recoveryConsent.checked || state.sending) return;

    state.sending = true;
    state.phone = normalized.value;
    el.sendOtpButton.disabled = true;
    el.sendOtpButton.textContent = 'Sending recovery code...';
    showError(el.phoneError, '');

    try {
      const result = await withTimeout(
        sb.auth.signInWithOtp({
          phone: state.phone,
          options: { shouldCreateUser: false }
        }),
        'Recovery code request'
      );
      if (result.error) throw result.error;
      sessionStorage.setItem('indx_recovery_phone', state.phone);
      el.otpMessage.textContent = 'Code sent to ' + core.maskPhone(state.phone);
      setStep('otp');
      startResendCountdown();
      announce('Recovery code sent.');
    } catch (error) {
      showError(el.phoneError, core.friendlyAuthError(error, 'send'));
    } finally {
      state.sending = false;
      el.sendOtpButton.textContent = 'Send recovery code';
      validatePhone();
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

  async function verifyAndRecover() {
    const token = updateOtpState();
    if (token.length !== 6 || state.verifying) return;

    state.verifying = true;
    state.sessionsSecured = false;
    el.verifyOtpButton.disabled = true;
    el.verifyOtpButton.textContent = 'Securing account...';

    try {
      const verified = await withTimeout(
        sb.auth.verifyOtp({ phone: state.phone, token: token, type: 'sms' }),
        'Code verification'
      );
      if (verified.error || !verified.data || !verified.data.session) {
        throw verified.error || new Error('No verified session');
      }

      const providerSignOut = await withTimeout(
        sb.auth.signOut({ scope: 'others' }),
        'Other-session sign out'
      );
      if (providerSignOut.error) throw providerSignOut.error;
      state.sessionsSecured = true;

      const shared = el.sharedDevice.checked;
      const deviceKey = getDeviceKey(shared);
      const recovered = await withTimeout(
        sb.rpc('complete_my_account_recovery', {
          p_terms_version: TERMS_VERSION,
          p_device_key: deviceKey,
          p_display_label: core.deviceLabel(navigator.userAgent),
          p_device_family: core.deviceFamily(navigator.userAgent),
          p_shared_device: shared
        }),
        'Recovery receipt'
      );
      if (recovered.error) throw recovered.error;
      if (!recovered.data || !recovered.data.ok) {
        throw Object.assign(new Error('Recovery rejected'), { accountCode: recovered.data && recovered.data.code });
      }

      sessionStorage.removeItem('indx_recovery_phone');
      el.successName.textContent = recovered.data.display_name || 'Citizen';
      el.successDomain.textContent = recovered.data.domain || 'Verified citizen account';
      el.successReceipt.textContent = 'Recovery receipt ' + String(recovered.data.receipt_id || '').slice(0, 8) + ' recorded ' + core.formatDate(recovered.data.recovered_at);

      const hasHold = Boolean(recovered.data.account_security_hold || recovered.data.card_security_hold);
      el.securityHoldNotice.hidden = !hasHold;
      if (hasHold) {
        el.securityHoldNotice.textContent = 'A security hold remains active. Recovery did not remove it. Contact IN$DEX support for review.';
      }
      setStep('success');
      announce('Your citizen account was recovered and other sessions were secured.');
    } catch (error) {
      const message = state.sessionsSecured
        ? 'Other sessions were secured, but the recovery receipt did not complete. Open account security and try again.'
        : error && error.accountCode
          ? core.accountErrorMessage(error.accountCode)
          : core.friendlyAuthError(error, 'verify');
      showError(el.otpError, message);
    } finally {
      state.verifying = false;
      el.verifyOtpButton.textContent = 'Verify and secure account';
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
    try {
      const result = await withTimeout(
        sb.auth.signInWithOtp({ phone: state.phone, options: { shouldCreateUser: false } }),
        'Recovery code resend'
      );
      if (result.error) throw result.error;
      showError(el.otpError, '');
      startResendCountdown();
      announce('A new recovery code was sent.');
    } catch (error) {
      showError(el.otpError, core.friendlyAuthError(error, 'send'));
      el.resendButton.disabled = false;
    }
  }

  async function changeNumber() {
    clearInterval(state.resendTimer);
    await sb.auth.signOut({ scope: 'local' });
    state.phone = '';
    state.sessionsSecured = false;
    sessionStorage.removeItem('indx_recovery_phone');
    el.otpInputs.forEach(function (input) { input.value = ''; });
    setStep('phone');
  }

  async function restartRecovery() {
    await sb.auth.signOut({ scope: 'local' });
    el.signedInPanel.hidden = true;
    el.recoveryFlow.hidden = false;
    setStep('phone');
  }

  async function signOutCurrent() {
    await sb.auth.signOut({ scope: 'local' });
    window.location.assign('public-home.html');
  }

  function bindEvents() {
    el.countryButton.addEventListener('click', openCountrySheet);
    el.closeCountrySheet.addEventListener('click', closeCountrySheet);
    el.countrySheet.addEventListener('click', function (event) {
      if (event.target === el.countrySheet) closeCountrySheet();
    });
    el.phoneInput.addEventListener('input', validatePhone);
    el.recoveryConsent.addEventListener('change', validatePhone);
    el.sendOtpButton.addEventListener('click', sendOtp);
    el.verifyOtpButton.addEventListener('click', verifyAndRecover);
    el.resendButton.addEventListener('click', resendOtp);
    el.changeNumberButton.addEventListener('click', changeNumber);
    el.restartRecoveryButton.addEventListener('click', restartRecovery);
    el.manageSecurityButton.addEventListener('click', function () { window.location.assign('/account-security'); });
    el.openSecurityButton.addEventListener('click', function () { window.location.assign('/account-security'); });
    el.signOutButton.addEventListener('click', signOutCurrent);
    el.otpInputs.forEach(function (input, index) {
      input.addEventListener('input', function (event) { handleOtpInput(event, index); });
      input.addEventListener('keydown', function (event) { handleOtpKeydown(event, index); });
      input.addEventListener('paste', handleOtpPaste);
    });
  }

  async function start() {
    const savedDial = localStorage.getItem('indx_account_country');
    state.selectedCountry = core.countries.find(function (country) { return country.dial === savedDial; }) || core.countries[0];
    el.countryFlag.textContent = state.selectedCountry.flag;
    el.countryDial.textContent = state.selectedCountry.dial;
    el.phoneHint.textContent = 'Local format: ' + state.selectedCountry.example + '. We convert it to international format.';
    renderCountries();

    const sessionResult = await sb.auth.getSession();
    if (sessionResult.data && sessionResult.data.session) {
      el.recoveryFlow.hidden = true;
      el.signedInPanel.hidden = false;
      const account = await sb.rpc('get_my_citizen_account');
      el.signedInName.textContent = account.data && account.data.ok
        ? account.data.display_name + ', you are already signed in.'
        : 'You are already signed in.';
      return;
    }

    const pendingPhone = sessionStorage.getItem('indx_recovery_phone');
    if (pendingPhone) {
      state.phone = pendingPhone;
      el.otpMessage.textContent = 'Enter the code sent to ' + core.maskPhone(pendingPhone);
      setStep('otp');
      startResendCountdown();
    } else {
      setStep('phone');
    }
  }

  document.addEventListener('DOMContentLoaded', async function () {
    cacheElements();
    bindEvents();
    try {
      await start();
    } catch (_) {
      showError(el.phoneError, 'Secure recovery could not start. Refresh and try again.');
    }
  });
})();
