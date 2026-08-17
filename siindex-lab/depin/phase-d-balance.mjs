#!/usr/bin/env node
/**
 * Phase D2 — policy-gated Solana devnet balance read.
 * Solana-native (@solana/web3.js). No MoonPay. No mainnet without AJ.
 * Lab only — not public product. Doctrine: what-we-build-on.md / user.md Solana stack.
 */
import { Connection, Keypair, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import { assertGate, POLICY } from './policy.mjs';

const cluster = String(process.env.CLUSTER || 'devnet').toLowerCase();
const aj = String(process.env.AJ_AUTHORIZED || 'false').toLowerCase() === 'true';
const rpc =
  process.env.SOLANA_RPC_URL ||
  (cluster === 'mainnet-beta' || cluster === 'mainnet'
    ? clusterApiUrl('mainnet-beta')
    : clusterApiUrl('devnet'));

console.log('Phase D balance — cluster', cluster, 'AJ', aj);
console.log('policy', POLICY.version, 'payments_rail', POLICY.payments_rail);

assertGate({ cluster, action: 'read', ajAuthorized: aj });

const connection = new Connection(rpc, 'confirmed');
const kp = Keypair.generate();
const lamports = await connection.getBalance(kp.publicKey);
const sol = lamports / LAMPORTS_PER_SOL;

console.log('pubkey', kp.publicKey.toBase58());
console.log('balance_lamports', lamports);
console.log('balance_sol', sol);
console.log('PHASE_D2_OK — lab only, not public product');
process.exit(0);
