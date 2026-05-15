## Oferta Invisível — desconto que aparece quando o cliente chega perto

Nova modalidade de oferta exclusiva do plano **Plus**, espelhando a estrutura já usada nas Coletivas e Leilões. O lojista define um ponto, raio (m), janela horária (início/fim) e oferta. Quando o cliente está dentro do raio durante a janela ativa, vê o conteúdo e recebe push; fora do raio, vê apenas uma mensagem informativa.

### 1. Banco de dados (migração)

Nova tabela **`geo_offers`**:
- `store_id`, `title`, `description`, `image_url`, `category_slug`, `conditions`
- `original_price`, `promo_price`
- `center_lat`, `center_lng`, `radius_meters` (default 300)
- `time_start`, `time_end` (janela diária)
- `valid_from`, `valid_until` (datas)
- `status` (`pending | approved | expired | rejected`), `share_token`

Nova tabela **`geo_offer_visits`** (1 por usuário+oferta+dia, para anti-spam de push e prova social):
- `geo_offer_id`, `user_id` (nullable), `session_id`, `entered_at`, `notified_at`

Triggers/funções:
- `validate_geo_offer`: exige plano Plus (igual coletivas/leilões), `radius_meters` entre 50 e 5000, `time_end > time_start`, `promo_price < original_price`, limite de 1 ativa por loja (config em `app_settings.geo_offer_max_active_per_store`).
- RPC `geo_offer_state(p_token, p_lat, p_lng)` — pública. Retorna `{ found, offer (sem center_lat/lng/radius para não vazar), in_radius, distance_meters, in_window, store_name, store_whatsapp }`. Se `in_radius=false` ou fora da janela, não retorna preço/descrição completos — só título genérico, raio e instruções.
- RPC `geo_offer_register_visit(p_token, p_lat, p_lng, p_session_id)` — registra entrada se dentro do raio (1×/dia/usuário).

RLS: SELECT público apenas para `status in (approved)` mas via RPC (a leitura direta da tabela pelo public retorna apenas campos não-sensíveis ou só para o dono/admin); INSERT/UPDATE/DELETE para dono e admin.

Campo novo em `app_settings`: `geo_offer_max_active_per_store int default 1`.

### 2. Edge function `geo-offer-notify`

Cron a cada 5 min. Para cada `geo_offer` aprovada, dentro da janela horária e da validade, busca `push_subscriptions` de usuários que aceitaram notificações e envia push **apenas** quando uma posição recente do cliente (registrada via `geo_offer_register_visit`) coincide com o raio e ainda não foi notificada hoje. Marca `notified_at` em `geo_offer_visits`.

### 3. Frontend — Painel do lojista

- **`NewOfferDropdown.tsx`**: nova opção "Oferta Invisível" com badge **Plus** (disabled redirecionando a `/painel-lojista/assinatura`).
- Nova rota `/painel-lojista/oferta-invisivel/:id?` → **`OfertaInvisivelForm.tsx`**: campos básicos + mapa simples (Leaflet) para escolher centro e raio (slider 50–5000 m), pré-visualização do círculo, janela horária e validade. Botão "Usar endereço da loja" preenche `center_lat/lng` a partir de `stores`.
- **`PainelLojista.tsx`**: card "Sua oferta invisível ativa" análogo ao card de coletiva/leilão (editar, copiar link, WhatsApp, encerrar, excluir).

### 4. Frontend — Cliente

- Nova página pública **`/oferta-invisivel/:token`** → `OfertaInvisivelPublic.tsx`:
  - Pede `navigator.geolocation.getCurrentPosition` (com fallback de erro/permissão negada).
  - Chama `geo_offer_state(token, lat, lng)`.
  - Se `in_radius && in_window`: mostra a oferta completa + botão WhatsApp + registra visita.
  - Caso contrário: card informativo com mensagem clara ("Esta oferta só aparece quando você está a até X m da loja, entre HH:MM e HH:MM. Aproxime-se para liberar.") e mini mapa indicando direção.
- Nova página **`/ofertas-invisiveis`** (`OfertasInvisiveis.tsx`): exige login, lista ofertas invisíveis ativas das lojas seguidas + cidade. Cada card mostra apenas título, badge "Invisível", raio e janela horária — preço só dentro do raio.
- **`Header.tsx`**: novo item "Invisíveis" ao lado de Coletivas/Leilões.
- Toggle no perfil do cliente (em `notification_preferences`) para aceitar push de proximidade (campo novo `proximity_alerts boolean default true`).

### 5. Admin

- **`AdminGeoOffers.tsx`** análogo a `AdminLeiloes.tsx` (aprovar/rejeitar/excluir, ver mapa do raio).
- Nova aba em `Admin.tsx`.

### 6. Catálogo de planos

- `src/data/plans.ts`: adicionar feature "Oferta Invisível (geofencing)" no plano **Plus**.

### 7. Helpers

- `src/lib/geo-offer-api.ts`: `fetchGeoOfferState`, `registerVisit`, `fetchActiveGeoOfferForStore`, `fetchGeoOffersForUser`, helper `haversineMeters`.

### Regras de negócio
- Plano exigido: **Plus**.
- Limite ativo por loja: 1 (configurável).
- Raio: 50–5000 m (default 300).
- Visita só conta dentro do raio + janela.
- Push: 1 notificação por usuário/oferta/dia.
- Usuário sem login pode ver a página (com geolocation), mas só recebe push se logado e com `proximity_alerts=true`.

### Fora do escopo
- Geofencing nativo em background (depende de app nativo). Push só dispara quando o cliente abre alguma página do app/PWA — a coleta de localização é via PWA/browser ativo. Documentar isso na UI.
- Tracking contínuo da posição em background.
- Segmentação por categoria/perfil de cliente.

### Detalhes técnicos
- Mapa do lojista e do cliente: `leaflet` + `react-leaflet` (já leve, sem chave de API).
- Distância: Haversine no servidor (RPC) e no cliente (helper).
- Edge function reutiliza `_shared/web-push.ts` e padrão de `notify-store-followers`.
- Cron via `pg_cron`/`pg_net` para `geo-offer-notify` a cada 5 min.
