## Objetivo
Exibir o **logo da loja** (campo já cadastrado em `stores.logo_url` via formulário do lojista) tanto no **card da oferta** (listagem `/ofertas` e demais grids) quanto na **página de detalhe da oferta** (`/oferta/:id`). Cada anúncio mostra o logo da loja vinculada a ele — sem nova seleção, é puxado automaticamente da loja dona da oferta.

## Mudanças

### 1. `src/lib/offers-api.ts`
- Incluir `logo_url` no `select` das duas queries (`fetchOffers` e `fetchOfferById`):
  `store:stores!inner(name,slug,city,state,logo_url)`.
- Adicionar campo `storeLogo?: string` em `UIOffer` e mapear em `mapRow` (`row.store?.logo_url ?? undefined`).

### 2. `src/components/site/OfferCard.tsx`
- No bloco do nome da loja (linha do `storeName`), renderizar um pequeno avatar circular (24–28 px) com o `storeLogo` à esquerda do texto.
- Fallback quando não houver logo: círculo neutro com a inicial do nome (`bg-muted text-muted-foreground`), evitando quebra visual.

### 3. `src/pages/OfferDetail.tsx`
- No card lateral (aside, onde aparece `offer.storeName` em uppercase) trocar a linha por um header com **logo (40 px) + nome da loja** lado a lado.
- No card "Sobre a loja", adicionar o logo (56 px) acima do nome/endereço, dando identidade visual ao bloco.
- Mesmo fallback de inicial quando `logo_url` for vazio.

### 4. (Opcional, mesmo padrão) `FeaturedCarousel`
- Se o carrossel de destaques usar OfferCard, herda automaticamente. Verificar e, se renderizar markup próprio, replicar o mini-avatar.

## Pontos técnicos
- Sem migração: `stores.logo_url` já existe e é público por RLS.
- Componente reutilizável sugerido: `StoreAvatar` simples em `src/components/site/StoreAvatar.tsx` recebendo `name`, `logoUrl`, `size` — evita duplicar markup do fallback nos 3 lugares.
- `loading="lazy"` nos `<img>` do logo.
- Sem mudanças na tela de criação de oferta — o vínculo já é feito por `store_id`.
