# SIINDEX Citizen Session Sovereignty Layer
### IN$DEX Canonical Security Doctrine — v1.0
**Date:** 9 July 2026 | **Status:** Locked | **Owner:** AJ Henry / SIINDEX

---

## Strategic Frame

IN$DEX must protect the citizen after login — not only at login.

Session hijacking proves that identity security cannot stop at password + 2FA. A logged-in browser session is not evidence of a trusted citizen action. Sessions are stolen, proxied, shared, cloned, and socially engineered every day — at scale — including against financial platforms, Web3 wallets, and community identity systems.

By 2026, the adversary surface has shifted decisively. Adversary-in-the-Middle (AiTM) phishing tools like Evilginx intercept TOTP codes and session cookies in real time. AI-cloned voice attacks on help desks are off-the-shelf. Scattered Spider and its successors use social engineering against call centers as their primary vector because the user-facing technical perimeter has hardened. Infostealer malware extracts session cookies that remain valid even after a password change. MFA push bombing fatigues citizens into approving fraudulent logins.

The answer is a full system.

---

## Core Doctrine

**A session proves access. It does not prove sovereignty.**

**IN$DEX must never confuse convenience with consent.**

**2FA protects the door. SIINDEX protects the civilization.**

**No stolen session should be able to steal funds, culture, identity, governance, or legacy.**

**The more permanent the consequence, the fresher the consent.**

**The more power an account has, the less trust a session deserves.**

---

## The Trust Stack

```
Grid Account Identity
  └─ Passkeys / WebAuthn (phishing-resistant, domain-bound)
       └─ Device Bound Session Credentials (DBSC / TPM-bound)
            └─ Trusted Device Registry
                 └─ Session Integrity Shield
                      └─ Session Risk Score (continuous)
                           └─ Session Compartmentalization
                                └─ Public / Shared Device Mode
                                     └─ Step-Up Authentication
                                          └─ Action Intent Tokens (DPoP-bound)
                                               └─ Consent Receipts (W3C VC)
                                                    └─ Withdrawal / Payout Delay
                                                         └─ Recovery Protection Ceremony
                                                              └─ Guardian Protection Layer
                                                                   └─ Cultural Asset Gate
                                                                        └─ Governance Confirmation
                                                                             └─ Compliance Shield
                                                                                  └─ Decision Ledger
                                                                                       └─ Human Review
                                                                                            └─ Emergency Lock
```

Not: **Login → Full access.**

---

## Layer Architecture

This layer sits between:

> Grid Account → Session Integrity → Action Risk → Consent → Execution → Decision Ledger

---

## 1. Session-Bound Sovereignty

Most apps treat a logged-in browser as trusted. IN$DEX does not.

A session can view low-risk areas. Sensitive actions require a fresh, purpose-specific Action Intent Token.

**Sensitive actions that require a fresh token:**

- Send funds
- Change payout address / bank account / wallet destination
- Export Life Graph
- Approve cultural commercialisation
- Vote on major governance
- Change recovery method
- Add new device
- Publish citizen story
- Publish or modify child-related content
- Transfer asset ownership
- Change identity fields (legal name, domain, region)
- Create or revoke API keys
- Modify automation workflows
- Approve new merchant contact

**Each Action Intent Token is tied to:**

- Citizen ID
- Device fingerprint (session-level, not surveillance-level)
- Action type
- Amount or value (where applicable)
- Destination (where applicable)
- Time window (short-lived — minutes, not hours)
- Risk level
- Authentication method used
- Consent record reference
- Decision Ledger entry

**Citizen-facing language:**
> "This action affects ownership, funds, identity, or trust. I need a fresh confirmation before it can continue."

---

## 2. Device Bound Session Credentials (DBSC) — Critical Addition

> This is the single most important new engineering primitive in session security as of 2026. AJ's draft did not include it.

Chrome 146+ (Windows, rolling to macOS) ships DBSC as a W3C standard-in-progress. DBSC cryptographically binds session cookies to a device's TPM/secure hardware using a public-private key pair generated at login. The private key never leaves the device.

**What this means for IN$DEX:**

- A stolen session cookie from an infostealer is useless without the physical device
- Malware must act locally, making it detectable at the device level
- DBSC is backward-compatible and requires minimal server-side changes
- Degrades gracefully on devices without TPM hardware

**IN$DEX must:**

