import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "@/lib/router-compat";
import {
  ArrowLeft,
  HelpCircle,
  Search,
  Sparkles,
  Store,
  UserPlus,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PageHero } from "@/components/site/PageHero";
import { SectionCard } from "@/components/site/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SEO } from "@/components/seo/SEO";
import { useAuth } from "@/hooks/useAuth";
import {
  LOYALTY_FAQ_CTA,
  LOYALTY_FAQ_SECTIONS,
} from "@/lib/loyalty-faq-content";

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export default function FidelidadeComoFunciona() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const location = useLocation();
  const scrolledFor = useRef<string | null>(null);

  const sections = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return LOYALTY_FAQ_SECTIONS;
    return LOYALTY_FAQ_SECTIONS.map((s) => ({
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

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (!hash || scrolledFor.current === hash) return;
    const el = document.getElementById(hash);
    if (el) {
      scrolledFor.current = hash;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash, sections]);

  const cta = user ? LOYALTY_FAQ_CTA.loggedIn : LOYALTY_FAQ_CTA.loggedOut;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="Como funciona o FlyPontos | OfertasFly"
        description="Entenda como funciona o programa de fidelidade FlyPontos: pontos, níveis, recompensas, cashback, QR de compra e ranking das lojas parceiras."
        path="/fidelidade/como-funciona"
      />

      <Header />
      <main className="container flex-1 space-y-8 py-8 md:py-10">
        <PageHero
          eyebrow="Programa de fidelidade"
          title="Como funciona o FlyPontos"
          subtitle="Cada loja parceira tem seu próprio programa de pontos. Acumule, evolua de nível e troque por recompensas."
          crumbs={[
            { label: "Início", to: "/" },
            { label: "Fidelidade", to: "/fidelidade" },
            { label: "Como funciona" },
          ]}
          compact
          actions={
            <Button asChild variant="outline">
              <Link to="/fidelidade">
                <ArrowLeft className="h-4 w-4" /> Voltar para Fidelidade
              </Link>
            </Button>
          }
        />

        <SectionCard
          eyebrow="Busca"
          title="O que você quer saber sobre o FlyPontos?"
          description="Digite uma palavra como “pontos”, “resgate”, “cashback”, “QR” ou “nível”."
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar na ajuda..."
              className="pl-9"
              aria-label="Buscar na FAQ do FlyPontos"
            />
          </div>

          {query.trim() ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {totalTopics === 0
                ? "Nenhum tópico encontrado. Tente outra palavra."
                : `${totalTopics} ${totalTopics === 1 ? "tópico encontrado" : "tópicos encontrados"}.`}
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {LOYALTY_FAQ_SECTIONS.map((s) => (
                <Button key={s.id} asChild size="sm" variant="outline">
                  <a href={`#${s.id}`}>{s.title}</a>
                </Button>
              ))}
            </div>
          )}
        </SectionCard>

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

        <SectionCard
          eyebrow="Comece agora"
          title={user ? "Encontre lojas parceiras" : "Crie sua conta grátis"}
          description={
            user
              ? "Veja quais lojas já participam do FlyPontos e comece a acumular pontos hoje."
              : "Cadastre-se no OfertasFly gratuitamente e participe dos programas de fidelidade das lojas parceiras."
          }
          action={
            <Button asChild variant="accent">
              <Link to={cta.to}>
                {user ? (
                  <>
                    <Store className="mr-2 h-4 w-4" /> {cta.text}
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" /> {cta.text}
                  </>
                )}
              </Link>
            </Button>
          }
        >
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              Lembre-se: cada loja define suas próprias regras de pontos, níveis e recompensas.
              Sempre confira os detalhes na página de fidelidade da loja escolhida.
            </p>
          </div>
        </SectionCard>
      </main>
      <Footer />
    </div>
  );
}
