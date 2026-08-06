import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const core = require('../js/wallet-payments-core.js');
const read = (path) => fs.readFileSync(path, 'utf8');

const page = read('wallet-payments.html');
const controller = read('js/wallet-payments.js');
const migration = read('supabase/migrations/20260806_private_test_wallet_payments.sql');
const activation = read('wallet-payments-activation.md');
const handoff = read('CLAUDE_CURRENT_HANDOFF.md');
const routes = JSON.parse(read('vercel.json')).routes || [];

assert.deepEqual(core.amountToAtomic('1', 'TEST_USDC'), { ok: true, atomic: '1000000', reason: 'valid' });
assert.deepEqual(core.amountToAtomic('0.000001', 'TEST_INDX'), { ok: true, atomic: '1', reason: 'valid' });
assert.equal(core.amountToAtomic('1.0000001', 'TEST_USDC').ok, false);
assert.equal(core.amountToAtomic('0', 'TEST_USDC').ok, false);
assert.equal(core.amountToAtomic('-1', 'TEST_USDC').ok, false);
assert.equal(core.amountToAtomic('1e4', 'TEST_USDC').ok, false);
assert.equal(core.amountToAtomic('9007199254740993.000001', 'TEST_USDC').atomic, '9007199254740993000001');
assert.equal(core.formatAtomic('12500000', 'TEST_USDC'), '12.50 TEST_USDC');
assert.equal(core.formatAtomic('1', 'TEST_INDX'), '0.000001 TEST_INDX');
assert.equal(core.normalizeDomain('@Mama-Noe'), 'mama-noe.in$dex');
assert.equal(core.validateDomain('mama-noe').ok, true);
assert.equal(core.validateDomain('a').ok, false);
assert.equal(core.validateDomain('bad--name').ok, false);
assert.equal(core.validateCountry('cook islands').country, 'Cook Islands');
assert.equal(core.validateCountry('Atlantis').ok, false);
assert.equal(core.cleanText('hello\u0000  citizen', 20), 'hello citizen');

const requestId = '018f47a6-9b6b-7c33-8b07-61a44f9d1224';
assert.equal(
  core.buildPaymentLink('https://preview.example', requestId),
  'https://preview.example/wallet-payments?request=018f47a6-9b6b-7c33-8b07-61a44f9d1224'
);
assert.equal(core.paymentRequestFromLocation('?request=' + requestId), requestId);
assert.equal(core.paymentRequestFromLocation('?request=wrong'), '');
assert.throws(() => core.buildPaymentLink('https://preview.example', 'wrong'));
assert.match(core.errorMessage('IDEMPOTENCY_CONFLICT'), /already used/i);
assert.match(core.errorMessage('ACCOUNT_SECURITY_HOLD'), /security hold/i);

for (const id of [
  'signedOutPanel', 'walletSetupPanel', 'walletConsent', 'walletApp',
  'incomingRequestPanel', 'faucetPanel', 'sendForm', 'requestForm',
  'remittanceForm', 'billForm', 'merchantPanel', 'merchantOrderForm',
  'cardPurchaseForm', 'transactionList',
  'refundRequestList', 'liveStatus'
]) {
  assert.match(page, new RegExp(`id="${id}"`), `${id} must exist`);
}

