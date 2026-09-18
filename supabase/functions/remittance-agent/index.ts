import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

// Remittance Agent — added 2026-09-04 (god mode Item 5).
// Deliberately NOT a modification of siindex-runtime and NOT reachable from
// siindex-command-center.html / founder-voice.html — a fully separate function, at AJ's
// explicit instruction to leave the existing SIINDEX screen/chat untouched. Same
// SIINDEX voice/persona, isolated code path, isolated failure domain.
//
// Design principle: this agent only ever PROPOSES a remittance (parses free-text intent
// into a structured {amount, currency, recipient} object via one Anthropic tool call). It
// never executes transfer_indx itself. The citizen still has to review the pre-filled form
// on remittance.html and tap "Send Money" — which goes through the exact same real,
// Approval-Gateway-protected transfer_indx call as every other send on that screen. Keeping
// money-movement logic in exactly one place (remittance.html's existing doSend()) instead
// of duplicating it here.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const MODEL = Deno.env.get('SIINDEX_MODEL') || 'claude-haiku-4-5-20251001'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

const PROPOSE_TOOL = {
  name: 'propose_remittance',
  description: 'Call this when the citizen has given a clear intent to send money: an amount and who to send it to. Do not call this for questions about fees, corridors, or general chat.',
  input_schema: {
    type: 'object',
    properties: {
      amount: { type: 'number', description: 'The amount to send, in the sender currency the citizen stated (or implied AUD/NZD if unstated).' },
      currency: { type: 'string', description: '3-letter currency code of the amount, e.g. AUD, NZD. Default AUD if unclear.' },
      recipient_text: { type: 'string', description: 'Exactly what the citizen said about who to send it to (a name, nickname, or relationship) — verbatim, do not invent a full name.' },
    },
    required: ['amount', 'recipient_text'],
  },
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })

  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.replace('Bearer ', '')
  if (!jwt) return json(401, { error: 'not_authenticated' })

  const sbUser = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: `Bearer ${jwt}` } } })
  const { data: userData, error: userErr } = await sbUser.auth.getUser(jwt)
  if (userErr || !userData?.user) return json(401, { error: 'not_authenticated' })
  const authUserId = userData.user.id

  const sb = createClient(SUPABASE_URL, SERVICE_KEY)
  const { data: citizen } = await sb.from('citizens')
    .select('id, citizen_name, account_frozen')
    .eq('auth_user_id', authUserId).maybeSingle()
  if (!citizen) return json(403, { error: 'no_citizen_record' })

  let body: any = {}
  try { body = await req.json() } catch (_) {}
  const message: string = (body.message || '').toString().slice(0, 1000)
  if (!message) return json(400, { error: 'empty_message' })
  // Corridor/rate context is sent by the client (remittance.html already has this table
  // live in the page) rather than duplicated a third time server-side.
  const corridors = Array.isArray(body.corridors) ? body.corridors.slice(0, 12) : []

  if (!ANTHROPIC_KEY) {
    return json(503, { error: 'model_provider_not_configured', detail: 'ANTHROPIC_API_KEY is not set for this project. No response was invented.' })
  }

  const corridorLines = corridors.map((c: any) => `- ${c.label}: 1 ${c.from} ≈ ${c.rate} ${c.to}, IN$DEX fee 0.8% flat`).join('\n') || '(no corridor data provided)'
  const systemPrompt = `You are SIINDEX's remittance assistant inside IN$DEX. You are warm, direct, and brief — one or two sentences unless asked for more. You help ${citizen.citizen_name || 'this citizen'} understand fees/corridors and prepare a transfer.

REAL CORRIDOR DATA (given by the app this request, not invented):
${corridorLines}

Rules:
- If they clearly state an amount and a recipient, call propose_remittance. Do not also claim in text that money was sent — nothing is sent by you, ever. Say something like "Got it — review and confirm below."
- If they're asking a question (fees, how long, is it safe), just answer from the corridor data above and general IN$DEX facts (Solana-settled, typically under a minute, 0.8% flat fee). Do not invent a specific delivery time guarantee beyond "typically under a minute."
- Never claim a transfer is complete, pending review, or in progress — you cannot check that, only the app screen can.
- If asked about anything outside remittances, say this assistant only handles sending money, and suggest they use SIINDEX in the main app for other things.`

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
        tools: [PROPOSE_TOOL],
      }),
    })
    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '')
      return json(502, { error: 'model_call_failed', detail: errText })
    }
    const result = await upstream.json()
    let replyText = ''
    let proposal: Record<string, unknown> | null = null
    for (const block of result.content || []) {
      if (block.type === 'text') replyText += block.text
      if (block.type === 'tool_use' && block.name === 'propose_remittance') proposal = block.input
    }

    await sb.from('security_events').insert({
      tier: 'T0', zone: 'remittance_agent_conversation',
      description: 'Remittance agent call completed',
      detail: { auth_user_id: authUserId, citizen_id: citizen.id, had_proposal: !!proposal, account_frozen: citizen.account_frozen },
    }).catch(() => {})

    return json(200, { reply: replyText || null, proposal, account_frozen: !!citizen.account_frozen })
  } catch (e) {
    return json(502, { error: 'model_call_failed', detail: String(e) })
  }
})
