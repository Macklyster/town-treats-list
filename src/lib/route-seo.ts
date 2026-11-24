import { supabase } from "@/integrations/supabase/client";
import { loadLocalSeo } from "@/lib/local-seo.functions";
import { businessSchema, eventSchema, breadcrumbs, jsonLdScripts } from "@/lib/local-seo";
import { categories } from "@/data/categories";
import { loadSeoOverrides } from "@/lib/seo-overrides.functions";
import { applySeoOverride, pickOverride, type SeoEntityType } from "@/lib/seo-overrides";
import { absoluteUrl, cityLabel, citySlug, matchCityFromSlug, type CityLike } from "@/lib/slug";

/** Social/search metadata for one public page, rendered into the server HTML head. */
export type PageMeta = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: "website" | "product" | "article" | "profile";
  noindex?: boolean;
  jsonLd?: object[];
  omitDefaultImage?: boolean;
  keywords?: string[];
};

async function withOverride(meta: PageMeta | null, type: SeoEntityType, key: string, city?: string, label?: string): Promise<PageMeta | null> {
  if (!meta) return meta;
  try {
    const rows = await loadSeoOverrides({ data: { type, key } });
    const o = pickOverride(rows as any[], city);
    const next = applySeoOverride(meta, o, label);
    if (o?.image_url) next.omitDefaultImage = false;
    if (next.keywords?.length && next.jsonLd?.[0]) next.jsonLd = [{ ...(next.jsonLd[0] as object), keywords: next.keywords.join(", ") }, ...next.jsonLd.slice(1)];
    return next;
  } catch (e) {
    console.error("seo override", e);
    return meta;
  }
}

export const DEFAULT_SHARE_IMAGE = "https://ofertasfly.com.br/og-image.jpg?v=2";

export const clampTitle = (t: string) => (t.length > 60 ? `${t.slice(0, 57)}…` : t);
export const clampDescription = (d: string) => {
  const clean = d.replace(/\s+/g, " ").trim();
  return clean.length > 160 ? `${clean.slice(0, 157)}…` : clean;
};

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Builds TanStack head() meta/links from page metadata; children override the root defaults. */
export function buildHead(meta: PageMeta | null | undefined) {
  if (!meta) return {};
  const title = clampTitle(meta.title);
  const description = clampDescription(meta.description);
  const url = absoluteUrl(meta.path);
  const image = meta.image || (meta.omitDefaultImage ? null : DEFAULT_SHARE_IMAGE);
  const og = meta.type === "product" || meta.type === "profile" ? "website" : meta.type ?? "website";
  return {
    meta: [
      { title },
      { name: "description", content: description },
      ...(meta.keywords?.length ? [{ name: "keywords", content: meta.keywords.join(", ") }] : []),
      ...(meta.noindex ? [{ name: "robots", content: "noindex,nofollow" }] : []),
      { property: "og:type", content: og },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      ...(image ? [
        { property: "og:image", content: image },
        { property: "og:image:secure_url", content: image },
        { property: "og:image:alt", content: title },
      ] : []),
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      ...(image ? [{ name: "twitter:image", content: image }] : []),
    ],
    links: [{ rel: "canonical", href: url }],
    ...(meta.jsonLd ? { scripts: jsonLdScripts(meta.jsonLd) } : {}),
  };
}

const safe = async <T,>(fn: () => Promise<T>): Promise<T | null> => {
  try {
    return await fn();
  } catch (error) {
    console.error("route-seo", error);
    return null;
  }
};

export async function offerMeta(id: string): Promise<PageMeta | null> {
  return withOverride(await offerMetaAuto(id), "offer", id);
}

async function offerMetaAuto(id: string): Promise<PageMeta | null> {
  return safe(async () => {
    const { data } = await supabase
      .from("offers")
      .select("id,title,description,image_url,promo_price,original_price,type,store:stores(name,city,state)")
      .eq("id", id)
      .eq("status", "approved")
      .maybeSingle();
    if (!data) return null;
    const row = data as any;
    const store = row.store ?? {};
    const city: CityLike | null = store.city ? { city: store.city, state: store.state ?? "" } : null;
    const where = city ? ` em ${cityLabel(city)}` : "";
    const storeName = store.name ?? "Loja";
    const promo = Number(row.promo_price) || 0;
    const original = Number(row.original_price) || 0;
    const pct = original > promo && promo > 0 ? Math.round((1 - promo / original) * 100) : 0;
    const price =
      promo > 0
        ? `Por ${brl(promo)}${pct > 0 ? ` (${pct}% off)` : ""}. `
        : row.type === "brinde"
          ? "Brinde grátis. "
          : "";
    return {
      title: `${row.title} — ${storeName}${where} | OfertasFly`,
      description: `${price}${row.description || `${row.title} na ${storeName}${where}.`} Aproveite no OfertasFly.`,
      path: `/oferta/${row.id}`,
      image: row.image_url,
      type: "product",
    };
  });
}

