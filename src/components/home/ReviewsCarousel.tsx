import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { fetchRecentReviews, UIReviewCard } from "@/lib/home-api";

export const ReviewsCarousel = () => {
  const [items, setItems] = useState<UIReviewCard[]>([]);
  const [loading, setLoading] = useState(true);
  const scroll = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRecentReviews(10).then((r) => {
      setItems(r);
      setLoading(false);
    });
  }, []);

  const go = (d: 1 | -1) =>
    scroll.current?.scrollBy({ left: d * (scroll.current.clientWidth * 0.85), behavior: "smooth" });

  if (!loading && !items.length) return null;

  return (
    <section className="container py-16 md:py-20">
      <SectionHeading
        eyebrow="Comunidade"
        title={<>O que estão <span className="aurora-gradient-text">falando por aí</span></>}
        description="Avaliações reais de quem já experimentou. Sem filtros, sem fakes."
        action={
          <div className="flex gap-2">
            <button onClick={() => go(-1)} className="h-10 w-10 rounded-full aurora-glass grid place-items-center hover:bg-white/10" aria-label="Anterior">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => go(1)} className="h-10 w-10 rounded-full aurora-glass grid place-items-center hover:bg-white/10" aria-label="Próximo">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        }
      />
      <div ref={scroll} className="aurora-scroll-x flex gap-5 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
        {(loading ? Array.from({ length: 4 }) : items).map((r: any, i) =>
          loading ? (
            <div key={i} className="shrink-0 w-[340px] h-[220px] rounded-2xl aurora-glass animate-pulse" />
          ) : (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className="shrink-0 w-[340px] snap-start rounded-2xl aurora-glass p-5"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full aurora-gradient-violet grid place-items-center text-white text-sm font-semibold overflow-hidden">
                  {r.author_avatar ? (
                    <img src={r.author_avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (r.author_name?.[0] ?? "?").toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{r.author_name}</div>
                  <div className="text-xs text-[hsl(var(--aurora-muted))] truncate">{r.store_name}</div>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star
                      key={k}
                      className={`h-3.5 w-3.5 ${k < Math.round(r.rating) ? "fill-[hsl(var(--aurora-cyan))] text-[hsl(var(--aurora-cyan))]" : "text-white/20"}`}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-3 text-sm text-white/85 leading-relaxed line-clamp-5">"{r.comment}"</p>
              <div className="mt-4 text-[11px] uppercase tracking-wider text-[hsl(var(--aurora-muted))]">
                sobre {r.offer_title}
              </div>
            </motion.div>
          ),
        )}
      </div>
    </section>
  );
};