- Plan for DBSC support in the server session layer as the standard matures
- Pair DBSC with short session lifetimes so that non-TPM devices still have strong timeout protection
- Treat DBSC adoption as Phase 2 infrastructure — not optional

**Reference:** W3C webappsec-dbsc working draft; Chrome 146 GA.

---

## 3. Passkeys First — AiTM Phishing Defeated at the Protocol Level

Passkeys / WebAuthn are not just a convenience feature. They are IN$DEX's primary defence against the most dangerous active attack class: Adversary-in-the-Middle (AiTM) phishing.

**Why AiTM matters:**

Tools like Evilginx act as real-time reverse proxies between the citizen and the legitimate service. They intercept login credentials and session cookies the moment they are issued — including TOTP codes entered while the citizen is actively authenticating. Standard 2FA (SMS, authenticator app) provides zero protection against AiTM because the attacker intercepts the code in transit.

**Why passkeys defeat AiTM:**

WebAuthn authentication is cryptographically bound to the Relying Party ID (RP ID — the legitimate domain). The signing ceremony will not complete for a fake or proxied domain. The attacker's Evilginx proxy cannot impersonate the domain at the cryptographic layer. The authentication is physically impossible to replay on a different domain.

This is the clearest argument for why passkeys are non-negotiable for IN$DEX.

**Authentication hierarchy:**

| Method | Phishing Resistance | AiTM Resistance | MFA Fatigue Resistance | Recommended |
|---|---|---|---|---|
| Passkey / WebAuthn | ✅ | ✅ | ✅ | ✅ Preferred |
| Device biometric + passkey | ✅ | ✅ | ✅ | ✅ Mobile primary |
| Hardware security key (YubiKey / Titan) | ✅ | ✅ | ✅ | ✅ Stewards / admins |
| Authenticator app (TOTP) | ❌ | ❌ | ✅ | Fallback only |
| SMS / email OTP | ❌ | ❌ | ✅ | Emergency only |
| Knowledge questions | ❌ | ❌ | ❌ | Never |

**Doctrine:**

SMS can help recovery. SMS must not be the root of sovereignty.

---

## 4. MFA Push Bombing — Specific Mitigation Required

Scattered Spider's primary attack vector is MFA push bombing (also called MFA fatigue): repeatedly sending push approval requests until the citizen approves one out of frustration or confusion.

**IN$DEX must:**

- Require **number matching** on all push MFA requests: the app must display a number that the citizen must match to a number shown on the login screen — an attacker who initiates a fraudulent login sees a different number
- Passkeys eliminate the entire category because there is no push approval step
- Rate-limit MFA attempts aggressively
- Alert the citizen immediately on any MFA request they did not initiate
- After 3 failed or unexpected MFA requests, pause sensitive actions and notify the citizen

**Citizen-facing alert:**
> "You have received 3 unexpected verification requests. Did you start a new login? If not, tap Secure My Account now."

---

## 5. Reauthentication Windows by Risk — NIST 800-63B-4

NIST SP 800-63B Revision 4 (2025) formalises risk-based session management including Section 5.3 Session Monitoring (continuous authentication). IN$DEX's session timing model must align.

**Session behaviour by area:**

| Area | Session behaviour |
|---|---|
| Reading public content | Normal session |
| Viewing own dashboard | Standard session |
| Editing profile fields | Fresh check if unusual device |
| Marketplace listing draft | Normal session |
| Publishing a listing | Step-up confirmation |
| Changing payout details | Mandatory fresh passkey |
| Sending funds | Mandatory fresh passkey + risk check |
| Cultural asset commercialisation | Fresh confirmation + cultural review |
| Child citizen action | Guardian approval required |
| Governance vote | Fresh confirmation |
| Treasury or admin action | Hardware key + multi-party review |
| Recovery method change | Mandatory delay + trusted device alerts |

**NIST AAL requirements:**

- AAL1: reauthentication at least every 30 days; idle timeout 30 min
- AAL2: reauthentication at least every 12 hours; idle timeout 15 min, both factors required
- AAL3: hardware key required; re-auth shows demonstrable intent

IN$DEX's sensitive actions operate at AAL2 minimum; treasury and admin at AAL3.

---

## 6. Session Fingerprint — Privacy-Respecting Risk Model

Track only what is needed for protection. Never build a surveillance system.

**Track:**

