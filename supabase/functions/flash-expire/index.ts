// Pauses flash offers whose window has ended. Public endpoint (verify_jwt = false)
// — safe because it only updates expired flash offers and is idempotent.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await admin
      .from("offers")
      .update({ status: "paused" })
      .eq("is_flash", true)
      .eq("status", "approved")
      .lt("flash_ends_at", new Date().toISOString())
      .select("id");
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true, expired: data?.length ?? 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("flash-expire error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
