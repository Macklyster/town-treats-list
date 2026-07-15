import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Clock,
  ExternalLink,
  MessageCircle,
  Share2,
  Copy,
  ArrowLeft,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StoreAvatar } from "@/components/site/StoreAvatar";
import { StoreFeaturedBadge } from "@/components/site/StoreFeaturedBadge";
import { fetchEventBySlug, trackEventView, EVENT_KINDS, type UIEventWithStore } from "@/lib/events-api";
import { toast } from "sonner";

const fmtDateLong = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function EventoPublic() {
  const { slug } = useParams();
  const [event, setEvent] = useState<UIEventWithStore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchEventBySlug(slug).then((e) => {
      setEvent(e);
      setLoading(false);
      if (e?.id) trackEventView(e.id);
    });
  }, [slug]);

  const kindLabel = useMemo(
    () => EVENT_KINDS.find((k) => k.value === event?.kind)?.label ?? "Evento",
    [event?.kind],
  );

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const jsonLd = useMemo(() => {
    if (!event) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "Event",
      name: event.title,
      startDate: event.starts_at,
      endDate: event.ends_at,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      description: event.description ?? undefined,
      image: event.cover_url || event.image_url || undefined,
      location: {
        "@type": "Place",
        name: event.venue ?? event.store?.name ?? event.city,
        address: [event.address, event.city, event.state].filter(Boolean).join(", "),
      },
      organizer: event.store
        ? { "@type": "Organization", name: event.store.name }
        : undefined,
    };
  }, [event]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-10">
          <div className="mx-auto h-96 max-w-4xl animate-pulse rounded-3xl bg-muted" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-10">
          <Alert>
            <AlertTitle>Evento não encontrado</AlertTitle>
            <AlertDescription>
              Este evento pode ter sido encerrado ou removido.{" "}
              <Link to="/eventos" className="underline">
                Ver outros eventos
              </Link>
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  const cover = event.cover_url || event.image_url;
  const wa = event.store?.whatsapp ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title={`${event.title} — ${event.city}`}
        description={
          event.description?.slice(0, 155) ??
          `${kindLabel} em ${event.city} em ${new Date(event.starts_at).toLocaleDateString("pt-BR")}.`
        }
        path={`/evento/${event.slug}`}
        image={cover ?? undefined}
        jsonLd={jsonLd}
      />
      <Header />
      <main className="container flex-1 space-y-6 py-8">
        <Button asChild variant="ghost" size="sm">
          <Link to="/eventos">
            <ArrowLeft className="h-4 w-4" /> Todos os eventos
          </Link>
        </Button>

        <article className="mx-auto max-w-4xl space-y-6">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-card">
            {cover ? (
              <img src={cover} alt={event.title} className="aspect-[21/9] w-full object-cover" />
            ) : (
              <div className="aspect-[21/9] w-full bg-gradient-to-br from-primary/30 to-accent/30" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 space-y-3 p-6 text-charcoal-foreground md:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary text-primary-foreground">{kindLabel}</Badge>
                {event.featured && <Badge className="bg-accent text-accent-foreground">Destaque</Badge>}
              </div>
              <h1 className="font-display text-3xl font-medium tracking-tight text-white drop-shadow md:text-5xl">
                {event.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/90">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> {fmtDateLong(event.starts_at)}
                </span>
                {event.venue && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {event.venue}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              {event.description && (
                <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <h2 className="mb-3 font-display text-xl font-medium tracking-tight">Sobre o evento</h2>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {event.description}
                  </p>
                </section>
              )}

              <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card sm:grid-cols-2">
                <div>
                  <div className="label-eyebrow text-primary">Início</div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-foreground">
                    <Calendar className="h-4 w-4 text-primary" />
                    {fmtDateLong(event.starts_at)}
                  </div>
                </div>
                <div>
                  <div className="label-eyebrow text-primary">Término</div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-foreground">
                    <Clock className="h-4 w-4 text-primary" />
                    {fmtDateLong(event.ends_at)}
                  </div>
                </div>
                {(event.venue || event.address) && (
                  <div className="sm:col-span-2">
                    <div className="label-eyebrow text-primary">Local</div>
                    <div className="mt-1 flex items-start gap-2 text-sm text-foreground">
                      <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                      <span>
                        {event.venue && <strong>{event.venue}</strong>}
                        {event.venue && event.address && " · "}
                        {event.address}
                        <div className="text-muted-foreground">
                          {event.city} - {event.state}
                        </div>
                      </span>
                    </div>
                  </div>
                )}
                {event.price_info && (
                  <div className="sm:col-span-2">
                    <div className="label-eyebrow text-primary">Ingresso</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">{event.price_info}</div>
                  </div>
                )}
              </section>

              {event.latitude != null && event.longitude != null && (
                <section className="overflow-hidden rounded-2xl border border-border shadow-card">
                  <iframe
                    title="Mapa do evento"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${event.longitude - 0.01}%2C${event.latitude - 0.01}%2C${event.longitude + 0.01}%2C${event.latitude + 0.01}&layer=mapnik&marker=${event.latitude}%2C${event.longitude}`}
                    className="h-64 w-full"
                    loading="lazy"
                  />
                </section>
              )}
            </div>

            <aside className="space-y-4">
              {event.store && (
                <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <div className="flex items-center gap-3">
                    <StoreAvatar
                      name={event.store.name}
                      logoUrl={event.store.logo_url ?? null}
                      size={44}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <span className="truncate">{event.store.name}</span>
                        {event.store.featured_badge && <StoreFeaturedBadge showLabel={false} />}
                      </div>
                      <div className="text-xs text-muted-foreground">Organizador</div>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                    <Link to={`/loja/${event.store.slug}`}>Ver loja</Link>
                  </Button>
                </div>
              )}

              <div className="space-y-2 rounded-2xl border border-border bg-card p-5 shadow-card">
                {event.link_url && (
                  <Button asChild variant="accent" className="w-full">
                    <a href={event.link_url} target="_blank" rel="noreferrer noopener">
                      <ExternalLink className="h-4 w-4" /> Site / ingressos
                    </a>
                  </Button>
                )}
                {wa && (
                  <Button asChild variant="outline" className="w-full">
                    <a
                      href={`https://wa.me/${wa.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá! Vi o evento "${event.title}" na OfertasFly.`)}`}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={async () => {
                    if (navigator.share) {
                      try {
                        await navigator.share({ title: event.title, url: shareUrl });
                      } catch {
                        /* cancelado */
                      }
                    } else {
                      navigator.clipboard.writeText(shareUrl);
                      toast.success("Link copiado!");
                    }
                  }}
                >
                  <Share2 className="h-4 w-4" /> Compartilhar
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Link copiado!");
                  }}
                >
                  <Copy className="h-4 w-4" /> Copiar link
                </Button>
              </div>
            </aside>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
