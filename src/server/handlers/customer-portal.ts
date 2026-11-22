import { env } from "../env";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      env("SUPABASE_URL")!,
      env("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: uErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (uErr || !userData.user?.email) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const stripe = new Stripe(env("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });
    // Usa apenas o cliente Stripe vinculado à assinatura da loja do próprio usuário (RLS),
    // nunca uma busca por e-mail, que pode não ter sido comprovado.
    const { data: subRows } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id, store:stores!inner(owner_id)")
      .eq("store.owner_id", userData.user.id)
      .not("stripe_customer_id", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1);
    const customerId = (subRows?.[0] as any)?.stripe_customer_id as string | undefined;
    if (!customerId) return new Response(JSON.stringify({ error: "no customer" }), { status: 404, headers: corsHeaders });

    const origin = req.headers.get("origin") ?? "http://localhost:5173";
    let body: any = {};
    try { body = await req.json(); } catch { /* no body */ }
    const flow = body?.flow as string | undefined;
    const subscriptionId = body?.subscription_id as string | undefined;

    const params: Stripe.BillingPortal.SessionCreateParams = {
      customer: customerId,
      return_url: `${origin}/painel-lojista/assinatura`,
      locale: "pt-BR" as any,
    };
    if (flow === "cancel" && subscriptionId) {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      const subCustomer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      if (subCustomer !== customerId) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: corsHeaders });
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
};
