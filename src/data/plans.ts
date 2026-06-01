import { ClipboardList, Gift, Star, Zap, type LucideIcon } from "lucide-react";

export type PlanCatalogItem = {
  slug: "gratis" | "basico" | "destaque" | "plus";
  name: string;
  priceCents: number;
  /** Preço anual (cobrado uma vez por ano). Quando definido, equivale a 10× o mensal — 2 meses grátis. */
  priceCentsYearly?: number;
  period: string;
  icon: LucideIcon;
  highlight: boolean;
  features: string[];
};

/**
 * Catálogo único de planos.
 * Esta é a ÚNICA fonte de verdade para nome, preço e benefícios exibidos
 * em /anuncie e /painel-lojista/assinatura.
 *
 * A página de Assinatura ainda lê o `id` (e demais campos técnicos como
 * `stripe_price_id`) do banco para iniciar o checkout, mas o preço e a
 * lista de benefícios sempre vêm daqui — basta editar este arquivo.
 */
export const PLAN_CATALOG: PlanCatalogItem[] = [
  {
    slug: "gratis",
    name: "Grátis",
    priceCents: 0,
    period: "para sempre",
    icon: Gift,
    highlight: false,
    features: [
      "1 oferta por mês",
      "Página da loja personalizada",
      "Aparece em buscas e categorias",
      "Sem cartão de crédito",
    ],
  },
  {
    slug: "basico",
    name: "Starter",
    priceCents: 4900,
    priceCentsYearly: 49000,
    period: "/mês",
    icon: ClipboardList,
    highlight: false,
    features: [
      "Até 3 ofertas ativas",
      "Página da loja personalizada",
      "Aparece nas buscas e categorias",
      "Agendamento de ofertas",
      "Suporte por e-mail",
    ],
  },
  {
    slug: "destaque",
    name: "Destaque",
    priceCents: 12900,
    priceCentsYearly: 129000,
    period: "/mês",
    icon: Star,
    highlight: true,
    features: [
      "Até 10 ofertas ativas",
      "Selo de Loja Destaque",
      "Prioridade nas buscas",
      "Inclusão no carrossel da home (1x/mês)",
      "Agendamento de ofertas",
      "Ofertas relâmpago com contagem regressiva",
      "Prova social em tempo real nos seus anúncios",
      "Dashboard de Inteligência (KPIs, heatmap e top ofertas)",
      "Suporte por WhatsApp",
    ],
  },
  {
    slug: "plus",
    name: "Plus",
    priceCents: 24900,
    period: "/mês",
    icon: Zap,
    highlight: false,
    features: [
      "Ofertas ilimitadas",
      "Selo de Loja Destaque",
      "Banner rotativo na home",
      "Agendamento de ofertas",
      "Ofertas relâmpago com contagem regressiva",
      "Prova social em tempo real nos seus anúncios",
      "OfertasFly Coletiva — compra coletiva viral no WhatsApp",
      "Leilão de Oferta — preço cai com o tempo (leilão reverso)",
      "Oferta Invisível — geofencing que aparece só quando o cliente chega perto",
      "Posts nas redes da OfertasFly",
      "Dashboard de Inteligência (KPIs, heatmap e top ofertas)",
      "Comparativo com concorrentes da categoria e cidade",
      "Relatórios mensais de desempenho",
      "Consultor dedicado",
    ],
  },
];

export const getPlanBySlug = (slug?: string | null) =>
  PLAN_CATALOG.find((p) => p.slug === slug);
