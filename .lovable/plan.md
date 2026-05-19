# Plano — Google Maps no LocationPicker (cadastro de loja)

## Objetivo

Substituir o mapa Leaflet **apenas** dentro de `src/components/site/LocationPicker.tsx` por Google Maps + Places Autocomplete, para o lojista poder:
- Digitar e ver sugestões de endereços/estabelecimentos reais do Google (inclusive a própria loja, se já estiver no Google Meu Negócio).
- Selecionar/arrastar o pino no mapa do Google.
- Usar "minha localização".

`OffersMap.tsx`, `OfferDetail.tsx` e todas as outras telas continuam **inalteradas**, em Leaflet/OSM, mantendo custo zero no tráfego público.

## Pré-requisito do usuário

Criar uma **Google Maps API key** no Google Cloud Console com:
- **Maps JavaScript API** ativada
- **Places API** ativada (para o Autocomplete)
- **Geocoding API** ativada (fallback para resolver endereço digitado caso o usuário pule o autocomplete)
- **Billing** ativado na conta (mesmo usando só a cota grátis)
- **Restrições da key:**
  - HTTP referrers: `https://ofertasfly.com.br/*`, `https://www.ofertasfly.com.br/*`, `https://*.lovable.app/*`, `http://localhost:*/*`
  - APIs permitidas: só as 3 acima

Como a key vai rodar no **frontend** (Google Maps JS exige isso), ela é publicável — mas precisa ficar restrita por domínio para não ser abusada. Vamos expô-la como `VITE_GOOGLE_MAPS_API_KEY`.

> Observação: variáveis `VITE_*` são embutidas no bundle do cliente. Isso é o padrão para Google Maps JS — a segurança vem das restrições de referrer na própria key, não de escondê-la.

## Mudanças no código

### 1. Dependências
- Adicionar `@vis.gl/react-google-maps` (wrapper oficial mantido pelo time do Google, mais leve e moderno que `@react-google-maps/api`).

### 2. `src/components/site/LocationPicker.tsx` (reescrita do componente)

Substituir o mapa Leaflet por:
- `<APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={["places"]}>`
- `<Map>` com `mapId` opcional, controle de zoom, gestureHandling="greedy", `defaultCenter` e `defaultZoom` baseados em `value` ou no centro do Brasil.
- `<AdvancedMarker draggable onDragEnd>` para o pino.
- `onClick` no `<Map>` para mover o pino.
- Campo de busca usando `useMapsLibrary("places")` + `PlaceAutocompleteElement` (novo elemento Web Component do Google, recomendado para 2025) ou fallback `Autocomplete` clássico se necessário. Ao escolher sugestão → `place.geometry.location` define o pino e recentraliza.
- Botão "Usar minha localização" mantido (navigator.geolocation).
- Mostra coordenadas selecionadas (igual hoje).
- Se `VITE_GOOGLE_MAPS_API_KEY` estiver ausente → renderiza um aviso `<Alert>` orientando configurar a key e **não quebra a página**.

Props mantidas iguais (`value`, `onChange`, `addressQuery`) para não impactar `LojaForm.tsx`.

### 3. `src/pages/LojaForm.tsx`
- Sem mudanças. A integração com o componente continua a mesma.

### 4. Outras telas
- `OffersMap.tsx`, `OfferDetail.tsx`, `main.tsx` (import do `leaflet/dist/leaflet.css`) → **intactos**. Leaflet permanece instalado.

## Detalhes técnicos

- **Sem edge function nova**: tudo client-side.
- **Sem migration**: já temos `stores.latitude`/`longitude`.
- **Tokens semânticos**: botões e labels continuam usando o design system existente.
- **Fallback Geocoding**: se o usuário digitar endereço no campo de busca e não escolher sugestão, podemos opcionalmente chamar `geocoder.geocode({address})` para centralizar.
- **Bundle**: `@vis.gl/react-google-maps` é ~20KB gzip; o SDK do Google é carregado dinamicamente só quando o LocationPicker monta (cadastro de loja), então não impacta as páginas públicas.

## Passos de execução (após aprovação)

1. Pedir a `VITE_GOOGLE_MAPS_API_KEY` (vou orientar passo a passo no Google Cloud Console e usar `add_secret`).
2. Instalar `@vis.gl/react-google-maps`.
3. Reescrever `LocationPicker.tsx`.
4. Testar no `/painel-lojista/loja`: busca, clique no mapa, drag do pino, "usar minha localização", coordenadas refletidas no form e salvas no banco.

## Fora do escopo

- Não trocar mapa público (OffersMap continua Leaflet/OSM).
- Não mexer em `geocode-store` (continua usando Nominatim como fallback quando o lojista não marca o ponto).
- Não adicionar Street View, rotas ou outras APIs pagas do Google.
