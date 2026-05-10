# PWA + Push Notifications (Web Push / VAPID)

Transformar o OfertasFly em PWA instalável com notificações push nativas. Três fluxos de envio: lojista → seguidores, sistema automático (eventos) e admin → broadcast.

> ⚠️ **Aviso importante:** PWA com Service Worker só funciona na versão **publicada** (ofertasfly.com.br / town-treats-list.lovable.app). No preview do editor o SW fica desativado para não cachear builds antigas. Push em iOS exige iOS 16.4+ **e** o app instalado na tela inicial.

---

## 1. PWA (instalação + offline básico)

- Adicionar `vite-plugin-pwa` com `registerType: "autoUpdate"` e `devOptions.enabled: false`.
- Manifest: nome "OfertasFly", `display: standalone`, `theme_color`, `background_color`, ícones 192/512 (gerar a partir do logo existente) + ícone maskable.
- Estratégia de cache: `NetworkFirst` para HTML, `CacheFirst` para imagens/fontes.
- `navigateFallbackDenylist: [/^\/~oauth/]`.
- Guard em `src/main.tsx`: não registrar SW em iframe nem em hosts `id-preview--*` / `lovableproject.com`; desregistrar SWs existentes nesses contextos.
- Página `/install` simples explicando "Adicionar à tela inicial" no iOS/Android e botão `beforeinstallprompt` no desktop/Android.
- Meta tags Apple touch icon + `apple-mobile-web-app-capable` no `index.html`.

## 2. Backend Push (Lovable Cloud)

### Tabelas novas
- `push_subscriptions` — `user_id`, `endpoint` (unique), `p256dh`, `auth`, `user_agent`, `created_at`. RLS: usuário gerencia as próprias.
- `store_followers` — `user_id`, `store_id`, `created_at`. Unique (user_id, store_id). RLS: usuário gerencia os próprios; lojista lê seguidores da sua loja (count).
- `notification_preferences` — `user_id`, `new_offers_followed_stores boolean`, `expiring_favorites boolean`, `city_new_offers boolean`, `marketing boolean`. RLS: usuário gerencia as próprias.
- `notifications_log` — `id`, `audience` (`store_followers`|`auto`|`broadcast`), `store_id?`, `sent_by`, `title`, `body`, `url`, `recipients_count`, `success_count`, `created_at`. RLS: admin total; lojista lê os da própria loja.
- (Opcional) `favorites` — `user_id`, `offer_id`. Necessário para "favorito expirando".

### Secrets
- `VAPID_PUBLIC_KEY` (também exposta como `VITE_VAPID_PUBLIC_KEY` para o frontend)
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (`mailto:contato@ofertasfly.com.br`)

### Edge Functions
1. `subscribe-push` — recebe a `PushSubscription` do navegador e grava em `push_subscriptions`.
2. `unsubscribe-push` — remove o endpoint.
3. `send-push` — função interna (chamada pelas outras), usa `npm:web-push`, lê chaves VAPID, envia em paralelo, remove endpoints com 410/404.
4. `notify-store-followers` — lojista autenticado dispara para seguidores da sua loja (valida ownership + plano). Body: `{ store_id, offer_id?, title, body }`.
5. `admin-broadcast` — admin envia para todos inscritos (valida `has_role admin`).
6. `cron-offer-notifications` — agendada via `pg_cron` (a cada 30 min):
   - notifica seguidores quando aparece nova oferta `approved` da loja (últimos 30 min, dedup via `notifications_log`);
   - notifica usuários cujos favoritos expiram em <24h.

### Cron
Ativar `pg_cron` + `pg_net` e agendar `cron-offer-notifications` a cada 30 min (via `supabase--insert`, com URL e anon key inline).

## 3. Frontend

- Hook `usePush()` — expõe `permission`, `subscribed`, `subscribe()`, `unsubscribe()`. Converte VAPID base64 → Uint8Array, chama `serviceWorker.ready` + `pushManager.subscribe`, posta para `subscribe-push`.
- `src/sw-push.ts` (custom SW combinado com Workbox via `injectManifest` ou estendendo o gerado): handlers `push` (mostra notificação com `title`, `body`, `icon`, `badge`, `data.url`) e `notificationclick` (abre/foca a URL).
- Página `/perfil/notificacoes` (rota protegida por login, qualquer role):
  - Botão "Ativar notificações" com estado e instruções por SO/navegador.
  - Toggles das `notification_preferences`.
  - Lista de lojas seguidas com botão "Deixar de seguir".
- Botão "Seguir loja" no `OfferDetail` / página da loja (só visível logado; se não logado → vai para `/auth`).
- Painel do lojista:
  - Card "Seguidores" com contagem.
  - Em `OfertaForm` (após aprovação) ou em ação dedicada: botão "Notificar seguidores agora" → chama `notify-store-followers`. Limitar a 1 envio por oferta (registrar no `notifications_log`).
- Painel admin: aba "Notificações" com formulário (título, corpo, URL) → `admin-broadcast` + histórico do `notifications_log`.

## 4. Ordem de implementação

1. PWA base (manifest + plugin + ícones + guard) — testar instalação.
2. Migration: tabelas + RLS + (pg_cron/pg_net).
3. Secrets VAPID (gerar par e pedir ao usuário via `add_secret`).
4. Edge functions `subscribe-push` / `unsubscribe-push` / `send-push`.
5. Hook `usePush` + página `/perfil/notificacoes` + Service Worker handler.
6. Seguir loja + `notify-store-followers` + botão no painel.
7. Admin broadcast + UI no `/admin`.
8. Cron job + `cron-offer-notifications`.
9. Testes em produção (publicar) em Android Chrome e iOS 16.4+ instalado.

## Detalhes técnicos

- `web-push` em Deno: `import webpush from "npm:web-push@3.6.7"`.
- VAPID keys geradas com `webpush.generateVAPIDKeys()` (rodar uma vez localmente e colar nos secrets).
- Limite de payload push: ~4KB. Manter `{title, body, url, icon}`.
- Endpoint expirado/inválido (statusCode 404/410) → `delete from push_subscriptions where endpoint = ...`.
- Dedup de envio: chave `notifications_log(audience, store_id, offer_id)` única para evitar duplo disparo do cron.
- iOS: notificação só funciona se o usuário **instalou** o PWA na tela inicial — incluir esse aviso na página `/perfil/notificacoes`.
