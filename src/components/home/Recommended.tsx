import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { OffersOfTheDay } from "./OffersOfTheDay";
import { SectionHeading } from "./SectionHeading";
import { fetchRecommendedOffers } from "@/lib/home-api";
import type { UIOffer } from "@/lib/offers-api";
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
          </span> as any
        }
        title={<>Recomendadas <span className="aurora-gradient-text">com base em você</span></>}
        description="Combinação de suas categorias favoritas, localização e histórico recente."
      />
      <OffersOfTheDay offers={offers} loading={loading} />
    </section>
  );
};
