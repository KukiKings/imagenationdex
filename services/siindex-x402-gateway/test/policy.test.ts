import assert from "node:assert/strict";
import test from "node:test";
import type { PaymentRequirements } from "@x402/core/types";
import {
  SOLANA_DEVNET_CAIP2,
  SOLANA_MAINNET_CAIP2,
  USDC_DEVNET_ADDRESS,
} from "@x402/svm";
import { allowPrivateTestRequirement, assertPaymentApproval, privateTestPolicy } from "../src/index.js";

const BASE: PaymentRequirements = {
  scheme: "exact",
  network: SOLANA_DEVNET_CAIP2,
  amount: "1000",
  asset: USDC_DEVNET_ADDRESS,
  payTo: "11111111111111111111111111111111",
  maxTimeoutSeconds: 60,
  extra: {},
};

test("accepts exact devnet USDC at the 0.001 ceiling", () => {
  assert.equal(allowPrivateTestRequirement(BASE), true);
});

test("rejects mainnet, wrong assets, wrong schemes, malformed amounts and excess value", () => {
  assert.equal(allowPrivateTestRequirement({ ...BASE, network: SOLANA_MAINNET_CAIP2 }), false);
  assert.equal(allowPrivateTestRequirement({ ...BASE, asset: "not-usdc" }), false);
  assert.equal(allowPrivateTestRequirement({ ...BASE, scheme: "upto" }), false);
  assert.equal(allowPrivateTestRequirement({ ...BASE, amount: "1001" }), false);
  assert.equal(allowPrivateTestRequirement({ ...BASE, amount: "invalid" }), false);
});

test("policy removes every non-compliant requirement", () => {
  const filtered = privateTestPolicy()(2, [BASE, { ...BASE, amount: "1001" }, { ...BASE, network: SOLANA_MAINNET_CAIP2 }]);
  assert.deepEqual(filtered, [BASE]);
});

test("approval is bound to the subject, amount and expiry", () => {
  const approval = {
    id: "approval-1",
    subjectId: "citizen-1",
    maximumAtomic: 1_000n,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
  assert.doesNotThrow(() => assertPaymentApproval(approval, "citizen-1", 1_000n));
  assert.throws(() => assertPaymentApproval(approval, "citizen-2", 1n), /different subject/i);
  assert.throws(() => assertPaymentApproval(approval, "citizen-1", 1_001n), /approved amount/i);
});
