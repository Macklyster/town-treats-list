// Public sitemap.xml generator (no auth required)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE_URL = "https://ofertasfly.com.br";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripDiacritics = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const slugify = (s: string) =>
  stripDiacritics(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const citySlug = (city: string, state: string) => {
  const base = slugify(city);
  const uf = (state || "").toLowerCase();
  return uf ? `${base}-${uf}` : base;
};
const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

type UrlEntry = { loc: string; lastmod?: string; changefreq?: string; priority?: number };

const renderXml = (urls: UrlEntry[]) => {
  const body = urls
    .map(
      (u) =>
        `  <url><loc>${escapeXml(u.loc)}</loc>` +
        (u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : "") +
        (u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : "") +
        (u.priority !== undefined ? `<priority>${u.priority.toFixed(1)}</priority>` : "") +
        `</url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const urls: UrlEntry[] = [
      { loc: `${SITE_URL}/`, changefreq: "daily", priority: 1.0 },
      { loc: `${SITE_URL}/anuncie`, changefreq: "weekly", priority: 0.7 },
      { loc: `${SITE_URL}/coletivas`, changefreq: "daily", priority: 0.6 },
      { loc: `${SITE_URL}/leiloes`, changefreq: "daily", priority: 0.6 },
      { loc: `${SITE_URL}/ofertas-invisiveis`, changefreq: "daily", priority: 0.6 },
      { loc: `${SITE_URL}/eventos`, changefreq: "daily", priority: 0.6 },
      { loc: `${SITE_URL}/fidelidade/como-funciona`, changefreq: "monthly", priority: 0.6 },
      { loc: `${SITE_URL}/termos-de-uso`, changefreq: "yearly", priority: 0.2 },
      { loc: `${SITE_URL}/politica-de-privacidade`, changefreq: "yearly", priority: 0.2 },
    ];

    // Approved upcoming events -> /evento/:slug
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("slug,updated_at")
      .eq("status", "approved")
      .gt("ends_at", new Date().toISOString());
    if (eventsError) throw eventsError;
    (events ?? []).forEach((e: any) => {
      if (e.slug) urls.push({ loc: `${SITE_URL}/evento/${e.slug}`, lastmod: e.updated_at ? e.updated_at.slice(0, 10) : undefined, changefreq: "daily", priority: 0.6 });
    });

    // Approved stores -> /loja/:slug + collect cities
    const { data: stores } = await supabase
      .from("stores")
      .select("slug,city,state,updated_at")
      .eq("approved", true);

    const cityMap = new Map<string, { city: string; state: string }>();
    (stores ?? []).forEach((s: any) => {
      if (s.slug) {
        urls.push({
          loc: `${SITE_URL}/loja/${s.slug}`,
          lastmod: s.updated_at ? s.updated_at.slice(0, 10) : undefined,
          changefreq: "weekly",
          priority: 0.6,
        });
      }
      const c = (s.city ?? "").trim();
      const st = (s.state ?? "").trim().toUpperCase();
      if (c && c !== "Não informado") {
        const key = `${c}|${st}`;
        if (!cityMap.has(key)) cityMap.set(key, { city: c, state: st });
      }
    });

    // Approved offers (with category + city) -> /oferta/:id and city+category combos
    const { data: offers } = await supabase
      .from("offers")
      .select("id,category_slug,updated_at,store:stores!inner(city,state,approved)")
      .eq("status", "approved");

    const cityCatSet = new Set<string>();
    (offers ?? []).forEach((o: any) => {
      urls.push({
        loc: `${SITE_URL}/oferta/${o.id}`,
        lastmod: o.updated_at ? o.updated_at.slice(0, 10) : undefined,
        changefreq: "weekly",
        priority: 0.7,
      });
      const c = (o.store?.city ?? "").trim();
      const st = (o.store?.state ?? "").trim().toUpperCase();
      if (c && c !== "Não informado" && o.store?.approved) {
        cityCatSet.add(`${citySlug(c, st)}|${o.category_slug}`);
      }
    });

    // City pages
    Array.from(cityMap.values()).forEach((c) => {
      urls.push({
        loc: `${SITE_URL}/ofertas/${citySlug(c.city, c.state)}`,
        changefreq: "daily",
        priority: 0.9,
      });
    });

    // City + category pages
    Array.from(cityCatSet).forEach((key) => {
      const [cSlug, catSlug] = key.split("|");
      urls.push({
        loc: `${SITE_URL}/ofertas/${cSlug}/${catSlug}`,
        changefreq: "daily",
        priority: 0.8,
      });
    });

    return new Response(renderXml(urls), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("sitemap error", err);
    return new Response(`<?xml version="1.0"?><error>${(err as Error).message}</error>`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  }
});
