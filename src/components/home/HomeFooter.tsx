import { Link } from "react-router-dom";
import { Instagram, Facebook, MessageCircle, Youtube, Apple, PlayCircle } from "lucide-react";
import logo from "@/assets/ofertasfly-logo-transparente.svg";

const COLS = [
  {
    title: "Navegação",
    links: [
      { to: "/", label: "Início" },
      { to: "/#ofertas", label: "Descobrir" },
      { to: "/#ofertas", label: "Ofertas" },
      { to: "/", label: "Eventos" },
      { to: "/", label: "Empresas" },
      { to: "/", label: "Novidades" },
    ],
  },
  {
    title: "Institucional",
    links: [
      { to: "/", label: "Quem somos" },
      { to: "/", label: "Como funciona" },
      { to: "/anuncie", label: "Para lojistas" },
      { to: "/", label: "Blog" },
      { to: "/politica-de-privacidade", label: "Política de Privacidade" },
      { to: "/termos-de-uso", label: "Termos de Uso" },
    ],
  },
  {
    title: "Ajuda",
    links: [
      { to: "/", label: "Central de ajuda" },
      { to: "/", label: "Dúvidas frequentes" },
      { to: "/", label: "Fale conosco" },
      { to: "/", label: "Segurança" },
    ],
  },
];

export const HomeFooter = () => (
  <footer id="instalar" className="mt-12 bg-charcoal text-charcoal-foreground">
    <div className="container py-12 md:py-16">
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <img src={logo} alt="OfertasFly" className="h-10 w-auto" />
          <div className="mt-2 text-xs uppercase tracking-[0.14em] text-white/60">Descubra. Conecte. Valorize.</div>
          <p className="mt-4 text-sm text-white/70 leading-relaxed max-w-xs">
            A plataforma que conecta você ao melhor do comércio local.
          </p>
          <div className="mt-4 flex gap-2">
            {[Instagram, Facebook, MessageCircle, Youtube].map((I, i) => (
              <a
                key={i}
                href="#"
                aria-label="Rede social"
                className="h-9 w-9 rounded-full bg-white/10 grid place-items-center hover:bg-primary transition"
              >
                <I className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {COLS.map((c) => (
          <div key={c.title}>
            <h3 className="text-sm font-semibold text-white mb-3">{c.title}</h3>
            <ul className="space-y-2">
              {c.links.map((l, i) => (
                <li key={l.label + i}>
                  <Link to={l.to} className="text-sm text-white/70 hover:text-white transition">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Baixe o app</h3>
          <p className="text-xs text-white/60 mb-3">Baixe o app e tenha tudo na palma da sua mão.</p>
          <div className="flex flex-col gap-2">
            <a href="#" className="inline-flex items-center gap-3 rounded-xl bg-white/10 hover:bg-white/15 px-3 py-2.5 transition">
              <PlayCircle className="h-6 w-6" />
              <div className="text-left leading-tight">
                <div className="text-[10px] uppercase tracking-wider text-white/60">Disponível no</div>
                <div className="text-sm font-semibold">Google Play</div>
              </div>
            </a>
            <a href="#" className="inline-flex items-center gap-3 rounded-xl bg-white/10 hover:bg-white/15 px-3 py-2.5 transition">
              <Apple className="h-6 w-6" />
              <div className="text-left leading-tight">
                <div className="text-[10px] uppercase tracking-wider text-white/60">Baixar na</div>
                <div className="text-sm font-semibold">App Store</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-white/10 text-xs text-white/60 text-center">
        © {new Date().getFullYear()} OfertasFly. Todos os direitos reservados.
      </div>
    </div>
  </footer>
);
