import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Tag } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { fetchRecommendedOffers } from "@/lib/home-api";
import type { UIOffer } from "@/lib/offers-api";
import { discountPct, formatBRL } from "@/lib/offers-api";
import { useAuth } from "@/hooks/useAuth";
import { useCity } from "@/hooks/useCity";

export const Recommended = () => {
  const { user } = useAuth();
  const { city } = useCity();
  const [offers, setOffers] = useState<UIOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchRecommendedOffers(city ?? undefined, user?.id).then((o) => {
      setOffers(o);
      setLoading(false);
    });
  }, [city?.city, user?.id]);

  if (!loading && !offers.length) return null;

  return (
    <section className="container py-16 md:py-20">
      <SectionHeading
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Personalizadas para você
          </span>
        }
        title={<>Recomendadas <span className="aurora-gradient-text">com base em você</span></>}
        description="Combinação de suas categorias favoritas, localização e histórico recente."
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {(loading ? Array.from({ length: 4 }) : offers.slice(0, 4)).map((o: any, i) =>
          loading ? (
            <div key={i} className="aspect-[4/5] rounded-2xl aurora-glass animate-pulse" />
          ) : (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
            >
              <Link to={`/oferta/${o.id}`} className="group block rounded-2xl overflow-hidden aurora-glass aurora-ring">
                <div className="relative aspect-square overflow-hidden">
                  <img src={o.image} alt={o.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {discountPct(o) > 0 && (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full aurora-gradient-bg px-2.5 py-1 text-[11px] font-bold">
                      <Tag className="h-3 w-3" /> {discountPct(o)}% OFF
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-[11px] uppercase tracking-wider text-[hsl(var(--aurora-muted))]">{o.storeName}</div>
                  <h3 className="mt-1 text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem]">{o.title}</h3>
                  {o.promoPrice > 0 && (
                    <div className="mt-2 text-lg font-bold aurora-gradient-text">{formatBRL(o.promoPrice)}</div>
                  )}
                </div>
              </Link>
            </motion.div>
          ),
        )}
      </div>
    </section>
  );
};
