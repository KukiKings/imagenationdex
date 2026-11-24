'use strict';
// Unit tests for the orchestrator's user-scoped client and action tagging.
// Run: cd agents && npm install && npm test
// No test touches the network or a database: signature verification is injected.
process.env.SUPABASE_URL = 'https://testproj.supabase.co';
process.env.SUPABASE_ANON_KEY = 'anon-test-key';

const test = require('node:test');
const assert = require('node:assert');
const { createUserClient, dispatch, assignSkill, listRegisteredSkills, checkTier3Consent } = require('./orchestrator');

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

// ---- Skill assignment (SIINDEX names a skill; orchestrator looks it up; gate; filtered result) ----
const goodConsent = (skill) => ({
  approved: true, skill, queue_entry: 'consent-queue/2026-11-24-example.md', run_id: 'run-1',
  answered_at: '2026-11-24T01:00:00Z', window_ends_at: '2026-11-24T02:00:00Z',
  packet: { what: 'w', why: 'y', risk: 'r', alternatives: 'a' },
});

test('assignSkill: a registered skill name is accepted and its SKILL.md is returned', async () => {
  const r = await assignSkill({ skill: 'siindex-devops', tier: 1 });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.skill, 'siindex-devops');
  assert.strictEqual(r.gate, 'auto');
  assert.strictEqual(r.entry, 'SIINDEX-Skills/siindex-devops/SKILL.md');
  assert.ok(r.instructions.includes('siindex-devops'));
  assert.ok(r.description.length > 0);
});

test('assignSkill: an unknown skill name is rejected as skill_not_registered', async () => {
  for (const bad of ['no-such-skill', '', undefined, null, '../agents', '../../etc/passwd', '/etc/passwd', 'siindex-devops/../siindex-treasury', 'SIINDEX-DEVOPS']) {
    const r = await assignSkill({ skill: bad, tier: 1 });
    assert.strictEqual(r.ok, false, String(bad));
    assert.strictEqual(r.error, 'skill_not_registered', String(bad));
  }
});

test('assignSkill: the presentation-critical skills exist as directories and can be named', () => {
  const have = listRegisteredSkills();
  for (const n of ['siindex-devops', 'siindex-citizen-ops', 'pqsi-compliance', 'siindex-community-report', 'siindex-pre-build-checklist', 'siindex-coo-orchestrator']) {
    assert.ok(have.has(n), n);
  }
});

test('assignSkill: tier 1 and 2 proceed (tier 2 asks for a notification); tier 4 is blocked with no override', async () => {
  const t2 = await assignSkill({ skill: 'siindex-citizen-ops', tier: 2 });
  assert.strictEqual(t2.ok, true); assert.strictEqual(t2.notify_required, true);
  const t4 = await assignSkill({ skill: 'siindex-devops', tier: 4, consent: goodConsent('siindex-devops') });
  assert.strictEqual(t4.ok, false); assert.strictEqual(t4.error, 'blocked_tier_4');
});

test('assignSkill: tier 3 needs a complete, in-window, same-skill consent; otherwise it is refused', async () => {
  const s = 'siindex-treasury';
  assert.strictEqual((await assignSkill({ skill: s, tier: 3 })).error, 'consent_required');
  assert.strictEqual((await assignSkill({ skill: s, tier: 3, consent: { approved: false } })).error, 'consent_required');
  assert.strictEqual((await assignSkill({ skill: s, tier: 3, consent: { approved: true } })).error, 'consent_incomplete');
  const noRisk = goodConsent(s); noRisk.packet.risk = '';
  const r1 = await assignSkill({ skill: s, tier: 3, consent: noRisk });
  assert.strictEqual(r1.error, 'consent_incomplete'); assert.ok(r1.missing.includes('packet.risk'));
  const late = { ...goodConsent(s), answered_at: '2026-11-24T03:00:00Z' };
  assert.strictEqual((await assignSkill({ skill: s, tier: 3, consent: late })).error, 'consent_expired');
  assert.strictEqual((await assignSkill({ skill: s, tier: 3, consent: goodConsent('siindex-devops') })).error, 'consent_incomplete');
  const ok = await assignSkill({ skill: s, tier: 3, consent: goodConsent(s) });
  assert.strictEqual(ok.ok, true); assert.strictEqual(ok.gate, 'consent_verified');
});

test('assignSkill: unsure or security tasks take the higher tier', async () => {
  assert.strictEqual((await assignSkill({ skill: 'siindex-devops' })).error, 'consent_required');
  assert.strictEqual((await assignSkill({ skill: 'siindex-devops', tier: 'low' })).error, 'consent_required');
  assert.strictEqual((await assignSkill({ skill: 'siindex-devops', tier: 2, security_setting: true })).error, 'consent_required');
});

test('assignSkill: touches no database unless the caller passes its own client', async () => {
  let calls = 0;
  const spy = { from: (t) => ({ insert: async (row) => { calls += 1; assert.strictEqual(t, 'agent_audit'); assert.ok(!JSON.stringify(row).includes('instructions')); } }) };
  await assignSkill({ skill: 'siindex-devops', tier: 1 });
  assert.strictEqual(calls, 0);
  await assignSkill({ skill: 'siindex-devops', tier: 1 }, { client: spy });
  await assignSkill({ skill: 'nope', tier: 1 }, { client: spy });
  assert.strictEqual(calls, 2);
});

test('checkTier3Consent: a bare yes is not enough', () => {
  assert.strictEqual(checkTier3Consent({ approved: true }, 'x').ok, false);
  assert.strictEqual(checkTier3Consent(undefined, 'x').error, 'consent_required');
});
