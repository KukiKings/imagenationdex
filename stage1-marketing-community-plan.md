# Stage 1 — Marketing & Community Motion: Status + Action Plan
**Created:** 2026-07-26 | **Covers:** launch-runway-plan-2026.md Stage 1's last open item

---

## Headline finding

Most of this is already built. Three solid, voice-checked documents already exist in this project and just need re-timing + your go-ahead, not a rewrite:

- `second-brain/knowledge/x-thread-drafts.md` — 5 full X/Twitter threads (founder story, Civ Law explainer, sovereign identity, unbanked market data, Grand Synchronicity announcement), already partially corrected to the 24 Jan 2027 date.
- `second-brain/decisions/telegram-community-system.md` — a complete 3-tier Telegram architecture (announcement channel, discussion group, private Founders Circle) with Make.com automation blueprints and message templates, voice-checked.
- `second-brain/decisions/ambassador-program.md` — a full ambassador recruitment + onboarding + referral system, targeted at Pacific Islands diaspora communities specifically.

None of this needs to be invented from scratch. What's actually missing is (1) re-timing the pacing from an old 89-day sprint to the real ~27-week runway, and (2) the handful of setup steps only you can do (Telegram bot creation needs your phone/account).

---

## 1. What needs your call: re-timing the pace

The X-thread and Telegram docs were built for the old 24 Sep 2026 date on an 89-day sprint. The individual dates in the copy are already fixed to 24 Jan 2027, but the **posting cadence** still assumes that compressed sprint (1 thread/week starting immediately, countdown triggers at "10 days out" from the old date). Stretching content that was paced for 89 days across the real ~27 weeks isn't a find-and-replace — it's a real decision about whether you want steady low-key posting for months or to hold most of it back and compress into a shorter pre-launch push closer to January.

**Decided 2026-07-26 — going with the proposed default:**

| Phase | Window | Cadence |
|---|---|---|
| Foundation | Now – mid Aug (Stage 1) | Thread 1 (founder story) posts now to establish voice. Telegram channel + Founders Circle already live. No hard weekly quota yet — quality over cadence while the backend just finished. |
| Steady build | Aug 20 – early Dec (Stage 2) | 1 thread every 2–3 weeks (Threads 2–4: Civ Law, sovereign identity, unbanked market data), Telegram Founders Circle Mon/Wed/Fri rhythm starts once ambassadors are recruited. This is also when ambassador recruitment, the public Citizens group, and KOL outreach happen. |
| Pre-launch push | Early Dec – 24 Jan 2027 | Weekly-to-biweekly cadence increases. Thread 5 (Grand Synchronicity announcement) and the Telegram countdown fire at the real "10 days out" mark: **~14 January 2027**, not the old Sept-14 trigger. |

This is now the working schedule — flag it to me if priorities shift and it needs re-timing again.

---

## 2. Your action items — corrected 2026-07-26

You said the Telegram bots are done, and checking `second-brain/companies/telegram.md` (Sessions 61–62), you're right about the core setup:
- **@imagenationdex announcement channel** — exists, SIINDEXbot is admin with full permissions (2 subscribers as of Session 61 — real, small, not padded)
- **IN$DEX Founders Circle** — exists as a private supergroup, SIINDEXbot is admin with full permissions (chat ID `-1004372531753`)

**Decision 2026-07-26 — public "IN$DEX Citizens" discussion group (Tier 2): hold, don't build yet.** No record of this one being created — only the channel and the private Founders Circle exist. Recommendation was to skip it for now rather than open it empty: with 11 real citizens and 0 waitlist, a public group with nobody talking in it reads as a dead project to anyone who finds it. The channel is fine at any size (one-way broadcast, not a room people watch sit silent) and Founders Circle is fine small (explicitly private/invite-only, so a handful feels intentional). AJ agreed.

**Trigger condition — build it when ambassador recruitment starts (Stage 2, ambassador-program.md).** The right moment to open the public group is the same week the first wave of ambassadors comes on board, so it has real voices posting from day one instead of sitting silent with a pinned welcome message. Revisit this the moment ambassador recruitment kicks off — don't build it before then.

**Make.com welcome-automation scenarios** (`assets/make-scenario-1-citizen-welcome.json`, `make-scenario-2-group-welcome.json`) still have placeholder values (`REPLACE_WITH_CHANNEL_CHAT_ID`, `REPLACE: add your SIINDEXbot connection after import`) — verified directly in Make.com (org 8188597 "My Organization", team 2497416 "My Team"): zero scenarios exist there, only the default AI Provider connection. These were drafted but never imported. Blocked on AJ adding a Telegram Bot connection in Make.com himself — entering the bot token into that field is a credential-entry action Claude can't perform even with the token in hand. Once that connection exists, the two scenarios (webhook → welcome message, new-citizen → channel announcement) can be built and wired to the real Founders Circle chat ID (`-1004372531753`) and the not-yet-existing Citizens group ID (once that's built, per the trigger above).

