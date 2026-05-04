import { Link, useParams } from "react-router-dom";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { OfferCard } from "@/components/site/OfferCard";
import {
  getOfferById,
  getOffersByCategory,
  getOffersByStore,
  discountPct,
  formatBRL,
} from "@/data/offers";
import { stores } from "@/data/stores";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Phone, Instagram, MessageCircle, ArrowLeft } from "lucide-react";
import NotFound from "./NotFound";

const OfferDetail = () => {
  const { id } = useParams();
  const offer = id ? getOfferById(id) : undefined;
  if (!offer) return <NotFound />;
  const store = stores[offer.storeId];
  const pct = discountPct(offer);
  const related = [
    ...getOffersByStore(offer.storeId, offer.id),
    ...getOffersByCategory(offer.category, offer.id),
  ]
    .filter((o, i, arr) => arr.findIndex((x) => x.id === o.id) === i)
    .slice(0, 4);

  const waLink = `https://wa.me/${store?.whatsapp}?text=${encodeURIComponent(
    `Olá! Vi a oferta "${offer.title}" no Helpfy e quero garantir.`
  )}`;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-10">
        <Link
          to="/ofertas"
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
              <div>
                <h2 className="text-xl font-semibold text-primary">Sobre a oferta</h2>
                <p className="mt-3 text-muted-foreground">{offer.description}</p>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-primary">Condições</h2>
                <p className="mt-3 text-muted-foreground">{offer.conditions}</p>
              </div>
              <div className="rounded-xl bg-secondary p-4 text-sm text-primary">
                <strong>Validade:</strong> {offer.validUntil}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl bg-card p-6 shadow-card">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent-strong">
                {store?.name}
              </span>
              <h1 className="mt-2 text-2xl font-bold leading-tight text-primary md:text-3xl">
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
                <Button asChild variant="accent" size="lg" className="w-full">
                  <a href={waLink} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-5 w-5" /> Pegar Oferta no WhatsApp
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full">
                  <a href={`tel:${store?.phone}`}>
                    <Phone className="h-5 w-5" /> Ligar para a Loja
                  </a>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl bg-card p-6 shadow-card">
              <h3 className="text-lg font-semibold text-primary">Sobre a loja</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-accent-strong" />
                  <span>{store?.address}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 text-accent-strong" />
                  <span>{store?.hours}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 text-accent-strong" />
                  <span>{store?.phone}</span>
                </li>
                {store?.instagram && (
                  <li className="flex items-start gap-3">
                    <Instagram className="mt-0.5 h-4 w-4 text-accent-strong" />
                    <span>{store.instagram}</span>
                  </li>
                )}
              </ul>
              <div className="mt-5 overflow-hidden rounded-xl border border-border">
                <iframe
                  title={`Mapa de ${store?.name}`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(
                    store?.address ?? ""
                  )}&output=embed`}
                  className="h-48 w-full"
                  loading="lazy"
                />
              </div>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="text-2xl font-bold text-primary md:text-3xl">Você também pode gostar</h2>
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
