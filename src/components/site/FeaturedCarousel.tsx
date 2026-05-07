import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { UIOffer, discountPct, formatBRL } from "@/lib/offers-api";
import { Button } from "@/components/ui/button";

export const FeaturedCarousel = ({ offers }: { offers: UIOffer[] }) => {
  if (!offers.length) return null;
  return (
    <section className="container -mt-12 relative z-10">
      <Carousel opts={{ loop: true }} className="w-full">
        <CarouselContent>
          {offers.map((o) => {
            const pct = discountPct(o);
            return (
              <CarouselItem key={o.id}>
                <div className="grid overflow-hidden rounded-3xl bg-card shadow-pop md:grid-cols-2">
                  <div className="relative aspect-[16/10] md:aspect-auto">
                    <img src={o.image} alt={o.title} className="h-full w-full object-cover" />
                    {pct > 0 && (
                      <span className="absolute left-4 top-4 rounded-full bg-discount px-3 py-1 text-sm font-bold text-discount-foreground">
                        -{pct}% OFF
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col justify-center gap-4 p-8 md:p-12">
                    <span className="text-xs font-semibold uppercase tracking-wider text-accent-strong">
                      Oferta da semana · {o.storeName}
                    </span>
                    <h3 className="text-2xl font-bold text-primary md:text-3xl">{o.title}</h3>
                    <p className="text-muted-foreground">{o.description}</p>
                    <div className="flex items-baseline gap-3">
                      {pct > 0 && (
                        <span className="text-base text-muted-foreground line-through">
                          {formatBRL(o.originalPrice)}
                        </span>
                      )}
                      <span className="text-3xl font-bold text-accent-strong">
                        {formatBRL(o.promoPrice)}
                      </span>
                    </div>
                    <div>
                      <Button asChild variant="accent" size="lg">
                        <Link to={`/oferta/${o.id}`}>Ver oferta</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="left-4" />
        <CarouselNext className="right-4" />
      </Carousel>
    </section>
  );
};
