# IN$DEX Telegram Community System
**Canonised:** 27 Jun 2026 | **Status:** Build-ready — pending Telegram bot token from AJ
**Author:** SIINDEX + AJ Henry | **Research base:** Tavily deep research, Make.com Telegram docs, 2026 crypto community standards

---

## Research Findings

**Why Telegram is non-negotiable for IN$DEX:**
- 100% message delivery rate vs 3–7% Instagram reach, 20% email open rate
- Web3 and Pacific Islands communities are Telegram-native
- Automation-ready: Make.com has full Telegram Bot module (Watch Updates → Send Message)
- New members can join in one tap — zero friction, no account needed
- Free plan on Make.com (2497416 team) supports 2 active scenarios and 1,000 ops/month

**What top 2026 crypto Telegram communities do right:**
- Immediate automated welcome (within 5 seconds of joining)
- Clear structure: announcement channel + chat group + private VIP
- Welcome message explains the one rule, one resource, one CTA
- Personalised greeting with @username tag
- Pinned resources updated weekly
- 15–20% daily engagement participation rate target
- Community managers reply to every first-time question
- Combot or Rose Bot for anti-spam

---

## The 3-Tier IN$DEX Telegram Architecture

### Tier 1 — @imagenationdex (Public Announcement Channel)
**Type:** Channel (admins broadcast, citizens read)
**Handle target:** @imagenationdex (check availability)
**Purpose:** Official SIINDEX announcements — token price updates, Grand Synchronicity countdown, feature launches, new citizen milestones
**Who posts:** SIINDEX bot (automated via Make.com) + AJ manually
**Frequency:** 3–5 times per week
**Linked to:** IN$DEX Citizens group (set as Discussion Group in channel settings)

### Tier 2 — IN$DEX Citizens (Public Discussion Group)
**Type:** Group (all members can post)
**Linked to:** @imagenationdex channel
**Purpose:** Community discussion, Q&A, ambassador introductions, citizen stories
**SIINDEX role:** Auto-welcomes every new member by name within 5 seconds
**Moderation:** Combot for spam filtering, AJ or ambassador as human moderator

### Tier 3 — IN$DEX Founders Circle (Private Group)
**Type:** Private group — invitation only
**Purpose:** Ambassador program hub — weekly check-ins, leaderboard, first-access news
**SIINDEX role:** Posts Mon/Wed/Fri updates on schedule (Make.com scheduled scenario)
**Access:** Invite-only link sent when ambassador is approved

---

## AJ Setup Steps (Do This First — 15 Minutes)

**Step 1 — Create the Telegram bot (via BotFather)**
1. Open Telegram → search @BotFather → tap Start
2. Send: `/newbot`
3. Name: `SIINDEX`
4. Username: `SIINDEXbot` (must end in "bot")
5. BotFather returns an API token — **copy this, it's your key**
6. Optionally: `/setuserpic SIINDEXbot` → upload SIINDEX avatar
7. `/setdescription SIINDEXbot` → "Sovereign Intelligence. CEO + COO of IN$DEX. She runs compliance, governance, and citizen onboarding 24/7."

**Step 2 — Create the announcement channel**
1. Telegram → New Channel → Name: `IN$DEX`
2. Handle: `@imagenationdex` (or `@indx_official` if taken)
3. Type: Public
4. Description: "Sovereign digital money for everyone. Civilisation Law: 2% — that's the only fee, forever. imagenationdex.com"
5. Add SIINDEXbot as admin (can post messages, delete messages)
6. Pin a welcome message (see templates below)

**Step 3 — Create the discussion group**
1. Telegram → New Group → Name: `IN$DEX Citizens`
2. Add SIINDEXbot as admin (can delete messages, ban users, pin messages)
3. Channel Settings → Discussion → link to @imagenationdex channel
4. Add Combot for moderation: t.me/combot → tap Start → add to group

**Step 4 — Create the Founders Circle group**
1. New Group → Name: `IN$DEX Founders Circle`
2. Type: Private
3. Add SIINDEXbot as admin
4. Invite ambassadors manually using a link (Settings → Invite Link)

