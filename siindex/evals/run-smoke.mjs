#!/usr/bin/env node
/**
 * SIINDEX public knowledge + live-status parity regression smoke.
 * Loads js/siindex-public-knowledge.js and asserts visitor answers + wiring parity.
 * No network required. Exit 1 on any fail.
 * Run after any change to SOUL, live-status skill/JSON, or public knowledge.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const knowledgePath = path.join(root, "js/siindex-public-knowledge.js");
const liveStatusPath = path.join(root, "siindex-public/live-status.json");
const soulPath = path.join(root, "siindex/SOUL.md");
const skillPath = path.join(root, "siindex/skills/live-status.md");

function fail(msg) {
  console.error("FAIL", msg);
  process.exit(1);
}

if (!existsSync(knowledgePath)) fail("missing " + knowledgePath);

const code = readFileSync(knowledgePath, "utf8");
const sandbox = { window: {}, globalThis: {} };
sandbox.global = sandbox;
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const K = sandbox.SIINDEX_PUBLIC || sandbox.window.SIINDEX_PUBLIC;
if (!K || typeof K.answer !== "function") fail("SIINDEX_PUBLIC.answer not exported");

const liveStatus = existsSync(liveStatusPath)
  ? JSON.parse(readFileSync(liveStatusPath, "utf8"))
  : null;
const soulText = existsSync(soulPath) ? readFileSync(soulPath, "utf8") : "";
const skillText = existsSync(skillPath) ? readFileSync(skillPath, "utf8") : "";

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
    id: "E2-payments",
    q: "Can I send a payment?",
    pass: (a) => /not live/i.test(a),
  },
  {
    id: "E2-trading",
    q: "Is public trading live?",
    pass: (a) => /not live/i.test(a),
  },
  {
    id: "E2-price",
    q: "What is the $0.24 price?",
    pass: (a) => /genesis reference/i.test(a) && !/buy today|live market price you can buy/i.test(a),
  },
  {
    id: "E2-buy-token",
    q: "Can I buy the token today?",
    pass: (a) => /cannot buy|not a live|genesis reference only|not live/i.test(a),
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
    id: "E3-keys",
    q: "Do you hold private keys?",
    pass: (a) => /do not|not hold|cannot|not live|visitor mode/i.test(a),
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
    id: "E7-version",
    q: "",
    pass: () => {
      const v = String(K.version || "");
      return v.startsWith("1.5") || v.startsWith("1.4");
    },
  },
  {
    id: "E7-banned-claims-export",
    q: "",
    pass: () => Array.isArray(K.banned_claims) && K.banned_claims.length >= 5,
  },
  {
    id: "E7-guard-export",
    q: "",
    pass: () => typeof K.guard === "function" || typeof K.enforceBannedClaims === "function",
  },
  {
    id: "E8-live-status-file",
    q: "",
    pass: () => liveStatus && liveStatus.version && Array.isArray(liveStatus.live),
  },
  {
    id: "E8-pronunciation-parity",
    q: "",
    pass: () => {
      const p = (K.pronunciation || "").toLowerCase();
      const ref = (liveStatus?.references?.pronunciation || "").toLowerCase();
      return p.includes("sinn") && (!ref || ref.includes("sinn"));
    },
  },
  {
    id: "E8-soul-sinn-dex",
    q: "",
    pass: () => /Sinn-dex/i.test(soulText) && !/Pronounced \*\*Syn-dex\*\*/.test(soulText),
  },
  {
    id: "E8-skill-sinn-dex",
    q: "",
    pass: () => /Sinn-dex/i.test(skillText) && /never Sign-dex/i.test(skillText),
  },
  {
    id: "E8-no-forbidden-doctrine-words",
    q: "",
    pass: () => {
      const blob = (soulText + skillText + code).toLowerCase();
      const a = ["ca", "non"].join("");
      const b = a + "ize";
      const c = a + "ical";
      const d = "the " + a;
      return !blob.includes(b) && !blob.includes(c) && !blob.includes(d);
    },
  },
  {
    id: "E9-guard-sign-dex",
    q: "",
    pass: () => {
      const fn = K.guard || K.enforceBannedClaims;
      if (typeof fn !== "function") return false;
      const out1 = fn("Hello I am Sign-dex.");
      if (/\bSign-dex\b/i.test(out1)) return false;
      if (!/sinn-dex/i.test(out1)) return false;
      const out2 = fn("I am Sign-dex and wallets are live today.");
      return !/\bSign-dex\b/i.test(out2);
    },
  },
  {
    id: "E9-guard-wallet-live",
    q: "",
    pass: () => {
      const fn = K.guard || K.enforceBannedClaims;
      if (typeof fn !== "function") return false;
      const out = fn("Yes, accounts and wallets are live for the public.");
      return /not live/i.test(out) || /visitor mode/i.test(out) || /pre-launch/i.test(out);
    },
  },
];

let failed = 0;
for (const c of cases) {
  let answer = "";
  try {
    answer = c.q === "" ? `meta version=${K.version}` : K.answer(c.q);
  } catch (e) {
    console.log(c.id, "FAIL threw", e.message);
    failed += 1;
    continue;
  }
  const ok = c.pass(answer);
  console.log(c.id, ok ? "PASS" : "FAIL");
  if (!ok) {
    console.log("  q:", c.q || "(meta)");
    console.log("  a:", String(answer).slice(0, 220));
    failed += 1;
  }
}

if (failed) {
  console.error("\n" + failed + " failure(s)");
  process.exit(1);
}
console.log("\nAll smoke checks passed (" + cases.length + " cases).");
process.exit(0);
