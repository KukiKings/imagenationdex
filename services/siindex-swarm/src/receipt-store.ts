import { createHash, randomUUID } from "node:crypto";
import type { PolicyDecision, ReceiptRecord } from "./contracts.js";

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return typeof value === "bigint" ? JSON.stringify(value.toString()) : JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`)
    .join(",")}}`;
}

function digest(value: unknown): string {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

export class ReceiptStore {
  readonly #records: ReceiptRecord[] = [];

  append(
    runId: string,
    actionId: string,
    eventType: string,
    decision: PolicyDecision,
    detail: Readonly<Record<string, unknown>> = {},
    now = new Date(),
  ): ReceiptRecord {
    const previousHash = this.#records.at(-1)?.hash ?? null;
    const unsigned = {
      id: randomUUID(),
      runId,
      actionId,
      eventType,
      status: decision.status,
      detail,
      createdAt: now.toISOString(),
      previousHash,
    } as const;
    const record: ReceiptRecord = Object.freeze({ ...unsigned, hash: digest(unsigned) });
    this.#records.push(record);
    return record;
  }

  all(): readonly ReceiptRecord[] {
    return Object.freeze([...this.#records]);
  }

  verify(): boolean {
    return this.#records.every((record, index) => {
      const previousHash = index === 0 ? null : this.#records[index - 1]?.hash ?? null;
      const { hash, ...unsigned } = record;
      return record.previousHash === previousHash && digest(unsigned) === hash;
    });
  }
}

export const receiptInternals = Object.freeze({ canonical, digest });
