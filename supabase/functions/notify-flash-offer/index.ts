// Sends push notifications for flash offers.
// Auth: requires authenticated user. Allowed callers:
//   - Store owner: audience must be "store_followers", offer must belong to their store.
//   - Admin: any audience ("store_followers" or "broadcast").
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendPushBatch, PushSub } from "../_shared/web-push.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims?.sub) return json({ error: "unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const { offer_id, audience = "store_followers" } = body as {
      offer_id?: string;
      audience?: "store_followers" | "broadcast";
    };
    if (!offer_id) return json({ error: "offer_id required" }, 400);
    if (audience !== "store_followers" && audience !== "broadcast") {
      return json({ error: "invalid audience" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    const { data: offer } = await admin
      .from("offers")
      .select("id,title,description,is_flash,flash_duration_hours,flash_ends_at,store_id")
      .eq("id", offer_id)
      .maybeSingle();
    if (!offer) return json({ error: "offer not found" }, 404);

    const { data: store } = await admin
      .from("stores")
      .select("id,name,owner_id")
      .eq("id", offer.store_id)
      .maybeSingle();
    if (!store) return json({ error: "store not found" }, 404);

    const isOwner = store.owner_id === userId;
    if (!isAdmin && !isOwner) return json({ error: "forbidden" }, 403);
    if (audience === "broadcast" && !isAdmin) {
      return json({ error: "broadcast requires admin" }, 403);
    }

    const audienceTag = offer.is_flash
      ? audience === "broadcast" ? "flash_broadcast" : "flash_followers"
      : audience === "broadcast" ? "broadcast" : "store_followers";

    // Owners limited to 2 sends per offer (1 auto + 1 manual)
    if (isOwner && !isAdmin) {
      const { count } = await admin
        .from("notifications_log")
        .select("id", { count: "exact", head: true })
        .eq("offer_id", offer_id)
        .eq("audience", audienceTag);
      if ((count ?? 0) >= 2) return json({ error: "send limit reached" }, 429);
    }

    // Resolve recipients
    let userIds: string[] = [];
    if (audience === "store_followers") {
      const { data: followers } = await admin
        .from("store_followers")
        .select("user_id")
        .eq("store_id", store.id);
      userIds = (followers ?? []).map((f) => f.user_id);
      if (userIds.length > 0) {
        const { data: prefs } = await admin
          .from("notification_preferences")
          .select("user_id, new_offers_followed_stores")
          .in("user_id", userIds);
        const prefIds = new Set((prefs ?? []).map((p) => p.user_id));
        const optedIn = new Set(
          (prefs ?? []).filter((p) => p.new_offers_followed_stores !== false).map((p) => p.user_id),
        );
        userIds = userIds.filter((id) => !prefIds.has(id) || optedIn.has(id));
      }
    }

    let q = admin.from("push_subscriptions").select("endpoint, p256dh, auth, user_id");
    if (audience === "store_followers") {
      if (userIds.length === 0) {
        await admin.from("notifications_log").insert({
          audience: audienceTag,
          store_id: store.id,
          offer_id,
          sent_by: userId,
          title: "(skipped: no recipients)",
          body: "",
          recipients_count: 0,
          success_count: 0,
        });
        return json({ ok: true, recipients: 0, success: 0 });
      }
      q = q.in("user_id", userIds);
    }
    const { data: subs } = await q;
    const list = (subs ?? []) as PushSub[];

    const hoursLeft = offer.flash_ends_at
      ? Math.max(1, Math.round((new Date(offer.flash_ends_at).getTime() - Date.now()) / 3_600_000))
      : (offer.flash_duration_hours ?? 2);
    const title = offer.is_flash
      ? `⚡ Oferta relâmpago: ${offer.title}`
      : `Oferta: ${offer.title}`;
    const bodyText = offer.is_flash
      ? `${store.name} • Acaba em ${hoursLeft}h. Aproveite!`
      : (offer.description?.slice(0, 120) || `${store.name} • confira agora!`);
    const url = `/oferta/${offer_id}`;

    const results = await sendPushBatch(list, {
      title,
      body: bodyText,
      url,
      icon: "/icons/icon-192.png",
      tag: `offer-${offer_id}`,
    });
    const success = results.filter((r) => r.ok).length;
    const toRemove = results.filter((r) => r.remove).map((r) => r.endpoint);
    if (toRemove.length > 0) {
      await admin.from("push_subscriptions").delete().in("endpoint", toRemove);
    }

    await admin.from("notifications_log").insert({
      audience: audienceTag,
      store_id: store.id,
      offer_id,
      sent_by: userId,
      title,
      body: bodyText,
      url,
      recipients_count: list.length,
      success_count: success,
    });

    return json({ ok: true, recipients: list.length, success });
  } catch (e) {
    console.error("notify-flash-offer error", e);
    return json({ error: String(e) }, 500);
  }
});
