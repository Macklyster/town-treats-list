# Redesign OfertasFly Light — todas as páginas

Aplicar o mesmo padrão visual da nova Home (fundo cream claro, acento violeta `--primary 262`, hero-islands escuros pontuais, cards arredondados 20px, sombras suaves, tipografia Syne + DM Sans) em todas as páginas do produto.

Os tokens já são globais em `src/index.css`, então não há refactor de design system — o trabalho é substituir chrome (Header/Footer), reescrever hero de cada página, padronizar cards, botões, badges e vazio-estados.

## Fundações compartilhadas (feito 1x, antes das ondas)

1. **Header/Footer globais**: substituir `src/components/site/Header.tsx` e `Footer.tsx` pelo visual do `HomeHeader`/`HomeFooter` (logo + tagline, busca grande com botão violeta sólido, city selector, chips de categoria opcionais por rota, footer 5 colunas). Mantém todas as rotas e handlers atuais.
2. **Componentes de página reutilizáveis** em `src/components/site/`:
   - `PageHero` — hero-island escuro arredondado com título display, subtítulo, breadcrumb opcional, slot de métricas/CTA.
   - `PageShell` — wrapper `container py-10` + skip-link + padding responsivo consistente.
   - `EmptyState` — ícone violeta em círculo claro, título Syne, CTA violeta.
   - `SectionCard` — card branco `rounded-3xl shadow-card` com header/eyebrow padronizado.
   - `StatPill`, `FilterBar`, `SortMenu` — controles claros com foco violeta.
3. **Botões**: converter usos de `variant="accent"` que ainda apontam pro velho amarelo para `variant="default"` (violeta), mantendo `outline` claro. Não mexer no sistema de variantes.

## Ondas de entrega (uma iteração por onda)

### Onda 1 — Descoberta pública
- `CityOffers.tsx`: hero-island com nome da cidade + métricas (lojas, ofertas ativas), `CategoryChips` sticky abaixo, grid de `OfferCard` no novo estilo (imagem 4:3, badge OFF vermelho, preço promo grande, CTA violeta), mapa em card claro à direita no desktop.
- `StorePage.tsx`: capa com overlay escuro, avatar circular grande, badges (verificado, aberto agora verde, FlyScore chip), tabs Sobre/Ofertas/Avaliações/Galeria em pílulas violetas, seções em `SectionCard`.
- `OfferDetail.tsx`: galeria à esquerda, painel de compra à direita em `SectionCard` sticky, contador (`CountdownBadge`) integrado, prova social, seção de loja + ofertas relacionadas.

### Onda 2 — Conversão do usuário final
- `Cupons.tsx` + `MeusCupons.tsx` + `MeuCupomDetalhe.tsx`: header claro com eyebrow, cards de cupom com faixa violeta lateral, código em mono grande, estado "Usado" com badge verde `--open`.
- `Historico.tsx`, `Notificacoes.tsx`: lista em `SectionCard` com item denso, timestamps em `text-muted-foreground`, ações inline.
- `OfertasInvisiveis.tsx` + `OfertaInvisivelPublic.tsx`: hero escuro com selo "Oferta Invisível", reveal card violeta.
- `Coletivas.tsx` + `ColetivaPublic.tsx` + `Leiloes.tsx` + `LeilaoPublic.tsx`: mesmo padrão hero-island + `SectionCard` + progress/bid em violeta.

### Onda 3 — Entrada e monetização
- `Auth.tsx`: split-screen — esquerda hero-island escuro com claim + prova social, direita card branco com form Syne, botão Google outline, botão principal violeta.
- `Anuncie.tsx`: hero-island longo, seção de planos em 3 cards claros (Starter/Destaque/Plus) com plano do meio destacado em violeta, FAQ em accordion claro, CTA final banner violeta.
- `Assinatura.tsx`: cabeçalho com status do plano em `StatPill`, cards de plano lado a lado, seção de faturamento em `SectionCard`, avisos usando `warning` tokens.

### Onda 4 — Áreas internas
- `PainelLojista.tsx`: sidebar clara sticky esquerda com navegação em pílulas violetas, dashboard cards (ofertas ativas, views, cupons, FlyScore) em grid, gráfico simples, tabela de ofertas com row hover violeta claro.
- `LojaForm.tsx`, `OfertaForm.tsx`, `OfertaInvisivelForm.tsx`, `ColetivaForm.tsx`, `LeilaoForm.tsx`, `Biblioteca.tsx`: formulários em `SectionCard` de coluna única max-w-3xl, labels DM Sans 14, inputs `rounded-xl border-input` com foco violeta, botões primários violeta, botão secundário outline.
- `Admin.tsx` + subcomponentes (`AdminBroadcast`, `AdminColetivas`, `AdminLeiloes`, `AdminMedia`, `AdminOfertasInvisiveis`, `AdminReviews`, `AdminSettings`): header escuro compacto, tabs em pílulas, tabelas com header cinza claro, ações em ícones violeta.
- `Inteligencia.tsx`: dashboard em grid bento, KPIs em `SectionCard`, gráficos com stroke violeta.
- `NotFound.tsx`, `PoliticaDePrivacidade.tsx`, `TermosDeUso.tsx`: hero-island curto + conteúdo em `SectionCard` prose.

## Detalhes técnicos

- **Sem novas dependências**. Fontes Syne/DM Sans já carregadas em `main.tsx`. Framer Motion já disponível.
- **Sem alterações de dados, RLS, edge functions ou rotas**. Apenas apresentação.
- **Tokens**: usar exclusivamente `bg-background`, `bg-card`, `text-foreground`, `text-primary`, `bg-primary text-primary-foreground`, `bg-[hsl(var(--hero-bg))]`, `bg-[hsl(var(--open-bg))] text-[hsl(var(--open))]`, etc. Zero cores hex/rgb hardcoded, zero `text-white`/`bg-black` fora do hero-island (onde uso `text-[hsl(var(--hero-fg))]`).
- **Responsivo**: mobile-first, breakpoints `md` (768) e `lg` (1024). Hero-islands viram coluna única no mobile; sidebars viram bottom sheet ou top bar.
- **Acessibilidade**: manter labels ARIA existentes, foco visível violeta (`focus-visible:ring-2 ring-ring`), contraste AA no cream + violeta.
- **Componentes que NÃO mudam**: `OffersMap`, `RatingStars`, `RatingSummary`, `StoreAvatar`, `CountdownBadge`, `SocialProofBadge`, `MediaLibrary`, `MediaPicker`, `ImageUploader`, hooks, libs, integrações Supabase, tipos.
- **`src/components/home/*`**: já no padrão novo, não mexer.

## Ordem de execução proposta

Entrego **uma onda por mensagem** para você validar visualmente antes de seguir. Começo pelas Fundações + Onda 1 (Descoberta pública) na próxima iteração. Confirma?
