import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { HeroSearch } from "@/components/site/HeroSearch";
import { FeaturedCarousel } from "@/components/site/FeaturedCarousel";
import { CategoryGrid } from "@/components/site/CategoryGrid";
import { HowItWorks } from "@/components/site/HowItWorks";
import { MerchantCTA } from "@/components/site/MerchantCTA";
import { OfferCard } from "@/components/site/OfferCard";
import { offers } from "@/data/offers";
import { Link } from "react-router-dom";

const Index = () => {
  const featured = offers.filter((o) => o.featured);
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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {grid.map((o) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
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
