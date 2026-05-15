# Prova social em tempo real

Exibir contadores de visualizações e cliques em tempo real nas ofertas das lojas dos planos **Destaque** e **Plus**, criando gatilho de validação social para o cliente e demonstração de resultado para o lojista.

## Onde aparece

1. `**OfferCard**` (grade de ofertas) — badge discreto sobre a imagem ou no rodapé do card:
  - Ex.: "👁 47 viram hoje" e, quando aplicável, "🔥 12 vendo agora"
  - Só aparece se a contagem do dia for ≥ um mínimo (ex.: 5) para não exibir "1 pessoa viu" (anti-prova-social), criar campo na aba Configurações do Admin para parametrizações futuras.
2. `**OfferDetail**` (página da oferta) — bloco com mais detalhe abaixo do título:
  - "👁 **47** pessoas viram esta oferta hoje"
  - "💬 **8** clicaram para falar no WhatsApp hoje"
  - "🔥 **3** vendo agora" (somente quando ≥ 2 sessões ativas nos últimos 5 min)
3. `**PainelLojista**` (visão do lojista) — pequeno selo na linha da oferta mostrando o mesmo contador, reforçando o valor entregue pela plataforma.

## Regras de exibição

- **Apenas planos Destaque e Plus**: lojas Grátis/Básico não veem o widget no público nem no painel. (No painel mostramos um teaser "Disponível no Destaque" com link para `/painel-lojista/assinatura`.)
- **Janela "hoje"**: do início do dia local (`America/Sao_Paulo`) até agora.
- **"Vendo agora"**: sessões distintas (`session_id`) com evento `view` nos últimos 5 minutos.
- **Anti-ruído**: esconder números abaixo do mínimo configurável (default 5 para "viram hoje", 2 para "vendo agora") para evitar prova social fraca.
- **Privacidade**: nenhuma informação de usuário é exposta — só contagens agregadas.

## Tempo real

- Usar `supabase.channel().on('postgres_changes', { table: 'offer_events', filter: 'offer_id=eq.<id>' })` na página de detalhe para incrementar localmente.
- Habilitar realtime para `offer_events` na publicação `supabase_realtime`.
- Nos cards (lista), evitar 1 canal por card: refetch agregado a cada 60s via polling leve.

## Detalhes técnicos

### Banco (migração)

1. Adicionar `offer_events` à publicação realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.offer_events;` e `ALTER TABLE public.offer_events REPLICA IDENTITY FULL;`.
2. Nova função RPC `public.offer_social_proof(p_offer_ids uuid[])` (SECURITY DEFINER, STABLE):
  - Para cada `offer_id`, junta com `stores` → `subscriptions` + `plans` para validar plano `destaque`/`plus` ativo.
  - Retorna JSONB array `[{ offer_id, eligible, views_today, contacts_today, viewers_now }]`.
  - Ofertas não elegíveis retornam `eligible: false` e contadores zerados.
  - Aceita até N ids para uso no listing (com cap, ex.: 60).
3. Índice de apoio: `CREATE INDEX IF NOT EXISTS idx_offer_events_offer_created ON public.offer_events (offer_id, created_at DESC);`

### Frontend

- `src/lib/social-proof.ts`:
  - `fetchOfferSocialProof(ids: string[])` → `Map<id, SocialProof>` via RPC.
  - `subscribeOfferSocialProof(id, onChange)` → canal realtime que dispara recontagem leve (chama RPC só para esse id).
  - Constantes `MIN_VIEWS_TODAY = 5`, `MIN_VIEWERS_NOW = 2`.
- `src/components/site/SocialProofBadge.tsx`:
  - Variantes `compact` (card) e `detailed` (página).
  - Recebe `SocialProof` e renderiza condicionalmente conforme thresholds.
- Integração:
  - `OfferCard`: aceita prop opcional `socialProof?: SocialProof`. `OffersSection` (e demais listas) faz 1 chamada agregada e injeta nos cards. Polling 60s.
  - `OfferDetail`: chama o RPC ao montar, inscreve canal realtime e atualiza o badge `detailed`.
  - `PainelLojista`: na tabela de ofertas, badge compacto por linha (1 chamada agregada para todas as ofertas da loja).

### Catálogo de planos (`src/data/plans.ts`)

Adicionar à lista `features`:

- **Destaque**: `"Prova social em tempo real nos seus anúncios"`
- **Plus**: `"Prova social em tempo real nos seus anúncios"`

### Sem mudança de comportamento de tracking

- O `track_offer_event` RPC e `trackOfferEvent` continuam iguais — já gravam `view` e `whatsapp_click` por sessão (com dedupe de 30 min para `view`). Para "viram hoje" considera-se cada sessão única que tenha pelo menos 1 evento `view` no dia.

## Fora de escopo

- Sem A/B test do widget.
- Sem notificação push para o lojista quando contador cresce.
- Sem agregação histórica em tabela materializada — cálculo é direto sobre `offer_events` (eficiente com o índice).

## Pergunta antes de implementar

Os thresholds e a janela "vendo agora" estão razoáveis? Se preferir, posso (a) tornar configuráveis em `app_settings`, ou (b) começar com 5/2 fixos como acima.