import { supabase } from "@/integrations/supabase/client";
import { UIOffer, fetchOffers } from "@/lib/offers-api";

export type UICompany = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  category_slug: string | null;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  featured_badge: boolean;
  approved: boolean;
  cover_url?: string | null;
  flyscore?: number | null;
  is_open?: boolean;
};

export type UIEvent = {
  id: string;
  store_id: string | null;
  city: string;
  state: string;
  kind: "happy_hour" | "show" | "feira" | "evento" | "promocao";
  title: string;
  description: string | null;
  image_url: string | null;
  starts_at: string;
  ends_at: string;
};

const FALLBACK_COVER = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80";

export async function fetchFeaturedCompanies(city?: { city: string; state: string } | null): Promise<UICompany[]> {
  let q = supabase
    .from("stores")
    .select("id,name,slug,logo_url,category_slug,city,state,latitude,longitude,featured_badge,approved")
    .eq("approved", true)
    .order("featured_badge", { ascending: false })
    .limit(12);
  if (city?.city) q = q.eq("city", city.city);
  const { data } = await q;
  const list = (data ?? []) as any[];
  if (!list.length) return [];
  const ids = list.map((s) => s.id);
  const { data: scores } = await supabase.from("company_flyscore").select("store_id,overall").in("store_id", ids);
  const scoreMap = new Map<string, number>((scores ?? []).map((s: any) => [s.store_id, Number(s.overall)]));
  return list.map((s) => ({
    ...s,
    cover_url: FALLBACK_COVER,
    flyscore: scoreMap.get(s.id) ?? null,
    is_open: true,
  }));
}

export async function fetchHappeningNow(city?: { city: string; state: string } | null): Promise<UIEvent[]> {
  const nowIso = new Date().toISOString();
  let q = supabase
    .from("events")
    .select("*")
    .lte("starts_at", nowIso)
    .gte("ends_at", nowIso)
    .order("starts_at", { ascending: true })
    .limit(12);
  if (city?.city) q = q.eq("city", city.city);
  const { data } = await q;
  return (data ?? []) as any;
}

export async function fetchUpcomingEvents(city?: { city: string; state: string } | null): Promise<UIEvent[]> {
  const nowIso = new Date().toISOString();
  let q = supabase
    .from("events")
    .select("*")
    .gte("starts_at", nowIso)
    .order("starts_at", { ascending: true })
    .limit(8);
  if (city?.city) q = q.eq("city", city.city);
  const { data } = await q;
  return (data ?? []) as any;
}

export async function fetchRecommendedOffers(
  city?: { city: string; state: string } | null,
  userId?: string | null,
): Promise<UIOffer[]> {
  const offers = await fetchOffers(city ?? undefined);
  if (!userId || !offers.length) return offers.slice(0, 8);
  const { data: interests } = await supabase
    .from("user_interests")
    .select("category_slug,weight")
    .eq("user_id", userId);
  const weights = new Map<string, number>((interests ?? []).map((i: any) => [i.category_slug, Number(i.weight)]));
  const scored = offers.map((o) => ({ o, s: (weights.get(o.category) ?? 0.4) + (o.featured ? 0.3 : 0) + o.popularity * 0.001 }));
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, 8).map((x) => x.o);
}

export type UIReviewCard = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  offer_title: string;
  store_name: string;
  store_slug: string | null;
  author_name: string;
  author_avatar: string | null;
};

export async function fetchRecentReviews(limit = 8): Promise<UIReviewCard[]> {
  const { data } = await supabase
    .from("offer_reviews")
    .select("id,rating,comment,created_at,user_id,offer:offers(title,store:stores(name,slug))")
    .not("comment", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  const rows = (data ?? []) as any[];
  if (!rows.length) return [];
  const uids = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profs } = await supabase.from("public_profiles").select("id,full_name,avatar_url").in("id", uids);
  const pmap = new Map<string, any>((profs ?? []).map((p: any) => [p.id, p]));
  return rows.map((r) => ({
    id: r.id,
    rating: Number(r.rating),
    comment: r.comment,
    created_at: r.created_at,
    offer_title: r.offer?.title ?? "Oferta",
    store_name: r.offer?.store?.name ?? "Loja",
    store_slug: r.offer?.store?.slug ?? null,
    author_name: pmap.get(r.user_id)?.full_name ?? "Cliente",
    author_avatar: pmap.get(r.user_id)?.avatar_url ?? null,
  }));
}

export function greeting(name?: string | null): string {
  const h = new Date().getHours();
  const g = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  return name ? `${g}, ${name.split(" ")[0]}` : g;
}
