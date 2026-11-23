import { icons, Tag, type LucideProps } from "lucide-react";
import { categories } from "@/data/categories";

const SLUG_ICONS: Record<string, string> = {
  alimentacao: "UtensilsCrossed",
  supermercados: "ShoppingBasket",
  "moda-acessorios": "Shirt",
  "lojas-moda": "ShoppingBag",
  "beleza-estetica": "Sparkles",
  "beleza-saude": "Sparkles",
  "saude-clinicas": "HeartPulse",
  "casa-construcao": "House",
  automotivo: "Car",
  tecnologia: "Smartphone",
  pets: "PawPrint",
  servicos: "Wrench",
  educacao: "GraduationCap",
  "lazer-eventos": "Ticket",
};

type Props = LucideProps & { slug?: string | null; icon?: string | null };

export const CategoryIcon = ({ slug, icon, ...rest }: Props) => {
  const name = icon || (slug ? SLUG_ICONS[slug] ?? categories.find((c) => c.slug === slug)?.icon : undefined);
  const Icon = (name && icons[name as keyof typeof icons]) || Tag;
  return <Icon aria-hidden {...rest} />;
};