Remaining action: posting Thread 1 to X yourself (I can draft/refine text but can't post on your account without a connected tool and your explicit go-ahead each time).

---

## 3. Partner / community target list (real, verified — researched today)

The ambassador-program doc already names the right regions (Pacific Islands diaspora, church networks, Facebook groups) but didn't have specific named organizations. Since you're Melbourne-based and the corridor screens already built are Melbourne↔Samoa/Fiji/Vanuatu/RMI, here's a real, checkable list of Victoria-based Pacific community organizations — natural first conversations before going wider:

**Umbrella / multi-community bodies:**
- **United Pacific Community Organisations Victoria (UPCOV)** — board representing Maori, Cook Islands, Samoan, Tongan, Niuean, and Fijian communities in Victoria. A single conversation here touches multiple diaspora groups at once.
- **United Pasifika Council of Victoria** — lists Cook Islands community work specifically.

**Cook Islands (your own heritage — warmest possible intro):**
- **Cook Islands Community Services Victoria Inc.** (Melbourne) — active Facebook presence, [facebook.com/cicv03](https://www.facebook.com/cicv03/)
- **Cook Islands Community Services of Victoria** — [facebook.com/cicsv](https://www.facebook.com/cicsv/)
- Note: 2016 census counted ~1,899 Cook Islands-born Victorians, concentrated in Casey (25%), Greater Dandenong (22%), and Kingston LGAs — useful for targeting a first market activation, not just online outreach.

**Fijian:**
- **Fijian Community Association of Victoria (FCAV)** — active events calendar (Youth Leadership Summit, Fiji Day Multicultural Festival), [fcav.org](https://fcav.org/)

**Tongan:**
- **Tonga-Victoria Association (TVA)** — [facebook.com/tongavictoria](https://www.facebook.com/tongavictoria/)
- **Victoria Tongan Sporting Association** — active on Instagram (@vtsainc)

**Government reference (not a partner, but useful for framing and credibility):**
- **vic.gov.au Pasifika community profile** — official state government demographic/community resource, useful for citing real numbers if needed in outreach materials: [vic.gov.au/pasifika-community-profile](https://www.vic.gov.au/pasifika-community-profile)

**Remittance-adjacent (for the "why IN$DEX" pitch, not necessarily partners — they're existing players in the exact pain point IN$DEX solves):**
- **SendMoneyPacific** — joint Australia/NZ government remittance-comparison service, useful as a citable source on current remittance costs when pitching the 98/2 Law: [sendmoneypacific.org](https://sendmoneypacific.org/)
- **Pacific Ezy Money Transfer** — Samoan/NZ-owned remittance operator, real existing corridor player: [pacificezy.com](https://www.pacificezy.com/)

**Suggested first move:** a direct, personal outreach to Cook Islands Community Services Victoria first (your own heritage, warmest possible door), then UPCOV as the multi-community umbrella once you have one real community relationship to point to.

---

## 4. Draft outreach — Cook Islands Community Services Victoria

**Status: DRAFT ONLY — not sent.** Per the same rule as the Uncle Mac emails, this needs your review before anything goes out. Channel: their Facebook page ([facebook.com/cicv03](https://www.facebook.com/cicv03/)), since that's the contact point that's actually active.

> Kia orana,
>
> My name's AJ Henry — I'm Cook Islands/NZ heritage, based here in Melbourne (Casey area). I've been building something for the last while that I think your community would genuinely want to know about, so I wanted to reach out directly rather than just post about it.
>
> It's called IN$DEX — a way to send and receive money on your phone with no bank account needed, and a fixed 2% fee instead of the 10-15% that remittance services usually take on transfers home to the islands. I built it after watching how much that cost hurts families sending money back.
>
> I'm not looking for anything right now — just wanted to introduce myself and what I'm working on, since it's built with exactly this community in mind. Happy to come along to an event, answer questions, or just talk story if that's useful.
>
> Thank you ra,
> AJ

Notes: kept it short, no ask, no jargon, leads with the real problem (remittance fees) rather than the product. Matches the "genuine sharing, not leverage" tone AJ set for the Uncle Mac thread. Sign-off ("Thank you ra") mirrors AJ's own Messenger text to Uncle Mac rather than a Cook Islands Māori phrase I can't independently verify. Edit freely — this is a first pass, not final copy.

---

## Open questions for you

1. Which pacing option from the table above — steady low-key, or hold-and-compress toward January?
2. Add the Telegram Bot connection in Make.com when you get a chance (60-second step, see above) so the welcome-automation scenarios can be built.
3. Want me to draft a short, personal outreach message to Cook Islands Community Services Victoria as a starting point (same "genuine sharing" tone as the Uncle Mac emails, not a pitch)?

**Resolved:** public "IN$DEX Citizens" group — hold until ambassador recruitment starts (see Section 2).
