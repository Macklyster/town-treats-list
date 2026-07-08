import { useState } from "react";
import { Award, BadgeCheck, MessageSquare, Sparkles, Star, Timer, TrendingUp, X, Zap } from "lucide-react";

const PILARES = [
  { icon: Star, label: "Avaliações", value: "4,8", desc: "Média e volume real de reviews da comunidade." },
  { icon: Zap, label: "Atualização", value: "98%", desc: "Frequência com que a empresa atualiza suas ofertas." },
  { icon: Timer, label: "Resposta", value: "95%", desc: "Velocidade em responder mensagens e reservas." },
  { icon: BadgeCheck, label: "Informações", value: "100%", desc: "Documento, endereço e responsável confirmados." },
  { icon: TrendingUp, label: "Engajamento", value: "92%", desc: "Cupons resgatados, visitas e interações." },
  { icon: Sparkles, label: "Presença Digital", value: "94%", desc: "Fotos, cardápio, redes sociais e presença online." },
];

export const FlyScoreBar = () => {
  const [open, setOpen] = useState(false);

  return (
    <section className="container py-6 md:py-10">
      <div className="rounded-2xl bg-card border border-border shadow-soft p-5 md:p-6 flex flex-col lg:flex-row items-center gap-6">
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 grid place-items-center">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground leading-tight">
                Entenda o FlyScore™
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Nosso índice exclusivo que avalia a qualidade das empresas em 6 pilares importantes.
              </p>
              <button
                onClick={() => setOpen(true)}
                className="mt-1 text-xs font-semibold text-primary hover:underline"
              >
                Saiba como funciona
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {PILARES.map((p) => {
              const I = p.icon;
              return (
                <button
                  key={p.label}
                  onClick={() => setOpen(true)}
                  className="text-center rounded-xl border border-border bg-background p-3 hover:border-primary hover:bg-primary-light transition"
                >
                  <I className="h-4 w-4 text-primary mx-auto mb-1" />
                  <div className="text-sm font-bold text-foreground">{p.value}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{p.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 relative h-32 w-32 grid place-items-center">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="44" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
            <circle
              cx="50" cy="50" r="44" fill="none" strokeWidth="8"
              stroke="hsl(var(--primary))" strokeLinecap="round"
              strokeDasharray="265 276"
            />
          </svg>
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground leading-none">
              96<span className="text-sm text-muted-foreground font-medium">/100</span>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
              FlyScore Médio
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="relative max-w-lg w-full rounded-2xl bg-card p-6 shadow-pop" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-4 right-4 h-8 w-8 rounded-full border border-border grid place-items-center hover:bg-muted"
              onClick={() => setOpen(false)}
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-xl font-semibold text-foreground">Como o FlyScore™ é calculado</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Combinamos 6 pilares em tempo real para revelar quais empresas realmente merecem sua atenção:
            </p>
            <ul className="mt-4 space-y-3">
              {PILARES.map((p) => {
                const I = p.icon;
                return (
                  <li key={p.label} className="flex items-start gap-3">
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-primary/10 grid place-items-center">
                      <I className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{p.label}</div>
                      <div className="text-xs text-muted-foreground">{p.desc}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
};

// Kept for compat: existing Index imports FlyScoreSection
export const FlyScoreSection = FlyScoreBar;
