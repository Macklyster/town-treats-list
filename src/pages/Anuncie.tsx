import { useState } from "react";
import { SEO } from "@/components/seo/SEO";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeFooter } from "@/components/home/HomeFooter";

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
import { Check, Send, Sparkles, Gift, Shield, XCircle } from "lucide-react";
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

const faq = [
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
    q: "Como funcionam os 14 dias grátis?",
    a: "Em qualquer plano pago, sua primeira assinatura ganha 14 dias grátis. Você informa o cartão para garantir a continuidade após o período, mas nada é cobrado nos 14 primeiros dias. Cancele antes do fim do trial e não paga nada.",
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

const CONSULTANT_WHATSAPP = "5544991630747";

const Anuncie = () => {
  const [submitting, setSubmitting] = useState(false);
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const company = String(data.get("company") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    const text =
      `Olá! Quero falar com um consultor da OfertasFly.%0A%0A` +
      `*Nome:* ${name}%0A` +
      `*Empresa:* ${company}%0A` +
      `*E-mail:* ${email}%0A` +
      `*Telefone/WhatsApp:* ${phone}` +
      (message ? `%0A%0A*Mensagem:*%0A${message}` : "");

    const url = `https://wa.me/${CONSULTANT_WHATSAPP}?text=${text.replace(/ /g, "%20")}`;
    window.open(url, "_blank", "noopener,noreferrer");

    setTimeout(() => {
      setSubmitting(false);
      form.reset();
      toast.success("Abrindo o WhatsApp...", {
        description: "Conclua o envio da mensagem para falar com um consultor.",
      });
    }, 400);
  };


  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Anuncie sua loja — Planos a partir de R$ 0 | OfertasFly"
        description="Cadastre sua loja na OfertasFly, publique ofertas e cupons para a sua cidade. Planos com 14 dias grátis, sem fidelidade. Comece a vender mais hoje."
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
        <section className="gradient-hero text-primary-foreground">
          <div className="container py-20 md:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-block rounded-full bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider">
                Para Lojistas
              </span>
              <h1 className="mt-6 text-hero font-medium leading-[1.05] md:text-[48px]">
                Anuncie sua empresa e <span className="inline-block rounded-xl bg-background px-3 py-0.5 text-[#0F0F0E] shadow-soft">aumente suas vendas</span>
              </h1>
              <p className="mt-5 text-lg opacity-85">
                Coloque sua marca diante de milhares de consumidores locais buscando exatamente o que você oferece.
                Marketing simples, resultado rápido.
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <Button asChild variant="accent" size="lg">
                  <a href="#contato">Falar com um Consultor</a>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  <a href="#planos">Ver Planos</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section className="container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-display text-foreground md:text-[40px]">Como funciona</h2>
            <p className="mt-3 text-muted-foreground">
              Em poucos passos sua oferta já está atraindo clientes.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {[
              { t: "1. Cadastre", d: "Preencha o formulário com os dados da empresa." },
              { t: "2. Conversamos", d: "Um consultor monta seu plano de divulgação." },
              { t: "3. Publicamos", d: "Sua oferta entra no ar com fotos e texto profissionais." },
              { t: "4. Vende mais", d: "Clientes te contatam direto pelo WhatsApp ou loja." },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full gradient-accent text-primary-foreground">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-medium text-foreground">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Planos */}
        <section id="planos" className="bg-secondary">
          <div className="container py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-display text-foreground md:text-[40px]">Planos para todo tipo de negócio</h2>
              <p className="mt-3 text-muted-foreground">Escolha o plano ideal e ajuste quando quiser.</p>
            </div>

            {/* Banner Trial 14 dias grátis — exclusivo do ciclo mensal */}
            {cycle === "monthly" && (
            <div className="relative mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl gradient-hero p-6 text-primary-foreground md:p-8">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/30 blur-3xl" aria-hidden />
              <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" aria-hidden />
              <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-accent/20 p-3 text-accent">
                    <Gift className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent-foreground">
                      <Sparkles className="h-3 w-3" /> Oferta de boas-vindas
                    </div>
                    <h3 className="text-2xl font-bold leading-tight md:text-3xl">
                      Teste qualquer plano mensal por <span className="inline-block rounded-xl bg-background px-3 py-0.5 text-[#0F0F0E] shadow-soft">14 dias grátis</span>.
                    </h3>
                    <p className="mt-1 max-w-xl text-sm opacity-90 md:text-base">
                      Sem cobrança hoje. Cancele a qualquer momento dentro dos 14 dias e não pague nada.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs md:flex-col md:text-sm">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1.5 backdrop-blur">
                    <Shield className="h-3.5 w-3.5 text-accent" /> Sem fidelidade
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1.5 backdrop-blur">
                    <XCircle className="h-3.5 w-3.5 text-accent" /> Cancele em 1 clique
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1.5 backdrop-blur">
                    <Check className="h-3.5 w-3.5 text-accent" /> Acesso total
                  </span>
                </div>
              </div>
            </div>
            )}

            {/* Toggle Mensal / Anual */}
            <div className="mt-10 flex justify-center">
              <div className="inline-flex items-center rounded-full border border-border bg-background p-1 shadow-soft">
                <button
                  type="button"
                  onClick={() => setCycle("monthly")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    cycle === "monthly" ? "bg-accent text-accent-foreground shadow" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setCycle("yearly")}
                  className={`relative rounded-full px-4 py-2 text-sm font-semibold transition ${
                    cycle === "yearly" ? "bg-accent text-accent-foreground shadow" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Anual
                  <span className="ml-2 inline-flex items-center rounded-full bg-accent-strong px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                    -17%
                  </span>
                </button>
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              No plano anual você paga o equivalente a <strong>10 meses</strong> — 2 meses grátis.
            </p>

            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                  : "Começar 14 dias grátis";
                return (
                  <div
                    key={p.name}
                    className={`relative flex flex-col rounded-2xl bg-card p-8 shadow-card ${
                      !isFree ? "ring-2 ring-accent shadow-pop" : p.highlight ? "ring-2 ring-accent shadow-pop" : ""
                    }`}
                  >
                    {showTrial ? (
                      <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground shadow-md">
                        <Gift className="h-3 w-3" /> 14 DIAS GRÁTIS
                      </span>
                    ) : isYearly ? (
                      <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-accent-strong px-3 py-1 text-xs font-bold text-primary-foreground shadow-md">
                        <Sparkles className="h-3 w-3" /> 2 MESES GRÁTIS NO ANUAL
                      </span>
                    ) : (
                      isFree && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent-strong px-3 py-1 text-xs font-bold text-primary-foreground">
                          Comece sem pagar
                        </span>
                      )
                    )}
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent-strong">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-medium text-foreground">{p.name}</h3>
                    {showTrial ? (
                      <div className="mt-3">
                        <div className="text-4xl font-bold text-foreground">
                          R$ 0
                          <span className="text-sm font-normal text-muted-foreground"> /14 dias</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Depois, {formatBRL(p.priceCents)}{p.period} · cancele antes e não pague nada
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <span className="text-4xl font-bold text-foreground">{displayPrice}</span>
                        <span className="text-muted-foreground"> {displayPeriod}</span>
                        {isYearly && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            <s className="opacity-60">{formatBRL(p.priceCents * 12)}/ano</s> · Economize {formatBRL(p.priceCents * 2)}
                          </p>
                        )}
                      </div>
                    )}
                    <ul className="mt-6 space-y-3 text-sm">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 text-accent-strong" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button asChild variant="accent" className="mt-8 w-full">
                      <a href={ctaHref}>{ctaLabel}</a>
                    </Button>
                    {!isFree && (
                      <p className="mt-2 text-center text-[11px] text-muted-foreground">
                        {isYearly ? "Cobrança única anual · Cancele quando quiser" : "Sem cobrança hoje · Cancele quando quiser"}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Formulário */}
        <section id="contato" className="container py-20">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <h2 className="text-display text-foreground md:text-[40px]">Fale com um consultor</h2>
              <p className="mt-3 text-muted-foreground">
                Preencha o formulário e nossa equipe entra em contato em até 1 dia útil com a melhor proposta para o seu negócio.
              </p>
              <ul className="mt-8 space-y-3 text-sm text-foreground">
                {[
                  "Sem fidelidade — cancele quando quiser",
                  "Consultoria gratuita de divulgação",
                  "Atendimento humano via WhatsApp",
                ].map((b) => (
                  <li key={b} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-accent-strong" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <form
              onSubmit={onSubmit}
              className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card md:p-8"
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
                <Textarea id="message" name="message" rows={5} className="mt-2" placeholder="Conte um pouco sobre o seu negócio..." />
              </div>
              <Button type="submit" variant="accent" size="lg" className="w-full" disabled={submitting}>
                <Send className="h-4 w-4" />
                {submitting ? "Enviando..." : "Enviar mensagem"}
              </Button>
            </form>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-secondary">
          <div className="container py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-display text-foreground md:text-[40px]">Perguntas frequentes</h2>
              <p className="mt-3 text-muted-foreground">Dúvidas comuns dos lojistas.</p>
            </div>
            <Accordion type="single" collapsible className="mx-auto mt-10 max-w-3xl">
              {faq.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="rounded-xl border border-border bg-card px-5 mb-3">
                  <AccordionTrigger className="text-left text-foreground">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Anuncie;
