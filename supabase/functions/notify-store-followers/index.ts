// Lojista autenticado dispara push para seguidores da loja.
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

    const { store_id, offer_id, title, body, url } = await req.json();
    if (!store_id || !title || !body) {
      return new Response(JSON.stringify({ error: "invalid payload" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verifica ownership da loja
    const { data: store } = await admin.from("stores")
      .select("id, owner_id, name").eq("id", store_id).maybeSingle();
    if (!store || store.owner_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Dedup por oferta
    if (offer_id) {
      const { data: prev } = await admin.from("notifications_log")
        .select("id").eq("audience", "store_followers")
        .eq("store_id", store_id).eq("offer_id", offer_id).limit(1);
      if (prev && prev.length > 0) {
        return new Response(JSON.stringify({ error: "already sent for this offer" }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Pega seguidores e respeita preferência new_offers_followed_stores
    const { data: followers } = await admin.from("store_followers")
      .select("user_id").eq("store_id", store_id);
    const userIds = (followers ?? []).map((f) => f.user_id);
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, recipients: 0, success: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: prefs } = await admin.from("notification_preferences")
      .select("user_id, new_offers_followed_stores").in("user_id", userIds);
    const optedIn = new Set(
      (prefs ?? [])
        .filter((p) => p.new_offers_followed_stores !== false)
        .map((p) => p.user_id),
    );
    // Inclui usuários sem linha de preferência (default true)
    const prefIds = new Set((prefs ?? []).map((p) => p.user_id));
    const finalUserIds = userIds.filter((id) => !prefIds.has(id) || optedIn.has(id));

    if (finalUserIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, recipients: 0, success: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: subs } = await admin.from("push_subscriptions")
      .select("endpoint, p256dh, auth").in("user_id", finalUserIds);
    const subList = (subs ?? []) as PushSub[];

    const results = await sendPushBatch(subList, {
      title, body,
      url: url || (offer_id ? `/oferta/${offer_id}` : "/"),
      icon: "/icons/icon-192.png",
      tag: offer_id ? `offer-${offer_id}` : undefined,
    });

    const success = results.filter((r) => r.ok).length;
    const toRemove = results.filter((r) => r.remove).map((r) => r.endpoint);
    if (toRemove.length > 0) {
      await admin.from("push_subscriptions").delete().in("endpoint", toRemove);
    }

    await admin.from("notifications_log").insert({
      audience: "store_followers",
      store_id, offer_id: offer_id ?? null, sent_by: userData.user.id,
      title, body, url: url ?? null,
      recipients_count: subList.length, success_count: success,
    });

    return new Response(JSON.stringify({
      ok: true, recipients: subList.length, success,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
