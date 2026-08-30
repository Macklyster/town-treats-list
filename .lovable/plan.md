# Central de Ajuda do Lojista

Nova página de ajuda dentro da área do lojista, escrita para que o lojista consiga tirar todas as dúvidas sozinho, sem precisar de suporte.

## O que o lojista vai ver

Rota `/painel-lojista/ajuda`, com botão "Ajuda" no topo do painel (ao lado de Fidelidade / Inteligência) e link no rodapé da própria página.

Estrutura da página:

1. **Busca** — campo no topo que filtra todos os tópicos por palavra (ex.: "relâmpago", "QR", "pontos", "cancelar").
2. **Primeiros passos** — 5 cartões numerados: cadastrar loja, aguardar aprovação, escolher plano/período de testes, criar a primeira oferta, divulgar o link e o QR Code.
3. **Tópicos por módulo** (acordeões com perguntas e respostas):
   - Minha loja: dados, logo/capa, endereço no mapa, horários de atendimento ("Domingo e Feriado"), WhatsApp e Instagram.
   - Ofertas: tipos (desconto, cupom, brinde), preços, validade, condições, status (pendente, aprovada, rejeitada, pausada), destaque, renovação automática, agendamento, duplicar oferta.
   - Ofertas Relâmpago: como funciona a contagem e a notificação aos seguidores.
   - Mídias do anúncio: várias imagens + vídeo curto, capa, ordem, carrossel no anúncio, biblioteca de mídia.
   - Coletivas, Leilões e Invisíveis: regra de cada formato, limites de ativas por loja, links públicos.
   - Eventos: tipos, data/hora, local marcado no mapa, aprovação.
   - Cupons: código fixo x código único, limite de usos, limite por cliente, validação da entrega.
   - Fidelidade (FlyPontos): ativar programa, regras de pontos, cashback, validade dos pontos, níveis, recompensas, missões, validar cliente por QR e confirmar resgates.
   - FlyScore: o que é, quais pilares contam (ofertas, eventos, avaliações, dados da loja) e como subir a nota.
   - Inteligência: cliques no WhatsApp, leituras de QR, comparativo com a categoria.
   - Assinatura: planos, período de testes, upgrade, cancelamento e o que acontece com as ofertas ao cancelar.
   - Avaliações: quem pode avaliar, moderação e resposta.
4. **Boas práticas** — checklist curto do que faz uma oferta performar (foto boa, preço real, condições claras, validade, divulgação).
5. **Ainda com dúvida?** — bloco final com contato (WhatsApp/e-mail de suporte) e links para Termos de Uso e Política de Privacidade.

O conteúdo respeita o design system atual (`PageHero`, `SectionCard`, `Accordion`, ícones Lucide, tokens semânticos) e é 100% responsivo.

## Detalhes técnicos

- Nova página `src/pages/PainelLojista Ajuda` → `src/pages/PainelAjuda.tsx`.
- Conteúdo em um arquivo de dados `src/lib/help-content.ts` (array de seções → tópicos com título, corpo e palavras-chave), para facilitar manutenção e a busca por texto.
- Rota protegida em `App.tsx`: `/painel-lojista/ajuda` com `requireRole="lojista"`, igual às demais rotas do painel.
- Botão "Ajuda" (ícone `HelpCircle`) na barra de ações de `PainelLojista.tsx`.
- Sem mudanças de banco de dados e sem backend: conteúdo estático.
- Suporte a link direto por tópico via hash (`/painel-lojista/ajuda#fidelidade`) para poder apontar dúvidas específicas.
