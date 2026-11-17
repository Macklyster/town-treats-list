import { useRef } from "react";
import { Link } from "@/lib/router-compat";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { UIOffer } from "@/lib/offers-api";
import { discountPct, formatBRL } from "@/lib/offers-api";
import { SectionHeading } from "./SectionHeading";

export const OffersOfTheDay = ({ offers, loading }: { offers: UIOffer[]; loading: boolean }) => {
  const list = offers.slice(0, 10);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) =>
    scrollRef.current?.scrollBy({ left: dir * (scrollRef.current.clientWidth * 0.8), behavior: "smooth" });

  return (
    <section id="ofertas" className="container py-10 md:py-14">
      <SectionHeading
        title="Ofertas do dia"
        description="Aproveite as melhores ofertas e descontos da sua cidade."
        action={
          <Link to="/#ofertas" className="hidden md:inline-flex text-sm font-medium text-primary hover:underline">
            Ver todas as ofertas →
          </Link>
        }
      />
      <div className="relative">
        <button
          onClick={() => scroll(-1)}
          className="hidden md:grid absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card border border-border shadow-card place-items-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => scroll(1)}
          className="hidden md:grid absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card border border-border shadow-card place-items-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition"
          aria-label="Próximo"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="flex gap-4 -mx-4 px-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[240px] aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : list.length ? (
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {list.map((o) => {
              const off = discountPct(o);
              const href = o.isGroup && o.groupToken
                ? `/coletiva/${o.groupToken}`
                : o.isAuction && o.auctionToken
                  ? `/leilao/${o.auctionToken}`
                  : `/oferta/${o.id}`;
              const badge = o.isGroup
                ? { label: "Coletiva", cls: "bg-primary text-primary-foreground" }
                : o.isAuction
                  ? { label: "Leilão", cls: "bg-primary text-primary-foreground" }
                  : o.isFlash
                    ? { label: "⚡ Relâmpago", cls: "bg-accent text-accent-foreground" }
                    : null;

              return (
                <Link
                  key={o.id}
                  to={href}
                  className="group shrink-0 w-[240px] snap-start rounded-2xl overflow-hidden bg-card border border-border shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <img
                      src={o.image}
                      alt={o.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {badge && (
                      <span className={`absolute top-3 right-3 rounded-md px-2 py-1 text-[11px] font-bold shadow-soft ${badge.cls}`}>
                        {badge.label}
                      </span>
                    )}

                    {off > 0 && (
                      <span className="absolute top-3 left-3 rounded-md bg-destructive px-2 py-1 text-[11px] font-bold text-destructive-foreground shadow-soft">
                        {off}% OFF
                      </span>
                    )}
                  </div>


                  <div className="p-4">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                      {o.storeName}
                    </div>
                    <h3 className="mt-1 text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem] text-foreground">
                      {o.title}
                    </h3>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-primary">
                        {o.promoPrice > 0 ? formatBRL(o.promoPrice) : "Grátis"}
                      </span>
                      {o.originalPrice > 0 && o.promoPrice < o.originalPrice && (
                        <span className="text-xs line-through text-muted-foreground">
                          {formatBRL(o.originalPrice)}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 rounded-full bg-primary py-2 text-center text-xs font-semibold text-primary-foreground group-hover:bg-primary-deep transition-colors">
                      Ver oferta
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-card border border-border p-10 text-center text-muted-foreground">
            Nenhuma oferta ativa na sua cidade ainda. Volte em breve!
          </div>
        )}
      </div>
    </section>
  );
};
