// Run: node --experimental-strip-types --test supabase/functions/csp-reports/sanitize.test.mjs
import test from 'node:test';
import assert from 'node:assert';
import { clean, sanitizeSample, originAllowed } from './sanitize.ts';

test('sanitized sample passes through, capped at 40 chars', () => {
  assert.strictEqual(sanitizeSample("console.log('hi')"), "console.log('hi')");
  const long = 'a b '.repeat(30);
  assert.strictEqual(sanitizeSample(long).length, 40);
});

test('token-like or out-of-set sample is dropped entirely', () => {
  assert.strictEqual(sanitizeSample('sb_secret_AbCdEf0123456789AbCdEf0123456789'), null);
  assert.strictEqual(sanitizeSample('eyJhbGciOiJIUzI1NiJ9'), null);
  assert.strictEqual(sanitizeSample('x = `${secret}`'), null);
  assert.strictEqual(sanitizeSample('line1\nline2'), null);
});

test('clean(): sample key removed when unsafe, URLs stripped and capped', () => {
  const rep = {
    type: 'csp-violation',
    url: 'https://imagenationdex.com/onboard?token=abc#frag',
    body: {
      documentURL: 'https://imagenationdex.com/onboard?token=abc',
      blockedURL: 'https://evil.example/x.js?k=1',
      referrer: 'https://r.example/' + 'a'.repeat(5000),
      originalPolicy: 'default-src ' + 'x'.repeat(9000),
      sample: 'sb_secret_AbCdEf0123456789AbCdEf0123456789',
    },
  };
  const c = clean(rep);
  assert.strictEqual(c.url, 'https://imagenationdex.com/onboard');
  assert.strictEqual(c.body.documentURL, 'https://imagenationdex.com/onboard');
  assert.strictEqual(c.body.blockedURL, 'https://evil.example/x.js');
  assert.ok(c.body.referrer.length <= 2048);
  assert.ok(c.body.originalPolicy.length <= 4096);
  assert.ok(!('sample' in c.body));
});

test('origin policy', () => {
  assert.strictEqual(originAllowed(null), true);
  assert.strictEqual(originAllowed('https://imagenationdex.com'), true);
  assert.strictEqual(originAllowed('https://www.imagenationdex.com'), true);
  assert.strictEqual(originAllowed('https://evil.example'), false);
  assert.strictEqual(originAllowed('https://imagenationdex.com.evil.example'), false);
  assert.strictEqual(originAllowed('https://notimagenationdex.com'), false);
  assert.strictEqual(originAllowed('http://imagenationdex.com'), false);
  assert.strictEqual(originAllowed('null'), false);
});
