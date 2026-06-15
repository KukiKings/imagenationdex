# IN$DEX Onboarding Flow
**Document Type:** Product Specification
**Prepared by:** SIINDEX — COO, IN$DEX
**Version:** 1.0

---

## The Promise

Any person, anywhere in the world — no bank account, no ID, no crypto knowledge — can scan a QR code and be fully onboarded to IN$DEX in under 60 seconds. They leave with a live Web3 wallet and a free Web3 domain. They can receive and send payments immediately.

---

## The 3-Step Flow

---

### STEP 1 — Scan & Land

**What the user does:**
- Scans an IN$DEX QR code (from a flyer, a merchant's table, a social post, or a partner's screen)
- OR visits imagenationdex directly via browser
- OR taps a shared link

**What they see:**
- A clean, simple welcome screen
- Headline: *"Join IN$DEX. Free. Instant. No bank needed."*
- Three sign-up options displayed as large, easy buttons:
  - 📱 Mobile number
  - 📧 Email address
  - 🔗 Social login (Facebook / Google)
- One line of reassurance: *"No ID required. No forms. Free forever."*

**What happens in the background:**
- SIINDEX detects the entry point (QR source, referral, direct)
- Session is created
- No data is collected beyond what the user provides in Step 2

---

### STEP 2 — Claim Your Identity

**What the user does:**
- Enters their mobile number, email, or taps social login
- Receives a 6-digit OTP (one-time code) via SMS or email
- Enters the OTP to verify

**What they see:**
- A prompt to choose their free Web3 domain name:
  - *"Choose your IN$DEX name — this is your wallet address"*
  - Input field: **[yourname].imagenationdex**
  - Real-time availability check
- A single confirm button: *"Claim My Name"*

**What happens in the background:**
- SIINDEX creates the user's non-custodial Solana wallet
- Web3 domain is minted and assigned instantly (yourname.imagenationdex)
- Wallet address is linked to domain — no long wallet strings for the user to manage
- User record created in MemeDAO governance layer

---

### STEP 3 — Wallet Live. Start Now.

**What the user does:**
- Nothing. They're in.

**What they see:**
- A confirmation screen:
  - ✅ *"Welcome to IN$DEX, [name]."*
  - *"Your wallet is live. Your domain is [yourname].imagenationdex"*
  - *"You can now receive payments, buy, and sell — instantly."*
- Two primary action buttons:
  - **Receive Payment** — shows their QR code to share with anyone
  - **Explore Marketplace** — browse RWA and digital assets
- Optional: short 30-second guided tour (skippable)

**What happens in the background:**
- Wallet is funded with a micro INDX token airdrop (welcome bonus — covers first transaction fees)
- SIINDEX logs onboarding source for partner attribution
- User enters the IN$DEX ecosystem — eligible for INDX rewards, MemeDAO participation, Genesis Vault access

---

## The Mama Noe Test

At every step, ask: *Can Mama Noe — 80 years old, Mele Village, Vanuatu, 50% smartphone confident — complete this step without help?*

- Step 1: She scans the QR. ✅ One tap.
- Step 2: She enters her mobile number, gets an SMS code. ✅ She does this on Facebook already.
- Step 3: She sees her name and a QR code to receive payments. ✅ Done.

If any step fails the Mama Noe test, it must be simplified before launch.

---

## What the User Can Do Immediately After Onboarding

| Action | Available Instantly |
|---|---|
| Receive crypto payments via QR | ✅ |
| Send payments via domain name | ✅ |
| Buy/sell RWA and digital assets P2P | ✅ |
| Access the IN$DEX marketplace | ✅ |
| Earn INDX rewards | ✅ |
| Vote in MemeDAO governance | ✅ |
| Order a CryptoCard | Coming soon |
| Voice wallet commands | Coming soon |

---

## Key Design Principles

1. **No dead ends.** Every screen has a clear next action.
2. **No jargon.** "Wallet" is the only crypto word on the onboarding screens.
3. **Speed over completeness.** Get the user to Step 3 first. Educate later.
4. **Trust signals everywhere.** "Free", "No ID", "Instant" must appear on every screen.
5. **Mobile-first.** Designed for a smartphone in one hand. No desktop assumptions.

---

## Next Steps for AJ

1. Share this document with a developer to begin front-end prototyping
2. Define the OTP provider (SMS gateway — e.g. Twilio, Africa's Talking for Pacific reach)
3. Confirm Web3 domain minting mechanism on Solana
4. Design the QR code assets for partner distribution (merchants, market stalls, events)

---

*Prepared by SIINDEX | IN$DEX COO | Version 1.0*