- Device type (category — mobile / desktop / tablet)
- Browser or app identifier (hashed)
- Approximate region (country/region from IP — not GPS)
- ASN and IP reputation
- Session age
- Trusted device status
- Impossible travel flag (country change within impossible time window)
- Sudden ASN/IP shift (especially to known VPN/proxy/hosting ranges)
- New device after recent password reset
- High-risk action attempted from unrecognised device
- Multiple failed security checks in sequence
- Suspicious automation patterns (inhuman request cadence)

**Do not track:**

- Precise GPS location
- Personal browsing history
- Contact or message content
- Purchase patterns outside IN$DEX

**Citizen-facing language:**
> "I noticed this session is acting differently from your normal pattern. Your account is not locked, but sensitive actions are paused until you confirm it is you."

---

## 7. Continuous Session Risk Score — Private Protection Layer

SIINDEX maintains a private Session Risk Score used only by security systems. It is never displayed as a public reputation score. It is never shared with third parties.

**Risk levels:**

| Level | Name | SIINDEX Behaviour |
|---|---|---|
| 🟢 Green | Normal | Citizen continues without interruption |
| 🟡 Yellow | Awareness | SIINDEX shows a gentle contextual note |
| 🟠 Orange | Step-up required | Sensitive actions paused until confirmation |
| 🔴 Red | Restricted | Funds, ownership, publishing, recovery, governance blocked |
| ⚫ Black | Emergency lock | Account enters protection mode; human review required |

**NIST 800-63B-4 Continuous Authentication signals (Section 5.3):**

- Typing cadence and interaction velocity
- Geolocation shift
- IP reputation
- Browser trait change
- Transaction pattern anomaly

**Doctrine:**

This is a private protection layer. Not a public reputation score.

---

## 8. "Secure My Account" Emergency Command

Every citizen should be able to say or type: "SIINDEX, secure my account."

**SIINDEX responds immediately by:**

1. Signing out all other active sessions
2. Pausing all sensitive actions across the account
3. Showing all active devices and their last-seen location (country-level)
4. Surfacing recent account changes (recovery, payout, identity)
5. Surfacing recent wallet and payment actions
6. Surfacing recent publishing and governance actions
7. Reviewing recovery method status
8. Recommending next steps in plain language
9. Creating a Decision Ledger security entry (timestamped, reason: citizen-initiated)

**Citizen-facing response:**
> "Confirmed. I have placed your account into protection mode. Your funds have not moved. Sensitive actions are paused while we review recent activity. Here is what I found."

---

## 9. AI-Voice Vishing + Pre-Shared Caller Code

By 2026, AI-cloned voice attacks are off-the-shelf. Scattered Spider and successors now call help desks using AI-generated voice that matches the target's accent, gender, and pace — combined with infostealer-sourced personal details to answer verification questions convincingly.

**IN$DEX must add a Caller Verification Code:**

- A short, memorable code the citizen sets during onboarding
- Stored only client-side and on the server (never derivable from social media)
- Any citizen calling IN$DEX support must quote this code
- Support agents must not assist with account changes until the code is verified
- The code can be rotated at any time from within a trusted session
- If a citizen cannot remember the code, the channel escalates to video identity proofing + liveness detection — not to an easier path

**Help Desk Anti-Social-Engineering Protocol:**

- Support agents follow a strict script — no exceptions
- No account changes over the phone without code verification
- No password resets over phone without video identity proofing
- No recovery changes without a cooling-off delay regardless of stated urgency
- Support agents cannot override security delays regardless of how persuasive the caller is
- Suspicious support calls are logged to the Decision Ledger

**Citizen-facing language:**
> "Do not paste codes, cookies, recovery phrases, or session values into any chat. SIINDEX will never ask for them. If you receive an urgent call claiming to be from IN$DEX, hang up and use Secure My Account."

---

## 10. Public Computer / Shared Device Mode

Essential for Pacific-first, underbanked, community-device, internet-café, school, library, and family-shared device contexts.

**If SIINDEX detects or the citizen selects a shared device:**

- No "remember me"
- Short idle timeout (5 minutes)
- Clipboard warning on all sensitive fields
- No payout changes permitted
- No recovery changes permitted
- No large transfers
- No passkey storage on device
- Mandatory sign-out reminder after 15 minutes
- Auto-revoke session on browser close
- Limited Life Graph export access
- Block sensitive data exports

**Citizen-facing option:**
> "I'm on a shared device."

