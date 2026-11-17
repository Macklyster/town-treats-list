import { useEffect, useRef, useState } from "react";
import { Link } from "@/lib/router-compat";
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
    <section className="container py-10 md:py-14">
      <SectionHeading
        title="Empresas em destaque"
        description="As melhores empresas da cidade, escolhidas para você."
        action={
          <Link to="/#ofertas" className="hidden md:inline-flex text-sm font-medium text-primary hover:underline">
            Ver todas →
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
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="shrink-0 w-[260px] aspect-[4/5] rounded-2xl bg-muted animate-pulse" />
              ))
            : items.map((c) => (
                <div key={c.id} className="shrink-0 w-[260px] snap-start">
                  <CompanyCard company={c} />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
};
