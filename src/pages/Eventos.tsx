import { useEffect, useState } from "react";
import { Search, Filter, CalendarDays } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PageHero } from "@/components/site/PageHero";
import { Link } from "@/lib/router-compat";
import { SectionCard } from "@/components/site/SectionCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCity } from "@/hooks/useCity";
import {
  EVENT_KINDS,
  fetchPublicEvents,
  type EventDateFilter,
  type EventKind,
  type UIEventWithStore,
} from "@/lib/events-api";
import { EventCard } from "@/components/site/EventCard";

const DATE_FILTERS: { value: EventDateFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "today", label: "Hoje" },
  { value: "weekend", label: "Fim de semana" },
  { value: "next7", label: "7 dias" },
  { value: "next30", label: "30 dias" },
];

export type SeoEvent = {
  slug: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  city: string;
  state: string;
  venue: string | null;
  address: string | null;
  cover_url: string | null;
  image_url: string | null;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" });

export default function Eventos({ upcoming = [] }: { upcoming?: SeoEvent[] }) {
  const { city, openSelector } = useCity();
  const [kind, setKind] = useState<EventKind | null>(null);
  const [dateFilter, setDateFilter] = useState<EventDateFilter>("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<UIEventWithStore[]>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchPublicEvents({
      city: city?.city ?? null,
      state: city?.state ?? null,
      kind,
      dateFilter,
      q,
    }).then((data) => {
      if (!mounted) return;
      setEvents(data);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [city?.city, city?.state, kind, dateFilter, q]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 space-y-6 py-8">
        <PageHero
          eyebrow="Agenda · Ao vivo"
          titleAsChild
          title={<h1>Eventos e experiências</h1>}
          subtitle={
            city
              ? `Shows, happy hours, feiras e experiências em ${city.city}.`
              : "Selecione sua cidade para ver os eventos mais próximos."
          }
          crumbs={[{ label: "Início", to: "/" }, { label: "Eventos" }]}
          compact
          actions={
            <Button variant="outline" onClick={openSelector}>
              <CalendarDays className="h-4 w-4" /> {city ? `${city.city} - ${city.state}` : "Escolher cidade"}
            </Button>
          }
        />

        <SectionCard
          eyebrow="Filtros"
          title="Encontre seu próximo rolê"
          bodyClassName="space-y-4"
        >
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar eventos por título…"
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge
                variant={kind === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setKind(null)}
              >
                <Filter className="mr-1 h-3 w-3" /> Todos os tipos
              </Badge>
              {EVENT_KINDS.map((k) => (
                <Badge
                  key={k.value}
                  variant={kind === k.value ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setKind(kind === k.value ? null : k.value)}
                >
                  {k.label}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {DATE_FILTERS.map((d) => (
                <Badge
                  key={d.value}
                  variant={dateFilter === d.value ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setDateFilter(d.value)}
                >
                  {d.label}
                </Badge>
              ))}
            </div>
          </div>
        </SectionCard>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <SectionCard className="text-center">
            <div className="py-8 text-muted-foreground">
              <CalendarDays className="mx-auto mb-2 h-8 w-8 text-highlight" />
              Nenhum evento encontrado com esses filtros.
              {!city && (
                <div className="mt-3">
                  <Button variant="accent" onClick={openSelector}>
                    Escolher cidade
                  </Button>
                </div>
              )}
            </div>
          </SectionCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((e, i) => (
              <EventCard key={e.id} event={e} index={i} />
            ))}
          </div>
        )}
        <SectionCard eyebrow="Agenda" title="Próximos eventos no OfertasFly">
          <p className="text-sm text-muted-foreground">
            Aqui você encontra shows, feiras, happy hours e promoções especiais organizados pelas lojas
            parceiras do OfertasFly e pela comunidade da sua cidade. Cada evento traz data, horário, local
            e como participar.
          </p>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nenhum evento programado no momento. Volte em breve!</p>
          ) : (
            <ul className="mt-3 space-y-1 text-sm">
              {upcoming.map((e) => (
                <li key={e.slug}>
                  <Link to={`/evento/${e.slug}`} className="text-accent-strong hover:underline">
                    {e.title}
                  </Link>{" "}
                  <span className="text-muted-foreground">
                    — {fmtDate(e.starts_at)} · {e.city.trim()}/{e.state}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </main>
      <Footer />
    </div>
  );
}
