import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { OfferCard } from "@/components/site/OfferCard";
import { SEO } from "@/components/seo/SEO";
import { StoreAvatar } from "@/components/site/StoreAvatar";
import { StoreFeaturedBadge } from "@/components/site/StoreFeaturedBadge";
import { FollowStoreButton } from "@/components/site/FollowStoreButton";
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
      <main className="container py-10">
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-accent-strong">Início</Link>
          {cSlug && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link to={`/ofertas/${cSlug}`} className="hover:text-accent-strong">{cityLabel(cityObj)}</Link>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{store.name}</span>
        </nav>

        <header className="mb-10 flex flex-wrap items-start gap-5 rounded-2xl bg-card p-6 shadow-card">
          <StoreAvatar name={store.name} logoUrl={store.logo_url} size={80} />
          <div className="flex-1 min-w-[240px]">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground md:text-3xl">{store.name}</h1>
              {store.featured_badge && <StoreFeaturedBadge />}
            </div>
            {store.description && (
              <p className="mt-2 text-muted-foreground">{store.description}</p>
            )}
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {store.address && <li className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{store.address}</li>}
              {store.phone && <li className="flex items-center gap-1.5"><Phone className="h-4 w-4" />{store.phone}</li>}
              {store.instagram && <li className="flex items-center gap-1.5"><Instagram className="h-4 w-4" />{store.instagram}</li>}
            </ul>
          </div>
          <FollowStoreButton storeId={store.id} />
        </header>

        <div className="mb-8">
          <CouponRedeemList storeId={store.id} />
        </div>

        <h2 className="mb-5 text-xl font-semibold text-foreground">
          Ofertas de {store.name} {cityObj.city && `em ${cityLabel(cityObj)}`}
        </h2>
        {offers.length === 0 ? (
          <p className="text-muted-foreground">Esta loja ainda não tem ofertas ativas.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((o) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default StorePage;
