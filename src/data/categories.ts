export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string; // lucide icon name
  description: string;
};

export const categories: Category[] = [
  {
    id: "alimentacao",
    name: "Alimentação",
    slug: "alimentacao",
    icon: "UtensilsCrossed",
    description: "Restaurantes, lanchonetes e delivery",
  },
  {
    id: "beleza-saude",
    name: "Beleza & Saúde",
    slug: "beleza-saude",
    icon: "Sparkles",
    description: "Salões, estética, bem-estar e clínicas",
  },
  {
    id: "lojas-moda",
    name: "Lojas & Moda",
    slug: "lojas-moda",
    icon: "ShoppingBag",
    description: "Roupas, acessórios e presentes",
  },
];
