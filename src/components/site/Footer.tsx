import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail, MapPin } from "lucide-react";
import logo from "@/assets/helpfy-logo.png";

export const Footer = () => {
  return (
    <footer className="mt-24 bg-primary text-primary-foreground">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div className="space-y-4">
          <img src={logo} alt="Helpfy" className="h-10 w-auto" />
          <p className="text-sm opacity-80">
            O hub de ofertas locais que conecta consumidores e lojistas da sua cidade.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide opacity-80">Helpfy</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-accent">Sobre Nós</Link></li>
            <li><Link to="/anuncie" className="hover:text-accent">Anuncie Conosco</Link></li>
            <li><Link to="/ofertas" className="hover:text-accent">Ver Ofertas</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide opacity-80">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-accent">Termos de Uso</a></li>
            <li><a href="#" className="hover:text-accent">Política de Privacidade</a></li>
            <li><a href="#" className="hover:text-accent">Contato</a></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide opacity-80">Fale com a gente</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> contato@helpfy.com.br</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Sua Cidade — Brasil</li>
          </ul>
          <div className="mt-4 flex gap-3">
            <a href="#" aria-label="Instagram" className="rounded-full bg-primary-foreground/10 p-2 hover:bg-accent hover:text-accent-foreground">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Facebook" className="rounded-full bg-primary-foreground/10 p-2 hover:bg-accent hover:text-accent-foreground">
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="container py-5 text-center text-xs opacity-70">
          © {new Date().getFullYear()} Helpfy Ofertas Locais. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};
