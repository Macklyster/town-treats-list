import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Heart, Store as StoreIcon, Tag } from "lucide-react";
import { Header } from "@/components/site/Header";
import { PageHero } from "@/components/site/PageHero";
import { Footer } from "@/components/site/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OfferCard } from "@/components/site/OfferCard";
import { StoreAvatar } from "@/components/site/StoreAvatar";
import { FavoriteButton } from "@/components/site/FavoriteButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UIOffer, mapRow } from "@/lib/offers-api";

type FavStore = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  cover_url: string | null;
};

export default function Favoritos() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<UIOffer[]>([]);
  const [stores, setStores] = useState<FavStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const [{ data: favOffers }, { data: favStores }] = await Promise.all([
        supabase
          .from("favorites")
          .select("offer_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("store_favorites" as any)
          .select("store_id,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      const offerIds = (favOffers ?? []).map((f) => f.offer_id).filter(Boolean);
      if (offerIds.length) {
        const { data } = await supabase
          .from("offers")
          .select(
            "*, store:stores!inner(name,slug,city,state,logo_url,featured_badge,latitude,longitude)",
          )
          .in("id", offerIds)
          .eq("status", "approved");
        setOffers((data ?? []).map(mapRow));
      } else {
        setOffers([]);
      }

      const storeIds = (favStores ?? []).map((f: any) => f.store_id).filter(Boolean);
      if (storeIds.length) {
        const { data } = await supabase
          .from("stores")
          .select("id,name,slug,city,state,logo_url,cover_url")
          .in("id", storeIds)
          .eq("approved", true);
        // preserve favorite order
        const rank = new Map<string, number>(storeIds.map((id: string, i: number) => [id, i]));
        const sorted = (data ?? []).slice().sort(
          (a: any, b: any) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0),
        );
        setStores(sorted as FavStore[]);
      } else {
        setStores([]);
      }

      setLoading(false);
    })();
  }, [user?.id]);

  const empty = (
    icon: any,
    text: string,
    ctaTo: string,
    ctaLabel: string,
  ) => {
    const Icon = icon;
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Icon className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">{text}</p>
          <Link
            to={ctaTo}
            className="mt-4 inline-block text-sm font-medium text-highlight hover:text-highlight-strong hover:underline"
          >
            {ctaLabel}
          </Link>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 space-y-8 py-8 md:py-10">
        <PageHero
          eyebrow="Sua conta"
          title="Favoritos"
          subtitle="As ofertas e lojas que você salvou para acompanhar depois."
          crumbs={[{ label: "Início", to: "/" }, { label: "Favoritos" }]}
          compact
        />

        {loading ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : !user ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                Entre para salvar suas ofertas e lojas favoritas.
              </p>
              <Link
                to="/auth"
                className="mt-4 inline-block text-sm font-medium text-highlight hover:text-highlight-strong hover:underline"
              >
                Entrar
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="ofertas">
            <TabsList>
              <TabsTrigger value="ofertas">
                <Tag className="h-4 w-4" /> Ofertas ({offers.length})
              </TabsTrigger>
              <TabsTrigger value="lojas">
                <StoreIcon className="h-4 w-4" /> Lojas ({stores.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ofertas" className="mt-6">
              {offers.length === 0
                ? empty(Tag, "Você ainda não tem ofertas favoritas.", "/", "Explorar ofertas")
                : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {offers.map((offer) => (
                      <OfferCard key={offer.id} offer={offer} />
                    ))}
                  </div>
                )}
            </TabsContent>

            <TabsContent value="lojas" className="mt-6">
              {stores.length === 0
                ? empty(StoreIcon, "Você ainda não favoritou nenhuma loja.", "/", "Explorar lojas")
                : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {stores.map((s) => (
                      <Card key={s.id} className="overflow-hidden transition hover:border-primary/40">
                        <Link to={`/loja/${s.slug}`}>
                          <div className="aspect-[16/9] bg-muted">
                            {s.cover_url && (
                              <img
                                src={s.cover_url}
                                alt=""
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            )}
                          </div>
                        </Link>
                        <CardContent className="flex items-start gap-3 p-4">
                          <StoreAvatar name={s.name} logoUrl={s.logo_url} size={40} />
                          <div className="min-w-0 flex-1">
                            <Link to={`/loja/${s.slug}`} className="block">
                              <div className="line-clamp-1 text-sm font-semibold text-foreground">
                                {s.name}
                              </div>
                              {s.city && (
                                <div className="text-xs text-muted-foreground">
                                  {s.city}{s.state ? ` - ${s.state}` : ""}
                                </div>
                              )}
                            </Link>
                          </div>
                          <FavoriteButton type="store" id={s.id} variant="icon" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
            </TabsContent>
          </Tabs>
        )}
      </main>
      <Footer />
    </div>
  );
}
