## Objetivo

Permitir que o lojista selecione a localização exata da loja clicando/pressionando no mapa em `src/pages/LojaForm.tsx`, em vez de depender só da geocodificação por texto. Isso garante o ponteiro correto na página da loja e nas páginas de ofertas.

## Mudanças

### 1. Novo componente `src/components/site/LocationPicker.tsx`
- Mapa Leaflet (já usado em `OffersMap.tsx`) com marcador arrastável.
- Props: `value: {lat, lng} | null`, `onChange(lat, lng)`, `initialCenter` (cidade/UF ou Brasil).
- Comportamento:
  - Clique no mapa = move marcador e dispara `onChange`.
  - Marcador arrastável (drag) também atualiza coordenadas.
  - Botão "Usar minha localização" (reusa `navigator.geolocation`).
  - Botão "Buscar endereço digitado" — chama Nominatim direto (mesma fonte usada em `geocode-store`) para centralizar o mapa a partir do que o usuário digitou em endereço/cidade/UF, e o usuário ajusta o pino.
  - Campo somente leitura mostrando lat/lng selecionados.
- Altura ~320px, com instrução curta acima ("Toque no mapa para marcar o ponto exato da loja").

### 2. `src/pages/LojaForm.tsx`
- Adicionar `latitude` e `longitude` ao estado `form` e carregar de `data.latitude/longitude` no `useEffect`.
- Renderizar `<LocationPicker>` logo abaixo dos campos de Endereço/Cidade/UF.
- No `handleSubmit`:
  - Se `latitude`/`longitude` selecionados manualmente → enviar junto no `insert`/`update` e **pular** a chamada à edge function `geocode-store`.
  - Se não selecionados → manter o fallback atual (chama `geocode-store` em background).
- Mensagem de ajuda: "Selecionando o ponto no mapa, a localização exibida será exatamente essa — sem depender de busca por endereço."

### 3. Migration de banco
- Não é necessária: `stores.latitude` e `stores.longitude` já existem (usadas por `geocode-store` e `OffersMap`).

### 4. RLS / Edge functions
- Sem mudanças. O update das colunas `latitude`/`longitude` pelo dono da loja já é coberto pela policy de update existente em `stores` (usada pelo formulário atual para outros campos).

## Notas técnicas

- Reaproveitar imports do Leaflet usados em `OffersMap.tsx` (mesmos ícones e tile OSM, sem dependência nova).
- Tile OSM com `User-Agent` padrão do browser está OK (Leaflet já é usado em produção).
- Tokens semânticos do design system para botões/labels — sem cores hardcoded.

## Fora do escopo

- Não mexer em `OffersMap.tsx`, `geocode-store`, nem em `OfferDetail.tsx` (mapa já corrigido na última iteração).
- Não trocar provider de mapa (segue Leaflet/OSM, não Google).