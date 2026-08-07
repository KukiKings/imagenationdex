(function () {
  'use strict';

  const SUPABASE_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
  const WALLET_TERMS_VERSION = 'private-test-wallet-v1';
  const CARD_TERMS_VERSION = 'private-test-card-v1';
  const MERCHANT_TERMS_VERSION = 'private-test-merchant-v1';
  const REQUEST_TIMEOUT_MS = 30000;

  const core = window.INDEXWalletPaymentsCore;
  if (!window.supabase || !core) {
    document.documentElement.dataset.walletPaymentsError = 'dependencies';
    return;
  }

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const state = {
    user: null,
    dashboard: null,
    resolvedDomain: '',
    activeRequestId: '',
    incomingRequestId: core.paymentRequestFromLocation(window.location.search),
    busy: false
  };

  const el = {};
  const ids = [
    'signedOutPanel', 'walletSetupPanel', 'walletConsent', 'openWalletButton',
    'walletSetupMessage', 'walletApp', 'incomingRequestPanel', 'incomingRequestTitle',
    'incomingRequestDetails', 'incomingRequestAmount', 'payIncomingRequestButton',
    'incomingRequestMessage', 'citizenIdentity', 'usdcBalance', 'usdcLimit',
    'indxBalance', 'indxLimit', 'faucetPanel', 'claimFundsButton', 'globalMessage',
    'sendPanel', 'receivePanel', 'remittancePanel', 'billsPanel', 'cardPanel',
    'historyPanel', 'merchantPanel', 'sendForm', 'sendRecipient', 'sendAsset', 'sendAmount',
    'sendMemo', 'recipientCheck', 'resolveRecipientButton', 'sendButton', 'sendMessage',
    'requestForm', 'requestAsset', 'requestAmount', 'requestPurpose', 'requestExpiry',
    'requestMessage', 'requestResult', 'paymentQr', 'requestSummary', 'paymentLink',
    'copyPaymentLinkButton', 'cancelPaymentRequestButton', 'paymentRequestList',
    'remittanceForm', 'remittanceRecipient', 'remittanceCountry', 'remittanceAsset',
    'remittanceAmount', 'remittanceNote', 'remittanceMessage', 'billForm',
    'billerSelect', 'billAsset', 'billAmount', 'billReference', 'billSchedule',
    'billMessage', 'billScheduleList', 'cardNotIssued', 'cardConsent',
    'merchantSetup', 'merchantDisplayName', 'merchantConsent', 'registerMerchantButton',
    'merchantWorkspace', 'merchantName', 'merchantOrderForm', 'merchantOrderReference',
    'merchantOrderAsset', 'merchantOrderAmount', 'merchantOrderExpiry',
    'merchantOrderResult', 'merchantOrderQr', 'merchantOrderSummary', 'merchantOrderLink',
    'copyMerchantOrderLinkButton', 'merchantOrderList', 'merchantMessage',
    'issueCardButton', 'cardIssued', 'cardReference', 'cardStatus', 'freezeCardButton',
    'cardPurchaseForm', 'merchantLabel', 'cardAmount', 'cardPurchaseButton',
    'cardMessage', 'refreshHistoryButton', 'transactionList', 'refundRequestList',
    'liveStatus'
  ];

  function cacheElements() {
    ids.forEach(function (id) { el[id] = document.getElementById(id); });
    el.tabs = Array.from(document.querySelectorAll('[data-tab]'));
    el.panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
  }

  function createUuid() {
    if (!window.crypto || typeof window.crypto.randomUUID !== 'function') {
      throw Object.assign(new Error('Secure request identifiers are unavailable.'), { walletCode: 'SECURE_CONTEXT_REQUIRED' });
    }
    return window.crypto.randomUUID();
  }

  function withTimeout(promise, label) {
    let timer;
    const timeout = new Promise(function (_, reject) {
      timer = setTimeout(function () {
        reject(Object.assign(new Error(label + ' timed out.'), { walletCode: 'REQUEST_TIMEOUT' }));
      }, REQUEST_TIMEOUT_MS);
    });
    return Promise.race([promise, timeout]).finally(function () { clearTimeout(timer); });
  }

  function announce(message) {
    if (el.liveStatus) el.liveStatus.textContent = message || '';
  }

  function setMessage(target, message, kind) {
    if (!target) return;
    target.textContent = message || '';
    target.classList.remove('error', 'success');
    if (message && kind) target.classList.add(kind);
    if (message) announce(message);
  }

  function errorCode(error) {
    if (error && error.walletCode) return error.walletCode;
    const message = String(error && error.message || error || '');
    const known = Object.keys(core.ERROR_MESSAGES || {});
    return known.find(function (code) { return message.includes(code); }) || message.match(/[A-Z][A-Z0-9_]{3,}/)?.[0] || '';
  }

  function friendlyError(error) {
    const code = errorCode(error);
    if (code === 'REQUEST_TIMEOUT') return 'The private-test service took too long. Nothing was recorded. Try again.';
    if (code === 'SECURE_CONTEXT_REQUIRED') return 'Open this page over HTTPS in a current browser.';
    return core.errorMessage(code);
  }

  async function rpc(name, args) {
    const response = await withTimeout(sb.rpc(name, args || {}), name);
    if (response.error) throw response.error;
    if (!response.data || response.data.ok !== true) {
      throw Object.assign(new Error(response.data && response.data.code || 'ACTION_REJECTED'), {
        walletCode: response.data && response.data.code || 'ACTION_REJECTED',
        response: response.data
      });
    }
    return response.data;
  }

  function setBusy(button, busy, busyText) {
    if (!button) return;
    if (!button.dataset.label) button.dataset.label = button.textContent;
    button.disabled = busy;
    button.textContent = busy ? busyText : button.dataset.label;
  }

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }

  function textElement(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = value == null ? '' : String(value);
    return node;
  }

  function showTab(name) {
    el.tabs.forEach(function (tab) {
      const selected = tab.dataset.tab === name;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    el.panels.forEach(function (panel) { panel.hidden = panel.id !== name + 'Panel'; });
    if (name === 'history' && state.dashboard) renderHistory();
  }

  function balanceFor(asset) {
    const balances = state.dashboard && Array.isArray(state.dashboard.balances) ? state.dashboard.balances : [];
    return balances.find(function (item) { return item.asset === asset; }) || { balance_atomic: 0, daily_outflow_limit_atomic: 0 };
  }

  function renderBalances() {
    const usdc = balanceFor('TEST_USDC');
    const indx = balanceFor('TEST_INDX');
    el.usdcBalance.textContent = core.formatAtomic(usdc.balance_atomic, 'TEST_USDC').replace(' TEST_USDC', '');
    el.indxBalance.textContent = core.formatAtomic(indx.balance_atomic, 'TEST_INDX').replace(' TEST_INDX', '');
    el.usdcLimit.textContent = core.formatAtomic(usdc.daily_outflow_limit_atomic, 'TEST_USDC') + ' daily test limit';
    el.indxLimit.textContent = core.formatAtomic(indx.daily_outflow_limit_atomic, 'TEST_INDX') + ' daily test limit';
  }

  function renderBillerOptions() {
    el.billerSelect.replaceChildren();
    const billers = state.dashboard.billers || [];
    billers.forEach(function (biller) {
      const option = document.createElement('option');
      option.value = biller.id;
      option.textContent = biller.name + ' (' + biller.category + ')';
      el.billerSelect.appendChild(option);
    });
  }

  function emptyList(target, message) {
    target.replaceChildren(textElement('div', 'list-empty', message));
  }

  function renderPaymentRequests() {
    const requests = state.dashboard.payment_requests || [];
    if (!requests.length) {
      emptyList(el.paymentRequestList, 'No payment requests yet.');
      return;
    }
    el.paymentRequestList.replaceChildren();
    requests.forEach(function (request) {
      const item = document.createElement('article');
      item.className = 'list-item';
      const detail = document.createElement('div');
      detail.append(textElement('strong', '', request.purpose));
      detail.append(textElement('span', '', formatDate(request.created_at) + ' | expires ' + formatDate(request.expires_at)));
      detail.append(textElement('span', 'status', request.status));
      const side = document.createElement('div');
      side.append(textElement('div', 'amount', core.formatAtomic(request.amount_atomic, request.asset)));
      if (request.status === 'open') {
        const button = textElement('button', 'danger', 'Cancel');
        button.type = 'button';
        button.addEventListener('click', function () { cancelPaymentRequest(request.id, button); });
        side.append(button);
      }
      item.append(detail, side);
      el.paymentRequestList.appendChild(item);
    });
  }

  function renderSchedules() {
    const schedules = state.dashboard.bill_schedules || [];
    if (!schedules.length) {
      emptyList(el.billScheduleList, 'No manual bill schedules.');
      return;
    }
    el.billScheduleList.replaceChildren();
    schedules.forEach(function (schedule) {
      const item = document.createElement('article');
      item.className = 'list-item';
      const detail = document.createElement('div');
      detail.append(textElement('strong', '', schedule.biller_name));
      detail.append(textElement('span', '', 'Next review: ' + schedule.next_due_on));
      detail.append(textElement('span', 'status', schedule.status));
      const side = document.createElement('div');
      side.append(textElement('div', 'amount', core.formatAtomic(schedule.amount_atomic, schedule.asset)));
      if (schedule.status === 'active') {
        const button = textElement('button', 'danger', 'Cancel');
        button.type = 'button';
        button.addEventListener('click', function () { cancelBillSchedule(schedule.id, button); });
        side.append(button);
      }
      item.append(detail, side);
      el.billScheduleList.appendChild(item);
    });
  }

  function renderMerchant() {
    const merchant = state.dashboard.merchant;
    const ready = Boolean(merchant && merchant.id);
    el.merchantSetup.hidden = ready;
    el.merchantWorkspace.hidden = !ready;
    if (!ready) return;
    el.merchantName.textContent = merchant.display_name;
    const orders = state.dashboard.merchant_orders || [];
    if (!orders.length) {
      emptyList(el.merchantOrderList, 'No merchant orders yet.');
      return;
    }
    el.merchantOrderList.replaceChildren();
    orders.forEach(function (order) {
      const item = document.createElement('article');
      item.className = 'list-item';
      const detail = document.createElement('div');
      detail.append(textElement('strong', '', order.order_reference));
      detail.append(textElement('span', '', formatDate(order.created_at)));
      detail.append(textElement('span', 'status', order.status));
      const side = document.createElement('div');
      side.append(textElement('div', 'amount', core.formatAtomic(order.amount_atomic, order.asset)));
      item.append(detail, side);
      el.merchantOrderList.appendChild(item);
    });
  }

  function renderCard() {
    const card = state.dashboard.card;
    const issued = Boolean(card && card.id);
    el.cardNotIssued.hidden = issued;
    el.cardIssued.hidden = !issued;
    if (!issued) return;
    el.cardReference.textContent = card.test_reference;
    el.cardStatus.textContent = String(card.status || 'active').toUpperCase();
    el.freezeCardButton.dataset.frozen = String(card.status === 'frozen');
    el.freezeCardButton.textContent = card.status === 'frozen' ? 'Unfreeze test card' : 'Freeze test card';
    el.cardPurchaseButton.disabled = card.status === 'frozen';
  }

  function eligibleForRefund(transaction) {
    return transaction.direction === 'out'
      && ['transfer', 'payment_request', 'remittance'].includes(transaction.transaction_type)
      && !(state.dashboard.refund_requests || []).some(function (item) {
        return item.original_transaction_id === transaction.id;
      });
  }

  function renderHistory() {
    const transactions = state.dashboard.transactions || [];
    if (!transactions.length) {
      emptyList(el.transactionList, 'No wallet actions yet.');
    } else {
      el.transactionList.replaceChildren();
      transactions.forEach(function (transaction) {
        const item = document.createElement('article');
        item.className = 'list-item';
        const detail = document.createElement('div');
        const title = transaction.transaction_type.replaceAll('_', ' ');
        detail.append(textElement('strong', '', title.charAt(0).toUpperCase() + title.slice(1)));
        detail.append(textElement('span', '', transaction.reference || 'Private-test receipt'));
        detail.append(textElement('small', '', formatDate(transaction.created_at) + ' | receipt ' + String(transaction.id).slice(0, 8)));
        const side = document.createElement('div');
        const sign = transaction.direction === 'out' ? '-' : '+';
        side.append(textElement('div', 'amount', sign + core.formatAtomic(transaction.amount_atomic, transaction.asset)));
        if (eligibleForRefund(transaction)) {
          const button = textElement('button', 'secondary', 'Request refund');
          button.type = 'button';
          button.addEventListener('click', function () { requestRefund(transaction.id, button); });
          side.append(button);
        }
        item.append(detail, side);
        el.transactionList.appendChild(item);
      });
    }
    renderRefunds();
  }

  function renderRefunds() {
    const refunds = state.dashboard.refund_requests || [];
    if (!refunds.length) {
      emptyList(el.refundRequestList, 'No refund requests.');
      return;
    }
    el.refundRequestList.replaceChildren();
    refunds.forEach(function (refund) {
      const item = document.createElement('article');
      item.className = 'list-item';
      const detail = document.createElement('div');
      detail.append(textElement('strong', '', refund.direction === 'received' ? 'Refund approval requested' : 'Refund requested'));
      detail.append(textElement('span', '', refund.reason));
      detail.append(textElement('span', 'status', refund.status));
      const side = document.createElement('div');
      side.append(textElement('div', 'amount', core.formatAtomic(refund.amount_atomic, refund.asset)));
      if (refund.direction === 'received' && refund.status === 'pending') {
        const approve = textElement('button', 'primary', 'Approve');
        const decline = textElement('button', 'danger', 'Decline');
        approve.type = 'button';
        decline.type = 'button';
        approve.addEventListener('click', function () { decideRefund(refund.id, true, approve, decline); });
        decline.addEventListener('click', function () { decideRefund(refund.id, false, approve, decline); });
        side.append(approve, decline);
      }
      item.append(detail, side);
      el.refundRequestList.appendChild(item);
    });
  }

  function renderDashboard() {
    const identity = state.dashboard.identity || {};
    el.citizenIdentity.textContent = identity.domain || identity.display_name || 'Verified citizen';
    renderBalances();
    renderBillerOptions();
    renderPaymentRequests();
    renderSchedules();
    renderMerchant();
    renderCard();
    renderHistory();
    el.faucetPanel.hidden = Boolean(state.dashboard.faucet_claimed);
  }

  async function loadDashboard() {
    const dashboard = await rpc('get_my_private_test_wallet_dashboard');
    state.dashboard = dashboard;
    renderDashboard();
    el.walletSetupPanel.hidden = true;
    el.walletApp.hidden = false;
    if (state.incomingRequestId) await loadIncomingRequest();
  }

  async function openWallet() {
    if (!el.walletConsent.checked || state.busy) return;
    state.busy = true;
    setBusy(el.openWalletButton, true, 'Opening wallet...');
    setMessage(el.walletSetupMessage, '');
    try {
      await rpc('ensure_my_private_test_wallet', { p_terms_version: WALLET_TERMS_VERSION });
      await loadDashboard();
      setMessage(el.globalMessage, 'Your private-test wallet is ready.', 'success');
    } catch (error) {
      setMessage(el.walletSetupMessage, friendlyError(error), 'error');
    } finally {
      state.busy = false;
      setBusy(el.openWalletButton, false);
      el.openWalletButton.disabled = !el.walletConsent.checked;
    }
  }

  async function claimFunds() {
    setBusy(el.claimFundsButton, true, 'Adding test funds...');
    setMessage(el.globalMessage, '');
    try {
      await rpc('claim_my_private_test_funds', {
        p_terms_version: WALLET_TERMS_VERSION,
        p_idempotency_key: createUuid()
      });
      await loadDashboard();
      setMessage(el.globalMessage, 'Test funds added. They have no real-world value.', 'success');
    } catch (error) {
      setMessage(el.globalMessage, friendlyError(error), 'error');
    } finally {
      setBusy(el.claimFundsButton, false);
    }
  }

  async function resolveRecipient() {
    const validated = core.validateDomain(el.sendRecipient.value);
    state.resolvedDomain = '';
    el.sendButton.disabled = true;
    el.recipientCheck.hidden = true;
    if (!validated.ok) {
      setMessage(el.sendMessage, 'Enter a valid name.IN$DEX with 3 to 32 letters, numbers or single hyphens.', 'error');
      return;
    }
    setBusy(el.resolveRecipientButton, true, 'Checking...');
    setMessage(el.sendMessage, '');
    try {
      const result = await rpc('resolve_private_test_recipient', { p_domain: validated.domain });
      if (!result.wallet_ready) throw Object.assign(new Error('RECIPIENT_WALLET_NOT_READY'), { walletCode: 'RECIPIENT_WALLET_NOT_READY' });
      state.resolvedDomain = core.normalizeDomain(result.domain);
      el.recipientCheck.replaceChildren();
      el.recipientCheck.append(textElement('strong', '', 'Verified private-test recipient'));
      el.recipientCheck.append(document.createTextNode(' ' + (result.display_name || 'Citizen') + ' | ' + result.domain));
      el.recipientCheck.hidden = false;
      el.sendButton.disabled = false;
    } catch (error) {
      setMessage(el.sendMessage, friendlyError(error), 'error');
    } finally {
      setBusy(el.resolveRecipientButton, false);
    }
  }

  async function sendTransfer(event) {
    event.preventDefault();
    const validated = core.validateDomain(el.sendRecipient.value);
    if (!validated.ok || core.normalizeDomain(validated.domain) !== state.resolvedDomain) {
      setMessage(el.sendMessage, 'Check the recipient again before sending.', 'error');
      el.sendButton.disabled = true;
      return;
    }
    const amount = core.amountToAtomic(el.sendAmount.value, el.sendAsset.value);
    if (!amount.ok) {
      setMessage(el.sendMessage, 'Enter a valid amount with no more than 6 decimal places.', 'error');
      return;
    }
    setBusy(el.sendButton, true, 'Recording...');
    setMessage(el.sendMessage, '');
    try {
      const result = await rpc('send_my_private_test_transfer', {
        p_recipient_domain: validated.domain,
        p_asset: el.sendAsset.value,
        p_amount_atomic: amount.atomic,
        p_memo: core.cleanText(el.sendMemo.value, 120),
        p_idempotency_key: createUuid()
      });
      el.sendForm.reset();
      state.resolvedDomain = '';
      el.recipientCheck.hidden = true;
      await loadDashboard();
      setMessage(el.sendMessage, 'Test transfer recorded. Receipt ' + String(result.transaction_id).slice(0, 8) + '.', 'success');
    } catch (error) {
      setMessage(el.sendMessage, friendlyError(error), 'error');
    } finally {
      setBusy(el.sendButton, false);
      el.sendButton.disabled = !state.resolvedDomain;
    }
  }

  function renderQr(target, link) {
    target.replaceChildren();
    if (typeof window.QRCode !== 'function') {
      target.append(textElement('span', '', 'QR code unavailable. Use the link.'));
      return;
    }
    new window.QRCode(target, {
      text: link,
      width: 200,
      height: 200,
      colorDark: '#090A10',
      colorLight: '#FFFFFF',
      correctLevel: window.QRCode.CorrectLevel.M
    });
  }

  async function createPaymentRequest(event) {
    event.preventDefault();
    const amount = core.amountToAtomic(el.requestAmount.value, el.requestAsset.value);
    const purpose = core.validateText(el.requestPurpose.value, 120, true);
    if (!amount.ok || !purpose.ok) {
      setMessage(el.requestMessage, 'Enter a valid amount and purpose.', 'error');
      return;
    }
    const button = el.requestForm.querySelector('[type="submit"]');
    setBusy(button, true, 'Creating...');
    setMessage(el.requestMessage, '');
    try {
      const result = await rpc('create_my_private_test_payment_request', {
        p_asset: el.requestAsset.value,
        p_amount_atomic: amount.atomic,
        p_purpose: purpose.text,
        p_expires_minutes: Number(el.requestExpiry.value),
        p_idempotency_key: createUuid()
      });
      state.activeRequestId = result.request_id;
      const link = core.buildPaymentLink(window.location.origin, result.request_id);
      el.requestSummary.textContent = core.formatAtomic(result.amount_atomic, result.asset) + ' | expires ' + formatDate(result.expires_at);
      el.paymentLink.textContent = link;
      el.requestResult.hidden = false;
      renderQr(el.paymentQr, link);
      await loadDashboard();
      setMessage(el.requestMessage, 'Payment request created. It is valid only in this private test.', 'success');
    } catch (error) {
      setMessage(el.requestMessage, friendlyError(error), 'error');
    } finally {
      setBusy(button, false);
    }
  }

  async function copyPaymentLink() {
    const link = el.paymentLink.textContent;
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setMessage(el.requestMessage, 'Payment link copied.', 'success');
    } catch (_) {
      setMessage(el.requestMessage, 'Copy was blocked. Select the link text and copy it manually.', 'error');
    }
  }

  async function cancelPaymentRequest(requestId, button) {
    setBusy(button, true, 'Cancelling...');
    try {
      await rpc('cancel_my_private_test_payment_request', { p_request_id: requestId });
      if (state.activeRequestId === requestId) {
        state.activeRequestId = '';
        el.requestResult.hidden = true;
      }
      await loadDashboard();
      setMessage(el.requestMessage, 'Payment request cancelled.', 'success');
    } catch (error) {
      setMessage(el.requestMessage, friendlyError(error), 'error');
    } finally {
      setBusy(button, false);
    }
  }

  async function submitRemittance(event) {
    event.preventDefault();
    const domain = core.validateDomain(el.remittanceRecipient.value);
    const country = core.validateCountry(el.remittanceCountry.value);
    const amount = core.amountToAtomic(el.remittanceAmount.value, el.remittanceAsset.value);
    if (!domain.ok || !country.ok || !amount.ok) {
      setMessage(el.remittanceMessage, 'Enter a valid recipient, country and amount.', 'error');
      return;
    }
    const button = el.remittanceForm.querySelector('[type="submit"]');
    setBusy(button, true, 'Recording...');
    try {
      const result = await rpc('send_my_private_test_remittance', {
        p_recipient_domain: domain.domain,
        p_destination_country: country.country,
        p_asset: el.remittanceAsset.value,
        p_amount_atomic: amount.atomic,
        p_note: core.cleanText(el.remittanceNote.value, 120),
        p_idempotency_key: createUuid()
      });
      el.remittanceForm.reset();
      await loadDashboard();
      setMessage(el.remittanceMessage, 'Test remittance recorded with zero fee and no foreign exchange. Receipt ' + String(result.transaction_id).slice(0, 8) + '.', 'success');
    } catch (error) {
      setMessage(el.remittanceMessage, friendlyError(error), 'error');
    } finally {
      setBusy(button, false);
    }
  }

  async function submitBill(event) {
    event.preventDefault();
    const amount = core.amountToAtomic(el.billAmount.value, el.billAsset.value);
    if (!el.billerSelect.value || !amount.ok) {
      setMessage(el.billMessage, 'Choose a test biller and enter a valid amount.', 'error');
      return;
    }
    const button = el.billForm.querySelector('[type="submit"]');
    setBusy(button, true, 'Recording...');
    try {
      const result = await rpc('pay_my_private_test_bill', {
        p_biller_id: el.billerSelect.value,
        p_asset: el.billAsset.value,
        p_amount_atomic: amount.atomic,
        p_reference: core.cleanText(el.billReference.value, 80),
        p_create_monthly_schedule: el.billSchedule.checked,
        p_idempotency_key: createUuid()
      });
      el.billForm.reset();
      await loadDashboard();
      const schedule = result.schedule_id ? ' A manual monthly review was scheduled.' : '';
      setMessage(el.billMessage, 'Test bill recorded.' + schedule, 'success');
    } catch (error) {
      setMessage(el.billMessage, friendlyError(error), 'error');
    } finally {
      setBusy(button, false);
    }
  }

  async function cancelBillSchedule(scheduleId, button) {
    setBusy(button, true, 'Cancelling...');
    try {
      await rpc('cancel_my_private_test_bill_schedule', { p_schedule_id: scheduleId });
      await loadDashboard();
      setMessage(el.billMessage, 'Manual bill schedule cancelled.', 'success');
    } catch (error) {
      setMessage(el.billMessage, friendlyError(error), 'error');
    } finally {
      setBusy(button, false);
    }
  }

  async function registerMerchant() {
    const name = core.validateText(el.merchantDisplayName.value, 80, true);
    if (!name.ok || name.text.length < 2 || !el.merchantConsent.checked) {
      setMessage(el.merchantMessage, 'Enter a merchant name and accept the private-test boundary.', 'error');
      return;
    }
    setBusy(el.registerMerchantButton, true, 'Opening profile...');
    try {
      await rpc('register_my_private_test_merchant', {
        p_display_name: name.text,
        p_terms_version: MERCHANT_TERMS_VERSION
      });
      await loadDashboard();
      setMessage(el.merchantMessage, 'Private-test merchant profile opened. No external merchant account was created.', 'success');
    } catch (error) {
      setMessage(el.merchantMessage, friendlyError(error), 'error');
    } finally {
      setBusy(el.registerMerchantButton, false);
      el.registerMerchantButton.disabled = !el.merchantConsent.checked;
    }
  }

  async function createMerchantOrder(event) {
    event.preventDefault();
    const reference = core.validateText(el.merchantOrderReference.value, 80, true);
    const amount = core.amountToAtomic(el.merchantOrderAmount.value, el.merchantOrderAsset.value);
    if (!reference.ok || !amount.ok) {
      setMessage(el.merchantMessage, 'Enter a valid order reference and amount.', 'error');
      return;
    }
    const button = el.merchantOrderForm.querySelector('[type="submit"]');
    setBusy(button, true, 'Creating order...');
    try {
      const result = await rpc('create_my_private_test_merchant_order', {
        p_order_reference: reference.text,
        p_asset: el.merchantOrderAsset.value,
        p_amount_atomic: amount.atomic,
        p_expires_minutes: Number(el.merchantOrderExpiry.value),
        p_idempotency_key: createUuid()
      });
      const link = core.buildPaymentLink(window.location.origin, result.request_id);
      el.merchantOrderSummary.textContent = result.order_reference + ' | ' + core.formatAtomic(result.amount_atomic, result.asset);
      el.merchantOrderLink.textContent = link;
      el.merchantOrderResult.hidden = false;
      renderQr(el.merchantOrderQr, link);
      el.merchantOrderForm.reset();
      await loadDashboard();
      setMessage(el.merchantMessage, 'Test merchant order created. Settlement stays inside the private ledger.', 'success');
    } catch (error) {
      setMessage(el.merchantMessage, friendlyError(error), 'error');
    } finally {
      setBusy(button, false);
    }
  }

  async function copyMerchantOrderLink() {
    const link = el.merchantOrderLink.textContent;
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setMessage(el.merchantMessage, 'Merchant order link copied.', 'success');
    } catch (_) {
      setMessage(el.merchantMessage, 'Copy was blocked. Select the order link and copy it manually.', 'error');
    }
  }

  async function issueCard() {
    if (!el.cardConsent.checked) return;
    setBusy(el.issueCardButton, true, 'Issuing test reference...');
    try {
      await rpc('issue_my_private_test_card', { p_terms_version: CARD_TERMS_VERSION });
      await loadDashboard();
      setMessage(el.cardMessage, 'Private-test card reference issued. No real card was created.', 'success');
    } catch (error) {
      setMessage(el.cardMessage, friendlyError(error), 'error');
    } finally {
      setBusy(el.issueCardButton, false);
      el.issueCardButton.disabled = !el.cardConsent.checked;
    }
  }

  async function toggleCardFrozen() {
    const currentlyFrozen = el.freezeCardButton.dataset.frozen === 'true';
    setBusy(el.freezeCardButton, true, currentlyFrozen ? 'Unfreezing...' : 'Freezing...');
    try {
      await rpc('set_my_private_test_card_frozen', { p_frozen: !currentlyFrozen });
      await loadDashboard();
      setMessage(el.cardMessage, currentlyFrozen ? 'Test card unfrozen.' : 'Test card frozen.', 'success');
    } catch (error) {
      setMessage(el.cardMessage, friendlyError(error), 'error');
    } finally {
      setBusy(el.freezeCardButton, false);
    }
  }

  async function submitCardPurchase(event) {
    event.preventDefault();
    const merchant = core.validateText(el.merchantLabel.value, 80, true);
    const amount = core.amountToAtomic(el.cardAmount.value, 'TEST_USDC');
    if (!merchant.ok || !amount.ok) {
      setMessage(el.cardMessage, 'Enter a test merchant and valid TEST_USDC amount.', 'error');
      return;
    }
    setBusy(el.cardPurchaseButton, true, 'Authorising...');
    try {
      const result = await rpc('authorize_my_private_test_card_purchase', {
        p_merchant_label: merchant.text,
        p_amount_atomic: amount.atomic,
        p_idempotency_key: createUuid()
      });
      el.cardPurchaseForm.reset();
      await loadDashboard();
      setMessage(el.cardMessage, 'Test card purchase recorded. Receipt ' + String(result.transaction_id).slice(0, 8) + '.', 'success');
    } catch (error) {
      setMessage(el.cardMessage, friendlyError(error), 'error');
    } finally {
      setBusy(el.cardPurchaseButton, false);
      if (state.dashboard.card && state.dashboard.card.status === 'frozen') el.cardPurchaseButton.disabled = true;
    }
  }

  async function requestRefund(transactionId, button) {
    const reason = window.prompt('Why are you requesting this private-test refund?');
    const cleaned = core.cleanText(reason, 120);
    if (!cleaned) return;
    setBusy(button, true, 'Requesting...');
    try {
      await rpc('request_my_private_test_refund', { p_transaction_id: transactionId, p_reason: cleaned });
      await loadDashboard();
      setMessage(el.globalMessage, 'Refund request recorded. The receiving citizen must approve it.', 'success');
    } catch (error) {
      setMessage(el.globalMessage, friendlyError(error), 'error');
    } finally {
      setBusy(button, false);
    }
  }

  async function decideRefund(requestId, approve, approveButton, declineButton) {
    setBusy(approveButton, true, approve ? 'Approving...' : 'Please wait...');
    declineButton.disabled = true;
    try {
      await rpc('decide_my_private_test_refund', {
        p_refund_request_id: requestId,
        p_approve: approve,
        p_idempotency_key: createUuid()
      });
      await loadDashboard();
      setMessage(el.globalMessage, approve ? 'Test refund approved and recorded.' : 'Test refund declined.', 'success');
    } catch (error) {
      setMessage(el.globalMessage, friendlyError(error), 'error');
    } finally {
      setBusy(approveButton, false);
      declineButton.disabled = false;
    }
  }

  async function loadIncomingRequest() {
    try {
      const request = await rpc('get_private_test_payment_request', { p_request_id: state.incomingRequestId });
      el.incomingRequestTitle.textContent = 'Pay ' + (request.recipient_domain || request.recipient_name || 'verified citizen');
      el.incomingRequestDetails.textContent = request.purpose + ' | expires ' + formatDate(request.expires_at) + '. Private test only.';
      el.incomingRequestAmount.textContent = core.formatAtomic(request.amount_atomic, request.asset);
      el.incomingRequestPanel.hidden = false;
      el.payIncomingRequestButton.disabled = request.status !== 'open';
      if (request.status !== 'open') setMessage(el.incomingRequestMessage, 'This request is ' + request.status + '.', 'error');
    } catch (error) {
      el.incomingRequestPanel.hidden = false;
      el.payIncomingRequestButton.disabled = true;
      setMessage(el.incomingRequestMessage, friendlyError(error), 'error');
    }
  }

  async function payIncomingRequest() {
    setBusy(el.payIncomingRequestButton, true, 'Recording payment...');
    try {
      const result = await rpc('pay_private_test_payment_request', {
        p_request_id: state.incomingRequestId,
        p_idempotency_key: createUuid()
      });
      await loadDashboard();
      setMessage(el.incomingRequestMessage, 'Test payment recorded. Receipt ' + String(result.transaction_id).slice(0, 8) + '.', 'success');
      el.payIncomingRequestButton.disabled = true;
    } catch (error) {
      setMessage(el.incomingRequestMessage, friendlyError(error), 'error');
    } finally {
      setBusy(el.payIncomingRequestButton, false);
    }
  }

  function populateCountries() {
    el.remittanceCountry.replaceChildren();
    core.COUNTRIES.forEach(function (country) {
      const option = document.createElement('option');
      option.value = country;
      option.textContent = country;
      el.remittanceCountry.appendChild(option);
    });
  }

  function bindEvents() {
    el.walletConsent.addEventListener('change', function () { el.openWalletButton.disabled = !el.walletConsent.checked; });
    el.openWalletButton.addEventListener('click', openWallet);
    el.claimFundsButton.addEventListener('click', claimFunds);
    el.tabs.forEach(function (tab) { tab.addEventListener('click', function () { showTab(tab.dataset.tab); }); });
    el.sendRecipient.addEventListener('input', function () { state.resolvedDomain = ''; el.sendButton.disabled = true; el.recipientCheck.hidden = true; });
    el.resolveRecipientButton.addEventListener('click', resolveRecipient);
    el.sendForm.addEventListener('submit', sendTransfer);
    el.requestForm.addEventListener('submit', createPaymentRequest);
    el.copyPaymentLinkButton.addEventListener('click', copyPaymentLink);
    el.cancelPaymentRequestButton.addEventListener('click', function () {
      if (state.activeRequestId) cancelPaymentRequest(state.activeRequestId, el.cancelPaymentRequestButton);
    });
    el.remittanceForm.addEventListener('submit', submitRemittance);
    el.billForm.addEventListener('submit', submitBill);
    el.merchantConsent.addEventListener('change', function () { el.registerMerchantButton.disabled = !el.merchantConsent.checked; });
    el.registerMerchantButton.addEventListener('click', registerMerchant);
    el.merchantOrderForm.addEventListener('submit', createMerchantOrder);
    el.copyMerchantOrderLinkButton.addEventListener('click', copyMerchantOrderLink);
    el.cardConsent.addEventListener('change', function () { el.issueCardButton.disabled = !el.cardConsent.checked; });
    el.issueCardButton.addEventListener('click', issueCard);
    el.freezeCardButton.addEventListener('click', toggleCardFrozen);
    el.cardPurchaseForm.addEventListener('submit', submitCardPurchase);
    el.refreshHistoryButton.addEventListener('click', function () { loadDashboard().catch(function (error) { setMessage(el.globalMessage, friendlyError(error), 'error'); }); });
    el.payIncomingRequestButton.addEventListener('click', payIncomingRequest);
  }

  async function start() {
    cacheElements();
    populateCountries();
    bindEvents();
    const userResult = await withTimeout(sb.auth.getUser(), 'Account verification');
    if (userResult.error || !userResult.data || !userResult.data.user) {
      el.signedOutPanel.hidden = false;
      return;
    }
    state.user = userResult.data.user;
    try {
      await loadDashboard();
    } catch (error) {
      if (errorCode(error) === 'WALLET_NOT_READY') {
        el.walletSetupPanel.hidden = false;
      } else {
        el.walletSetupPanel.hidden = false;
        setMessage(el.walletSetupMessage, friendlyError(error), 'error');
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    start().catch(function (error) {
      cacheElements();
      el.walletSetupPanel.hidden = false;
      setMessage(el.walletSetupMessage, friendlyError(error), 'error');
    });
  });
})();
