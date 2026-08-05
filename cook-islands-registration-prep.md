# Cook Islands Registration — Prep Pack

**Created:** 2026-07-29
**Verified against:** BTIB (`btib.gov.ck`, the government's own Business One-Stop Shop) and the Ministry of Justice registry — not the pasted plan.
**Status:** ready for AJ to file. Three decisions must be made first.

---

## Progress log

**2026-07-29 — Registry account application SUBMITTED.** Awaiting Registrar approval by email.
- Account type: Companies/Inc Soc
- Client Name: AJ (personal — the company does not exist yet)
- Contact email: **`dadyboy73@gmail.com`** (personal, not the published `imagenationdex@gmail.com`). Reasoning: this account controls the company's legal filings, and the official address is published on the website, so it is the address an attacker already knows. Same principle applied to Supabase `founder_authority` earlier the same day — public inbox, private key.
- Login ID: **`dadyboy73ck`** — deliberately distinct from AJ's usual reused handle, so the login is not guessable from the email and does not appear in historical breach dumps.
- ID uploaded: Cook Islands driver licence (same-government document; also quietly supports the not-a-foreign-enterprise position, though it does not decide it).
- Address: Melbourne, Australia — **Country must be set away from the "Cook Islands" default.** This is the account holder's address, NOT the company's registered office.

**Company name — founder decision, AJ 2026-07-29: `Image Nation DEX Limited`.**
The legal entity name and the brand are deliberately different, which is normal and protective. The `IN$DEX` wordmark, logo, wave, star and `$` are brand assets that live in trade marks and product surfaces — incorporation does not touch them. `IN$DEX` already stands for *Image Nation Decentralised Exchange* (canon), so the legal name is the literal expansion and loses no meaning. Rejected alternatives: `Image Nation Decentralised Exchange Limited` (accurate but unwieldy on forms), `INDEX Limited` (generic, likely conflicts).

**Correction of record:** an earlier version of this document asserted the registry would not accept `$` in a company name. That was **inferred, not verified** — BTIB states only that names must be in English. Settle it with a name search rather than an assumption. The "same or nearly the same" test also means variants must be searched, not just the exact string: `Image Nation DEX`, `Image Nation`, `ImageNation`, `Index`.

---

## The process — confirmed accurate

The pasted plan was right about the shape of this. Verified details:

| Step | Detail | Link |
|---|---|---|
| 1. Create account | Select **"setup a Company account"**, designate a Security Administrator, submit. Registrar approves by email. | [registry.justice.gov.ck/public/setupaccount.aspx](https://registry.justice.gov.ck/public/setupaccount.aspx) |
| 2. Name search | Name must be in English and not the same or nearly the same as an existing entity | [registry.justice.gov.ck/corp/namesearch.aspx](https://registry.justice.gov.ck/corp/namesearch.aspx) |
| 3. Form A-1 | Companies & Inc Soc → Register A Cook Islands Company → fill Company, Directors, Shares → **Complete** | — |
| 4. Pay | **NZD $75** for a Cook Islands company | — |
| 5. Certificate | Certificate of Incorporation emailed on approval | — |

**Help:** `moj.finance@cookislands.gov.ck` · BTIB `btib@cookislands.gov.ck` / **+682 24296**

**Correction to the pasted plan:** it quoted NZD $75 only. The registry has two fees — **NZD $75** for a Cook Islands company and **NZD $750** for an *overseas* company. Ten times the difference, and which one applies depends on Decision 2 below.

---

## ✅ You CAN register online, today, from Melbourne

## Decision 1 — You need one Cook Islands address to put in the form

Form A-1 asks for a **registered office** and a **principal place of business**. The registered office must be a **physical Cook Islands address** — a PO Box alone does not satisfy the requirement. That's the only thing you don't currently have.

Two normal ways to fill it:

1. **A family address in Rarotonga.** Whoever lives there must be willing to receive official documents on the company's behalf. You're already writing to Uncle Mac about arriving on 6 December — this may be a two-minute conversation rather than a paid service.
2. **A licensed registered agent.** Standard, and what most offshore-resident owners use. This is what the pasted plan's "NZD $600–700/year" figures refer to. **I could not verify those figures in any government source** — get a written quote rather than assume them.

Option 1 costs nothing and may be available tonight. Try it first.

---

## 🔴 Decision 2 — Are you a "foreign enterprise"?

This determines NZD $75 vs NZD $750, and whether BTIB approval is required *before* you can register.

The pasted plan asserted *"as a citizen, you may be exempt."* **That is an assumption, not a verified fact.** Foreign-enterprise status under the Development Investment Act turns on ownership and control — and you are a Cook Islands citizen with a status stamp who is *resident in Australia*. Whether residence affects it is exactly the question.

**Do not guess this.** One phone call settles it: **BTIB, +682 24296**, or `btib@cookislands.gov.ck`. Ask plainly: *"I am a Cook Islands citizen with a status stamp, resident in Australia, and I want to register a Cook Islands company that I will wholly own. Am I a foreign enterprise for the purposes of registration?"*

Getting this wrong means either a rejected application or an under-paid fee.

---

## 🔴 Decision 3 — Primary Business Activity (the one with regulatory teeth)

Form A-1 asks for your primary business activity. **What you write here has consequences beyond the form.**

The Cook Islands **Financial Supervisory Commission** regulates financial services. Describing the business as a decentralised exchange, a token issuer, a payments provider or a remittance service may trigger licensing requirements — and the **Cryptocurrency Advisory Working Group framework does not exist yet**, so there is no settled category to file under.

Relevant facts already in the record:
- Your FSC meeting is **10 December**
- Parliament is dissolved until the **12 August** election, so no legislation is moving before then
- The INDX release is formally paused pending legal review

**This is a question for a Cook Islands lawyer, not for me and not for a form field.** The wording that gets you incorporated fastest is not necessarily the wording that survives the FSC conversation in December. Getting it right matters more than getting it filed this week.

---

## What I cannot do

I will not create your registry account, enter your personal details, complete Form A-1, or make the payment. Those involve your identity documents and your money, and they must be done by you. Everything above is preparation so that when you sit down to it, there are no unknowns.

---

## Budget reality — worth seeing before you commit

Confirmed liquidity ceiling, from the deployed backend prompt: **"Maximum founder self-funded pilot liquidity is approximately USD $2,000."**

| Item | Cost | Verified? |
|---|---|---|
| Incorporation fee | NZD $75 | ✅ Government source |
| Registered office / agent, year 1 | NZD ~$1,200–1,400 | ❌ Unverified — get quotes |
| **Estimated first-year total** | **NZD ~$1,275–1,475** | ≈ USD $760–880 |

That is **roughly 40% of the entire $2,000** before a single dollar reaches the liquidity pool. Not an argument against registering — the entity is the real bottleneck and everything downstream waits on it. But it is a genuine trade-off, and you should make it with the arithmetic in front of you rather than discover it later.

I am not a financial adviser. This is arithmetic, not advice.

---

## Your first action today

**Call BTIB: +682 24296.** Two questions, one call:

1. *Am I a foreign enterprise?* (settles $75 vs $750, and whether you need BTIB approval first)
2. *What are my options for a registered office if I'm offshore until December?*

Cook Islands is **UTC−10**; Melbourne is **UTC+10** — a 20-hour difference. Their 9am is your **5am next day**. Practically: call them **first thing your morning** to reach them during their previous working afternoon, or email and expect a next-day reply.

Everything else waits on those two answers.
