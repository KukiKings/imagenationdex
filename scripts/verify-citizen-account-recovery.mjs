import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const core = require('../js/citizen-account-core.js');
const read = (path) => fs.readFileSync(path, 'utf8');

const recoveryPage = read('account-recovery.html');
const recoveryController = read('js/account-recovery.js');
const securityPage = read('account-security.html');
const securityController = read('js/account-security.js');
const migration = read('supabase/migrations/20260806_citizen_accounts_recovery.sql');
const legacySession = read('siindex-session-sovereignty.html');
const legacySecurity = read('security-settings.html');
const login = read('login.html');
const tier0Controller = read('js/tier0-identity.js');
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
assert.match(core.maskPhone('+61412345678'), /^\+614/);
assert.equal(core.maskPhone('+61412345678').endsWith('78'), true);
assert.equal(core.deviceFamily('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)'), 'mobile');
assert.equal(core.deviceFamily('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'), 'desktop');
assert.equal(core.deviceLabel('Mozilla/5.0 (Macintosh) Chrome/126.0'), 'Chrome on Mac');
assert.equal(core.isUuid('018f47a6-9b6b-7c33-8b07-61a44f9d1224'), true);

assert.match(recoveryPage, /id="recoveryConsent"/);
assert.match(recoveryPage, /Build Mode · Private Testing/);
assert.match(securityPage, /Build Mode · Private Testing/);
assert.match(recoveryPage, /id="sharedDevice"/);
assert.match(recoveryPage, /autocomplete="one-time-code"/);
assert.match(recoveryPage, /does not create a new citizen identity, wallet, token, payment or blockchain asset/);
assert.match(recoveryPage, /Existing security holds remain active until reviewed/);
assert.doesNotMatch(recoveryPage, /assets never at risk|Cloud Key|Recovery Key|INDX balance/i);

assert.match(recoveryController, /shouldCreateUser: false/);
assert.match(recoveryController, /auth\.verifyOtp/);
assert.match(recoveryController, /auth\.signOut\(\{ scope: 'others' \}\)/);
assert.match(recoveryController, /rpc\('complete_my_account_recovery'/);
assert.match(recoveryController, /p_terms_version: TERMS_VERSION/);
assert.doesNotMatch(recoveryController, /get_citizen_by_phone|set_account_freeze|set_card_freeze|claim_tier0_identity/);

assert.match(securityPage, /Verified devices/);
assert.match(securityPage, /The device list is account evidence/);
assert.match(securityPage, /stores no access token, refresh token, OTP, raw phone number or browser fingerprint/);
assert.doesNotMatch(securityPage, /trusted device|security score|Face ID|2FA/i);

assert.match(securityController, /auth\.getUser/);
assert.match(securityController, /rpc\('register_my_citizen_device'/);
assert.match(securityController, /rpc\('get_my_citizen_devices'/);
assert.match(securityController, /auth\.signOut\(\{ scope: 'others' \}\)/);
assert.match(securityController, /auth\.signOut\(\{ scope: 'local' \}\)/);
assert.match(securityController, /auth\.signOut\(\{ scope: 'global' \}\)/);
assert.match(securityController, /rpc\('record_my_global_sign_out'/);
assert.doesNotMatch(securityController, /revoke_device|revoke_my_device|access_token|refresh_token/);

const providerOtherIndex = securityController.indexOf("sb.auth.signOut({ scope: 'others' })");
const evidenceOtherIndex = securityController.indexOf("sb.rpc('secure_my_other_device_records'");
assert.ok(providerOtherIndex >= 0 && evidenceOtherIndex > providerOtherIndex, 'provider revocation must precede the other-session receipt');

const globalReceiptIndex = securityController.indexOf("sb.rpc('record_my_global_sign_out'");
const globalProviderIndex = securityController.indexOf("sb.auth.signOut({ scope: 'global' })");
assert.ok(globalReceiptIndex >= 0 && globalProviderIndex > globalReceiptIndex, 'global request must be recorded while the citizen is authenticated');

assert.match(migration, /create table if not exists public\.citizen_account_devices/);
assert.match(migration, /create table if not exists public\.citizen_account_receipts/);
assert.match(migration, /alter table public\.citizen_account_devices enable row level security/);
assert.match(migration, /alter table public\.citizen_account_receipts enable row level security/);
assert.match(migration, /\(select auth\.uid\(\)\) = auth_user_id/g);
assert.match(migration, /u\.phone_confirmed_at/);
assert.match(migration, /citizen-account-recovery-v1/);
assert.match(migration, /account_security_hold_preserved/);
assert.match(migration, /card_security_hold_preserved/);
assert.match(migration, /wallet_or_token_changed', false/);
assert.match(migration, /global_sign_out_requested/);
assert.match(migration, /revoke all on function public\.complete_my_account_recovery\(text, uuid, text, text, boolean\) from public, anon/);
assert.doesNotMatch(migration, /grant execute[^;]+to anon/i);
assert.doesNotMatch(migration, /access_token|refresh_token|raw_phone|user_agent|ip_address/i);
assert.doesNotMatch(migration, /set\s+account_frozen\s*=\s*false|set\s+card_frozen\s*=\s*false/i);

assert.match(legacySession.slice(0, 400), /window\.location\.replace\('\/account-security'\)/);
assert.match(legacySecurity.slice(0, 400), /window\.location\.replace\('\/account-security'\)/);
assert.match(login, /id="openSecurityButton"/);
assert.match(login, /href="\/account-recovery"/);
assert.match(tier0Controller, /window\.location\.assign\('\/account-security'\)/);

for (const [src, dest] of [
  ['^/account-recovery$', '/account-recovery.html'],
  ['^/account-recovery\\.html$', '/account-recovery.html'],
  ['^/account-security$', '/account-security.html'],
  ['^/account-security\\.html$', '/account-security.html'],
  ['^/(siindex-session-sovereignty|security-settings)\\.html$', '/account-security.html']
]) {
  assert.ok(routes.some((route) => route.src === src && route.dest === dest), `${src} must route to ${dest}`);
}

for (const path of [
  'account-recovery.html',
  'account-security.html',
  'js/account-recovery.js',
  'js/account-security.js',
  'js/citizen-account-core.js',
  'citizen-account-recovery-activation.md'
]) {
  const source = read(path);
  assert.doesNotMatch(source, /GOD MODE/);
  assert.doesNotMatch(source, /artificial intelligence/i);
  assert.doesNotMatch(source, /—/);
}

console.log('IN$DEX persistent citizen account and recovery verification passed.');
