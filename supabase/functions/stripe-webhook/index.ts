// Verifies a real Stripe webhook signature and credits the citizen's INDX balance
// server-side via credit_stripe_purchase, using the service-role key.
//
// WHY THIS EXISTS
// ----------------
// buy-indx.html previously called credit_stripe_purchase directly from the browser
// with the anon key right after stripeInstance.confirmCardPayment() resolved
// client-side. Two real problems with that:
//
// 1. credit_stripe_purchase is intentionally NOT granted to anon or authenticated
//    (confirmed live) -- it's designed to be called only from a trusted server
//    context, precisely because it has no auth.uid() ownership check (a purchase
//    credits the BUYER, who is calling on their own behalf, but the function still
//    has to trust its caller completely since there's no Stripe-side confirmation
//    happening in the same call). So the client-side call was already a silent
//    no-op (42501) with no working path to actually credit a citizen.
//
// 2. Even if it HAD been granted to the client, that would have been a real
//    financial hole: confirmCardPayment() resolving successfully in the browser is
//    not proof a charge was actually captured -- a malicious client could skip
//    Stripe entirely and call credit_stripe_purchase directly with a made-up
//    stripe_payment_intent_id string and mint itself unlimited INDX. The only real
//    proof a charge happened is a signed webhook event from Stripe itself.
//
// This function is that trusted path: Stripe calls it directly (server-to-server),
// the signature is verified against STRIPE_WEBHOOK_SECRET, and only then does it
// call credit_stripe_purchase with the service-role key. buy-indx.html's job after
// a successful confirmCardPayment() is just to show a "processing" state and poll
// for the transaction to land -- it never touches the balance itself.
//
// SETUP NEEDED (AJ, once a real Stripe account exists):
//   1. Supabase dashboard -> Edge Functions -> Secrets: set STRIPE_SECRET_KEY and
//      STRIPE_WEBHOOK_SECRET (from Stripe Dashboard -> Developers -> Webhooks ->
//      your endpoint's "Signing secret").
//   2. Stripe Dashboard -> Developers -> Webhooks -> Add endpoint:
//        https://zljgthfzbalsunuoohcd.supabase.co/functions/v1/stripe-webhook
//      Listen for event: payment_intent.succeeded
//   3. Replace the STRIPE_PK placeholder in buy-indx.html with the real
//      publishable key.
// Until STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET are set, this function returns a
// clear 503 rather than pretending to work -- same honest-disclosure pattern as
// create-payment-intent.
//
// BACKFILLED 2026-09-17: this file was already deployed and live (version 1,
// unmodified) but had no matching file in the repo -- added purely for an accurate
// history, alongside the create-payment-intent fix in the same BUILD_LOG.md entry.

import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno&deno-std=0.168.0';
import { createClient } from 'jsr:@supabase/supabase-js@2.95.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405 });
  }

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!stripeSecretKey || !webhookSecret) {
    return new Response(
      JSON.stringify({ error: 'Stripe not configured. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to Supabase secrets.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  });

  const sig = req.headers.get('stripe-signature');
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    if (!sig) throw new Error('Missing stripe-signature header');
    // constructEventAsync (not constructEvent) -- Deno's SubtleCrypto is async,
    // and constructEvent's sync HMAC verification does not work in this runtime.
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('stripe-webhook signature verification failed:', (err as Error).message);
    return new Response(JSON.stringify({ error: 'invalid_signature' }), { status: 400 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent;
    const citizenId = intent.metadata?.citizen_id;
    const indxTotal = Number(intent.metadata?.indx_total);
    const amountUsd = intent.amount_received / 100;

    if (!citizenId || citizenId === 'anonymous' || !indxTotal || indxTotal <= 0) {
      await admin.from('security_events').insert({
        tier: 'T2', zone: 'stripe_webhook_unresolvable',
        description: 'Stripe payment succeeded but could not be matched to a citizen/amount.',
        detail: { payment_intent_id: intent.id, metadata: intent.metadata, amount_usd: amountUsd },
      });
      // Acknowledge receipt to Stripe (200) so it doesn't retry forever, but this
      // charge needs manual reconciliation -- it's logged above for that purpose.
      return new Response(JSON.stringify({ received: true, credited: false, reason: 'unresolvable_metadata' }), { status: 200 });
    }

    const { data, error } = await admin.rpc('credit_stripe_purchase', {
      p_citizen_id: citizenId,
      p_amount_indx: indxTotal,
      p_amount_usd: amountUsd,
      p_stripe_payment_intent_id: intent.id,
    });

    if (error) {
      await admin.from('security_events').insert({
        tier: 'T2', zone: 'stripe_webhook_credit_failed',
        description: 'credit_stripe_purchase RPC call failed for a real Stripe charge.',
        detail: { payment_intent_id: intent.id, citizen_id: citizenId, error: error.message },
      });
      // Still 200 -- Stripe considers this event delivered either way, and retrying
      // won't fix an RPC-level error. Logged above for manual reconciliation.
      return new Response(JSON.stringify({ received: true, credited: false, reason: 'rpc_error' }), { status: 200 });
    }

    return new Response(JSON.stringify({ received: true, credited: data?.success === true, result: data }), { status: 200 });
  }

  // Any other event type: acknowledge, do nothing.
  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
