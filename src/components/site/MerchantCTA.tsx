import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Megaphone } from "lucide-react";

export const MerchantCTA = () => {
  return (
    <section className="container py-20">
      <div className="relative overflow-hidden rounded-3xl gradient-hero p-10 text-primary-foreground md:p-16">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/30 blur-3xl" aria-hidden />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" aria-hidden />
        <div className="relative grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-block rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              Para Lojistas
            </span>
            <h2 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">
              Cansado de ver seus concorrentes vendendo mais?
            </h2>
            <p className="mt-4 text-lg opacity-85">
              Anuncie na OfertasFly e leve sua empresa para milhares de clientes na cidade,
              com marketing simples e alto retorno.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="accent" size="lg">
                <Link to="/anuncie">Anuncie Conosco</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                <Link to="/anuncie#planos">Ver planos</Link>
              </Button>
            </div>
          </div>
          <ul className="grid gap-4 sm:grid-cols-3 md:grid-cols-1">
            {[
              { icon: TrendingUp, t: "Mais vendas", d: "Atraia novos clientes prontos para comprar." },
              { icon: Users, t: "Visibilidade local", d: "Apareça pra quem mora e consome na sua região." },
              { icon: Megaphone, t: "Marketing simples", d: "A gente cuida da divulgação. Você cuida do balcão." },
            ].map((b) => {
              const Icon = b.icon;
              return (
                <li key={b.t} className="flex items-start gap-4 rounded-xl bg-primary-foreground/5 p-4 backdrop-blur">
                  <div className="rounded-lg bg-accent/20 p-2 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{b.t}</div>
                    <div className="text-sm opacity-80">{b.d}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
};
