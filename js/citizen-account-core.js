(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.INDEXCitizenAccountCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  const countries = Object.freeze([
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
  ]);

  function digitsOnly(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function normalizeE164(dialCode, localNumber) {
    const dial = '+' + digitsOnly(dialCode);
    const national = digitsOnly(localNumber).replace(/^0+/, '');
    const complete = dial + national;

    if (!/^\+[1-9]\d{7,14}$/.test(complete)) {
      return { ok: false, value: '', reason: 'invalid_phone' };
    }
    return { ok: true, value: complete, reason: 'valid' };
  }

  function maskPhone(phone) {
    const digits = digitsOnly(phone);
    if (digits.length < 5) return 'your phone';
    return '+' + digits.slice(0, Math.min(3, digits.length - 4)) + ' ••• ••' + digits.slice(-2);
  }

  function readOtp(inputs) {
    return Array.from(inputs || [])
      .map(function (input) { return digitsOnly(input && input.value).slice(0, 1); })
      .join('')
      .slice(0, 6);
  }

  function deviceFamily(userAgent) {
    const value = String(userAgent || '').toLowerCase();
    if (/ipad|tablet|kindle|silk/.test(value)) return 'tablet';
    if (/mobile|iphone|ipod|android/.test(value)) return 'mobile';
    if (/windows|macintosh|linux|cros/.test(value)) return 'desktop';
    return 'unknown';
  }

  function deviceLabel(userAgent) {
    const value = String(userAgent || '');
    const family = deviceFamily(value);
    let browser = 'Browser';
    let system = family === 'unknown' ? 'device' : family;

    if (/Edg\//.test(value)) browser = 'Edge';
    else if (/OPR\//.test(value)) browser = 'Opera';
    else if (/CriOS\//.test(value)) browser = 'Chrome';
    else if (/FxiOS\//.test(value)) browser = 'Firefox';
    else if (/Chrome\//.test(value)) browser = 'Chrome';
    else if (/Firefox\//.test(value)) browser = 'Firefox';
    else if (/Safari\//.test(value)) browser = 'Safari';

    if (/iPhone/.test(value)) system = 'iPhone';
    else if (/iPad/.test(value)) system = 'iPad';
    else if (/Android/.test(value)) system = 'Android device';
    else if (/Macintosh/.test(value)) system = 'Mac';
    else if (/Windows/.test(value)) system = 'Windows computer';
    else if (/CrOS/.test(value)) system = 'Chromebook';
    else if (/Linux/.test(value)) system = 'Linux computer';

    return (browser + ' on ' + system).slice(0, 80);
  }

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
  }

  function createDeviceKey(cryptoObject) {
    if (cryptoObject && typeof cryptoObject.randomUUID === 'function') {
      return cryptoObject.randomUUID();
    }
    throw new Error('Secure device identifier unavailable');
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
    return 'We could not send a recovery code. Check the number and try again.';
  }

  function accountErrorMessage(code) {
    const messages = {
      AUTHENTICATION_REQUIRED: 'Your secure session expired. Verify your phone again.',
      CONSENT_REQUIRED: 'Accept the recovery terms before continuing.',
      PHONE_NOT_VERIFIED: 'Verify your phone before recovering this account.',
      ACCOUNT_NOT_FOUND: 'We could not recover an existing citizen account with this verification.',
      INVALID_DEVICE: 'This browser could not create a secure device record.',
      INVALID_DEVICE_LABEL: 'This browser could not create a valid device label.',
      CURRENT_DEVICE_NOT_REGISTERED: 'Register this browser before securing other sessions.'
    };
    return messages[code] || 'The account action did not complete. Try again.';
  }

  function formatDate(value, locale) {
    const date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) return 'Unknown time';
    return new Intl.DateTimeFormat(locale || undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  }

  return Object.freeze({
    countries,
    digitsOnly,
    normalizeE164,
    maskPhone,
    readOtp,
    deviceFamily,
    deviceLabel,
    isUuid,
    createDeviceKey,
    friendlyAuthError,
    accountErrorMessage,
    formatDate
  });
});
