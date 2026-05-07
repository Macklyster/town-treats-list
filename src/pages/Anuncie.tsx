import { useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
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
import { Check, ClipboardList, Send, Sparkles, Star, Zap } from "lucide-react";
import { toast } from "sonner";

const plans = [
  {
    name: "Básico",
    price: "R$ 79",
    period: "/mês",
    icon: ClipboardList,
    highlight: false,
    features: [
      "Até 3 ofertas ativas",
      "Página da loja personalizada",
      "Aparece nas buscas e categorias",
      "Suporte por e-mail",
    ],
  },
  {
    name: "Destaque",
    price: "R$ 149",
    period: "/mês",
    icon: Star,
    highlight: true,
    features: [
      "Até 10 ofertas ativas",
      "Selo de loja destaque",
      "Prioridade nas buscas",
      "Inclusão no carrossel da home (1x/mês)",
      "Suporte por WhatsApp",
    ],
  },
  {
    name: "Plus",
    price: "R$ 249",
    period: "/mês",
    icon: Zap,
    highlight: false,
    features: [
      "Ofertas ilimitadas",
      "Banner rotativo na home",
      "Posts nas redes da Helpfy",
      "Relatórios mensais de desempenho",
      "Consultor dedicado",
    ],
  },
];

const faq = [
  {
    q: "Como cadastro minha empresa?",
    a: "É só preencher o formulário ao lado e nossa equipe entra em contato em até 1 dia útil para entender seu negócio e ativar seu plano.",
  },
  {
    q: "Posso trocar de plano depois?",
    a: "Sim! Você pode fazer upgrade ou downgrade a qualquer momento, sem multa.",
  },
  {
    q: "Quem cria as artes e os textos das ofertas?",
    a: "Você envia as informações e fotos do produto/serviço. Nosso time formata e publica para garantir a melhor apresentação.",
  },
  {
    q: "Existe fidelidade?",
    a: "Não. Os planos são mensais e você pode cancelar quando quiser.",
  },
  {
    q: "Como meus clientes encontram minha oferta?",
    a: "Sua oferta aparece nas buscas, na categoria correspondente e pode ser destacada na home, dependendo do plano.",
  },
];

const Anuncie = () => {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      (e.target as HTMLFormElement).reset();
      toast.success("Recebemos seu contato!", {
        description: "Em breve um consultor da Helpfy vai falar com você.",
      });
    }, 700);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        <section className="gradient-hero text-primary-foreground">
          <div className="container py-20 md:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-block rounded-full bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider">
                Para Lojistas
              </span>
              <h1 className="mt-6 text-hero font-medium leading-[1.05] md:text-[48px]">
                Anuncie sua empresa e <span className="text-accent text-[#10100f]">aumente suas vendas</span>
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
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {plans.map((p) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.name}
                    className={`relative flex flex-col rounded-2xl bg-card p-8 shadow-card ${
                      p.highlight ? "ring-2 ring-accent shadow-pop" : ""
                    }`}
                  >
                    {p.highlight && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
                        Mais popular
                      </span>
                    )}
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent-strong">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-medium text-foreground">{p.name}</h3>
                    <div className="mt-3">
                      <span className="text-4xl font-bold text-foreground">{p.price}</span>
                      <span className="text-muted-foreground">{p.period}</span>
                    </div>
                    <ul className="mt-6 space-y-3 text-sm">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 text-accent-strong" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      variant={p.highlight ? "accent" : "outline"}
                      className="mt-8 w-full"
                    >
                      <a href="/painel-lojista/assinatura">Quero esse plano</a>
                    </Button>
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
                  <Input id="name" required className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="company">Empresa *</Label>
                  <Input id="company" required className="mt-2" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input id="email" type="email" required className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone / WhatsApp *</Label>
                  <Input id="phone" required className="mt-2" />
                </div>
              </div>
              <div>
                <Label htmlFor="message">Mensagem</Label>
                <Textarea id="message" rows={5} className="mt-2" placeholder="Conte um pouco sobre o seu negócio..." />
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
