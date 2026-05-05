import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = { "Access-Control-Allow-Origin": "*" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2024-06-20",
    httpClient: Stripe.createFetchHttpClient(),
  });
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = sig && webhookSecret
      ? await stripe.webhooks.constructEventAsync(body, sig, webhookSecret)
      : (JSON.parse(body) as Stripe.Event);
  } catch (e) {
    return new Response(`bad sig: ${e}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const upsertSub = async (sub: Stripe.Subscription, meta?: Record<string, string>) => {
    const m = { ...(sub.metadata ?? {}), ...(meta ?? {}) };
    const store_id = m.store_id;
    const plan_id = m.plan_id;
    if (!store_id || !plan_id) return;
    await supabase.from("subscriptions").upsert(
      {
        store_id,
        plan_id,
        stripe_customer_id: sub.customer as string,
        stripe_subscription_id: sub.id,
        status: sub.status as any,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      },
      { onConflict: "stripe_subscription_id" }
    );
  };

  try {
    console.log("[stripe-webhook] event", event.type);
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.subscription) {
          const sub = await stripe.subscriptions.retrieve(s.subscription as string);
          await upsertSub(sub, s.metadata as any);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await upsertSub(event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        if (inv.subscription) {
          const sub = await stripe.subscriptions.retrieve(inv.subscription as string);
          await upsertSub(sub);
        }
        break;
      }
    }
  } catch (e) {
    console.error("[stripe-webhook] handler error", e);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
