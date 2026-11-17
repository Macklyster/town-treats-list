import { useMemo, useState } from "react";
import { useTrialSettings } from "@/hooks/useTrialSettings";
import { motion } from "framer-motion";
import { SEO } from "@/components/seo/SEO";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeFooter } from "@/components/home/HomeFooter";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Check,
  Send,
  Sparkles,
  Gift,
  Shield,
  XCircle,
  Rocket,
  ClipboardList,
  MessagesSquare,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { PLAN_CATALOG } from "@/data/plans";
import { formatBRL } from "@/lib/format";

const plans = PLAN_CATALOG.map((p) => ({
  slug: p.slug,
  name: p.name,
  priceCents: p.priceCents,
  priceCentsYearly: p.priceCentsYearly,
  period: p.period,
  icon: p.icon,
  highlight: p.highlight,
  features: p.features,
}));

const steps = [
  { icon: ClipboardList, t: "Cadastre", d: "Preencha o formulário com os dados da empresa." },
  { icon: MessagesSquare, t: "Conversamos", d: "Um consultor monta seu plano de divulgação." },
  { icon: Rocket, t: "Publicamos", d: "Sua oferta entra no ar com fotos e texto profissionais." },
  { icon: TrendingUp, t: "Vende mais", d: "Clientes te contatam direto pelo WhatsApp ou loja." },
];

const buildFaq = (trialDays: number) => [
  {
    q: "Como cadastro minha empresa?",
    a: "Crie sua conta na plataforma. Após a assinatura e aprovação, você cadastra sua loja e, uma vez aprovada, já pode publicar anúncios.",
  },
  {
    q: "Posso trocar de plano depois?",
    a: "Sim! Você pode fazer upgrade ou downgrade a qualquer momento, sem multa.",
  },
  {
    q: "Quem cria as artes e os textos das ofertas?",
    a: "Você tem total controle: cria o anúncio, envia a arte e preenche todas as configurações. Após concluir, o anúncio vai para análise do time OfertasFly e, uma vez aprovado, é publicado na plataforma.",
  },
  {
    q: "Existe fidelidade?",
    a: "Não. Os planos são mensais e você pode cancelar quando quiser.",
  },
  {
    q: `Como funcionam os ${trialDays} dias grátis?`,
    a: `Em qualquer plano pago, sua primeira assinatura ganha ${trialDays} dias grátis. Você informa o cartão para garantir a continuidade após o período, mas nada é cobrado nos ${trialDays} primeiros dias. Cancele antes do fim do trial e não paga nada.`,
  },
  {
    q: "Posso agendar minha oferta para publicar em outra data?",
    a: "Sim, nos planos Destaque e Plus você pode agendar a publicação. Envie com no mínimo 12 horas e no máximo 30 dias de antecedência (esses limites podem ser ajustados pela equipe OfertasFly). A oferta entra em análise e, uma vez aprovada, é publicada automaticamente no horário marcado.",
  },
  {
    q: "Em quanto tempo minha oferta é aprovada?",
    a: "Nossa meta é aprovar em até 24 horas após o envio. Por isso, recomendamos agendar com folga: se faltar tempo hábil para análise, a oferta pode não ser publicada no horário desejado.",
  },
  {
    q: "Existe validade mínima para uma oferta?",
    a: "Sim. Ofertas não agendadas precisam ter validade de pelo menos 6 horas a partir do envio, para que a aprovação faça sentido e o consumidor tenha tempo de aproveitar.",
  },
  {
    q: "Como meus clientes encontram minha oferta?",
    a: "Sua oferta aparece nas buscas, na categoria correspondente e pode ser destacada na home, dependendo do plano.",
  },
];

const CONSULTANT_WHATSAPP = "5544997691237";

