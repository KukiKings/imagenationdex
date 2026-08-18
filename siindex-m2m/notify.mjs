/**
 * SIINDEX needs-aj delivery — P2.1
 * Channel priority: email (full) → SMS (short)
 * Every task asks AJ; no auto-approve.
 *
 * Env (never commit secrets):
 *   AJ_NOTIFY_EMAIL      — primary (AJ personal: dadyboy73@gmail.com)
 *   AJ_NOTIFY_EMAIL_CC   — ops trail (imagenationdex@gmail.com)
 *   AJ_NOTIFY_SMS        — E.164 phone for Twilio
 *   TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM
 *   NEEDS_AJ_DRY_RUN=1   — outbox only
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTBOX = path.join(__dirname, "outbox");

const DEFAULT_TO = "dadyboy73@gmail.com";
const DEFAULT_CC = "imagenationdex@gmail.com";

export function buildPacket(job, result = {}) {
  const request_id = `aj-req-${job.id || "job"}-${Date.now()}`;
  const action =
    result.action ||
    (job.requires_aj_for && job.requires_aj_for[0]) ||
    "proceed_task";
  return {
    request_id,
    job_id: job.id || null,
    from: "SIINDEX",
    to: "AJ_Henry",
    status: "needs-aj",
    action,
    summary:
      result.summary ||
      job.gate ||
      (job.payload && job.payload.goal) ||
      "Task requires your approval to proceed.",
    why:
      (job.payload && job.payload.why) ||
      "Advances IN$DEX continuous loop under SIINDEX control.",
    sources: (job.payload && job.payload.must_check) || [
      "siindex-operating/OPERATING_CHARTER.md",
      "siindex-operating/NEEDS-AJ-FORMAT.md",
    ],
    artifacts: result.artifacts || [],
    risks:
      result.blocked_reason ||
      "Executing without review could publish or change production incorrectly.",
    not_claiming: [
      "accounts_live",
      "wallets_live",
      "payments_live",
      "token_trading_live",
    ],
    channel_preference: ["email", "sms"],
    proceed_window: "awaiting_aj_reply",
    aj_authorized: false,
    created_at: new Date().toISOString(),
  };
}

export function formatEmail(packet) {
  const sources = (packet.sources || []).join(", ");
  const artifacts = (packet.artifacts || []).join(", ") || "(none)";
  const notClaiming = (packet.not_claiming || []).join(", ");
  return {
    subject: `SIINDEX needs-aj ${packet.request_id}: ${packet.action}`,
    body: `SIINDEX → AJ — needs approval
ID: ${packet.request_id}
Job: ${packet.job_id || "—"}
Action: ${packet.action}
Summary: ${packet.summary}
Why: ${packet.why}
Sources: ${sources}
Artifacts: ${artifacts}
Risks: ${packet.risks}
Not claiming: ${notClaiming}
Window: ${packet.proceed_window}

Reply: PROCEED | PROCEED_UNTIL <date> | PROCEED_WINDOW <hours> | HOLD | REJECT | REVISE

Then: node runner.mjs authorize ${packet.job_id || "<jobId>"}
`,
  };
}

export function formatSms(packet) {
  const short = String(packet.summary || "").slice(0, 80);
  return `SIINDEX needs-aj ${packet.request_id}: ${packet.action}. ${short} Reply PROCEED/HOLD/REJECT/REVISE. Full detail in email.`;
}

async function writeOutbox(packet, email, sms, delivery) {
  await fs.mkdir(OUTBOX, { recursive: true });
  const file = path.join(OUTBOX, `${packet.request_id}.json`);
  const record = {
    packet,
    email,
    sms,
    delivery,
    at: new Date().toISOString(),
  };
  await fs.writeFile(file, JSON.stringify(record, null, 2) + "\n");
  return file;
}

async function sendSmsTwilio(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from || !to) {
    return { ok: false, skipped: true, reason: "twilio_or_sms_not_configured" };
  }
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams({ To: to, From: from, Body: body });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    },
  );
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, status: res.status, body: text.slice(0, 500) };
  }
  return { ok: true, provider: "twilio" };
}

export async function notifyNeedsAj(job, result = {}) {
  const packet = buildPacket(job, result);
  const email = formatEmail(packet);
  const sms = formatSms(packet);
  const to = process.env.AJ_NOTIFY_EMAIL || DEFAULT_TO;
  const cc = process.env.AJ_NOTIFY_EMAIL_CC || DEFAULT_CC;
  const dry = process.env.NEEDS_AJ_DRY_RUN === "1";

  const delivery = {
    dry_run: dry,
    email: {
      to,
      cc,
      status: dry ? "outbox_only" : "queued_for_transport",
    },
    sms: { to: process.env.AJ_NOTIFY_SMS || null, status: "pending" },
  };

  if (!dry && process.env.AJ_NOTIFY_SMS) {
    const smsResult = await sendSmsTwilio(process.env.AJ_NOTIFY_SMS, sms);
    delivery.sms = {
      to: process.env.AJ_NOTIFY_SMS,
      status: smsResult.ok ? "sent" : smsResult.skipped ? "skipped" : "failed",
      detail: smsResult,
    };
  } else {
    delivery.sms.status = process.env.AJ_NOTIFY_SMS ? "outbox_only" : "not_configured";
  }

  const outboxFile = await writeOutbox(packet, email, sms, delivery);
  console.log("[notify] needs-aj", packet.request_id, "→", outboxFile);
  console.log("[notify] email to:", to, "cc:", cc);
  console.log("[notify] subject:", email.subject);
  console.log("[notify] sms:", sms.slice(0, 120) + (sms.length > 120 ? "…" : ""));
  if (delivery.dry_run) {
    console.log("[notify] dry-run — outbox only");
  }
  return { packet, email, sms, delivery, outboxFile };
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain && process.argv[2] === "test") {
  await notifyNeedsAj(
    {
      id: "job-notify-test-001",
      requires_aj_for: ["publish"],
      payload: {
        goal: "P2.1 notify path test — no production publish",
        why: "Verify email/SMS packet format and outbox",
      },
    },
    {
      summary: "Test needs-aj packet for AJ channel priority email then SMS.",
      artifacts: ["siindex-m2m/notify.mjs"],
      action: "publish",
    },
  );
}
