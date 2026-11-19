import { useEffect, useState } from "react";
import { Award, BadgeCheck, Sparkles, Star, Timer, TrendingUp, X, Zap } from "lucide-react";
import { fetchFlyScoreAggregate, type FlyScoreAggregate } from "@/lib/home-api";

type ActiveKey = "avaliacoes" | "informacoes" | "atualizacao";

const ACTIVE_PILARES: Array<{
  key: ActiveKey;
  icon: any;
  label: string;
  short: string;
  desc: string;
}> = [
  {
    key: "avaliacoes",
    icon: Star,
    label: "Avaliações",
    short: "Média das notas × volume real de reviews aprovados.",
    desc: "Combinamos a média de estrelas com o total de avaliações aprovadas. Empresas com 20+ reviews atingem o peso máximo.",
  },
  {
    key: "informacoes",
    icon: BadgeCheck,
    label: "Informações",
    short: "Cadastro completo da empresa (contato, endereço, mídia).",
    desc: "Conferimos nome, endereço, cidade, WhatsApp, logo, capa, descrição, Instagram, telefone e localização no mapa. Dados obrigatórios têm peso dobrado.",
  },
  {
    key: "atualizacao",
    icon: Zap,
    label: "Atualização",
    short: "Frequência com que a empresa publica ou edita ofertas.",
    desc: "100 pontos se houve oferta nova/editada nos últimos 30 dias. Decai linearmente até zerar aos 120 dias sem novidades.",
  },
];

const NEXT_PILARES = [
  { key: "resposta",    icon: Timer,      label: "Resposta" },
  { key: "engajamento", icon: TrendingUp, label: "Engajamento" },
  { key: "presenca",    icon: Sparkles,   label: "Presença Digital" },
];

function scoreTone(v: number) {
  if (v >= 80) return { bar: "bg-primary",              text: "text-highlight",              badge: "Excelente" };
  if (v >= 60) return { bar: "bg-primary/70",           text: "text-highlight",              badge: "Bom" };
  if (v >= 40) return { bar: "bg-warning-foreground",   text: "text-warning-foreground",   badge: "Regular" };
  return          { bar: "bg-destructive",              text: "text-destructive",          badge: "A melhorar" };
}

export const FlyScoreBar = () => {
  const [open, setOpen] = useState(false);
  const [agg, setAgg] = useState<FlyScoreAggregate | null>(null);

  useEffect(() => {
    fetchFlyScoreAggregate().then(setAgg);
  }, []);

  const overall = agg?.overallMedio ?? 0;
  const dash = Math.max(0, Math.min(276, (overall / 100) * 276));
  const values: Record<ActiveKey, number> = {
    avaliacoes: agg?.pilaresMedios.avaliacoes ?? 0,
    informacoes: agg?.pilaresMedios.informacoes ?? 0,
    atualizacao: agg?.pilaresMedios.atualizacao ?? 0,
  };

  return (
    <section className="container py-6 md:py-10">
      <div className="rounded-2xl bg-card border border-border shadow-soft p-5 md:p-6">
        {/* Cabeçalho + gauge */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 grid place-items-center">
                <Award className="h-5 w-5 text-highlight" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground leading-tight">
                  Entenda o FlyScore™
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Nosso índice exclusivo de qualidade das empresas — média em tempo real de todas as lojas ativas.
                </p>
                <button
                  onClick={() => setOpen(true)}
                  className="mt-1 text-xs font-semibold text-highlight hover:text-highlight-strong hover:underline"
                >
                  Saiba como funciona
                </button>
              </div>
            </div>
          </div>

          <div className="shrink-0 relative h-32 w-32 grid place-items-center mx-auto lg:mx-0">
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="44" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
              <circle
                cx="50" cy="50" r="44" fill="none" strokeWidth="8"
                stroke="hsl(var(--primary))" strokeLinecap="round"
                strokeDasharray={`${dash} 276`}
              />
            </svg>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground leading-none">
                {overall}
                <span className="text-sm text-muted-foreground font-medium">/100</span>
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                FlyScore Médio
              </div>
              {agg && agg.totalLojas > 0 && (
                <div className="text-[9px] text-muted-foreground mt-0.5">
                  {agg.totalLojas} loja{agg.totalLojas === 1 ? "" : "s"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detalhamento dos 3 pilares ativos */}
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {ACTIVE_PILARES.map((p) => {
            const Icon = p.icon;
            const v = values[p.key];
            const tone = scoreTone(v);
            return (
              <div
                key={p.key}
                className="rounded-xl border border-border bg-background p-4 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                    <Icon className="h-4 w-4 text-highlight" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground leading-tight">{p.label}</div>
                    <div className={`text-[10px] uppercase tracking-wide font-semibold ${tone.text}`}>
                      {tone.badge}
                    </div>
                  </div>
                  <div className="text-xl font-bold text-foreground tabular-nums">
                    {v}
                    <span className="text-xs text-muted-foreground font-medium">%</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${tone.bar}`}
                    style={{ width: `${v}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground leading-snug">{p.short}</p>
              </div>
            );
          })}
        </div>

        {/* Próximos pilares */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">
            Em breve:
          </span>
          {NEXT_PILARES.map((p) => {
            const Icon = p.icon;
            return (
              <span
                key={p.key}
                className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border/60 bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground"
              >
                <Icon className="h-3 w-3" /> {p.label}
              </span>
            );
          })}
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
              O FlyScore é a média de vários pilares avaliados em tempo real. Nesta versão, 3 pilares já estão ativos e os demais serão liberados em breve.
            </p>
            <ul className="mt-4 space-y-3">
              {ACTIVE_PILARES.map((p) => {
                const Icon = p.icon;
                return (
                  <li key={p.key} className="flex items-start gap-3">
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-primary/10 grid place-items-center">
                      <Icon className="h-4 w-4 text-highlight" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{p.label}</div>
                      <div className="text-xs text-muted-foreground">{p.desc}</div>
                    </div>
                  </li>
                );
              })}
              {NEXT_PILARES.map((p) => {
                const Icon = p.icon;
                return (
                  <li key={p.key} className="flex items-start gap-3 opacity-70">
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-muted grid place-items-center">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                        {p.label}
                        <span className="text-[10px] uppercase tracking-wide rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                          em breve
                        </span>
                      </div>
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
