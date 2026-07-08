import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { OfferCard } from "@/components/site/OfferCard";
import { SEO } from "@/components/seo/SEO";
import { StoreAvatar } from "@/components/site/StoreAvatar";
import { StoreFeaturedBadge } from "@/components/site/StoreFeaturedBadge";
import { FollowStoreButton } from "@/components/site/FollowStoreButton";
import { FavoriteButton } from "@/components/site/FavoriteButton";
import { CouponRedeemList } from "@/components/site/CouponRedeemList";
import { PageHero } from "@/components/site/PageHero";
import { SectionCard } from "@/components/site/SectionCard";
import { EmptyState } from "@/components/site/EmptyState";
import {
  fetchStoreBySlug,
  fetchOffersByStoreId,
  UIOffer,
} from "@/lib/offers-api";
import { absoluteUrl, citySlug, cityLabel } from "@/lib/slug";
import { OpeningHoursDisplay, hasOpeningHours } from "@/components/site/OpeningHoursDisplay";
import { Instagram, MapPin, Phone, Tag } from "lucide-react";

const StorePage = () => {
  const { storeSlug = "" } = useParams();
  const [store, setStore] = useState<any | null | undefined>(undefined);
  const [offers, setOffers] = useState<UIOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const s = await fetchStoreBySlug(storeSlug);
      setStore(s ?? null);
      if (s) {
        const o = await fetchOffersByStoreId(s.id);
        setOffers(o);
      }
      setLoading(false);
    })();
  }, [storeSlug]);

  if (store === null) return <Navigate to="/" replace />;
  if (loading || store === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-20 text-center text-muted-foreground">Carregando…</main>
        <Footer />
      </div>
    );
  }

  const cityObj = { city: store.city || "", state: (store.state || "").toUpperCase() };
  const cSlug = cityObj.city ? citySlug(cityObj) : "";
  const path = `/loja/${storeSlug}`;
  const title = `${store.name} — Ofertas em ${cityObj.city ? cityLabel(cityObj) : "sua cidade"} | OfertasFly`;
  const description = (store.description || `${store.name} no OfertasFly: ofertas, cupons e descontos em ${cityObj.city || "sua cidade"}.`).slice(0, 160);

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: store.name,
    image: store.logo_url || store.cover_url || undefined,
    url: absoluteUrl(path),
    telephone: store.phone || undefined,
    address: store.address
      ? {
          "@type": "PostalAddress",
          streetAddress: store.address,
          addressLocality: store.city || undefined,
          addressRegion: store.state || undefined,
          addressCountry: "BR",
        }
      : undefined,
    areaServed: store.city || undefined,
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: absoluteUrl("/") },
      ...(cSlug
        ? [{ "@type": "ListItem", position: 2, name: cityLabel(cityObj), item: absoluteUrl(`/ofertas/${cSlug}`) }]
        : []),
      { "@type": "ListItem", position: cSlug ? 3 : 2, name: store.name, item: absoluteUrl(path) },
    ],
  };

  const crumbs = [
    { label: "Início", to: "/" },
    ...(cSlug ? [{ label: cityLabel(cityObj), to: `/ofertas/${cSlug}` }] : []),
    { label: store.name },
  ];

  const heroAside = (
    <div className="flex flex-col items-start gap-4 rounded-2xl bg-white/5 p-5 backdrop-blur md:min-w-[280px]">
      <StoreAvatar name={store.name} logoUrl={store.logo_url} size={72} />
      <div className="flex flex-wrap gap-2">
        {store.featured_badge && <StoreFeaturedBadge />}
        {cityObj.city && (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs">
            <MapPin className="h-3 w-3" /> {cityLabel(cityObj)}
          </span>
        )}
      </div>
      <FollowStoreButton storeId={store.id} className="w-full" />
      <FavoriteButton type="store" id={store.id} className="w-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={title}
        description={description}
        path={path}
        image={store.cover_url || store.logo_url}
        jsonLd={[localBusiness, breadcrumb]}
      />
      <Header />
      <main className="container space-y-10 py-8 md:py-10">
        <PageHero
          eyebrow="Loja parceira"
          title={store.name}
          subtitle={store.description || `Descubra as ofertas de ${store.name} no OfertasFly.`}
          crumbs={crumbs}
          aside={heroAside}
        />

        {(store.address || store.phone || store.instagram) && (
          <SectionCard eyebrow="Contato" title="Como chegar e falar com a loja">
            <ul className="grid gap-3 text-sm text-foreground md:grid-cols-3">
              {store.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{store.address}</span>
                </li>
              )}
              {store.phone && (
                <li className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{store.phone}</span>
                </li>
              )}
              {store.instagram && (
                <li className="flex items-start gap-2">
                  <Instagram className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{store.instagram}</span>
                </li>
              )}
            </ul>
          </SectionCard>
        )}

        {hasOpeningHours(store.opening_hours) && (
          <SectionCard eyebrow="Atendimento" title="Horário de funcionamento">
            <OpeningHoursDisplay value={store.opening_hours} />
          </SectionCard>
        )}



        <CouponRedeemList storeId={store.id} />

        <SectionCard
          eyebrow="Ofertas ativas"
          title={`${offers.length} ${offers.length === 1 ? "oferta" : "ofertas"} de ${store.name}`}
          description={cityObj.city ? `Em ${cityLabel(cityObj)}` : undefined}
        >
          {offers.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="Sem ofertas ativas"
              description="Esta loja ainda não publicou ofertas. Siga para receber avisos assim que sair a próxima."
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((o) => (
                <OfferCard key={o.id} offer={o} />
              ))}
            </div>
          )}
        </SectionCard>
      </main>
      <Footer />
    </div>
  );
};

export default StorePage;
