# Oferta Relâmpago com contagem regressiva e push automático

Ofertas marcadas como "relâmpago" exibem cronômetro visível em todo o app, expiram automaticamente após X horas e disparam notificação push para os seguidores ao serem publicadas. O admin pode editar/sobrescrever a duração e tem acesso adicional para notificar todos os usuários do app.

## Comportamento

### Duração
- Configuração global em `app_settings`: `flash_default_hours` (padrão `2`).
- Editável apenas pelo admin (nova aba "Configurações" em `/admin`).
- Cada oferta relâmpago armazena `flash_duration_hours` próprio (default = valor global no momento da criação) e `flash_starts_at` (definido quando a oferta é aprovada/publicada).
- `flash_ends_at = flash_starts_at + flash_duration_hours`. Calculado em trigger no banco para manter consistência.

### Quem cria / edita
- **Lojista**: no formulário de oferta (`OfertaForm.tsx`) ganha toggle "Oferta relâmpago" + campo "Duração (h)" pré-preenchido com o padrão global. Não escolhe público.
- **Admin**: no painel `/admin` aba Ofertas, pode marcar/desmarcar relâmpago em qualquer oferta, alterar a duração e escolher o público (seguidores ou todos).

### Contagem regressiva visível
- Componente `<CountdownBadge endsAt={...} />` mostra `acaba em 1h 47m` (ou `2m 14s` quando <10min) em vermelho pulsante.
- Aparece em: card da oferta (`OfferCard`), página de detalhe (`OfferDetail`), carrossel de destaques, página de cidade.
- Quando `now >= flash_ends_at`, oferta deixa de ser exibida nas listagens (filtro nas queries) e o card mostra "Encerrada" caso ainda esteja em cache.

### Expiração automática
- Trigger SQL: ao inserir/atualizar para `is_flash = true` e `status = approved`, define `flash_starts_at` se nulo e calcula `flash_ends_at`.
- Cron `pg_cron` (a cada 5 min) chama edge function `flash-expire` que marca `status = 'paused'` em ofertas expiradas (`is_flash AND flash_ends_at < now() AND status = 'approved'`).
- Listagens públicas (`fetchOffers`) já filtram `is_flash = false OR flash_ends_at > now()`.

### Notificações push
- **Disparo automático ao publicar**: quando `is_flash = true` E `status` muda para `approved`, trigger SQL chama edge function `notify-flash-offer` via `pg_net`.
  - Payload inclui `offer_id`, `audience` (default `store_followers`).
- **Reenvio manual**:
  - Lojista: botão "Reenviar alerta para seguidores" no painel da loja (limitado a 1 reenvio adicional por oferta para evitar spam).
  - Admin: dois botões — "Notificar seguidores" e "Notificar todos os usuários do app" (broadcast). Sem limite, mas registrado em `notifications_log`.
- Mensagem padrão: título `⚡ Oferta relâmpago: {título}` / corpo `{loja} • Acaba em {Xh}. Aproveite!`.

## Arquivos afetados

**Banco** (`supabase--migration`)
- `app_settings` (singleton com `flash_default_hours int default 2`, RLS: read público, update admin).
- `offers`: novas colunas `is_flash boolean default false`, `flash_duration_hours int`, `flash_starts_at timestamptz`, `flash_ends_at timestamptz`, índice em `flash_ends_at`.
- Trigger `set_flash_window()` antes de insert/update.
- Trigger `notify_flash_published()` após update — chama edge via `pg_net` quando `is_flash = true` e status muda para `approved`.
- `notifications_log`: nova coluna `audience` já existe; usar valores `flash_followers`, `flash_broadcast`.
- Cron `pg_cron`: chamar `flash-expire` a cada 5 min.

**Edge Functions**
- `notify-flash-offer/index.ts` (verify_jwt = false; valida `x-internal-secret` ou usa SERVICE_ROLE call interna): envia push para seguidores; aceita parâmetro `audience` para broadcast (admin).
- `flash-expire/index.ts` (verify_jwt = false): pausa ofertas expiradas.

**Frontend**
- `src/lib/offers-api.ts`: tipos e queries incluem campos flash; filtra expiradas em listagens.
- `src/components/site/CountdownBadge.tsx` (novo): cronômetro com tick a cada 1s, fallback graceful.
- `src/components/site/OfferCard.tsx`: badge "⚡ RELÂMPAGO" + countdown sobreposto na imagem.
- `src/components/site/FeaturedCarousel.tsx`, `src/pages/OfferDetail.tsx`, `src/pages/CityOffers.tsx`: integrar badge.
- `src/pages/OfertaForm.tsx`: toggle "Oferta relâmpago" + input "Duração (h)" (1–72) com default global; carregar `app_settings` no mount; bloco de reenvio manual (após aprovação).
- `src/pages/Admin.tsx`:
  - aba Ofertas: coluna/toggle "Relâmpago" + input duração + botões "Notificar seguidores" e "Notificar todos".
  - nova aba "Configurações": campo `flash_default_hours`.
- `src/hooks/useFlashSettings.ts` (novo): lê `app_settings.flash_default_hours`.
- `index.css`: animação `pulse-flash` para badge.

## Detalhes técnicos relevantes

- O trigger `notify_flash_published` usará `pg_net.http_post` com header `x-internal-secret` (novo secret `INTERNAL_PUSH_SECRET`) lido pela função para autenticar a chamada interna sem JWT de usuário.
- Cron via `pg_cron` requer `pg_cron` + `pg_net` habilitados; SQL de agendamento será executado via tool `supabase--insert` (não migration) por conter URL/anon key.
- `CountdownBadge` desmonta o timer quando expira para evitar leaks; usa `useState` + `setInterval` 1s.
- Filtragem de expiradas no client é defensiva — fonte de verdade é o cron que muda status.
- Limite de 1 reenvio manual por lojista será verificado contando entradas em `notifications_log` com `audience = 'flash_followers'` e mesmo `offer_id`.

## Fora do escopo
- Notificação por email/SMS.
- Geofencing.
- Variantes A/B de copy.
- "Alerta de preço" vinculado a uma watchlist do consumidor (diferente de oferta relâmpago — pode virar feature separada).