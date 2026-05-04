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
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: uErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (uErr || !userData.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const user = userData.user;

    const { plan_id, store_id } = await req.json();
    if (!plan_id || !store_id) return new Response(JSON.stringify({ error: "missing fields" }), { status: 400, headers: corsHeaders });

    const { data: plan } = await supabase.from("plans").select("*").eq("id", plan_id).single();
    const { data: store } = await supabase.from("stores").select("id,owner_id,name").eq("id", store_id).single();
    if (!plan || !store || store.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: "invalid" }), { status: 403, headers: corsHeaders });
    }

    // block duplicate active subs
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id,status,stripe_customer_id")
      .eq("store_id", store_id)
      .order("created_at", { ascending: false })
      .limit(1);
    const current = existing?.[0];
    if (current && ["active", "trialing"].includes(current.status)) {
      return new Response(
        JSON.stringify({ error: "Loja já possui assinatura ativa. Use o portal para alterar o plano." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });

    // reuse customer if known, otherwise look up by email
    let customerId: string | undefined = current?.stripe_customer_id ?? undefined;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
      customerId = customers.data[0]?.id;
    }

    const origin = req.headers.get("origin") ?? "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        plan.stripe_price_id
          ? { price: plan.stripe_price_id, quantity: 1 }
          : {
              price_data: {
                currency: "brl",
                product_data: { name: `Helpfy Ofertas - Plano ${plan.name}` },
                unit_amount: plan.price_cents,
                recurring: { interval: "month" },
              },
              quantity: 1,
            },
      ],
      metadata: { user_id: user.id, store_id, plan_id },
      subscription_data: { metadata: { user_id: user.id, store_id, plan_id } },
      success_url: `${origin}/assinatura?success=1`,
      cancel_url: `${origin}/assinatura?canceled=1`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
