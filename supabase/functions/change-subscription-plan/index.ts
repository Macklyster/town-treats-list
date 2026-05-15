import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: uErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (uErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const { plan_id, store_id } = await req.json();
    if (!plan_id || !store_id) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [{ data: plan }, { data: store }] = await Promise.all([
      supabase.from("plans").select("*").eq("id", plan_id).single(),
      supabase.from("stores").select("id,owner_id,name").eq("id", store_id).single(),
    ]);
    if (!plan || !store || store.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: "invalid" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: subs } = await supabase
      .from("subscriptions")
      .select("id,status,plan_id,stripe_subscription_id,stripe_customer_id,cancel_at_period_end")
      .eq("store_id", store_id)
      .order("created_at", { ascending: false })
      .limit(1);
    const current = subs?.[0];
    if (!current || !["active", "trialing"].includes(current.status) || !current.stripe_subscription_id) {
      return new Response(
        JSON.stringify({ error: "Nenhuma assinatura ativa para alterar." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (current.plan_id === plan_id) {
      return new Response(
        JSON.stringify({ error: "Você já está neste plano." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Resolve target price: prefer stored stripe_price_id; else create one on-the-fly
    let targetPriceId = plan.stripe_price_id as string | null;
    if (!targetPriceId) {
      const product = await stripe.products.create({
        name: `OfertasFly - Plano ${plan.name}`,
      });
      const price = await stripe.prices.create({
        product: product.id,
        currency: "brl",
        unit_amount: plan.price_cents,
        recurring: { interval: "month" },
      });
      targetPriceId = price.id;
    }

    const stripeSub = await stripe.subscriptions.retrieve(current.stripe_subscription_id);
    const itemId = stripeSub.items.data[0]?.id;
    if (!itemId) {
      return new Response(
        JSON.stringify({ error: "Assinatura inválida no Stripe." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const updated = await stripe.subscriptions.update(current.stripe_subscription_id, {
      items: [{ id: itemId, price: targetPriceId }],
      proration_behavior: "create_prorations",
      cancel_at_period_end: false,
      metadata: {
        ...(stripeSub.metadata ?? {}),
        user_id: user.id,
        store_id,
        plan_id,
      },
    });

    // Best-effort local update; webhook will confirm/refresh
    await supabase
      .from("subscriptions")
      .update({
        plan_id,
        cancel_at_period_end: false,
        canceled_at: null,
        status: updated.status as any,
        current_period_end: updated.current_period_end
          ? new Date(updated.current_period_end * 1000).toISOString()
          : null,
      })
      .eq("id", current.id);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String((e as any)?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
