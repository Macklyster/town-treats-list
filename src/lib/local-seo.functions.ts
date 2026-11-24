import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { agendaCities, type PublicAgendaEvent, type PublicBusiness } from "@/lib/local-seo";
import { z } from "zod";

export const loadLocalSeo = createServerFn({ method: "GET" })
  .inputValidator(z.object({ type: z.enum(["agenda", "event", "store"]), slug: z.string().max(200).optional() }))
  .handler(async ({ data }) => {
    const url = process.env['SUPABASE_URL'];
    const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    if (!url || !key) throw new Error("Não foi possível carregar a agenda.");
    const client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      } },
    });
    const eventFields = "id,slug,title,description,kind,cover_url,image_url,venue,address,city,state,starts_at,ends_at,latitude,longitude,price_info,link_url,featured,store:stores(id,name,slug,logo_url,featured_badge)";
    if (data.type === "store") {
      const result = await client.from("stores").select("name,slug,description,city,state,address,phone,logo_url,cover_url,latitude,longitude,website").eq("approved", true).eq("slug", data.slug ?? "").maybeSingle();
      if (result.error) throw result.error;
      return { store: result.data as PublicBusiness | null, events: [] as PublicAgendaEvent[], cities: [] };
    }
    let query = client.from("events").select(eventFields).eq("status", "approved");
    if (data.type === "event") query = query.eq("slug", data.slug ?? "");
    else query = query.gt("ends_at", new Date().toISOString());
    const [result, stores] = await Promise.all([
      query.order("starts_at", { ascending: true }).limit(1000),
      data.type === "agenda" ? client.from("stores").select("city,state").eq("approved", true).limit(1000) : Promise.resolve({ data: [], error: null }),
    ]);
    if (result.error) throw result.error;
    if (stores.error) throw stores.error;
    const events = (result.data ?? []) as unknown as PublicAgendaEvent[];
    const cities = agendaCities([...(stores.data ?? []).map((row) => ({ city: row.city ?? "", state: row.state ?? "" })), ...events]);
    return { store: null as PublicBusiness | null, events, cities };
  });
