import { useEffect, useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { HeroSearch } from "@/components/site/HeroSearch";
import { FeaturedCarousel } from "@/components/site/FeaturedCarousel";
import { CategoryGrid } from "@/components/site/CategoryGrid";
import { HowItWorks } from "@/components/site/HowItWorks";
import { MerchantCTA } from "@/components/site/MerchantCTA";
import { OffersSection } from "@/components/site/OffersSection";
import { fetchOffers, UIOffer } from "@/lib/offers-api";
import { useCity } from "@/hooks/useCity";

const Index = () => {
  const { city } = useCity();
  const [offers, setOffers] = useState<UIOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city) {
      setOffers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchOffers(city).then((o) => {
      setOffers(o);
      setLoading(false);
    });
  }, [city?.city, city?.state]);

  const featured = offers.filter((o) => o.featured).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSearch />
        <FeaturedCarousel offers={featured} />
        <OffersSection offers={offers} loading={loading} />
        <CategoryGrid />
        <HowItWorks />
        <MerchantCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
