import { Link } from "react-router-dom";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import type { UICompany } from "@/lib/home-api";
import { useUserLocation } from "@/hooks/useUserLocation";
import { haversineKm, formatDistance } from "@/lib/geo";
import { categories } from "@/data/categories";

const catName = (slug?: string | null) => categories.find((c) => c.slug === slug)?.name ?? slug ?? "";

export const CompanyCard = ({ company }: { company: UICompany }) => {
  const { loc } = useUserLocation();
  const dist =
    loc && company.latitude && company.longitude
      ? haversineKm(loc, { lat: company.latitude, lng: company.longitude })
      : null;
  const score = company.flyscore ?? Math.round(90 + (company.name.length % 10));
  const rating = 4.5 + ((company.name.length % 5) * 0.1);

  return (
    <Link
      to={`/loja/${company.slug}`}
      className="group block rounded-2xl overflow-hidden bg-card border border-border shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={company.cover_url ?? ""}
          alt={company.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--open-bg))] px-2.5 py-1 text-[11px] font-semibold text-[hsl(var(--open))]">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--open))]" />
          Aberto agora
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="-mt-9 h-12 w-12 shrink-0 rounded-full bg-card border-2 border-card shadow-soft grid place-items-center overflow-hidden">
            {company.logo_url ? (
              <img src={company.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-primary">
                {company.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex items-center gap-1">
              <h3 className="text-[15px] font-semibold text-foreground truncate">{company.name}</h3>
              <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {catName(company.category_slug)}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs">
          <div className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({Math.round(150 + (score % 300))})</span>
          </div>
          <span className="text-muted-foreground">·</span>
          <span className="font-semibold text-primary">FlyScore {score}</span>
        </div>

        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {dist != null ? `${formatDistance(dist)} · ${company.city}` : `${company.city}`}
        </div>
      </div>
    </Link>
  );
};
