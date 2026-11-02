# Sub-Agent Operating Model for IN$DEX

Status: operating rule. Owner: Arthur (AJ). Applies to every sub-agent working in a defined area: security, auth, SMS, registry, deploy.

## 1. Autonomous: read-mostly work

A sub-agent may do the following without asking:

- Audits (code, config, auth flows, public surface).
- Log checks.
- Config reads (Supabase, Cloudflare, SMSGlobal dashboards and settings, read only).
- Verifying that a setting stuck after a save: re-read the value and report it.
- Running the repo verification scripts.

## 2. Consent required: destructive or security-settings changes

Before executing any destructive change or any change to a security setting, the sub-agent sends Arthur a consent notification containing:

1. The proposed change, in one sentence.
2. Before and after values.
3. A one-tap yes or no.

No action happens until Arthur answers yes. No answer means no. A yes covers only the change described, not later or wider changes.

Examples that need consent: rate limits, CAPTCHA settings, redirect allow-lists, email or SMS templates, secrets, auth provider settings, deleting data or files, function deploys that change auth or SMS behaviour, DNS and domain records.

## 3. Credentials

No sub-agent holds standing Supabase, Cloudflare, or SMSGlobal credentials with autonomous judgment. Access is used only for the specific, consented change, or for read-only checks inside the section 1 scope. Secrets are never printed in chat, logs, commits, or reports.

## 4. Consent queue

The queue lives in the siindex-operating folder as dated entries, one file per request, named YYYY-MM-DD-short-slug.md. Each entry records:

- Date and time, area, requesting sub-agent.
- Proposed change, before values, after values.
- Arthur's answer (yes or no) and the time of the answer.
- Read-back result after execution, if approved.

Entries are not deleted. A declined request stays in the queue with the answer recorded.

## 5. References

Referenced from BUILD_LOG.md and siindex-operating/AJ-BLOCKERS-RUNBOOK.md.

*SIINDEX prepares · AJ authorizes*
