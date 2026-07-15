# Módulo de Eventos

Aproveitando a tabela `public.events` já existente (com RLS), vamos evoluí-la para um módulo completo com CRUD no painel, listagem/detalhe públicos, moderação admin e notificações.

## 1. Backend (migração)

Estender a tabela `events`:
- `slug text unique`, `category_slug text`, `venue text`, `address text`, `latitude/longitude`, `price_info text`, `link_url text`, `cover_url text`, `gallery jsonb`
- `status event_status` enum (`pending | approved | rejected | expired`), default `pending`
- `featured boolean`, `view_count int`, `share_token text unique`
- `created_by uuid`, `updated_at`, trigger `set_updated_at`
- `app_settings.event_max_active_per_store int` (default 3)

Trigger `validate_event`:
- `ends_at > starts_at`, título 3–120 chars, descrição ≤ 2000
- Restrito a planos `destaque` ou `plus` (admin ignora), replicando o padrão de `validate_offer_schedule`
- Limita eventos ativos (`pending|approved`) por loja segundo `app_settings`

RLS (recriar):
- `SELECT` público apenas quando `status = 'approved'`; lojista vê os próprios; admin vê tudo
- `INSERT/UPDATE/DELETE` para dono da loja (status volta para `pending` em edição de campos-chave) e admin
- GRANTs para `anon` (leitura de aprovados), `authenticated`, `service_role`

RPCs:
- `event_public_list(city, state, kind, from, to, limit, offset)`
- `event_by_slug(slug)` incrementa `view_count`
- `approve_event(id)` / `reject_event(id, reason)` — admin only

## 2. Frontend — Lojista (Painel)

- Nova aba **Eventos** em `PainelLojista.tsx`
- `src/pages/EventoForm.tsx` — criar/editar com upload de capa (bucket `offer-images`), datas (shadcn datepicker), categoria, local, mapa embutido, preço, link
- Bloqueia acesso se plano da loja não for Destaque/Plus (mostra upsell reaproveitando `MerchantCTA`)
- Lista de eventos da loja com badges de status, ações duplicar/pausar/excluir

## 3. Frontend — Público

- `src/pages/Eventos.tsx` em `/eventos` — filtros por cidade (via `useCity`), categoria (chips reaproveitando `KIND_META` de `HappeningNow`), data (hoje / fim de semana / próximos 30 dias), busca
- Grid usando `SectionCard` + card novo `EventCard.tsx` no design system atual (aurora-glass, gradient, badges de tempo)
- `src/pages/EventoPublic.tsx` em `/evento/:slug` — hero com capa, countdown, info da loja (`StoreAvatar`), galeria, mapa, CTA WhatsApp/link, compartilhar (`ShareOfferButton` genérico), FlyScore da loja
- Reforçar seção `HappeningNow` na home puxando dos novos campos e linkando para `/evento/:slug` e `/eventos`
- Adicionar link "Eventos" no `HomeHeader` (menu principal e mobile)
- SEO: componente `<SEO>` com título/descrição por evento, JSON-LD `Event`

## 4. Admin

- Nova aba **Eventos** em `src/pages/Admin.tsx` (padrão dos outros módulos): fila de pendentes, aprovar/rejeitar com motivo, destacar, expirar
- Novo `src/components/admin/AdminEventos.tsx`

## 5. Notificações

- Edge function `notify-event-approved`: quando `status` passa a `approved`, dispara push para
  1. Seguidores da loja (reaproveita lógica de `notify-store-followers`)
  2. Usuários com cidade selecionada = cidade do evento (join `push_subscriptions` + `profiles`/preferências)
- Respeita `notification_preferences` (novo flag `events` default `true`)
- Trigger DB chama a função via `pg_net`/edge invoke pattern já usado no projeto (ou disparo pelo painel admin ao aprovar, como nos outros módulos)

## 6. Arquivos criados/editados

**Criar**
- `supabase/migrations/*_events_module.sql`
- `supabase/functions/notify-event-approved/index.ts`
- `src/lib/events-api.ts`
- `src/pages/Eventos.tsx`, `src/pages/EventoPublic.tsx`, `src/pages/EventoForm.tsx`
- `src/components/site/EventCard.tsx`
- `src/components/admin/AdminEventos.tsx`
- `src/components/painel/EventosLojista.tsx`

**Editar**
- `src/App.tsx` (rotas `/eventos`, `/evento/:slug`, `/painel/evento/:id?`)
- `src/pages/Admin.tsx`, `src/pages/PainelLojista.tsx`
- `src/components/home/HomeHeader.tsx` (link Eventos), `src/components/home/HappeningNow.tsx` (usar novos campos e linkar)
- `src/integrations/supabase/types.ts` (regenerado automaticamente)

## Detalhes técnicos

- Design tokens semânticos do `index.css` (aurora-glass, primary, muted) — sem cores hardcoded
- Framer-motion para transições dos cards (padrão do projeto)
- Zod validando forms client-side; trigger valida server-side
- `share_token` gerado com `gen_random_uuid()` para links compartilháveis
- Slug único gerado a partir do título + shortid
