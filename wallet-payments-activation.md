# IN$DEX wallet and payments activation

Status: built locally for private testing. Not migrated, preview-deployed or activated.

## What this slice delivers

- One persistent wallet record per authenticated citizen.
- Separate TEST_USDC and TEST_INDX ledger accounts.
- One-time test-fund allocation.
- Citizen transfers resolved through an active name.IN$DEX identity.
- Expiring payment links and QR codes.
- Same-asset remittance with zero test fee and no foreign exchange.
- Test bill payments and manual-approval monthly schedules.
- Merchant profiles, QR orders and direct internal test-wallet settlement.
- A non-network test card reference with freeze and purchase simulation.
- Double-entry transaction history.
- Consent-based refund requests that require the receiving citizen to approve.
- Exact amount handling, daily limits, security holds and duplicate-action protection.

This slice creates no Solana key, recovery words, token account, real payment, real card, card credential or external settlement.

## Security model

Supabase Auth establishes the citizen. The wallet RPCs derive ownership from `auth.uid()`. The browser never chooses the actor or source wallet.

All ledger tables have row level security enabled and direct table access revoked from `anon` and `authenticated`. Authenticated citizens use narrow security-definer RPCs. The internal posting function is not executable by browser roles.

Every settled action writes one debit and one credit inside the same database transaction. Balances cannot become negative. Daily limits use atomic integer amounts. Reusing an idempotency key for different transaction details fails closed.

Account security holds block every citizen-funded action. Card security holds and the test-card freeze control also block card actions.

## Required activation order

1. Back up the target database and record the backup identifier.
2. Use a non-production Supabase branch or test project.
3. Confirm the Tier 0 identity and citizen account migrations have passed their own activation checks.
4. Apply `supabase/migrations/20260806_private_test_wallet_payments.sql`.
5. Confirm all thirteen wallet tables have row level security enabled.
6. Confirm `anon` and `authenticated` have no direct table privileges.
7. Confirm only the documented public RPCs are executable by `authenticated`.
8. Confirm the internal `private_test_post_ledger_transaction` function is not executable by browser roles.
9. Deploy `wallet-payments.html` and its two scripts to a protected preview.
10. Run every acceptance case with at least three designated test citizen accounts.
11. Complete privacy, accessibility, security and performance review.
12. Obtain AJ approval before any production migration or route activation.

## Acceptance cases

| Case | Expected result |
|---|---|
| Signed-out visitor | Wallet and balances remain unavailable |
| Authenticated citizen without wallet consent | No wallet is created |
| Verified citizen accepts test terms | One wallet and two zero-balance accounts are created |
| Same setup request repeated | Existing wallet is returned with no duplicate accounts |
| One-time test funds | 1,000 TEST_USDC and 10,000 TEST_INDX are added once |
| Faucet request repeated or raced | No second allocation occurs |
| Valid recipient lookup | Only public display name, domain and wallet readiness are returned |
| Unknown or unready recipient | Transfer is rejected |
| Self-transfer | Transfer is rejected |
| Valid transfer | One debit, one credit and one transaction receipt are recorded |
| Insufficient balance | No ledger row or balance change occurs |
| Daily limit exceeded | Action fails closed |
| Account security hold | Every outbound action fails closed |
| Same idempotency key and same action | Original result is returned without a second transfer |
| Same idempotency key and different action | `IDEMPOTENCY_CONFLICT` is returned |
| Payment QR | QR decodes to the exact protected preview request link |
| Expired or cancelled request | Payment is rejected |
| Payment request paid twice | Only one settlement occurs |
| Remittance | Recipient receives the same test asset and amount; fee remains zero |
| Bill schedule | No automatic payment occurs; each future payment requires manual approval |
| Merchant order | Order uses an expiring payment request and settles into the merchant's internal test wallet |
| Merchant order replay | No duplicate order or settlement occurs |
| Merchant settlement | No external acquirer, bank or card-network settlement is claimed |
| Test card | No PAN, CVV, expiry date or network credential exists |
| Frozen test card | Test purchase is rejected |
| Refund request | Original sender cannot debit the receiver directly |
| Refund approval | Receiver explicitly approves before the matching reverse transfer occurs |
| Refund decline | No balance changes |
| Citizen account recovery | The same wallet and history return after verified account recovery |
| Another citizen reads tables directly | Access is denied |
| Browser replay or double click | No duplicate settlement occurs |
| Mobile, keyboard and screen reader | Every form, status and action remains operable and announced |

## Solana adapter boundary

The repository has an unsigned Solana Pay adapter for later testing. Do not connect it to this wallet until a verified devnet recipient address, test mint, RPC provider, signer policy and separate approval exist.

The public Solana devnet is test-only and rate-limited. It is not a production payment backend. A Solana Pay URL must use a verified recipient account and server-stored expected amount and reference. Never invent an address or treat a QR display as settlement proof.

## Evidence to retain

- Migration version and backup identifier.
- Function grants, RLS and direct-table privilege inspection.
- Three-account transfer and refund evidence.
- Exact debit and credit totals for every transaction type.
- Duplicate-action and concurrent-request results.
- Security-hold and daily-limit results.
- QR decoding evidence.
- Mobile, keyboard, screen-reader and reduced-motion results.
- Privacy, security and performance sign-off.
- AJ preview approval record.

Never store or publish a private key, recovery words, access token, refresh token, OTP, Supabase service-role key, real card credential or real citizen balance.
