import { useEffect, useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { HeroSearch } from "@/components/site/HeroSearch";
import { FeaturedCarousel } from "@/components/site/FeaturedCarousel";
import { CategoryGrid } from "@/components/site/CategoryGrid";
import { HowItWorks } from "@/components/site/HowItWorks";
import { MerchantCTA } from "@/components/site/MerchantCTA";
import { OffersSection } from "@/components/site/OffersSection";
import { SEO } from "@/components/seo/SEO";
import { fetchOffers, UIOffer } from "@/lib/offers-api";
import { useCity } from "@/hooks/useCity";
import { absoluteUrl, cityLabel } from "@/lib/slug";

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

  const title = city
    ? `Ofertas em ${cityLabel(city)} — Cupons e Descontos | OfertasFly`
    : "OfertasFly — Ofertas, cupons e descontos do comércio local";
  const description = city
    ? `Encontre cupons, descontos e brindes do comércio local em ${cityLabel(city)}. Economize apoiando lojas da sua cidade.`
    : "OfertasFly reúne as melhores ofertas, cupons e descontos das lojas da sua cidade. Economize e apoie o comércio local.";

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

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "OfertasFly",
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icons/icon-512.png"),
    sameAs: [],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title={title} description={description} path="/" jsonLd={websiteLd} />
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
