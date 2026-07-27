import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { OfferCard } from "@/components/site/OfferCard";
import {
  fetchOfferById,
  fetchOffers,
  fetchStoreById,
  discountPct,
  formatBRL,
  UIOffer,
} from "@/lib/offers-api";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Phone, Instagram, MessageCircle, ChevronRight } from "lucide-react";
import { SectionCard } from "@/components/site/SectionCard";
import { parseConditions, getMethod } from "@/lib/payment-methods";
import { StoreAvatar } from "@/components/site/StoreAvatar";
import { trackOfferEvent } from "@/lib/offer-events";
import { FollowStoreButton } from "@/components/site/FollowStoreButton";
import { CouponRedeemList } from "@/components/site/CouponRedeemList";
import { StoreFeaturedBadge } from "@/components/site/StoreFeaturedBadge";
import { CountdownBadge } from "@/components/site/CountdownBadge";
import NotFound from "./NotFound";
import { SEO } from "@/components/seo/SEO";
import { absoluteUrl, citySlug, cityLabel } from "@/lib/slug";
import { ShareOfferButton } from "@/components/site/ShareOfferButton";
import { RatingSummary, fetchOfferRatingSummary, RatingSummaryData } from "@/components/site/RatingSummary";
import { ReviewList } from "@/components/site/ReviewList";
import { SocialProofBadge } from "@/components/site/SocialProofBadge";
import { fetchOfferSocialProof, subscribeOfferEvents, SocialProof } from "@/lib/social-proof";
import { listOfferMedia } from "@/lib/media-api";
import { OfferMediaCarousel, type CarouselMedia } from "@/components/site/OfferMediaCarousel";

const OfferDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [offer, setOffer] = useState<UIOffer | null>(null);
  const [store, setStore] = useState<any>(null);
  const [related, setRelated] = useState<UIOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [rating, setRating] = useState<RatingSummaryData | null>(null);
  const [sp, setSp] = useState<SocialProof | undefined>(undefined);
  const [media, setMedia] = useState<CarouselMedia[]>([]);

  useEffect(() => {
    if (!offer?.id) return;
    let cancelled = false;
    const refresh = () => {
      fetchOfferSocialProof([offer.id]).then((m) => {
        if (!cancelled) setSp(m.get(offer.id));
      });
    };
    refresh();
    const unsub = subscribeOfferEvents(offer.id, refresh);
    const t = setInterval(refresh, 30000);
    return () => {
      cancelled = true;
      clearInterval(t);
      unsub();
    };
  }, [offer?.id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const o = await fetchOfferById(id);
      if (!o) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setOffer(o);
      trackOfferEvent(o.id, "view");
      if (searchParams.get("src") === "qr") {
        trackOfferEvent(o.id, "qr_scan");
      }
      const [s, all, r, mm] = await Promise.all([
        fetchStoreById(o.storeId),
        fetchOffers(),
        fetchOfferRatingSummary(o.id),
        listOfferMedia(o.id).catch(() => []),
      ]);
      setStore(s);
      setRating(r);
      const mapped: CarouselMedia[] = mm.map((r) => ({
        id: r.asset.id,
        url: r.asset.url,
        media_type: r.asset.media_type,
        poster_url: r.asset.poster_url,
        alt_text: r.asset.alt_text,
      }));
      // Ensure cover-first ordering
      mapped.sort((a, b) => {
        const ai = mm.find((x) => x.media_id === a.id);
        const bi = mm.find((x) => x.media_id === b.id);
        if (ai?.is_cover) return -1;
        if (bi?.is_cover) return 1;
        return (ai?.position ?? 0) - (bi?.position ?? 0);
      });
      setMedia(mapped);
      setRelated(
        all
          .filter((x) => x.id !== o.id && (x.storeId === o.storeId || x.category === o.category))
          .slice(0, 4)
      );
      setLoading(false);
    })();
  }, [id]);

  if (notFound) return <NotFound />;
  if (loading || !offer) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-20 text-center text-muted-foreground">Carregando…</main>
        <Footer />
      </div>
    );
  }

  const pct = discountPct(offer);
  const waLink = `https://wa.me/${store?.whatsapp ?? ""}?text=${encodeURIComponent(
    `Olá! Vi a oferta "${offer.title}" no OfertasFly e quero garantir.`
  )}`;

  const cityObj = store?.city ? { city: store.city, state: (store.state || "").toUpperCase() } : null;
  const cSlug = cityObj ? citySlug(cityObj) : "";
  const cLabel = cityObj ? cityLabel(cityObj) : "";
  const seoTitle = `${offer.title} — ${offer.storeName}${cLabel ? ` em ${cLabel}` : ""} | OfertasFly`;
  const seoDesc = (offer.description || `${offer.title} na ${offer.storeName}${cLabel ? ` em ${cLabel}` : ""}. Aproveite a oferta no OfertasFly.`).slice(0, 160);
  const priceValidUntil = (() => {
    if (!offer.validUntil) return undefined;
    const d = new Date(offer.validUntil);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
  })();
  const productLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: offer.title,
    description: offer.description || `${offer.title} na ${offer.storeName}${cLabel ? ` em ${cLabel}` : ""}.`,
    image: offer.image ? [offer.image] : undefined,
    sku: offer.id,
    brand: { "@type": "Brand", name: offer.storeName },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/oferta/${offer.id}`),
      price: offer.promoPrice > 0 ? offer.promoPrice.toFixed(2) : undefined,
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      priceValidUntil,
      seller: {
        "@type": "LocalBusiness",
        name: offer.storeName,
        address: store?.address
          ? { "@type": "PostalAddress", streetAddress: store.address, addressLocality: store?.city, addressRegion: store?.state, addressCountry: "BR" }
          : undefined,
        telephone: store?.phone || undefined,
      },
    },
  };
  if (rating && rating.count > 0) {
    productLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating.avg,
      reviewCount: rating.count,
      bestRating: 5,
      worstRating: 1,
    };
  }
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: absoluteUrl("/") },
      ...(cSlug ? [{ "@type": "ListItem", position: 2, name: cLabel, item: absoluteUrl(`/ofertas/${cSlug}`) }] : []),
      { "@type": "ListItem", position: cSlug ? 3 : 2, name: offer.title, item: absoluteUrl(`/oferta/${offer.id}`) },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoTitle}
        description={seoDesc}
        path={`/oferta/${offer.id}`}
        image={offer.image}
        jsonLd={[productLd, breadcrumbLd]}
      />
      <Header />
      <main className="container py-10">
        <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">Início</Link>
          {cSlug && (
            <>
              <ChevronRight className="h-3 w-3 opacity-60" />
              <Link to={`/ofertas/${cSlug}`} className="hover:text-primary">{cLabel}</Link>
            </>
          )}
          <ChevronRight className="h-3 w-3 opacity-60" />
          <Link to={`/loja/${store?.slug ?? ""}`} className="hover:text-primary">{offer.storeName}</Link>
          <ChevronRight className="h-3 w-3 opacity-60" />
          <span className="text-foreground">{offer.title}</span>
        </nav>


        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <div className={`relative overflow-hidden rounded-3xl bg-muted shadow-card ${offer.isFlash ? "ring-2 ring-destructive/70" : ""}`}>
              <img src={offer.image} alt={offer.title} className="aspect-[4/3] w-full object-cover" />
              {pct > 0 && (
                <span className="absolute left-5 top-5 rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-accent-foreground shadow-pop">
                  -{pct}% OFF
                </span>
              )}
              {offer.isFlash && offer.flashEndsAt && (
                <div className="absolute bottom-5 left-5">
                  <CountdownBadge endsAt={offer.flashEndsAt} variant="detail" />
                </div>
              )}
            </div>

            <div className="mt-10 space-y-6">
              {offer.description && (
                <div>
                  <h2 className="text-xl font-medium text-foreground">Sobre a oferta</h2>
                  <p className="mt-3 text-muted-foreground">{offer.description}</p>
                </div>
              )}
              {(() => {
                const { methods, text } = parseConditions(offer.conditions);
                return (
                  <>
                    {methods.length > 0 && (
                      <div>
                        <h2 className="text-xl font-medium text-foreground">Formas de pagamento</h2>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {methods.map((id) => {
                            const m = getMethod(id);
                            if (!m) return null;
                            const Icon = m.icon;
                            return (
                              <span
                                key={id}
                                className="inline-flex items-center gap-1.5 rounded-full border bg-secondary px-3 py-1 text-sm text-foreground"
                              >
                                <Icon className="h-4 w-4" />
                                {m.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {text && (
                      <div>
                        <h2 className="text-xl font-medium text-foreground">Condições</h2>
                        <p className="mt-3 whitespace-pre-line text-muted-foreground">{text}</p>
                      </div>
                    )}
                  </>
                );
              })()}
              {offer.validUntil && (
                <div className="rounded-xl bg-secondary p-4 text-sm text-foreground">
                  <strong>Validade:</strong> {offer.validUntil}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl bg-card p-6 shadow-card">
              <div className="flex flex-wrap items-center gap-3">
                <StoreAvatar name={offer.storeName} logoUrl={offer.storeLogo} size={40} />
                <span className="text-xs font-semibold uppercase tracking-wider text-accent-strong">
                  {offer.storeName}
                </span>
                {offer.storeFeaturedBadge && <StoreFeaturedBadge />}
              </div>
              <h1 className="mt-3 text-2xl font-semibold leading-tight text-foreground md:text-[28px]">
                {offer.title}
              </h1>
              <div className="mt-5 flex items-baseline gap-3">
                {pct > 0 && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatBRL(offer.originalPrice)}
                  </span>
                )}
                <span className="text-4xl font-bold text-accent-strong">
                  {formatBRL(offer.promoPrice)}
                </span>
              </div>

              <SocialProofBadge sp={sp} variant="detailed" className="mt-4" />

              <div className="mt-6 space-y-3">
                {store?.whatsapp && (
                  <Button asChild variant="accent" size="lg" className="w-full">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => trackOfferEvent(offer.id, "whatsapp_click")}
                    >
                      <MessageCircle className="h-5 w-5" /> Pegar Oferta no WhatsApp
                    </a>
                  </Button>
                )}
                {store?.phone && (
                  <Button asChild variant="outline" size="lg" className="w-full">
                    <a
                      href={`tel:${store.phone}`}
                      onClick={() => trackOfferEvent(offer.id, "phone_click")}
                    >
                      <Phone className="h-5 w-5" /> Ligar para a Loja
                    </a>
                  </Button>
                )}
                <ShareOfferButton offer={offer} className="w-full" />
              </div>
            </div>

            {store && (
              <div className="mb-6">
                <CouponRedeemList storeId={offer.storeId} offerId={offer.id} />
              </div>
            )}

            {store && (
              <div className="rounded-2xl bg-card p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <StoreAvatar name={store.name ?? offer.storeName} logoUrl={store.logo_url} size={56} />
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-medium text-foreground">{store.name ?? "Sobre a loja"}</h3>
                    {store.featured_badge && <StoreFeaturedBadge />}
                  </div>
                </div>
                <div className="mt-4">
                  <FollowStoreButton storeId={offer.storeId} className="w-full" size="default" />
                </div>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {store.address && (
                    <li className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 text-accent-strong" />
                      <span>{store.address}</span>
                    </li>
                  )}
                  {store.phone && (
                    <li className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-4 w-4 text-accent-strong" />
                      <span>{store.phone}</span>
                    </li>
                  )}
                  {store.instagram && (
                    <li className="flex items-start gap-3">
                      <Instagram className="mt-0.5 h-4 w-4 text-accent-strong" />
                      <span>{store.instagram}</span>
                    </li>
                  )}
                </ul>
                {(store.address || (store.latitude && store.longitude)) && (
                  <div className="mt-5 overflow-hidden rounded-xl border border-border">
                    <iframe
                      title={`Mapa de ${store.name}`}
                      src={
                        store.latitude && store.longitude
                          ? `https://www.google.com/maps?q=${store.latitude},${store.longitude}&z=17&output=embed`
                          : `https://www.google.com/maps?q=${encodeURIComponent(
                              [store.address, store.city, store.state, "Brasil"].filter(Boolean).join(", "),
                            )}&output=embed`
                      }
                      className="h-48 w-full"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>

        <SectionCard
          className="mt-16"
          eyebrow="Prova social"
          title="Avaliações de clientes"
        >
          <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
            <div>
              {rating && rating.count > 0 ? (
                <RatingSummary offerId={offer.id} />
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                  Ainda sem avaliações para esta oferta.
                </div>
              )}
            </div>
            <div>
              <ReviewList offerId={offer.id} />
            </div>
          </div>
        </SectionCard>

        {related.length > 0 && (
          <SectionCard
            className="mt-10"
            eyebrow="Descubra mais"
            title="Você também pode gostar"
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((o) => (
                <OfferCard key={o.id} offer={o} />
              ))}
            </div>
          </SectionCard>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default OfferDetail;