**SIINDEX response:**
> "Understood. I will keep this session temporary and restrict sensitive actions for your protection. I will remind you to sign out before you leave."

---

## 11. Device Trust Registry

Every citizen has a simple, plain-language Device Dashboard.

**Shows:**

- Current device (highlighted)
- All trusted devices with last active time
- Approximate location (country/region only)
- Session risk indicator per device
- "Sign out this device" option
- "Sign out everywhere" option
- "This wasn't me" option (triggers Secure My Account)
- Rename device option
- Remove trust option

**Plain-language labels (not technical):**

- My trusted devices
- Sign out everywhere
- This wasn't me
- Trust this device
- Remove this device

---

## 12. Recovery Is a Protected Ceremony

Most real account takeovers happen through recovery flows, help desk impersonation, SIM swaps, or MFA reset processes.

**Recovery rules:**

- No instant recovery for high-value accounts
- All recovery changes require a notification delay (minimum 24 hours for standard; 72 hours for high-value)
- All trusted devices receive an alert immediately when recovery is initiated
- Citizens can cancel a pending recovery change from any trusted device during the delay window
- High-risk recovery requires human review + video identity proofing + liveness check
- Council, treasury, and admin accounts require multi-party recovery (minimum 2 approvers)
- Child citizen recovery requires the registered guardian path
- Cultural steward accounts carry enhanced protection by default
- All recovery attempts are logged to the Decision Ledger
- Recovery must never fall back to SMS as a primary path

**Citizen-facing language:**
> "A recovery change was requested. Because this affects account control, the change will not take effect for 24 hours. You can approve, cancel, or request human review during this window."

---

## 13. Action Intent Tokens — DPoP-Bound

Action Intent Tokens must be sender-constrained using Demonstration of Proof of Possession (DPoP — RFC 9449, part of OAuth 2.0 Security Best Practices RFC 9700).

**How DPoP works for IN$DEX:**

- At the moment of sensitive action, the client generates a short-lived keypair
- The Action Intent Token is bound to the public key
- Each use of the token must be accompanied by a signed proof-of-possession from the private key
- A stolen token without the private key is useless
- Tokens are single-use and time-limited
- The server validates the DPoP proof on every request

This closes the replay attack surface for Action Intent Tokens.

---

## 14. Session Compartmentalization

A marketplace session being hijacked must not grant access to governance, cultural assets, identity exports, or financial transfers.

**IN$DEX must implement scoped session contexts:**

| Context | Scope |
|---|---|
| Browse | Public content, own dashboard (read-only) |
| Marketplace | Listing management, buyer messages, merchant tools |
| Financial | Wallet, send, receive, payout settings |
| Identity | Profile, recovery, device management |
| Cultural | Cultural asset review, commercialisation approval |
| Governance | Proposal submission, voting |
| Admin | System configuration, user management (human review gated) |

Each context uses a scoped token. Financial-context actions require a Financial-context token — a Browse or Marketplace token cannot be used to initiate a transfer. Tokens are issued for specific contexts and expire on context switch or after a time limit.

---

## 15. Withdrawal and Payout Cooling Periods

If a bad actor steals a session, the first thing they will try is to change payout details or move value.

**New Destination Delay by risk:**

| Risk level | Delay | Additional requirement |
|---|---|---|
| Low risk (small amount, known corridor) | 1 hour | Notification to trusted device |
| Medium risk (new destination, medium amount) | 12 hours | Notification + citizen confirmation |
| High risk (new destination, large amount) | 24–72 hours | Human review |
| Treasury / admin | Time-locked multi-sig | Minimum 2 approvers |

**Citizen-facing language:**
> "This is a new destination. For your protection, large transfers to it are delayed until the trust period passes or a review approves it. Your existing destinations are unaffected."

---

## 16. Consent Receipts as Verifiable Credentials

Every sensitive action should produce a human-readable Consent Receipt issued as a W3C Verifiable Credential (VC 2.0, published May 2025).

**Each receipt records:**

- What happened (plain language)
- Who approved it (citizen ID)
- When (ISO 8601 timestamp)
- From which device (hashed device reference)
- Risk level at time of action
- Authentication method used
- Destination (where applicable)
- Reversal or appeal path (where available)
- Decision Ledger ID

**Why Verifiable Credentials:**

- Cryptographically signed — cannot be altered retroactively
- Citizen-portable — the receipt belongs to the citizen, not the platform
- Machine-readable — SIINDEX and third parties can verify the receipt
- Aligned with W3C Digital Credentials API (First Public Working Draft, July 2025)

