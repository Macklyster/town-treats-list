import { UIOffer, formatBRL } from "@/lib/offers-api";
import type { UIEventWithStore, EventKind } from "@/lib/events-api";

export type MapPinItem = {
  id: string;
  kind: "offer" | "event";
  title: string;
  image: string;
  storeId: string;
  storeName: string;
  storeSlug?: string;
  storeLogo?: string | null;
  storeLat?: number | null;
  storeLng?: number | null;
  storeCity?: string;
  storeState?: string;
  link: string;
  priceLabel?: string;
  dateLabel?: string;
  kindLabel?: string;
  badge?: string;
};

const EVENT_KIND_LABELS: Record<EventKind, string> = {
  happy_hour: "Happy Hour",
  show: "Show",
  feira: "Feira",
  evento: "Evento",
  promocao: "Promoção",
};

const OFFER_TYPE_LABELS: Record<UIOffer["type"], string> = {
  desconto: "Desconto",
  cupom: "Cupom",
  brinde: "Brinde",
};

export function offerToMapPin(offer: UIOffer): MapPinItem {
  const priceLabel =
    offer.promoPrice > 0
      ? formatBRL(offer.promoPrice)
      : offer.originalPrice > 0
        ? "Grátis"
        : undefined;
  return {
    id: offer.id,
    kind: "offer",
    title: offer.title,
    image: offer.image,
    storeId: offer.storeId,
    storeName: offer.storeName,
    storeSlug: offer.storeSlug,
    storeLogo: offer.storeLogo,
    storeLat: offer.storeLat,
    storeLng: offer.storeLng,
    storeCity: offer.storeCity,
    storeState: offer.storeState,
    link: `/oferta/${offer.id}`,
    priceLabel,
    dateLabel: offer.validUntil || undefined,
    kindLabel: OFFER_TYPE_LABELS[offer.type],
  };
}

export function eventToMapPin(event: UIEventWithStore): MapPinItem {
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const isLive =
    new Date(event.starts_at).getTime() <= Date.now() &&
    new Date(event.ends_at).getTime() >= Date.now();

  const dateLabel = `${fmtDate(event.starts_at)} · ${fmtTime(event.starts_at)}`;

  return {
    id: event.id,
    kind: "event",
    title: event.title,
    image: event.cover_url || event.image_url || "",
    storeId: event.store_id ?? `event-${event.id}`,
    storeName: event.store?.name ?? event.venue ?? "Local a confirmar",
    storeSlug: event.store?.slug,
    storeLogo: event.store?.logo_url,
    storeLat: event.latitude,
    storeLng: event.longitude,
    storeCity: event.city,
    storeState: event.state,
    link: `/evento/${event.slug}`,
    priceLabel: event.price_info || undefined,
    dateLabel,
    kindLabel: EVENT_KIND_LABELS[event.kind],
    badge: isLive ? "Ao vivo" : event.featured ? "Destaque" : undefined,
  };
}