export async function storeMeta(slug: string): Promise<PageMeta | null> {
  return withOverride(await storeMetaAuto(slug), "store", slug);
}

async function storeMetaAuto(slug: string): Promise<PageMeta | null> {
  return safe(async () => {
    const { store } = await loadLocalSeo({ data: { type: "store", slug } });
    if (!store) return null;
    const city: CityLike | null = store.city ? { city: store.city, state: store.state ?? "" } : null;
    const place = city ? cityLabel(city) : "sua cidade";
    return {
      title: `${store.name} — Ofertas em ${place} | OfertasFly`,
      description:
        store.description ||
        `${store.name} no OfertasFly: ofertas, cupons e descontos em ${city?.city ?? "sua cidade"}.`,
      path: `/loja/${store.slug}`,
      image: store.cover_url || store.logo_url,
      type: "profile",
      jsonLd: [businessSchema(store), breadcrumbs([
        { name: "Início", path: "/" },
        ...(city ? [{ name: cityLabel(city), path: `/ofertas/${citySlug(city)}` }] : []),
        { name: store.name, path: `/loja/${store.slug}` },
      ])],
    };
  });
}

export async function cityMeta(cidadeSlug: string, categoriaSlug?: string): Promise<PageMeta | null> {
  return safe(async () => {
    const { data } = await supabase.from("stores").select("id,city,state").eq("approved", true);
    const rows = (data ?? []) as { id: string; city: string | null; state: string | null }[];
    const cities: CityLike[] = [];
    const seen = new Set<string>();
    for (const r of rows) {
      const c = (r.city ?? "").trim();
      if (!c) continue;
      const key = `${c}|${r.state ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      cities.push({ city: c, state: (r.state ?? "").trim() });
    }
    const city = matchCityFromSlug(cidadeSlug, cities);
    if (!city) return null;
    const category = categoriaSlug ? categories.find((c) => c.slug === categoriaSlug) : undefined;
    if (categoriaSlug && !category) return null;
    const storeIds = rows
      .filter((r) => (r.city ?? "").trim() === city.city && (r.state ?? "").trim() === city.state)
      .map((r) => r.id);
    let count = 0;
    let image: string | null = null;
    if (storeIds.length) {
      let q = supabase
        .from("offers")
        .select("image_url", { count: "exact" })
        .eq("status", "approved")
        .in("store_id", storeIds)
        .order("created_at", { ascending: false })
        .limit(1);
      if (category) q = q.eq("category_slug", category.slug);
      const res = await q;
      count = res.count ?? 0;
      image = (res.data?.[0] as any)?.image_url ?? null;
    }
    const label = cityLabel(city);
    const n = `${count} oferta${count === 1 ? "" : "s"}`;
    const base = `/ofertas/${citySlug(city)}`;
    if (category) {
      return withOverride({
          title: `${category.name} em ${label} — Ofertas e Cupons | OfertasFly`,
          description: `${n} de ${category.name.toLowerCase()} em ${label}. Descontos, cupons e brindes do comércio local no OfertasFly.`,
          path: `${base}/${category.slug}`,
          image,
        }, "category", category.slug, city.city, label);
    }
    return {
          title: `Ofertas em ${label} — Cupons e Descontos | OfertasFly`,
          description: `Encontre as melhores ofertas, cupons e descontos em ${label}. ${n} ativa${count === 1 ? "" : "s"} do comércio local.`,
          path: base,
          image,
        };
  });
}

export async function eventMeta(slug: string): Promise<PageMeta | null> {
  return withOverride(await eventMetaAuto(slug), "event", slug);
}

async function eventMetaAuto(slug: string): Promise<PageMeta | null> {
  return safe(async () => {
    const { events } = await loadLocalSeo({ data: { type: "event", slug } });
    const ev = events[0];
    if (!ev) return null;
    const when = ev.starts_at ? new Date(ev.starts_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "";
    return {
      title: `${ev.title}${ev.city ? ` — ${ev.city}` : ""} | OfertasFly`,
      description: ev.description || `Evento${ev.city ? ` em ${ev.city}` : ""}${when ? ` em ${when}` : ""}. Veja detalhes no OfertasFly.`,
      path: `/evento/${ev.slug ?? slug}`,
      image: ev.cover_url || ev.image_url,
      type: "article",
      jsonLd: [eventSchema(ev), breadcrumbs([
        { name: "Início", path: "/" }, { name: "Eventos", path: "/eventos" },
        { name: ev.title, path: `/evento/${ev.slug}` },
      ])],
    };
  });
}
