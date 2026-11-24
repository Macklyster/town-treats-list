import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

/** Public read of admin SEO overrides for one page (sessionless publishable client). */
export const loadSeoOverrides = createServerFn({ method: "GET" })
  .inputValidator(z.object({ type: z.enum(["store", "category", "offer", "event"]), key: z.string().max(200) }))
  .handler(async ({ data }) => {
    const url = process.env['SUPABASE_URL'];
    const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    if (!url || !key) return [];
    const client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      } },
    });
    const { data: rows, error } = await client.from("seo_overrides")
      .select("city,title,description,keywords,image_url")
      .eq("entity_type", data.type).eq("entity_key", data.key);
    if (error) { console.error("seo overrides", error); return []; }
    return rows ?? [];
  });
