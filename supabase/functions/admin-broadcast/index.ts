// Admin envia push para todos inscritos.
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
    const { data: roles } = await admin.from("user_roles")
      .select("role").eq("user_id", userData.user.id).eq("role", "admin").limit(1);
    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, body, url, marketing } = await req.json();
    if (!title || !body) {
      return new Response(JSON.stringify({ error: "title and body required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let userIds: string[] | undefined;
    if (marketing) {
      const { data: prefs } = await admin.from("notification_preferences")
        .select("user_id").eq("marketing", true);
      userIds = (prefs ?? []).map((p) => p.user_id);
      if (userIds.length === 0) {
        return new Response(JSON.stringify({ ok: true, recipients: 0, success: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let q = admin.from("push_subscriptions").select("endpoint, p256dh, auth");
    if (userIds) q = q.in("user_id", userIds);
    const { data: subs } = await q;
    const list = (subs ?? []) as PushSub[];

    const results = await sendPushBatch(list, {
      title, body, url: url || "/", icon: "/icons/icon-192.png",
    });
    const success = results.filter((r) => r.ok).length;
    const toRemove = results.filter((r) => r.remove).map((r) => r.endpoint);
    if (toRemove.length > 0) {
      await admin.from("push_subscriptions").delete().in("endpoint", toRemove);
    }

    await admin.from("notifications_log").insert({
      audience: "broadcast",
      store_id: null, sent_by: userData.user.id,
      title, body, url: url ?? null,
      recipients_count: list.length, success_count: success,
    });

    return new Response(JSON.stringify({
      ok: true, recipients: list.length, success,
      statuses: results.map((r) => r.status),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
