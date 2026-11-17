import { Link } from "@/lib/router-compat";
import { motion } from "framer-motion";
import { BadgeCheck, Building2, MapPin, Star, Tag, Users, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useCity } from "@/hooks/useCity";
import { fetchFeaturedCompanies, fetchHomeStats, HomeStats, UICompany } from "@/lib/home-api";
import { CountdownBadge } from "@/components/site/CountdownBadge";
import { discountPct, formatBRL, type UIOffer } from "@/lib/offers-api";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

const MAX_FEATURED = 5;
const AUTOPLAY_INTERVAL = 5000;

export const HomeHero = ({ offers = [] }: { offers?: UIOffer[] }) => {
  const { city } = useCity();
  const [stats, setStats] = useState<HomeStats>({ activeCompanies: 0, publishedOffers: 0, connectedUsers: 0, cities: 0 });
  const [featured, setFeatured] = useState<UICompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [expiredFlashIds, setExpiredFlashIds] = useState<Set<string>>(new Set());
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchHomeStats().then(setStats);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchFeaturedCompanies(city ?? undefined).then((list) => {
      const badgeFirst = list
        .filter((c) => c.featured_badge && c.cover_url)
        .slice(0, MAX_FEATURED);
      setFeatured(badgeFirst.length >= 2 ? badgeFirst : list.slice(0, MAX_FEATURED));
      setLoading(false);
    });
  }, [city?.city, city?.state]);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  const startAutoplay = useCallback(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      api?.scrollNext();
    }, AUTOPLAY_INTERVAL);
  }, [api]);

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!api || count < 2) return;
    if (!isPaused) startAutoplay();
    return () => stopAutoplay();
  }, [api, count, isPaused, startAutoplay, stopAutoplay]);

  const handleImageLoad = (id: string) => {
    setLoadedImages((prev) => new Set(prev).add(id));
  };

  const cityLabel = city ? `${city.city} - ${city.state}` : "Selecione sua cidade";
  const activeFlashOffers = useMemo(
    () =>
      offers
        .filter(
          (offer) =>
            offer.isFlash &&
            offer.flashEndsAt &&
            new Date(offer.flashEndsAt).getTime() > Date.now() &&
            !expiredFlashIds.has(offer.id),
        )
        .sort(
          (a, b) =>
            new Date(a.flashEndsAt ?? 0).getTime() - new Date(b.flashEndsAt ?? 0).getTime(),
        ),
    [offers, expiredFlashIds],
  );
  const featuredFlash = activeFlashOffers[0];
  const metrics = [
    { icon: Building2, value: `+${stats.activeCompanies.toLocaleString("pt-BR")}`, label: "Empresas ativas" },
    { icon: Tag, value: `+${stats.publishedOffers.toLocaleString("pt-BR")}`, label: "Ofertas publicadas" },
    { icon: Users, value: `+${Math.max(stats.connectedUsers, 1).toLocaleString("pt-BR")}`, label: "Usuários conectados" },
    { icon: MapPin, value: `${stats.cities || 1} cidade${stats.cities === 1 ? "" : "s"}`, label: cityLabel },
  ];

  const renderSlideContent = (company: UICompany) => {
    const isLoaded = loadedImages.has(company.id);
    return (
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[hsl(var(--hero-surface))]">
        <div
          className={`absolute inset-0 bg-gradient-to-br from-[hsl(var(--hero-surface))] via-[hsl(var(--primary-deep)/0.35)] to-[hsl(var(--hero-bg))] transition-opacity duration-700 ${isLoaded ? "opacity-0" : "opacity-100"}`}
          aria-hidden
        />
        {company.cover_url && (
          <img
            src={company.cover_url}
            alt={company.name}
            onLoad={() => handleImageLoad(company.id)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${isLoaded ? "opacity-100" : "opacity-0"}`}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <Link
          to={company.slug ? `/loja/${company.slug}` : "#"}
          className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-3 flex items-center gap-3 hover:bg-white/15 transition"
        >
          {company.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="h-11 w-11 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-primary to-primary-deep grid place-items-center text-white font-bold">
              {company.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 text-white">
              <span className="text-sm font-semibold truncate">{company.name}</span>
              {company.featured_badge && <BadgeCheck className="h-4 w-4 text-primary-mid shrink-0" />}
            </div>
            <div className="flex items-center gap-1 text-xs text-white/80">
              {company.flyscore != null ? (
                <>
                  <div className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <span className="font-medium">FlyScore {Math.round(company.flyscore)}</span>
                </>
              ) : (
                <span>{company.city}{company.state ? ` · ${company.state}` : ""}</span>
              )}
            </div>
          </div>
        </Link>
      </div>
    );
  };

  return (
    <section className="container pt-4 md:pt-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-[hsl(var(--hero-bg))] text-[hsl(var(--hero-fg))] p-6 md:p-10"
      >
        <div className="absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full bg-primary/25 blur-3xl" aria-hidden />
        <div className="absolute -left-24 bottom-0 h-[300px] w-[300px] rounded-full bg-primary-mid/20 blur-3xl" aria-hidden />

        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1.3fr_0.95fr] lg:items-center">
          {/* Left — copy */}
          <div>
            <h1 className="font-display text-4xl md:text-5xl leading-[1.05] text-[hsl(var(--hero-fg))] break-words">
              Ofertas, eventos e empresas da <span className="text-primary-mid">sua cidade</span>
            </h1>
            <p className="mt-4 max-w-sm text-sm text-[hsl(var(--hero-muted))] leading-relaxed">
              Empresas. Serviços. Ofertas. Eventos.<br />Tudo perto de você.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#ofertas"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-deep transition"
              >
                <MapPin className="h-4 w-4" /> Explorar
              </a>
              <Link
                to="/anuncie"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.08] transition"
              >
                Cadastrar empresa
              </Link>
            </div>
          </div>

          {/* Center — showcase carousel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative rounded-2xl overflow-hidden aspect-[16/10] md:aspect-[5/3] bg-[hsl(var(--hero-surface))]"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {loading || featured.length === 0 ? (
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--hero-surface))] via-[hsl(var(--primary-deep)/0.35)] to-[hsl(var(--hero-bg))]" aria-hidden />
            ) : featured.length === 1 ? (
              renderSlideContent(featured[0]!)
            ) : (
              <Carousel setApi={setApi} opts={{ loop: true }} className="h-full w-full [&>*]:h-full">
                <CarouselContent className="h-full ml-0 [&>*]:h-full">
                  {featured.map((company) => (
                    <CarouselItem key={company.id} className="pl-0 h-full basis-full">
                      {renderSlideContent(company)}
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-3 border-transparent bg-transparent text-white/80 hover:bg-transparent hover:border-transparent hover:text-white disabled:opacity-30" />
                <CarouselNext className="right-3 border-transparent bg-transparent text-white/80 hover:bg-transparent hover:border-transparent hover:text-white disabled:opacity-30" />
              </Carousel>
            )}

            {/* Dots */}
            {!loading && featured.length > 1 && (
              <div className="absolute bottom-20 left-0 right-0 z-10 flex justify-center gap-2">
                {Array.from({ length: count }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => api?.scrollTo(i)}
                    className={`h-2 rounded-full transition-all ${
                      current === i ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
                    }`}
                    aria-label={`Ir para slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* Right — flash promotion or metrics card */}
          {featuredFlash && featuredFlash.flashEndsAt ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="min-w-0"
            >
              <Link
                to={`/oferta/${featuredFlash.id}`}
                className="group block overflow-hidden rounded-2xl border border-destructive/50 bg-card shadow-pop transition hover:-translate-y-0.5"
                aria-label={`Ver promoção Relâmpago: ${featuredFlash.title}`}
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-muted lg:aspect-[4/3]">
                  <img
                    src={featuredFlash.image}
                    alt={featuredFlash.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground shadow-soft">
                    <Zap className="h-3.5 w-3.5 fill-current" /> Relâmpago
                  </span>
                  {discountPct(featuredFlash) > 0 && (
                    <span className="absolute right-3 top-3 rounded-full bg-discount px-3 py-1 text-xs font-bold text-discount-foreground shadow-soft">
                      -{discountPct(featuredFlash)}%
                    </span>
                  )}
                  <CountdownBadge
                    endsAt={featuredFlash.flashEndsAt}
                    className="absolute bottom-3 left-3"
                    onExpire={() =>
                      setExpiredFlashIds((currentIds) => new Set(currentIds).add(featuredFlash.id))
                    }
                  />
                </div>
                <div className="space-y-2 p-4">
                  <p className="truncate text-xs font-semibold uppercase text-muted-foreground">
                    {featuredFlash.storeName}
                  </p>
                  <h2 className="line-clamp-2 text-base font-semibold text-card-foreground">
                    {featuredFlash.title}
                  </h2>
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div className="flex min-w-0 items-baseline gap-2">
                      <span className="text-xl font-bold text-foreground">
                        {featuredFlash.promoPrice > 0 ? formatBRL(featuredFlash.promoPrice) : "Grátis"}
                      </span>
                      {featuredFlash.originalPrice > featuredFlash.promoPrice && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatBRL(featuredFlash.originalPrice)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-primary">Ver oferta →</span>
                  </div>
                  {activeFlashOffers.length > 1 && (
                    <p className="border-t border-border pt-2 text-xs text-muted-foreground">
                      +{activeFlashOffers.length - 1} {activeFlashOffers.length === 2 ? "oferta Relâmpago ativa" : "ofertas Relâmpago ativas"}
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/10 p-5"
            >
              <ul className="space-y-4">
                {metrics.map((m) => {
                  const I = m.icon;
                  return (
                    <li key={m.label} className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/20 text-primary-mid grid place-items-center">
                        <I className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-white leading-none">{m.value}</div>
                        <div className="text-xs text-[hsl(var(--hero-muted))] mt-1">{m.label}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </div>
      </motion.div>
    </section>
  );
};
