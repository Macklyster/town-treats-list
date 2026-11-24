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

  if (!sig || !webhookSecret) {
    console.error("[stripe-webhook] missing signature or webhook secret");
    return new Response("missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
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
    if (m.addon === "ai_assist") {
      if (!store_id) return;
      await supabase.from("store_addons").upsert(
        {
          store_id,
          addon: "ai_assist",
          stripe_customer_id: sub.customer as string,
          stripe_subscription_id: sub.id,
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: !!sub.cancel_at_period_end,
        },
        { onConflict: "stripe_subscription_id" }
      );
      return;
    }
    let plan_id = m.plan_id;

    // A plan swap done inside the Stripe billing portal doesn't update metadata,
    // so trust the actual price on the subscription item when it maps to a plan.
    const priceId = sub.items?.data?.[0]?.price?.id;
    if (priceId) {
      const { data: byPrice } = await supabase
        .from("plans")
        .select("id")
        .or(`stripe_price_id.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
        .maybeSingle();
      if (byPrice?.id) plan_id = byPrice.id;
    }

    if (!store_id || !plan_id) {
      console.warn("[stripe-webhook] skipping upsert, missing store_id/plan_id", { store_id, plan_id, sub: sub.id });
      return;
    }
    await supabase.from("subscriptions").upsert(
      {
        store_id,
        plan_id,
        stripe_customer_id: sub.customer as string,
        stripe_subscription_id: sub.id,
        status: sub.status as any,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: !!sub.cancel_at_period_end,
        canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
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
