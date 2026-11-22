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
  opening_hours?: any;
  avg_rating?: number;
  review_count?: number;
};

/** Contagem/média reais de avaliações aprovadas por loja. */
export async function fetchStoreRatings(
  storeIds: string[],
): Promise<Map<string, { avg: number; count: number }>> {
  const map = new Map<string, { avg: number; count: number }>();
  if (!storeIds.length) return map;
  const { data } = await supabase
    .from("offer_reviews")
    .select("store_id,rating")
    .eq("status", "approved")
    .in("store_id", storeIds);
  const sums = new Map<string, { sum: number; count: number }>();
  for (const r of (data ?? []) as any[]) {
    const cur = sums.get(r.store_id) ?? { sum: 0, count: 0 };
    cur.sum += Number(r.rating);
    cur.count += 1;
    sums.set(r.store_id, cur);
  }
  for (const [sid, v] of sums) {
    map.set(sid, { avg: Number((v.sum / v.count).toFixed(1)), count: v.count });
  }
  return map;
}

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

export type HomeStats = {
  activeCompanies: number;
  publishedOffers: number;
  connectedUsers: number;
  cities: number;
};

export async function fetchHomeStats(): Promise<HomeStats> {
  const [stores, offers, users, cts] = await Promise.all([
    supabase.from("stores").select("*", { count: "exact", head: true }).eq("approved", true),
    supabase.from("offers").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("public_profiles").select("*", { count: "exact", head: true }),
    supabase.from("stores").select("city").eq("approved", true),
  ]);
  const cities = new Set((cts.data ?? []).map((r: any) => (r.city ?? "").trim()).filter((c: string) => c && c !== "Não informado"));
  return {
    activeCompanies: stores.count ?? 0,
    publishedOffers: offers.count ?? 0,
    connectedUsers: users.count ?? 0,
    cities: cities.size,
  };
}

export async function fetchFeaturedCompanies(city?: { city: string; state: string } | null): Promise<UICompany[]> {
  let q = supabase
    .from("stores")
    .select("id,name,slug,logo_url,city,state,latitude,longitude,featured_badge,approved,cover_url,opening_hours")
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
  const { data: catRows } = await supabase.from("offers").select("store_id,category_slug").in("store_id", ids);
  const catMap = new Map<string, string>();
  for (const r of (catRows ?? []) as any[]) {
    if (!catMap.has(r.store_id) && r.category_slug) catMap.set(r.store_id, r.category_slug);
  }
  const ratings = await fetchStoreRatings(ids);
  return list.map((s) => ({
    ...s,
    category_slug: catMap.get(s.id) ?? null,
    cover_url: s.cover_url ?? FALLBACK_COVER,
    flyscore: scoreMap.get(s.id) ?? null,
    opening_hours: s.opening_hours ?? null,
    avg_rating: ratings.get(s.id)?.avg ?? 0,
    review_count: ratings.get(s.id)?.count ?? 0,
  }));
}

export type UIRecommendedCompany = UICompany & {
  avg_rating: number;
  review_count: number;
  match_score: number;
};

