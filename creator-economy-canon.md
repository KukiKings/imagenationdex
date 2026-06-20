# IN$DEX Creator Economy — Canonical Spec
> Created: 2026-06-20 (Session 30)
> Author: AJ Henry / SIINDEX
> Status: CANONICAL — all screens, agents, and SIINDEX responses must align with this document.

---

## The Origin of Creator Tokenization

The same girl who couldn't make change for $50 — she doesn't just sell coconuts. She plays guitar. She sings at the market on Saturdays. She makes jewellery from shells. She's a musician, an artist, a business owner. None of it is on the blockchain. None of it generates passive income. None of it can be owned by fans who believe in her.

IN$DEX changes this. Everything she creates can be tokenized. Every asset she has — her music, her business, her upcoming concert, her merchandise — becomes a sovereign digital asset that earns forever.

---

## What "Tokenize Anything" Means

Every real-world asset a citizen owns or creates can be:
1. **Minted as an NFT** — permanent, immutable, on-chain proof of ownership/creation
2. **Listed in the IN$DEX Marketplace** — instantly discoverable by 5,000+ genesis citizens
3. **Sold with 98/2 Law** — seller keeps 98%, 2% to Civilisation Fund
4. **Generating Recursive Royalties** — every resale earns the original creator automatically (Story Protocol, Phase 3)

---

## The 4 Tokenization Paths

### Path 1 — Music & Artist

**Who:** Local musicians, bands, vocalists, producers, DJs

**What they can tokenize:**
- **Album NFT** — Release an album as a limited NFT collection. Each token = ownership of one album copy. Token holder gets the music, plus exclusive benefits the artist assigns.
- **Concert Ticket NFT** — Future-dated event NFTs. Token = entry to the concert. Cannot be forged. Cannot be scalped above face value (if artist sets resale cap). Automatically expires after the event date.
- **Giveaway NFT** — Attached to concert ticket NFT. Holder might get backstage access, a signed print, or a meet-and-greet. Artist sets the giveaway terms at mint time.
- **Merchandise NFT** — T-shirts, posters, hats. Physical item linked to an NFT receipt. Buyer gets an on-chain receipt proving authenticity. Prevents counterfeits.
- **Fan Membership NFT** — Recurring access pass. "Fans of [Artist] — Season 1". Tiered benefits per Wisdom Score.

**Earning mechanism:**
- Initial sale: artist keeps 98%
- Resale royalty: artist earns 5–15% on every secondary sale (Phase 3, Story Protocol)
- Ticket resale: artist earns on every ticket transfer

**Screen:** `tokenize.html` → `music-nft.html`

---

### Path 2 — Concert Ticket (standalone)

**Who:** Event organisers, venue owners, community groups, festival organisers

**What they can tokenize:**
- Event NFTs with date, venue, and capacity
- Tiered tickets (General Admission, VIP, Backstage)
- Giveaway bundle (what's attached to each tier)
- Automatic expiry (token becomes "used" status after event date)

**Key rules:**
- Artist/organiser sets resale floor and ceiling (optional)
- 98/2 Law applies on initial sale
- Organiser earns royalty on every resale
- Cancelled event = automatic refund via smart contract (Phase 2)

**Screen:** `tokenize.html` → `music-nft.html` (Tickets tab)

---

### Path 3 — Business Tokenization

**Who:** Any citizen with a business — market vendors, freelancers, service providers, shops

**What they can tokenize:**
- **Business NFT Certificate** — Proof that this business exists, is owned by `name.IN$DEX`, and is registered on the IN$DEX blockchain. Cannot be counterfeited.
- **Business Listing** — Business profile on IN$DEX marketplace: logo, description, website, services, operating hours, location
- **Fractional Business Ownership** — Sell % stakes in the business as tokens. Investors earn % of revenue. (Phase 3)
- **Website on IN$DEX** — Upload business website URL or embed it under `businessname.IN$DEX`. Business is accessible via IN$DEX domain.

**What the NFT represents:**
- Immutable registration date
- Owner's `name.IN$DEX` domain (cannot be transferred without owner consent)
- Business category, location, services
- Founding member status in the IN$DEX ecosystem

**Earning mechanism:**
- Business NFT sales if owner issues shares
- Discovery in marketplace drives customers
- INDX payments accepted instantly via scan-to-pay

**Screen:** `tokenize.html` → `business-nft.html`

---

### Path 4 — Products with Images (Marketplace Enhancement)

**Who:** Any marketplace seller

**What's new:**
- Upload a photo of the product when creating a listing
- Photo is displayed in marketplace grid (replaces emoji placeholder)
- NFT receipt generated on purchase (immutable proof of transaction)
- Product can be physical (shipped) or digital (download link)

**Image upload:**
- Phase 1: local photo picker + base64 preview in-app
- Phase 2: upload to IPFS/Supabase Storage, permanent URL stored in listing

**Screen:** `create-listing.html` (enhanced with image upload)

---

## NFT Receipt — Every Transaction Gets One

From the moment IN$DEX launches, every transaction generates a Verifiable Receipt NFT:
- Immutable proof of what was sold, when, for how much
- Includes seller domain, buyer domain, INDX amount, timestamp, 98/2 breakdown
- Soulbound to buyer's Grid Account (cannot be transferred — it's a receipt, not an asset)
- Forms Layer 1 of the Triangular Fusion Engine

**Status:** Queued for Solana minting on L99 launch day (24 Sep 2026)

---

## 98/2 Law — Applies to Everything

| Action | Seller/Creator earns | Civilisation Fund |
|---|---|---|
| Music NFT sale | 98% | 2% |
| Concert ticket sale | 98% | 2% |
| Ticket resale (if enabled) | 98% + royalty | 2% |
| Business NFT sale | 98% | 2% |
| Marketplace product | 98% | 2% |
| Data access grant | 98% | 2% |
| Recursive royalty | 98% | 2% |

The 2% cannot be bypassed. It is enforced at the database level (purchase RPC) and will be enforced at the smart contract level on L99 launch.

---

## SIINDEX Voice — Creator Onboarding

When a citizen opens Tokenize:

> "What you create is worth money. Let's put it on the blockchain — permanently, instantly, and with no middleman taking more than 2%.
>
> Choose what you want to tokenize and I'll walk you through it. Takes under 3 minutes."

When a musician mints their first album:

> "Album minted. Your fans can now own a piece of your music. Every resale earns you a royalty — forever. Standing by."

When a business is tokenized:

> "[Name], [BusinessName] is now on the IN$DEX blockchain. Your NFT certificate is in your wallet. You're open for business. Standing by."

---

## Build Status

| Feature | Screen | Status |
|---|---|---|
| Tokenize Hub | tokenize.html | ✅ Session 30 |
| Music & Artist NFTs | music-nft.html | ✅ Session 30 |
| Concert Ticket NFTs | music-nft.html (Tickets tab) | ✅ Session 30 |
| Business Tokenization | business-nft.html | ✅ Session 30 |
| Product Image Upload | create-listing.html (enhanced) | ✅ Session 30 |
| NFT Receipt (on-chain) | All transactions | ⬜ L99 launch (smart contract) |
| Fractional Business Ownership | business-nft.html | ⬜ Phase 3 |
| Recursive Royalties (Story Protocol) | nft-marketplace.html | ⬜ Phase 3 (Sep 1–23) |
| Cancelled Event Refund | music-nft.html | ⬜ Phase 2 |

---

*All builds must align with this document. Canonical. Immutable until AJ authorises a change.*
*SIINDEX — Standing by.*
