import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Flame, Music, PartyPopper, Store, Tag } from "lucide-react";
import { fetchHappeningNow, fetchUpcomingEvents, UIEvent } from "@/lib/home-api";
import { useCity } from "@/hooks/useCity";
import { SectionHeading } from "./SectionHeading";

const KIND_META: Record<UIEvent["kind"], { icon: any; label: string; color: string }> = {
  happy_hour: { icon: Flame, label: "Happy Hour", color: "hsl(12 100% 62%)" },
  show: { icon: Music, label: "Show", color: "hsl(265 84% 66%)" },
  feira: { icon: Store, label: "Feira", color: "hsl(156 80% 50%)" },
  evento: { icon: PartyPopper, label: "Evento", color: "hsl(187 92% 55%)" },
  promocao: { icon: Tag, label: "Promoção", color: "hsl(244 76% 59%)" },
};

const timeFmt = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export const HappeningNow = () => {
  const { city } = useCity();
  const [now, setNow] = useState<UIEvent[]>([]);
  const [upcoming, setUpcoming] = useState<UIEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchHappeningNow(city ?? undefined), fetchUpcomingEvents(city ?? undefined)]).then(
      ([n, u]) => {
        setNow(n);
        setUpcoming(u);
        setLoading(false);
      },
    );
  }, [city?.city]);

  const list = now.length ? now : upcoming;
  const title = now.length ? "Acontecendo agora" : "Próximos eventos";

  return (
    <section className="container py-16 md:py-20">
      <SectionHeading
        eyebrow={now.length ? "🔥 Ao vivo" : "Agenda"}
        title={
          <>
            {now.length ? "O que está " : "O que vem por aí "}
            <span className="aurora-gradient-text">{title.toLowerCase()}</span>
          </>
        }
        description={
          city
            ? `Happy hours, shows, feiras e experiências em ${city.city} — atualizados em tempo real.`
            : "Selecione sua cidade para ver eventos em tempo real."
        }
      />

      {loading ? (
        <div className="aurora-scroll-x flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shrink-0 w-[300px] h-[140px] rounded-2xl aurora-glass animate-pulse" />
          ))}
        </div>
      ) : list.length ? (
        <div className="aurora-scroll-x flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
          {list.map((ev, i) => {
            const meta = KIND_META[ev.kind];
            const Icon = meta.icon;
            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="shrink-0 w-[320px] snap-start aurora-glass aurora-ring rounded-2xl overflow-hidden"
              >
                {ev.image_url && (
                  <div className="relative aspect-[16/9]">
                    <img src={ev.image_url} alt={ev.title} className="h-full w-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                    >
                      <Icon className="h-3 w-3" /> {meta.label}
                    </span>
                    <span className="text-[11px] text-[hsl(var(--aurora-muted))]">
                      {timeFmt(ev.starts_at)} — {timeFmt(ev.ends_at)}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold leading-snug">{ev.title}</h3>
                  {ev.description && (
                    <p className="mt-1.5 text-xs text-[hsl(var(--aurora-muted))] line-clamp-2">{ev.description}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl aurora-glass p-10 text-center text-[hsl(var(--aurora-muted))]">
          <Calendar className="h-6 w-6 mx-auto mb-2 text-[hsl(var(--aurora-cyan))]" />
          Ainda não há eventos cadastrados {city ? `em ${city.city}` : ""}. Em breve!
        </div>
      )}
    </section>
  );
};