export async function fetchRecommendedCompanies(
  city?: { city: string; state: string } | null,
  userId?: string | null,
  limit = 6,
): Promise<UIRecommendedCompany[]> {
  let q = supabase
    .from("stores")
    .select("id,name,slug,logo_url,city,state,latitude,longitude,featured_badge,approved,cover_url,opening_hours")
    .eq("approved", true)
    .limit(50);
  if (city?.city) q = q.eq("city", city.city);
  let { data } = await q;
  let list = (data ?? []) as any[];
  if (!list.length && city?.city) {
    const fb = await supabase
      .from("stores")
      .select("id,name,slug,logo_url,city,state,latitude,longitude,featured_badge,approved,cover_url,opening_hours")
      .eq("approved", true)
      .limit(50);
    list = (fb.data ?? []) as any[];
  }
  if (!list.length) return [];
  const ids = list.map((s) => s.id);

  const { data: scores } = await supabase.from("company_flyscore").select("store_id,overall").in("store_id", ids);
  const scoreMap = new Map<string, number>((scores ?? []).map((s: any) => [s.store_id, Number(s.overall)]));

  const { data: offerRows } = await supabase
    .from("offers")
    .select("id,store_id,category_slug")
    .in("store_id", ids);
  const storeCatCounts = new Map<string, Map<string, number>>();
  const offerToStore = new Map<string, string>();
  for (const r of (offerRows ?? []) as any[]) {
    offerToStore.set(r.id, r.store_id);
    if (!r.category_slug) continue;
    const m = storeCatCounts.get(r.store_id) ?? new Map<string, number>();
    m.set(r.category_slug, (m.get(r.category_slug) ?? 0) + 1);
    storeCatCounts.set(r.store_id, m);
  }
  const primaryCat = new Map<string, string>();
  const storeCats = new Map<string, string[]>();
  for (const [sid, m] of storeCatCounts) {
    const sorted = [...m.entries()].sort((a, b) => b[1] - a[1]);
    if (sorted[0]) primaryCat.set(sid, sorted[0][0]);
    storeCats.set(sid, sorted.map((s) => s[0]));
  }

  const ratings = await fetchStoreRatings(ids);

  let weights = new Map<string, number>();
  if (userId) {
    const { data: interests } = await supabase
      .from("user_interests")
      .select("category_slug,weight")
      .eq("user_id", userId);
    weights = new Map<string, number>((interests ?? []).map((i: any) => [i.category_slug, Number(i.weight)]));
  }

  const enriched: UIRecommendedCompany[] = list.map((s) => {
    const cats = storeCats.get(s.id) ?? [];
    const interestBoost = cats.reduce((acc, c) => acc + (weights.get(c) ?? 0), 0);
    const count = ratings.get(s.id)?.count ?? 0;
    const avg = ratings.get(s.id)?.avg ?? 0;
    const fly = scoreMap.get(s.id) ?? 0;
    const match =
      interestBoost * 3 +
      (s.featured_badge ? 1.5 : 0) +
      avg * 0.6 +
      Math.min(count, 20) * 0.05 +
      fly * 0.01;
    return {
      ...s,
      category_slug: primaryCat.get(s.id) ?? null,
      cover_url: s.cover_url ?? FALLBACK_COVER,
      flyscore: scoreMap.get(s.id) ?? null,
      opening_hours: s.opening_hours ?? null,
      avg_rating: Number(avg.toFixed(1)),
      review_count: count,
      match_score: match,
    };
  });
  enriched.sort((a, b) => b.match_score - a.match_score);
  return enriched.slice(0, limit);
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
    .select("id,rating,comment,created_at,user_id,status,offer:offers(title,store:stores(name,slug))")
    .eq("status", "approved")
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

// ============================================================
// FlyScore
// ============================================================

export type FlyScorePilares = {
  avaliacoes: number;
  informacoes: number;
  atualizacao: number;
  overall: number;
  review_count?: number;
  avg_rating?: number;
};

export type FlyScoreAggregate = {
  overallMedio: number;
  pilaresMedios: { avaliacoes: number; informacoes: number; atualizacao: number };
  totalLojas: number;
};

export async function fetchFlyScore(storeId: string): Promise<FlyScorePilares | null> {
  const { data } = await supabase
    .from("company_flyscore")
    .select("overall,pilares")
    .eq("store_id", storeId)
    .maybeSingle();
  if (!data) return null;
  const p = (data.pilares as any) ?? {};
  return {
    overall: Number(data.overall ?? p.overall ?? 0),
    avaliacoes: Number(p.avaliacoes ?? 0),
    informacoes: Number(p.informacoes ?? 0),
    atualizacao: Number(p.atualizacao ?? 0),
    review_count: Number(p.review_count ?? 0),
    avg_rating: Number(p.avg_rating ?? 0),
  };
}

export async function fetchFlyScoreAggregate(): Promise<FlyScoreAggregate> {
  const { data } = await supabase
    .from("company_flyscore")
    .select("overall,pilares")
    .gt("overall", 0);
  const rows = (data ?? []) as any[];
  if (!rows.length) {
    return { overallMedio: 0, pilaresMedios: { avaliacoes: 0, informacoes: 0, atualizacao: 0 }, totalLojas: 0 };
  }
  const sum = { o: 0, a: 0, i: 0, u: 0 };
  for (const r of rows) {
    const p = r.pilares ?? {};
    sum.o += Number(r.overall ?? 0);
    sum.a += Number(p.avaliacoes ?? 0);
    sum.i += Number(p.informacoes ?? 0);
    sum.u += Number(p.atualizacao ?? 0);
  }
  const n = rows.length;
  return {
    overallMedio: Math.round(sum.o / n),
    pilaresMedios: {
      avaliacoes: Math.round(sum.a / n),
      informacoes: Math.round(sum.i / n),
      atualizacao: Math.round(sum.u / n),
    },
    totalLojas: n,
  };
}

export async function recomputeFlyScore(storeId: string): Promise<void> {
  await supabase.rpc("recompute_my_flyscore" as any, { _store_id: storeId });
}

