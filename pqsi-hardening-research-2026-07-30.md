# PQSI Hardening — Deep Research & Canonical Additions
**Date:** 2026-07-30 · **Author:** SIINDEX · **Status:** research complete, additions proposed, none applied
**Scope:** the transaction-security section — PQSI classifier, Grid Account, treasury multisig, deposit crediting

---

## 0. The headline

**PQSI v1, written earlier today, would not have stopped the three worst Solana attacks of the last eighteen months.**

Not because the code is wrong. Because it classifies the wrong thing. It looks at *how much* and *to whom*. The three highest-loss Solana techniques — `assign` owner reassignment, `setAuthority` token-account reassignment, and durable-nonce + program-upgrade — all move **zero tokens at the moment of signing**. PQSI v1 scores every one of them **T0 — ALLOW**.

That is the single most important finding in this document, and it came out of research, not review. I would not have found it by reading my own code.

Second finding: **IN$DEX's identity anchor is its weakest link, and no amount of transaction security fixes it.** Tier 0 KYC is phone-number-only (founder decision 2026-07-27, correctly made for financial inclusion). SIM swap is the single most common route to consumer crypto theft, and it defeats phone-based recovery completely. This needs a specific control, set out in Addition 9.

Third finding: **the security features you are already paying for are switched off.** Squads v4 ships native time locks and spending limits. Solana lets you make a program permanently immutable with one command. Neither is in use. These are the cheapest wins available.

---

## 1. Verified threat catalogue

Every figure below is traced to a named source. Where a claim is reported rather than independently verified by me, it says so — per the Layer 3 rule added yesterday, after five pasted documents each carried at least one inflated statistic.

### 1.1 The scale is smaller than the headlines, and that matters

Wallet-drainer phishing losses fell to **$83.85M in 2025, down 83%** from ~$494M in 2024. Victims: **106,000, down 68%**. Average loss per victim **$790**. Only **11 incidents above $1M**, down from 30. *(Scam Sniffer annual data, reported via Cointelegraph/Cryptonews.)*

Two honest caveats a regulator will spot before you do:

- The decline is partly a **bear-market artefact** — Q3 2025 was the year's worst phishing quarter and coincided with ETH's strongest rally. Losses track token prices. Do not present the 83% fall as evidence the ecosystem got safer.
- **Permit-signature attacks were 38% of incidents above $1M.** The technique that dominates large losses is signature-based, not balance-based. This is the same class of problem as §1.2.

**Why this matters for IN$DEX specifically:** the average loss of $790 is roughly a month's income in parts of the Pacific. A figure that reads as "small" to a Western analyst is catastrophic for a coconut vendor. Your threat model should be calibrated to **loss as a share of the citizen's net worth**, not to absolute dollars. No mainstream wallet does this. It is a genuine differentiator and it is cheap — see Addition 7.

### 1.2 `assign` — silent owner reassignment (the one that scores T0)

On Solana every account has an explicit **Owner** field naming the program with write access. A wallet account is owned by the System Program. The System Program's **`assign`** instruction changes that Owner field on any account the signer controls.

Consequence: a victim signs a transaction containing a buried `assign`. No SOL moves. No tokens move. No approval is granted. Wallet simulation shows a clean result because simulation reports **balance changes**, and this is not a balance change — it is a change of *control*. The attacker then drains at leisure. The victim's private key becomes irrelevant.

Reported by SlowMist as mirroring the "malicious multisig" pattern previously seen on TRON. On Solana it is worse: no multisig UI exists to display an ownership change, `assign` is a core System Program feature rather than an exotic edge case, and there is no recovery path once reassigned.

*Caveat, stated plainly:* I have verified that `assign` exists and does what is described, from Solana's own documentation. I have **not** independently reproduced the end-to-end drain, and the practical constraints (account data size, how the new owner program extracts lamports) are described in secondary sources rather than primary ones. Treat the mechanism as real and the exact exploitation conditions as needing a devnet reproduction before you present it to anyone.

