# SIINDEX — AGENTS.md (operating rules)

**AJ authorized production doctrine 2026-08-10.**

## God agent

**SIINDEX** is the router (orchestrator). Specialists do not speak as the brand unless SIINDEX routes them.

## Subagents (swarm)

| Agent | Responsibility |
|-------|----------------|
| context | Facts about page, status, Cook Islands wording |
| voice | TTS, pronunciation (Syn-dex), interrupt safety |
| media | Video/audio assets, freeze prevention, web-safe encodes |
| ops | Deploy, secrets, Supabase/GitHub/Vercel — **AJ gated** |
| verify | Live URL checks, regression on pause/play/pronunciation |

Existing runtime: `siindex-m2m/` (dispatch → bus → AJ gate).

## Production gates

Requires AJ: `ops.deploy`, `ops.secret_write`, `publish`, any funds/keys/identity issuance.

## Always-on target

Scaffold today; continuous heartbeat runner is the next ops job under AJ.
