# Plano: OfertasFly Coletiva (compra coletiva com preço em escada)

Novo tipo de oferta onde o preço cai conforme mais pessoas entram, com timer configurável e link único compartilhável via WhatsApp. Sem pagamento na plataforma — o lojista mantém o controle total dos descontos. Recurso **exclusivo do plano Plus**, com **1 coletiva ativa por loja** (limite parametrizável no Admin). Inclui transformação do botão "Nova oferta" em dropdown.

## Decisões confirmadas

- **Timer:** padrão 12h, lojista define livremente (1–168h).
- **Participação:** somente clientes cadastrados/logados (gera métrica para o lojista).
- **Tier mínimo:** todos pagam o último tier alcançado (sem "falha" estilo Groupon).
- **Limite:** 1 coletiva ativa por loja, parametrizável em Admin → Configurações.
- **Plano:** disponível somente no **Plus**.

## 1. Botão "Nova oferta" → Dropdown

No painel do lojista (`PainelLojista.tsx`, linha ~128), trocar o botão único por `DropdownMenu` com:

- **Desconto / Cupom / Brinde** → `/painel-lojista/oferta`
- **Oferta Relâmpago** → `/painel-lojista/oferta?flash=1`
- **OfertasFly Coletiva** ✨ (somente Plus) → `/painel-lojista/coletiva`

Se a loja não está no Plus, o item aparece com badge "Plus" e leva a `/painel-lojista/assinatura`. Se já existe coletiva ativa, item desabilitado com tooltip "Você já tem uma coletiva ativa".

## 2. Plano Plus — novo benefício

Em `src/data/plans.ts`, adicionar à lista `features` do plano `plus`:

> "OfertasFly Coletiva — compra coletiva viral no WhatsApp"

Em `/anuncie` ganha automaticamente. Adicionar uma menção curta na seção de comparação se houver.

## 3. Modelo de dados

**Tabela `group_offers`:**
- `store_id`, `title`, `description`, `image_url`, `category_slug`, `conditions`
- `tiers` JSONB: `[{min_people: 1, price: 120}, {min_people: 3, price: 99}, {min_people: 5, price: 79}]`
- `original_price` (riscado)
- `duration_hours` (default 12, min 1, max 168)
- `starts_at`, `ends_at`
- `status` (pending/approved/rejected/expired)
- `share_token` (slug curto único)
- timestamps

**Tabela `group_offer_participants`:**
- `group_offer_id`, `user_id` (NOT NULL — exige login)
- `referrer_user_id` (nullable — quem convidou)
- `whatsapp_clicked_at`
- UNIQUE (group_offer_id, user_id) — uma vaga por pessoa

**Em `app_settings`:** novo campo `group_offer_max_active_per_store INT NOT NULL DEFAULT 1`.

**RLS:**
- `group_offers`: leitura pública das aprovadas + ativas; lojista CRUD nas suas; admin total.
- `group_offer_participants`: insert exige `auth.uid() = user_id`; leitura pelo dono da loja, pelo próprio participante e admin.
- Trigger `validate_group_offer`: tiers em ordem crescente de pessoas + preço estritamente decrescente; primeira faixa obrigatoriamente `min_people = 1`; respeita limite ativo do `app_settings` por loja; valida que loja é Plus (consultando `subscriptions`/`plans`).
- Trigger `set_group_offer_window`: ao aprovar, define `starts_at = now()` e `ends_at = starts_at + duration_hours`.

**RPC `group_offer_state(p_token text)`** → JSONB com: tier atual, próximo tier, faltam X pessoas, total de participantes, segundos restantes, lista de avatares (até 12).

## 4. Página pública — `/coletiva/:token`

Exige login; se anônimo, redireciona para `/auth?redirect=/coletiva/:token`. Captura `?ref=:user_id` da URL para `referrer_user_id`.