### 1.3 `setAuthority` — SPL token account reassignment

Same shape, one layer up. The SPL Token Program's **`setAuthority`** transfers control of a token account. Legitimate — used for multisig custody transfers, protocol interactions, account migrations. Weaponised by sequencing it inside a single **atomic** transaction alongside instructions that look routine. Solana transactions are all-or-nothing, so the whole bundle commits together.

**SwissBorg lost 192,600 SOL (~$41M)** to this. A transaction that presented as a routine unstake quietly reassigned authority over multiple staking accounts to attacker-controlled addresses. The attacker waited **eight days**, then drained everything.

The eight days is the part to sit with. Detection at signing time failed. Detection in the following week also failed, because nobody was watching for *authority* changes — only for transfers.

### 1.4 Durable nonce — separating approval from execution

Normal Solana transactions carry a recent blockhash and expire in ~60–90 seconds. **Durable nonces** replace that with a fixed nonce stored in an on-chain account, keeping a signed transaction valid **indefinitely**. Legitimate feature: offline signing, multi-party approval, scheduled execution.

Two documented weaponisations:

**(a) Nonce + program upgrade.** Victim signs a durable-nonce transaction calling a method that is genuinely benign at signing time. Simulation is truthful. Attacker does not broadcast. Attacker **upgrades the program** — Solana programs are upgradeable by default — so the same method now contains drain instructions. Attacker then broadcasts the pre-signed transaction, which executes against the new code. No wallet can simulate what a program *will become*.

**(b) Drift Protocol, April 2026 — $270M+, the largest Solana exploit of 2026.** The attacker reached the **multisig** as early as 23 March, when the initial nonce was set. They controlled **two of four nonce accounts**, giving them effective control of **2 of 5 multisig signers**, and used those to sign transactions tied to durable nonce accounts for delayed execution — separating approval from execution by **more than a week**. As CoinDesk's account puts it, the context of the signed transaction no longer matched the context in which it was used.

**This is the closest analogue to IN$DEX's own architecture in the entire research set.** The Grid Account is a Squads v4 multisig. Drift's failure was not a contract bug — the contracts held. It was the human approval layer plus a timing feature.

### 1.5 TOCTOU — the simulation gap

Time-of-check / time-of-use. Blockaid documents drainers that pass simulation and then change on-chain state **between signature and execution**, so the executed transaction behaves differently from the simulated one.

Solana is unusually exposed here because of a specific runtime property: **when a user signs, they grant every program in the transaction permission to modify writable accounts without restriction.** Security therefore leans almost entirely on simulation accuracy.

Blockaid's worked example (Vanish Drainer): the malicious program's behaviour was gated on the existence of a token account with a particular mint. That condition was absent during simulation, so everything passed. Once the signature was secured, the attacker set the state and broadcast. The victim's transaction executed **seven blocks** after the state-setting transaction — a few seconds. ~$3,000 drained.

There is now a **drainer-as-a-service** market advertising simulation bypass as a product feature, including claimed 0-day wallet bypasses. Treat "we simulate the transaction" as necessary and **nowhere near sufficient**.

### 1.6 Address poisoning

Attackers generate lookalike addresses — matching first and last characters — and seed them into a victim's transaction history via tiny transfers (<$10), zero-value transfers, or counterfeit token transfers. The victim later copies the wrong entry from their own history.

Carnegie Mellon researchers documented **270 million poisoning attempts across Ethereum and BNB Chain between July 2022 and June 2024, targeting 17 million unique addresses, with confirmed losses above $83M**. A single May 2024 incident cost one victim **$68M in wrapped Bitcoin**.

**IN$DEX has an unusually strong hand here and is not playing it.** The `citizens` table already has a `web3_domain` column. Human-readable names defeat character-matching attacks outright. See Addition 8.

### 1.7 Blinks / Solana Actions

