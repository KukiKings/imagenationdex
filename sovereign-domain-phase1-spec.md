# SPEC: Sovereign Domain — Phase 1 (Credential Foundation + Public View)

**Date:** 2026-07-15
**Session:** 121 continued x10
**Who requested it:** AJ (via the two doctrine docs: `sovereign-domain-credential-layer-v1.md` + `sovereign-life-domain-use-cases-v1.md`, 140 use cases total)

> **Status: APPROVED by AJ 2026-07-15** — "I authorize all your decisions, mainly based on your research." Building against this spec now, starting with Bucket 1. Updated below to fold in the Sovereign Agent / community-vouched credential (research recommendation), which now supersedes the original placeholder for Bucket 3.

---

### 1. THE GOAL (not the task)

**The problem we're solving:** Right now `citizens.web3_domain` is just a text string (`yourname.IN$DEX`) stored in a row — there is no page anyone can actually visit at that address, and there is no `credentials` table anywhere in Supabase. Every one of the 140 use cases in the doctrine docs (Living CV, verified qualifications, employer views, business trust pages, etc.) assumes two things that don't exist yet: (1) a real, visitable domain page, and (2) a real credential record type with an issuer, a status, and an expiry. Nothing else in the doctrine can be built honestly until these two primitives are real.

**The decision this drives:** Whether "sovereign domain" becomes something a citizen can actually show someone (a merchant, an employer, a family member) — and whether the next 16 parts of the doctrine (education, employment, business, government, health, etc.) have a real foundation to attach to, or whether this stays a vision document.

**Who uses this:**
- [x] Citizens (visiting their own domain, seeing it work for the first time)
- [ ] SIINDEX (automated/scheduled) — not this phase
- [x] Public (anyone visiting `citizen.IN$DEX` sees the Public View, no login)
- [x] AJ (reviewing whether the foundation is solid before Phase 2)

**What does success feel like for the user?** AJ types his own test citizen's domain into a browser and a real page loads — real name, real domain, whatever's genuinely verified (genesis citizen status, wisdom score) shown as a badge, nothing fabricated. He can share that link with someone else and it means something.

---

### 2. SCOPE (tight — agile, not waterfall)

**What is IN this build:**
1. A new `credentials` table: minimal, generic schema that later parts of the doctrine (education, employment, business, government credentials) can all reuse without a redesign — not a per-use-case table.
2. Two real credential types for launch:
   - **Genesis Citizen status + Wisdom Score tier** — derived live from existing `citizens` columns at read time (not stored as rows — nothing to keep in sync, zero new verification process, zero risk of fabricating anything).
   - **Sovereign Agent / community-vouched credential** (research-driven addition, replaces the original Bucket 3 placeholder) — an *issued* credential: one citizen (acting as a Sovereign Agent) vouches for a new citizen they personally onboarded, mirroring the M-Pesa/Fiji agent-led model the research identified as the single highest-leverage onboarding lever for IN$DEX's target markets. This is the first real "someone verified this, not the system" credential — the actual foundation the wider 140-use-case doctrine needs (institutional issuers, employer verification, etc. all follow the same shape later).
3. A public, unauthenticated **Domain Public View** page — one new HTML file, one new Vercel route (`/d/<slug>` → `domain.html?slug=<slug>`, matching the existing `/pay/<slug>` pattern) — showing: display name, `slug.IN$DEX`, genesis/wisdom/agent-vouched badges (only if real), a "Pay this person" link (reuses the already-working `/pay/<slug>` route), and a marketplace link if `account_type` is a business type.
4. RLS + a SECURITY DEFINER read RPC (`get_public_domain_view(p_slug)`) — public callers only ever get the fields explicitly allowed for the Public View, never the full `citizens` row.
5. A SECURITY DEFINER issue RPC (`issue_agent_vouch_credential(p_agent_citizen_id, p_new_citizen_id)`) — validates the issuer is a real citizen with `account_type = 'community_agent'`, blocks self-vouching, writes one real row.

