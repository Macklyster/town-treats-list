import { Link, useNavigate } from "react-router-dom";
import { Heart, MapPin, Menu, Search, Sparkles, User as UserIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useCity } from "@/hooks/useCity";
import logo from "@/assets/ofertasfly-logo-transparente.svg";
import { categories } from "@/data/categories";

export const HomeHeader = () => {
  const { user, isAdmin, isLojista } = useAuth();
  const { city, openSelector } = useCity();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    nav(`/${p.toString() ? `?${p}` : ""}#ofertas`);
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "aurora-glass-strong border-b border-white/10" : "bg-transparent"
      }`}
    >
      <div className="container flex h-20 items-center gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="OfertasFly" className="h-10 w-auto" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-4">
          {categories.slice(0, 4).map((c) => (
            <Link
              key={c.id}
              to={`/?categoria=${c.slug}#ofertas`}
              className="rounded-full px-3 py-1.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <form onSubmit={submit} className="hidden md:flex flex-1 max-w-md mx-auto">
          <div className="flex items-center gap-2 w-full rounded-full aurora-glass px-4 py-2">
            <Search className="h-4 w-4 text-white/50" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar lojas, ofertas, categorias…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
            />
            <kbd className="hidden sm:inline text-[10px] text-white/40 border border-white/10 rounded px-1.5 py-0.5">
              ⌘K
            </kbd>
          </div>
        </form>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={openSelector}
            className="aurora-chip aurora-ring hover:border-[hsl(var(--aurora-cyan)/0.4)]"
          >
            <MapPin className="h-3.5 w-3.5 text-[hsl(var(--aurora-cyan))]" />
            {city ? `${city.city} · ${city.state}` : "Cidade"}
          </button>
          <Link
            to={user ? "/perfil/notificacoes" : "/auth"}
            aria-label="Favoritos"
            className="grid h-9 w-9 place-items-center rounded-full aurora-glass hover:bg-white/10 transition-colors"
          >
            <Heart className="h-4 w-4" />
          </Link>
          {user ? (
            <Link
              to={isAdmin ? "/admin" : isLojista ? "/painel-lojista" : "/perfil/notificacoes"}
              className="inline-flex items-center gap-2 rounded-full aurora-gradient-bg px-4 py-2 text-sm font-medium text-white aurora-glow hover:brightness-110 transition"
            >
              <UserIcon className="h-4 w-4" />
              Minha conta
            </Link>
          ) : (
            <>
              <Link
                to="/auth"
                className="rounded-full px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
              >
                Entrar
              </Link>
              <Link
                to="/anuncie"
                className="inline-flex items-center gap-2 rounded-full aurora-gradient-bg px-4 py-2 text-sm font-medium text-white aurora-glow hover:brightness-110 transition"
              >
                <Sparkles className="h-4 w-4" />
                Cadastrar empresa
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden ml-auto grid h-10 w-10 place-items-center rounded-full aurora-glass"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden aurora-glass-strong border-t border-white/10">
          <div className="container flex flex-col gap-3 py-4">
            <form onSubmit={submit} className="flex items-center gap-2 rounded-full aurora-glass px-4 py-2">
              <Search className="h-4 w-4 text-white/50" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
              />
            </form>
            <button onClick={openSelector} className="aurora-chip self-start">
              <MapPin className="h-3.5 w-3.5" />
              {city ? `${city.city} · ${city.state}` : "Selecionar cidade"}
            </button>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  to={`/?categoria=${c.slug}#ofertas`}
                  onClick={() => setOpen(false)}
                  className="aurora-chip"
                >
                  {c.name}
                </Link>
              ))}
            </div>
            {!user ? (
              <div className="flex gap-2">
                <Link to="/auth" onClick={() => setOpen(false)} className="flex-1 rounded-full aurora-glass py-2.5 text-center text-sm">
                  Entrar
                </Link>
                <Link to="/anuncie" onClick={() => setOpen(false)} className="flex-1 rounded-full aurora-gradient-bg py-2.5 text-center text-sm font-medium">
                  Cadastrar
                </Link>
              </div>
            ) : (
              <Link
                to={isAdmin ? "/admin" : isLojista ? "/painel-lojista" : "/perfil/notificacoes"}
                onClick={() => setOpen(false)}
                className="rounded-full aurora-gradient-bg py-2.5 text-center text-sm font-medium"
              >
                Minha conta
              </Link>
            )}
          </div>
        </div>
      )}
    </motion.header>
  );
};
