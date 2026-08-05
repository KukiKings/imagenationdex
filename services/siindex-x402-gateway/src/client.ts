import { x402Client } from "@x402/core/client";
import {
  SOLANA_DEVNET_CAIP2,
  type ClientSvmSigner,
} from "@x402/svm";
import { registerExactSvmScheme } from "@x402/svm/exact/client";
import { privateTestPolicy } from "./policy.js";

export interface PaymentApproval {
  id: string;
  subjectId: string;
  maximumAtomic: bigint;
  expiresAt: string;
}

export function assertPaymentApproval(
  approval: PaymentApproval,
  subjectId: string,
  requestedAtomic: bigint,
  now = new Date(),
): void {
  if (approval.subjectId !== subjectId) throw new Error("Payment approval belongs to a different subject.");
  if (Date.parse(approval.expiresAt) <= now.getTime()) throw new Error("Payment approval has expired.");
  if (requestedAtomic < 0n || requestedAtomic > approval.maximumAtomic) throw new Error("Payment exceeds the approved amount.");
  if (requestedAtomic > 1_000n) throw new Error("Payment exceeds the private-test x402 ceiling.");
}

export function createPrivateTestClient(
  signer: ClientSvmSigner,
  approval: PaymentApproval,
): x402Client {
  if (!signer) throw new Error("An external policy-wallet signer is required.");
  if (approval.maximumAtomic > 1_000n) throw new Error("Approval exceeds the private-test ceiling.");
  const client = new x402Client();
  return registerExactSvmScheme(client, {
    signer,
    networks: [SOLANA_DEVNET_CAIP2],
    policies: [privateTestPolicy(approval.maximumAtomic)],
  });
}
