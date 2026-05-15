import { supabase } from "@/integrations/supabase/client";

export type GeoOfferStatus = "pending" | "approved" | "expired" | "rejected";

export type GeoOffer = {
  id: string;
  store_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category_slug: string;
  conditions: string | null;
  original_price: number;
  promo_price: number;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  time_start: string; // "HH:MM:SS"
  time_end: string;
  valid_from: string;
  valid_until: string | null;
  status: GeoOfferStatus;
  share_token: string;
};

export type GeoOfferState = {
  found: boolean;
  in_radius?: boolean;
  in_window?: boolean;
  in_validity?: boolean;
  distance_meters?: number | null;
  status?: GeoOfferStatus;
  store_name?: string | null;
  store_whatsapp?: string | null;
  offer?: Partial<GeoOffer> & {
    id: string;
    title: string;
    image_url?: string | null;
    radius_meters?: number;
    time_start?: string;
    time_end?: string;
    share_token: string;
  };
};

export const fetchGeoOfferState = async (
  token: string,
  lat?: number | null,
  lng?: number | null,
): Promise<GeoOfferState> => {
  const { data, error } = await supabase.rpc("geo_offer_state" as any, {
    p_token: token,
    p_lat: lat ?? null,
    p_lng: lng ?? null,
  });
  if (error) {
    console.error(error);
    return { found: false };
  }
  return (data as any) ?? { found: false };
};

export const registerGeoVisit = async (
  token: string,
  lat: number,
  lng: number,
  sessionId?: string | null,
) => {
  const { data, error } = await supabase.rpc("geo_offer_register_visit" as any, {
    p_token: token,
    p_lat: lat,
    p_lng: lng,
    p_session_id: sessionId ?? null,
  });
  if (error) console.error(error);
  return (data as any) ?? { ok: false };
};

export const fetchActiveGeoOfferForStore = async (
  storeId: string,
): Promise<GeoOffer | null> => {
  const { data } = await supabase
    .from("geo_offers" as any)
    .select("*")
    .eq("store_id", storeId)
    .in("status", ["pending", "approved"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data as unknown) as GeoOffer) ?? null;
};

export const fetchGeoOfferById = async (id: string): Promise<GeoOffer | null> => {
  const { data } = await supabase
    .from("geo_offers" as any)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return ((data as unknown) as GeoOffer) ?? null;
};

export const fetchActiveGeoOffers = async (storeIds?: string[]) => {
  let q = supabase
    .from("geo_offers" as any)
    .select("*, store:stores(id,name,slug,logo_url,featured_badge,city,state)")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (storeIds && storeIds.length > 0) q = q.in("store_id", storeIds);
  const { data } = await q;
  return ((data ?? []) as unknown) as (GeoOffer & {
    store: { id: string; name: string; slug: string; logo_url: string | null; featured_badge: boolean; city: string; state: string } | null;
  })[];
};

export const haversineMeters = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

export const formatBRL = (v: number) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatTime = (t: string) => (t ?? "").slice(0, 5);

export const getCurrentPosition = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocalização não suportada neste navegador."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    });
  });
