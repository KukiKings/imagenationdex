(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.INDEXTier0Core = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  const HANDLE_MIN = 3;
  const HANDLE_MAX = 32;
  const DISPLAY_NAME_MAX = 80;

  function digitsOnly(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function normalizeE164(dialCode, localNumber) {
    const dial = '+' + digitsOnly(dialCode);
    let national = digitsOnly(localNumber).replace(/^0+/, '');
    const complete = dial + national;

    if (!/^\+[1-9]\d{7,14}$/.test(complete)) {
      return { ok: false, value: '', reason: 'invalid_phone' };
    }

    return { ok: true, value: complete, reason: 'valid' };
  }

  function normalizeHandle(value) {
    let handle = String(value || '').trim().toLowerCase();
    if (handle.endsWith('.in$dex')) handle = handle.slice(0, -7);
    return handle;
  }

  function validateHandle(value) {
    const handle = normalizeHandle(value);

    if (handle.length < HANDLE_MIN || handle.length > HANDLE_MAX) {
      return { ok: false, handle, reason: 'length' };
    }
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(handle) || handle.includes('--')) {
      return { ok: false, handle, reason: 'format' };
    }

    return { ok: true, handle, domain: handle + '.IN$DEX', reason: 'valid' };
  }

  function validateDisplayName(value) {
    const name = String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim();
    return {
      ok: name.length >= 2 && name.length <= DISPLAY_NAME_MAX,
      name
    };
  }

  function readOtp(inputs) {
    return Array.from(inputs || [])
      .map(function (input) { return digitsOnly(input && input.value).slice(0, 1); })
      .join('')
      .slice(0, 6);
  }

  function friendlyAuthError(error, action) {
    const code = String(error && (error.code || error.name) || '').toLowerCase();
    const message = String(error && error.message || '').toLowerCase();

    if (code.includes('over_request_rate_limit') || message.includes('rate limit')) {
      return 'Too many requests. Wait a few minutes, then try again.';
    }
    if (code.includes('otp_expired') || message.includes('expired')) {
      return 'This code expired. Request a new code.';
    }
    if (code.includes('otp_disabled') || message.includes('phone provider')) {
      return 'SMS verification is temporarily unavailable. Try again later.';
    }
    if (action === 'verify') return 'The code is incorrect or expired. Try again.';
    return 'We could not send the code. Check the number and try again.';
  }

  function claimErrorMessage(code) {
    const messages = {
      AUTHENTICATION_REQUIRED: 'Your secure session expired. Verify your phone again.',
      CONSENT_REQUIRED: 'Accept the Tier 0 identity terms before continuing.',
      PHONE_NOT_VERIFIED: 'Verify your phone before claiming a name.IN$DEX identity.',
      INVALID_DISPLAY_NAME: 'Enter a name between 2 and 80 characters.',
      INVALID_HANDLE: 'Use 3–32 lowercase letters, numbers or single hyphens.',
      HANDLE_RESERVED: 'This name is protected. Choose another.',
      HANDLE_TAKEN: 'This name.IN$DEX identity is already claimed.',
      IDENTITY_ALREADY_ISSUED: 'This account already has a name.IN$DEX identity.'
    };
    return messages[code] || 'Identity issuance did not complete. Try again.';
  }

  return Object.freeze({
    HANDLE_MIN,
    HANDLE_MAX,
    DISPLAY_NAME_MAX,
    digitsOnly,
    normalizeE164,
    normalizeHandle,
    validateHandle,
    validateDisplayName,
    readOtp,
    friendlyAuthError,
    claimErrorMessage
  });
});
