import type { PaymentPolicy } from "@x402/core/client";
import type { PaymentRequirements } from "@x402/core/types";
import { SOLANA_DEVNET_CAIP2, USDC_DEVNET_ADDRESS } from "@x402/svm";

export const PRIVATE_TEST_MAX_ATOMIC = 1_000n;

export function allowPrivateTestRequirement(
  requirement: PaymentRequirements,
  maximumAtomic = PRIVATE_TEST_MAX_ATOMIC,
): boolean {
  if (requirement.network !== SOLANA_DEVNET_CAIP2) return false;
  if (requirement.asset !== USDC_DEVNET_ADDRESS) return false;
  if (requirement.scheme !== "exact") return false;
  try {
    const amount = BigInt(requirement.amount);
    return amount >= 0n && amount <= maximumAtomic;
  } catch {
    return false;
  }
}

export function privateTestPolicy(maximumAtomic = PRIVATE_TEST_MAX_ATOMIC): PaymentPolicy {
  return (_version, requirements) => requirements.filter((requirement) => allowPrivateTestRequirement(requirement, maximumAtomic));
}
