import { Link } from "react-router-dom";
import { Tag } from "lucide-react";
import { Offer, discountPct, formatBRL } from "@/data/offers";
import { stores } from "@/data/stores";

export const OfferCard = ({ offer }: { offer: Offer }) => {
  const store = stores[offer.storeId];
  const pct = discountPct(offer);
  return (
    <Link
      to={`/oferta/${offer.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-pop"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={offer.image}
          alt={offer.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {pct > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground shadow-soft">
            -{pct}%
          </span>
        )}
        {offer.type !== "desconto" && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-xs font-medium text-primary-foreground">
            <Tag className="h-3 w-3" />
            {offer.type === "cupom" ? "Cupom" : "Brinde"}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {store?.name}
        </p>
        <h3 className="line-clamp-2 text-base font-semibold text-primary">
          {offer.title}
        </h3>
        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            {pct > 0 && (
              <div className="text-xs text-muted-foreground line-through">
                {formatBRL(offer.originalPrice)}
              </div>
            )}
            <div className="text-xl font-bold text-accent-strong">
              {formatBRL(offer.promoPrice)}
            </div>
          </div>
          <span className="text-sm font-semibold text-primary group-hover:text-accent-strong">
            Ver oferta →
          </span>
        </div>
      </div>
    </Link>
  );
};
