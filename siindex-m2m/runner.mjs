#!/usr/bin/env node
/**
 * SIINDEX M2M runner — dispatch, execute, bus, pickup, AJ gate
 * Usage:
 *   node runner.mjs status|seed|tick|run|authorize <jobId>
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { agents } from "./agents/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUEUE = path.join(__dirname, "queue");
const BUS = path.join(__dirname, "bus");

async function ensureDirs() {
  await fs.mkdir(QUEUE, { recursive: true });
  await fs.mkdir(BUS, { recursive: true });
}

async function listJobs() {
  await ensureDirs();
  const files = (await fs.readdir(QUEUE)).filter((f) => f.endsWith(".json"));
  const jobs = [];
  for (const f of files) {
    jobs.push(JSON.parse(await fs.readFile(path.join(QUEUE, f), "utf8")));
  }
  return jobs.sort((a, b) => (a.priority || 99) - (b.priority || 99));
}

async function saveJob(job) {
  await fs.writeFile(
    path.join(QUEUE, `${job.id}.json`),
    JSON.stringify(job, null, 2),
  );
}

async function writeBus(result) {
  const name = `${result.job_id}__${result.agent}__${Date.now()}.json`;
  await fs.writeFile(path.join(BUS, name), JSON.stringify(result, null, 2));
  return name;
}

async function seed() {
  await ensureDirs();
  const job = {
    id: "job-voice-match-001",
    directed_by: "SIINDEX",
    type: "voice-match-path-a",
    priority: 1,
    status: "queued",
    chain: ["context", "voice", "ops", "verify"],
    step_index: 0,
    payload: {
      goal: "Chat TTS voice exactly matches introduction video",
      reference_media: "/videos/siindex-01-name-intro.mp4",
    },
    requires_aj_for: ["ops.deploy", "ops.secret_write", "publish"],
    aj_authorized: false,
    created_at: new Date().toISOString(),
  };
  await saveJob(job);
  console.log("Seeded", job.id, "chain:", job.chain.join(" → "));
}

async function tick() {
  const jobs = await listJobs();
  const job = jobs.find((j) =>
    ["queued", "awaiting_next", "running"].includes(j.status),
  );
  if (!job) {
    console.log("Idle — no runnable jobs.");
    return false;
  }

  if (job.status === "needs-aj" && !job.aj_authorized) {
    console.log(job.id, "blocked at AJ gate.");
    return false;
  }

  const agentName = job.chain[job.step_index];
  if (!agentName) {
    job.status = "done";
    await saveJob(job);
    console.log(job.id, "DONE");
    return true;
  }

  const fn = agents[agentName];
  if (!fn) {
    job.status = "failed";
    job.error = `unknown agent: ${agentName}`;
    await saveJob(job);
    console.error(job.error);
    return false;
  }

  // AJ gate before ops production steps
  if (agentName === "ops" && !job.aj_authorized) {
    job.status = "needs-aj";
    job.gate = "ops requires AJ authorize for deploy/secret path";
    await saveJob(job);
    console.log(job.id, "→ needs-aj (ops)");
    return false;
  }

  job.status = "running";
  job.current_agent = agentName;
  await saveJob(job);

  const result = await fn(job);
  const busFile = await writeBus(result);
  console.log(`[${agentName}]`, result.summary);
  console.log("  bus:", busFile);

  if (result.needs_aj && !job.aj_authorized) {
    job.status = "needs-aj";
    job.gate = result.summary;
    job.last_result = result;
    await saveJob(job);
    console.log(job.id, "→ needs-aj");
    return false;
  }

  if (result.blocked_reason && agentName === "ops") {
    job.status = "blocked";
    job.blocked_reason = result.blocked_reason;
    job.last_result = result;
    // still advance so verify can record acceptance criteria
    job.step_index += 1;
    if (job.step_index < job.chain.length) {
      job.status = "awaiting_next";
    }
    await saveJob(job);
    console.log("  blocked:", result.blocked_reason);
    return true;
  }

  job.step_index += 1;
  job.last_result = result;
  if (job.step_index >= job.chain.length) {
    job.status = result.blocked_reason ? "blocked" : "done";
  } else {
    job.status = "awaiting_next";
  }
  await saveJob(job);
  console.log(
    job.id,
    "step →",
    job.step_index,
    "status",
    job.status,
    job.chain[job.step_index] ? `(next ${job.chain[job.step_index]})` : "",
  );
  return true;
}

async function runAll() {
  let guard = 0;
  while (guard++ < 20) {
    const progressed = await tick();
    if (!progressed) break;
  }
}

async function status() {
  const jobs = await listJobs();
  if (!jobs.length) {
    console.log("No jobs in queue. Run: node runner.mjs seed");
    return;
  }
  for (const j of jobs) {
    console.log(
      `${j.id}  [${j.status}]  step ${j.step_index}/${j.chain.length}  agent=${j.chain[j.step_index] || "—"}  aj=${j.aj_authorized ? "yes" : "no"}`,
    );
    if (j.blocked_reason) console.log("  blocked:", j.blocked_reason);
    if (j.gate) console.log("  gate:", j.gate);
  }
  try {
    const bus = await fs.readdir(BUS);
    console.log("bus messages:", bus.length);
  } catch {
    console.log("bus messages: 0");
  }
}

async function authorize(jobId) {
  const jobs = await listJobs();
  const job = jobs.find((j) => j.id === jobId);
  if (!job) {
    console.error("Job not found:", jobId);
    process.exit(1);
  }
  job.aj_authorized = true;
  if (job.status === "needs-aj") job.status = "awaiting_next";
  await saveJob(job);
  console.log("AJ authorized", jobId, "— production steps may proceed when infrastructure allows");
}

const cmd = process.argv[2] || "status";
const arg = process.argv[3];

await ensureDirs();
if (cmd === "seed") await seed();
else if (cmd === "tick") await tick();
else if (cmd === "run") await runAll();
else if (cmd === "authorize") await authorize(arg);
else await status();
