#!/usr/bin/env node
/**
 * SIINDEX always-on heartbeat — AJ authorized production runner entry.
 * Usage:
 *   node heartbeat.mjs once     # single tick
 *   node heartbeat.mjs loop     # interval loop (default 60s)
 * Cron example (every 15 minutes):
 *   cd /path/to/repo/siindex-m2m && node heartbeat.mjs once >> heartbeat.log 2>&1
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INTERVAL_MS = Number(process.env.SIINDEX_HEARTBEAT_MS || 60_000);

function runTick() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["runner.mjs", "tick"], {
      cwd: __dirname,
      stdio: "inherit",
      env: process.env,
    });
    child.on("error", (err) => {
      console.error("[heartbeat] spawn error", err);
      resolve(1);
    });
    child.on("exit", (code) => {
      console.log(`[heartbeat] tick exit=${code} at ${new Date().toISOString()}`);
      resolve(code ?? 1);
    });
  });
}

const mode = process.argv[2] || "once";
if (mode === "loop") {
  console.log(`[heartbeat] loop every ${INTERVAL_MS}ms`);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await runTick();
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
} else {
  // Idle tick (no runnable jobs) must be success for GitHub Actions
  const code = await runTick();
  process.exit(code === 0 || code === null ? 0 : code);
}
