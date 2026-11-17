import { Link } from "@/lib/router-compat";
import { ShoppingBag, Sparkles, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { categories } from "@/data/categories";

const iconMap: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Sparkles,
  ShoppingBag,
};

export const CategoryGrid = () => {
  return (
    <section id="categorias" data-scroll-anchor className="container py-20">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h2 className="text-display text-foreground md:text-[40px]">Categorias populares</h2>
          <p className="mt-2 text-muted-foreground">Explore as ofertas por tema.</p>
        </div>
        <Link to="/#ofertas" className="hidden text-sm font-semibold text-accent-strong hover:underline md:inline">
          Ver todas as ofertas →
        </Link>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {categories.map((c) => {
          const Icon = iconMap[c.icon] ?? ShoppingBag;
          return (
            <Link
              key={c.id}
              to={`/?categoria=${c.slug}#ofertas`}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-card transition-all hover:-translate-y-1 hover:border-accent hover:shadow-pop"
            >
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-accent/15 text-accent-strong transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-medium text-foreground">{c.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
              <span className="mt-6 inline-block text-sm font-semibold text-accent-strong">
                Explorar ofertas →
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
