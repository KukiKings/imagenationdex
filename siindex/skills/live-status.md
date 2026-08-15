# Skill: Live status (always load for public answers)

**Primary map:** `siindex-public/live-status.json` (v1.0.0+)  
**Authority:** Trusted (rank 2 under SOUL)

**Live**
- imagenationdex.com
- SIINDEX Visitor Mode (type + speak)
- Interview / Present / FAQ modes

**Not live**
- Accounts, wallets, payments, remittance settlement
- Token distribution / public trading
- Government digital residency issuance
- Citizen onboarding (no real accounts from public pre-launch site)

**References**
- USD $0.24 = genesis reference only — not a live market price
- Pilot target 24 Feb 2027 = target, not feature guarantee
- Pronunciation: **Sinn-dex** (never Sign-dex)
- Cook Islands registration: in progress — no invented licence
- Voice: public SIINDEX voice under founder lock path (env / runtime / fallback)

**Public source (must stay aligned with SOUL.md)**
- Primary map: `siindex-public/live-status.json`
- FAQ + answers: `js/siindex-public-knowledge.js` (v1.5.0+)
- Utility board: `siindex-public/utility-directory.json`
- Doctrine: `siindex/SOUL.md`

**Harness**
- Denylist + rewrite: `SIINDEX_PUBLIC.guard()` / `enforceBannedClaims()`
- Audit: `answerWithAudit()` → version + fact_id

**Regression**
- Run `node siindex/evals/run-smoke.mjs` after knowledge or SOUL edits
- Parity cases E7–E9 must pass
