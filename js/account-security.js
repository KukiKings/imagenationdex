(function () {
  'use strict';

  const SUPABASE_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdWJhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
  const REQUEST_TIMEOUT_MS = 30000;
  const DEVICE_KEY_STORAGE = 'indx_citizen_device_key';

  const core = window.INDEXCitizenAccountCore;
  if (!window.supabase || !core) {
    document.documentElement.dataset.accountSecurityError = 'dependencies';
    return;
  }

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const state = { deviceKey: '', sharedDevice: false, busy: false };
  const el = {};
  const ids = [
    'loadingPanel', 'securityPanel', 'accountName', 'accountDomain', 'identityStatus',
    'holdNotice', 'currentDeviceName', 'deviceList', 'receiptList', 'secureOthersButton',
    'signOutLocalButton', 'signOutEverywhereButton', 'recoverAccountLink', 'refreshButton',
    'actionError', 'liveStatus'
  ];

  function cacheElements() {
    ids.forEach(function (id) { el[id] = document.getElementById(id); });
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

  function showError(message) {
    el.actionError.textContent = message || '';
    if (message) announce(message);
  }

  function getDeviceKey() {
    const sessionKey = sessionStorage.getItem(DEVICE_KEY_STORAGE);
    state.sharedDevice = sessionStorage.getItem('indx_current_device_shared') === 'true' && core.isUuid(sessionKey);
    if (state.sharedDevice) return sessionKey;

    let key = localStorage.getItem(DEVICE_KEY_STORAGE);
    if (!core.isUuid(key)) {
      key = core.createDeviceKey(window.crypto);
      localStorage.setItem(DEVICE_KEY_STORAGE, key);
    }
    return key;
  }

  function setBusy(busy, activeButton) {
    state.busy = busy;
    [el.secureOthersButton, el.signOutLocalButton, el.signOutEverywhereButton, el.refreshButton].forEach(function (button) {
      button.disabled = busy;
    });
    if (activeButton) activeButton.setAttribute('aria-busy', String(busy));
  }

  function deviceIcon(family) {
    if (family === 'mobile') return '▯';
    if (family === 'tablet') return '▭';
    if (family === 'desktop') return '▰';
    return '◇';
  }

  function renderDevices(devices) {
    el.deviceList.replaceChildren();
    if (!devices.length) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'No verified device records yet.';
      el.deviceList.appendChild(empty);
      return;
    }

    devices.forEach(function (device) {
      const current = device.device_key === state.deviceKey;
      const revoked = Boolean(device.revoked_at);
      const item = document.createElement('article');
      item.className = 'device' + (revoked ? ' revoked' : '');

      const icon = document.createElement('div');
      icon.className = 'device-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = deviceIcon(device.device_family);

      const body = document.createElement('div');
      body.className = 'device-body';
      const title = document.createElement('div');
      title.className = 'device-title';
      title.textContent = device.display_label || 'Browser device';
      if (current) {
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = 'This device';
        title.appendChild(badge);
      }
      const meta = document.createElement('div');
      meta.className = 'device-meta';
      meta.textContent = revoked
        ? 'Secured ' + core.formatDate(device.revoked_at)
        : 'Verified ' + core.formatDate(device.last_verified_at) + (device.shared_device ? ' · Shared device' : '');
      body.append(title, meta);
      item.append(icon, body);
      el.deviceList.appendChild(item);
    });
  }

  function receiptLabel(type) {
    const labels = {
      account_recovered: 'Account recovered',
      other_sessions_secured: 'Other sessions secured',
      global_sign_out_requested: 'Sign out everywhere requested'
    };
    return labels[type] || 'Account security event';
  }

  function renderReceipts(receipts) {
    el.receiptList.replaceChildren();
    if (!receipts.length) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'No account security receipts yet.';
      el.receiptList.appendChild(empty);
      return;
    }
    receipts.forEach(function (receipt) {
      const item = document.createElement('li');
      const label = document.createElement('strong');
      label.textContent = receiptLabel(receipt.event_type);
      const time = document.createElement('span');
      time.textContent = core.formatDate(receipt.created_at) + ' · Receipt ' + String(receipt.id || '').slice(0, 8);
      item.append(label, time);
      el.receiptList.appendChild(item);
    });
  }

  async function loadAccount() {
    showError('');
    const userResult = await withTimeout(sb.auth.getUser(), 'Session validation');
    if (userResult.error || !userResult.data || !userResult.data.user) {
      window.location.assign('/tier0');
      return;
    }

    state.deviceKey = getDeviceKey();
    const metadata = {
      p_device_key: state.deviceKey,
      p_display_label: core.deviceLabel(navigator.userAgent),
      p_device_family: core.deviceFamily(navigator.userAgent),
      p_shared_device: state.sharedDevice
    };

    const registered = await withTimeout(sb.rpc('register_my_citizen_device', metadata), 'Device registration');
    if (registered.error) throw registered.error;
    if (!registered.data || !registered.data.ok) {
      throw Object.assign(new Error('Device registration rejected'), { accountCode: registered.data && registered.data.code });
    }

    const [accountResult, deviceResult, receiptResult] = await Promise.all([
      withTimeout(sb.rpc('get_my_citizen_account'), 'Account lookup'),
      withTimeout(sb.rpc('get_my_citizen_devices'), 'Device lookup'),
      withTimeout(
        sb.from('citizen_account_receipts').select('id,event_type,created_at').order('created_at', { ascending: false }).limit(8),
        'Receipt lookup'
      )
    ]);

    if (accountResult.error || deviceResult.error || receiptResult.error) {
      throw accountResult.error || deviceResult.error || receiptResult.error;
    }
    if (!accountResult.data || !accountResult.data.ok) {
      throw Object.assign(new Error('Account lookup rejected'), { accountCode: accountResult.data && accountResult.data.code });
    }

    el.accountName.textContent = accountResult.data.display_name || 'Citizen';
    el.accountDomain.textContent = accountResult.data.domain || 'Citizen identity';
    el.identityStatus.textContent = accountResult.data.identity_status === 'issued' ? 'Tier 0 identity issued' : 'Citizen account active';
    el.currentDeviceName.textContent = core.deviceLabel(navigator.userAgent) + (state.sharedDevice ? ' · Shared device' : '');

    const hasHold = Boolean(accountResult.data.account_security_hold || accountResult.data.card_security_hold);
    el.holdNotice.hidden = !hasHold;
    if (hasHold) {
      el.holdNotice.textContent = 'A security hold is active. Account recovery and sign-in do not remove it. Contact IN$DEX support for review.';
    }

    renderDevices(deviceResult.data && deviceResult.data.devices || []);
    renderReceipts(receiptResult.data || []);
    el.loadingPanel.hidden = true;
    el.securityPanel.hidden = false;
  }

  async function secureOtherSessions() {
    if (state.busy || !window.confirm('Sign out every other IN$DEX session? This device stays signed in.')) return;
    setBusy(true, el.secureOthersButton);
    showError('');
    try {
      const provider = await withTimeout(sb.auth.signOut({ scope: 'others' }), 'Other-session sign out');
      if (provider.error) throw provider.error;

      const evidence = await withTimeout(
        sb.rpc('secure_my_other_device_records', {
          p_current_device_key: state.deviceKey,
          p_reason: 'citizen_secured_account'
        }),
        'Security receipt'
      );
      if (evidence.error) throw evidence.error;
      if (!evidence.data || !evidence.data.ok) {
        throw Object.assign(new Error('Security receipt rejected'), { accountCode: evidence.data && evidence.data.code });
      }
      announce('Other sessions were signed out and a receipt was recorded.');
      await loadAccount();
    } catch (error) {
      showError(error && error.accountCode ? core.accountErrorMessage(error.accountCode) : 'Other sessions were not fully secured. Try again.');
    } finally {
      setBusy(false, el.secureOthersButton);
    }
  }

  async function signOutLocal() {
    if (state.busy) return;
    setBusy(true, el.signOutLocalButton);
    const result = await withTimeout(sb.auth.signOut({ scope: 'local' }), 'Local sign out');
    if (result.error) {
      showError('This device could not sign out. Try again.');
      setBusy(false, el.signOutLocalButton);
      return;
    }
    sessionStorage.removeItem(DEVICE_KEY_STORAGE);
    sessionStorage.removeItem('indx_current_device_shared');
    window.location.assign('public-home.html');
  }

  async function signOutEverywhere() {
    if (state.busy || !window.confirm('Sign out every IN$DEX session, including this device?')) return;
    setBusy(true, el.signOutEverywhereButton);
    showError('');
    try {
      const requestReceipt = await withTimeout(
        sb.rpc('record_my_global_sign_out', { p_current_device_key: state.deviceKey }),
        'Global sign-out request receipt'
      );
      if (requestReceipt.error) throw requestReceipt.error;
      if (!requestReceipt.data || !requestReceipt.data.ok) {
        throw Object.assign(new Error('Sign-out request rejected'), { accountCode: requestReceipt.data && requestReceipt.data.code });
      }

      const provider = await withTimeout(sb.auth.signOut({ scope: 'global' }), 'Global sign out');
      if (provider.error) throw provider.error;
      sessionStorage.removeItem(DEVICE_KEY_STORAGE);
      sessionStorage.removeItem('indx_current_device_shared');
      window.location.assign('public-home.html');
    } catch (error) {
      showError(error && error.accountCode ? core.accountErrorMessage(error.accountCode) : 'Sign out everywhere did not complete. Try again.');
      setBusy(false, el.signOutEverywhereButton);
    }
  }

  function bindEvents() {
    el.secureOthersButton.addEventListener('click', secureOtherSessions);
    el.signOutLocalButton.addEventListener('click', signOutLocal);
    el.signOutEverywhereButton.addEventListener('click', signOutEverywhere);
    el.refreshButton.addEventListener('click', async function () {
      if (state.busy) return;
      setBusy(true, el.refreshButton);
      try { await loadAccount(); }
      catch (error) { showError(error && error.accountCode ? core.accountErrorMessage(error.accountCode) : 'Account security could not refresh.'); }
      finally { setBusy(false, el.refreshButton); }
    });
  }

  document.addEventListener('DOMContentLoaded', async function () {
    cacheElements();
    bindEvents();
    try {
      await loadAccount();
    } catch (error) {
      el.loadingPanel.hidden = false;
      showError(error && error.accountCode ? core.accountErrorMessage(error.accountCode) : 'Account security could not load. Sign in again or recover your account.');
    }
  });
})();
