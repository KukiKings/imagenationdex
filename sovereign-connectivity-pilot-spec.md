# SPEC: Sovereign Connectivity Pilot (Phase 0 of the Sovereign Access Network)

**Date:** 2026-07-16
**Session:** 121 continued x19
**Who requested it:** AJ ("god mode, do deep research" on the Sovereign Access Network doctrine)

> **Status: DRAFT — awaiting AJ review.** This is new scope, not a fake-data fix on an existing promise, so it follows Power Phrase #2 (write the spec, AJ reviews before a line of code) rather than the "just fix it" standing order that governs the existing 256-screen sweep. Nothing in this spec has been built. See `sovereign-access-network-v1.md` for the full 35-point doctrine this spec is scoped down from.

---

### 1. THE GOAL (not the task)

**The problem we're solving:** The doctrine document lists 35 architectural components and a 15-item "recommended build order." Most of those 15 items are not software tasks — they're real-world partnership and procurement decisions (a licensed telecom partner, a device-financing partner, community access stations, a disaster continuity test). Attempting to code any of this before those partnerships exist would repeat exactly the mistake this session has spent all day fixing elsewhere in the platform: shipping a UI that claims a real capability with nothing real behind it. eSIM/satellite/telecom integrations built speculatively, with no real partner API to call, would just be fake data wearing a new theme.

**The decision this drives:** What IN$DEX can honestly start building *this month* with zero external partners (pure Supabase/schema work that every future rail will need regardless of which telecom partner is chosen), versus what depends entirely on AJ making real-world calls (which telecom, which device partner, which community stations) that no amount of my research or code can substitute for.

**Who uses this:**
- [ ] Citizens — not yet, this phase is foundation-only
- [ ] SIINDEX (automated) — not yet
- [x] AJ — reviewing what's buildable now vs what needs a partner decision first

**What does success feel like for AJ?** A clear, honest split: "here's what I can build today with what we have," and "here's the list of real-world decisions only you can make before the rest can be real" — not a demo screen that looks like a working eSIM feature but calls nothing.

---

### 2. SCOPE

**What is IN this build (software-only, no external partner required, buildable now if approved):**

1. **Connectivity Wallet schema** — new `citizen_connectivity` table (or columns) mirroring section 4 of the doctrine: current plan, remaining data, expiry, operator, coverage, active/backup profile, sponsored/education/merchant/emergency allowance, roaming status, usage consent, provider terms — all nullable/empty until a real telecom integration exists to populate them. This is pure data-model work: building the shape now means whichever telecom partner AJ signs later plugs into an already-designed table instead of a rushed retrofit.
2. **Connectivity Change Receipt** — extends the existing immutable receipt pattern (`consent_receipts`/`security_events`) with a `connectivity_events` table for the event types in section 12 (eSIM installed, SIM replaced, number changed, operator changed, etc.). Same trigger-based immutability as the existing tables. Buildable now; simply has nothing to log until a real telecom event source exists.
3. **Citizen Guardians → SIM-swap protection hook** — the `citizen_guardians` table built this session (x18) and the freeze infrastructure (x14) already give IN$DEX two of the four pieces section 11 (SIM-Swap Defence Protocol) needs: a way to know who a citizen's trusted contacts are, and a way to freeze sensitive actions. The remaining two pieces — actually detecting a SIM swap and actually reducing payment limits automatically — depend entirely on a telecom partner exposing the GSMA Open Gateway SIM Swap API (confirmed real and already live through Telefónica and national rollouts — see the doctrine's Research Grounding Notes). **Do not build a fake "SIM swap detected" event.** Design the schema/RPC shape now (`log_connectivity_risk_event`), leave the actual trigger source as an explicit TODO tied to a named partner integration.
4. **Zero-Balance Civilisation Mode — the citizen-facing screen only** — a real screen showing Grid Account status, offline credentials, emergency messages, support contact, stolen-device report, and identity-recovery-code generation (all of which are already real capabilities elsewhere on the platform: account-recovery.html, card-freeze.html/emergency-freeze.html, security-settings.html). This phase is a real *aggregation* screen, not a new capability — every action on it links to an already-real flow. No telecom partner needed for this piece specifically, because it doesn't touch data balance at all; it just needs to keep working with zero balance, which is a hosting/frontend property, not a telecom one.
5. **Provider-neutral disclosure copy pattern for SIINDEX** — build the reusable copy/UI pattern from section 34 (Telecom Neutral SIINDEX) now, so that whichever provider comparison screen gets built later already has the disclosure requirement baked into the component, not bolted on after a partner deal is signed.

**What is explicitly OUT (real-world decisions AJ must make before any of this can be built for real):**

