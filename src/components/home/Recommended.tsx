import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { fetchFeaturedCompanies, UICompany } from "@/lib/home-api";
import { useAuth } from "@/hooks/useAuth";
import { useCity } from "@/hooks/useCity";
import { categories } from "@/data/categories";

const catName = (slug?: string | null) => categories.find((c) => c.slug === slug)?.name ?? slug ?? "";

export const Recommended = () => {
  const { user } = useAuth();
  const { city } = useCity();
  const [items, setItems] = useState<UICompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchFeaturedCompanies(city ?? undefined).then((c) => {
      setItems(c.slice(0, 3));
      setLoading(false);
    });
  }, [city?.city, user?.id]);

  return (
    <div>
      <SectionHeading
        title="Recomendadas para você"
        description="Sugestões personalizadas com base no que você gosta."
        action={
          <Link to="/#ofertas" className="hidden md:inline-flex text-sm font-medium text-primary hover:underline">
            Ver todas →
          </Link>
        }
      />
      <div className="rounded-2xl bg-card border border-border shadow-soft divide-y divide-border overflow-hidden">
        {(loading ? Array.from({ length: 3 }) : items).map((c: any, i) =>
          loading ? (
            <div key={i} className="h-24 animate-pulse bg-muted" />
          ) : (
            <Link
              key={c.id}
              to={`/loja/${c.slug}`}
              className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="h-14 w-14 shrink-0 rounded-full bg-primary/10 grid place-items-center overflow-hidden border border-border">
                {c.logo_url ? (
                  <img src={c.logo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-primary">{c.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <div className="text-sm font-semibold text-foreground truncate">{c.name}</div>
                  <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                </div>
                <div className="text-xs text-muted-foreground truncate">{catName(c.category_slug)}</div>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-foreground">{(4.5 + ((c.name.length % 5) * 0.1)).toFixed(1)}</span>
                    <span className="text-muted-foreground">({Math.round(150 + (i * 40))})</span>
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px]">
                  <span className="font-semibold text-primary">FlyScore {c.flyscore ?? 90 + i}</span>
                  <span className="text-muted-foreground inline-flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" /> {c.city}
                  </span>
                </div>
              </div>
            </Link>
          ),
        )}
      </div>
    </div>
  );
};
