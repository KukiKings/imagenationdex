import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const core = require('../js/tier0-identity-core.js');
const read = (path) => fs.readFileSync(path, 'utf8');

const login = read('login.html');
const controller = read('js/tier0-identity.js');
const migration = read('supabase/migrations/20260805_tier0_identity_issuance.sql');
const routes = JSON.parse(read('vercel.json')).routes || [];

assert.deepEqual(core.normalizeE164('+61', '0412 345 678'), {
  ok: true,
  value: '+61412345678',
  reason: 'valid'
});
assert.deepEqual(core.normalizeE164('+682', '12 345'), {
  ok: true,
  value: '+68212345',
  reason: 'valid'
});
assert.equal(core.normalizeE164('+61', '12').ok, false);
assert.equal(core.normalizeHandle('  AJ-Henry.IN$DEX  '), 'aj-henry');
assert.equal(core.validateHandle('aj-henry').domain, 'aj-henry.IN$DEX');
assert.equal(core.validateHandle('-admin').ok, false);
assert.equal(core.validateHandle('ab').ok, false);
assert.equal(core.validateHandle('aj--henry').ok, false);
assert.equal(core.validateDisplayName(' AJ Henry ').name, 'AJ Henry');
assert.equal(core.validateDisplayName('A').ok, false);

assert.match(login, /id="phoneConsent"/);
assert.match(login, /autocomplete="one-time-code"/);
assert.match(login, /id="handleInput"/);
assert.match(login, /It does not create a wallet, token balance, public DNS name or blockchain asset/);
assert.doesNotMatch(login, /Setting up wallet|claim_genesis_signup_bonus|\.from\(['"]citizens['"]\)\.upsert/);

assert.match(controller, /auth\.signInWithOtp/);
assert.match(controller, /auth\.verifyOtp/);
assert.match(controller, /rpc\('record_tier0_phone_consent'/);
assert.match(controller, /rpc\('check_name_indx_availability'/);
assert.match(controller, /rpc\('claim_tier0_identity'/);
assert.match(controller, /p_terms_version: TERMS_VERSION/);
assert.doesNotMatch(controller, /citizen-dashboard\.html/);
assert.doesNotMatch(controller, /claim_genesis_signup_bonus|create_onboarding_citizen/);

assert.match(migration, /create table if not exists public\.citizen_identity_claims/);
assert.match(migration, /constraint citizen_identity_handle_unique unique \(handle\)/);
assert.match(migration, /security definer\s+set search_path = pg_catalog, public, auth/);
assert.match(migration, /u\.phone_confirmed_at/);
assert.match(migration, /create table if not exists public\.tier0_auth_receipts/);
assert.match(migration, /grant execute on function public\.record_tier0_phone_consent\(text\) to authenticated/);
assert.match(migration, /pg_advisory_xact_lock/);
assert.match(migration, /grant execute on function public\.claim_tier0_identity\(text, text, text\) to authenticated/);
assert.match(migration, /revoke insert on table public\.citizens from authenticated/);
assert.match(migration, /revoke all on function public\.create_onboarding_citizen\(jsonb\)/);
assert.match(migration, /revoke all on function public\.claim_genesis_signup_bonus_anon\(uuid\)/);

for (const page of [
  'join.html',
  'onboarding-flow.html',
  'quickstart-onboarding.html',
  'grid-account-onboarding.html',
  'creator-onboarding.html'
]) {
  assert.match(read(page), /js\/tier0-canonical-route\.js/, `${page} must route to the canonical Tier 0 flow`);
}

assert.ok(routes.some((route) => route.src === '^/tier0$' && route.dest === '/login.html'));
assert.ok(routes.some((route) => route.src === '^/login\\.html$' && route.dest === '/login.html'));

console.log('IN$DEX Tier 0 identity verification passed.');
