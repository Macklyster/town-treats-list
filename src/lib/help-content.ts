/**
 * Conteúdo estático da Central de Ajuda do Lojista.
 * Cada seção tem um `id` usado para link direto (ex.: /painel-lojista/ajuda#fidelidade).
 */

export type HelpTopic = {
  q: string;
  a: string[];
  keywords?: string[];
};

export type HelpSection = {
  id: string;
  title: string;
  description: string;
  topics: HelpTopic[];
};

export const FIRST_STEPS: { title: string; text: string; to?: string; cta?: string }[] = [
  {
    title: "Cadastre sua loja",
    text: "Preencha nome, descrição, categoria, endereço, WhatsApp e horários de atendimento. Marque a localização exata no mapa — é ela que posiciona sua loja nas buscas por proximidade.",
    to: "/painel-lojista/loja",
    cta: "Cadastrar loja",
  },
  {
    title: "Aguarde a aprovação",
    text: "Nossa equipe revisa os dados da loja. Enquanto o status estiver pendente, sua loja e suas ofertas ainda não aparecem para o público.",
  },
  {
    title: "Escolha seu plano",
    text: "Você começa com um período de testes gratuito. Depois, escolha o plano que libera mais ofertas simultâneas, destaques e os formatos avançados (Coletiva, Leilão, Invisível).",
    to: "/painel-lojista/assinatura",
    cta: "Ver planos",
  },
  {
    title: "Crie sua primeira oferta",
    text: "Use uma foto nítida, informe o preço original e o promocional, escreva condições claras e defina a validade. Ofertas passam por aprovação antes de ir ao ar.",
  },
  {
    title: "Divulgue",
    text: "Compartilhe o link público da oferta e imprima o QR Code para colocar na vitrine, no balcão ou na embalagem. Cada leitura e cada clique no WhatsApp é medido no painel de Inteligência.",
    to: "/painel-lojista/inteligencia",
    cta: "Ver Inteligência",
  },
];

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: "loja",
    title: "Minha loja",
    description: "Dados, imagens, endereço e horários.",
    topics: [
      {
        q: "Quais dados da loja são obrigatórios?",
        a: [
          "Nome, cidade/estado, categoria principal e uma forma de contato (WhatsApp de preferência). Descrição, Instagram, endereço, logo e capa são opcionais, mas fazem diferença: lojas completas convertem mais e ganham nota melhor no FlyScore.",
        ],
        keywords: ["dados", "cadastro", "obrigatório"],
      },
      {
        q: "Como enviar logo e imagem de capa?",
        a: [
          "Na edição da loja você envia a logo (formato quadrado, fundo limpo) e a capa (imagem horizontal). A capa é usada nos destaques da página inicial, então prefira uma foto do ambiente ou dos produtos, sem texto sobreposto.",
        ],
        keywords: ["logo", "capa", "imagem"],
      },
      {
        q: "Por que preciso marcar o endereço no mapa?",
        a: [
          "O endereço escrito é só informativo. O pino no mapa define as coordenadas reais usadas nas buscas por proximidade, no mapa de ofertas e nas Ofertas Invisíveis. Arraste o marcador até a porta do seu estabelecimento.",
        ],
        keywords: ["mapa", "endereço", "localização", "gps", "coordenadas"],
      },
      {
        q: "Como configurar os horários de atendimento?",
        a: [
          "Defina abertura e fechamento para cada dia da semana e marque os dias fechados. O selo \"Aberto agora\" na sua loja é calculado automaticamente por esse horário.",
          "A linha de domingo vale também para feriados — por isso ela aparece como \"Domingo e Feriado\".",
        ],
        keywords: ["horário", "aberto agora", "feriado", "domingo", "funcionamento"],
      },
      {
        q: "Posso ter mais de uma loja na mesma conta?",
        a: [
          "Cada conta de lojista gerencia uma loja. Para uma segunda unidade, use um novo cadastro com outro e-mail — assim cada unidade tem seus próprios horários, endereço e métricas.",
        ],
        keywords: ["duas lojas", "filial", "unidade"],
      },
    ],
  },
  {
    id: "ofertas",
    title: "Ofertas",
    description: "Tipos, preços, status, destaque, renovação e agendamento.",
    topics: [
      {
        q: "Qual a diferença entre desconto, cupom e brinde?",
        a: [
          "Desconto: preço promocional aplicado direto no produto ou serviço.",
          "Cupom: o cliente resgata um código e apresenta na loja para receber o benefício.",
          "Brinde: o cliente ganha um item ou serviço adicional na compra.",
        ],
        keywords: ["tipo", "desconto", "cupom", "brinde"],
      },
      {
        q: "Como funcionam preço original e promocional?",
        a: [
          "Informe o preço praticado normalmente em \"preço original\" e o valor da promoção em \"preço promocional\". O percentual de desconto exibido no anúncio é calculado a partir dos dois. Preços originais inflados geram reprovação e prejudicam sua reputação.",
        ],
        keywords: ["preço", "desconto", "percentual"],
      },
      {
        q: "O que significa cada status da oferta?",
        a: [
          "Pendente: aguardando revisão da nossa equipe — ainda não está visível ao público.",
          "Aprovada: publicada e visível no site.",
          "Rejeitada: reprovada na moderação; corrija o motivo apontado e reenvie.",
          "Pausada: você tirou temporariamente do ar; pode reativar quando quiser.",
        ],
        keywords: ["status", "pendente", "aprovada", "rejeitada", "pausada", "moderação"],
      },
      {
        q: "Por que minha oferta foi rejeitada?",
        a: [
          "Os motivos mais comuns são: imagem de baixa qualidade ou com marca d'água de terceiros, preço original acima do praticado, condições confusas, ausência de validade e conteúdo que não é uma oferta (apenas divulgação institucional). Ajuste o ponto indicado e envie novamente.",
        ],
        keywords: ["rejeitada", "reprovada", "motivo", "moderação"],
      },
      {
        q: "Como escrever boas condições e validade?",
        a: [
          "Seja específico: quantidade limitada, dias e horários válidos, se vale para delivery, se acumula com outras promoções e formas de pagamento aceitas. A validade evita que o cliente chegue na loja com uma oferta encerrada.",
        ],
        keywords: ["condições", "regras", "validade", "vencimento"],
      },
      {
        q: "O que é uma oferta em destaque?",
        a: [
          "Ofertas em destaque aparecem em posições privilegiadas na home e nas listagens. A quantidade de destaques simultâneos depende do seu plano.",
        ],
        keywords: ["destaque", "featured", "posição"],
      },
      {
        q: "Como funciona a renovação automática?",
        a: [
          "Ao ativar, a oferta ganha novos dias de validade automaticamente ao vencer, pelo número de dias que você definir. Útil para promoções permanentes. Você acompanha quantas renovações já ocorreram no card da oferta.",
        ],
        keywords: ["renovação", "automática", "auto renew", "validade"],
      },
      {
        q: "Posso agendar uma oferta para começar depois?",
        a: [
          "Sim. No agendamento você define data e hora de início e de fim. A oferta é publicada sozinha no horário marcado (respeitando os prazos mínimos e máximos de antecedência) e encerra no fim programado.",
        ],
        keywords: ["agendar", "agendamento", "programar", "data"],
      },
      {
        q: "Como duplicar uma oferta?",
        a: [
          "No card da oferta use \"Duplicar\". Uma copia é criada como rascunho, com todos os dados e mídias — basta ajustar o que mudou e enviar para aprovação. Ideal para campanhas recorrentes.",
        ],
        keywords: ["duplicar", "copiar", "clonar"],
      },
      {
        q: "Existe limite de ofertas ativas?",
        a: [
          "Sim, o limite vem do seu plano. Ao atingir o teto, pause ou encerre uma oferta antiga, ou faça upgrade para liberar mais espaços.",
        ],
        keywords: ["limite", "quantas ofertas", "plano"],
      },
    ],
  },
  {
    id: "relampago",
    title: "Ofertas Relâmpago",
    description: "Promoções com contagem regressiva.",
    topics: [
      {
        q: "O que é uma Oferta Relâmpago?",
        a: [
          "É uma oferta com duração curta e contagem regressiva visível no anúncio. Você define a quantidade de horas e o cronômetro começa a contar na publicação. Ao zerar, a oferta encerra automaticamente.",
        ],
        keywords: ["relâmpago", "flash", "contagem", "cronômetro", "urgência"],
      },
      {
        q: "Meus seguidores são avisados?",
        a: [
          "Sim. Quem segue sua loja e aceita notificações recebe um aviso quando uma Relâmpago entra no ar. É o formato com melhor taxa de resposta — use em horários de movimento baixo para gerar fluxo.",
        ],
        keywords: ["notificação", "seguidores", "push", "aviso"],
      },
    ],
  },
  {
    id: "midias",
    title: "Mídias do anúncio",
    description: "Várias imagens, vídeo curto e biblioteca.",
    topics: [
      {
        q: "Posso colocar mais de uma imagem no anúncio?",
        a: [
          "Sim. Adicione várias imagens e escolha qual é a capa (a que aparece nas listagens). Quando há mais de uma mídia, o anúncio exibe um carrossel automático para o cliente navegar.",
        ],
        keywords: ["imagens", "carrossel", "galeria", "capa", "fotos"],
      },
      {
        q: "Como incluir um vídeo?",
        a: [
          "Envie um vídeo curto junto das imagens; ele entra no mesmo carrossel do anúncio. Prefira vídeos de poucos segundos, na vertical ou quadrado, mostrando o produto em uso — arquivos muito grandes demoram a carregar no celular do cliente.",
        ],
        keywords: ["vídeo", "video", "mp4", "reels"],
      },
      {
        q: "Como reordenar ou trocar a capa?",
        a: [
          "No editor de mídias da oferta você arrasta para reordenar e marca uma mídia como capa. A ordem definida é exatamente a ordem do carrossel público.",
        ],
        keywords: ["ordem", "reordenar", "capa"],
      },
      {
        q: "Para que serve a Biblioteca de Mídia?",
        a: [
          "Ela guarda tudo que você já enviou, com nome e etiquetas. Assim você reaproveita a mesma foto em várias ofertas sem enviar de novo.",
        ],
        keywords: ["biblioteca", "mídia", "reaproveitar", "arquivos"],
      },
    ],
  },
  {
    id: "formatos",
    title: "Coletivas, Leilões e Invisíveis",
    description: "Formatos avançados de campanha.",
    topics: [
      {
        q: "Como funciona a Oferta Coletiva?",
        a: [
          "O desconto aumenta conforme mais pessoas entram na campanha. Você define o preço original, as faixas (quantidade de participantes × preço) e a duração. Cada participante recebe um link para convidar amigos — é o formato mais viral da plataforma.",
        ],
        keywords: ["coletiva", "grupo", "viral", "faixas", "participantes"],
      },
      {
        q: "Como funciona o Leilão reverso?",
        a: [
          "O preço começa alto e cai sozinho a cada intervalo definido, até o preço mínimo. Quem reserva antes garante o preço da hora — quem espera paga menos, mas corre o risco de esgotar. Você define preço inicial, mínimo, decremento, intervalo e quantidade.",
        ],
        keywords: ["leilão", "reverso", "preço cai", "reserva"],
      },
      {
        q: "O que é uma Oferta Invisível?",
        a: [
          "É uma oferta que só aparece para quem está fisicamente perto da loja, dentro do raio e da faixa de horário que você definir. Perfeita para captar quem já está passando na rua.",
        ],
        keywords: ["invisível", "geolocalização", "raio", "proximidade"],
      },
      {
        q: "Quantas campanhas desses formatos posso ter ao mesmo tempo?",
        a: [
          "Cada formato permite um número limitado de campanhas ativas por loja, para preservar o valor da oferta. Ao encerrar a atual você libera espaço para a próxima. Alguns formatos são exclusivos de planos superiores.",
        ],
        keywords: ["limite", "ativas", "plano"],
      },
      {
        q: "Como divulgo essas campanhas?",
        a: [
          "Cada campanha tem um link público próprio (com token de compartilhamento) que você copia no painel e envia por WhatsApp, Instagram ou grupos. Elas também aparecem nas seções específicas do site.",
        ],
        keywords: ["link", "compartilhar", "divulgar", "token"],
      },
    ],
  },
  {
    id: "eventos",
    title: "Eventos",
    description: "Shows, feiras, happy hours e promoções com data.",
    topics: [
      {
        q: "O que posso publicar como evento?",
        a: [
          "Happy hour, show, feira, evento em geral e promoções com data marcada. Informe título, descrição, data e hora de início e fim, local e, se houver, valor de entrada e link de ingressos.",
        ],
        keywords: ["evento", "show", "feira", "happy hour"],
      },
      {
        q: "Por que marcar o local no mapa do evento?",
        a: [
          "O evento pode acontecer fora da sua loja. O pino do evento no mapa usa as coordenadas que você marcar, então o cliente é levado ao endereço correto.",
        ],
        keywords: ["mapa", "local", "pino", "endereço"],
      },
      {
        q: "Eventos passam por aprovação?",
        a: [
          "Sim, igual às ofertas: ficam pendentes até a revisão e, se reprovados, você recebe o motivo para corrigir. Eventos publicados também contam pontos no seu FlyScore.",
        ],
        keywords: ["aprovação", "pendente", "moderação"],
      },
    ],
  },
  {
    id: "cupons",
    title: "Cupons",
    description: "Código fixo, código único e validação.",
    topics: [
      {
        q: "Qual a diferença entre código fixo e código único?",
        a: [
          "Fixo: um mesmo código para todos os clientes — simples de operar no caixa.",
          "Único: cada cliente recebe um código exclusivo ao resgatar — permite rastrear quem usou e evita repasse do código nas redes sociais.",
        ],
        keywords: ["cupom", "código", "fixo", "único"],
      },
      {
        q: "Como limito a quantidade de usos?",
        a: [
          "Defina o total de usos do cupom e também o máximo por cliente. Quando o total é atingido, o cupom deixa de ser resgatável automaticamente.",
        ],
        keywords: ["limite", "usos", "por cliente", "estoque"],
      },
      {
        q: "Como valido um cupom apresentado na loja?",
        a: [
          "Confira o código no seu painel de cupons e marque como utilizado. Isso alimenta seus números reais de conversão e impede o uso do mesmo código duas vezes.",
        ],
        keywords: ["validar", "usar", "baixa", "conferir"],
      },
    ],
  },
  {
    id: "fidelidade",
    title: "Fidelidade (FlyPontos)",
    description: "Pontos, cashback, níveis, recompensas e missões.",
    topics: [
      {
        q: "Como ativo o programa de fidelidade?",
        a: [
          "No painel de Fidelidade, ative o programa e revise as regras. A partir daí seus clientes podem entrar no seu programa pela sua página de loja e começam a acumular pontos.",
        ],
        keywords: ["fidelidade", "flypontos", "ativar", "programa"],
      },
      {
        q: "Como o cliente ganha pontos?",
        a: [
          "Por ações na plataforma (seguir a loja, favoritar, avaliar, indicar amigos, check-in) e, principalmente, por compras validadas por você. Cada regra tem uma pontuação configurável no painel.",
          "Pontos de compra só são creditados após a validação pelo lojista — o cliente não consegue lançar compras sozinho.",
        ],
        keywords: ["pontos", "ganhar", "regras", "compra", "check-in"],
      },
      {
        q: "Como valido a compra de um cliente?",
        a: [
          "Em \"Validar cliente\", leia o QR do cliente ou digite o código de 6 dígitos que ele mostra no app, informe o valor da compra e confirme. Os pontos e o cashback são creditados na hora.",
          "O código do cliente expira em 60 segundos e só pode ser usado uma vez.",
        ],
        keywords: ["validar", "qr", "código", "compra", "caixa"],
      },
      {
        q: "Como confirmo a entrega de uma recompensa resgatada?",
        a: [
          "Quando o cliente resgata uma recompensa, ele recebe um código do resgate com 8 caracteres (letras e números). Na mesma tela de \"Validar cliente\", digite esse código e use \"Confirmar resgate\" ao entregar o brinde.",
        ],
        keywords: ["resgate", "recompensa", "confirmar", "entrega", "código"],
      },
      {
        q: "O que é o cashback e como configuro?",
        a: [
          "É um percentual do valor da compra devolvido em crédito para o cliente usar na próxima visita na sua loja. Você define o percentual — comece baixo e ajuste conforme a margem.",
        ],
        keywords: ["cashback", "crédito", "percentual"],
      },
      {
        q: "Os pontos vencem?",
        a: [
          "Sim, se você definir uma validade em meses. Pontos próximos do vencimento geram um aviso ao cliente, o que costuma trazer visita nova antes do prazo.",
        ],
        keywords: ["validade", "expirar", "vencer", "pontos"],
      },
      {
        q: "Para que servem os níveis (Bronze, Prata, Ouro, Diamante)?",
        a: [
          "Cada nível exige uma quantidade de pontos acumulados e pode dar multiplicador de pontos, desconto extra e acesso antecipado a ofertas. É o que faz o cliente querer continuar comprando com você.",
        ],
        keywords: ["níveis", "tiers", "bronze", "ouro", "multiplicador"],
      },
      {
        q: "Como crio recompensas e missões?",
        a: [
          "Recompensas são o que o cliente troca por pontos (cupom, crédito, brinde ou benefício de nível) — defina custo em pontos, estoque e validade.",
          "Missões são desafios com prazo (\"visite 3 vezes no mês\") que entregam pontos ou selos ao serem concluídos.",
        ],
        keywords: ["recompensa", "missão", "resgate", "selo", "desafio"],
      },
      {
        q: "Onde vejo os resultados do programa?",
        a: [
          "O relatório do painel de Fidelidade mostra membros, pontos emitidos e resgatados, crédito em circulação e evolução das visitas no período.",
        ],
        keywords: ["relatório", "resultados", "membros", "métricas"],
      },
    ],
  },
  {
    id: "flyscore",
    title: "FlyScore",
    description: "Sua nota de reputação na plataforma.",
    topics: [
      {
        q: "O que é o FlyScore?",
        a: [
          "É uma nota que resume a qualidade da sua presença no OfertasFly. Ela influencia sua posição nas listagens e a confiança do consumidor.",
        ],
        keywords: ["flyscore", "nota", "reputação", "score"],
      },
      {
        q: "Quais pilares compõem a nota?",
        a: [
          "Cadastro completo da loja (dados, imagens, horários, localização), atualização constante (novas ofertas e eventos publicados), avaliações recebidas dos clientes e engajamento gerado pelos seus anúncios.",
        ],
        keywords: ["pilares", "critérios", "como é calculado"],
      },
      {
        q: "Como aumentar meu FlyScore?",
        a: [
          "Complete 100% do cadastro, publique com regularidade (inclusive eventos), incentive os clientes a avaliarem após a compra e mantenha ofertas válidas — ofertas vencidas e loja parada derrubam a nota.",
        ],
        keywords: ["melhorar", "aumentar", "subir nota"],
      },
    ],
  },
  {
    id: "inteligencia",
    title: "Inteligência",
    description: "Métricas e comparativo de mercado.",
    topics: [
      {
        q: "Quais números eu acompanho?",
        a: [
          "Visualizações dos anúncios, cliques no botão de WhatsApp, leituras de QR Code e o desempenho de cada oferta — dá para ver rapidamente qual anúncio puxa contato e qual não performa.",
        ],
        keywords: ["métricas", "cliques", "whatsapp", "qr", "visualizações"],
      },
      {
        q: "O que é o comparativo com a categoria?",
        a: [
          "Mostra como sua loja está em relação à média das lojas da mesma categoria no período. Serve para saber se um resultado fraco é seu ou do mercado.",
        ],
        keywords: ["benchmark", "comparativo", "categoria", "média"],
      },
    ],
  },
  {
    id: "assinatura",
    title: "Assinatura e planos",
    description: "Testes, upgrade, cobrança e cancelamento.",
    topics: [
      {
        q: "Como funciona o período de testes?",
        a: [
          "Sua loja começa com um período gratuito para testar a plataforma. Durante o teste você usa os recursos do plano normalmente; ao fim dele é preciso assinar para continuar publicando.",
        ],
        keywords: ["teste", "trial", "grátis", "dias"],
      },
      {
        q: "O que muda entre os planos?",
        a: [
          "A quantidade de ofertas ativas, os espaços de destaque e o acesso aos formatos avançados (Coletiva, Leilão, Oferta Invisível) e a recursos de fidelidade e inteligência.",
        ],
        keywords: ["planos", "diferença", "recursos", "plus"],
      },
      {
        q: "Como faço upgrade ou troco a forma de pagamento?",
        a: [
          "Em Assinatura você escolhe o novo plano e o período (mensal ou anual) e é levado ao ambiente de pagamento seguro. A troca vale imediatamente após a confirmação.",
        ],
        keywords: ["upgrade", "pagamento", "cartão", "anual", "mensal"],
      },
      {
        q: "Como cancelo e o que acontece com minhas ofertas?",
        a: [
          "Você cancela em Assinatura. O plano segue ativo até o fim do período já pago e não é renovado. Depois disso as ofertas deixam de ser exibidas, mas seus dados, mídias e histórico ficam guardados — se voltar, é só reativar.",
        ],
        keywords: ["cancelar", "cancelamento", "encerrar", "reativar"],
      },
    ],
  },
  {
    id: "avaliacoes",
    title: "Avaliações",
    description: "Quem avalia, moderação e reputação.",
    topics: [
      {
        q: "Quem pode avaliar minha loja?",
        a: [
          "Consumidores logados que interagiram com suas ofertas. Cada avaliação tem nota, comentário e pode ter fotos.",
        ],
        keywords: ["avaliação", "avaliar", "nota", "estrelas"],
      },
      {
        q: "As avaliações são moderadas?",
        a: [
          "Sim. Avaliações passam por moderação e conteúdo ofensivo ou fora de contexto é removido. Uma avaliação negativa legítima não é apagada — responda com educação e resolva o caso; isso pesa mais para quem lê do que a nota em si.",
        ],
        keywords: ["moderação", "remover", "negativa", "denúncia"],
      },
      {
        q: "Como consigo mais avaliações?",
        a: [
          "Peça no momento da entrega e use o programa de fidelidade: avaliar rende pontos ao cliente. Volume de avaliações reais melhora seu FlyScore e sua conversão.",
        ],
        keywords: ["conseguir", "mais avaliações", "pedir"],
      },
    ],
  },
];

export const BEST_PRACTICES: string[] = [
  "Foto nítida, bem iluminada e sem texto poluindo a imagem — é o que decide o clique.",
  "Preço original real. Desconto inflado gera reprovação e desconfiança.",
  "Título direto: produto + benefício. Evite abreviações e CAIXA ALTA.",
  "Condições claras: quantidade, dias, horários, delivery e formas de pagamento.",
  "Sempre com validade — e revise as ofertas vencidas toda semana.",
  "Publique com regularidade: pouca atualização derruba seu FlyScore.",
  "Divulgue o link e o QR Code nas suas redes, no balcão e nas embalagens.",
  "Responda rápido no WhatsApp — a maior perda de venda acontece na demora.",
  "Ative o programa de fidelidade para transformar a primeira compra em recorrência.",
];
