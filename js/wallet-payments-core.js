(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.INDEXWalletPaymentsCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  const ASSETS = Object.freeze({
    TEST_USDC: Object.freeze({ code: 'TEST_USDC', label: 'Test USD Coin', decimals: 6 }),
    TEST_INDX: Object.freeze({ code: 'TEST_INDX', label: 'Test INDX', decimals: 6 })
  });

  const COUNTRIES = Object.freeze([
    'Cook Islands', 'Fiji', 'Tonga', 'Samoa', 'Papua New Guinea',
    'Solomon Islands', 'Vanuatu', 'Australia', 'New Zealand', 'Philippines',
    'India', 'Indonesia', 'Malaysia', 'Thailand', 'Vietnam',
    'United Kingdom', 'United States'
  ]);

  function assetConfig(asset) {
    return ASSETS[String(asset || '').toUpperCase()] || null;
  }

  function amountToAtomic(value, asset) {
    const config = assetConfig(asset);
    const input = String(value || '').trim();
    if (!config || !/^\d+(?:\.\d+)?$/.test(input)) {
      return { ok: false, atomic: '', reason: 'invalid_amount' };
    }

    const parts = input.split('.');
    const whole = parts[0].replace(/^0+(?=\d)/, '') || '0';
    const fraction = parts[1] || '';
    if (fraction.length > config.decimals) {
      return { ok: false, atomic: '', reason: 'too_many_decimals' };
    }

    const atomic = BigInt(whole) * (10n ** BigInt(config.decimals))
      + BigInt((fraction + '0'.repeat(config.decimals)).slice(0, config.decimals) || '0');
    if (atomic <= 0n) return { ok: false, atomic: '', reason: 'amount_must_be_positive' };
    return { ok: true, atomic: atomic.toString(), reason: 'valid' };
  }

  function formatAtomic(value, asset, options) {
    const config = assetConfig(asset);
    if (!config) return 'Unknown asset';
    let atomic;
    try { atomic = BigInt(String(value || '0')); }
    catch (_) { return 'Invalid amount'; }

    const negative = atomic < 0n;
    const absolute = negative ? -atomic : atomic;
    const scale = 10n ** BigInt(config.decimals);
    const whole = absolute / scale;
    const fraction = (absolute % scale).toString().padStart(config.decimals, '0');
    const minimum = options && Number.isInteger(options.minimumFractionDigits)
      ? Math.max(0, Math.min(config.decimals, options.minimumFractionDigits))
      : 2;
    let trimmed = fraction.replace(/0+$/, '');
    if (trimmed.length < minimum) trimmed += '0'.repeat(minimum - trimmed.length);
    return (negative ? '-' : '') + whole.toString() + (trimmed ? '.' + trimmed : '') + ' ' + config.code;
  }

  function normalizeDomain(value) {
    let domain = String(value || '').trim().toLowerCase();
    if (domain.startsWith('@')) domain = domain.slice(1);
    if (!domain.endsWith('.in$dex')) domain += '.in$dex';
    return domain;
  }

  function validateDomain(value) {
    const domain = normalizeDomain(value);
    const handle = domain.slice(0, -7);
    const ok = handle.length >= 3
      && handle.length <= 32
      && /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(handle)
      && !handle.includes('--');
    return { ok, domain: ok ? handle + '.IN$DEX' : '', handle, reason: ok ? 'valid' : 'invalid_domain' };
  }

  function cleanText(value, maximum) {
    const cleaned = String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
    return cleaned.slice(0, maximum);
  }

  function validateText(value, maximum, required) {
    const text = cleanText(value, maximum);
    return { ok: required ? text.length > 0 : true, text };
  }

  function validateCountry(value) {
    const country = COUNTRIES.find(function (item) {
      return item.toLowerCase() === String(value || '').trim().toLowerCase();
    });
    return { ok: Boolean(country), country: country || '' };
  }

  function buildPaymentLink(origin, requestId) {
    const id = String(requestId || '').trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      throw new Error('Invalid payment request identifier');
    }
    const url = new URL('/wallet-payments', String(origin || 'https://imagenationdex.com'));
    url.searchParams.set('request', id);
    return url.toString();
  }

  function paymentRequestFromLocation(search) {
    const id = new URLSearchParams(String(search || '')).get('request') || '';
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ? id : '';
  }

  const ERROR_MESSAGES = Object.freeze({
      AUTHENTICATION_REQUIRED: 'Sign in to your citizen account first.',
      PHONE_NOT_VERIFIED: 'Verify your phone before opening a test wallet.',
      ACCOUNT_NOT_FOUND: 'Your citizen identity is not connected to this session.',
      WALLET_NOT_READY: 'Open your private-test wallet before using this action.',
      RECIPIENT_NOT_FOUND: 'No private-test wallet matches that name.IN$DEX.',
      RECIPIENT_WALLET_NOT_READY: 'The recipient has not opened a private-test wallet yet.',
      SELF_TRANSFER_NOT_ALLOWED: 'Choose another citizen. You cannot transfer to the same wallet.',
      INVALID_ASSET: 'Choose TEST_USDC or TEST_INDX.',
      INVALID_AMOUNT: 'Enter a valid amount greater than zero.',
      AMOUNT_LIMIT_EXCEEDED: 'This amount exceeds the private-test transaction limit.',
      DAILY_LIMIT_EXCEEDED: 'This transfer exceeds today’s private-test spending limit.',
      INSUFFICIENT_TEST_BALANCE: 'Your private-test balance is too low for this action.',
      DUPLICATE_REQUEST: 'This action was already recorded. Refresh your history before trying again.',
      ACCOUNT_SECURITY_HOLD: 'An account security hold blocks payment testing.',
      CARD_SECURITY_HOLD: 'A card security hold blocks this card test.',
      REQUEST_NOT_FOUND: 'This payment request does not exist or is no longer available.',
      REQUEST_EXPIRED: 'This payment request expired. Ask for a new one.',
      REQUEST_ALREADY_PAID: 'This payment request was already paid.',
      CONSENT_REQUIRED: 'Accept the private-test terms before continuing.',
      TEST_FUNDS_ALREADY_CLAIMED: 'Test funds were already added to this wallet.',
      CARD_ALREADY_ISSUED: 'Your private-test card is already issued.',
      CARD_NOT_ISSUED: 'Issue your private-test card before testing a purchase.',
      CARD_FROZEN: 'Unfreeze your private-test card before testing a purchase.',
      INVALID_BILLER: 'Choose an available private-test biller.',
      INVALID_COUNTRY: 'Choose a supported destination country.',
      INVALID_PURPOSE: 'Enter a purpose for this payment request.',
      INVALID_MERCHANT: 'Enter a test merchant name.',
      MERCHANT_NOT_READY: 'Open your private-test merchant profile before creating an order.',
      INVALID_ORDER_REFERENCE: 'Enter an order reference.',
      INVALID_REFUND_REASON: 'Enter a reason for the refund request.',
      REFUND_NOT_ELIGIBLE: 'This action cannot be refunded through the test wallet.',
      REFUND_REQUEST_NOT_FOUND: 'This refund request is not available to this wallet.',
      REFUND_ALREADY_DECIDED: 'This refund request was already decided.',
      IDEMPOTENCY_CONFLICT: 'This request identifier was already used for a different action.',
      SCHEDULE_NOT_FOUND: 'This bill schedule is not active or does not belong to this account.',
      ACTION_REJECTED: 'The backend rejected this private-test action.'
  });

  function errorMessage(code) {
    return ERROR_MESSAGES[String(code || '')] || 'The private-test action did not complete. Try again.';
  }

  return Object.freeze({
    ASSETS,
    COUNTRIES,
    ERROR_MESSAGES,
    assetConfig,
    amountToAtomic,
    formatAtomic,
    normalizeDomain,
    validateDomain,
    cleanText,
    validateText,
    validateCountry,
    buildPaymentLink,
    paymentRequestFromLocation,
    errorMessage
  });
});
