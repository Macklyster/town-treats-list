## Objetivo

Adicionar ao painel Admin a opção de habilitar/desabilitar um **Selo de Loja Destaque** para lojas cujos donos assinaram os planos **Destaque** ou **Plus**. O selo aparecerá visualmente em locais públicos (card da loja, página da oferta e avatar da loja).

## Mudanças

### 1. Banco de dados (migration)
- Adicionar coluna `featured_badge` (boolean, default `false`) na tabela `stores`.
- Sem alterações de RLS (políticas existentes de `stores` já cobrem update por admin).

### 2. Painel Admin (`src/pages/Admin.tsx`)
Na aba **Lojas**, adicionar:
- Nova coluna **Plano** mostrando o plano ativo da loja (busca via `subscriptions` + `plans`, somente status `active`/`trialing`).
- Nova coluna **Selo Destaque** com um `Switch`:
  - Habilitado apenas se o plano da loja for `destaque` ou `plus` E a loja estiver `approved`.
  - Caso contrário, exibir tooltip "Disponível apenas para planos Destaque e Plus".
- Ação salva via `update` em `stores.featured_badge`.

### 3. Exibição pública do selo
Criar componente reutilizável `src/components/site/StoreFeaturedBadge.tsx` (ícone `BadgeCheck` + texto "Loja Destaque", estilo accent).
Renderizar quando `store.featured_badge === true` em:
- `src/pages/OfferDetail.tsx` — ao lado do nome da loja.
- `src/components/site/OfferCard.tsx` — pequeno indicador junto ao nome da loja.
- `src/components/site/StoreAvatar.tsx` — opcionalmente, mini-badge no avatar.

### 4. Tipos
Após migration, `src/integrations/supabase/types.ts` é regenerado automaticamente; ajustar consultas existentes que selecionam colunas explícitas de `stores` para incluir `featured_badge` quando necessário.

## Observações técnicas
- A verificação de plano no Admin é apenas para gating do controle (UX). Caso o admin tente habilitar sem plano elegível, o front bloqueia; o backend não faz validação extra (admin tem RLS livre).
- Se o lojista cancelar o plano, o selo **não** é removido automaticamente nesta entrega (pode ser feito via trigger no Stripe webhook em iteração futura — confirmo se quiser incluir agora).
