## Objetivo
Contabilizar cada clique no botão **"Pegar Oferta no WhatsApp"** da página de detalhe da oferta (`/oferta/:id`), para gerar métricas por oferta e por loja (visíveis no Painel do Lojista e no Admin).

## Mudanças

### 1. Banco de dados (migração)
Criar tabela `offer_events` para registrar cada interação:

- `id` uuid PK
- `offer_id` uuid (referência lógica a `offers.id`)
- `store_id` uuid (denormalizado p/ filtros rápidos)
- `event_type` text (ex.: `whatsapp_click`, `phone_click` — começamos só com whatsapp)
- `session_id` text (gerado no client, guardado em `localStorage`, para deduplicar)
- `user_agent` text (opcional)
- `referrer` text (opcional)
- `created_at` timestamptz default now()

Índices: `(offer_id, created_at)`, `(store_id, created_at)`, `(event_type)`.

**RLS:**
- `INSERT` público (anon + authenticated) com `WITH CHECK (true)` — qualquer visitante pode registrar evento.
- `SELECT` apenas para dono da loja (`stores.owner_id = auth.uid()`) ou admin (`has_role`).
- Sem `UPDATE`/`DELETE` (exceto admin).

Função RPC `increment_offer_event(p_offer_id uuid, p_event_type text, p_session_id text)` (SECURITY DEFINER) que:
- Resolve `store_id` a partir de `offers`.
- Insere uma linha em `offer_events`.
- Opcional: deduplica clique se já existir o mesmo `(offer_id, session_id, event_type)` nos últimos 30 min.

### 2. Frontend — registrar clique

**`src/lib/offer-events.ts`** (novo)
- `trackOfferEvent(offerId, eventType)` que chama `supabase.rpc('increment_offer_event', …)` com `session_id` persistido em `localStorage` (`of_sid`).
- Falha silenciosa (não bloqueia navegação para o WhatsApp).

**`src/pages/OfferDetail.tsx`**
- Adicionar `onClick` no botão do WhatsApp chamando `trackOfferEvent(offer.id, 'whatsapp_click')` antes do `window.open` natural do `<a target="_blank">`.
- (Opcional) também trackear `phone_click` no botão "Ligar para a Loja".

### 3. Métricas para o lojista

**`src/pages/PainelLojista.tsx`**
- Adicionar coluna/badge "Cliques no WhatsApp" em cada card de oferta, lendo `count` de `offer_events` agregado por `offer_id` (consulta única na carga do painel: `select offer_id, count(*) … group by offer_id where store_id = …`).
- Card de resumo no topo: total de cliques nos últimos 7 / 30 dias.

### 4. Métricas para o admin

**`src/pages/Admin.tsx`**
- Nova aba/seção "Engajamento" com:
  - Total de cliques (geral, 7d, 30d).
  - Top 10 ofertas por cliques.
  - Top 10 lojas por cliques.

## Pontos técnicos
- Sem dependências novas. Tudo via Supabase client + RPC.
- `session_id` no `localStorage` evita inflar contagem com refresh, sem precisar de auth.
- A RPC `SECURITY DEFINER` permite manter `INSERT` controlado e popular `store_id` de forma confiável.
- Eventos genéricos (`event_type`) permitem reaproveitar a mesma tabela depois para `view`, `phone_click`, `share`, etc., sem nova migração.
- Consultas agregadas usam índices em `(store_id, created_at)` / `(offer_id, created_at)` para performance.

## Fora do escopo (sugestões futuras)
- Gráfico temporal (linha) por oferta.
- Exportação CSV das métricas.
- Tracking de visualizações da página da oferta.
