import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Tag } from "lucide-react";
import type { UIOffer } from "@/lib/offers-api";
import { discountPct, formatBRL } from "@/lib/offers-api";
import { SectionHeading } from "./SectionHeading";

export const OffersOfTheDay = ({ offers, loading }: { offers: UIOffer[]; loading: boolean }) => {
  const list = offers.slice(0, 8);

  return (
    <section id="ofertas" className="container py-16 md:py-20">
      <SectionHeading
        eyebrow="Ofertas do dia"
        title={<>Descontos <span className="aurora-gradient-text">imperdíveis</span> hoje</>}
        description="Selecionadas por relevância, popularidade e prazo. Aproveite antes que voem."
        action={
          <Link
            to="/#ofertas"
            className="hidden md:inline-flex items-center gap-1.5 text-sm text-[hsl(var(--aurora-cyan))] hover:underline"
          >
            Ver todas <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-2xl aurora-glass animate-pulse" />
          ))}
        </div>
      ) : list.length ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {list.map((o, i) => {
            const off = discountPct(o);
            return (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
              >
                <Link
                  to={`/oferta/${o.id}`}
                  className="group block rounded-2xl overflow-hidden aurora-glass aurora-ring"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={o.image}
                      alt={o.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {off > 0 && (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full aurora-gradient-bg px-2.5 py-1 text-[11px] font-bold">
                        <Tag className="h-3 w-3" />
                        {off}% OFF
                      </span>
                    )}
                    {o.isFlash && (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-[hsl(var(--aurora-hot))] px-2.5 py-1 text-[11px] font-bold text-white">
                        <Clock className="h-3 w-3" /> Flash
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-[11px] uppercase tracking-wider text-[hsl(var(--aurora-muted))]">
                      {o.storeName}
                    </div>
                    <h3 className="mt-1 text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem]">
                      {o.title}
                    </h3>
                    <div className="mt-3 flex items-end justify-between gap-2">
                      <div>
                        {o.originalPrice > 0 && o.promoPrice < o.originalPrice && (
                          <div className="text-xs line-through text-[hsl(var(--aurora-muted))]">
                            {formatBRL(o.originalPrice)}
                          </div>
                        )}
                        <div className="text-lg font-bold aurora-gradient-text">
                          {o.promoPrice > 0 ? formatBRL(o.promoPrice) : "Grátis"}
                        </div>
                      </div>
                      <span className="rounded-full aurora-glass px-2.5 py-1.5 text-[11px] font-medium group-hover:aurora-gradient-bg transition-colors">
                        Ver oferta
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl aurora-glass p-10 text-center text-[hsl(var(--aurora-muted))]">
          Nenhuma oferta ativa na sua cidade ainda. Volte em breve!
        </div>
      )}
    </section>
  );
};
