## Objetivo
Transformar o banner de loja em destaque no centro do `HomeHero` (primeira página) de uma única imagem estática em um carrossel navegável, exibindo várias lojas em destaque da cidade selecionada.

## Contexto atual
- `src/pages/Index.tsx` renderiza `<HomeHero />` como primeiro elemento da home.
- `src/components/home/HomeHero.tsx` busca `fetchFeaturedCompanies` e usa apenas `list[0]` no centro do hero.
- O centro do hero mostra: imagem de capa da loja, overlay gradiente, e um card inferior com logo, nome, badge verificado, FlyScore/cidade e link para `/loja/:slug`.
- O projeto já possui componente de carrossel reutilizável: `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext` em `@/components/ui/carousel`, usado em `src/components/site/FeaturedCarousel.tsx`.

## Alterações propostas

### 1. Dados
- Em `HomeHero`, manter a chamada a `fetchFeaturedCompanies`.
- Filtrar/ordenar para exibir até 5 lojas com `featured_badge === true` (ou as primeiras do resultado, que já vem ordenadas por `featured_badge`).
- Se houver menos de 2 lojas, manter o comportamento atual de exibição única (fallback para não quebrar layout).

### 2. Carrossel no centro do hero
- Substituir a área central de showcase por um `Carousel` do shadcn/ui.
- Cada `CarouselItem` será um slide contendo:
  - Imagem de capa da loja (`cover_url`) com object-cover.
  - Overlay gradiente `from-black/60 via-transparent to-transparent`.
  - Card inferior com logo, nome, badge verificado, FlyScore/cidade e link para `/loja/:slug`.
- Preservar o estado `imageLoaded` por slide (usar uma chave baseada no ID da loja para resetar o placeholder).

### 3. Navegação e indicadores
- Adicionar `CarouselPrevious` e `CarouselNext` posicionados sobre a área do carrossel (setas laterais).
- Adicionar indicadores tipo "dots" abaixo do carrossel, sincronizados com o slide ativo.
- Dots devem ser clicáveis para navegação direta.

### 4. Autoplay e acessibilidade
- Adicionar autoplay com intervalo de ~5 segundos, pausando ao hover e ao interagir com navegação.
- Usar `useEffect` + `setInterval` simples, evitando nova dependência.
- Aplicar atributos ARIA: `role="region"`, `aria-roledescription="carousel"`, labels nas setas.

### 5. Responsividade
- Manter a proporção `aspect-[16/10]` em mobile e `md:aspect-auto md:h-full` dentro do grid do hero.
- Garantir que o carrossel ocupe a altura disponível no grid de 3 colunas do hero (`lg:grid-cols-[1.1fr_1.3fr_0.95fr]`).

### 6. Estados de carregamento
- Enquanto as lojas carregam, manter o placeholder gradiente existente.
- Skeleton ou spinner não é necessário — o placeholder atual já cobre a área.

## Arquivos alterados
- `src/components/home/HomeHero.tsx` — implementação do carrossel.

## Não incluído neste plano
- Alterações no `FeaturedCompanies` (lista horizontal abaixo do hero).
- Alterações no `FeaturedCarousel` de ofertas.
- Novas dependências externas.

## Critérios de aceitação
- [ ] O centro do hero exibe múltiplas lojas em destaque em carrossel quando houver 2+ itens.
- [ ] Setas laterais permitem navegação manual.
- [ ] Dots indicam e permitem saltar para qualquer slide.
- [ ] Autoplay avança automaticamente a cada ~5s e pausa no hover.
- [ ] Cada slide mantém link para a loja, logo, nome, badge e FlyScore.
- [ ] Layout responsivo preservado sem quebras no mobile/desktop.
- [ ] Build passa sem erros.