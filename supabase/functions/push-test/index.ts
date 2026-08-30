// Envia uma notificação de teste apenas para os dispositivos do próprio usuário.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendPushBatch, PushSub } from "../_shared/web-push.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: subs } = await admin.from("push_subscriptions")
      .select("endpoint, p256dh, auth").eq("user_id", userData.user.id);
    const list = (subs ?? []) as PushSub[];
    if (list.length === 0) {
      return new Response(JSON.stringify({ ok: true, recipients: 0, success: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = await sendPushBatch(list, {
      title: "Teste de notificação",
      body: "Se você está vendo isso, as notificações estão funcionando.",
      url: "/notificacoes",
      icon: "/icons/icon-192.png",
      tag: "push-test",
    });
    const toRemove = results.filter((r) => r.remove).map((r) => r.endpoint);
    if (toRemove.length > 0) {
      await admin.from("push_subscriptions").delete().in("endpoint", toRemove);
    }

    return new Response(JSON.stringify({
      ok: true,
      recipients: list.length,
      success: results.filter((r) => r.ok).length,
      removed: toRemove.length,
      statuses: results.map((r) => r.status),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
