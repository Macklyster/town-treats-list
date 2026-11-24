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
    if (uErr || !userData.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const user = userData.user;

    const reqBody = await req.json();
    const { plan_id, store_id, cycle: rawCycle } = reqBody;
    if (reqBody.addon === "ai_assist" || reqBody.addon === "managed_offers") return await addonCheckout(req, supabase, user, String(store_id ?? ""), reqBody.addon);
    const cycle: "monthly" | "yearly" = rawCycle === "yearly" ? "yearly" : "monthly";
    if (!plan_id || !store_id) return new Response(JSON.stringify({ error: "missing fields" }), { status: 400, headers: corsHeaders });

    const { data: plan } = await supabase.from("plans").select("*").eq("id", plan_id).single();
    const { data: store } = await supabase.from("stores").select("id,owner_id,name,trial_days_override").eq("id", store_id).single();
    if (!plan || !store || store.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: "invalid" }), { status: 403, headers: corsHeaders });
    }

    // block duplicate active subs
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id,status,stripe_customer_id,plan_id")
      .eq("store_id", store_id)
      .order("created_at", { ascending: false });
    const current = existing?.[0];
    if (current && ["active", "trialing"].includes(current.status)) {
      return new Response(
        JSON.stringify({ error: "Loja já possui assinatura ativa. Use o portal para alterar o plano." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Trial eligibility: free days (admin-configurable)  for first-ever paid subscription on this store.
    // Disqualifies any prior subscription on a paid plan (price_cents > 0), regardless of status.
    let trialEligible = true;
    if (existing && existing.length > 0) {
      const priorPlanIds = Array.from(
        new Set(existing.map((s: any) => s.plan_id).filter(Boolean))
      );
      if (priorPlanIds.length > 0) {
        const { data: priorPlans } = await supabase
          .from("plans")
          .select("id,price_cents")
          .in("id", priorPlanIds);
        if ((priorPlans ?? []).some((p: any) => (p.price_cents ?? 0) > 0)) {
          trialEligible = false;
        }
      }
    }
    // Yearly subscriptions don't get the trial (the 2 free months are already baked into the yearly price).
    const trialApplied = cycle === "monthly" && trialEligible && (plan.price_cents ?? 0) > 0;

    // Trial length: per-store override defined by admin, else global default from app_settings.
    const { data: settings } = await supabase
      .from("app_settings")
      .select("trial_default_days")
      .eq("id", true)
      .maybeSingle();
    const trialDays = Math.min(
      365,
      Math.max(1, Number((store as any).trial_days_override ?? settings?.trial_default_days ?? 14)),
    );

    // Resolve price for chosen cycle.
    const yearlyAmount = plan.price_cents_yearly ?? (plan.price_cents ? plan.price_cents * 10 : null);
    const yearlyPriceId = plan.stripe_price_id_yearly ?? null;
    const useYearly = cycle === "yearly" && (yearlyPriceId || yearlyAmount);
    if (cycle === "yearly" && !useYearly) {
      return new Response(JSON.stringify({ error: "Plano anual não disponível para este plano." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(env("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // reuse customer if known, otherwise look up by email
    let customerId: string | undefined = current?.stripe_customer_id ?? undefined;
    // Never match an existing Stripe customer by e-mail (unverified addresses could hijack billing).

    const ALLOWED_ORIGINS = ["https://ofertasfly.com.br", "https://www.ofertasfly.com.br", "https://ofertasfly.lovable.app"];
    const reqOrigin = req.headers.get("origin") ?? "";
    const origin = ALLOWED_ORIGINS.includes(reqOrigin) || /^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(reqOrigin) || /^http:\/\/localhost:\d+$/.test(reqOrigin)
      ? reqOrigin
      : "https://ofertasfly.com.br";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      payment_method_collection: trialApplied ? "always" : undefined,
      line_items: [
        useYearly
          ? (yearlyPriceId
              ? { price: yearlyPriceId, quantity: 1 }
              : {
                  price_data: {
                    currency: "brl",
                    product_data: { name: `OfertasFly - Plano ${plan.name} (Anual)` },
                    unit_amount: yearlyAmount!,
                    recurring: { interval: "year" },
                  },
                  quantity: 1,
                })
          : (plan.stripe_price_id
              ? { price: plan.stripe_price_id, quantity: 1 }
              : {
                  price_data: {
                    currency: "brl",
                    product_data: { name: `OfertasFly - Plano ${plan.name}` },
                    unit_amount: plan.price_cents,
                    recurring: { interval: "month" },
                  },
                  quantity: 1,
                }),
      ],
      metadata: { user_id: user.id, store_id, plan_id, cycle, trial_applied: String(trialApplied) },
      subscription_data: {
        metadata: { user_id: user.id, store_id, plan_id, cycle, trial_applied: String(trialApplied) },
        ...(trialApplied
          ? {
              trial_period_days: trialDays,
              trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
            }
          : {}),
      },
      success_url: `${origin}/painel-lojista/assinatura?success=1${trialApplied ? "&trial=1" : ""}`,
      cancel_url: `${origin}/painel-lojista/assinatura?checkout_canceled=1`,
    });

    return new Response(JSON.stringify({ url: session.url, trial_applied: trialApplied, trial_days: trialDays }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "internal error" }), { status: 500, headers: corsHeaders });
  }
};

const ADDONS = {
  ai_assist: { cents: 1900, name: "OfertasFly - Assistente de IA", rpc: "store_has_ai_assist", owned: "Sua loja já tem o Assistente de IA.", anchor: "addon=1" },
  managed_offers: { cents: 5900, name: "OfertasFly - Ofertas Gerenciadas", rpc: null, owned: "Sua loja já tem o serviço de Ofertas Gerenciadas.", anchor: "addon=managed" },
} as const;

async function addonCheckout(req: Request, supabase: any, user: { id: string; email?: string }, store_id: string, addon: keyof typeof ADDONS): Promise<Response> {
  const cfg = ADDONS[addon];
  const h = { ...corsHeaders, "Content-Type": "application/json" };
  const { data: store } = await supabase.from("stores").select("id,owner_id").eq("id", store_id).maybeSingle();
  if (!store || store.owner_id !== user.id) return new Response(JSON.stringify({ error: "invalid" }), { status: 403, headers: h });
  if (addon === "managed_offers") {
    const { data: paid } = await supabase.rpc("store_has_paid_plan", { p_store_id: store_id });
    if (!paid) return new Response(JSON.stringify({ error: "Disponível apenas para planos Starter, Destaque e Plus." }), { status: 403, headers: h });
    const { data: existing } = await supabase.from("store_addons").select("id").eq("store_id", store_id).eq("addon", "managed_offers").in("status", ["active", "trialing"]).limit(1);
    if (existing?.length) return new Response(JSON.stringify({ error: cfg.owned }), { status: 400, headers: h });
  } else {
    const { data: has } = await supabase.rpc("store_has_ai_assist", { p_store_id: store_id });
    if (has) return new Response(JSON.stringify({ error: cfg.owned }), { status: 400, headers: h });
  }
  const { data: subs } = await supabase.from("subscriptions").select("stripe_customer_id").eq("store_id", store_id).not("stripe_customer_id", "is", null).limit(1);
  const customerId: string | undefined = subs?.[0]?.stripe_customer_id ?? undefined;
  const stripe = new Stripe(env("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20", httpClient: Stripe.createFetchHttpClient() });
  const reqOrigin = req.headers.get("origin") ?? "";
  const origin = /^https:\/\/(www\.)?ofertasfly\.com\.br$/.test(reqOrigin) || /^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(reqOrigin) || /^http:\/\/localhost:\d+$/.test(reqOrigin)
    ? reqOrigin : "https://ofertasfly.com.br";
  const meta = { user_id: user.id, store_id, addon };
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    customer_email: customerId ? undefined : user.email,
    line_items: [{
      price_data: {
        currency: "brl",
        product_data: { name: cfg.name },
        unit_amount: cfg.cents,
        recurring: { interval: "month" },
      },
      quantity: 1,
    }],
    metadata: meta,
    subscription_data: { metadata: meta },
    success_url: `${origin}/painel-lojista/assinatura?${cfg.anchor}`,
    cancel_url: `${origin}/painel-lojista/assinatura?checkout_canceled=1`,
  });
  return new Response(JSON.stringify({ url: session.url }), { headers: h });
}
