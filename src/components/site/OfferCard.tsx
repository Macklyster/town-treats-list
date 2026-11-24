import { Link } from "@/lib/router-compat";
import { Tag } from "lucide-react";
import { UIOffer, discountPct, formatBRL } from "@/lib/offers-api";
import { formatDistance } from "@/lib/geo";
import { StoreAvatar } from "@/components/site/StoreAvatar";
import { StoreFeaturedBadge } from "@/components/site/StoreFeaturedBadge";
import { CountdownBadge } from "@/components/site/CountdownBadge";
import { FavoriteButton } from "@/components/site/FavoriteButton";
import { MapPin } from "lucide-react";
import { SocialProofBadge } from "@/components/site/SocialProofBadge";
import type { SocialProof } from "@/lib/social-proof";

export const OfferCard = ({ offer, socialProof }: { offer: UIOffer; socialProof?: SocialProof }) => {
  const pct = discountPct(offer);
  return (
    <Link
      to={`/oferta/${offer.id}`}
      className={`group flex flex-col overflow-hidden rounded-2xl bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-pop ${
        offer.isFlash ? "ring-2 ring-destructive/60" : offer.featured ? "ring-2 ring-primary/60" : ""
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={offer.image}
          alt={`Oferta: ${offer.title} — ${offer.storeName}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {pct > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-discount px-3 py-1 text-xs font-bold text-discount-foreground shadow-soft">
            -{pct}%
          </span>
        )}
        {offer.type !== "desconto" && !offer.isFlash && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-xs font-medium text-foreground-foreground">
            <Tag className="h-3 w-3" />
            {offer.type === "cupom" ? "Cupom" : "Brinde"}
          </span>
        )}
        <div className="absolute right-3 bottom-3 z-10">
          <FavoriteButton type="offer" id={offer.id} variant="icon" />
        </div>
        {offer.isFlash && offer.flashEndsAt && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
            <CountdownBadge endsAt={offer.flashEndsAt} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <StoreAvatar name={offer.storeName} logoUrl={offer.storeLogo} size={24} />
          <p className="line-clamp-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {offer.storeName}
          </p>
          {offer.storeFeaturedBadge && <StoreFeaturedBadge showLabel={false} />}
        </div>
        <h3 className="line-clamp-2 text-base font-medium text-foreground">{offer.title}</h3>
        <SocialProofBadge sp={socialProof} variant="compact" />
        {typeof offer.distanceKm === "number" && (
          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>a {formatDistance(offer.distanceKm)} de você</span>
          </div>
        )}
        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            {pct > 0 && (
              <div className="text-xs text-muted-foreground line-through">
                {formatBRL(offer.originalPrice)}
              </div>
            )}
            <div className="text-xl font-bold text-accent-strong">{formatBRL(offer.promoPrice)}</div>
          </div>
          <span className="text-sm font-medium text-foreground group-hover:text-accent-strong">
            Ver oferta →
          </span>
        </div>
      </div>
    </Link>
  );
};
