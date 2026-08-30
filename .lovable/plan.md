# FAQ Pública do FlyPontos

Página educativa para consumidores entenderem o programa de fidelidade FlyPontos de modo geral, sem entrar nas configurações específicas de cada loja.

## O que será entregue

1. **Nova rota pública** `/fidelidade/como-funciona` (ou `/flypontos` se preferir).
2. **Página `src/pages/FidelidadeComoFunciona.tsx`** com:
   - Hero explicando o que é o FlyPontos e que cada loja parceira tem seu próprio programa.
   - FAQ por módulo (acordeões):
     - O que é FlyPontos
     - Como participar de uma loja
     - Formas de ganhar pontos (seguir, favoritar, avaliar, check-in, compras, indicação, missões)
     - Níveis e multiplicadores
     - Recompensas e resgates
     - Cashback em crédito
     - QR de compra e validação pelo lojista
     - Validade dos pontos
     - Ranking da cidade
     - O que fazer se a loja ainda não tem programa
   - Bloco final com CTA: "Criar conta grátis" (não logado) ou "Ver lojas parceiras" (logado).
3. **Arquivo de conteúdo** `src/lib/loyalty-faq-content.ts` com array de seções e tópicos, igual ao padrão da Central de Ajuda do Lojista, para facilitar manutenção.
4. **Link de acesso** na página `/fidelidade` ("Como funciona?") e, se fizer sentido, no menu mobile/desktop de Fidelidade.
5. **SEO** com título e descrição próprios, usando o componente `SEO` existente.

## Detalhes técnicos

- Rota não protegida em `App.tsx`, aberta ao público.
- Reutiliza componentes do design system: `Header`, `Footer`, `PageHero`, `SectionCard`, `Accordion`, `Button`, `SEO`.
- Sem mudanças de banco de dados: conteúdo estático.
- Suporte a link direto por hash (`/fidelidade/como-funciona#recompensas`).
- Responsivo, seguindo o padrão das páginas públicas existentes.
