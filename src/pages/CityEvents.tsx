import { Search, CalendarDays } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EventCard } from "@/components/site/EventCard";
import { EVENT_KINDS } from "@/lib/events-api";
import { cityLabel, citySlug, type CityLike } from "@/lib/slug";
import type { PublicAgendaEvent } from "@/lib/local-seo";

export default function CityEvents({ city, cities, events, q, kind, onSearch, onKind }: {
  city: CityLike; cities: CityLike[]; events: PublicAgendaEvent[]; q: string; kind: string;
  onSearch: (value: string) => void; onKind: (value: string) => void;
}) {
  const visible = events.filter((event) => (kind === "all" || event.kind === kind) && event.title.toLocaleLowerCase("pt-BR").includes(q.trim().toLocaleLowerCase("pt-BR")));
  return <div className="flex min-h-screen flex-col bg-background">
    <Header />
    <main className="container flex-1 space-y-8 py-8">
      <PageHero eyebrow="Agenda local" titleAsChild title={<h1>Eventos em {cityLabel(city)}</h1>}
        subtitle={`Shows, feiras, happy hours e experiências em ${city.city}. Confira as próximas datas e os locais para aproveitar a cidade.`}
        crumbs={[{ label: "Início", to: "/" }, { label: "Eventos", to: "/eventos" }, { label: cityLabel(city) }]} compact />
      <section className="space-y-4" aria-label="Filtros de eventos">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Buscar eventos por título" placeholder="Buscar eventos por título…" value={q} onChange={(event) => onSearch(event.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[{ value: "all", label: "Todos os tipos" }, ...EVENT_KINDS].map((item) => <Button key={item.value} size="sm" variant={kind === item.value ? "default" : "outline"} aria-pressed={kind === item.value} onClick={() => onKind(item.value)}>{item.label}</Button>)}
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-foreground">Próximos eventos em {city.city}</h2>
        {visible.length ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{visible.map((event, index) => <EventCard key={event.id} event={event} index={index} />)}</div> : <div className="py-10 text-center text-muted-foreground"><CalendarDays className="mx-auto mb-3 h-8 w-8 text-highlight" /><p>{events.length ? "Nenhum evento encontrado com esses filtros." : `Nenhum evento programado em ${city.city} no momento.`}</p><Button asChild variant="outline" className="mt-4"><Link to="/eventos">Ver agenda de eventos</Link></Button></div>}
      </section>
      <section className="space-y-3 border-t border-border pt-6">
        <h2 className="font-display text-xl text-foreground">O que fazer em {city.city}</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">Explore a agenda do comércio local e da comunidade de {cityLabel(city)}. Nas páginas dos eventos, consulte data, horário, endereço e informações para participar.</p>
        <Button asChild variant="outline"><Link to="/ofertas/$cidadeSlug" params={{ cidadeSlug: citySlug(city) }}>Ofertas e promoções em {city.city}</Link></Button>
      </section>
      <nav aria-label="Eventos em outras cidades" className="space-y-3 border-t border-border pt-6">
        <h2 className="font-display text-xl text-foreground">Agenda por cidade</h2>
        <div className="flex flex-wrap gap-x-5 gap-y-3">{cities.map((item) => <Link key={citySlug(item)} to="/eventos/$cidadeSlug" params={{ cidadeSlug: citySlug(item) }} className="text-sm text-highlight hover:underline" aria-current={citySlug(item) === citySlug(city) ? "page" : undefined}>{cityLabel(item)}</Link>)}</div>
      </nav>
    </main>
    <Footer />
  </div>;
}
