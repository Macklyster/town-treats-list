
# Nova Home — Modelo "OfertasFly Light"

Análise da referência anexa e plano de implementação. A base atual (Aurora Tech, tudo escuro/glass) será **substituída pela nova identidade clara**, mantendo APIs, hooks e backend já criados (`events`, `user_interests`, `user_view_history`, `company_flyscore`, `home-api.ts`).

## Leitura da referência

A imagem transmite **produto maduro, tipo Rappi/iFood + Airbnb**: base clara e arejada, um único bloco escuro no hero para dar peso à marca, e roxo (#6D28D9 / indigo-violet) como acento único e consistente. É mais "produto" do que "landing" — cada seção mostra dados reais em cards compactos e escaneáveis.

Elementos-chave observados:
- **Header branco**, logo + tagline, search central grande com botão roxo sólido, seletor de cidade, favoritos, botão "Entrar" roxo. Abaixo, **chips de categoria** horizontais (Pizzarias, Barbearias, Lava Jato, Clínicas, Lojas… "Mais").
- **Hero escuro** (não tela toda — apenas um bloco arredondado): título "Descubra o melhor da sua cidade" com "sua cidade" em roxo, subtítulo curto, dois CTAs (Explorar sólido roxo / Cadastrar empresa outline). À direita, **imagem real** de ambiente + micro-card flutuante com avatar + rating + FlyScore. No canto direito, **card de métricas** (empresas ativas, ofertas publicadas, usuários, cidade atual) em glass escuro.
- **Empresas em destaque**: carrossel horizontal com setas laterais, cards claros ~1:1 com badge "Aberto agora" verde, logo circular, nome + verificado, categoria, rating + FlyScore, distância + bairro.
- **Ofertas do dia**: mesma pegada, cards com badge de % OFF vermelho no topo esquerdo, imagem, nome loja, título curto, preço promo + riscado, botão "Ver oferta" roxo.
- **Descubra perto de você + Recomendadas**: linha em 2 colunas — mapa à esquerda (card com pins roxos + botão flutuante "Explorar no mapa") e 3 cards de empresas recomendadas à direita.
- **Faixa "Entenda o FlyScore"**: barra horizontal clara mostrando os 6 pilares em ícones + valores, e um badge circular grande "96/100 FlyScore Médio" à direita.
- **Reviews + Galeria**: 2 colunas. Reviews com avatar + verificado + estrelas + texto + thumbnails. Galeria com grid 3x2 + tile "+28 fotos".
- **CTA roxo largo** ("Seu negócio merece ser encontrado") com 2 botões brancos.
- **Footer institucional claro**: 5 colunas (Navegação, Institucional, Ajuda, Baixe o app com badges Google Play/App Store), redes sociais à esquerda, copyright.

Tom geral: **claro, denso mas respirável, roxo como única cor de marca**, tipografia sem-serifa moderna, cantos arredondados médios (16-20px), sombras suaves.

## Direção visual

- **Modo**: light por padrão (a home vive fora do `theme-aurora` escuro atual).
- **Tokens** (adicionar em `src/index.css` sob um wrapper `.theme-fly-light`):
  - `--bg: 0 0% 100%`, `--surface: 240 20% 99%`, `--muted-surface: 240 10% 96%`
  - `--fg: 240 15% 12%`, `--fg-muted: 240 8% 45%`
  - `--brand: 262 83% 58%` (violeta principal), `--brand-strong: 262 75% 48%`, `--brand-soft: 262 100% 97%`
  - `--success: 142 70% 40%` (badge "Aberto agora")
  - `--danger: 0 84% 55%` (badge OFF)
  - `--ring: 262 83% 58%`
  - `--radius-card: 20px`, `--shadow-card: 0 1px 2px rgba(15,15,30,.04), 0 8px 24px -12px rgba(76,29,149,.12)`
  - Hero dark island: `--hero-bg: 240 20% 7%`
- **Tipografia**: manter `Space Grotesk` (display) + `Inter` (body) já carregados; pesos 500/600/700 nos títulos.

## Componentização

Reescrever/renomear os componentes em `src/components/home/`:

- `HomeHeader.tsx` → versão clara: logo + tagline "Descubra. Conecte. Valorize.", `SearchBar` grande central com botão roxo, `CitySelector`, ícone favoritos, botão "Entrar" roxo. Segunda linha com **`CategoryChips`** (novo) usando `src/data/categories.ts`, com scroll horizontal + item "Mais".
- `HomeHero.tsx` → bloco escuro arredondado (`bg-[hsl(var(--hero-bg))]`) ocupando `container` com `mt-6`. Grid 3 colunas:
  - Esquerda: título com "sua cidade" em `text-brand`, subtítulo, 2 CTAs.
  - Centro: imagem real (usar primeira `featured` ou placeholder) com micro-card `FeaturedStorePeek` (avatar + nome + rating + FlyScore) flutuando no bottom.
  - Direita: `HeroMetricsCard` em glass escuro com 4 métricas dinâmicas (empresas ativas, ofertas, usuários, cidade). Números vindos de `home-api.ts` (`fetchHomeStats`, novo).
- `CategoryChips.tsx` (novo) — chips clicáveis linkando a `/categoria/:slug`.
- `FeaturedCompanies.tsx` → cards claros novos (`CompanyCard` reescrito): imagem topo com badge "Aberto agora" verde/"Fecha às HH:MM" âmbar, logo circular sobreposta, nome + selo verificado, categoria, `RatingStars` + `FlyScoreChip`, distância + bairro. Setas laterais mantidas.
- `OffersOfTheDay.tsx` → cards claros com badge OFF vermelho topo-esquerda, título, preço promo grande + preço original riscado, CTA "Ver oferta" roxo. Layout carrossel horizontal como referência.
- `NearbyMap.tsx` + `Recommended.tsx` → agrupar em uma linha `DiscoverRow` (2 colunas no desktop, empilhado no mobile). Mapa reutiliza `OffersMap` com overlay claro e botão flutuante "Explorar no mapa" → `/mapa` ou `#mapa`.
- `FlyScoreSection.tsx` → reformulado como **faixa horizontal clara** (não círculo grande): 6 ícones + labels + valor médio agregado, badge circular "96/100 FlyScore Médio" no canto direito, link "Saiba como funciona" abre modal educativo (mantém conteúdo dos 6 pilares).
- `ReviewsCarousel.tsx` → cards claros lado a lado, avatar + nome verificado + "há X dias" + estrelas + review truncada + thumbnails de fotos.
- `GalleryGrid.tsx` → grid 3x2 no desktop / 2x2 mobile, último tile "+N fotos" roxo.
- `CTABanner.tsx` → faixa horizontal roxa (gradiente sutil `--brand` → `--brand-strong`), logo à esquerda, texto no meio, 2 botões brancos à direita.
- `HomeFooter.tsx` → 5 colunas (Marca+redes, Navegação, Institucional, Ajuda, Baixe o app com badges reais). Fundo `#0b0b12`, texto claro, copyright.

Componentes atuais a **remover** da Home (não da base): `HappeningNow` sai da home nesta iteração (fica disponível como componente para reuso; a referência não mostra essa seção — evitamos ruído). Se o usuário quiser, entra em fase 2.

## Página `src/pages/Index.tsx`

Nova composição, sem `theme-aurora`, com fundo `bg-background`:
```
HomeHeader (com CategoryChips)
HomeHero (dark island + metrics card)
FeaturedCompanies
OffersOfTheDay
DiscoverRow (NearbyMap + Recommended)
FlyScoreBar
ReviewsAndGallery (Reviews + Galeria em 2 colunas)
CTABanner
HomeFooter
```
SEO/JSON-LD atuais (WebSite + Organization) preservados.

## APIs

- `src/lib/home-api.ts`: adicionar `fetchHomeStats(city)` retornando `{ activeCompanies, publishedOffers, connectedUsers, cityLabel }` — usa `count: 'exact', head: true` em `stores`, `offers` e `profiles`. Sem mudanças de schema.
- Nada muda em `events`, `user_interests`, `user_view_history`, `company_flyscore` (permanecem para uso futuro / Recommended já consome).

## Ordem de execução (uma iteração)

1. Adicionar tokens `.theme-fly-light` em `src/index.css` (paleta clara + brand roxo + sombras).
2. Reescrever `HomeHeader` + novo `CategoryChips` + refinar `SearchBar`/`CitySelector` visual.
3. Reescrever `HomeHero` com hero-island escuro, imagem, micro-card, métricas.
4. Reescrever `CompanyCard`, `FeaturedCompanies`, `OffersOfTheDay` (visual claro).
5. Compor `DiscoverRow` (Nearby + Recommended lado a lado).
6. Refazer `FlyScoreSection` como barra horizontal + badge circular.
7. Compor `ReviewsAndGallery` em 2 colunas.
8. Reescrever `CTABanner` roxo horizontal e `HomeFooter` 5 colunas com badges das lojas.
9. Atualizar `src/pages/Index.tsx` para a nova composição e remover wrapper `theme-aurora`.
10. Adicionar `fetchHomeStats` em `home-api.ts` e ligar ao hero.
11. QA responsivo (mobile: chips scroll, hero empilha, carrosséis com swipe, footer em accordion).

## O que NÃO muda

- Rotas, auth, edge functions, migrações já aplicadas.
- Demais páginas (`CityOffers`, `OfertasInvisiveis`, Admin, etc.) permanecem no tema atual.
- Componentes utilitários (`OffersMap`, `RatingStars`, `SocialProofBadge`, `StoreAvatar`, `CountdownBadge`) são reutilizados.

Confirma seguir com essa direção clara + hero-island roxo?
