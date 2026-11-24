import { CategoryIcon } from "@/components/site/CategoryIcon";
import { Link } from "@/lib/router-compat";
import { ChevronDown } from "lucide-react";
import { categories } from "@/data/categories";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-foreground/80 hover:border-primary hover:text-highlight transition-colors"
        >
          <CategoryIcon slug={c.slug} className="h-3.5 w-3.5" />
          {c.name}
        </Link>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="shrink-0 inline-flex items-center gap-1 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-foreground/80 hover:border-primary hover:text-highlight transition-colors"
          >
            Mais <ChevronDown className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          {categories.map((c) => (
            <DropdownMenuItem key={c.id} asChild>
              <Link to={`/?categoria=${c.slug}#ofertas`} className="flex items-center gap-2">
                <CategoryIcon slug={c.slug} className="h-4 w-4" />
                {c.name}
              </Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem asChild>
            <Link to="/#ofertas" className="flex items-center gap-2 font-medium">
              Todas as ofertas
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
