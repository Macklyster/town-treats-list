import { Link } from "@/lib/router-compat";
import { ChevronDown } from "lucide-react";
import { categories } from "@/data/categories";

const EXTRA = [
  { name: "Pizzarias", slug: "alimentacao" },
  { name: "Barbearias", slug: "beleza-saude" },
  { name: "Lava Jato", slug: "lojas-moda" },
  { name: "Clínicas", slug: "beleza-saude" },
  { name: "Lojas", slug: "lojas-moda" },
];

export const CategoryChips = () => {
  const items = EXTRA.length ? EXTRA : categories.map((c) => ({ name: c.name, slug: c.slug }));
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((c) => (
        <Link
          key={c.name}
          to={`/?categoria=${c.slug}#ofertas`}
          className="shrink-0 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-foreground/80 hover:border-primary hover:text-primary transition-colors"
        >
          {c.name}
        </Link>
      ))}
      <Link
        to="/#ofertas"
        className="shrink-0 inline-flex items-center gap-1 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-foreground/80 hover:border-primary hover:text-primary transition-colors"
      >
        Mais <ChevronDown className="h-3 w-3" />
      </Link>
    </div>
  );
};
