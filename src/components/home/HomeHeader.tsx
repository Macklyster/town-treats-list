import { Link, NavLink, useNavigate } from "react-router-dom";
import { Gavel, Heart, MapPin, Menu, Search, Sparkles, Tag, Ticket, User as UserIcon, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCity } from "@/hooks/useCity";
import logo from "@/assets/ofertasfly-logo-transparente.svg";
import { CategoryChips } from "./CategoryChips";

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
    <header
      className={`sticky top-0 z-50 w-full bg-background/95 backdrop-blur transition-shadow ${
        scrolled ? "shadow-soft border-b border-border" : "border-b border-transparent"
      }`}
    >
      <div className="container flex h-16 items-center gap-4 md:h-20">
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="OfertasFly">
          <img src={logo} alt="OfertasFly — Descubra. Conecte. Valorize." className="h-8 w-auto md:h-9" />
        </Link>

        <form onSubmit={submit} className="hidden md:flex flex-1 max-w-xl mx-auto">
          <div className="flex items-center gap-2 w-full rounded-full border border-border bg-card pl-4 pr-1 py-1 shadow-soft focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="O que você procura hoje?"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="h-9 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center hover:bg-primary-deep transition"
              aria-label="Buscar"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={openSelector}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-foreground/80 hover:border-primary hover:text-primary transition"
          >
            <MapPin className="h-3.5 w-3.5 text-primary" />
            {city ? `${city.city} - ${city.state}` : "Cidade"}
          </button>
          <Link
            to={user ? "/perfil/notificacoes" : "/auth"}
            aria-label="Favoritos"
            className="grid h-9 w-9 place-items-center rounded-full border border-border text-foreground/70 hover:border-primary hover:text-primary transition"
          >
            <Heart className="h-4 w-4" />
          </Link>
          {user ? (
            <Link
              to={isAdmin ? "/admin" : isLojista ? "/painel-lojista" : "/perfil/notificacoes"}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-deep transition"
            >
              <UserIcon className="h-4 w-4" />
              Minha conta
            </Link>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-deep transition"
            >
              Entrar
            </Link>
          )}
        </div>

        <button
          className="md:hidden ml-auto grid h-10 w-10 place-items-center rounded-full border border-border"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <nav className="hidden md:block border-t border-border/60 bg-background/95">
        <div className="container flex h-11 items-center gap-1 overflow-x-auto">
          {[
            { to: "/", label: "Ofertas", icon: Tag, end: true },
            { to: "/coletivas", label: "Coletivas", icon: Users },
            { to: "/leiloes", label: "Leilões", icon: Gavel },
            { to: "/ofertas-invisiveis", label: "Invisíveis", icon: Sparkles },
            { to: "/perfil/cupons", label: "Meus Cupons", icon: Ticket },
            { to: "/anuncie", label: "Anuncie", icon: Sparkles },
          ].map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-foreground/70 hover:bg-primary-light hover:text-primary"
                }`
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="container hidden md:flex pb-3 pt-3">
        <CategoryChips />
      </div>


      {open && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="container flex flex-col gap-3 py-4">
            <form onSubmit={submit} className="flex items-center gap-2 rounded-full border border-border bg-background pl-4 pr-1 py-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar…"
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <button className="h-9 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center" aria-label="Buscar">
                <Search className="h-4 w-4" />
              </button>
            </form>
            <button onClick={openSelector} className="inline-flex items-center gap-1.5 self-start rounded-full border border-border px-3 py-1.5 text-sm">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {city ? `${city.city} - ${city.state}` : "Selecionar cidade"}
            </button>
            <CategoryChips />
            {!user ? (
              <Link to="/auth" onClick={() => setOpen(false)} className="rounded-full bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground">
                Entrar
              </Link>
            ) : (
              <Link
                to={isAdmin ? "/admin" : isLojista ? "/painel-lojista" : "/perfil/notificacoes"}
                onClick={() => setOpen(false)}
                className="rounded-full bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground"
              >
                Minha conta
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