1. **A licensed embedded-telecom partner** (recommended-build-order item 1) — **AJ's refined decision 2026-07-16: embedded connectivity, not a build-your-own-network system.** IN$DEX owns the citizen-facing service architecture (SIINDEX onboarding, consent, Connectivity Wallet, billing presentation, risk/recovery); a licensed partner supplies the regulated telecom infrastructure underneath. Three real candidates were researched and confirmed viable: **1GLOBAL** (GSMA-certified MVNO in 10 countries, proven embedded pattern already live for Revolut/freenet/N26), **Mobilise** (carrier/SM-DP+-agnostic HERO platform, good for avoiding single-vendor lock-in), and **Gigs** (single API, 195+ countries, ~3–6 week typical integration). Full evaluation and regulatory route: `sovereign-embedded-connectivity-charter-v1.md`. No code should call a live telecom API until an RFI process has run and a partner is actually signed — building against a hypothetical partner's API risks locking in an integration shape that doesn't match the real one. What IS buildable now, sandboxed and explicitly disconnected from citizen-facing production: the Provider Adapter contract/interface and a Provider Capability Registry listing candidate providers (status: candidate/sandbox — never "live" until a real integration exists).
2. **A backup connectivity partner** (item 2) — same reasoning.
3. **Device-financing / refurbished-phone partner** (item 8 in the doctrine's Device Access Programme, item 8 in the build order) — this is a procurement/business relationship, not a software task.
4. **Community access stations, merchant/student/worker pilot cohorts** (build-order items 4–7) — these are real people and real locations AJ or a local partner has to recruit; nothing to code yet.
5. **Direct-to-device satellite** — confirmed genuinely early-stage everywhere, not just for IN$DEX (see doctrine Research Grounding Notes). Do not build toward this until a specific satellite operator has confirmed Pacific coverage.
6. **PALM Worker Arrival Mode as a live product** — real value-add on top of the real PALM scheme, but requires an actual relationship with a PALM-approved employer or the PALM support service before it's more than a doctrine page. Software shape can wait until that conversation happens.

**Checkpoint — what AJ reviews before the next step:** whether the 5 buildable-now items above are worth building ahead of any signed telecom partner, or whether AJ would rather hold all schema work until a specific partner is chosen (so the schema matches that partner's actual data shape on the first try instead of a generic guess).

---

### 3. EVALUATION CRITERIA

**The output must:**
- [ ] Never claim a live telecom capability (real-time data balance, real eSIM provisioning, real SIM-swap detection) that has no real partner integration behind it
- [ ] Every new table follows the existing RLS + RPC-only pattern (no client-side writes), matching `consent_receipts`/`citizen_guardians`
- [ ] The Zero-Balance Mode aggregation screen only links to flows that are already real elsewhere on the platform — no new fake action
- [ ] SIINDEX disclosure copy pattern is written once and reusable, not hardcoded per-screen

**For any HTML screens:** max-width 430px, dark theme, brand colours, USD only, no seed-phrase flows, mobile-first — same standing rules as every other screen on the platform.

---

### 4. THE ORIGINAL 15-ITEM PILOT LIST (from AJ's doctrine, for reference — not all in scope this phase)

1. One licensed telecom or eSIM partner — **business decision, not software**
2. One backup connectivity partner — **business decision, not software**
3. Mixed eSIM and physical-SIM support — **depends on #1**
4. Ten merchants — **recruitment, not software**
5. Ten students — **recruitment, not software**
6. Five workers or diaspora participants — **recruitment, not software**
7. Two community access stations — **real-world siting, not software**
8. One device-financing or refurbished-phone partner — **business decision, not software**
9. One sponsored-data programme — **schema buildable now (see item 1 above); activation depends on #1**
10. One disaster continuity test — **depends on real stations/partners existing first**
11. One SIM-swap simulation — **schema/RPC shape buildable now; real detection depends on #1**
12. One operator-switch test — **depends on #1 and #2 both existing**
13. One shared-device test — **already buildable — Shared-Device Sovereignty Mode (doctrine section 8) reuses patterns from this session's citizen-profile/session work**
14. One zero-balance essential-access test — **buildable now, see item 4 above**
15. One offline synchronisation test — **buildable now as a technical exercise, independent of any telecom partner**

Roughly a third of the list is real software IN$DEX can start on today. The rest is AJ's business development work — telecom licensing conversations, device partnerships, and on-the-ground recruitment in the Cook Islands/Pacific — that no build session can substitute for.

---

### 5. NEXT STEP

Awaiting AJ's decision: build the 5 buildable-now schema/screen items in this session's usual style (migration → RPC → test against real Supabase data → frontend → audit), or hold until a specific telecom partner is chosen so the schema is built against that partner's real data shape once, not guessed at twice.