**Example receipt (plain language):**
> "You approved a payout destination change on 9 July 2026 from your trusted iPhone. A passkey confirmation was used. Transfers to this destination remain limited for 24 hours. Decision Ledger ID: DL-2026-07-09-4821. You can cancel this change before the delay expires."

---

## 17. SIINDEX Anti-Phishing Communication Layer

SIINDEX must teach citizens the following facts, repeatedly and in plain language, as part of onboarding, notifications, and contextual warnings.

**What IN$DEX will never do:**

- Ask for recovery phrases
- Ask for passwords in chat
- Ask for session tokens or cookies
- Ask citizens to copy-paste values from browser developer tools
- Initiate recovery via unsolicited call or message
- Ask citizens to approve a login prompt they did not start
- Demand urgent fund movement under any circumstances

**What citizens should always do:**

- Use "Secure My Account" if anything feels wrong
- Hang up calls claiming urgency about their account and return to the app directly
- Never approve push notifications they did not trigger
- Trust the domain — passkeys will refuse to authenticate on fake domains

**Citizen-facing warning (shown contextually):**
> "Do not paste codes, cookies, recovery phrases, or session values into any chat. SIINDEX will never ask for them."

---

## 18. Session Hijack Detection Signals

SIINDEX should flag and escalate on:

- Session suddenly changes country or region
- Session performs unusual high-risk action pattern
- Abnormal browser automation cadence (inhuman request timing)
- Rapid payout changes from session
- Direct access to security or admin endpoints without navigation path
- Recovery change attempted immediately after login from new device
- New API keys created immediately after login
- Data export triggered from new or unrecognised device
- Session behaviour radically unlike citizen's historical pattern
- Multiple active sessions in geographically impossible locations
- Session continues active after password or MFA change

**Critical security rule:**

A password change or MFA change must revoke all other active sessions by default. The citizen must re-authenticate on each device after a credential change.

---

## 19. Token and Cookie Hardening — Engineering Requirements

Every session implementation must meet these standards (OWASP Session Management Cheat Sheet, RFC 9700):

**Session IDs:**

- Cryptographically random, high entropy (minimum 128 bits)
- Generated server-side only — never client-supplied
- Rotated immediately after login
- Rotated on privilege elevation or role change
- Rotated on any credential change
- Invalidated server-side on logout — not just client-side deletion
- Invalidated server-side on credential change
- Never transmitted in URLs
- Never stored in localStorage where avoidable

**Cookies:**

- Secure flag (HTTPS only)
- HttpOnly flag (not accessible to JavaScript)
- SameSite=Strict or Lax as appropriate
- Short, explicit Max-Age — no session-length "until browser close" cookies for sensitive contexts

**Transport:**

- TLS everywhere — no exceptions
- HSTS enforced

**Other:**

- CSRF protection on all state-changing endpoints
- XSS prevention (Content-Security-Policy, output encoding)
- Server-side session revocation capability
- Refresh token rotation on every use (RFC 9700)
- DPoP sender-constrained tokens for Action Intent Tokens
- Replay detection on token endpoints
- Device-bound sessions via DBSC where available (Phase 2)

---

## 20. High-Value Citizen Protection — Sovereign Vault Mode

Citizens with elevated risk profiles deserve stronger default protection:

- Merchants with active income
- Creators with monetised cultural assets
- Cultural stewards and elders
- Guardians of child citizens
- Council members
- Treasury reviewers
- Admins
- Genesis citizens
- Citizens with large balances
- Citizens with significant governance influence or community reputation

**When Sovereign Vault Mode is enabled:**

- Passkey required for every sensitive action (no session inheritance)
- Withdrawal delay for all new destinations
- No payout changes without a cooling-off period
- New device cannot initiate transfers for 24 hours
- Governance vote requires fresh passkey confirmation
- Recovery changes delayed 72 hours minimum
- Notifications sent to all trusted channels simultaneously
- Optional: trusted guardian or steward review for major actions

**Doctrine:**

This is not friction. This is sovereignty.

---

## 21. Admin, Steward, Council, and Treasury Security

High-authority roles require a materially stronger security model.

**Required for all privileged accounts:**