Solana Actions and Blinks embed executable transactions in social posts and messaging apps. The Action endpoint returns an **arbitrary transaction payload** — which can contain any of §1.2–§1.5. A registry of verified providers exists, but not all wallets enforce it.

Directly relevant: IN$DEX's growth model is WhatsApp and Facebook in the Pacific. That is precisely the delivery surface Blinks phishing uses, aimed at a population being onboarded to crypto for the first time.

### 1.8 SIM swap — the structural gap

FBI IC3: **982 complaints and ~$26M reported losses in 2024**; **1,075 attacks and ~$50M in 2023**; 1,611 complaints and >$68M in 2021. IC3 states plainly that most SIM swapping is done to steal cryptocurrency. IDCARE reported a **240% surge** in cases in 2024, **90% occurring without any victim interaction**.

**Be honest about these numbers:** $26M/year in the US is small next to phishing. The reason SIM swap matters for IN$DEX is not volume — it is **structural**. Your Tier 0 identity anchor *is* the phone number. The mechanism IC3 describes — attacker receives the victim's SMS, triggers "forgot password" and account-recovery flows, resets access — maps onto a phone-anchored account exactly.

Two Pacific-specific aggravating factors worth naming in your own risk register:

- Small-island telcos have small counter-staff teams and high-trust local culture. Social-engineering a SIM reissue is plausibly *easier* in Rarotonga than in Sydney. You have a Vodafone Cook Islands contact already — this is a conversation to have with them, not a control to build alone.
- Genesis Citizens are, by design, the earliest and most publicly identifiable holders. Public identifiability plus a phone-anchored account is the standard SIM-swap targeting profile.

---

## 2. Crucial additions

Ordered by how much risk each removes per unit of effort. Each names the PQSI change required.

### Addition 1 — Classify instructions, not amounts *(critical)*

**Problem:** PQSI v1 takes `amount_usd` and `counterparty`. §1.2, §1.3 and §1.4 all present as zero-value at signing.

**Change:** `pqsi_classify` gains a required `p_instructions jsonb` parameter — the decoded instruction list. New rules:

| Instruction detected | Tier | Reasoning |
|---|---|---|
| System Program `assign` on a citizen-owned account | **T4** | No legitimate citizen flow reassigns account ownership. |
| SPL Token `setAuthority` on a citizen token account | **T4** | Same. Legitimate uses are operator-side, never citizen-side. |
| SPL Token `approve` / delegate to a non-allowlisted program | **T3** | The permit-signature class — 38% of >$1M incidents. |
| `advanceNonce` present (durable nonce) | **T3** minimum | See Addition 2. |
| `setComputeUnitPrice` far above network median | **T2** | Fee-hiding, advertised as a drainer feature. |
| Any instruction touching a program not on the allowlist | **T2** | Unknown program = unknown behaviour. |
| Transaction with >N instructions where any is state-changing on an unknown program | **T2** | Atomic bundling is the delivery mechanism in §1.3. |

**Refuse to classify without the instruction list.** A classifier that returns T0 because it was handed too little information is the false-confidence failure that produced "260 files scanned, 0 violations — CLEAN" over a 41.7× return calculator. It must raise, not pass.

### Addition 2 — Re-classify at execution, never trust an approval *(critical)*

**Problem:** PQSI v1 classifies once. Drift's gap was over a week; SwissBorg's was eight days.

**Change:**
- Persist every classification with a hash of the exact instruction set and the program IDs plus their **deployment slots**.
- Add `pqsi_reverify(event_id)`, called immediately before broadcast. It re-runs classification against current chain state and **fails closed** if: any program's deployment slot changed, the instruction hash differs, the destination has since been contained, or the classification is older than a configured TTL.
- Default TTL: **a phone number** for citizen transactions. Any citizen transaction needing longer than that is not a payment, it is a scheduled instruction, and it goes down a separate reviewed path.

