import { Link } from "@/lib/router-compat";
import { motion } from "framer-motion";
import { Calendar, MapPin, Flame, Music, Store as StoreIcon, PartyPopper, Tag } from "lucide-react";
import type { PublicAgendaEvent } from "@/lib/local-seo";
import { StoreAvatar } from "@/components/site/StoreAvatar";
import { StoreFeaturedBadge } from "@/components/site/StoreFeaturedBadge";
import type { EventKind } from "@/lib/events-api";

const KIND_META: Record<EventKind, { Icon: any; label: string }> = {
  happy_hour: { Icon: Flame, label: "Happy Hour" },
  show: { Icon: Music, label: "Show" },
  feira: { Icon: StoreIcon, label: "Feira" },
  evento: { Icon: PartyPopper, label: "Evento" },
  promocao: { Icon: Tag, label: "Promoção" },
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export const EventCard = ({ event, index = 0 }: { event: PublicAgendaEvent; index?: number }) => {
  const meta = KIND_META[event.kind];
  const Icon = meta.Icon;
  const cover = event.cover_url || event.image_url;
  const isLive =
    new Date(event.starts_at).getTime() <= Date.now() &&
    new Date(event.ends_at).getTime() >= Date.now();

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3) }}
      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-glow"
    >
      <Link to={`/evento/${event.slug}`} className="block">
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {cover ? (
            <img
              src={cover}
              alt={event.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-transparent" />
          <div className="absolute left-3 top-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/95 px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-soft">
              <Icon className="h-3 w-3" /> {meta.label}
            </span>
            {isLive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-hot px-2.5 py-1 text-[11px] font-semibold text-hot-foreground">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-hot-foreground" /> Ao vivo
              </span>
            )}
            {event.featured && !isLive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">
                Destaque
              </span>
            )}
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 text-charcoal-foreground">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium opacity-90">
                <Calendar className="h-3 w-3" />
                {fmtDate(event.starts_at)} · {fmtTime(event.starts_at)}
              </div>
              <h3 className="mt-1 line-clamp-2 text-base font-semibold text-white drop-shadow-sm md:text-lg">
                {event.title}
              </h3>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <StoreAvatar
              name={event.store?.name ?? "Local"}
              logoUrl={event.store?.logo_url ?? null}
              size={22}
            />
            <span className="truncate font-medium text-foreground/80">
              {event.store?.name ?? event.venue ?? "Local a confirmar"}
            </span>
            {event.store?.featured_badge && <StoreFeaturedBadge showLabel={false} />}
          </div>

          {(event.venue || event.city) && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-highlight" />
              <span className="truncate">
                {[event.venue, event.city, event.state].filter(Boolean).join(" · ")}
              </span>
            </div>
          )}

          {event.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
          )}

          {event.price_info && (
            <div className="text-sm font-semibold text-highlight">{event.price_info}</div>
          )}
        </div>
      </Link>
    </motion.article>
  );
};

export default EventCard;
