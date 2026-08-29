// Expira pontos de fidelidade vencidos e avisa clientes com pontos a vencer.
// Endpoint idempotente (verify_jwt = false), protegido por CRON_SECRET quando definido.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendPush } from "../_shared/web-push.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) expira pontos vencidos
    const { data: expired, error: expErr } = await admin.rpc("loyalty_expire_points");
    if (expErr) throw expErr;

    // 2) avisa quem tem pontos vencendo nos próximos 7 dias
    const { data: soon, error: soonErr } = await admin.rpc("loyalty_expiring_soon", {
      p_days: 7,
    });
    if (soonErr) throw soonErr;

    let notified = 0;
    for (const row of (soon ?? []) as any[]) {
      const { data: prefs } = await admin
        .from("notification_preferences")
        .select("marketing")
        .eq("user_id", row.user_id)
        .maybeSingle();
      if (prefs && prefs.marketing === false) continue;

      const { data: subs } = await admin
        .from("push_subscriptions")
        .select("endpoint,p256dh,auth")
        .eq("user_id", row.user_id);
      if (!subs?.length) continue;

      const payload = {
        title: "Seus FlyPontos vão expirar",
        body: `Você tem ${row.points} pontos em ${row.store_name} vencendo em breve. Troque por uma recompensa!`,
        url: "/fidelidade",
      };
      for (const s of subs as any[]) {
        try {
          await sendPush(s, payload);
          notified++;
        } catch (e) {
          console.error("push failed", e);
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, expired: expired ?? 0, notified }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("loyalty-expire-points error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
