## Objetivo
Corrigir o banner rotativo para que a imagem não seja cortada em excesso e o conteúdo textual volte a aparecer de forma consistente, principalmente no mobile.

## O que vou alterar
1. Reestruturar o layout responsivo do `FeaturedCarousel`
   - No mobile, o banner deixa de usar altura fixa única para o card inteiro.
   - O slide passa a ter altura natural em 1 coluna, com imagem em proporção controlada e bloco de texto abaixo.
   - No desktop, mantenho o layout em 2 colunas com altura previsível para preservar a boa UX já ajustada.

2. Ajustar comportamento da imagem
   - Remover o corte agressivo causado por `object-cover` no cenário empilhado.
   - Aplicar proporção/altura específica para a mídia no mobile e comportamento mais equilibrado no desktop.
   - Garantir que a imagem continue preenchendo bem o espaço sem esconder partes importantes da oferta.

3. Garantir visibilidade do texto
   - Remover o conflito entre `overflow-hidden` + altura fixa no modo de 1 coluna.
   - Preservar títulos, descrição, preço e CTA dentro da área visível do slide.
   - Manter truncamento apenas onde fizer sentido, sem esconder o bloco inteiro.

4. Validar no preview
   - Conferir desktop e mobile para confirmar:
     - imagem visível sem corte excessivo
     - texto renderizado
     - altura mais equilibrada
     - navegação do carrossel intacta

## Resultado esperado
- Mobile: banner mais compacto, com imagem visível e texto completo.
- Desktop: continua com altura controlada, sem ficar “comprido”.
- Sem mudanças de regra de negócio ou tracking.

## Detalhes técnicos
- Arquivo principal: `src/components/site/FeaturedCarousel.tsx`
- Estratégia: separar o comportamento de layout entre mobile (stack com altura automática) e desktop (2 colunas com altura fixa moderada).
- Escopo: somente apresentação do banner rotativo.