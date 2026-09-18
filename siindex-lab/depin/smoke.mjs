#!/usr/bin/env node
/**
 * Runnable without API keys. Exit 0 only if all policy tests pass.
 */
import { gate, POLICY } from './policy.mjs';

const results = [];

function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
    console.log('PASS', name);
  } catch (e) {
    results.push({ name, ok: false, err: String(e.message || e) });
    console.error('FAIL', name, e.message || e);
  }
}

function expect(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

console.log('SIINDEX DEPIN lab smoke — policy only');
console.log('policy version', POLICY.version);

test('public product not claimed live', () => {
  expect(POLICY.public_product_live === false);
});

test('payments rail is solana-only', () => {
  expect(POLICY.payments_rail === 'solana-only');
  expect(POLICY.moonpay_allowed === false);
});

test('MoonPay path blocked', () => {
  const r = gate({ cluster: 'devnet', action: 'read', useMoonPay: true });
  expect(!r.ok, 'MoonPay should fail');
});

test('devnet read allowed', () => {
  const r = gate({ cluster: 'devnet', action: 'read' });
  expect(r.ok, r.reason);
});

test('mainnet blocked without AJ', () => {
  const r = gate({ cluster: 'mainnet-beta', action: 'read', ajAuthorized: false });
  expect(!r.ok, 'mainnet should fail');
});

test('transfer blocked without AJ', () => {
  const r = gate({ cluster: 'devnet', action: 'transfer', ajAuthorized: false, spendUsd: 1 });
  expect(!r.ok, 'transfer should fail');
});

test('book_gpu blocked without AJ', () => {
  const r = gate({ cluster: 'devnet', action: 'book_gpu', ajAuthorized: false });
  expect(!r.ok);
});

test('mesh in frontend blocked', () => {
  const r = gate({ cluster: 'devnet', action: 'read', meshInFrontend: true });
  expect(!r.ok);
});

test('community skills blocked by default', () => {
  const r = gate({ cluster: 'devnet', action: 'read', installCommunitySkills: true });
  expect(!r.ok);
});

test('AJ can authorize transfer on devnet', () => {
  const r = gate({ cluster: 'devnet', action: 'transfer', ajAuthorized: true, spendUsd: 1 });
  expect(r.ok, r.reason);
});

const failed = results.filter((r) => !r.ok);
console.log('---');
console.log(`passed ${results.length - failed.length}/${results.length}`);
if (failed.length) {
  process.exit(1);
}
console.log('SMOKE OK — Phase A policy gates working');
process.exit(0);
