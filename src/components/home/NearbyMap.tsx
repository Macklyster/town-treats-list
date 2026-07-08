import { Suspense, lazy, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { useCity } from "@/hooks/useCity";
import { useUserLocation } from "@/hooks/useUserLocation";
import { fetchOffers, UIOffer } from "@/lib/offers-api";
import { fetchActiveGroupOffersAsUIOffers } from "@/lib/group-offers-api";
import { fetchActiveAuctionsAsUIOffers } from "@/lib/auction-api";

const OffersMap = lazy(() => import("@/components/site/OffersMap").then((m) => ({ default: m.OffersMap })));

export const NearbyMap = () => {
  const { city } = useCity();
  const { loc } = useUserLocation();
  const [offers, setOffers] = useState<UIOffer[]>([]);

  useEffect(() => {
    Promise.all([
      fetchOffers(city ?? undefined),
      fetchActiveGroupOffersAsUIOffers(city ?? undefined),
      fetchActiveAuctionsAsUIOffers(city ?? undefined),
    ]).then(([base, group, auctions]) => {
      const all = [...base, ...group, ...auctions].filter((x) => x.storeLat && x.storeLng);
      setOffers(all.slice(0, 80));
    });
  }, [city?.city, city?.state]);


  return (
    <div>
      <SectionHeading
        title="Descubra perto de você"
        description="Explore empresas incríveis próximas de você."
      />
      <div className="relative isolate z-0 rounded-2xl overflow-hidden bg-card border border-border shadow-soft h-[320px]">
        {offers.length ? (
          <Suspense fallback={<div className="h-full w-full grid place-items-center text-muted-foreground text-sm">Carregando mapa…</div>}>
            <OffersMap offers={offers} userLoc={loc} />
          </Suspense>
        ) : (
          <div className="h-full w-full grid place-items-center text-muted-foreground text-sm">
            <div className="text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-primary" />
              Nenhuma empresa geolocalizada {city ? `em ${city.city}` : ""} ainda.
            </div>
          </div>
        )}
        <Link
          to="/#ofertas"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full bg-card border border-border shadow-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition"
        >
          <MapPin className="h-3.5 w-3.5" />
          Explorar no mapa
        </Link>
      </div>
    </div>
  );
};