const Anuncie = () => {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const { trialDays } = useTrialSettings();
  const faq = useMemo(() => buildFaq(trialDays), [trialDays]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const company = String(data.get("company") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    const text =
      `Olá! Quero falar com um consultor da OfertasFly.\n\n` +
      `*Nome:* ${name}\n` +
      `*Empresa:* ${company}\n` +
      `*E-mail:* ${email}\n` +
      `*Telefone/WhatsApp:* ${phone}` +
      (message ? `\n\n*Mensagem:*\n${message}` : "");

    const url = `https://wa.me/${CONSULTANT_WHATSAPP}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");

    toast.info("Conclua o envio no WhatsApp", {
      description: "A mensagem ainda não foi enviada. Seus dados permanecem neste formulário.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Anuncie sua loja — Planos a partir de R$ 0 | OfertasFly"
        description={`Cadastre sua loja na OfertasFly, publique ofertas e cupons para a sua cidade. Planos com ${trialDays} dias grátis, sem fidelidade. Comece a vender mais hoje.`}
        path="/anuncie"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
      <HomeHeader />
      <main>
        {/* Hero */}
        <section className="container pt-4 md:pt-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl bg-[hsl(var(--hero-bg))] text-[hsl(var(--hero-fg))] p-6 md:p-12"
          >
            <div className="absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full bg-primary/25 blur-3xl" aria-hidden />
            <div className="absolute -left-24 bottom-0 h-[300px] w-[300px] rounded-full bg-primary-mid/20 blur-3xl" aria-hidden />
            <div className="relative mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> Para lojistas
              </span>
              <h1 className="mt-5 text-3xl font-semibold leading-[1.1] md:text-5xl">
                Anuncie sua empresa e{" "}
                <span className="inline-block rounded-2xl bg-background px-3 py-0.5 text-foreground shadow-soft">
                  aumente suas vendas
                </span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed opacity-85 md:text-base">
                Coloque sua marca diante de milhares de consumidores locais buscando exatamente o
                que você oferece. Marketing simples, resultado rápido.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="rounded-full">
                  <a href="#contato">Falar com um consultor</a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/30 bg-transparent text-[hsl(var(--hero-fg))] hover:bg-white/10 hover:text-[hsl(var(--hero-fg))]"
                >
                  <a href="#planos">Ver planos</a>
                </Button>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Como funciona */}
        <section className="container py-10 md:py-14">
          <SectionHeading
            align="center"
            eyebrow={<>Passo a passo</>}
            title="Como funciona"
            description="Em poucos passos sua oferta já está atraindo clientes."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.t}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className="relative rounded-2xl border border-border bg-card p-5 shadow-soft"
                >
                  <div className="absolute right-4 top-4 text-xs font-semibold text-muted-foreground/60">
                    0{i + 1}
                  </div>
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{s.t}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Planos */}
        <section id="planos" className="container py-6 md:py-10">
          <div className="rounded-3xl bg-secondary/60 p-6 md:p-10">
            <SectionHeading
              align="center"
              eyebrow={<>Planos</>}
              title="Planos para todo tipo de negócio"
              description="Escolha o plano ideal e ajuste quando quiser."
            />

            {/* Banner Trial */}
            {cycle === "monthly" && (
              <div className="relative mx-auto mb-8 max-w-4xl overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary-deep p-5 text-primary-foreground md:p-7">
                <div
                  className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/15 blur-3xl"
                  aria-hidden
                />
                <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-white/15 p-3">
                      <Gift className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur">
                        <Sparkles className="h-3 w-3" /> Boas-vindas
                      </div>
                      <h3 className="text-xl font-semibold leading-tight md:text-2xl">
                        Teste qualquer plano mensal por{" "}
                        <span className="inline-block rounded-xl bg-background px-2.5 py-0.5 text-foreground shadow-soft">
                          {trialDays} dias grátis
                        </span>
                      </h3>
                      <p className="mt-1 max-w-xl text-xs opacity-90 md:text-sm">
                        Sem cobrança hoje. Cancele antes do fim do trial e não pague nada.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] md:flex-col md:text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
                      <Shield className="h-3.5 w-3.5" /> Sem fidelidade
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
                      <XCircle className="h-3.5 w-3.5" /> Cancele em 1 clique
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
                      <Check className="h-3.5 w-3.5" /> Acesso total
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Toggle */}
            <div className="flex flex-col items-center gap-2">
              <div className="inline-flex items-center rounded-full border border-border bg-background p-1 shadow-soft">
                <button
                  type="button"
                  onClick={() => setCycle("monthly")}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                    cycle === "monthly"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setCycle("yearly")}
                  className={`relative rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                    cycle === "yearly"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Anual
                  <span className="ml-2 inline-flex items-center rounded-full bg-primary-deep px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                    -17%
                  </span>
                </button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                No anual você paga o equivalente a <strong>10 meses</strong> — 2 meses grátis.
              </p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {plans.map((p) => {
                const Icon = p.icon;
                const isFree = p.slug === "gratis";
                const yearlyAvailable = !isFree && !!p.priceCentsYearly;
                const isYearly = cycle === "yearly" && yearlyAvailable;
                const showTrial = !isFree && cycle === "monthly";
                const displayPrice = isYearly
                  ? formatBRL(p.priceCentsYearly!)
                  : formatBRL(p.priceCents);
                const displayPeriod = isYearly ? "/ano" : p.period;
                const ctaHref = isFree
                  ? "/painel-lojista/loja"
                  : `/painel-lojista/assinatura?cycle=${isYearly ? "yearly" : "monthly"}`;
                const ctaLabel = isFree
                  ? "Começar grátis"
                  : isYearly
                  ? "Assinar plano anual"
                  : `Começar ${trialDays} dias grátis`;
                return (
                  <div
                    key={p.name}
                    className={`relative flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:shadow-card ${
                      p.highlight ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    {showTrial ? (
                      <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground shadow-md">
                        <Gift className="h-3 w-3" /> {trialDays} DIAS GRÁTIS
                      </span>
                    ) : isYearly ? (
                      <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary-deep px-3 py-1 text-[11px] font-bold text-primary-foreground shadow-md">
                        <Sparkles className="h-3 w-3" /> 2 MESES GRÁTIS
                      </span>
                    ) : (
                      isFree && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-deep px-3 py-1 text-[11px] font-bold text-primary-foreground">
                          Comece sem pagar
                        </span>
                      )
                    )}
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{p.name}</h3>
                    {showTrial ? (
                      <div className="mt-3">
                        <div className="text-3xl font-bold text-foreground">
                          R$ 0
                          <span className="text-sm font-normal text-muted-foreground">
                            {" "}
                            /{trialDays} dias
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Depois, {formatBRL(p.priceCents)}
                          {p.period}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <span className="text-3xl font-bold text-foreground">{displayPrice}</span>
                        <span className="text-sm text-muted-foreground"> {displayPeriod}</span>
                        {isYearly && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            <s className="opacity-60">{formatBRL(p.priceCents * 12)}/ano</s> ·
                            Economize {formatBRL(p.priceCents * 2)}
                          </p>
                        )}
                      </div>
                    )}
                    <ul className="mt-5 space-y-2.5 text-sm">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="mt-6 w-full rounded-full">
                      <a href={ctaHref}>{ctaLabel}</a>
                    </Button>
                    {!isFree && (
                      <p className="mt-2 text-center text-[11px] text-muted-foreground">
                        {isYearly
                          ? "Cobrança única anual · Cancele quando quiser"
                          : "Sem cobrança hoje · Cancele quando quiser"}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Formulário */}
        <section id="contato" className="container py-10 md:py-14">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div>
              <SectionHeading
                eyebrow={<>Contato</>}
                title="Fale com um consultor"
                description="Preencha seus dados e continue no WhatsApp para enviar a mensagem ao nosso consultor."
              />
              <ul className="space-y-2.5 text-sm text-foreground">
                {[
                  "Sem fidelidade — cancele quando quiser",
                  "Consultoria gratuita de divulgação",
                  "Atendimento humano via WhatsApp",
                ].map((b) => (
                  <li key={b} className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-muted-foreground">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <form
              onSubmit={onSubmit}
              className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft md:p-7"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input id="name" name="name" required className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="company">Empresa *</Label>
                  <Input id="company" name="company" required className="mt-2" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input id="email" name="email" type="email" required className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone / WhatsApp *</Label>
                  <Input id="phone" name="phone" required className="mt-2" />
                </div>
              </div>
              <div>
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  name="message"
                  rows={5}
                  className="mt-2"
                  placeholder="Conte um pouco sobre o seu negócio..."
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full rounded-full"
              >
                <Send className="h-4 w-4" />
                Continuar no WhatsApp
              </Button>
              <p className="text-sm text-muted-foreground">
                A mensagem só será enviada quando você confirmar o envio no WhatsApp.
              </p>
            </form>
          </div>
        </section>

        {/* FAQ */}
        <section className="container py-10 md:py-14">
          <div className="rounded-3xl bg-secondary/60 p-6 md:p-10">
            <SectionHeading
              align="center"
              eyebrow={<>FAQ</>}
              title="Perguntas frequentes"
              description="Dúvidas comuns dos lojistas."
            />
            <Accordion type="single" collapsible className="mx-auto max-w-3xl">
              {faq.map((f, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="mb-3 rounded-xl border border-border bg-card px-5 shadow-soft"
                >
                  <AccordionTrigger className="text-left text-sm font-semibold text-foreground">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>
      <HomeFooter />
    </div>
  );
};

export default Anuncie;
