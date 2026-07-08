import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, MapPin, Sparkles, Star, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCity } from "@/hooks/useCity";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { greeting } from "@/lib/home-api";

export const HomeHero = () => {
  const { user } = useAuth();
  const { city, openSelector } = useCity();
  const [fullName, setFullName] = useState<string | null>(null);
  const [stats, setStats] = useState({ stores: 0, offers: 0, cities: 0 });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setFullName((data as any)?.full_name ?? null));
  }, [user?.id]);

  useEffect(() => {
    (async () => {
      const [{ count: sc }, { count: oc }, { data: cts }] = await Promise.all([
        supabase.from("stores").select("*", { count: "exact", head: true }).eq("approved", true),
        supabase.from("offers").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("stores").select("city").eq("approved", true),
      ]);
      const cities = new Set((cts ?? []).map((r: any) => r.city).filter(Boolean));
      setStats({ stores: sc ?? 0, offers: oc ?? 0, cities: cities.size });
    })();
  }, []);

  return (
    <section className="relative overflow-hidden pt-8 md:pt-14 pb-20 md:pb-28">
      {/* aurora blobs */}
      <div className="absolute inset-0 aurora-grid-bg" aria-hidden />
      <div className="aurora-blob h-[400px] w-[400px] -left-24 -top-24 bg-[hsl(var(--aurora-indigo))]" aria-hidden />
      <div
        className="aurora-blob h-[500px] w-[500px] -right-32 top-20 bg-[hsl(var(--aurora-cyan))]"
        style={{ animationDelay: "-6s" }}
        aria-hidden
      />
      <div
        className="aurora-blob h-[350px] w-[350px] left-1/3 bottom-0 bg-[hsl(var(--aurora-violet))]"
        style={{ animationDelay: "-12s" }}
        aria-hidden
      />

      <div className="container relative grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        {/* Left */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="aurora-chip mb-6">
            <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--aurora-cyan))]" />
            {greeting(fullName)} — descubra o que está em alta {city ? `em ${city.city}` : "na sua cidade"}
          </span>

          <h1 className="text-4xl md:text-6xl lg:text-[68px] font-semibold leading-[1.05] tracking-tight">
            Descubra o melhor
            <br />
            da <span className="aurora-gradient-text">sua cidade</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-[hsl(var(--aurora-muted))] leading-relaxed">
            Ofertas, eventos, empresas verificadas e experiências locais em um só lugar.
            Recomendações inteligentes baseadas em onde você está e no que você ama.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#ofertas"
              className="group inline-flex items-center gap-2 rounded-full aurora-gradient-bg px-6 py-3 text-sm font-semibold aurora-glow hover:brightness-110 transition"
            >
              Explorar
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <Link
              to="/anuncie"
              className="inline-flex items-center gap-2 rounded-full aurora-glass px-6 py-3 text-sm font-semibold hover:bg-white/10 transition"
            >
              Cadastrar empresa
            </Link>
            <button
              onClick={openSelector}
              className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm text-white/70 hover:text-white transition"
            >
              <MapPin className="h-4 w-4 text-[hsl(var(--aurora-cyan))]" />
              {city ? `${city.city} · ${city.state}` : "Definir cidade"}
            </button>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-4 max-w-lg">
            {[
              { v: stats.stores, l: "empresas" },
              { v: stats.offers, l: "ofertas ativas" },
              { v: stats.cities, l: "cidades" },
            ].map((s, i) => (
              <motion.div
                key={s.l}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.08 }}
                className="rounded-2xl aurora-glass p-4"
              >
                <div className="text-2xl font-semibold aurora-gradient-text">
                  {s.v.toLocaleString("pt-BR")}
                </div>
                <div className="text-xs text-[hsl(var(--aurora-muted))] mt-1">{s.l}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right — glass showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="relative aspect-[4/5] max-w-md mx-auto rounded-[32px] overflow-hidden aurora-glass-strong aurora-glow">
            <img
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=900&q=80"
              alt="Descoberta local"
              className="absolute inset-0 h-full w-full object-cover opacity-60"
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--aurora-bg))] via-transparent to-transparent" />

            <div className="absolute top-5 left-5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--aurora-hot))] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-70 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                Em alta agora
              </span>
            </div>

            {/* featured company card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="absolute bottom-5 left-5 right-5 rounded-2xl aurora-glass-strong p-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl aurora-gradient-violet grid place-items-center text-white font-bold">
                  OF
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold truncate">Empresa destaque</span>
                    <BadgeCheck className="h-4 w-4 text-[hsl(var(--aurora-cyan))]" />
                  </div>
                  <div className="text-xs text-[hsl(var(--aurora-muted))]">
                    Alimentação · 850m
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-3.5 w-3.5 fill-[hsl(var(--aurora-cyan))] text-[hsl(var(--aurora-cyan))]" />
                    <span className="font-semibold">4.9</span>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-[hsl(var(--aurora-muted))]">
                    FlyScore
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* floating indicators */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="hidden md:flex absolute -left-6 top-24 items-center gap-2 rounded-2xl aurora-glass-strong px-4 py-3 aurora-glow-cyan"
          >
            <TrendingUp className="h-5 w-5 text-[hsl(var(--aurora-cyan))]" />
            <div>
              <div className="text-xs text-[hsl(var(--aurora-muted))]">Ofertas hoje</div>
              <div className="text-lg font-semibold">+{stats.offers}</div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.85 }}
            className="hidden md:flex absolute -right-4 bottom-20 items-center gap-2 rounded-2xl aurora-glass-strong px-4 py-3"
          >
            <BadgeCheck className="h-5 w-5 text-[hsl(var(--aurora-success))]" />
            <div>
              <div className="text-xs text-[hsl(var(--aurora-muted))]">Verificadas</div>
              <div className="text-lg font-semibold">{stats.stores}+</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