Layout:
- Hero: imagem, nome da loja, título
- **Card de preço dinâmico:**
  - Preço atual em destaque (ex: "R$ 99 cada")
  - Barra de progresso até o próximo tier ("Mais 2 e cai pra R$ 79!")
  - Contador "🔥 12 pessoas já entraram"
  - Timer regressivo grande
- Tabela de faixas com a ativa destacada
- Botão primário: **"Entrar e chamar amigos no WhatsApp"** — registra participação + abre `wa.me` com link `?ref={userId}` e mensagem do tier atual
- Botão secundário: "Copiar link"
- Avatares dos participantes (de `profiles`)

Realtime via `supabase.channel` em `group_offer_participants` filtrado por `group_offer_id`.

Após `ends_at`: card mostra "Encerrada — preço final: R$ X" com instrução de procurar a loja no WhatsApp.

## 5. Formulário do lojista — `/painel-lojista/coletiva/:id?`

Bloqueado se plano não é Plus → exibe paywall com link para upgrade.
Bloqueado se já existe coletiva ativa (e está criando) → mostra a existente.

Campos:
- Comuns (título, descrição, imagem, categoria, condições)
- **Editor de faixas** (`GroupOfferTierEditor`):
  - Linha 1 fixa: "1 pessoa = R$ ___"
  - "+ Adicionar faixa" para 3+, 5+, 10+...
  - Validação live: pessoas crescente, preço decrescente
  - Preview da escada
- **Duração** (input numérico, default 12h, hint "1–168h")
- Após salvar: link compartilhável + QR + botão "Compartilhar no WhatsApp"

## 6. Integração com o resto do site

- `OfferCard` ganha variante visual `kind="coletiva"` (badge "COLETIVA" + ícone pessoas + tier atual)
- Listagem em `/` e `StorePage` mistura coletivas ativas via `offers-api.ts` (consulta unificada)
- Painel do lojista: nova aba/seção "Coletiva" com participantes, tier alcançado, cliques WhatsApp, top referenciadores

## 7. Painel admin

- Nova aba **"Coletivas"** em `Admin.tsx` para moderar (aprovar/rejeitar) — mesmo fluxo das ofertas
- Em **Configurações**: campo "Máximo de coletivas ativas por loja" (default 1)

## 8. Edge function de expiração

`group-offer-expire` (cron a cada 15 min) marca `expired` ofertas com `ends_at < now()` e envia push ao lojista: "Sua coletiva fechou com X participantes no tier de R$ Y". Push aos participantes: "A coletiva da {Loja} fechou! Procure a loja no WhatsApp para garantir seu R$ X."

## Detalhes técnicos

**Arquivos novos:**
- `src/pages/ColetivaForm.tsx`
- `src/pages/ColetivaPublic.tsx`
- `src/components/site/NewOfferDropdown.tsx`
- `src/components/site/GroupOfferTierEditor.tsx`
- `src/components/site/GroupOfferProgress.tsx`
- `src/components/site/GroupOfferCard.tsx` (ou variante em `OfferCard`)
- `src/components/admin/AdminColetivas.tsx`
- `src/lib/group-offers-api.ts`
- `supabase/functions/group-offer-expire/index.ts`
- migration SQL

**Arquivos editados:**
- `src/data/plans.ts` — benefício no Plus
- `src/pages/PainelLojista.tsx` — substituir botão por dropdown + seção coletiva
- `src/App.tsx` — rotas `/coletiva/:token` e `/painel-lojista/coletiva/:id?`
- `src/pages/Admin.tsx` — aba Coletivas
- `src/components/admin/AdminSettings.tsx` — campo `group_offer_max_active_per_store`
- `src/components/site/OfferCard.tsx` — variante coletiva
- `src/lib/offers-api.ts` — incluir coletivas ativas nas listagens
- `supabase/config.toml` — registrar nova função

**Sem alteração de pagamento** — confirmação via WhatsApp do lojista, igual aos cupons atuais.
