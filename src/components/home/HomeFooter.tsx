import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, Youtube, Apple, PlayCircle } from "lucide-react";
import logo from "@/assets/ofertasfly-logo-transparente.svg";

const cols = [
  {
    title: "Institucional",
    links: [
      { to: "/anuncie", label: "Para empresas" },
      { to: "/#como-funciona", label: "Como funciona" },
      { to: "/inteligencia", label: "OfertasFly IA" },
    ],
  },
  {
    title: "Descobrir",
    links: [
      { to: "/#ofertas", label: "Ofertas" },
      { to: "/coletivas", label: "Coletivas" },
      { to: "/leiloes", label: "Leilões" },
      { to: "/ofertas-invisiveis", label: "Invisíveis" },
    ],
  },
  {
    title: "Ajuda",
    links: [
      { to: "/politica-de-privacidade", label: "Privacidade" },
      { to: "/termos-de-uso", label: "Termos" },
      { to: "/auth", label: "Entrar / Cadastrar" },
    ],
  },
];

export const HomeFooter = () => (
  <footer id="instalar" className="relative border-t border-white/5 mt-16">
    <div className="container py-16">
      <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr_1fr]">
        <div>
          <img src={logo} alt="OfertasFly" className="h-10 w-auto" />
          <p className="mt-4 text-sm text-[hsl(var(--aurora-muted))] max-w-sm leading-relaxed">
            A plataforma de descoberta local que conecta você às melhores empresas, ofertas e experiências da sua cidade.
          </p>
          <div className="mt-6 flex gap-2">
            {[Instagram, Facebook, Twitter, Youtube].map((I, i) => (
              <a
                key={i}
                href="#"
                aria-label="Rede social"
                className="h-10 w-10 rounded-full aurora-glass grid place-items-center hover:bg-white/10 transition"
              >
                <I className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {cols.map((c) => (
            <div key={c.title}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--aurora-cyan))] mb-4">
                {c.title}
              </h3>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-white/70 hover:text-white transition">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--aurora-cyan))] mb-4">
            Baixar o app
          </h3>
          <div className="flex flex-col gap-2.5">
            <a href="#" className="inline-flex items-center gap-3 rounded-2xl aurora-glass px-4 py-3 hover:bg-white/10 transition">
              <Apple className="h-6 w-6" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-[hsl(var(--aurora-muted))]">Baixar na</div>
                <div className="text-sm font-semibold">App Store</div>
              </div>
            </a>
            <a href="#" className="inline-flex items-center gap-3 rounded-2xl aurora-glass px-4 py-3 hover:bg-white/10 transition">
              <PlayCircle className="h-6 w-6" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-[hsl(var(--aurora-muted))]">Disponível no</div>
                <div className="text-sm font-semibold">Google Play</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div className="mt-14 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[hsl(var(--aurora-muted))]">
        <div>© {new Date().getFullYear()} OfertasFly. Todos os direitos reservados.</div>
        <div className="flex items-center gap-4">
          <span>Conformidade LGPD</span>
          <span>·</span>
          <Link to="/politica-de-privacidade" className="hover:text-white">Privacidade</Link>
          <span>·</span>
          <Link to="/termos-de-uso" className="hover:text-white">Termos</Link>
        </div>
      </div>
    </div>
  </footer>
);