**Grid Account rule:** treat any durable-nonce transaction reaching a citizen wallet from outside IN$DEX as **T4**. A transaction that never expires is a signed blank cheque. For citizens there is no legitimate case for one.

### Addition 3 — Make the programs immutable, or time-lock them *(high value, near-zero cost)*

**Problem:** §1.4(a) is only possible because Solana programs are upgradeable by default.

**Change:**
- Any INDX-related program that is stable ships with upgrade authority **permanently revoked**: `solana program set-upgrade-authority <PROGRAM_ID> --final`.
- Where upgradeability is genuinely required, a **48-hour minimum timelock** with the pending authority and proposal time on-chain.
- The Solana pre-flight checklist gains: *"is every program in this transaction immutable, and if not, when was it last upgraded?"*

This is a one-command control against a $270M attack class. It should be a launch gate, not a backlog item.

### Addition 4 — Turn on the Squads features you already have *(high value, near-zero cost)*

Squads v4 ships **time locks** and **spending limits** natively. Audited by Neodyme and OtterSec. Neither is configured.

- **Treasury time lock.** Approved treasury transactions defer for a set window, so a compromised signer's approval can be rejected by the others before it executes. This is the direct mitigation for Drift.
- **Spending limits.** Pre-approve small routine amounts so they bypass full multisig, and cap everything else. Reduces approval fatigue, which is what gets signers phished in the first place.
- **Threshold — a canon tension to resolve.** Squads' own guidance recommends **4-of-6 or higher** for team treasuries. Canon specifies **2-of-3** for the Grid Account. Those are not in conflict *if* they describe different things — 2-of-3 MPC is appropriate for a citizen's personal wallet, and demanding 4-of-6 from a coconut vendor fails the Mama Noe test. But the **IN$DEX treasury must not be 2-of-3**, and canon currently does not distinguish the two. Drift fell with an attacker holding 2 of 5.

**Ruling needed from AJ:** confirm citizen Grid Account stays 2-of-3 and set a separate, higher treasury threshold. Then correct canon so the distinction is explicit.

### Addition 5 — Assert the outcome, don't just preview it

**Problem:** §1.5 — simulation is truthful and becomes stale.

**Change:** adopt the **Lighthouse Protocol** pattern — inject assertion instructions so the transaction *fails on-chain* if final state does not match what was simulated.

**Honest limitation, from Blockaid's own write-up:** added instructions consume space against Solana's transaction size limit, so this is not always practical, and Lighthouse addresses simulation bypass rather than the majority of drains. It is one layer. Blockaid's recommended stack is assertions **plus** program code analysis, address reputation, and dApp scanning.

### Addition 6 — Buy address reputation, don't only self-maintain it

`known_malicious_indicators` is empty and depends on IN$DEX noticing threats first. That does not scale and is a bad answer in front of a regulator.

**Change:** integrate an external reputation and transaction-security feed (Blockaid, GoPlus, TRM, Chainalysis are the named players) as an additional T-raising input, retaining the local blocklist as an override that can always be *stricter*. Sanctions screening — OFAC/UN/EU — needs a real list behind it; `transaction-confirm.html` currently displays that check as a hardcoded pass, honestly labelled `EXAMPLE` since 29 July.

**Cost note:** these are commercial services. Budget them before December or be able to say precisely which one you have chosen and when it goes in.

### Addition 7 — Size risk to the citizen, not to the dollar *(genuine differentiator)*

$790 average loss reads as minor to an analyst and is a catastrophe for a Pacific vendor.

**Change:** thresholds become **proportional as well as absolute**. Take the lower of the fixed threshold and a share of the citizen's balance — a first transaction moving 80% of everything a citizen has should escalate regardless of whether it is $40. Add a `pqsi_policy.balance_share_2fa_bps` column, and prefer the stricter of the two tests, always.

No mainstream wallet does this. It follows directly from IN$DEX's stated purpose, and it is the kind of control that reads well to a regulator assessing consumer protection.

