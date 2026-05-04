## Objetivo

Permitir que o usuário escolha **uma cidade** logo ao entrar no site. Toda navegação seguinte (Home, Ofertas, Detalhe) passa a filtrar lojas/ofertas pela cidade selecionada, evitando carregar dados de todo o país. Geolocalização opcional preenche a cidade automaticamente.

## 1. Banco de dados

Migração para adicionar localização à loja (única fonte de verdade da cidade da oferta):

- `stores.city` (text, not null, default `''`)
- `stores.state` (text, 2 chars, default `''`)
- Índice em `(city, state)` para acelerar filtro.
- Backfill: lojas existentes recebem `'Não informado'` (lojista atualiza no painel).

## 2. Contexto global de cidade (frontend)

Novo `CityProvider` (`src/hooks/useCity.tsx`) embrulhando o app dentro de `<AuthProvider>`:

- Estado `{ city: string; state: string } | null`
- Persiste em `localStorage` (chave `helpfy:city`)
- Expõe `setCity`, `clearCity`, `openSelector()`
- Carrega lista de cidades disponíveis via `select distinct city,state from stores where approved`

## 3. Barra de destaque no topo (CityBar)

Componente novo `src/components/site/CityBar.tsx`, renderizado **acima** do `Header` em todas as páginas públicas.

- Sem cidade selecionada: fundo `bg-accent`, texto chamativo  
  "📍 Selecione sua cidade para ver as melhores ofertas perto de você" + botão "Escolher cidade".
- Com cidade selecionada: fundo neutro, "Mostrando ofertas em **São Paulo · SP**" + botão "Trocar".

## 4. Modal seletor de cidade (CitySelector)

Dialog acionado pela CityBar, pelo Hero ou na primeira visita (auto-abre se `localStorage` vazio).

Conteúdo:
1. Botão "Usar minha localização" → `navigator.geolocation.getCurrentPosition` → reverse geocoding via Nominatim (OpenStreetMap, sem chave) → preenche cidade/UF e salva.
2. Campo de busca com lista filtrada das cidades cadastradas no banco.
3. Estado vazio amigável caso ainda não haja lojas em uma cidade.

A primeira escolha aciona toast: "Pronto! Mostrando ofertas em {cidade}".

## 5. Filtro nas consultas

`src/lib/offers-api.ts`:

- `fetchOffers({ city, state })` → join com `stores` e `.eq('store.city', city).eq('store.state', state)`.
- Mesmo filtro em `fetchOfferById` para impedir abrir oferta de outra cidade via URL antiga (mostra aviso "esta oferta é de outra cidade — trocar?").

`Index.tsx` e `Ofertas.tsx` passam a usar `useCity()` e refetcham quando a cidade muda. Enquanto a cidade não estiver definida, mostram um *empty state* convidando a selecionar.

## 6. Cadastro de loja

`LojaForm.tsx` ganha campos obrigatórios **Cidade** e **UF** (UF como `Select` dos 27 estados). Validação Zod atualizada. Campo já vem preenchido na edição.

## 7. Hero

O `HeroSearch` exibe a cidade ativa abaixo do título ("Mostrando ofertas em São Paulo · trocar"). Sem cidade, o botão "Buscar" abre o seletor antes de navegar.

---

### Detalhes técnicos

- Reverse geocoding: `https://nominatim.openstreetmap.org/reverse?format=json&lat=..&lon=..&zoom=10&addressdetails=1` — extrair `address.city || address.town || address.village` e `address.state`. Sem API key, com `User-Agent` setado via header padrão do browser (chamada client-side).
- Lista de cidades vem do banco; nenhuma lista hardcoded.
- Nada quebra para usuários sem JS de geolocalização: a busca manual sempre funciona.
- Sem mudanças em rotas. Sem mudanças no fluxo Stripe/Auth.

### Arquivos criados/alterados

Criados: `src/hooks/useCity.tsx`, `src/components/site/CityBar.tsx`, `src/components/site/CitySelector.tsx`, migração SQL.

Editados: `src/App.tsx`, `src/pages/Index.tsx`, `src/pages/Ofertas.tsx`, `src/pages/OfferDetail.tsx`, `src/pages/LojaForm.tsx`, `src/components/site/HeroSearch.tsx`, `src/components/site/Header.tsx` (renderiza CityBar acima), `src/lib/offers-api.ts`.
