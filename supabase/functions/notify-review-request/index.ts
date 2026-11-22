// Cron diário: envia push para review_prompts elegíveis ainda não notificados há ≥6h.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendPushBatch, PushSub } from "../_shared/web-push.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret || req.headers.get("x-cron-secret") !== cronSecret) {
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

    const sixHoursAgo = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
    const { data: prompts } = await admin
      .from("review_prompts")
      .select("id, user_id, offer_id, store_id, eligible_at, notified_at")
      .lte("eligible_at", new Date().toISOString())
      .is("notified_at", null)
      .eq("dismissed_permanently", false)
      .lte("created_at", sixHoursAgo)
      .limit(500);

    if (!prompts || prompts.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter: skip prompts where review already exists
    const offerIds = [...new Set(prompts.map((p) => p.offer_id))];
    const userIds = [...new Set(prompts.map((p) => p.user_id))];

    const [{ data: reviews }, { data: storeRows }, { data: subs }] = await Promise.all([
      admin.from("offer_reviews").select("user_id, offer_id").in("offer_id", offerIds).in("user_id", userIds),
      admin.from("stores").select("id, name").in("id", [...new Set(prompts.map((p) => p.store_id))]),
      admin.from("push_subscriptions").select("user_id, endpoint, p256dh, auth").in("user_id", userIds),
    ]);
    const reviewed = new Set((reviews ?? []).map((r) => `${r.user_id}|${r.offer_id}`));
    const storeMap = new Map((storeRows ?? []).map((s) => [s.id, s.name]));
    const subsByUser = new Map<string, PushSub[]>();
    for (const s of subs ?? []) {
      if (!subsByUser.has(s.user_id)) subsByUser.set(s.user_id, []);
      subsByUser.get(s.user_id)!.push({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth });
    }

    let sent = 0;
    const notifiedIds: string[] = [];
    for (const p of prompts) {
      if (reviewed.has(`${p.user_id}|${p.offer_id}`)) {
        notifiedIds.push(p.id);
        continue;
      }
      const userSubs = subsByUser.get(p.user_id) ?? [];
      if (userSubs.length === 0) {
        notifiedIds.push(p.id);
        continue;
      }
      const storeName = storeMap.get(p.store_id) ?? "loja";
      const results = await sendPushBatch(userSubs, {
        title: "Como foi sua experiência?",
        body: `Conte aos outros clientes como foi na ${storeName}.`,
        url: `/oferta/${p.offer_id}?review=1`,
        icon: "/icons/icon-192.png",
        tag: `review-${p.offer_id}`,
      });
      sent += results.filter((r) => r.ok).length;
      const toRemove = results.filter((r) => r.remove).map((r) => r.endpoint);
      if (toRemove.length > 0) {
        await admin.from("push_subscriptions").delete().in("endpoint", toRemove);
      }
      notifiedIds.push(p.id);
    }

    if (notifiedIds.length > 0) {
      await admin
        .from("review_prompts")
        .update({ notified_at: new Date().toISOString() })
        .in("id", notifiedIds);
    }

    return new Response(JSON.stringify({ ok: true, processed: prompts.length, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
