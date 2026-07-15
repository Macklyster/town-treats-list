// Notifica seguidores da loja + usuários que selecionaram a cidade do evento
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

    const { event_id } = await req.json();
    if (!event_id) {
      return new Response(JSON.stringify({ error: "invalid payload" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verifica papel admin do chamador
    const { data: roleRow } = await admin.from("user_roles")
      .select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: event } = await admin.from("events")
      .select("id, store_id, title, slug, city, state, kind, image_url, cover_url, status")
      .eq("id", event_id).maybeSingle();
    if (!event || event.status !== "approved") {
      return new Response(JSON.stringify({ error: "event not approved" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Dedup por evento
    const { data: prev } = await admin.from("notifications_log")
      .select("id").eq("audience", "event_broadcast").eq("offer_id", event_id).limit(1);
    if (prev && prev.length > 0) {
      return new Response(JSON.stringify({ error: "already sent for this event" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) Seguidores da loja
    const followerIds = new Set<string>();
    if (event.store_id) {
      const { data: followers } = await admin.from("store_followers")
        .select("user_id").eq("store_id", event.store_id);
      (followers ?? []).forEach((f) => followerIds.add(f.user_id));
    }

    // 2) Usuários com cidade selecionada = cidade do evento
    // Usamos profiles.city como referência
    const { data: cityProfiles } = await admin.from("profiles")
      .select("id").eq("city", event.city);
    (cityProfiles ?? []).forEach((p) => followerIds.add(p.id));

    if (followerIds.size === 0) {
      return new Response(JSON.stringify({ ok: true, recipients: 0, success: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = Array.from(followerIds);

    // Respeita preferência "events"
    const { data: prefs } = await admin.from("notification_preferences")
      .select("user_id, events").in("user_id", userIds);
    const prefMap = new Map<string, boolean>();
    (prefs ?? []).forEach((p: any) => prefMap.set(p.user_id, p.events !== false));
    const finalIds = userIds.filter((id) => (prefMap.get(id) ?? true));

    if (finalIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, recipients: 0, success: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: subs } = await admin.from("push_subscriptions")
      .select("endpoint, p256dh, auth").in("user_id", finalIds);
    const subList = (subs ?? []) as PushSub[];

    const KIND_EMOJI: Record<string, string> = {
      happy_hour: "🍹",
      show: "🎤",
      feira: "🛍️",
      evento: "🎉",
      promocao: "🏷️",
    };

    const title = `${KIND_EMOJI[event.kind] ?? "🎉"} ${event.title}`;
    const body = `Novo evento em ${event.city}. Confira e garanta seu rolê!`;
    const url = `/evento/${event.slug}`;

    const results = await sendPushBatch(subList, {
      title, body, url,
      icon: event.image_url || event.cover_url || "/icons/icon-192.png",
      tag: `event-${event.id}`,
    });

    const success = results.filter((r) => r.ok).length;
    const toRemove = results.filter((r) => r.remove).map((r) => r.endpoint);
    if (toRemove.length > 0) {
      await admin.from("push_subscriptions").delete().in("endpoint", toRemove);
    }

    await admin.from("notifications_log").insert({
      audience: "event_broadcast",
      store_id: event.store_id ?? null,
      offer_id: event_id,
      sent_by: userData.user.id,
      title, body, url,
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
