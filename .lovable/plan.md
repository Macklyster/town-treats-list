# Renovação automática + Sugestões com IA

Duas funcionalidades complementares para o lojista publicar mais rápido e manter as ofertas sempre ativas, usando o Lovable AI Gateway (sem custo extra de API para o usuário).

## 1. Renovação automática de ofertas

Quando uma oferta vence (`valid_until` passou), ela some do site. Hoje o lojista precisa editar manualmente. Vamos adicionar uma opção de "renovar automaticamente" que estende a validade por mais N dias quando expira.

### O que muda
- **Schema**: novas colunas em `offers`:
  - `auto_renew boolean default false`
  - `auto_renew_days int default 7` (1-30)
  - `auto_renew_count int default 0` (limite de segurança, max 6 renovações seguidas)
  - `last_auto_renewed_at timestamptz`
- **Formulário de oferta** (`OfertaForm.tsx`): novo bloco com Switch "Renovar automaticamente ao vencer" + Input de dias.
- **Edge function agendada** `auto-renew-offers`:
  - Roda 1x por dia (cron pg_cron + pg_net)
  - Procura ofertas `status=approved`, `auto_renew=true`, `valid_until < hoje`, `auto_renew_count < 6`
  - Atualiza `valid_until = hoje + auto_renew_days`, incrementa contador, registra log
  - Quando atinge limite, envia uma notificação push pro dono da loja avisando que precisa revisar
- **Painel do lojista**: badge "Auto-renova" nas ofertas com a flag ativa, e aviso quando uma oferta atinge o limite.

## 2. Sugestões com IA no formulário de oferta

Botão "Sugerir com IA" no `OfertaForm` que preenche título, descrição e preço promocional baseado em:
- Categoria escolhida
- Imagem da oferta (se já enviada)
- Preço original informado
- **Ofertas de sucesso** da mesma categoria (top 10 por cliques no WhatsApp + popularidade nos últimos 60 dias)

### O que muda
- **Edge function** `suggest-offer` (`verify_jwt = true`):
  - Recebe `{ category_slug, original_price, image_url?, current_title? }`
  - Busca top ofertas aprovadas da mesma categoria com mais cliques (join `offer_events` + `offers`)
  - Monta prompt para `google/gemini-3-flash-preview` com tool calling estruturado retornando `{ title, description, suggested_promo_price, discount_pct, reasoning }`
  - Trata erros 429 e 402 (rate limit / créditos) com mensagens claras
- **Componente** `AISuggestButton` no `OfertaForm`:
  - Botão "✨ Sugerir com IA" no topo do formulário (desabilitado até ter categoria + preço original)
  - Mostra loading, e ao receber resposta abre um pequeno painel com as sugestões e botões "Aplicar título", "Aplicar descrição", "Aplicar preço" (ou "Aplicar tudo")
  - Não sobrescreve sem confirmação

## Detalhes técnicos

### Migration
```sql
alter table offers
  add column auto_renew boolean not null default false,
  add column auto_renew_days int not null default 7,
  add column auto_renew_count int not null default 0,
  add column last_auto_renewed_at timestamptz;
```

### Cron (via supabase--insert, contém anon key)
```sql
select cron.schedule(
  'auto-renew-offers-daily',
  '0 3 * * *',
  $$ select net.http_post(
       url:='https://ougpesguavrqbeethbjl.supabase.co/functions/v1/auto-renew-offers',
       headers:='{"Content-Type":"application/json","apikey":"<anon>"}'::jsonb,
       body:='{}'::jsonb) $$);
```

### Estrutura de arquivos
- `supabase/functions/auto-renew-offers/index.ts` (cron, sem JWT)
- `supabase/functions/suggest-offer/index.ts` (com JWT)
- `src/components/site/AISuggestButton.tsx` (novo)
- `src/pages/OfertaForm.tsx` (editado: bloco auto-renew + botão IA)
- `src/pages/PainelLojista.tsx` (editado: badge auto-renew)

### Fora do escopo
- Renovação ilimitada (limitamos a 6 ciclos para evitar ofertas zumbis)
- Sugestão de imagem (só texto + preço por enquanto)
- Geração de variantes A/B
