import { useEffect, useState } from "react";
import { HomeHeader } from "@/components/home/HomeHeader";
import { CategoryChips } from "@/components/home/CategoryChips";
import { HomeHero } from "@/components/home/HomeHero";
import { FeaturedCompanies } from "@/components/home/FeaturedCompanies";
import { OffersOfTheDay } from "@/components/home/OffersOfTheDay";
import { DiscoverRow } from "@/components/home/DiscoverRow";
import { FlyScoreBar } from "@/components/home/FlyScoreSection";
import { ReviewsAndGallery } from "@/components/home/ReviewsAndGallery";
import { CTABanner } from "@/components/home/CTABanner";
import { HomeFooter } from "@/components/home/HomeFooter";
import { SEO } from "@/components/seo/SEO";
import { fetchOffers, UIOffer } from "@/lib/offers-api";
import { fetchActiveGroupOffersAsUIOffers } from "@/lib/group-offers-api";
import { fetchActiveAuctionsAsUIOffers } from "@/lib/auction-api";
import { useCity } from "@/hooks/useCity";
import { absoluteUrl, cityLabel } from "@/lib/slug";

const Index = () => {
  const { city } = useCity();
  const [offers, setOffers] = useState<UIOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchOffers(city ?? undefined),
      fetchActiveGroupOffersAsUIOffers(city ?? undefined),
      fetchActiveAuctionsAsUIOffers(city ?? undefined),
    ]).then(([base, group, auctions]) => {
      const merged = [...base, ...group, ...auctions].sort(
        (a, b) =>
          Number(!!b.featured) - Number(!!a.featured) ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setOffers(merged);
      setLoading(false);
    });
  }, [city?.city, city?.state]);



  const title = city
    ? `OfertasFly em ${cityLabel(city)} — Descubra o melhor da sua cidade`
    : "OfertasFly — Descubra o melhor da sua cidade";
  const description = city
    ? `Ofertas, eventos e empresas verificadas em ${cityLabel(city)}. Recomendações personalizadas e FlyScore em tempo real.`
    : "Plataforma de descoberta local: ofertas, eventos e empresas verificadas da sua cidade, com recomendações personalizadas.";

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "OfertasFly",
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/")}?q={search_term_string}#ofertas`,
      "query-input": "required name=search_term_string",
    },
  };
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "OfertasFly",
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icons/icon-512.png"),
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title={title} description={description} path="/" jsonLd={[websiteLd, orgLd]} />
      <HomeHeader />
      <main>
        <HomeHero offers={offers} />
        <FeaturedCompanies />
        <div className="container pt-6 md:pt-8">
          <CategoryChips />
        </div>
        <OffersOfTheDay offers={offers} loading={loading} />

        <DiscoverRow />
        <FlyScoreBar />
        <ReviewsAndGallery />
        <CTABanner />
      </main>
      <HomeFooter />
    </div>
  );
};

export default Index;