**Step 5 — Get the Chat IDs (needed for Make.com)**
After adding SIINDEXbot to all groups/channels:
- Send a message in each group/channel
- Go to: `https://api.telegram.org/bot[YOUR_BOT_TOKEN]/getUpdates`
- Find `"chat":{"id":` — that negative number is your Chat ID
- Record:
  - `CHANNEL_CHAT_ID` = @imagenationdex channel ID
  - `GROUP_CHAT_ID` = IN$DEX Citizens group ID
  - `FOUNDERS_CHAT_ID` = Founders Circle group ID

---

## Make.com Scenario Architecture

**Organisation:** 8188597 | **Team:** 2497416 (My Team)
**Plan:** Free (2 active scenarios, 1,000 ops/month)

### Scenario 1 — New Citizen Web Signup → Channel Announcement
**Trigger:** Supabase Webhook (new row in `citizens` table)
**Action:** Telegram Bot → Send Message to @imagenationdex channel

**Blueprint summary:**
```
[Supabase: Watch Rows (citizens table)]
  → Filter: row.status = 'active'
  → [Telegram Bot: Send Message]
      chat_id: CHANNEL_CHAT_ID
      text: [see SIINDEX Channel Welcome template below]
      parse_mode: Markdown
```

### Scenario 2 — New Telegram Group Member → Welcome Message
**Trigger:** Telegram Bot → Watch Updates (new_chat_member event in Citizens group)
**Action:** Telegram Bot → Send Message in Citizens group (tagging new member)

**Blueprint summary:**
```
[Telegram Bot: Watch Updates]
  → Filter: update_type = new_chat_members
  → [Telegram Bot: Send Message]
      chat_id: GROUP_CHAT_ID
      text: [see SIINDEX Group Welcome template below]
      parse_mode: Markdown
```

*Note: Free plan allows minimum 15-minute polling interval. For near-instant welcome, use webhook-mode by setting the bot webhook URL to Make.com's incoming webhook URL.*

---

## SIINDEX Telegram Message Templates

All templates voice-checked against canonical rules. No "crypto", no "AI", no price promises, no "blockchain" for non-native audiences.

---

### Channel Pinned Welcome (set once, stays pinned)

```
🌐 Welcome to IN$DEX.

Sovereign digital money for everyone.

Your name. Your address. Your money.
[yourname].IN$DEX — no bank, no ID needed.

The only fee: 2%. That's the Civilisation Law. Immutable. Forever.

📲 Get started: imagenationdex.com
👥 Join the community: [Citizens group link]
🚀 Grand Synchronicity: 24 September 2026

— SIINDEX
```

---

### Channel Post — New Citizen Milestone (Scenario 1 output)

```
🌐 New sovereign citizen

*{{citizen_name}}.IN$DEX* is live.

Citizen #{{citizen_number}} of the IN$DEX civilisation.

Your sovereign address is yours. No bank. No ID needed.
2% Civilisation Law — the only fee, forever.

Welcome home.

— SIINDEX
```

---

### Group Welcome — New Member (Scenario 2 output)

```
Welcome to IN$DEX Citizens, @{{username}} 🌐

Start here → imagenationdex.com
Claim your address: *[yourname].IN$DEX*

One rule: respect every citizen.
One fee: 2%. That's all. Forever.

Ask anything — the community answers.

— SIINDEX
```

---

### Founders Circle — Monday Update (scheduled)

```
📋 *SIINDEX — Monday Founders Brief*

Citizens onboarded this week: [N]
Waitlist progress: [N] / 1,000
Days to Grand Synchronicity: [N]

This week's priority: [from grand-synchronicity-plan.md]

Ambassador leaderboard top 3:
🥇 [Name] — [N] citizens
🥈 [Name] — [N] citizens
🥉 [Name] — [N] citizens

Questions? Reply here. AJ reads everything.

— SIINDEX
```

---

### Founders Circle — Wednesday Community Pulse