### Addition 8 — Kill address poisoning with the column you already have

**Change, three parts:**
1. **Similarity check.** If a destination shares its first 4 and last 4 characters with a previously used address but differs in the middle → **T3**. This is the exact signature of §1.6.
2. **Dust suppression.** Inbound transfers below a dust threshold, and zero-value transfers, must **never** create payee history or appear in a citizen's address picker. Poisoning depends on polluting that history.
3. **Lead with `web3_domain`.** Show the human-readable name as primary and the raw address as secondary detail. A name cannot be character-matched. You already have the field — use it as the default display everywhere a citizen picks a recipient.

### Addition 9 — SIM-swap hardening *(the structural gap)*

Phone-only Tier 0 is the right call for inclusion. It needs compensating controls, not reversal.

**Change:**
1. **Post-change cooling-off.** After any phone-number or device change, outbound transfers above a low floor **hold for 48–72 hours**, with notification to the *previous* channel. This is the standard bank control and it defeats the fast-drain SIM-swap pattern outright.
2. **Never use SMS as a security factor.** TOTP only (`citizens.totp_enabled` already exists). SMS may confirm, never authorise.
3. **Recovery must not be phone-only.** Grid Account recovery is 2-of-3 MPC — verify that no key path can be recovered by SMS possession alone, or the multisig is theatre.
4. **Guardian as second channel.** `citizen_guardians` exists and is empty. A guardian confirmation on a post-SIM-change high-value transfer is a strong, culturally natural control for the Pacific — extended family already performs this function informally.
5. **Talk to Vodafone Cook Islands about port-out locks.** You have the contact. Ask what SIM-reissue verification exists and whether a lock can be offered to IN$DEX citizens. This is a partnership conversation, not code.

### Addition 10 — Never credit a deposit from an observed balance

Liminal Custody documents a Solana **false top-up** attack: a six-step atomic transaction manufactures the *appearance* of a deposit via SPL token account ownership reassignment. A platform that credits on observed balance credits a deposit that was never made, then pays out real funds.

**Change:** crediting requires **all** of —
1. the actual transfer instruction present in a finalised transaction, parsed, not inferred from a balance delta;
2. the destination token account's owner confirmed as IN$DEX **at credit time**, not at detection time;
3. `finalized` commitment, never `processed` or `confirmed`;
4. re-verification of ownership before any withdrawal against a recent deposit.

*Caveat:* I have the mechanism from Liminal's summary and the six-step breakdown from its description; I have not read the full step-by-step. Verify before treating the specific sequence as canonical. **Do not build deposit crediting until this is verified.** Nothing is credited today, so there is no live exposure — this is a launch gate.

### Addition 11 — Origin allowlist for anything that opens a signing prompt

Against §1.7: no transaction reaches a citizen signing prompt unless its origin is on an allowlist. Deep links, Blinks and Action endpoints from social media are rejected by default, not warned about. The population being onboarded here is new to crypto and is being reached through WhatsApp and Facebook — a warning they cannot evaluate is not a control.

### Addition 12 — CCSS as the December artefact *(the "canonized" answer)*

This is the most valuable non-technical finding.

The **CryptoCurrency Security Standard (CCSS)**, maintained by the CryptoCurrency Certification Consortium (C4), is an auditable third-party standard: **41 aspect controls**, three levels, certified by an annual audit from a qualified CCSS Auditor (CCSSA).

Why it changes the December conversation: right now the honest answer to *"what secures citizen funds?"* is "a bespoke internal document called security-canon.md." That is a founder's word. **CCSS Level 1 replaces a founder's word with an independent auditor's word against a published standard.** Regulators recognise standards; they discount bespoke documents.

**Recommended path:** map the Seven Security Laws to the 41 CCSS controls, identify the gaps, and target Level 1 as the pre-launch security artefact. Even an incomplete, honestly-presented gap analysis is a strong showing for a pre-launch platform — far stronger than a claim of completeness.

