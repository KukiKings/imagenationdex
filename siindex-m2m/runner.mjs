#!/usr/bin/env node
/**
 * SIINDEX M2M runner — dispatch, execute, bus, pickup, AJ gate, needs-aj notify
 *   node runner.mjs status|seed|tick|run|authorize <jobId>|notify-test
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { agents } from "./agents/index.mjs";
import { notifyNeedsAj } from "./notify.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUEUE = path.join(__dirname, "queue");
const BUS = path.join(__dirname, "bus");

async function ensureDirs() {
  await fs.mkdir(QUEUE, { recursive: true });
  await fs.mkdir(BUS, { recursive: true });
  await fs.mkdir(path.join(__dirname, "outbox"), { recursive: true });
}

async function atomicWrite(file, data) {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, data);
  await fs.rename(tmp, file);
}

async function listJobs() {
  await ensureDirs();
  const files = (await fs.readdir(QUEUE)).filter((f) => f.endsWith(".json"));
  const jobs = [];
  for (const f of files) {
    try {
      const raw = await fs.readFile(path.join(QUEUE, f), "utf8");
      if (!raw.trim()) continue;
      jobs.push(JSON.parse(raw));
    } catch {
      console.warn("skip corrupt queue file:", f);
    }
  }
  return jobs.sort((a, b) => (a.priority || 99) - (b.priority || 99));
}

async function saveJob(job) {
  await atomicWrite(
    path.join(QUEUE, `${job.id}.json`),
    JSON.stringify(job, null, 2) + "\n",
  );
}

async function writeBus(result) {
  const name = `${result.job_id}__${result.agent}__${Date.now()}.json`;
  await atomicWrite(path.join(BUS, name), JSON.stringify(result, null, 2) + "\n");
  return name;
}

function baseJob(partial) {
  return {
    directed_by: "SIINDEX",
    priority: 10,
    status: "queued",
    step_index: 0,
    payload: {},
    requires_aj_for: ["ops.deploy", "ops.secret_write", "publish"],
    aj_authorized: false,
    created_at: new Date().toISOString(),
    ...partial,
  };
}

async function seed() {
  await ensureDirs();
  const jobs = [
    baseJob({
      id: "job-voice-match-001",
      type: "voice-match-path-a",
      priority: 1,
      chain: ["context", "voice", "ops", "verify"],
      payload: {
        goal: "Chat TTS voice exactly matches introduction video",
        reference_media: "/videos/siindex-01-name-intro.mp4",
      },
    }),
    baseJob({
      id: "job-intro-playback-freeze-001",
      type: "media-playback-freeze",
      priority: 1,
      chain: ["context", "media", "verify"],
      payload: {
        goal: "Fix intro video freeze/stall while Syn-dex TTS speaks",
        reference_media: "/videos/siindex-01-name-intro.mp4",
      },
    }),
    baseJob({
      id: "job-media-voice-lock-001",
      type: "media-voice-lock",
      priority: 2,
      chain: ["context", "media", "verify"],
      payload: {
        goal: "All public SIINDEX media locked to same voice identity as website TTS",
      },
    }),
    baseJob({
      id: "job-stage1-demo-001",
      type: "stage1-demo-draft-chain",
      priority: 1,
      chain: ["knowledge", "policy_gate", "evidence", "verify"],
      payload: {
        goal: "Stage 1 demo: knowledge → policy_gate → evidence → verify (draft only)",
        note: "No publish. No citizen contact. Internal collaboration proof.",
      },
      envelope: {
        allowed_actions: ["read_knowledge", "check_policy", "write_evidence", "verify_draft"],
        prohibited_actions: [
          "publish",
          "contact_citizens",
          "move_funds",
          "issue_identity",
          "legal_commit",
          "ops.deploy",
          "ops.secret_write",
        ],
        data_classification: "internal_draft",
        evidence_required: true,
      },
    }),
  ];
  for (const job of jobs) {
    await saveJob(job);
    console.log("Seeded", job.id, "→", job.chain.join(" → "));
  }
}

async function tick() {
  const jobs = await listJobs();
  const job = jobs.find((j) =>
    ["queued", "awaiting_next", "running"].includes(j.status),
  );
  if (!job) {
    const gated = jobs.filter((j) =>
      ["needs-aj", "blocked", "done", "failed"].includes(j.status),
    );
    if (gated.length) {
      console.log("Idle runnable. Queue:");
      for (const g of gated) {
        console.log(
          " ",
          g.id,
          g.status,
          g.blocked_reason || g.gate || "",
        );
      }
    } else {
      console.log("Idle — no runnable jobs.");
    }
    return { progressed: false, ok: true };
  }

  const agentName = job.chain[job.step_index];
  if (!agentName) {
    job.status = job.blocked_reason || job.skipped_ops ? "blocked" : "done";
    await saveJob(job);
    console.log(job.id, job.status.toUpperCase());
    return { progressed: true, ok: true };
  }

  const fn = agents[agentName];
  if (!fn) {
    job.status = "failed";
    job.error = `unknown agent: ${agentName}`;
    await saveJob(job);
    console.error(job.error);
    return { progressed: false, ok: false };
  }

  if (agentName === "ops" && !job.aj_authorized) {
    const skipResult = {
      job_id: job.id,
      agent: "ops",
      ok: true,
      summary:
        "Ops skipped — AJ authorize required for deploy/secret write. Chain continues to verify.",
      artifacts: [".github/workflows/deploy-supabase-functions.yml"],
      next_hint: job.chain[job.step_index + 1] || null,
      blocked_reason:
        "Supabase deploy credentials not in this runtime",
      needs_aj: true,
      action: "ops.deploy",
      at: new Date().toISOString(),
    };
    await writeBus(skipResult);
    job.gate = skipResult.summary;
    job.skipped_ops = true;
    job.blocked_reason = skipResult.blocked_reason;
    job.step_index += 1;
    job.status =
      job.step_index >= job.chain.length ? "blocked" : "awaiting_next";
    job.last_result = skipResult;
    try {
      const n = await notifyNeedsAj(job, skipResult);
      job.last_notify = n.packet.request_id;
    } catch (err) {
      console.warn("[notify] failed", err);
    }
    await saveJob(job);
    console.log(`[ops]`, skipResult.summary);
    console.log(job.id, "→", job.status, "next=", job.chain[job.step_index] || "—");
    return { progressed: true, ok: true };
  }

  job.status = "running";
  job.current_agent = agentName;
  await saveJob(job);

  let result;
  try {
    result = await fn(job);
  } catch (err) {
    job.status = "failed";
    job.error = String(err);
    await saveJob(job);
    console.error(job.id, "agent failed", err);
    return { progressed: false, ok: false };
  }

  const busFile = await writeBus(result);
  console.log(`[${agentName}]`, result.summary);
  console.log("  bus:", busFile);

  if (result.payload_update && typeof result.payload_update === "object") {
    job.payload = { ...(job.payload || {}), ...result.payload_update };
  }

  if (result.needs_aj && !job.aj_authorized && agentName !== "ops") {
    job.status = "needs-aj";
    job.gate = result.summary;
    job.last_result = result;
    try {
      const n = await notifyNeedsAj(job, result);
      job.last_notify = n.packet.request_id;
    } catch (err) {
      console.warn("[notify] failed", err);
    }
    await saveJob(job);
    console.log(job.id, "→ needs-aj (notified)");
    return { progressed: false, ok: true };
  }

  if (result.blocked_reason) job.blocked_reason = result.blocked_reason;

  job.step_index += 1;
  job.last_result = result;
  if (job.step_index >= job.chain.length) {
    job.status = job.blocked_reason || job.skipped_ops ? "blocked" : "done";
  } else {
    job.status = "awaiting_next";
  }
  await saveJob(job);
  console.log(
    job.id,
    `step ${job.step_index}/${job.chain.length}`,
    job.status,
    job.chain[job.step_index] ? `next=${job.chain[job.step_index]}` : "",
  );
  return { progressed: true, ok: true };
}

async function runAll() {
  let guard = 0;
  while (guard++ < 30) {
    const { progressed } = await tick();
    if (!progressed) break;
  }
}

async function status() {
  const jobs = await listJobs();
  if (!jobs.length) {
    console.log("No jobs. Run: node runner.mjs seed");
    return;
  }
  for (const j of jobs) {
    console.log(
      `${j.id}  [${j.status}]  step ${j.step_index}/${j.chain.length}  next=${j.chain[j.step_index] || "—"}  aj=${j.aj_authorized ? "yes" : "no"}`,
    );
    if (j.blocked_reason) console.log("  blocked:", j.blocked_reason);
    if (j.gate) console.log("  gate:", j.gate);
    if (j.last_notify) console.log("  notify:", j.last_notify);
  }
  const bus = await fs.readdir(BUS).catch(() => []);
  const outbox = await fs.readdir(path.join(__dirname, "outbox")).catch(() => []);
  console.log("bus messages:", bus.filter((f) => f.endsWith(".json")).length);
  console.log("outbox packets:", outbox.filter((f) => f.endsWith(".json")).length);
}

async function authorize(jobId) {
  if (!jobId) {
    console.error("Usage: node runner.mjs authorize <jobId>");
    process.exit(1);
  }
  const jobs = await listJobs();
  const job = jobs.find((j) => j.id === jobId);
  if (!job) {
    console.error("Job not found:", jobId);
    process.exit(1);
  }
  job.aj_authorized = true;
  const opsIdx = job.chain.indexOf("ops");
  if (opsIdx >= 0 && job.skipped_ops) {
    job.step_index = opsIdx;
    job.skipped_ops = false;
    job.blocked_reason = null;
    job.gate = null;
    job.status = "awaiting_next";
  } else if (job.status === "needs-aj" || job.status === "blocked") {
    job.status = "awaiting_next";
  }
  await saveJob(job);
  console.log("AJ authorized", jobId);
}

const cmd = process.argv[2] || "status";
const arg = process.argv[3];
await ensureDirs();
try {
  if (cmd === "seed") await seed();
  else if (cmd === "tick") {
    const { ok } = await tick();
    process.exit(ok ? 0 : 1);
  } else if (cmd === "run") await runAll();
  else if (cmd === "authorize") await authorize(arg);
  else if (cmd === "notify-test") {
    const { notifyNeedsAj: n } = await import("./notify.mjs");
    await n(
      {
        id: "job-notify-test-001",
        requires_aj_for: ["publish"],
        payload: { goal: "P2.1 notify test", why: "Channel path check" },
      },
      {
        summary: "Test needs-aj email then SMS packet.",
        artifacts: ["siindex-m2m/notify.mjs"],
        action: "publish",
      },
    );
  } else await status();
} catch (err) {
  console.error("[runner]", err);
  process.exit(1);
}
