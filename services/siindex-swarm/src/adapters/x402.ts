/**
 * Policy contract shared with the isolated x402 gateway.
 *
 * The x402 SDK is kept out of this package because it currently requires a
 * different @solana/kit major than Solana Pay. The gateway owns that dependency
 * graph and receives only requirements that pass this filter.
 */

export const SOLANA_DEVNET_CAIP2 = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
export const USDC_DEVNET_ADDRESS = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
export const X402_PRIVATE_TEST_MAX_ATOMIC = 1_000n;

export interface X402PaymentRequirement {
  scheme: string;
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra: Record<string, unknown>;
}

export type X402PaymentPolicy = (
  version: number,
  requirements: readonly X402PaymentRequirement[],
) => X402PaymentRequirement[];

export function filterPrivateTestRequirements(
  requirements: readonly X402PaymentRequirement[],
  maximumAtomic = X402_PRIVATE_TEST_MAX_ATOMIC,
): X402PaymentRequirement[] {
  return requirements.filter((requirement) => {
    if (requirement.network !== SOLANA_DEVNET_CAIP2) return false;
    if (requirement.asset !== USDC_DEVNET_ADDRESS) return false;
    try {
      const amount = BigInt(requirement.amount);
      return amount >= 0n && amount <= maximumAtomic;
    } catch {
      return false;
    }
  });
}

export function privateTestPaymentPolicy(maximumAtomic = X402_PRIVATE_TEST_MAX_ATOMIC): X402PaymentPolicy {
  return (_version, requirements) => filterPrivateTestRequirements(requirements, maximumAtomic);
}
