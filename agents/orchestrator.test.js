'use strict';
// Unit tests for the orchestrator's user-scoped client and action tagging.
// Run: cd agents && npm install && npm test
// No test touches the network or a database: signature verification is injected.
process.env.SUPABASE_URL = 'https://testproj.supabase.co';
process.env.SUPABASE_ANON_KEY = 'anon-test-key';

const test = require('node:test');
const assert = require('node:assert');
const { createUserClient, dispatch } = require('./orchestrator');

const URL_ = 'https://testproj.supabase.co';
const NOW = 1_800_000_000;
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function jwt(payload, header = { alg: 'HS256', typ: 'JWT' }) {
  return `${b64(header)}.${b64(payload)}.c2lnbmF0dXJl`;
}
const good = { iss: `${URL_}/auth/v1`, role: 'authenticated', sub: 'user-1', exp: NOW + 3600 };
function opts(verifyResult = true) {
  const o = { url: URL_, anonKey: 'anon-test-key', now: () => NOW, calls: 0 };
  o.verify = async () => { o.calls += 1; return verifyResult; };
  return o;
}
async function rejects(promise, reason) {
  await assert.rejects(promise, (e) => e.code === 'not_authenticated' && e.message === 'not_authenticated' && e.reason === reason);
}

test('valid JWT returns a user-scoped client', async () => {
  const o = opts(true);
  const c = await createUserClient(jwt(good), o);
  assert.strictEqual(typeof c.rpc, 'function');
  assert.strictEqual(o.calls, 1);
});

test('expired JWT is rejected before verification', async () => {
  const o = opts(true);
  await rejects(createUserClient(jwt({ ...good, exp: NOW - 1 }), o), 'expired');
  assert.strictEqual(o.calls, 0);
});

test('malformed JWT is rejected before verification', async () => {
  const o = opts(true);
  await rejects(createUserClient('not-a-jwt', o), 'malformed');
  await rejects(createUserClient('a.b.c', o), 'malformed');
  assert.strictEqual(o.calls, 0);
});

test('missing JWT is rejected before verification', async () => {
  const o = opts(true);
  await rejects(createUserClient(undefined, o), 'missing');
  await rejects(createUserClient('', o), 'missing');
  await rejects(createUserClient('Bearer   ', o), 'missing');
  assert.strictEqual(o.calls, 0);
});

test('JWT from another project is rejected', async () => {
  const o = opts(true);
  await rejects(createUserClient(jwt({ ...good, iss: 'https://other.supabase.co/auth/v1' }), o), 'wrong_project');
  assert.strictEqual(o.calls, 0);
});

test('anon or service-role style token is rejected as not a user token', async () => {
  const o = opts(true);
  await rejects(createUserClient(jwt({ ...good, role: 'anon' }), o), 'not_user_token');
  await rejects(createUserClient(jwt({ ...good, sub: undefined }), o), 'not_user_token');
});

test('bad signature (verifier says no, or throws) is rejected', async () => {
  await rejects(createUserClient(jwt(good), opts(false)), 'bad_signature');
  const o = opts(true);
  o.verify = async () => { throw new Error('network'); };
  await rejects(createUserClient(jwt(good), o), 'bad_signature');
});

test('dispatch: user action with no JWT throws not_authenticated and never touches the database', async () => {
  let dbCalls = 0;
  const spy = new Proxy({}, { get: () => () => { dbCalls += 1; throw new Error('database touched'); } });
  await assert.rejects(
    dispatch({ action: 'get_citizen_by_phone', params: { phone: '+61451565863' } }, spy),
    (e) => e.code === 'not_authenticated'
  );
  await assert.rejects(
    dispatch({ action: 'get_citizen_by_phone', params: { phone: '+61451565863', jwt: 'garbage' } }, spy),
    (e) => e.code === 'not_authenticated'
  );
  assert.strictEqual(dbCalls, 0);
});
