import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
import { Clock, MapPin, Phone, Instagram, MessageCircle, ArrowLeft } from "lucide-react";
import { parseConditions, getMethod } from "@/lib/payment-methods";
import { StoreAvatar } from "@/components/site/StoreAvatar";
import { trackOfferEvent } from "@/lib/offer-events";
import { FollowStoreButton } from "@/components/site/FollowStoreButton";
import { StoreFeaturedBadge } from "@/components/site/StoreFeaturedBadge";
import NotFound from "./NotFound";

const OfferDetail = () => {
  const { id } = useParams();
  const [offer, setOffer] = useState<UIOffer | null>(null);
  const [store, setStore] = useState<any>(null);
  const [related, setRelated] = useState<UIOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
      const [s, all] = await Promise.all([fetchStoreById(o.storeId), fetchOffers()]);
      setStore(s);
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-10">
        <Link
          to="/#ofertas"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-accent-strong"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para ofertas
        </Link>

        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="relative overflow-hidden rounded-3xl bg-muted shadow-card">
              <img src={offer.image} alt={offer.title} className="aspect-[4/3] w-full object-cover" />
              {pct > 0 && (
                <span className="absolute left-5 top-5 rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-accent-foreground shadow-pop">
                  -{pct}% OFF
                </span>
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
              <div className="flex items-center gap-3">
                <StoreAvatar name={offer.storeName} logoUrl={offer.storeLogo} size={40} />
                <span className="text-xs font-semibold uppercase tracking-wider text-accent-strong">
                  {offer.storeName}
                </span>
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
              </div>
            </div>

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
                {store.address && (
                  <div className="mt-5 overflow-hidden rounded-xl border border-border">
                    <iframe
                      title={`Mapa de ${store.name}`}
                      src={`https://www.google.com/maps?q=${encodeURIComponent(store.address)}&output=embed`}
                      className="h-48 w-full"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="text-2xl font-semibold text-foreground md:text-[28px]">Você também pode gostar</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((o) => (
                <OfferCard key={o.id} offer={o} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default OfferDetail;