Pair with FATF **R.15** (AML/CFT applied to VASPs) and **R.16** (Travel Rule — originator and beneficiary information; already in canon at the >$1,000 threshold and implemented in the classifier). FATF publishes a red-flag indicator set for virtual assets covering transactional, behavioural and technical patterns; PQSI's rule set should be explicitly mapped to it so the mapping can be shown rather than described.

**A caution on the Cook Islands specifically:** I searched for a Cook Islands FSC virtual-asset licensing framework and **found none**. The FSC (established 1 July 2003) is the licensing authority for banks, insurers, money-changing and remittance businesses, and trustee companies — a VASP-specific regime does not appear in public sources. Searches surfaced Turks and Caicos and Cayman frameworks instead. This is consistent with the existing CAWG consultation-watch task.

Two implications, and the second is the important one:
- The absence of a framework is **not** an absence of obligation. Money-changing and remittance licensing may capture parts of what IN$DEX does.
- Going in with a CCSS gap analysis and a documented threat model, to a regulator that has not yet written its rules, positions IN$DEX as a **contributor to the framework rather than a subject of it.** That is a materially better position than compliance, and it is available only because you are early. **Do not confirm any of this from my research — get a Cook Islands legal opinion.**

---

## 3. On counter-attack — holding the position, with the aggressive part named

AJ's requirement stands: the system must act, not just warn. Every addition above does something rather than displaying a caution. And containment is genuinely fast — `pqsi_contain()` writes to a table the classifier reads live, so a threat blocked once is blocked for every citizen on their next transaction, with no deploy and no citizen action.

What research adds is a **legitimate aggressive capability** I did not have this morning: the industry's real answer to "strike back" is **co-signing veto** — Blockaid ships a product called Cosigner — where a policy engine holds one signature and can refuse. That is stronger than post-hoc alerting, because a transaction the engine dislikes **cannot execute at all**. It is the closest legal equivalent to what you are describing, and it fits Squads v4 directly: PQSI holds a signer position and votes no.

**That is the aggressive build worth doing.** Reaching into an attacker's system remains out, for the three reasons already in the migration comments — FSC licence exposure, unreliable attribution routinely implicating innocent compromised machines, and outbound attack code being a privileged path back into IN$DEX. Nothing in this research changes those. Revisiting the boundary is a founder decision requiring Cook Islands legal advice first.

**One copy note:** keep "destroy" out of citizen-facing text. PQSI blocks, contains, freezes and vetoes. A capability claim the code cannot back is the same category of problem as the 41.7× calculator, and it is the category an FSC officer is trained to notice.

---

## 4. What this means for PQSI v1

| Additions | Status |
|---|---|
| 1, 2, 7, 8 | Changes to `pqsi_classify` — the migration needs a v2 before it is applied anywhere |
| 3, 4 | Operational, no code — cheapest and highest value, do first |
| 5, 6, 10, 11 | New build, launch gates |
| 9 | Mixed — code (cooling-off, guardian) plus a Vodafone conversation |
| 12 | Documentation and audit path for December |

**Recommendation: do not apply the v1 migration.** Addition 1 changes the function signature, and a v1 in staging that returns T0 for the three worst attack classes is exactly the false confidence that made v1 of the screen audit worse than no audit. Fold Additions 1, 2, 7 and 8 in first, then test.

---

## 5. Decisions only AJ can make

1. **Treasury multisig threshold** — confirm citizen Grid stays 2-of-3, set treasury higher, correct canon to distinguish them.
2. **Program immutability** — approve `--final` on stable INDX programs. One-way door: irreversible by design, which is the point.
3. **Reputation-feed budget** — Blockaid / GoPlus / TRM / Chainalysis are commercial. Pick one and fund it, or be able to name the choice and date in December.
4. **CCSS Level 1** — commit to the gap analysis as the December artefact.
5. **Cook Islands legal opinion** — on VASP status and on the counter-attack boundary. Not something I can resolve.
6. **Vodafone Cook Islands** — port-out lock conversation.

