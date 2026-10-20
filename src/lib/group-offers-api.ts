import { supabase } from "@/integrations/supabase/client";
import type { UIOffer, CityFilter } from "@/lib/offers-api";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80";

const lowestTierPrice = (tiers: any): number => {
  if (!Array.isArray(tiers) || tiers.length === 0) return 0;
  const prices = tiers.map((t: any) => Number(t.price)).filter((n) => Number.isFinite(n));
  return prices.length ? Math.min(...prices) : 0;
};

export const fetchActiveGroupOffersAsUIOffers = async (
  filter?: CityFilter,
): Promise<UIOffer[]> => {
  const nowIso = new Date().toISOString();
  let q = supabase
    .from("group_offers" as any)
    .select(
      "id,title,description,image_url,category_slug,original_price,tiers,ends_at,status,share_token,created_at,store_id, store:stores!inner(name,slug,city,state,logo_url,featured_badge,latitude,longitude)",
    )
    .eq("status", "approved")
    .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
    .order("created_at", { ascending: false });
  if (filter?.city) {
    q = q.eq("store.city", filter.city);
    if (filter.state) q = q.eq("store.state", filter.state);
  }
  const { data, error } = await q;
  if (error) {
    console.error(error);
    return [];
  }
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    title: r.title,
    storeId: r.store_id,
    storeName: r.store?.name ?? "Loja",
    storeSlug: r.store?.slug,
    storeLogo: r.store?.logo_url ?? undefined,
    storeFeaturedBadge: !!r.store?.featured_badge,
    category: r.category_slug,
    type: "desconto" as const,
    image: r.image_url || FALLBACK_IMG,
    originalPrice: Number(r.original_price) || 0,
    promoPrice: lowestTierPrice(r.tiers),
    description: r.description ?? "",
    conditions: "",
    validUntil: r.ends_at ? new Date(r.ends_at).toLocaleDateString("pt-BR") : "",
    featured: false,
    popularity: 0,
    createdAt: r.created_at,
    isFlash: false,
    flashEndsAt: null,
    flashDurationHours: null,
    storeLat: r.store?.latitude ?? null,
    storeLng: r.store?.longitude ?? null,
    storeCity: r.store?.city ?? "",
    storeState: r.store?.state ?? "",
    isGroup: true,
    groupToken: r.share_token,
  }));
};



export type Tier = { min_people: number; price: number };

export type GroupOffer = {
  created_by_admin?: boolean;
  id: string;
  store_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category_slug: string;
  conditions: string | null;
  original_price: number;
  tiers: Tier[];
  duration_hours: number;
  starts_at: string | null;
  ends_at: string | null;
  status: "pending" | "approved" | "rejected" | "expired";
  share_token: string;
};

export type GroupOfferState = {
  found: boolean;
  offer?: GroupOffer;
  participants_count?: number;
  current_tier?: Tier;
  next_tier?: Tier | null;
  seconds_remaining?: number;
  avatars?: { user_id: string; avatar_url: string | null; name: string | null }[];
};

export const fetchGroupOfferStateByToken = async (token: string): Promise<GroupOfferState> => {
  const { data, error } = await supabase.rpc("group_offer_state" as any, { p_token: token });
  if (error) {
    console.error(error);
    return { found: false };
  }
  return (data as any) ?? { found: false };
};

export const fetchActiveGroupOfferForStore = async (storeId: string) => {
  const { data } = await supabase
    .from("group_offers" as any)
    .select("*")
    .eq("store_id", storeId)
    .in("status", ["pending", "approved"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as unknown as GroupOffer) ?? null;
};

export const fetchGroupOfferById = async (id: string) => {
  const { data } = await supabase
    .from("group_offers" as any)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as GroupOffer) ?? null;
};

export const joinGroupOffer = async (params: {
  group_offer_id: string;
  user_id: string;
  referrer_user_id?: string | null;
}) => {
  const { error } = await supabase.from("group_offer_participants" as any).insert({
    group_offer_id: params.group_offer_id,
    user_id: params.user_id,
    referrer_user_id: params.referrer_user_id ?? null,
    whatsapp_clicked_at: new Date().toISOString(),
  } as any);
  // Ignore unique-violation: already joined
  if (error && !String(error.message).includes("duplicate")) throw error;
};

export const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
