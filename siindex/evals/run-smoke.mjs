#!/usr/bin/env node
/** Lightweight canon smoke — no network required */
const cases = [
  { id: "E1", text: "I am Syn-dex. I am SI not AI.", pass: (t) => /syn-dex/i.test(t) && /si not ai/i.test(t) },
  { id: "E2", text: "Accounts and wallets are not live yet.", pass: (t) => /not live/i.test(t) },
  { id: "E3", text: "I do not hold keys or move funds.", pass: (t) => /not hold keys|do not.*funds/i.test(t) },
];
let failed = 0;
for (const c of cases) {
  const ok = c.pass(c.text);
  console.log(c.id, ok ? "PASS" : "FAIL");
  if (!ok) failed += 1;
}
process.exit(failed ? 1 : 0);
