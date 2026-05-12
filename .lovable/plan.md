## Geolocalização + "Perto de mim" + Mapa com pins

### O que será entregue

1. Cada loja passa a ter coordenadas (latitude/longitude) geocodificadas a partir do endereço.
2. Cliente pode permitir acesso à localização do navegador → ofertas ordenadas por distância real (km), mostrando "a 1,2 km de você" no card.
3. Nova opção "Perto de mim" no seletor de ordenação.
4. Novo mapa interativo (acima da grade de ofertas) com pin por loja; clique no pin abre mini-card com a oferta.

### Mudanças no banco

Tabela `stores`: adicionar `latitude double precision` e `longitude double precision` (nullable). Sem alteração de RLS (já é leitura pública para lojas aprovadas).

### Geocodificação automática

- Nova edge function `geocode-store` (sem JWT) chamada após salvar `LojaForm` quando houver `address/city/state` e ainda não houver coords (ou o endereço mudou). Usa Nominatim (OpenStreetMap, gratuito, sem chave) — `https://nominatim.openstreetmap.org/search` com `User-Agent: OfertasFly`. Atualiza `latitude/longitude` na própria função usando service role.
- Botão "Atualizar coordenadas" no `LojaForm` para re-geocodificar manualmente.

### Frontend

- `src/hooks/useUserLocation.ts` (novo): pede `navigator.geolocation`, guarda `{lat,lng}` em `localStorage`, expõe `request()`, `clear()`, `permission`.
- `src/lib/geo.ts` (novo): `haversineKm(a,b)` e `formatDistance(km)`.
- `src/lib/offers-api.ts`: tipo `UIOffer` ganha `lat?`, `lng?`, `distanceKm?`. `fetchOffers` traz `stores.latitude, stores.longitude` no select e calcula distância quando o caller passa `userLoc`.
- `src/components/site/OffersSection.tsx`:
  - Botão "📍 Perto de mim" no topo da aside; se concedido, adiciona opção `nearby` no seletor de ordenação e seleciona automaticamente.
  - Quando `userLoc` ativo, recalcula `distanceKm` e ordena ascendente; cards mostram a distância.
- `src/components/site/OfferCard.tsx`: badge discreta "a X km" quando `distanceKm` definido.
- `src/components/site/OffersMap.tsx` (novo): mapa com `react-leaflet` + OpenStreetMap (sem API key). Renderizado acima da grade quando há pelo menos uma loja com coords. Pins agrupam ofertas da mesma loja; popup mostra título da oferta com link. Marcador extra do usuário quando `userLoc` ativo. Altura ~360px, bordas arredondadas, herda tokens do design system.

### Detalhes técnicos

- Dependências novas: `leaflet`, `react-leaflet`, `@types/leaflet`.
- Importar CSS do leaflet em `src/main.tsx`.
- Ajuste do ícone padrão do leaflet (workaround dos PNGs) em `OffersMap.tsx`.
- Cache de geocoding: a função só chama Nominatim se `latitude IS NULL` ou se hash do endereço mudou (guardar em memória; sem coluna nova).
- Performance: filtragem/ordenação por distância continua client-side (já carregamos as ofertas da cidade).

### Fora de escopo

- Buscar ofertas de cidades vizinhas pelo raio (mantém filtro por cidade selecionada).
- Mapa de calor, clusters avançados, rotas/direções.
- Geocoding em lote retroativo (lojas existentes serão geocodificadas no próximo save ou via botão manual; opcionalmente posso rodar uma vez via edge function se você pedir).
