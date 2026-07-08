import { Link } from "react-router-dom";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import { motion } from "framer-motion";
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
  const score = company.flyscore ?? 4.6 + ((company.name.length % 4) * 0.1);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="group relative aurora-glass aurora-ring rounded-2xl overflow-hidden"
    >
      <Link to={`/loja/${company.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={company.cover_url ?? ""}
            alt={company.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          {company.is_open && (
            <span className="absolute top-3 right-3 aurora-chip !bg-[hsl(var(--aurora-success))/0.15] !border-[hsl(var(--aurora-success))/0.4] !text-[hsl(var(--aurora-success))]">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--aurora-success))]" />
              Aberto
            </span>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="-mt-10 h-14 w-14 shrink-0 rounded-2xl aurora-glass-strong grid place-items-center overflow-hidden border-2 border-[hsl(var(--aurora-bg))]">
              {company.logo_url ? (
                <img src={company.logo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-semibold aurora-gradient-text">
                  {company.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-semibold truncate">{company.name}</h3>
                <BadgeCheck className="h-4 w-4 shrink-0 text-[hsl(var(--aurora-cyan))]" />
              </div>
              <p className="text-xs text-[hsl(var(--aurora-muted))] mt-0.5 truncate">
                {catName(company.category_slug)} · {company.city}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-[hsl(var(--aurora-cyan))] text-[hsl(var(--aurora-cyan))]" />
              <span className="text-sm font-semibold">{score.toFixed(1)}</span>
              <span className="text-xs text-[hsl(var(--aurora-muted))]">FlyScore</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-[hsl(var(--aurora-muted))]">
              <MapPin className="h-3.5 w-3.5" />
              {dist != null ? formatDistance(dist) : "—"}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
