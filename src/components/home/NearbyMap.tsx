import { Suspense, lazy, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { useCity } from "@/hooks/useCity";
import { useUserLocation } from "@/hooks/useUserLocation";
import { fetchOffers, UIOffer } from "@/lib/offers-api";

const OffersMap = lazy(() => import("@/components/site/OffersMap").then((m) => ({ default: m.OffersMap })));

export const NearbyMap = () => {
  const { city } = useCity();
  const { loc, request } = useUserLocation();
  const [offers, setOffers] = useState<UIOffer[]>([]);

  useEffect(() => {
    fetchOffers(city ?? undefined).then((o) => setOffers(o.filter((x) => x.storeLat && x.storeLng).slice(0, 40)));
  }, [city?.city]);

  return (
    <section className="container py-16 md:py-20">
      <SectionHeading
        eyebrow="Descubra perto"
        title={<>Explore o que está <span className="aurora-gradient-text">ao seu redor</span></>}
        description="Ativa sua localização e veja empresas, ofertas e eventos próximos em um mapa interativo."
        action={
          <button
            onClick={request}
            className="inline-flex items-center gap-2 rounded-full aurora-gradient-bg px-4 py-2 text-sm font-medium aurora-glow hover:brightness-110 transition"
          >
            <Navigation className="h-4 w-4" /> Usar minha localização
          </button>
        }
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative rounded-3xl overflow-hidden aurora-glass aurora-glow h-[440px] md:h-[520px]"
      >
        {offers.length ? (
          <Suspense fallback={<div className="h-full w-full grid place-items-center text-[hsl(var(--aurora-muted))]">Carregando mapa…</div>}>
            <OffersMap offers={offers} userLoc={loc} />
          </Suspense>
        ) : (
          <div className="h-full w-full grid place-items-center text-[hsl(var(--aurora-muted))]">
            <div className="text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-[hsl(var(--aurora-cyan))]" />
              Nenhuma empresa geolocalizada {city ? `em ${city.city}` : ""} ainda.
            </div>
          </div>
        )}
      </motion.div>
    </section>
  );
};
