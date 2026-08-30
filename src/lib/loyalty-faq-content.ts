/**
 * Conteúdo estático da FAQ pública do FlyPontos (visão do consumidor).
 * Cada seção tem um `id` usado para link direto (ex.: /fidelidade/como-funciona#recompensas).
 */

export type LoyaltyFaqTopic = {
  q: string;
  a: string[];
  keywords?: string[];
};

export type LoyaltyFaqSection = {
  id: string;
  title: string;
  description: string;
  topics: LoyaltyFaqTopic[];
};

export const LOYALTY_FAQ_SECTIONS: LoyaltyFaqSection[] = [
  {
    id: "o-que-e",
    title: "O que é o FlyPontos",
    description: "Entenda o programa de fidelidade das lojas parceiras da OfertasFly.",
    topics: [
      {
        q: "O que é o FlyPontos?",
        a: [
          "FlyPontos é o programa de fidelidade do OfertasFly. Cada loja parceira pode criar seu próprio programa de pontos, com regras, níveis, recompensas e missões próprias.",
          "Você acumula pontos em cada loja que participa e troca por cupons, brindes, cashback e benefícios exclusivos.",
        ],
        keywords: ["flypontos", "programa", "fidelidade", "pontos"],
      },
      {
        q: "O programa é igual para todas as lojas?",
        a: [
          "Não. Cada loja configura seu programa da forma que preferir: quantos pontos você ganha por ação, quais recompensas estão disponíveis, os níveis e a validade dos pontos.",
          "Por isso, sempre confira as regras na página de fidelidade da loja antes de participar.",
        ],
        keywords: ["loja", "regras", "configurar", "diferente"],
      },
      {
        q: "Preciso pagar para participar?",
        a: [
          "Não. A participação é gratuita para o consumidor. Basta ter uma conta no OfertasFly e clicar em 'Participar grátis' na página da loja.",
        ],
        keywords: ["grátis", "pagar", "custo", "participar"],
      },
    ],
  },
  {
    id: "como-participar",
    title: "Como participar",
    description: "Passos para começar a acumular pontos nas lojas parceiras.",
    topics: [
      {
        q: "Como entro no programa de uma loja?",
        a: [
          "Acesse a página da loja no OfertasFly, vá até a aba 'Fidelidade' e clique em 'Participar grátis'. Pronto, você já começa a acumular pontos naquela loja.",
        ],
        keywords: ["participar", "entrar", "cadastrar", "loja"],
      },
      {
        q: "Posso participar de várias lojas ao mesmo tempo?",
        a: [
          "Sim. Cada loja tem sua própria carteira de pontos. Suas pontuações não se misturam: você acumula pontos separadamente em cada uma.",
        ],
        keywords: ["várias lojas", "carteiras", "separado"],
      },
      {
        q: "E se a loja ainda não tem FlyPontos?",
        a: [
          "Se a loja ainda não ativou o programa, a aba de fidelidade ficará indisponível. Você pode salvar a loja nos favoritos e voltar depois, ou conversar com o lojista e sugerir que ative.",
        ],
        keywords: ["não tem", "indisponível", "ativar"],
      },
    ],
  },
  {
    id: "ganhar-pontos",
    title: "Como ganhar pontos",
    description: "Todas as formas de acumular pontos nas lojas parceiras.",
    topics: [
      {
        q: "Quais ações geram pontos?",
        a: [
          "Depende da configuração da loja, mas as formas mais comuns são: seguir a loja, favoritar uma oferta, avaliar uma compra, avaliar com foto, compartilhar uma oferta, fazer check-in na loja, resgatar um cupom, indicar amigos e, claro, comprar.",
        ],
        keywords: ["ganhar", "ações", "pontos", "seguir", "favoritar", "avaliar"],
      },
      {
        q: "Como funcionam os pontos por compra?",
        a: [
          "Na hora de pagar, mostre seu QR de compra para o lojista. Ele escaneia e informa o valor da compra. Depois da validação, os pontos e o cashback caem na sua carteira automaticamente.",
          "Pontos de compra só são creditados quando o lojista valida. Você não pode lançar compras sozinho.",
        ],
        keywords: ["compra", "qr", "validar", "lojista", "pontos"],
      },
      {
        q: "O que é check-in e como funciona?",
        a: [
          "Check-in é uma forma de ganhar pontos ao chegar fisicamente na loja. Você precisa estar perto do endereço cadastrado e permitir o acesso à sua localização.",
          "Você pode fazer check-in uma vez por dia em cada loja.",
        ],
        keywords: ["check-in", "localização", "perto", "visita"],
      },
      {
        q: "Como funciona a indicação de amigos?",
        a: [
          "Quando a loja permite indicação, você convida amigos pelo seu link. Se a pessoa se cadastrar e participar do programa, você ganha pontos conforme a regra da loja.",
        ],
        keywords: ["indicar", "amigos", "convidar", "link"],
      },
      {
        q: "O que são missões?",
        a: [
          "Missões são desafios com prazo, como 'visite a loja 3 vezes este mês' ou 'avalie 2 compras com foto'. Ao completar, você recebe pontos extras ou selos.",
        ],
        keywords: ["missões", "desafios", "prêmios", "selos"],
      },
    ],
  },
  {
    id: "niveis",
    title: "Níveis e multiplicadores",
    description: "Entenda como evoluir dentro do programa de uma loja.",
    topics: [
      {
        q: "Para que servem os níveis (Bronze, Prata, Ouro, Diamante)?",
        a: [
          "Os níveis reconhecem clientes mais engajados. Quanto mais pontos você acumula, mais sobe de nível. Cada nível pode oferecer vantagens como multiplicador de pontos, descontos extras ou acesso antecipado a ofertas.",
        ],
        keywords: ["níveis", "bronze", "prata", "ouro", "diamante"],
      },
      {
        q: "O que é multiplicador de pontos?",
        a: [
          "É um bônus que aumenta a quantidade de pontos que você ganha. Por exemplo, com multiplicador 1,5x, uma compra que daria 100 pontos passa a dar 150 pontos.",
        ],
        keywords: ["multiplicador", "bônus", "pontos extras"],
      },
      {
        q: "Os níveis são iguais em todas as lojas?",
        a: [
          "Não. Cada loja define seus próprios níveis, quantos pontos são necessários para subir e quais benefícios cada um oferece.",
        ],
        keywords: ["níveis", "diferentes", "configuração"],
      },
    ],
  },
  {
    id: "recompensas",
    title: "Recompensas e resgates",
    description: "Como trocar pontos por benefícios dentro de cada loja.",
    topics: [
      {
        q: "O que posso resgatar com meus pontos?",
        a: [
          "Cada loja define suas próprias recompensas: cupons de desconto, crédito para usar na loja, brindes, produtos ou benefícios de nível.",
        ],
        keywords: ["resgatar", "recompensas", "cupom", "brinde", "crédito"],
      },
      {
        q: "Como faço um resgate?",
        a: [
          "Na página de fidelidade da loja, escolha uma recompensa e clique em 'Resgatar'. Se você tiver pontos suficientes e atender ao nível exigido, o resgate é confirmado na hora.",
        ],
        keywords: ["resgatar", "como", "pontos", "nível"],
      },
      {
        q: "Como uso a recompensa resgatada na loja?",
        a: [
          "Após o resgate, você recebe um código. Mostre esse código para o lojista na hora de retirar o benefício. Ele valida e marca como entregue.",
        ],
        keywords: ["código", "retirar", "entregar", "usar"],
      },
      {
        q: "Posso cancelar um resgate?",
        a: [
          "Resgates pendentes podem ser cancelados, devolvendo os pontos. Depois que o lojista marcar como entregue, não é mais possível desfazer.",
        ],
        keywords: ["cancelar", "devolver", "pontos", "pendente"],
      },
    ],
  },
  {
    id: "cashback",
    title: "Cashback",
    description: "Como funciona o crédito de volta em compras.",
    topics: [
      {
        q: "O que é cashback no FlyPontos?",
        a: [
          "Cashback é um percentual da sua compra que volta em crédito para usar na mesma loja. Se a loja configurou 5% de cashback, em uma compra de R$ 100,00 você recebe R$ 5,00 em crédito.",
        ],
        keywords: ["cashback", "crédito", "percentual", "compra"],
      },
      {
        q: "Onde vejo meu crédito?",
        a: [
          "Seu crédito aparece na carteira da loja, dentro da página de fidelidade. Você pode usá-lo em compras futuras na mesma loja, conforme as regras definidas por ela.",
        ],
        keywords: ["crédito", "carteira", "saldo"],
      },
      {
        q: "O cashback expira?",
        a: [
          "A validade do crédito depende das regras da loja. Acompanhe a data de vencimento na sua carteira para não perder.",
        ],
        keywords: ["expirar", "validade", "crédito"],
      },
    ],
  },
  {
    id: "validade",
    title: "Validade e expiração",
    description: "Regras sobre quanto tempo seus pontos ficam disponíveis.",
    topics: [
      {
        q: "Os pontos têm validade?",
        a: [
          "Sim, na maioria dos programas. A loja define por quantos meses os pontos ficam válidos. Se você não usar, eles expiram.",
        ],
        keywords: ["validade", "expirar", "vencer", "meses"],
      },
      {
        q: "Como sei que meus pontos estão perto de vencer?",
        a: [
          "Na sua carteira FlyPontos aparece quantos pontos estão para expirar nos próximos 30 dias. Fique de olho para resgatar antes de perder.",
        ],
        keywords: ["vencer", "avisos", "30 dias", "expirar"],
      },
      {
        q: "Se eu cancelar minha conta, perco os pontos?",
        a: [
          "Sim. Ao excluir sua conta, seus pontos, créditos e resgates são perdidos. Se quiser apenas sair de uma loja, cancele a participação no programa dela.",
        ],
        keywords: ["conta", "excluir", "perder", "pontos"],
      },
    ],
  },
  {
    id: "ranking",
    title: "Ranking da cidade",
    description: "Como funciona o ranking mensal de consumidores.",
    topics: [
      {
        q: "O que é o ranking do FlyPontos?",
        a: [
          "É uma competição mensal entre consumidores da sua cidade. Quem acumula mais pontos nas lojas participantes sobe no ranking e ganha destaque.",
        ],
        keywords: ["ranking", "competição", "mensal", "cidade"],
      },
      {
        q: "Como entro no ranking?",
        a: [
          "Na página de fidelidade, ative a opção 'Participar do ranking'. Você só aparece se quiser e se estiver acumulando pontos em lojas da sua cidade.",
        ],
        keywords: ["participar", "ranking", "ativar"],
      },
      {
        q: "Quem pode ver meu nome no ranking?",
        a: [
          "Apenas consumidores que optaram por participar. Seu nome e pontuação ficam visíveis no ranking público da cidade.",
        ],
        keywords: ["privacidade", "visível", "nome", "pontuação"],
      },
    ],
  },
];

export const LOYALTY_FAQ_CTA = {
  loggedIn: { text: "Ver lojas parceiras", to: "/#empresas" },
  loggedOut: { text: "Criar conta grátis", to: "/auth" },
};
