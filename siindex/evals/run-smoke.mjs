#!/usr/bin/env node
/**
 * SIINDEX public knowledge regression smoke.
 * Loads js/siindex-public-knowledge.js and asserts visitor answers.
 * No network required. Exit 1 on any fail.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const knowledgePath = path.join(root, "js/siindex-public-knowledge.js");

if (!existsSync(knowledgePath)) {
  console.error("FAIL missing", knowledgePath);
  process.exit(1);
}

const code = readFileSync(knowledgePath, "utf8");
const sandbox = { window: {}, globalThis: {} };
sandbox.global = sandbox;
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const K = sandbox.SIINDEX_PUBLIC || sandbox.window.SIINDEX_PUBLIC;
if (!K || typeof K.answer !== "function") {
  console.error("FAIL SIINDEX_PUBLIC.answer not exported");
  process.exit(1);
}

const cases = [
  {
    id: "E1-identity",
    q: "Who are you?",
    pass: (a) => /siindex/i.test(a) && /sinn-dex/i.test(a),
  },
  {
    id: "E1-ai",
    q: "Are you AI?",
    pass: (a) => /synthetic intelligence|\bsi\b/i.test(a) && /not artificial/i.test(a),
  },
  {
    id: "E1-pronounce",
    q: "How do you pronounce SIINDEX?",
    pass: (a) => /sinn-dex/i.test(a) && /never sign-dex/i.test(a),
  },
  {
    id: "E2-live",
    q: "What is live today?",
    pass: (a) =>
      /visitor mode|website/i.test(a) &&
      /not live/i.test(a) &&
      /wallet|payment|account/i.test(a),
  },
  {
    id: "E2-wallet",
    q: "Can I open a wallet?",
    pass: (a) => /not live/i.test(a),
  },
  {
    id: "E2-price",
    q: "What is the $0.24 price?",
    pass: (a) => /genesis reference/i.test(a) && !/buy today|live market price you can buy/i.test(a),
  },
  {
    id: "E3-licence",
    q: "Are you licensed by the Cook Islands government?",
    pass: (a) => /does not claim|in progress|not invent/i.test(a),
  },
  {
    id: "E3-autonomy",
    q: "Can SIINDEX run the company alone?",
    pass: (a) => /do not move funds|staged founder|not unlimited/i.test(a),
  },
  {
    id: "E5-brand",
    q: "What is IN$DEX?",
    pass: (a) => /IN\$DEX|brand/i.test(a) && /pre-launch|not live/i.test(a),
  },
  {
    id: "E6-voice",
    q: "What voice do you use?",
    pass: (a) => /sinn-dex|spoken voice|public voice/i.test(a),
  },
  {
    id: "version",
    q: "",
    pass: () => String(K.version || "").startsWith("1.4"),
  },
];

let failed = 0;
for (const c of cases) {
  let answer = "";
  try {
    answer = c.q === "" ? `version=${K.version}` : K.answer(c.q);
  } catch (e) {
    console.log(c.id, "FAIL threw", e.message);
    failed += 1;
    continue;
  }
  const ok = c.pass(answer);
  console.log(c.id, ok ? "PASS" : "FAIL");
  if (!ok) {
    console.log("  q:", c.q);
    console.log("  a:", String(answer).slice(0, 180));
    failed += 1;
  }
}

if (failed) {
  console.error("\n" + failed + " failure(s)");
  process.exit(1);
}
console.log("\nAll smoke checks passed.");
process.exit(0);
