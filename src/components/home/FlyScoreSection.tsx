import { useState } from "react";
import { motion } from "framer-motion";
import { Award, BadgeCheck, MessageSquare, Sparkles, Timer, TrendingUp, X } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const PILARES = [
  { icon: BadgeCheck, label: "Verificação", desc: "Documento, endereço e responsável confirmados." },
  { icon: MessageSquare, label: "Avaliações", desc: "Média e volume real de reviews da comunidade." },
  { icon: Timer, label: "Resposta", desc: "Velocidade em responder mensagens e reservas." },
  { icon: TrendingUp, label: "Popularidade", desc: "Engajamento, visitas e cupons resgatados." },
  { icon: Award, label: "Consistência", desc: "Constância na qualidade ao longo do tempo." },
  { icon: Sparkles, label: "Experiência", desc: "Fotos, cardápio, cupons e pós-atendimento." },
];

export const FlyScoreSection = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="container py-16 md:py-24">
      <SectionHeading
        eyebrow="FlyScore™"
        align="center"
        title={<>O algoritmo que traduz <span className="aurora-gradient-text">confiança</span> em nota</>}
        description="6 pilares combinados em tempo real para revelar quais empresas realmente merecem sua atenção."
      />

      <div className="relative mt-8 grid gap-8 lg:grid-cols-[1fr_1.2fr] items-center">
        {/* circular indicator */}
        <div className="relative mx-auto grid place-items-center h-[300px] w-[300px] md:h-[360px] md:w-[360px]">
          <div className="absolute inset-0 rounded-full aurora-shine opacity-30 blur-2xl" />
          <div className="relative h-full w-full rounded-full aurora-glass-strong aurora-glow grid place-items-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="44" stroke="hsl(var(--aurora-fg) / 0.06)" strokeWidth="4" fill="none" />
              <motion.circle
                cx="50" cy="50" r="44" fill="none" strokeWidth="4"
                stroke="url(#aurora-grad)" strokeLinecap="round"
                initial={{ strokeDasharray: "0 276" }}
                whileInView={{ strokeDasharray: "252 276" }}
                viewport={{ once: true }}
                transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
              />
              <defs>
                <linearGradient id="aurora-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--aurora-indigo))" />
                  <stop offset="100%" stopColor="hsl(var(--aurora-cyan))" />
                </linearGradient>
              </defs>
            </svg>
            <div className="text-center">
              <div className="text-6xl md:text-7xl font-bold aurora-gradient-text">9.1</div>
              <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--aurora-muted))] mt-2">
                Média das top 20
              </div>
            </div>
          </div>
        </div>

        {/* pilares */}
        <div className="grid grid-cols-2 gap-3">
          {PILARES.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.button
                key={p.label}
                type="button"
                onClick={() => setOpen(i)}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="text-left rounded-2xl aurora-glass aurora-ring p-4 group"
              >
                <div className="h-9 w-9 rounded-xl aurora-gradient-violet grid place-items-center mb-3">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="text-sm font-semibold">{p.label}</div>
                <div className="text-xs text-[hsl(var(--aurora-muted))] mt-1 line-clamp-2">{p.desc}</div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* modal */}
      {open !== null && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setOpen(null)}
        >
          <div
            className="relative max-w-md w-full rounded-3xl aurora-glass-strong p-6 aurora-glow animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 h-8 w-8 rounded-full aurora-glass grid place-items-center"
              onClick={() => setOpen(null)}
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="h-12 w-12 rounded-2xl aurora-gradient-bg grid place-items-center mb-4">
              {(() => { const I = PILARES[open].icon; return <I className="h-6 w-6 text-white" />; })()}
            </div>
            <h3 className="text-xl font-semibold">{PILARES[open].label}</h3>
            <p className="mt-2 text-sm text-[hsl(var(--aurora-muted))] leading-relaxed">
              {PILARES[open].desc} Este pilar contribui para o cálculo do FlyScore junto com os outros 5 fatores,
              atualizado continuamente conforme novas interações acontecem na plataforma.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