const ids = [...page.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, 'wallet page must not contain duplicate IDs');
assert.match(page, /Build Mode · Private Testing/);
assert.match(page, /Nothing here moves real money/);
assert.match(page, /TEST_USDC/);
assert.match(page, /TEST_INDX/);
assert.match(page, /not a real payment card/i);
assert.match(page, /requires my manual approval/i);
assert.match(page, /Settlement: internal private-test wallet only/);
assert.match(page, /integrity="sha384-JWEyvHh/);
assert.match(page, /qrcodejs@1\.0\.0\/qrcode\.min\.js/);
assert.match(page, /integrity="sha384-3zSEDfvllQohrq0PHL1fOXJuC\/jSOO34H46t6UQfobFOmxE5BpjjaIJY5F2\/bMnU"/);
assert.doesNotMatch(page, /Visa|Mastercard|guaranteed|live market price/i);

assert.match(controller, /auth\.getUser\(\)/);
assert.doesNotMatch(controller, /auth\.getSession\(\)/);
assert.match(controller, /crypto\.randomUUID/);
assert.match(controller, /REQUEST_TIMEOUT_MS = 30000/);
assert.match(controller, /p_idempotency_key: createUuid\(\)/g);
assert.match(controller, /core\.amountToAtomic/);
assert.match(controller, /textContent/);
assert.doesNotMatch(controller, /\.innerHTML\s*=/);
assert.doesNotMatch(controller, /sessionStorage.*balance|localStorage.*balance/i);
assert.doesNotMatch(controller, /indx-wallet\.js|signAndSend|signTransaction|sendTransaction|mainnet/i);

for (const rpc of [
  'ensure_my_private_test_wallet',
  'claim_my_private_test_funds',
  'resolve_private_test_recipient',
  'send_my_private_test_transfer',
  'create_my_private_test_payment_request',
  'get_private_test_payment_request',
  'pay_private_test_payment_request',
  'cancel_my_private_test_payment_request',
  'send_my_private_test_remittance',
  'pay_my_private_test_bill',
  'cancel_my_private_test_bill_schedule',
  'register_my_private_test_merchant',
  'create_my_private_test_merchant_order',
  'issue_my_private_test_card',
  'set_my_private_test_card_frozen',
  'authorize_my_private_test_card_purchase',
  'request_my_private_test_refund',
  'decide_my_private_test_refund',
  'get_my_private_test_wallet_dashboard'
]) {
  assert.match(controller, new RegExp(`['"]${rpc}['"]`), `${rpc} must be called by the controller`);
  assert.match(migration, new RegExp(`create or replace function public\\.${rpc}\\(`), `${rpc} must exist in the migration`);
}

const tables = [
  'private_test_wallets',
  'private_test_ledger_accounts',
  'private_test_transactions',
  'private_test_ledger_entries',
  'private_test_faucet_claims',
  'private_test_payment_requests',
  'private_test_billers',
  'private_test_bill_schedules',
  'private_test_merchants',
  'private_test_merchant_orders',
  'private_test_cards',
  'private_test_remittances',
  'private_test_refund_requests'
];
for (const table of tables) {
  assert.match(migration, new RegExp(`create table if not exists public\\.${table} \\(`));
  assert.match(migration, new RegExp(`'${table}'`), `${table} must be included in the RLS loop`);
}
assert.match(migration, /alter table public\.%I enable row level security/);
assert.match(migration, /revoke all on table public\.%I from anon, authenticated/);
assert.doesNotMatch(migration, /grant\s+(select|insert|update|delete|all)\s+on\s+(table\s+)?public\.private_test_/i);
assert.match(migration, /revoke all on function public\.private_test_post_ledger_transaction[^;]+from public, anon, authenticated/);
assert.doesNotMatch(migration, /grant execute on function public\.private_test_post_ledger_transaction/i);
assert.doesNotMatch(migration, /grant execute[^;]+to anon/i);

const securityDefinerCount = (migration.match(/security definer/g) || []).length;
const searchPathCount = (migration.match(/set search_path = pg_catalog, public, auth/g) || []).length;
assert.equal(securityDefinerCount, 20, 'all 20 wallet functions must be security definer');
assert.equal(searchPathCount, securityDefinerCount, 'every security-definer function must pin search_path');
assert.ok((migration.match(/auth\.uid\(\)/g) || []).length >= securityDefinerCount);

assert.match(migration, /balance_atomic bigint not null default 0/);
assert.match(migration, /constraint private_test_ledger_balance_check check \(balance_atomic >= 0\)/);
assert.match(migration, /entry_type in \('debit', 'credit'\)/);
assert.match(migration, /\(v_transaction_id, v_source\.id, 'debit'/);
assert.match(migration, /\(v_transaction_id, v_destination\.id, 'credit'/);
assert.match(migration, /private_test_transaction_actor_idempotency_unique unique \(actor_auth_user_id, idempotency_key\)/);
assert.match(migration, /private-test-idempotency:/);
assert.match(migration, /IDEMPOTENCY_CONFLICT/);
assert.match(migration, /v_existing\.metadata = v_metadata/);
assert.match(migration, /for update/g);
assert.match(migration, /DAILY_LIMIT_EXCEEDED/);
assert.match(migration, /INSUFFICIENT_TEST_BALANCE/);
assert.match(migration, /ACCOUNT_SECURITY_HOLD/);
assert.match(migration, /account_frozen/);
assert.match(migration, /transaction_type in \('faucet', 'transfer', 'payment_request', 'remittance', 'bill', 'card_purchase', 'refund'\)/);
assert.match(migration, /requires_recipient_approval', true/);
assert.match(migration, /r\.refunding_wallet_id = v_wallet_id for update/);
assert.match(migration, /cadence = 'monthly_manual_approval'/);
assert.match(migration, /source_transaction_id uuid not null unique/);
assert.match(migration, /settlement_transaction_id uuid unique/);
assert.match(migration, /external_settlement', false/);
assert.match(migration, /real_card_network', false/);
assert.match(migration, /real_world_effect', false/g);
assert.match(migration, /network text not null default 'sandbox'/);
assert.match(migration, /asset in \('TEST_USDC', 'TEST_INDX'\)/g);
assert.doesNotMatch(migration, /\b(private_key|seed_phrase|mnemonic|access_token|refresh_token|card_pan|card_cvv)\b/i);
assert.doesNotMatch(migration, /asset\s+in\s*\([^)]*'(SOL|USDC)'/i);
assert.doesNotMatch(migration, /network\s+text[^\n]*default\s+'mainnet'/i);

for (const [src, dest] of [
  ['^/(wallet|payments|wallet-payments)$', '/wallet-payments.html'],
  ['^/wallet-payments\\.html$', '/wallet-payments.html'],
  ['^/(send|receive|pay|remittance|bill-pay|my-card|history|receipt|transaction-confirm|transaction-error|payment-methods|card-atm-withdrawal|card-cashback|card-freeze|card-top-up|merchant-card-topup|zero-balance-mode)(?:\\.html)?$', '/wallet-payments.html']
]) {
  assert.ok(routes.some((route) => route.src === src && route.dest === dest), `${src} must route to ${dest}`);
}

assert.match(activation, /Not migrated, preview-deployed or activated/);
assert.match(activation, /three designated test citizen accounts/i);
assert.match(activation, /AJ approval/);
assert.match(handoff, /Do not use `js\/indx-wallet\.js`/);
assert.match(handoff, /Refunds require the receiving citizen's explicit approval/);
assert.match(handoff, /No scheduled checker may apply the migration/);

for (const source of [page, controller, activation, handoff]) {
  assert.doesNotMatch(source, /GOD MODE/);
  assert.doesNotMatch(source, /artificial intelligence/i);
  assert.doesNotMatch(source, /—/);
}

const beginCount = (migration.match(/^begin;$/gm) || []).length;
const commitCount = (migration.match(/^commit;$/gm) || []).length;
const dollarQuoteCount = (migration.match(/\$\$/g) || []).length;
assert.equal(beginCount, 1);
assert.equal(commitCount, 1);
assert.equal(dollarQuoteCount % 2, 0, 'SQL dollar quotes must be balanced');

console.log('IN$DEX private-test wallet and payments verification passed.');
