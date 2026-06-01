import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_RENEWALS = 6;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== cronSecret) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const { data: offers, error } = await supabase
      .from("offers")
      .select("id, store_id, title, valid_until, auto_renew_days, auto_renew_count")
      .eq("status", "approved")
      .eq("auto_renew", true)
      .lt("valid_until", todayStr)
      .lt("auto_renew_count", MAX_RENEWALS);

    if (error) throw error;

    let renewed = 0;
    let limitReached = 0;

    for (const o of offers ?? []) {
      const days = Math.max(1, Math.min(30, o.auto_renew_days ?? 7));
      const newDate = new Date();
      newDate.setUTCDate(newDate.getUTCDate() + days);
      const newValid = newDate.toISOString().slice(0, 10);

      const { error: upErr } = await supabase
        .from("offers")
        .update({
          valid_until: newValid,
          auto_renew_count: (o.auto_renew_count ?? 0) + 1,
          last_auto_renewed_at: new Date().toISOString(),
        })
        .eq("id", o.id);

      if (!upErr) renewed++;

      if ((o.auto_renew_count ?? 0) + 1 >= MAX_RENEWALS) limitReached++;
    }

    // Disable auto_renew for offers that hit the limit (next pass won't pick them up anyway, but make it explicit)
    await supabase
      .from("offers")
      .update({ auto_renew: false })
      .gte("auto_renew_count", MAX_RENEWALS)
      .eq("auto_renew", true);

    return new Response(
      JSON.stringify({ ok: true, processed: offers?.length ?? 0, renewed, limitReached }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("auto-renew-offers error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
