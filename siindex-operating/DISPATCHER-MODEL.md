# Dispatcher Model for IN$DEX

Status: operating rule. Owner: Arthur (AJ). Extends [SUB-AGENT-CONSENT-MODEL.md](SUB-AGENT-CONSENT-MODEL.md).

## Role

The dispatcher sits above all specialist agents: security, auth, SMS, registry, deploy, and the monitors. It:

1. Reads incoming tasks and alerts.
2. Routes each one to the right specialist.
3. Filters specialist output before it reaches Arthur, so he sees decisions and exceptions, not raw noise.

The dispatcher does not hold standing Supabase, Cloudflare, or SMSGlobal credentials with autonomous judgment (see the consent model, section 3). It routes and gates; the change itself runs only after the gate for its tier is met.

## 1. Risk-tiered gates

Approval is matched to risk, not applied to everything.

| Tier | Kind of work | Gate |
| --- | --- | --- |
| 1 | Read-only: audits, log checks, config reads, verifying a setting stuck | Auto-execute. Log only. |
| 2 | Reversible writes | Auto-execute, then notify Arthur. |
| 3 | Irreversible or financial changes | Explicit yes from Arthur before execution. |
| 4 | Anything outside policy | Blocked at the gateway. No approval path. |

Rules that fix the tier:

- **Security settings are tier 3 even when reversible.** Rate limits, CAPTCHA, redirect allow-lists, templates, secrets, auth providers, DNS and domain records, and function deploys that change auth or SMS behaviour all need a yes first, as the consent model already requires. Tier 2 never covers them.
- **When unsure of the tier, take the higher one.**
- **Tier 4 has no override.** A request cannot be promoted to tier 3 by asking more firmly or by Arthur's say-so in the same message that proposed it; policy has to change first, in this repo.

## 2. Review packets for tier 3 and tier 4

Every tier-3 or tier-4 item reaches Arthur as a review packet that answers four questions:

1. **What the agent wants to do.** The change in one sentence, with before and after values.
2. **Why it thinks that is right.** The evidence and reasoning.
3. **What could go wrong.** Failure modes, blast radius, and how to roll back, if it can be rolled back.
4. **Alternatives considered.** At least one other option, including doing nothing.

A bare yes or no is forbidden. The one-tap yes or no from the consent model is allowed only attached to a complete packet, never in place of one. A packet with any of the four answers missing is returned to the agent, not sent on.

Tier 4 packets are informational: they say what was blocked and why. They carry no yes button.

Each tier-3 packet is filed as a dated entry in the consent queue before execution, with the seven fields filled and the agent run ID recorded (see the consent model, section 4, and consent-queue/TEMPLATE.md).

## 3. Timeout: do nothing and escalate

If Arthur does not respond within the packet's stated window:

- The action does **not** run. No answer means no.
- The dispatcher escalates: it re-surfaces the packet on a second channel and marks the entry in the queue as unanswered.
- Silence, delay, or a late answer never counts as approval. A yes given after the window applies only if the packet is re-issued with current values.
- There is no default-approve path for any tier-3 item, and no timeout can lower an item's tier.

## 4. What the dispatcher prioritizes now

The open findings in [security-audits/README.md](security-audits/README.md) (2026-11-02 audit) come first. As of that audit:

- Finding 2: account-recovery phone lookup (get_citizen_by_phone via the anon key).
- Finding 3: PKCE missing on every OTP client except onboard.html (since then partly addressed in code; confirm the audit status before routing).
- Finding 5: shouldCreateUser true on public email sends.
- Finding 6: Content-Security-Policy, now report-only; enforcement is blocked by inline scripts.
- Finding 7: session stored in localStorage.

Read the README's current status column before routing; it is the source of truth, not this list.

## 5. References

- [SUB-AGENT-CONSENT-MODEL.md](SUB-AGENT-CONSENT-MODEL.md): autonomous versus consent-required work, credentials rule, consent queue mechanics.
- [security-audits/README.md](security-audits/README.md): open findings to prioritize.
- consent-queue/: dated consent entries and TEMPLATE.md.

*SIINDEX prepares · AJ authorizes*
