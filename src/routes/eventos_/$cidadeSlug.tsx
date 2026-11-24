import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { agendaQuery } from "@/lib/agenda-query";
import { buildHead } from "@/lib/route-seo";
import { cityLabel, citySlug, matchCityFromSlug } from "@/lib/slug";
import { breadcrumbs, eventSchema } from "@/lib/local-seo";
import CityEvents from "@/pages/CityEvents";

export const Route = createFileRoute("/eventos_/$cidadeSlug")({
  validateSearch: (search: Record<string, unknown>): { q?: string; kind?: string } => ({ q: typeof search['q'] === "string" ? search['q'] : "", kind: typeof search['kind'] === "string" ? search['kind'] : "all" }),
  loader: async ({ params, context }) => {
    const agenda = await context.queryClient.ensureQueryData(agendaQuery);
    const city = matchCityFromSlug(params.cidadeSlug, agenda.cities);
    if (!city) throw notFound();
    return { city, events: agenda.events.filter((event) => citySlug(event) === citySlug(city)) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return buildHead({ title: "Agenda indisponível | OfertasFly", description: "Consulte a agenda local de eventos do OfertasFly.", path: "/eventos", noindex: true });
    const { city, events } = loaderData;
    const path = `/eventos/${citySlug(city)}`;
    return buildHead({ title: `Eventos em ${cityLabel(city)} — Agenda | OfertasFly`, description: `O que fazer em ${cityLabel(city)}: shows, feiras, happy hours e eventos locais. Veja datas, horários e endereços na agenda do OfertasFly.`, path, image: events.find((event) => event.cover_url || event.image_url)?.cover_url || events.find((event) => event.cover_url || event.image_url)?.image_url || null, omitDefaultImage: true, jsonLd: [{ "@context": "https://schema.org", "@type": "ItemList", name: `Eventos em ${cityLabel(city)}`, itemListElement: events.map((event, index) => ({ "@type": "ListItem", position: index + 1, item: eventSchema(event) })) }, breadcrumbs([{ name: "Início", path: "/" }, { name: "Eventos", path: "/eventos" }, { name: cityLabel(city), path }])] });
  },
  errorComponent: () => <main className="container py-16" role="alert">Não foi possível carregar a agenda. Tente novamente em alguns instantes.</main>,
  notFoundComponent: () => <main className="container py-16"><h1 className="text-2xl">Cidade não encontrada</h1><p>Esta cidade ainda não possui uma agenda no OfertasFly.</p></main>,
  component: CityEventsRoute,
});

function CityEventsRoute() {
  const { city } = Route.useLoaderData();
  const { data } = useSuspenseQuery(agendaQuery);
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return <CityEvents city={city} cities={data.cities} events={data.events.filter((event) => citySlug(event) === citySlug(city))} q={search.q ?? ""} kind={search.kind ?? "all"}
    onSearch={(q) => { void navigate({ search: (prev) => ({ ...prev, q }), replace: true }); }}
    onKind={(kind) => { void navigate({ search: (prev) => ({ ...prev, kind }), replace: true }); }} />;
}
