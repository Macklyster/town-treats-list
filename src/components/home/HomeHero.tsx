import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BadgeCheck, Building2, MapPin, Star, Tag, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useCity } from "@/hooks/useCity";
import { fetchFeaturedCompanies, fetchHomeStats, HomeStats, UICompany } from "@/lib/home-api";

export const HomeHero = () => {
  const { city } = useCity();
  const [stats, setStats] = useState<HomeStats>({ activeCompanies: 0, publishedOffers: 0, connectedUsers: 0, cities: 0 });
  const [featured, setFeatured] = useState<UICompany | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    fetchHomeStats().then(setStats);
  }, []);

  useEffect(() => {
    fetchFeaturedCompanies(city ?? undefined).then((list) => setFeatured(list[0] ?? null));
  }, [city?.city, city?.state]);


  const cityLabel = city ? `${city.city} - ${city.state}` : "Selecione sua cidade";
  const metrics = [
    { icon: Building2, value: `+${stats.activeCompanies.toLocaleString("pt-BR")}`, label: "Empresas ativas" },
    { icon: Tag, value: `+${stats.publishedOffers.toLocaleString("pt-BR")}`, label: "Ofertas publicadas" },
    { icon: Users, value: `+${Math.max(stats.connectedUsers, 1).toLocaleString("pt-BR")}`, label: "Usuários conectados" },
    { icon: MapPin, value: `${stats.cities || 1} cidade${stats.cities === 1 ? "" : "s"}`, label: cityLabel },
  ];

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
            <h1 className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight text-white">
              Descubra o<br />melhor da<br />
              <span className="text-primary-mid">sua cidade.</span>
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

          {/* Center — showcase image + peek card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative rounded-2xl overflow-hidden aspect-[16/10] md:aspect-[5/3] bg-[hsl(var(--hero-surface))]"
          >
            {/* Soft placeholder shown until the featured cover loads */}
            <div
              className={`absolute inset-0 bg-gradient-to-br from-[hsl(var(--hero-surface))] via-[hsl(var(--primary-deep)/0.35)] to-[hsl(var(--hero-bg))] transition-opacity duration-700 ${imageLoaded ? "opacity-0" : "opacity-100"}`}
              aria-hidden
            />
            {featured?.cover_url && (
              <img
                src={featured.cover_url}
                alt={featured.name}
                onLoad={() => setImageLoaded(true)}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {featured && (
              <Link
                to={featured.slug ? `/loja/${featured.slug}` : "#"}
                className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-3 flex items-center gap-3 hover:bg-white/15 transition"
              >
                {featured.logo_url ? (
                  <img src={featured.logo_url} alt={featured.name} className="h-11 w-11 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-primary to-primary-deep grid place-items-center text-white font-bold">
                    {featured.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-white">
                    <span className="text-sm font-semibold truncate">{featured.name}</span>
                    {featured.featured_badge && <BadgeCheck className="h-4 w-4 text-primary-mid" />}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/80">
                    {featured.flyscore != null ? (
                      <>
                        <div className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        </div>
                        <span className="font-medium">FlyScore {Math.round(featured.flyscore)}</span>
                      </>
                    ) : (
                      <span>{featured.city}{featured.state ? ` · ${featured.state}` : ""}</span>
                    )}
                  </div>
                </div>
              </Link>
            )}
          </motion.div>

          {/* Right — metrics card */}
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
        </div>
      </motion.div>
    </section>
  );
};