- Hardware security key or passkey (no SMS fallback — ever)
- Device approval before privilege activation
- Least-privilege principle: minimum access for the task at hand
- Just-in-time privilege elevation (no always-on admin)
- Role-based access control
- Mandatory fresh authentication for every privileged action
- Multi-party approval for treasury or governance changes
- Admin action Decision Ledger (every privileged action logged)
- Quarterly access review — no dormant privileged accounts
- Emergency break-glass procedure documented and tested

**Doctrine:**

The more power an account has, the less trust a session deserves.

---

## 22. Guardian and Child Citizen Session Safety

**For child citizen accounts:**

- No public device trust by default
- Guardian-controlled login duration settings
- Limited session duration regardless of activity
- No public-exposure actions without guardian approval
- No wallet transfers without guardian-defined rules
- No direct messaging with unknown adults
- No export of child identity data
- Session activity alerts sent to guardian in near-real-time
- Age-appropriate security warnings at action gates

**Citizen-facing child-safe message:**
> "This action needs guardian approval because it may expose identity, money, or public content."

---

## 23. Cultural Asset Session Protection

Cultural assets carry their own security classification. A hijacked session must not be able to commercialise, modify, or export cultural assets.

**Any session attempt to:**

- Commercialise cultural content
- Change attribution or revenue share
- Export a cultural archive
- Publish restricted or sacred material
- Modify elder or community approval status

**Requires:**

- Fresh passkey authentication
- Cultural permission check against the Cultural Rights Graph
- Review path with culturally appropriate approval process
- Decision Ledger entry
- Delay for high-impact changes

**Doctrine:**

Culture cannot be lost because a browser stayed logged in.

---

## 24. Governance Session Protection

Governance votes and proposals must not rely only on logged-in session state.

**Requirements:**

- Fresh passkey confirmation for every vote
- Proposal submission confirmation with plain-language recap
- Anti-coercion notice for sensitive governance votes
- Device and session check before vote is recorded
- Vote receipt issued as Verifiable Credential
- Privacy-preserving audit trail
- Abnormal voting pattern detection (mass voting, impossible cadence)
- Guardian restrictions apply for child citizens

**Citizen-facing language:**
> "This vote affects the civilization. I need a fresh confirmation before recording it."

---

## 25. Marketplace and Merchant Fraud Controls

**Session-level protections for merchants:**

- Payout destination change delay (same rules as Section 15)
- Listing hijack detection (price, contact, payout changed from new device — pause publishing)
- Bulk listing change from new device requires confirmation
- Unusual buyer-message volume or pattern flagged
- Refund request anomaly detection
- Customer data export requires step-up authentication
- Inventory bulk-export requires step-up authentication
- New merchant admin approval requires multi-device confirmation

**Example SIINDEX warning:**
> "This listing's price, payout destination, and contact details changed from a new device. I have paused publishing until you confirm these changes are yours."

---

## 26. Session Decision Ledger

Every major session or security event must be logged to the Decision Ledger.

**Each entry records:**

- Decision ID
- Citizen affected
- Session reference (hashed — not raw token)
- Device (hashed reference)
- Risk level at time of event
- Trigger (what caused the log)
- Action attempted
- Authentication method used
- Consent status
- Review status
- Final result
- Appeal path
- Retention period

**Critical:**

Never log raw cookies, passwords, secrets, recovery phrases, or full tokens. The Decision Ledger is for trust and audit — not surveillance.

---

## 27. Security UX — Calm, Not Scary

IN$DEX's security voice must be protective, calm, and precise. It must never induce panic or despair.

**Avoid:**

- "Suspicious activity detected. Account compromised."
- "Transaction blocked."
- "Security violation."

**Use:**

- "This session looks unusual. I have paused sensitive actions until you confirm it is you."
- "Your funds have not moved. This action needs a fresh security check before it can continue."
- "I noticed something different about this session. Nothing has changed in your account. Let's take a moment to confirm it's you."

---

## 28. Post-Quantum Readiness

NIST finalised post-quantum cryptography (PQC) standards in 2024 (ML-KEM, ML-DSA, SLH-DSA). The FIDO Alliance has a defined migration roadmap for WebAuthn to PQC algorithms.

**IN$DEX session layer must be documented as quantum-ready-by-design:**

- Session cryptography uses algorithm-agile implementations
- No hardcoded RSA or EC-only assumptions in the session token layer
- DPoP and DBSC implementations must migrate cleanly to PQC primitives
- Reviewed at each major infrastructure revision against NIST PQC guidance

