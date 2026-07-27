import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export type CarouselMedia = {
  id: string;
  url: string;
  media_type: "image" | "video";
  poster_url?: string | null;
  alt_text?: string | null;
};

type Props = {
  items: CarouselMedia[];
  title: string;
  className?: string;
};

export function OfferMediaCarousel({ items, title, className }: Props) {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (!items.length) return null;

  if (items.length === 1) {
    const it = items[0];
    return (
      <div className={className}>
        {it.media_type === "video" ? (
          <video
            src={it.url}
            poster={it.poster_url ?? undefined}
            controls
            playsInline
            preload="metadata"
            className="aspect-[4/3] w-full bg-black object-contain"
          />
        ) : (
          <img src={it.url} alt={it.alt_text ?? title} className="aspect-[4/3] w-full object-cover" />
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <Carousel setApi={setApi} opts={{ loop: true }} className="relative">
        <CarouselContent>
          {items.map((it, idx) => (
            <CarouselItem key={it.id}>
              {it.media_type === "video" ? (
                <video
                  src={it.url}
                  poster={it.poster_url ?? undefined}
                  controls
                  playsInline
                  preload="metadata"
                  className="aspect-[4/3] w-full bg-black object-contain"
                />
              ) : (
                <img
                  src={it.url}
                  alt={it.alt_text ?? title}
                  className="aspect-[4/3] w-full object-cover"
                  loading={idx === 0 ? "eager" : "lazy"}
                />
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-3 h-8 w-8 border-transparent bg-black/30 text-white hover:bg-black/50 hover:text-white" />
        <CarouselNext className="right-3 h-8 w-8 border-transparent bg-black/30 text-white hover:bg-black/50 hover:text-white" />
        <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {items.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === current ? "w-5 bg-white" : "w-1.5 bg-white/60"
              }`}
            />
          ))}
        </div>
      </Carousel>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {items.map((it, i) => (
          <Button
            key={it.id}
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => api?.scrollTo(i)}
            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition ${
              i === current ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
            }`}
            aria-label={`Ir para mídia ${i + 1}`}
          >
            <img
              src={it.media_type === "video" ? it.poster_url ?? it.url : it.url}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
            {it.media_type === "video" && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                <Play className="h-4 w-4 fill-white text-white" />
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
