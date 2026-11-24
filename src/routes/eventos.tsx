import { createFileRoute } from "@tanstack/react-router";
import Eventos from "@/pages/Eventos";
import { loadLocalSeo } from "@/lib/local-seo.functions";
import { buildHead } from "@/lib/route-seo";
import { absoluteUrl } from "@/lib/slug";

export const Route = createFileRoute("/eventos")({
  loader: () => loadLocalSeo({ data: { type: "agenda" } }),
  head: ({ loaderData }) => {
    const events = loaderData?.events ?? [];
    const first = events.find((e) => e.cover_url || e.image_url);
    const head = buildHead({
      title: "Eventos locais: shows, feiras e happy hours | OfertasFly",
      description:
        "Agenda de eventos locais: shows, feiras, happy hours e promoções das lojas parceiras do OfertasFly. Veja datas, locais e como participar.",
      path: "/eventos",
      image: first?.cover_url || first?.image_url || null,
    });
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Eventos no OfertasFly",
      itemListElement: events.map((e, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Event",
          name: e.title,
          url: absoluteUrl(`/evento/${e.slug}`),
          startDate: e.starts_at,
          endDate: e.ends_at,
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          ...(e.description ? { description: e.description.slice(0, 300) } : {}),
          ...(e.cover_url || e.image_url ? { image: [e.cover_url || e.image_url] } : {}),
          location: {
            "@type": "Place",
            name: e.venue || `${e.city.trim()}/${e.state}`,
            address: {
              "@type": "PostalAddress",
              ...(e.address ? { streetAddress: e.address } : {}),
              addressLocality: e.city.trim(),
              addressRegion: e.state,
              addressCountry: "BR",
            },
          },
        },
      })),
    };
    return {
      ...head,
      scripts: [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }],
    };
  },
  errorComponent: () => <main className="container py-16" role="alert">Não foi possível carregar os eventos. Tente novamente em alguns instantes.</main>,
  notFoundComponent: () => <main className="container py-16">Agenda não encontrada.</main>,
  component: EventosRoute,
});

function EventosRoute() {
  const { events, cities } = Route.useLoaderData();
  return <Eventos upcoming={events} cities={cities} />;
}