**This is a planning note, not an immediate build requirement.** Flag for review at $2M ARR or 100K citizens.

---

## Build Order

### MVP — Session Sovereignty Baseline

1. Passkey-first login (WebAuthn, RP ID bound to production domain)
2. Multiple passkey registration encouraged at onboarding (at least 2 devices)
3. Sign out all devices command
4. Trusted device list (plain-language Device Dashboard)
5. Fresh passkey confirmation before: funds / payout change / recovery / identity / governance / cultural commercialisation
6. Session idle timeout (15 min AAL2 areas; 5 min public device mode)
7. Password/MFA change revokes all other sessions
8. Payout destination cooling period (24 hours for new destinations)
9. "Secure My Account" command
10. Security Decision Ledger entries
11. Plain-language SIINDEX security warnings (onboarding + contextual)
12. MFA push bombing: number matching enforcement + rate limiting
13. Help Desk caller verification code system
14. Shared device / public computer mode

### Phase 2 — Continuous Protection

1. Session Risk Score (continuous, private)
2. Action Intent Tokens (DPoP-bound)
3. Session Compartmentalization (scoped tokens per context)
4. Consent Receipts (W3C VC 2.0)
5. Recovery delay + trusted device alerts
6. Guardian session controls
7. Cultural asset step-up checks
8. Governance vote fresh confirmation
9. Merchant listing anomaly detection
10. Session fingerprint risk model (privacy-respecting signals)
11. AI-vishing detection awareness + caller code enforcement

### Phase 3 — Advanced Infrastructure

1. Device Bound Session Credentials (DBSC) — as W3C standard matures
2. Advanced behavioral biometrics session monitoring (NIST 800-63B-4 §5.3)
3. Hardware key requirement for stewards, admins, council
4. Multi-party high-risk approvals
5. Cross-civilization threat memory (aggregate, anonymized)
6. Post-quantum algorithm readiness review

---

## Canonical Doctrine Lines

These are locked. They go into every build brief, every agent prompt, every onboarding screen that touches security.

> "A session proves access. It does not prove sovereignty."

> "IN$DEX must never confuse convenience with consent."

> "2FA protects the door. SIINDEX protects the civilization."

> "No stolen session should be able to steal funds, culture, identity, governance, or legacy."

> "The more permanent the consequence, the fresher the consent."

> "The more power an account has, the less trust a session deserves."

> "Culture cannot be lost because a browser stayed logged in."

> "Recovery is a protected ceremony — not a shortcut."

> "SMS can help recovery. SMS must not be the root of sovereignty."

> "The adversary is now calling your help desk with a cloned voice. Build accordingly."

---

## Standards References

| Standard | Relevance |
|---|---|
| OWASP Session Management Cheat Sheet | Session ID properties, cookie attributes, expiration, rotation, fixation prevention |
| OWASP Authentication Cheat Sheet | Step-up auth, reauthentication triggers |
| NIST SP 800-63B-4 (2025) | AAL1/2/3 requirements, Section 5.3 Session Monitoring, behavioral biometrics |
| FIDO Alliance / WebAuthn L2 | Passkey implementation, RP ID binding, AiTM protection |
| W3C webappsec-dbsc | Device Bound Session Credentials — TPM-bound cookies |
| W3C Verifiable Credentials 2.0 (May 2025) | Consent Receipts as portable, cryptographically signed records |
| W3C Digital Credentials API (July 2025) | Future wallet-based credential presentation |
| RFC 9700 — OAuth 2.0 Security BCP (Jan 2025) | DPoP sender-constrained tokens, refresh token rotation, PKCE |
| RFC 9449 — DPoP | Demonstration of Proof of Possession for token binding |
| CISA Phishing-Resistant MFA Guidance | Hardware key mandate, AiTM defence, help desk social engineering |
| CISA AA23-320A (Scattered Spider) | Help desk exploitation, SIM swap, push bombing, session cookie theft |
| NIST PQC Standards 2024 (ML-KEM, ML-DSA) | Post-quantum migration planning |
| ISO/IEC TS 27560:2023 | Consent records and receipts standard |

---

## Version History

| Version | Date | Author | Notes |
|---|---|---|---|
| v1.0 | 9 Jul 2026 | AJ Henry / SIINDEX | Initial canonical lock — research-validated |

---

*IN$DEX · SIINDEX Citizen Session Sovereignty Layer · Internal Doctrine · INDX $0.24*
