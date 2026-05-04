import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { HeroSearch } from "@/components/site/HeroSearch";
import { FeaturedCarousel } from "@/components/site/FeaturedCarousel";
import { CategoryGrid } from "@/components/site/CategoryGrid";
import { HowItWorks } from "@/components/site/HowItWorks";
import { MerchantCTA } from "@/components/site/MerchantCTA";
import { OfferCard } from "@/components/site/OfferCard";
import { fetchOffers, UIOffer } from "@/lib/offers-api";

const Index = () => {
  const [offers, setOffers] = useState<UIOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers().then((o) => {
      setOffers(o);
      setLoading(false);
    });
  }, []);

  const featured = offers.filter((o) => o.featured).slice(0, 4);
  const grid = offers.slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSearch />
        <FeaturedCarousel offers={featured} />

        <section className="container py-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-primary md:text-4xl">Ofertas em destaque</h2>
              <p className="mt-2 text-muted-foreground">Selecionadas pela nossa equipe.</p>
            </div>
            <Link to="/ofertas" className="text-sm font-semibold text-accent-strong hover:underline">
              Ver todas →
            </Link>
          </div>
          {loading ? (
            <p className="text-muted-foreground">Carregando ofertas…</p>
          ) : grid.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-16 text-center">
              <p className="text-lg font-semibold text-primary">Nenhuma oferta publicada ainda</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Volte em breve — novas promoções estão a caminho.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {grid.map((o) => (
                <OfferCard key={o.id} offer={o} />
              ))}
            </div>
          )}
        </section>

        <CategoryGrid />
        <HowItWorks />
        <MerchantCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
