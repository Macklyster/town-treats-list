import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  LifeBuoy,
  Mail,
  MessageCircle,
  Search,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PageHero } from "@/components/site/PageHero";
import { SectionCard } from "@/components/site/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SEO } from "@/components/seo/SEO";
import { BEST_PRACTICES, FIRST_STEPS, HELP_SECTIONS } from "@/lib/help-content";

const SUPPORT_EMAIL = "contato@ofertasfly.com.br";
const SUPPORT_WHATSAPP = "https://wa.me/5500000000000";

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export default function PainelAjuda() {
  const [query, setQuery] = useState("");
  const location = useLocation();
  const scrolledFor = useRef<string | null>(null);

  const sections = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return HELP_SECTIONS;
    return HELP_SECTIONS.map((s) => ({
      ...s,
      topics: s.topics.filter((t) =>
        normalize(
          [t.q, ...t.a, ...(t.keywords ?? []), s.title, s.description].join(" "),
        ).includes(q),
      ),
    })).filter((s) => s.topics.length > 0);
  }, [query]);

  const totalTopics = useMemo(
    () => sections.reduce((acc, s) => acc + s.topics.length, 0),
    [sections],
  );

  // Link direto por tópico: /painel-lojista/ajuda#fidelidade
  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (!hash || scrolledFor.current === hash) return;
    const el = document.getElementById(hash);
    if (el) {
      scrolledFor.current = hash;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash, sections]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="Central de Ajuda do Lojista | OfertasFly"
        description="Tire todas as suas dúvidas sobre ofertas, mídias, cupons, eventos, fidelidade, FlyScore, inteligência e assinatura no OfertasFly."
        path="/painel-lojista/ajuda"
        noindex
      />

      <Header />
      <main className="container flex-1 space-y-8 py-8 md:py-10">
        <PageHero
          eyebrow="Painel do lojista"
          title="Central de Ajuda"
          subtitle="Tudo o que você precisa saber para vender mais no OfertasFly — do cadastro da loja ao programa de fidelidade."
          crumbs={[{ label: "Painel", to: "/painel-lojista" }, { label: "Ajuda" }]}
          compact
          actions={
            <Button asChild variant="outline">
              <Link to="/painel-lojista">
                <ArrowLeft className="h-4 w-4" /> Voltar ao painel
              </Link>
            </Button>
          }
        />

        <SectionCard
          eyebrow="Busca"
          title="O que você quer saber?"
          description="Digite uma palavra como “relâmpago”, “QR”, “pontos”, “cancelar” ou “rejeitada”."
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar na ajuda..."
              className="pl-9"
              aria-label="Buscar na central de ajuda"
            />
          </div>

          {query.trim() ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {totalTopics === 0
                ? "Nenhum tópico encontrado. Tente outra palavra ou fale com o suporte no final da página."
                : `${totalTopics} ${totalTopics === 1 ? "tópico encontrado" : "tópicos encontrados"}.`}
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {HELP_SECTIONS.map((s) => (
                <Button key={s.id} asChild size="sm" variant="outline">
                  <a href={`#${s.id}`}>{s.title}</a>
                </Button>
              ))}
            </div>
          )}
        </SectionCard>

        {!query.trim() && (
          <SectionCard
            eyebrow="Comece aqui"
            title="Primeiros passos"
            description="Cinco etapas para colocar sua loja no ar e começar a receber clientes."
          >
            <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {FIRST_STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="rounded-2xl border border-border bg-muted/30 p-5"
                >
                  <Badge variant="outline" className="font-mono">
                    {i + 1}
                  </Badge>
                  <h3 className="mt-3 font-display text-lg font-medium text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
                  {step.to && (
                    <Button asChild size="sm" variant="ghost" className="mt-3 px-0">
                      <Link to={step.to}>{step.cta} →</Link>
                    </Button>
                  )}
                </li>
              ))}
            </ol>
          </SectionCard>
        )}

        {sections.map((section) => (
          <div key={section.id} id={section.id} className="scroll-mt-24">
            <SectionCard
              eyebrow="Dúvidas frequentes"
              title={section.title}
              description={section.description}
            >
              <Accordion
                type="multiple"
                defaultValue={query.trim() ? section.topics.map((_, i) => `${section.id}-${i}`) : []}
                className="w-full"
              >
                {section.topics.map((topic, i) => (
                  <AccordionItem key={topic.q} value={`${section.id}-${i}`}>
                    <AccordionTrigger className="text-left text-base">
                      <span className="flex items-start gap-2 pr-3">
                        <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {topic.q}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pl-6 text-sm leading-relaxed text-muted-foreground">
                        {topic.a.map((p, k) => (
                          <p key={k}>{p}</p>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </SectionCard>
          </div>
        ))}

        {!query.trim() && (
          <SectionCard
            eyebrow="Boas práticas"
            title="O que faz uma oferta performar"
            description="Checklist rápido antes de publicar."
          >
            <ul className="grid gap-3 md:grid-cols-2">
              {BEST_PRACTICES.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        <SectionCard
          eyebrow="Suporte"
          title="Ainda com dúvida?"
          description="Nossa equipe responde em horário comercial."
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="accent">
              <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={`mailto:${SUPPORT_EMAIL}`}>
                <Mail className="h-4 w-4" /> {SUPPORT_EMAIL}
              </a>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/termos-de-uso">
                <LifeBuoy className="h-4 w-4" /> Termos de Uso
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/politica-de-privacidade">Política de Privacidade</Link>
            </Button>
          </div>
        </SectionCard>
      </main>
      <Footer />
    </div>
  );
}
