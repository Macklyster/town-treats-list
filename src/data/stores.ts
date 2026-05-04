export type Store = {
  id: string;
  name: string;
  category: string;
  address: string;
  neighborhood: string;
  phone: string;
  whatsapp: string;
  hours: string;
  instagram?: string;
};

export const stores: Record<string, Store> = {
  "pizzaria-delicia": {
    id: "pizzaria-delicia",
    name: "Pizzaria Delícia",
    category: "alimentacao",
    address: "Rua das Flores, 123 — Centro",
    neighborhood: "Centro",
    phone: "(00) 0000-0000",
    whatsapp: "5500000000000",
    hours: "Ter–Dom, 18h às 23h",
    instagram: "@pizzariadelicia",
  },
  "burger-house": {
    id: "burger-house",
    name: "Burger House",
    category: "alimentacao",
    address: "Av. Brasil, 456 — Jardim",
    neighborhood: "Jardim",
    phone: "(00) 0000-0000",
    whatsapp: "5500000000000",
    hours: "Todos os dias, 18h às 00h",
    instagram: "@burgerhouse",
  },
  "cafe-aurora": {
    id: "cafe-aurora",
    name: "Café Aurora",
    category: "alimentacao",
    address: "Rua Bela Vista, 78 — Centro",
    neighborhood: "Centro",
    phone: "(00) 0000-0000",
    whatsapp: "5500000000000",
    hours: "Seg–Sáb, 7h às 19h",
  },
  "studio-bella": {
    id: "studio-bella",
    name: "Studio Bella",
    category: "beleza-saude",
    address: "Rua das Acácias, 22 — Vila Nova",
    neighborhood: "Vila Nova",
    phone: "(00) 0000-0000",
    whatsapp: "5500000000000",
    hours: "Ter–Sáb, 9h às 19h",
    instagram: "@studiobella",
  },
  "barbearia-norte": {
    id: "barbearia-norte",
    name: "Barbearia Norte",
    category: "beleza-saude",
    address: "Av. Norte, 1010 — Boa Vista",
    neighborhood: "Boa Vista",
    phone: "(00) 0000-0000",
    whatsapp: "5500000000000",
    hours: "Seg–Sáb, 9h às 20h",
  },
  "spa-zen": {
    id: "spa-zen",
    name: "Spa Zen",
    category: "beleza-saude",
    address: "Rua das Palmeiras, 88 — Jardim",
    neighborhood: "Jardim",
    phone: "(00) 0000-0000",
    whatsapp: "5500000000000",
    hours: "Ter–Dom, 10h às 21h",
  },
  "moda-livre": {
    id: "moda-livre",
    name: "Moda Livre",
    category: "lojas-moda",
    address: "Galeria Central, Loja 14 — Centro",
    neighborhood: "Centro",
    phone: "(00) 0000-0000",
    whatsapp: "5500000000000",
    hours: "Seg–Sáb, 10h às 19h",
    instagram: "@modalivre",
  },
  "tenis-store": {
    id: "tenis-store",
    name: "Tênis Store",
    category: "lojas-moda",
    address: "Shopping da Cidade — Piso 1",
    neighborhood: "Centro",
    phone: "(00) 0000-0000",
    whatsapp: "5500000000000",
    hours: "Todos os dias, 10h às 22h",
  },
};
