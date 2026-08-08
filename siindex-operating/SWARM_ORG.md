# SIINDEX Swarm Org Chart

**Status:** Living  
**Updated:** 2026-08-09  
**Rule:** Every specialist reports to **SIINDEX (CEO/COO)**. Tools are execution interfaces, not parallel founders.

---

## 1. Top structure

```
AJ Henry (Authorizer)
        │
        ▼
SIINDEX — CEO & COO
        │
        ├── COO Orchestrator (dispatch brain)
        │         SIINDEX-Skills/siindex-coo-orchestrator/
        │
        ├── Media Swarm
        ├── Build / Product Swarm
        ├── Knowledge / Second-Brain Swarm
        ├── Security / Compliance Swarm
        ├── Citizen / Growth Swarm
        ├── Treasury / Launch Swarm (pre-flight)
        ├── Ops / DevOps Swarm
        └── Government / Cook Islands Pack
```

---

## 2. Existing specialist skills (under SIINDEX)

From `SIINDEX-Skills/` and media agents — mapped to swarms:

### COO / dispatch
| Skill | Path |
|-------|------|
| COO Orchestrator | `SIINDEX-Skills/siindex-coo-orchestrator/` |
| OPS brief | `siindex-ops-brief.skill` |
| Pre-build checklist | `siindex-pre-build-checklist/` |

### Security / compliance
| Skill | Path |
|-------|------|
| PQSI Security | `pqsi-security.skill` |
| PQSI Compliance | `pqsi-compliance/` |
| Anomaly | `siindex-anomaly.skill` |
| Canonical guard | `siindex-canonical-guard/` |

### Treasury / markets / launch (prepare only until AJ)
| Skill | Path |
|-------|------|
| Treasury | `siindex-treasury/` |
| LP manager | `siindex-lp-manager/` |
| Market intel | `siindex-market-intel.skill` |
| Token launch | `siindex-token-launch/` |
| Agent wallet | `siindex-agent-wallet/` |

### Citizens / growth
| Skill | Path |
|-------|------|
| Citizen ops | `siindex-citizen-ops/` |
| Waitlist ops | `siindex-waitlist-ops/` |
| Referral engine | `siindex-referral-engine/` |
| Community report | `siindex-community-report/` |
| Support | `siindex-support.skill` |
| Onboarding concierge | `indx-onboarding-concierge/` |

### Build / product
| Skill | Path |
|-------|------|
| Website builder | `indx-website-builder/` |
| DevOps | `siindex-devops/` |
| Git commit prep | `siindex-git-commit-prep/` |
| MemeDAO governance | `siindex-memedao-governance/` |

### Media swarm (`siindex-media/agents/`)
| Agent | File |
|-------|------|
| Context | `01-context.md` |
| Script | `02-script.md` |
| Prompt | `03-prompt.md` |
| Voice | `04-voice.md` |
| Edit | `05-edit.md` |
| Compliance | `06-compliance.md` |
| Publish | `07-publish.md` (stops at needs-aj) |

---

## 3. Dispatch configurations (from COO skill)

| Mode | Agents | Trigger |
|------|--------|--------|
| Full swarm | Core 11 | “run the swarm”, full audit |
| Daily brief | Sentinel, Treasury, Market, CitizenOps, DevOps, OPS | morning brief |
| Security | Sentinel, Anomaly, Counsel | threat / PQSI |
| Citizen | CitizenOps, Support | community health |
| Growth | Waitlist, Referral, Report | waitlist / K-factor |
| Infrastructure | DevOps, OPS | site status |
| Governance | MemeDAO, OPS | proposals |
| Financial | Treasury, LP | balances / pool |
| L99 readiness | All 15 | launch readiness |

**Hard rules:** Never fake sub-agent data. Worst status wins. No solo Solana signing. T3+ surfaces before synthesis.

---

## 4. Media job flow (under SIINDEX)

```
SIINDEX assigns job
  → Context → Script → Visual prompt → Voice → Edit → Compliance
  → status: needs-aj
  → AJ authorizes
  → Publish agent places file (e.g. videos/siindex-public-intro.mp4)
```

Current blocker example: **intro-home-15s** needs true speaking / lip-visible Imagine (or studio) master — package exists; standing portrait is not accepted as final.

---

## 5. Runtime packages

| Package | Role |
|---------|------|
| `siindex-agent/` | Python agent core (brain, memory, voice, scheduler) |
| `siindex-elizaos-character.json` | Character card for agent runtime research |
| `supabase/functions/siindex-website-*` | Website runtime, transcribe, TTS |

These are **her** runtime limbs — not separate products.

---

## 6. Tool interfaces (not org chart peers)

| Interface | Use |
|-----------|-----|
| Grok | Research, verify, public build when Codex offline, media briefs |
| Claude | Continuity, docs, COO-style orchestration, second-brain |
| Codex | Code when credits available |
| ChatGPT | Overflow build when others offline |

All must load **Operating Charter + Source of Truth** before claiming SIINDEX decisions.

---

## 7. Activation gap (honest)

**Exists in repo:** skills, media packages, second brain, public knowledge, COO dispatch card.  
**Not fully activated:** continuous autonomous dispatch with live data feeds, true speaking intro film, production financial authority (correctly gated).

**Next activation steps:**
1. Every agent session starts from `siindex-operating/`  
2. COO brief format used for daily status  
3. Media swarm completes speaking intro after AJ provides / approves Imagine master  
4. Public knowledge stays sole public speech source until expanded

---

*Org chart consolidates SIINDEX-Skills + siindex-media + agent runtime under one CEO/COO.*
