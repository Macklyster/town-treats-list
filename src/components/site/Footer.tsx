import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail, MapPin } from "lucide-react";
import logo from "@/assets/ofertasfly-logo-escura.svg";
import { fetchAvailableCities } from "@/lib/offers-api";
import { citySlug, cityLabel, type CityLike } from "@/lib/slug";

export const Footer = () => {
  const [cities, setCities] = useState<CityLike[]>([]);

  useEffect(() => {
    fetchAvailableCities().then((list) => setCities(list.slice(0, 12)));
  }, []);

  return (
    <footer className="mt-24 bg-charcoal text-charcoal-foreground">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div className="space-y-4">
          <img src={logo} alt="OfertasFly" className="h-12 w-auto" />
          <p className="text-sm opacity-80">
            O hub de ofertas locais que conecta consumidores e lojistas da sua cidade.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide opacity-80">OfertasFly</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-accent">Sobre Nós</Link></li>
            <li><Link to="/anuncie" className="hover:text-accent">Anuncie Conosco</Link></li>
            <li><Link to="/#ofertas" className="hover:text-accent">Ver Ofertas</Link></li>
          </ul>
          <h4 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide opacity-80">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/termos-de-uso" className="hover:text-accent">Termos de Uso</Link></li>
            <li><Link to="/politica-de-privacidade" className="hover:text-accent">Política de Privacidade</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide opacity-80">Ofertas por cidade</h4>
          {cities.length === 0 ? (
            <p className="text-sm opacity-70">Em breve em mais cidades.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {cities.map((c) => (
                <li key={citySlug(c)}>
                  <Link to={`/ofertas/${citySlug(c)}`} className="hover:text-accent">
                    Ofertas em {cityLabel(c)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide opacity-80">Fale com a gente</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> contato@ofertasfly.com.br</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Douradina — Paraná — Brasil</li>
          </ul>
          <div className="mt-4 flex gap-3">
            <a href="#" aria-label="Instagram" className="rounded-full bg-charcoal-foreground/10 p-2 hover:bg-accent hover:text-accent-foreground">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Facebook" className="rounded-full bg-charcoal-foreground/10 p-2 hover:bg-accent hover:text-accent-foreground">
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-charcoal-foreground/10">
        <div className="container py-5 text-center text-xs opacity-70">
          © {new Date().getFullYear()} OfertasFly — Ofertas Locais. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};
