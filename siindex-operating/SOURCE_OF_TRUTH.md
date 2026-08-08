# SIINDEX Source of Truth Map

**Status:** Living  
**Updated:** 2026-08-09  
**Rule:** SIINDEX and all tools read in this order. Higher wins on conflict unless AJ re-locks.

---

## 1. Hierarchy (resolve conflicts top-down)

| Rank | Source | Path | Use for |
|------|--------|------|--------|
| 1 | Behaviour | `soul.md` | How agents behave in session |
| 2 | Founder prefs | `user.md` | AJ context |
| 3 | Operating charter | `siindex-operating/OPERATING_CHARTER.md` | CEO/COO model, gates |
| 4 | Public speech | `siindex-public/LIVING_KNOWLEDGE_SOURCE_v1.md` + `js/siindex-public-knowledge.js` | What citizens and officials hear |
| 5 | Product body | `whitepaper-v1.md` | Full product / use cases |
| 6 | Partner whitepaper | `IN$DEX_Whitepaper_v2.0_Partner_Prelaunch_Edition.docx` | Partner-facing pre-launch edition |
| 7 | Commercial sealed | `business-plan-v12.5-SEALED.md` | Commercial strategy |
| 8 | Session state | `memory.md` | Recent session continuity |
| 9 | Compounded knowledge | `second-brain/` | Companies, decisions, daily, moc, people |
| 10 | Identity bio | `second-brain/siindex-identity/siindex-official-bio.md` | Cultural / presence bio |
| 11 | Swarm skills | `SIINDEX-Skills/` | Specialist execution cards |
| 12 | Media packages | `siindex-media/` | Video/script jobs |

**Public vs internal:**  
Anything said to a visitor, reporter, or government must match **rank 4** first.  
Internal build may use ranks 5–12. Never promote internal aspiration to public “live” without AJ.

---

## 2. Second brain layout (her operating memory)

| Path | Role |
|------|------|
| `second-brain/moc/_index.md` | Map of content |
| `second-brain/decisions/` | Locked decisions (e.g. business partner doctrine) |
| `second-brain/knowledge/` | Architecture, tool stack, error prevention |
| `second-brain/companies/` | External entities |
| `second-brain/daily/` | Daily logs |
| `second-brain/people/` | People notes |
| `second-brain/siindex-identity/` | Official bio |
| `sovereign-second-brain/` | System + master plan for second-brain tooling |
| `siindex-agent/core/memory.py` | Runtime memory hooks (agent package) |

---

## 3. White paper / product truth

| Asset | Notes |
|-------|--------|
| `whitepaper-v1.md` | Primary long-form product truth (~large) |
| `IN$DEX_Whitepaper_v2.0_Partner_Prelaunch_Edition.docx` | Partner pre-launch edition |
| `siindex-public/utility-directory.json` | Public status board data |
| `siindex-public/page-context-map.json` | Page-aware context contract |

**Wiring rule for agents:**  
When answering product “what do we offer / what is planned,” prefer white paper + utility directory + living knowledge. Do not invent utilities.

---

## 4. Public knowledge bridge (live site)

| File | Role |
|------|------|
| `js/siindex-public-knowledge.js` | On-device public Q&A |
| `js/siindex-public-boot.js` | Loads knowledge → context → bridge → fixes |
| `js/siindex-page-context.js` | Page context |
| `js/siindex-public-bridge.js` | Bridge to UI |
| `js/siindex-home-ask-fix.js` | Home Talk chips |
| `js/siindex-intro-player-honesty.js` | Intro honesty until speaking film lands |

**Version discipline:** Bump knowledge version when public facts change; keep living knowledge markdown and JS in sync.

---

## 5. What is *not* source of truth alone

- Random chat history without write-back to memory/second-brain  
- Unverified agent claims about “live” prices, licences, or registration  
- Stale screens that still say “AI”  
- Demo data labelled as live

---

## 6. Write-back duty (how she compounds)

After material work, SIINDEX / tools must:

1. Update `memory.md` with session outcome  
2. Update second-brain decision or daily note when a decision is locked  
3. Update living public knowledge + public JS when **public** facts change  
4. Update utility directory status when a surface moves Live / Testing / Planned / Paused  
5. Never claim write-back happened without the file change existing on the branch

---

## 7. Known contradictions to surface (not silently fix)

| Topic | Conflict |
|-------|----------|
| Milestone date | Sep 2026 vs Jan 2027 vs Feb 2027 (see Operating Charter §7) |
| Company-context PQSI wording | Older “Quantum Physical” vs locked **Physical Quantum** |
| “Canon” language | AJ: stop using “canon” for public/process docs — prefer living / agreed / locked |
| SIINDEX authority phrasing | Older “explain only” vs corrected **runs business; AJ authorizes** |

---

*This map wires the second brain and white paper as her long-form OS. Public speech stays on living knowledge until AJ expands public scope.*
