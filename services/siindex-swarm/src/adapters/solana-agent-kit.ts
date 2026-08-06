/**
 * Supply-chain boundary for Solana Agent Kit.
 *
 * The kit is intentionally absent from the production dependency graph while
 * its current transitive audit contains high-severity findings. A hardened
 * integration runtime may inject a compatible constructor after its own audit.
 */

type TransactionLike = object;

export interface SolanaAgentKitLike {
  readonly actions: readonly unknown[];
  readonly methods: unknown;
}

export type SolanaAgentKitConstructor = new (
  wallet: PlanningOnlyWallet,
  rpcUrl: string,
  config: { signOnly: true },
) => SolanaAgentKitLike;

export class PlanningOnlyWallet {
  constructor(public readonly publicKey: unknown) {}

  async signTransaction<T extends TransactionLike>(_transaction: T): Promise<T> {
    throw new Error("Signing is disabled. Route the prepared transaction through the policy wallet service.");
  }

  async signAllTransactions<T extends TransactionLike>(_transactions: T[]): Promise<T[]> {
    throw new Error("Batch signing is disabled. Route prepared transactions through the policy wallet service.");
  }

  async signAndSendTransaction<T extends TransactionLike>(_transaction: T): Promise<{ signature: string }> {
    throw new Error("Signing and submission are disabled. Route prepared transactions through the policy wallet service.");
  }

  async signMessage(_message: Uint8Array): Promise<Uint8Array> {
    throw new Error("Message signing is disabled. Route signing through the policy wallet service.");
  }
}

export function createPlanningOnlySolanaAgent(
  publicKey: unknown,
  auditedConstructor: SolanaAgentKitConstructor,
  rpcUrl = "https://api.devnet.solana.com",
): SolanaAgentKitLike {
  if (!auditedConstructor) throw new Error("An audited Solana Agent Kit constructor must be injected.");
  return new auditedConstructor(new PlanningOnlyWallet(publicKey), rpcUrl, { signOnly: true });
}
