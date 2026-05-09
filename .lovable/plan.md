## Problema
O banner rotativo (`FeaturedCarousel`) está ocupando altura excessiva no desktop, empurrando o conteúdo abaixo da dobra e prejudicando a UX. Causas:

- A imagem usa `aspect-[16/10]` no mobile e `md:aspect-auto` no desktop, fazendo o lado da imagem se esticar para acompanhar a coluna de texto (que tem padding `md:p-12` + 5 blocos verticais).
- Sem altura máxima, o card cresce conforme o conteúdo (descrição longa, botão, preço), ficando "comprido" demais.

## Mudanças em `src/components/site/FeaturedCarousel.tsx`

### 1. Definir altura controlada do banner
- Trocar layout para altura fixa responsiva: `h-[280px] sm:h-[320px] md:h-[360px]` no card (`<div className="grid ...">`).
- Imagem: `h-full w-full object-cover` em ambos os lados (remover `aspect-[16/10]` e `md:aspect-auto`).

### 2. Reduzir padding e tamanhos do bloco de texto
- Padding: `p-6 md:p-8` (em vez de `p-8 md:p-12`).
- Gap: `gap-3` (em vez de `gap-4`).
- Título: `text-xl md:text-2xl` (em vez de `text-2xl md:text-[28px]`).
- Descrição: adicionar `line-clamp-2` para evitar que descrições longas estiquem o card.
- Preço: `text-2xl md:text-3xl`.
- Botão: `size="default"` em vez de `size="lg"`.

### 3. Garantir overflow controlado
- Adicionar `overflow-hidden` já existe. Conteúdo de texto recebe `min-w-0` para `line-clamp` funcionar corretamente dentro do grid.

## Resultado esperado
- Banner com altura previsível (~360px no desktop, ~280–320px em telas menores), independente do tamanho da descrição.
- Hero + banner cabem melhor na primeira dobra.
- Sem mudanças funcionais (mesmas ofertas, mesma navegação).

## Fora do escopo
- Mudar quantidade de slides ou autoplay.
- Alterar o card de oferta padrão (`OfferCard`).
