import { supabase } from "@/integrations/supabase/client";

export type EventKind = "happy_hour" | "show" | "feira" | "evento" | "promocao";
export type EventStatus = "pending" | "approved" | "rejected" | "expired";

export type UIEventFull = {
  id: string;
  store_id: string | null;
  slug: string;
  title: string;
  description: string | null;
  kind: EventKind;
  category_slug: string | null;
  image_url: string | null;
  cover_url: string | null;
  gallery: string[];
  venue: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  price_info: string | null;
  link_url: string | null;
  city: string;
  state: string;
  starts_at: string;
  ends_at: string;
  status: EventStatus;
  featured: boolean;
  share_token: string;
  view_count: number;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type UIEventWithStore = UIEventFull & {
  store: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    featured_badge?: boolean;
    whatsapp?: string | null;
    phone?: string | null;
    city?: string;
    state?: string;
  } | null;
};

export const EVENT_KINDS: { value: EventKind; label: string }[] = [
  { value: "happy_hour", label: "Happy Hour" },
  { value: "show", label: "Show" },
  { value: "feira", label: "Feira" },
  { value: "evento", label: "Evento" },
  { value: "promocao", label: "Promoção" },
];

export type EventDateFilter = "all" | "today" | "weekend" | "next7" | "next30";

const rangeFor = (df: EventDateFilter): { from?: string; to?: string } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (df === "today") {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { from: start.toISOString(), to: end.toISOString() };
  }
  if (df === "weekend") {
    const day = start.getDay();
    const sat = new Date(start);
    sat.setDate(start.getDate() + ((6 - day + 7) % 7));
    const mon = new Date(sat);
    mon.setDate(sat.getDate() + 2);
    return { from: sat.toISOString(), to: mon.toISOString() };
  }
  if (df === "next7") {
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { from: now.toISOString(), to: end.toISOString() };
  }
  if (df === "next30") {
    const end = new Date(start);
    end.setDate(end.getDate() + 30);
    return { from: now.toISOString(), to: end.toISOString() };
  }
  return {};
};

export async function fetchPublicEvents(opts: {
  city?: string | null;
  state?: string | null;
  kind?: EventKind | null;
  dateFilter?: EventDateFilter;
  q?: string;
  limit?: number;
} = {}): Promise<UIEventWithStore[]> {
  const nowIso = new Date().toISOString();
  let q = supabase
    .from("events" as any)
    .select(
      "*, store:stores(id,name,slug,logo_url,featured_badge,whatsapp,phone,city,state)",
    )
    .eq("status", "approved")
    .gte("ends_at", nowIso)
    .order("featured", { ascending: false })
    .order("starts_at", { ascending: true })
    .limit(opts.limit ?? 48);
  if (opts.city) q = q.eq("city", opts.city);
  if (opts.state) q = q.eq("state", opts.state);
  if (opts.kind) q = q.eq("kind", opts.kind);
  const { from, to } = rangeFor(opts.dateFilter ?? "all");
  if (from) q = q.gte("starts_at", from).or(`ends_at.gte.${from}`);
  if (to) q = q.lte("starts_at", to);
  if (opts.q?.trim()) q = q.ilike("title", `%${opts.q.trim()}%`);
  const { data, error } = await q;
  if (error) {
    console.error(error);
    return [];
  }
  return ((data ?? []) as any[]).map((r) => ({
    ...r,
    gallery: Array.isArray(r.gallery) ? r.gallery : [],
  })) as UIEventWithStore[];
}

export async function fetchEventBySlug(slug: string): Promise<UIEventWithStore | null> {
  const { data, error } = await supabase.rpc("event_by_slug" as any, { p_slug: slug });
  if (error) {
    console.error(error);
    return null;
  }
  const payload = data as any;
  if (!payload?.found) return null;
  const ev = payload.event as any;
  return {
    ...ev,
    gallery: Array.isArray(ev.gallery) ? ev.gallery : [],
    store: payload.store,
  } as UIEventWithStore;
}

export async function trackEventView(id: string) {
  try {
    await supabase.rpc("event_track_view" as any, { p_id: id });
  } catch {
    // ignore
  }
}

export async function fetchStoreEvents(storeId: string): Promise<UIEventFull[]> {
  const { data } = await supabase
    .from("events" as any)
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as any[]).map((r) => ({
    ...r,
    gallery: Array.isArray(r.gallery) ? r.gallery : [],
  })) as UIEventFull[];
}

export async function fetchEventById(id: string): Promise<UIEventFull | null> {
  const { data } = await supabase.from("events" as any).select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  const r = data as any;
  return { ...r, gallery: Array.isArray(r.gallery) ? r.gallery : [] } as UIEventFull;
}

export function slugifyTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "evento"
  );
}
