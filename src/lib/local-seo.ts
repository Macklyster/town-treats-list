import { absoluteUrl, cityLabel, citySlug, type CityLike } from "@/lib/slug";
import type { UIEventWithStore } from "@/lib/events-api";

export type PublicAgendaEvent = Pick<UIEventWithStore, "id" | "slug" | "title" | "description" | "kind" | "cover_url" | "image_url" | "venue" | "address" | "city" | "state" | "starts_at" | "ends_at" | "latitude" | "longitude" | "price_info" | "link_url" | "featured" | "store">;
export type PublicBusiness = {
  name: string; slug: string; description: string | null; city: string; state: string;
  address: string | null; phone: string | null; logo_url: string | null; cover_url: string | null;
  latitude: number | null; longitude: number | null; website: string | null;
};

export function agendaCities(rows: CityLike[]): CityLike[] {
  const cities = new Map<string, CityLike>();
  for (const row of rows) {
    const city = { city: row.city.trim(), state: row.state.trim().toUpperCase() };
    if (city.city && city.city !== "Não informado") cities.set(citySlug(city), city);
  }
  return [...cities.values()].sort((a, b) => cityLabel(a).localeCompare(cityLabel(b), "pt-BR"));
}

export function eventSchema(event: PublicAgendaEvent) {
  return {
    "@context": "https://schema.org", "@type": "Event",
    "@id": absoluteUrl(`/evento/${event.slug}#event`), url: absoluteUrl(`/evento/${event.slug}`),
    name: event.title, startDate: event.starts_at, endDate: event.ends_at,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    ...(event.description ? { description: event.description } : {}),
    ...(event.cover_url || event.image_url ? { image: [event.cover_url || event.image_url] } : {}),
    location: {
      "@type": "Place", name: event.venue || event.store?.name || cityLabel(event),
      address: { "@type": "PostalAddress", ...(event.address ? { streetAddress: event.address } : {}), addressLocality: event.city.trim(), addressRegion: event.state, addressCountry: "BR" },
      ...(event.latitude != null && event.longitude != null ? { geo: { "@type": "GeoCoordinates", latitude: event.latitude, longitude: event.longitude } } : {}),
    },
    ...(event.store ? { organizer: { "@type": "Organization", name: event.store.name, url: absoluteUrl(`/loja/${event.store.slug}`) } } : {}),
  };
}

export function businessSchema(store: PublicBusiness) {
  return {
    "@context": "https://schema.org", "@type": "LocalBusiness",
    "@id": absoluteUrl(`/loja/${store.slug}#business`), url: absoluteUrl(`/loja/${store.slug}`), name: store.name,
    ...(store.description ? { description: store.description } : {}),
    ...(store.cover_url || store.logo_url ? { image: store.cover_url || store.logo_url } : {}),
    ...(store.phone ? { telephone: store.phone } : {}),
    address: { "@type": "PostalAddress", ...(store.address ? { streetAddress: store.address } : {}), addressLocality: store.city.trim(), addressRegion: store.state, addressCountry: "BR" },
    ...(store.latitude != null && store.longitude != null ? { geo: { "@type": "GeoCoordinates", latitude: store.latitude, longitude: store.longitude } } : {}),
    ...(store.website?.startsWith("https://") ? { sameAs: [store.website] } : {}),
  };
}

export function breadcrumbs(items: { name: string; path: string }[]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: absoluteUrl(item.path) })) };
}

export function jsonLdScripts(items: object[]) {
  return items.map((item) => ({ type: "application/ld+json", children: JSON.stringify(item).replace(/</g, "\\u003c") }));
}
