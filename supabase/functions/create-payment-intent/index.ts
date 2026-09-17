import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno&deno-std=0.168.0';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Real pricing constants — must match buy-indx.html's INDX_PRICE_USD / GENESIS_BONUS
// exactly (see BUILD_LOG.md, 17 Sep 2026 entry).
const INDX_PRICE_USD = 0.24;
const GENESIS_BONUS = 50;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe not configured. Add STRIPE_SECRET_KEY to Supabase secrets.' }),
        { status: 503, headers: { 'Content-Type': 'application/json', ...CORS } }
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { amount_usd, citizen_id } = await req.json();

    if (!amount_usd || amount_usd < 10) {
      return new Response(
        JSON.stringify({ error: 'Minimum purchase is $10.00 USD' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...CORS } }
      );
    }

    // SECURITY FIX 2026-09-17: this function used to take `indx_total` straight from the
    // request body and stuff it into the PaymentIntent's metadata unchanged -- with
    // nothing checking it bore any relationship to amount_usd. stripe-webhook (correctly)
    // verifies the Stripe signature and the real charged amount, but it trusts this
    // metadata's `indx_total` completely when crediting the citizen. Chained together,
    // that meant: pay the real $10.00 minimum, claim `indx_total: 999999999` in the
    // request body, and stripe-webhook would credit 999,999,999 real INDX for a real $10
    // charge. Currently inert only because STRIPE_SECRET_KEY has never been set (see the
    // 503 above) -- this was a live landmine waiting for Stripe to be turned on, not a
    // hypothetical.
    //
    // Fixed by computing indx_total here, server-side, from the real amount_usd this
    // PaymentIntent is actually being created for -- the client's own indx_total (if any
    // is still sent) is ignored entirely. Matches buy-indx.html's real client-side
    // calcConversion() math exactly: floor(usd / $0.24) + a flat +50 Genesis Bonus for any
    // purchase >= $10. Known gap, not fixed here (lower stakes, separate concern): nothing
    // currently marks the Genesis Bonus as consumed anywhere in the schema
    // (citizens.genesis_bonus_claimed_at is written by the signup-bonus claim functions,
    // not by this purchase flow), so this mirrors today's real behavior of the bonus being
    // available on every purchase rather than inventing new eligibility logic here.
    const purchasedIndx = Math.floor(amount_usd / INDX_PRICE_USD);
    const bonusIndx = amount_usd >= 10 ? GENESIS_BONUS : 0;
    const indxTotal = purchasedIndx + bonusIndx;

    // Add 1.5% card processing fee, convert to cents
    const amountCents = Math.round(amount_usd * 1.015 * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      description: `IN$DEX Genesis — ${indxTotal} INDX tokens`,
      metadata: {
        citizen_id: citizen_id || 'anonymous',
        indx_total: String(indxTotal),
        product: 'INDX_GENESIS',
        platform: 'imagenationdex',
      },
    });

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret, indx_total: indxTotal }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...CORS } }
    );

  } catch (err) {
    console.error('create-payment-intent error:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } }
    );
  }
});