**What is explicitly OUT (don't build this yet):**
1. Selective disclosure / minimum-proof system (Part One doctrine) — needs real cryptographic infrastructure, not a copy/wiring task.
2. Institutional issuer accounts, the Credential Issuance Console, any cross-institution recognition (Part Sixteen) — no institutions have accounts on this platform yet.
3. The other 8 domain views (Employer, Education, Business, Government, Community, Private, Emergency, Customer) — Public View only this phase.
4. Any of Parts Two–Eighteen's specific use cases (Living CV, apprenticeship passport, PALM worker passport, health credentials, disaster mode, etc.) — all depend on the foundation this phase builds, none are in scope yet.
5. Any KYC tier change — platform stays Tier 0 (phone + liveness) only; this phase does not touch KYC.
6. **The full Sovereign Agent product** (agent registration screen, agent dashboard, commission tracking/payout) — this phase builds only the credential-issuance primitive (one RPC an agent could call once they have an `account_type` of `community_agent`). The registration flow and dashboard are their own build, flagged separately below — not assumed in scope here just because the credential type is being added now.

**Checkpoint — what AJ reviews before the next step:** the `credentials` table schema + one real rendered domain page (probably yours) before a second credential type or a second view gets built.

---

### 3. EVALUATION CRITERIA

**The output must:**
- [ ] Show only real Supabase data — no fabricated "verified" badge without a real `credentials` row backing it
- [ ] Load at a real, shareable URL
- [ ] Never show wallet balance on the Public View (Part Seventeen's explicit rule: "no public wallet balance by default")
- [ ] Never show phone number or private identity fields on the Public View

**For HTML screens:**
- [ ] max-width 430px, dark theme, brand colours
- [ ] USD only — no AUD, no A$
- [ ] INDX price = $0.24 if referenced
- [ ] No seed phrase mention
- [ ] SIINDEX voice on any SIINDEX-attributed copy
- [ ] Mama Noe test passes

**For Supabase:**
- [ ] RLS enabled on `credentials`, zero client-side write policies (RPC-only, same pattern as `consent_receipts`/`instant_invites`)
- [ ] Public read RPC returns only the allow-listed fields, verified via `execute_sql` before presenting
- [ ] Domain lookup keyed on `web3_domain`, case-correct (`.IN$DEX`, not `.indx`) — this session's recurring bug class

**External signal to verify completion:** AJ visits `/d/<his-test-domain-slug>` on the deployed site (or the Vercel preview) and every field shown is independently confirmable via `execute_sql` against the real `citizens` row.

---

### 4. KEY DECISIONS — please confirm or correct

| Decision | Proposed | Why | AJ confirms? |
|---|---|---|---|
| Route pattern | `/d/<slug>` → `domain.html?slug=<slug>` | Matches existing `/pay/<slug>` convention in vercel.json | ✅ approved |
| Credential types at launch | Genesis Citizen + Wisdom Score tier (derived) + Sovereign Agent vouch (issued) | Derived types need no new process; agent-vouch is the research's #1 recommended lever and the first real "someone verified this" credential | ✅ approved |
| Who can issue the agent-vouch credential | Any citizen with `account_type = 'community_agent'` — set manually by AJ for now, no self-service agent signup yet | Avoids building a full agent-approval workflow before the concept is proven | ✅ approved |
| New table name | `credentials` | Generic — reused by all later credential types (education, employment, licence, etc.) rather than one table per type | ✅ approved |
| Currency/price shown | USD, $0.24 | Standing rule | (no confirm needed) |

---

### 5. BUILD ORDER

**Bucket 1 (build first, review before proceeding):** `credentials` table + RLS + `get_public_domain_view(p_slug)` RPC, tested via `execute_sql` against a real test citizen row. AJ reviews the schema and a raw JSON response before any HTML is written.

**Bucket 2 (only after Bucket 1 approved):** `domain.html` Public View page + the `/d/<slug>` Vercel route. AJ reviews the live rendered page.

**Bucket 3 (if AJ wants to keep going):** wire a second real credential type (candidates: verified business via `business_metadata`, or a manually-issued "AJ-verified" pilot credential) — separate spec checkpoint, not assumed in scope here.

---

### 6. WHAT SIINDEX MUST NOT DO

- Must NOT show a "verified" badge for anything that isn't a real row/column value
- Must NOT expose wallet balance, phone number, or full legal identity on the Public View
- Must NOT build institutional issuer accounts or an issuance console this phase
- Must NOT touch KYC tier logic
- Must NOT treat this spec as covering any of the other 139 use cases — each later slice gets its own checkpoint

---

### SPEC SIGN-OFF

- [ ] AJ has read and approved this spec (or edited scope/decisions above)
- [x] Claude has confirmed the goal (real credential + real public page as the foundation everything else depends on, not any single use case yet)
- [x] Evaluation criteria are measurable (real data only, RLS verified, live URL check)
- [x] External signal defined (visit `/d/<slug>`, cross-check via `execute_sql`)

**AJ sign-off:** ___________ **Date:** ___________
