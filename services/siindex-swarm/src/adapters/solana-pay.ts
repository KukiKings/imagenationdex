import { encodeURL } from "@solana/pay";
import { address } from "@solana/kit";
import type { PolicyDecision } from "../contracts.js";

export const DEVNET_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

export interface SolanaPayPrivateTestInput {
  recipient: string;
  amount: string;
  reference: string;
  label: string;
  message: string;
  memo: string;
  decision: PolicyDecision;
}

export interface PreparedSolanaPayRequest {
  status: "unsigned_private_test_request";
  network: "solana-devnet";
  asset: "TEST_USDC";
  uri: string;
  recipient: string;
  amount: string;
  reference: string;
}

export function prepareSolanaPayRequest(input: SolanaPayPrivateTestInput): PreparedSolanaPayRequest {
  if (input.decision.status !== "allowed") {
    throw new Error("Policy decision must allow Solana Pay request preparation.");
  }
  const normalizedAmount = input.amount.trim();
  if (!/^\d+(?:\.\d{1,6})?$/.test(normalizedAmount)) {
    throw new Error("TEST_USDC amount must be positive with no more than six decimal places.");
  }
  const amount = Number(normalizedAmount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
    throw new Error("TEST_USDC amount must be between 0 and 1,000,000.");
  }
  const recipient = address(input.recipient);
  const reference = address(input.reference);
  const uri = encodeURL({
    recipient,
    amount,
    splToken: address(DEVNET_USDC_MINT),
    reference,
    label: input.label.slice(0, 64),
    message: input.message.slice(0, 128),
    memo: input.memo.slice(0, 128),
  });
  return Object.freeze({
    status: "unsigned_private_test_request",
    network: "solana-devnet",
    asset: "TEST_USDC",
    uri: uri.toString(),
    recipient,
    amount: String(amount),
    reference,
  });
}
