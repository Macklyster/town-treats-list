import { supabase } from "@/integrations/supabase/client";
import type { UIOffer, CityFilter } from "@/lib/offers-api";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80";

export const fetchActiveAuctionsAsUIOffers = async (
  filter?: CityFilter,
): Promise<UIOffer[]> => {
  const nowIso = new Date().toISOString();
  let q = supabase
    .from("auction_offers" as any)
    .select(
      "id,title,description,image_url,category_slug,starting_price,min_price,decrement_amount,decrement_interval_minutes,starts_at,ends_at,status,share_token,created_at,store_id, store:stores!inner(name,slug,city,state,logo_url,featured_badge,latitude,longitude)",
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
  return ((data ?? []) as any[]).map((r) => {
    const current = computeCurrentPrice({
      starting_price: r.starting_price,
      min_price: r.min_price,
      decrement_amount: r.decrement_amount,
      decrement_interval_minutes: r.decrement_interval_minutes,
      starts_at: r.starts_at,
    });
    return {
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
      originalPrice: Number(r.starting_price) || 0,
      promoPrice: current,
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
      isAuction: true,
      auctionToken: r.share_token,
    };
  });
};



export type AuctionStatus = "pending" | "approved" | "sold_out" | "expired" | "rejected";

export type AuctionOffer = {
  created_by_admin?: boolean;
  id: string;
  store_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category_slug: string;
  conditions: string | null;
  starting_price: number;
  min_price: number;
  decrement_amount: number;
  decrement_interval_minutes: number;
  total_quantity: number;
  reserved_quantity: number;
  starts_at: string | null;
  ends_at: string | null;
  status: AuctionStatus;
  share_token: string;
};

export type AuctionState = {
  found: boolean;
  offer?: AuctionOffer;
  current_price?: number;
  seconds_to_next_decrement?: number;
  seconds_remaining?: number;
  already_reserved?: boolean;
  store_name?: string;
  store_whatsapp?: string | null;
};

export const fetchAuctionStateByToken = async (token: string): Promise<AuctionState> => {
  const { data, error } = await supabase.rpc("auction_state" as any, { p_token: token });
  if (error) {
    console.error(error);
    return { found: false };
  }
  return (data as any) ?? { found: false };
};

export const reserveAuction = async (token: string) => {
  const { data, error } = await supabase.rpc("reserve_auction" as any, { p_token: token });
  if (error) throw error;
  return data as { ok: boolean; reserved_price: number; auction_id: string };
};

export const fetchActiveAuctionForStore = async (storeId: string) => {
  const { data } = await supabase
    .from("auction_offers" as any)
    .select("*")
    .eq("store_id", storeId)
    .in("status", ["pending", "approved"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as unknown as AuctionOffer) ?? null;
};

export const fetchAuctionById = async (id: string) => {
  const { data } = await supabase
    .from("auction_offers" as any)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as AuctionOffer) ?? null;
};

/** Pure helper — replicates SQL auction_current_price for client tick. */
export const computeCurrentPrice = (a: {
  starting_price: number;
  min_price: number;
  decrement_amount: number;
  decrement_interval_minutes: number;
  starts_at: string | null;
}): number => {
  if (!a.starts_at) return Number(a.starting_price);
  const elapsedSec = (Date.now() - new Date(a.starts_at).getTime()) / 1000;
  const steps = Math.floor(elapsedSec / (a.decrement_interval_minutes * 60));
  const price = Number(a.starting_price) - steps * Number(a.decrement_amount);
  return Math.max(Number(a.min_price), price);
};

export const computeSecondsToNext = (a: {
  decrement_interval_minutes: number;
  starts_at: string | null;
}): number => {
  if (!a.starts_at) return a.decrement_interval_minutes * 60;
  const intervalSec = a.decrement_interval_minutes * 60;
  const elapsedSec = Math.floor((Date.now() - new Date(a.starts_at).getTime()) / 1000);
  return Math.max(0, intervalSec - (elapsedSec % intervalSec));
};

export const trackAuctionEvent = async (auctionId: string, eventType: "view" | "whatsapp_click", sessionId?: string) => {
  try {
    await supabase.rpc("track_auction_event" as any, {
      p_auction_id: auctionId,
      p_event_type: eventType,
      p_session_id: sessionId ?? null,
      p_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      p_referrer: typeof document !== "undefined" ? document.referrer : null,
    });
  } catch (e) { console.error(e); }
};

export type AuctionSocialProof = { views_today: number; viewers_now: number; reserved: number; total: number };

export const fetchAuctionSocialProof = async (auctionId: string): Promise<AuctionSocialProof> => {
  const { data } = await supabase.rpc("auction_social_proof" as any, { p_auction_id: auctionId });
  return (data as any) ?? { views_today: 0, viewers_now: 0, reserved: 0, total: 0 };
};

export const formatBRL = (v: number) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
