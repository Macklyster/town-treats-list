import { Search, MousePointerClick, PartyPopper } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "1. Busque",
    text: "Pesquise por categoria, loja ou palavra-chave e encontre a oferta ideal pra você.",
  },
  {
    icon: MousePointerClick,
    title: "2. Escolha",
    text: "Veja todos os detalhes, condições e validade. Clique em ‘Pegar Oferta’.",
  },
  {
    icon: PartyPopper,
    title: "3. Aproveite",
    text: "Fale direto com a loja pelo WhatsApp ou vá presencialmente garantir o desconto.",
  },
];

export const HowItWorks = () => {
  return (
    <section id="como-funciona" className="scroll-mt-28 bg-secondary md:scroll-mt-32">
      <div className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-display text-foreground md:text-[40px]">Como funciona</h2>
          <p className="mt-3 text-muted-foreground">
            Em três passos simples você economiza e descobre o melhor da sua cidade.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="rounded-2xl bg-card p-8 text-center shadow-card">
                <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full gradient-accent text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-medium text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
