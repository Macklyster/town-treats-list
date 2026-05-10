import { supabase } from "@/integrations/supabase/client";

export type UIOffer = {
  id: string;
  title: string;
  storeId: string;
  storeName: string;
  storeSlug?: string;
  storeLogo?: string;
  storeFeaturedBadge?: boolean;
  category: string;
  type: "desconto" | "cupom" | "brinde";
  image: string;
  originalPrice: number;
  promoPrice: number;
  description: string;
  conditions: string;
  validUntil: string;
  featured: boolean;
  popularity: number;
  createdAt: string;
};

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80";

const mapRow = (row: any): UIOffer => ({
  id: row.id,
  title: row.title,
  storeId: row.store_id,
  storeName: row.store?.name ?? "Loja",
  storeSlug: row.store?.slug,
  storeLogo: row.store?.logo_url ?? undefined,
  storeFeaturedBadge: !!row.store?.featured_badge,
  category: row.category_slug,
  type: row.type,
  image: row.image_url || FALLBACK_IMG,
  originalPrice: Number(row.original_price) || 0,
  promoPrice: Number(row.promo_price) || 0,
  description: row.description ?? "",
  conditions: row.conditions ?? "",
  validUntil: row.valid_until
    ? new Date(row.valid_until).toLocaleDateString("pt-BR")
    : "",
  featured: !!row.featured,
  popularity: row.popularity ?? 0,
  createdAt: row.created_at,
});

export type CityFilter = { city: string; state: string } | null;

export const fetchOffers = async (filter?: CityFilter): Promise<UIOffer[]> => {
  let query = supabase
    .from("offers")
    .select("*, store:stores!inner(name,slug,city,state,logo_url,featured_badge)")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (filter?.city) {
    query = query.eq("store.city", filter.city);
    if (filter.state) query = query.eq("store.state", filter.state);
  }
  const { data, error } = await query;
  if (error) {
    console.error(error);
    return [];
  }
  return (data ?? []).map(mapRow);
};

export const fetchOfferById = async (id: string): Promise<UIOffer | null> => {
  const { data } = await supabase
    .from("offers")
    .select("*, store:stores(name,slug,city,state,logo_url,featured_badge)")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();
  return data ? mapRow(data) : null;
};

export const fetchStoreById = async (id: string) => {
  const { data } = await supabase.from("stores").select("*").eq("id", id).maybeSingle();
  return data;
};

export const discountPct = (o: { originalPrice: number; promoPrice: number }) =>
  o.originalPrice > 0 && o.promoPrice < o.originalPrice
    ? Math.round((1 - o.promoPrice / o.originalPrice) * 100)
    : 0;

export const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
