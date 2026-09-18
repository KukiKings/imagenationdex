#!/usr/bin/env node
/**
 * Phase D3 — optional tiny SOL transfer on **devnet only**.
 * Requires: AJ_AUTHORIZED=true + LAB_SECRET_KEY (base58 secret key of funded lab wallet).
 * Never runs mainnet. Never uses MoonPay. Lab only — not public product.
 *
 * Without secrets: exits 2 (PENDING) — does not invent spend.
 */
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  clusterApiUrl,
} from '@solana/web3.js';
import { assertGate, POLICY } from './policy.mjs';

const cluster = String(process.env.CLUSTER || 'devnet').toLowerCase();
const aj = String(process.env.AJ_AUTHORIZED || 'false').toLowerCase() === 'true';
const secretB58 = process.env.LAB_SECRET_KEY || '';
const destStr = process.env.LAB_DEST_PUBKEY || '';
const amountSol = Number(process.env.LAB_TRANSFER_SOL || '0.001');

console.log('Phase D3 transfer — cluster', cluster, 'AJ', aj);
console.log('policy', POLICY.version, 'rail', POLICY.payments_rail);

if (POLICY.moonpay_allowed) {
  console.error('FAIL: policy must keep moonpay_allowed false');
  process.exit(1);
}

try {
  assertGate({
    cluster,
    action: 'transfer',
    ajAuthorized: aj,
    spendUsd: amountSol * 150, // rough lab estimate; gate uses AJ flag primarily
  });
} catch (e) {
  console.error('POLICY_BLOCK', e.message || e);
  console.error('D3_PENDING — set AJ_AUTHORIZED=true and funded LAB_SECRET_KEY on devnet only');
  process.exit(2);
}

if (!secretB58) {
  console.error('D3_PENDING — LAB_SECRET_KEY missing (base58 secret of funded lab keypair)');
  process.exit(2);
}

if (cluster !== 'devnet' && cluster !== 'localnet' && cluster !== 'test') {
  console.error('REFUSE non-lab cluster');
  process.exit(1);
}

function keypairFromSecret(b58) {
  // Prefer JSON array form for lab: LAB_SECRET_KEY='[1,2,...]'
  const trimmed = b58.trim();
  if (trimmed.startsWith('[')) {
    const arr = Uint8Array.from(JSON.parse(trimmed));
    return Keypair.fromSecretKey(arr);
  }
  // base64
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 80) {
    const buf = Buffer.from(trimmed, 'base64');
    return Keypair.fromSecretKey(new Uint8Array(buf));
  }
  throw new Error('LAB_SECRET_KEY must be JSON byte array or base64 secret key');
}

const from = keypairFromSecret(secretB58);
const rpc = process.env.SOLANA_RPC_URL || clusterApiUrl('devnet');
const connection = new Connection(rpc, 'confirmed');
const balance = await connection.getBalance(from.publicKey);
console.log('from', from.publicKey.toBase58(), 'lamports', balance);

if (balance < amountSol * LAMPORTS_PER_SOL + 5000) {
  console.error('D3_PENDING — lab wallet underfunded for', amountSol, 'SOL + fees');
  process.exit(2);
}

const to = destStr
  ? new PublicKey(destStr)
  : Keypair.generate().publicKey;

const tx = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: from.publicKey,
    toPubkey: to,
    lamports: Math.floor(amountSol * LAMPORTS_PER_SOL),
  })
);

const sig = await sendAndConfirmTransaction(connection, tx, [from]);
console.log('to', to.toBase58());
console.log('signature', sig);
console.log('PHASE_D3_OK — lab devnet only, not public product');
process.exit(0);