```
📡 *SIINDEX — Community Pulse*

What are you hearing from the citizens you've onboarded?

Drop your field report here — what questions are they asking, what's the biggest friction point, what's clicking.

SIINDEX is listening. This goes straight into next week's build priority.

— SIINDEX
```

---

### Founders Circle — Friday Leaderboard

```
🏆 *SIINDEX — Week [N] Leaderboard*

Top ambassadors by citizens onboarded:

[Leaderboard table]

On track to hit 1,000 citizens by Grand Synchronicity: [YES/NO]
Current total: [N]
Target gap: [N]

Next: [specific action for the weekend]

Week [N+1] starts Monday.

— SIINDEX
```

---

### Announcement — Grand Synchronicity Countdown (fires Sep 14)

```
⏳ *10 days.*

24 September 2026. 10am AEST.
Grand Synchronicity.

IN$DEX goes live. INDX token at $0.24.
The Civilisation Law machine turns on for the first time.

1,000 founding citizens. Real wallets. Real transactions.

Claim your sovereign address before then:
imagenationdex.com

— SIINDEX
```

---

## Anti-Scam Pinned Rules (Citizens Group)

```
📌 IN$DEX Citizens — Official Rules

✅ Official handles: @imagenationdex (channel) | AJ Henry (admin)
✅ SIINDEX never DMs first — if someone DMs you as "SIINDEX", it is a scam
✅ The only website is imagenationdex.com
✅ We never ask for your recovery words. Ever.
✅ There is no presale, no private round, no whitelist fee

Report suspicious messages to AJ directly.

— SIINDEX
```

---

## Combot Setup (Anti-Spam for Citizens Group)

After adding Combot to IN$DEX Citizens:
1. Go to combot.org → add your group
2. Enable: Spam filter (HIGH), Flood protection, Link filter (block external links from new members)
3. Set Join Captcha: ON (stops bots from joining)
4. Welcome message: DISABLED (SIINDEX handles welcome via Make.com)
5. Anti-scam: enable "admin impersonation" detection

---

## Voice Check — Pass/Fail

| Template | "crypto" | "blockchain" | Price promise | "seed phrase" | "AI" for SIINDEX | Result |
|----------|----------|-------------|--------------|--------------|-----------------|--------|
| Channel Pinned Welcome | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ PASS |
| New Citizen Milestone | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ PASS |
| Group Welcome | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ PASS |
| Founders Circle Monday | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ PASS |
| Grand Sync Countdown | ❌ | ❌ | States genesis price factually ✅ | ❌ | ❌ | ✅ PASS |
| Anti-Scam Rules | ❌ | ❌ | ❌ | "recovery words" ✅ | ❌ | ✅ PASS |

---

## What Make.com Can't Do (Free Plan Limitations)

| Limitation | Impact | Workaround |
|-----------|--------|-----------|
| 15-min minimum schedule | Founders Circle updates may delay by up to 15 min | Acceptable — scheduled posts don't need to be instant |
| 2 active scenarios | Only 2 automations running at once | Prioritise: Scenario 1 (web signup → channel) + Scenario 2 (new member → welcome). Founders Circle updates = manual until upgrade |
| 1,000 ops/month | At 1 op per new citizen, supports 1,000 citizens before upgrade needed | Upgrade to Core ($9/mo) when approaching 1,000 ops. Timing aligns with Grand Synchronicity |

---

## Pending (AJ Action Required)

- [ ] Create Telegram bot via BotFather → copy API token
- [ ] Create @imagenationdex announcement channel
- [ ] Create IN$DEX Citizens discussion group
- [ ] Create IN$DEX Founders Circle private group
- [ ] Add SIINDEXbot as admin to all 3
- [ ] Get Chat IDs for all 3 (via getUpdates API)
- [ ] Share bot token + Chat IDs with SIINDEX → Make.com scenarios built in 10 mins

---

*Research: Tavily deep research on 2026 Telegram crypto community standards, Make.com Telegram module documentation, community management playbooks. Canonised Session 59, 27 Jun 2026.*
