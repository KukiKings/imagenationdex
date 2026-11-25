---
name: solana-mobile-wallet-status
description: "SOLANA-MOBILE-WALLET-STATUS — read-only, tier 1. Reports the current readiness of mobile wallet paths (Samsung Wallet, Seeker, Mobile Wallet Adapter, Android PWA) for a SIINDEX citizen to use Solana USDC without managing keys or SOL, against primary sources. Returns supported, not supported or cannot be confirmed for every item, with the source and the date checked. Skeptic by default. Returns the report only to SIINDEX; it never writes a file, sends a message or changes another skill."
version: "1.0.0"
---

# Solana Mobile Wallet Status (read-only)

Tier: 1 (read-only).

Purpose: report the current readiness of mobile wallet options (the Samsung Wallet model, Seeker, Mobile Wallet Adapter and Seeker Connect, and an Android PWA) for a SIINDEX citizen to use Solana USDC without managing keys or SOL. Report only. SIINDEX decides what to say. AJ decides what changes.

Assigned through `assignSkill()` in `agents/orchestrator.js`, so the dispatcher's tiers and consent rules apply as written in `siindex-operating/DISPATCHER-MODEL.md`. This skill never asks for a higher tier. If a task needs a write, say so in the report and stop.

## What it reports

For each mobile path SIINDEX names, each item gets one verdict, **supported**, **not supported** or **cannot be confirmed**, with its source and the date checked.

1. **Invisible USDC transfer with biometric unlock.** Whether the path currently supports Solana USDC transfers with biometric unlock and no visible seed phrase (the Samsung Wallet style), and the source. Also report who holds the key on that path, according to the source: the user's device, or a partner. A path where a partner holds the key is flagged, because it changes who holds user funds.
2. **Fee sponsorship.** The current status of fee sponsorship on that path, so the user never holds SOL.
3. **Progressive KYC and attestation.** Whether progressive KYC or an SAS attestation can be linked to the phone-linked wallet. Report the linkage status only. An attestation valid for SIINDEX citizen status may be referenced for transfer limits.
4. **Platform limits.** Known limitations on iOS compared with Android, and for a PWA.
5. **December demo blockers.** Any blocker that would prevent a December demo of "send money abroad from phone, no seed phrase", each with its source.
6. **Pacific and Cook Islands notes.** If the corridor involves the Cook Islands, Australia or New Zealand, flag it and note device or partner availability the sources show for those countries.

## Primary sources

The documentation and published status pages of the wallet and platform makers (Samsung, Solana Mobile, the Mobile Wallet Adapter specification), the Solana documentation, the attestation scheme's published rules, and official app store listings. Read with plain fetches or read-only queries only.

## Rules

- **Read-only.** It does not write, edit, rename or delete any file, does not send email or any message, does not change any other skill, does not install or run any wallet or app, does not sign or send any transaction, and does not issue or revoke any attestation. It never holds or moves user funds. Solana is the settlement layer only.
- **Fiat stays with licensed partners.** Fiat on-ramp and off-ramp stay with licensed partners. The skill never recommends direct wallet-to-wallet exposure for a user.
- **Query only what SIINDEX hands it.** The paths and devices come from SIINDEX for the task. It never collects identity documents or KYC records, and does not take addresses from the citizen database on its own.
- **Skeptic by default.** A capability is "supported" only if a primary source shows it for the path and the platform named. A feature announced, previewed or planned is not "supported". Say which of those it is.
- **"Cannot be confirmed", never a guess.** If a primary source cannot be reached or does not contain the claim, the answer is "cannot be confirmed". Why: a gap in the evidence means unknown, not supported.
- **Primary sources only.** News, social posts, reviews and third-party blogs are not sources for a verdict. If one points to a primary source, go to that source. Fact-check services, if ever used, are a secondary signal and never the basis of a verdict.
- **Do not turn a plan into a claim.** The materials say IN$DEX is at pilot-preparation stage, and payments and wallets are not live. A demo shows what the sources say a path can do. Report any wording that implies a live wallet or payment service.
- **List every external lookup.** Each fetch or query sends a request outside the device. List each one in the report: the address or query, and the date.
- **Findings only.** Never present a fix as applied.
- **Return only to SIINDEX.** The report goes back to SIINDEX and nowhere else: not to AJ directly, not to a citizen, not to a vendor or an outside party. SIINDEX is the only voice.

## Done looks like

One report, and nothing else, with:

1. **Checked:** which paths and platforms, and the date of the check.
2. **Items:** per path, one line per item: supported / not supported / cannot be confirmed, with the source and the date checked.
3. **Demo blockers:** each blocker with its source, or "none found".
4. **Needs AJ:** anything only AJ can decide or check by hand, including anything that needs a real device.
5. **External lookups:** every fetch or query made, or "none".

No file is changed, no message is sent, no transaction is signed, and no other skill is touched.
