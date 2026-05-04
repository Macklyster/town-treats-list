export type Offer = {
  id: string;
  title: string;
  storeId: string;
  category: string;
  type: "desconto" | "cupom" | "brinde";
  image: string;
  originalPrice: number;
  promoPrice: number;
  description: string;
  conditions: string;
  validUntil: string;
  featured?: boolean;
  popularity: number;
  createdAt: string;
};

const img = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const offers: Offer[] = [
  {
    id: "pizza-grande-50",
    title: "Pizza Grande com 50% de desconto",
    storeId: "pizzaria-delicia",
    category: "alimentacao",
    type: "desconto",
    image: img("photo-1565299624946-b28f40a0ae38"),
    originalPrice: 60,
    promoPrice: 30,
    description:
      "Pizza grande de qualquer sabor da casa por apenas R$ 30. Massa fresca, ingredientes selecionados e aquele sabor que você ama.",
    conditions: "Válido para retirada ou delivery na área central. Limite de 2 pizzas por pedido.",
    validUntil: "31/05/2026",
    featured: true,
    popularity: 98,
    createdAt: "2026-05-01",
  },
  {
    id: "combo-burger-duplo",
    title: "Combo Burger Duplo + Batata + Refri",
    storeId: "burger-house",
    category: "alimentacao",
    type: "desconto",
    image: img("photo-1568901346375-23c9450c58cd"),
    originalPrice: 49.9,
    promoPrice: 29.9,
    description: "Hambúrguer artesanal duplo com queijo derretido, batata rústica e refrigerante 350ml.",
    conditions: "Válido de segunda a quinta. Não cumulativo com outras promoções.",
    validUntil: "20/05/2026",
    featured: true,
    popularity: 92,
    createdAt: "2026-04-28",
  },
  {
    id: "cafe-da-manha-dois",
    title: "Café da manhã para 2 pessoas",
    storeId: "cafe-aurora",
    category: "alimentacao",
    type: "desconto",
    image: img("photo-1495474472287-4d71bcdd2085"),
    originalPrice: 70,
    promoPrice: 45,
    description: "Pães, frios, frutas, sucos, café e bolo do dia para duas pessoas.",
    conditions: "Mediante reserva. Válido de terça a sexta, das 7h às 10h.",
    validUntil: "30/05/2026",
    popularity: 80,
    createdAt: "2026-04-25",
  },
  {
    id: "corte-escova",
    title: "Corte + Escova com 40% off",
    storeId: "studio-bella",
    category: "beleza-saude",
    type: "desconto",
    image: img("photo-1560066984-138dadb4c035"),
    originalPrice: 120,
    promoPrice: 72,
    description: "Corte personalizado e escova modeladora com profissionais especializados.",
    conditions: "Agendamento prévio. Válido de terça a quinta.",
    validUntil: "15/06/2026",
    featured: true,
    popularity: 89,
    createdAt: "2026-04-20",
  },
  {
    id: "barba-cabelo-combo",
    title: "Combo Barba + Cabelo",
    storeId: "barbearia-norte",
    category: "beleza-saude",
    type: "cupom",
    image: img("photo-1599351431202-1e0f0137899a"),
    originalPrice: 90,
    promoPrice: 60,
    description: "Corte de cabelo + barba completa com hidratação. Atendimento rápido e estilo na medida.",
    conditions: "Apresente o cupom no caixa. Válido todos os dias.",
    validUntil: "10/06/2026",
    popularity: 75,
    createdAt: "2026-04-18",
  },
  {
    id: "massagem-relaxante",
    title: "Massagem Relaxante 60min",
    storeId: "spa-zen",
    category: "beleza-saude",
    type: "desconto",
    image: img("photo-1544161515-4ab6ce6db874"),
    originalPrice: 180,
    promoPrice: 110,
    description: "Sessão de 60 minutos com aromaterapia e óleos essenciais para alívio de tensão.",
    conditions: "Agendamento obrigatório. Sujeito à disponibilidade.",
    validUntil: "30/06/2026",
    featured: true,
    popularity: 85,
    createdAt: "2026-04-22",
  },
  {
    id: "vestido-verao",
    title: "Vestidos de verão a partir de R$ 79",
    storeId: "moda-livre",
    category: "lojas-moda",
    type: "desconto",
    image: img("photo-1490481651871-ab68de25d43d"),
    originalPrice: 159,
    promoPrice: 79,
    description: "Coleção verão com tecidos leves e estampas exclusivas. Diversos modelos e tamanhos.",
    conditions: "Enquanto durarem os estoques. Trocas em até 7 dias.",
    validUntil: "25/05/2026",
    popularity: 70,
    createdAt: "2026-04-15",
  },
  {
    id: "tenis-running",
    title: "Tênis de corrida com 30% off",
    storeId: "tenis-store",
    category: "lojas-moda",
    type: "desconto",
    image: img("photo-1542291026-7eec264c27ff"),
    originalPrice: 499,
    promoPrice: 349,
    description: "Tênis de corrida das principais marcas com até 30% de desconto. Numeração 35 ao 44.",
    conditions: "Pagamento à vista no PIX. Estoque limitado.",
    validUntil: "31/05/2026",
    popularity: 88,
    createdAt: "2026-05-02",
  },
  {
    id: "rodizio-pizza",
    title: "Rodízio de Pizza por R$ 39,90",
    storeId: "pizzaria-delicia",
    category: "alimentacao",
    type: "desconto",
    image: img("photo-1513104890138-7c749659a591"),
    originalPrice: 59.9,
    promoPrice: 39.9,
    description: "Rodízio com mais de 20 sabores doces e salgados. À vontade!",
    conditions: "Quintas e sextas, das 19h às 22h. Bebidas à parte.",
    validUntil: "30/06/2026",
    popularity: 78,
    createdAt: "2026-04-10",
  },
  {
    id: "manicure-pedicure",
    title: "Manicure + Pedicure por R$ 49",
    storeId: "studio-bella",
    category: "beleza-saude",
    type: "cupom",
    image: img("photo-1604654894610-df63bc536371"),
    originalPrice: 80,
    promoPrice: 49,
    description: "Pacote completo de manicure e pedicure com esmaltes premium.",
    conditions: "Agendamento prévio. Apresente o cupom.",
    validUntil: "20/06/2026",
    popularity: 73,
    createdAt: "2026-04-12",
  },
  {
    id: "camiseta-brinde",
    title: "Compre 2 camisetas e ganhe 1",
    storeId: "moda-livre",
    category: "lojas-moda",
    type: "brinde",
    image: img("photo-1521572163474-6864f9cf17ab"),
    originalPrice: 120,
    promoPrice: 120,
    description: "Na compra de duas camisetas básicas, ganhe a terceira de mesmo valor ou inferior.",
    conditions: "Válido apenas na loja física. Não cumulativo.",
    validUntil: "31/05/2026",
    popularity: 65,
    createdAt: "2026-04-08",
  },
  {
    id: "day-spa",
    title: "Day Spa Casal por R$ 290",
    storeId: "spa-zen",
    category: "beleza-saude",
    type: "desconto",
    image: img("photo-1540555700478-4be289fbecef"),
    originalPrice: 480,
    promoPrice: 290,
    description: "Pacote para casal com massagem, sauna, hidromassagem e lanche especial.",
    conditions: "Mediante agendamento. Duração 3h.",
    validUntil: "15/07/2026",
    popularity: 82,
    createdAt: "2026-04-30",
  },
];

export const getOfferById = (id: string) => offers.find((o) => o.id === id);
export const getOffersByStore = (storeId: string, exceptId?: string) =>
  offers.filter((o) => o.storeId === storeId && o.id !== exceptId);
export const getOffersByCategory = (cat: string, exceptId?: string) =>
  offers.filter((o) => o.category === cat && o.id !== exceptId);

export const discountPct = (o: Offer) =>
  o.originalPrice > 0 && o.promoPrice < o.originalPrice
    ? Math.round((1 - o.promoPrice / o.originalPrice) * 100)
    : 0;

export const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
