import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

// Lending Collateral Webhook — added 2026-09-17, alongside the borrow_from_pool security
// fix (see BUILD_LOG.md same date). This is the real on-chain verification piece that was
// missing: previously borrow_from_pool trusted a caller-supplied USDC amount with nothing
// behind it. Now, real collateral only ever enters the system through this function,
// which only ever runs off a webhook call from a chain-indexing provider (Helius),
// confirming an actual on-chain USDC transfer.
//
// STATUS 2026-09-17: built and wired to real tables, but INERT until AJ completes the two
// steps only he can do:
//   1. Decide/create the real vault wallet (a Squads v4 multisig is recommended, matching
//      the project's existing Grid Account MPC pattern) and insert its address into
//      lending_config (key='vault_address') via the Supabase dashboard or a migration.
//   2. Create a Helius account, register a webhook pointed at this function's URL, and set
//      this function's COLLATERAL_WEBHOOK_SECRET secret to match whatever shared secret is
//      configured on the Helius side (Authorization header or a custom header — Helius
//      supports an "Auth Header Value" you set per-webhook).
// Until both exist, this function fails closed (503) rather than silently accepting
// anything, and collateral_deposits stays empty, so borrow_from_pool keeps safely
// refusing every request exactly as it does today.
//
// The exact shape of Helius's "Enhanced Transaction" webhook payload should be verified
// against a real delivered payload during setup — this parses the documented shape
// (tokenTransfers[] + instructions[] with a Memo Program entry) but has not been
// exercised against a live webhook, since no Helius account exists yet for this project.
// Do not assume this is battle-tested; test with a small real devnet/mainnet transfer
// before trusting it with a real borrow.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const WEBHOOK_SECRET = Deno.env.get('COLLATERAL_WEBHOOK_SECRET')
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

// Pulls a memo string out of a Helius-parsed transaction's instruction list, if present.
function extractMemo(tx: Record<string, unknown>): string | null {
  const instructions = (tx.instructions as Array<Record<string, unknown>> | undefined) ?? []
  for (const ix of instructions) {
    if (ix.programId === MEMO_PROGRAM_ID && typeof ix.data === 'string') {
      return ix.data.trim()
    }
  }
  // Some Helius payload variants surface memo text directly on the transaction.
  if (typeof tx.memo === 'string') return (tx.memo as string).trim()
  return null
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })

  if (!WEBHOOK_SECRET) {
    // Fail closed and honestly: this is not a partial/best-effort accept. No secret
    // configured means no vault/webhook has been set up yet, so nothing should be trusted.
    console.error('lending-collateral-webhook: COLLATERAL_WEBHOOK_SECRET not configured — refusing all requests')
    return json(503, { error: 'not_configured' })
  }

  const providedSecret = req.headers.get('authorization')?.replace('Bearer ', '') ?? req.headers.get('x-webhook-secret') ?? ''
  if (providedSecret !== WEBHOOK_SECRET) {
    return json(401, { error: 'invalid_webhook_secret' })
  }

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return json(400, { error: 'invalid_json' })
  }

  const transactions = Array.isArray(payload) ? payload : [payload]
  const sb = createClient(SUPABASE_URL, SERVICE_KEY)

  const results: Array<Record<string, unknown>> = []

  for (const tx of transactions as Array<Record<string, unknown>>) {
    const signature = tx.signature as string | undefined
    if (!signature) { results.push({ skipped: 'no_signature' }); continue }

    if (tx.transactionError) { results.push({ signature, skipped: 'transaction_error' }); continue }

    const reference = extractMemo(tx)
    if (!reference) { results.push({ signature, skipped: 'no_memo_reference' }); continue }

    const { data: intent, error: intentErr } = await sb
      .from('collateral_deposit_intents')
      .select('id, citizen_id, vault_address, used_at, expires_at')
      .eq('reference', reference)
      .maybeSingle()

    if (intentErr || !intent) { results.push({ signature, reference, skipped: 'no_matching_intent' }); continue }
    if (intent.used_at) { results.push({ signature, reference, skipped: 'intent_already_used' }); continue }
    if (new Date(intent.expires_at) < new Date()) { results.push({ signature, reference, skipped: 'intent_expired' }); continue }

    const tokenTransfers = (tx.tokenTransfers as Array<Record<string, unknown>> | undefined) ?? []
    const match = tokenTransfers.find(t =>
      t.mint === USDC_MINT && t.toUserAccount === intent.vault_address && Number(t.tokenAmount) > 0
    )
    if (!match) { results.push({ signature, reference, skipped: 'no_matching_usdc_transfer_to_vault' }); continue }

    const usdcAmount = Number(match.tokenAmount)

    const { error: insertErr } = await sb.from('collateral_deposits').insert({
      citizen_id: intent.citizen_id,
      intent_id: intent.id,
      tx_signature: signature,
      vault_address: intent.vault_address,
      mint: USDC_MINT,
      usdc_amount: usdcAmount,
    })

    if (insertErr) {
      // Unique violation on tx_signature means this transaction was already processed —
      // that's success (idempotent replay), not a failure.
      if (insertErr.code === '23505') {
        results.push({ signature, reference, status: 'already_recorded' })
      } else {
        console.error('lending-collateral-webhook insert failed', insertErr)
        results.push({ signature, reference, error: insertErr.message })
      }
      continue
    }

    await sb.from('collateral_deposit_intents').update({ used_at: new Date().toISOString() }).eq('id', intent.id)

    await sb.from('security_events').insert({
      tier: 'T1',
      zone: 'lending',
      description: 'USDC collateral deposit confirmed on-chain',
      detail: { citizen_id: intent.citizen_id, reference, tx_signature: signature, usdc_amount: usdcAmount },
    })

    results.push({ signature, reference, status: 'confirmed', usdc_amount: usdcAmount, citizen_id: intent.citizen_id })
  }

  return json(200, { processed: results.length, results })
})
