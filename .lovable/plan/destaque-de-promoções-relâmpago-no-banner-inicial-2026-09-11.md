# Destaque de promoções Relâmpago no banner inicial

## Objetivo
Dar visibilidade imediata às promoções Relâmpago sem exigir que o usuário role até “Ofertas do dia”, mantendo a identidade visual atual da página.

## Alterações planejadas

1. **Levar as promoções ativas ao banner principal**
   - Usar as ofertas já carregadas e filtradas pela cidade selecionada.
   - Considerar somente promoções marcadas como Relâmpago e ainda não encerradas.
   - Priorizar a promoção com término mais próximo, reforçando a urgência real.

2. **Substituir o bloco de números por um card Relâmpago quando houver promoção ativa**
   - Exibir imagem, loja, título, preço promocional, desconto e contagem regressiva.
   - Usar a cor de alerta já existente no design system, com ícone de raio e destaque visual moderado.
   - Tornar todo o card acessível por clique, levando diretamente ao anúncio.
   - Informar quando houver outras promoções Relâmpago ativas, sem sobrecarregar o banner.

3. **Preservar o banner quando não houver Relâmpago**
   - Manter o bloco atual de números e localização como alternativa automática.
   - Evitar espaços vazios ou mensagens desnecessárias.

4. **Ajustar a experiência em diferentes telas**
   - No computador, o card ocupará a coluna direita do banner.
   - No celular, ficará logo após o carrossel de empresas, ainda dentro do banner e antes das demais seções.
   - Respeitar movimento reduzido e impedir que textos, preço e contador se sobreponham.

5. **Validar a experiência**
   - Conferir cenários com nenhuma, uma e várias promoções Relâmpago.
   - Verificar o término da contagem, o destino do clique e a apresentação em celular e computador.
   - Manter a promoção também em “Ofertas do dia”, pois o novo card funciona como destaque e não como remoção do catálogo.

## Detalhes técnicos
- A página inicial passará as ofertas Relâmpago ativas ao banner já existente.
- O card reutilizará o contador e as funções atuais de preço e desconto.
- Nenhuma mudança será feita no cadastro, nas regras da promoção ou no banco de dados.