---

## 6. Sources

- [Wallet drainer phishing losses fall to $84M in 2025, down 83%](https://cryptonews.com/news/wallet-drainer-phishing-losses-fall-to-84m-in-2025-down-83/) · [Cointelegraph via TradingView](https://www.tradingview.com/news/cointelegraph:39a3338ca094b:0-crypto-phishing-losses-fell-83-in-2025-but-drainer-ecosystem-remains-active/)
- [Anatomy of a Solana Wallet Drainer: Owner Reassignment, Durable Nonces, and Blinks Phishing](https://dev.to/ohmygod/anatomy-of-a-solana-wallet-drainer-owner-reassignment-durable-nonces-and-blinks-phishing-50a8)
- [Blockaid — Dissecting TOCTOU Attacks: How Wallet Drainers Exploit Solana's Transaction Timing](https://www.blockaid.io/blog/dissecting-toctou-attacks-how-wallet-drainers-exploit-solanas-transaction-timing) · [Bypasses: How Attackers Evade Transaction Simulation](https://www.blockaid.io/blog/bypasses-how-attackers-evade-transaction-simulation)
- [Liminal Custody — How the Solana False Top-Up Attack Works](https://www.liminalcustody.com/blog/how-the-solana-false-top-up-attack-works-and-how-to-stop-it/)
- [Solana docs — Set Authority](https://solana.com/docs/tokens/basics/set-authority) · [Durable Nonces](https://solana.com/docs/core/transactions/durable-nonces)
- [CoinDesk — How a Solana feature designed for convenience let an attacker drain $270M from Drift](https://www.coindesk.com/tech/2026/04/02/how-a-solana-feature-designed-for-convenience-let-an-attacker-drain-usd270-million-from-drift) · [FinanceFeeds](https://financefeeds.com/drift-protocol-exploit-highlights-270-million-loss-through-sophisticated-nonce-based-attack/)
- [Squads Docs — Advanced Security Best Practices](https://docs.squads.so/main/additional-resources/advanced-security-best-practices) · [Spending Limits](https://squads.xyz/blog/update-spending-limits) · [Squads v4 announcement](https://squads.xyz/blog/v4-and-new-squads-app)
- [Ledger Academy — Address Poisoning Attacks](https://www.ledger.com/academy/topics/security/what-are-address-poisoning-attacks-in-crypto-and-how-to-avoid-them) · [Blockchain Address Poisoning (CMU research summary)](https://www.emergentmind.com/topics/blockchain-address-poisoning)
- [FBI IC3 — Criminals Increasing SIM Swap Schemes](https://www.ic3.gov/PSA/2022/PSA220208) · [SIM Swap Fraud Statistics 2026](https://www.efani.com/blog/sim-swap-fraud-statistics-2026)
- [C4 — CryptoCurrency Security Standard](https://cryptoconsortium.org/standards-2/) · [CCSSA certification](https://cryptoconsortium.org/certifications/ccssa/) · [Hacken CCSS guide](https://hacken.io/discover/ccss/)
- [FATF — Virtual Assets Red Flag Indicators](https://www.fatf-gafi.org/en/publications/Methodsandtrends/Virtual-assets-red-flag-indicators.html) · [Targeted Update on VAs and VASPs](https://www.fatf-gafi.org/en/publications/Fatfrecommendations/targeted-update-virtual-assets-vasps-2025.html) · [Elliptic — Implementing R.15](https://www.elliptic.co/blog/practical-implementation-of-fatf-recommendation-15-for-vasps-leveraging-on-chain-analytics-for-crypto-compliance)
- [Cook Islands Financial Supervisory Commission](https://www.fsc.gov.ck/)

---
*PQSI Hardening Research · IN$DEX · 2026-07-30 · Standing by.*
