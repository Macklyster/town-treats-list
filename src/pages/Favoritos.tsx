import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Header } from "@/components/site/Header";
import { PageHero } from "@/components/site/PageHero";
import { Footer } from "@/components/site/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { OfferCard } from "@/components/site/OfferCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UIOffer, mapRow } from "@/lib/offers-api";

export default function Favoritos() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<UIOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: favorites } = await supabase
        .from("favorites")
        .select("offer_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const ids = (favorites ?? []).map((f) => f.offer_id).filter(Boolean);
      if (ids.length === 0) {
        setOffers([]);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("offers")
        .select(
          "*, store:stores!inner(name,slug,city,state,logo_url,featured_badge,latitude,longitude)",
        )
        .in("id", ids)
        .eq("status", "approved");

      setOffers((data ?? []).map(mapRow));
      setLoading(false);
    })();
  }, [user?.id]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 space-y-8 py-8 md:py-10">
        <PageHero
          eyebrow="Sua conta"
          title="Favoritos"
          subtitle="As ofertas que você salvou para aproveitar depois."
          crumbs={[{ label: "Início", to: "/" }, { label: "Favoritos" }]}
          compact
        />

        {loading ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : offers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                Você ainda não tem ofertas favoritas.
              </p>
              <Link
                to="/"
                className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
              >
                Explorar ofertas
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
