import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { CompanyCard } from "./CompanyCard";
import { fetchFeaturedCompanies, UICompany } from "@/lib/home-api";
import { useCity } from "@/hooks/useCity";

export const FeaturedCompanies = () => {
  const { city } = useCity();
  const [items, setItems] = useState<UICompany[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    fetchFeaturedCompanies(city ?? undefined).then((c) => {
      setItems(c);
      setLoading(false);
    });
  }, [city?.city]);

  const scroll = (dir: 1 | -1) =>
    scrollRef.current?.scrollBy({ left: dir * (scrollRef.current.clientWidth * 0.8), behavior: "smooth" });

  if (!loading && !items.length) return null;

  return (
    <section className="container py-16 md:py-20">
      <SectionHeading
        eyebrow="Empresas em destaque"
        title={<>As mais amadas <span className="aurora-gradient-text">da sua região</span></>}
        description="Verificadas, avaliadas pela comunidade e com melhor FlyScore da semana."
        action={
          <div className="flex gap-2">
            <button
              onClick={() => scroll(-1)}
              className="h-10 w-10 rounded-full aurora-glass grid place-items-center hover:bg-white/10 transition"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll(1)}
              className="h-10 w-10 rounded-full aurora-glass grid place-items-center hover:bg-white/10 transition"
              aria-label="Próximo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        }
      />
      <div ref={scrollRef} className="aurora-scroll-x flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[320px] aspect-[4/5] rounded-2xl aurora-glass animate-pulse" />
            ))
          : items.map((c) => (
              <div key={c.id} className="shrink-0 w-[320px] snap-start">
                <CompanyCard company={c} />
              </div>
            ))}
      </div>
    </section>
  );
};
