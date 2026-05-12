import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const url = new URL(req.url);
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") ?? "20", 10) || 20,
      50,
    );

    const { data: stores, error } = await admin
      .from("stores")
      .select("id, address, city, state")
      .or("latitude.is.null,longitude.is.null")
      .eq("approved", true)
      .limit(limit);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<Record<string, unknown>> = [];

    for (const s of stores ?? []) {
      const parts = [s.address, s.city, s.state, "Brasil"]
        .map((p) => (p ?? "").toString().trim())
        .filter(Boolean);
      if (parts.length < 2) {
        results.push({ id: s.id, skipped: "endereço insuficiente" });
        continue;
      }
      const q = parts.join(", ");
      const nUrl = new URL("https://nominatim.openstreetmap.org/search");
      nUrl.searchParams.set("q", q);
      nUrl.searchParams.set("format", "json");
      nUrl.searchParams.set("limit", "1");
      nUrl.searchParams.set("countrycodes", "br");

      try {
        const resp = await fetch(nUrl.toString(), {
          headers: {
            "User-Agent": "OfertasFly/1.0 (contato@ofertasfly.com.br)",
            "Accept-Language": "pt-BR",
          },
        });
        if (!resp.ok) {
          results.push({ id: s.id, error: `nominatim ${resp.status}` });
        } else {
          const arr = (await resp.json()) as Array<{ lat: string; lon: string }>;
          if (!arr.length) {
            results.push({ id: s.id, error: "not found", query: q });
          } else {
            const lat = parseFloat(arr[0].lat);
            const lng = parseFloat(arr[0].lon);
            const { error: updErr } = await admin
              .from("stores")
              .update({ latitude: lat, longitude: lng })
              .eq("id", s.id);
            if (updErr) results.push({ id: s.id, error: updErr.message });
            else results.push({ id: s.id, latitude: lat, longitude: lng });
          }
        }
      } catch (e) {
        results.push({
          id: s.id,
          error: e instanceof Error ? e.message : String(e),
        });
      }

      // Nominatim usage policy: max 1 req/s
      await new Promise((r) => setTimeout(r, 1100));
    }

    return new Response(
      JSON.stringify({
        ok: true,
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
