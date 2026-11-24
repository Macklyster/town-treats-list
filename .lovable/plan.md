# Planos: mostrar "Tudo do plano anterior" no upgrade

## O que muda
Em cada cartão de plano, a lista de benefícios começa com uma linha em destaque indicando que o plano inclui tudo do plano abaixo dele:

- **Grátis:** sem mudança.
- **Starter:** "Tudo do plano Grátis, mais:"
- **Destaque:** "Tudo do plano Starter, mais:"
- **Plus:** "Tudo do plano Destaque, mais:"

Vale para a página de planos pública (Anuncie) e para a página de Assinatura do lojista, para os ciclos mensal e anual.

## Detalhes técnicos
- O plano anterior vem da ordem dos planos já existente (sort_order), então continua certo se nomes ou planos mudarem.
- Linha renderizada antes de `features.map` em `src/pages/Anuncie.tsx` e `src/pages/Assinatura.tsx`, com ícone de camadas e texto em negrito.
- Sem alterações no banco.
