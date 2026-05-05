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
    if (uErr || !userData.user?.email) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });
    const customers = await stripe.customers.list({ email: userData.user.email, limit: 1 });
    if (!customers.data[0]) return new Response(JSON.stringify({ error: "no customer" }), { status: 404, headers: corsHeaders });

    const origin = req.headers.get("origin") ?? "http://localhost:5173";
    let body: any = {};
    try { body = await req.json(); } catch { /* no body */ }
    const flow = body?.flow as string | undefined;
    const subscriptionId = body?.subscription_id as string | undefined;

    const params: Stripe.BillingPortal.SessionCreateParams = {
      customer: customers.data[0].id,
      return_url: `${origin}/painel-lojista/assinatura`,
      locale: "pt-BR" as any,
    };
    if (flow === "cancel" && subscriptionId) {
      params.flow_data = {
        type: "subscription_cancel",
        subscription_cancel: { subscription: subscriptionId },
        after_completion: { type: "redirect", redirect: { return_url: `${origin}/painel-lojista/assinatura?canceled=1` } },
      } as any;
    }
    const portal = await stripe.billingPortal.sessions.create(params);
    return new Response(JSON.stringify({ url: portal.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
